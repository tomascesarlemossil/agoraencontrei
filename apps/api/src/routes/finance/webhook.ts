/**
 * Asaas Webhook Handler — Recebe notificações de pagamento em tempo real
 *
 * Eventos suportados:
 * - PAYMENT_RECEIVED: Pagamento confirmado → baixa automática
 * - PAYMENT_OVERDUE: Pagamento em atraso → atualiza status
 * - PAYMENT_DELETED: Pagamento cancelado
 * - PAYMENT_REFUNDED: Pagamento estornado
 *
 * Segurança: Valida assinatura do webhook via ASAAS_WEBHOOK_SECRET
 * Idempotência: Verifica AuditLog antes de processar para evitar double-credit
 */

import type { FastifyInstance } from 'fastify'
import { timingSafeEqual } from 'node:crypto'
import { env } from '../../utils/env.js'
import type { AsaasWebhookEvent } from '../../services/asaas.service.js'
import { scheduleRepasse } from '../../services/repasse.service.js'

/** Constant-time comparison of two strings — returns false on length mismatch
 *  without leaking length via short-circuit. */
function safeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) {
    // Still do a constant-time op to keep timing roughly stable
    timingSafeEqual(aBuf, aBuf)
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}

export default async function asaasWebhookRoutes(app: FastifyInstance) {
  // POST /api/v1/finance/webhook/asaas — Público (chamado pelo Asaas)
  app.post('/asaas', {
    config: { rateLimit: { max: 100, timeWindow: '1 minute' } },
    schema: { tags: ['finance-webhook'] },
  }, async (req, reply) => {
    // Validate webhook secret if configured (constant-time to defeat token oracle)
    const webhookToken = (req.headers['asaas-access-token'] as string) || ''
    if (env.ASAAS_WEBHOOK_SECRET && !safeStringEqual(webhookToken, env.ASAAS_WEBHOOK_SECRET)) {
      app.log.warn('[asaas-webhook] Invalid webhook token')
      return reply.status(401).send({ error: 'UNAUTHORIZED' })
    }

    const body = req.body as AsaasWebhookEvent & { id?: string; dateCreated?: string }
    const { event, payment } = body

    if (!event || !payment?.id) {
      return reply.status(400).send({ error: 'INVALID_PAYLOAD' })
    }

    app.log.info(`[asaas-webhook] Event: ${event}, Payment: ${payment.id}, Status: ${payment.status}`)

    // ─────────────────────────────────────────────────────────────────────
    // Ordem de operações:
    //   1. asaasWebhookEvent (rastro/audit trail, UNIQUE dedupKey). Se já
    //      existe → 200 OK duplicate (fast-path).
    //   2. $transaction:
    //      2a. webhookProcessedEvent (UNIQUE eventKey) — gate primário; se
    //          P2002 duplicado, a tx é revertida e retornamos skipped.
    //      2b. rental.update (PAID/LATE/PENDING) + auditLog.create +
    //          scheduleRepasse (ScheduledRepasse + SaasCommissionLog).
    //   3. Em caso de falha intermediária, a tx reverte TUDO e retornamos
    //      500 para o Asaas retentar — é seguro reprocessar porque o
    //      webhookProcessedEvent também foi revertido.
    // ─────────────────────────────────────────────────────────────────────
    let eventRecordId: string | null = null
    const externalRef = (payment as any).externalReference as string | undefined
    const rentalId = externalRef?.startsWith('rental:') ? externalRef.replace('rental:', '') : null
    const eventKey = `asaas:${event}:${payment.id}`
    const eventTimestamp =
      (payment as any).confirmedDate ||
      (payment as any).clientPaymentDate ||
      body.dateCreated ||
      ''
    const dedupKey = body.id
      ? `asaas:${body.id}`
      : `asaas:${event}:${payment.id}:${payment.status ?? 'unknown'}:${eventTimestamp}`

    // 1. Audit trail fora da tx (best-effort)
    try {
      const record = await (app.prisma as any).asaasWebhookEvent.create({
        data: {
          dedupKey,
          event,
          paymentId: payment.id,
          rentalId,
          status: payment.status ?? null,
          payload: body as any,
        },
        select: { id: true },
      })
      eventRecordId = record.id
    } catch (err: any) {
      if (err?.code === 'P2002') {
        app.log.info(`[asaas-webhook] Duplicate event (asaasWebhookEvent): ${dedupKey}`)
        return reply.send({ success: true, duplicate: true, event, paymentId: payment.id })
      }
      app.log.warn(`[asaas-webhook] Dedup record creation failed (continuing): ${err?.message ?? err}`)
    }

    try {
      let duplicateSkipped = false

      // 2. Transação atômica cobrindo side-effects financeiros
      await app.prisma.$transaction(async (tx) => {
        // 2a. Gate de idempotência primário — UNIQUE eventKey atômico.
        //     Se duplicado (P2002), levantamos um erro marcador para que
        //     o .catch() fora da tx reconheça como duplicata (não falha).
        try {
          await (tx as any).webhookProcessedEvent.create({
            data: {
              eventKey,
              provider: 'asaas',
              eventType: event,
              externalId: payment.id,
              payload: { event, paymentId: payment.id, status: payment.status },
            },
          })
        } catch (uniqueErr: any) {
          if (uniqueErr?.code === 'P2002') {
            throw Object.assign(new Error('__DUPLICATE__'), { __duplicate: true })
          }
          throw uniqueErr
        }

        // 2b. Side-effects específicos por tipo de evento
        switch (event) {
          case 'PAYMENT_RECEIVED':
          case 'PAYMENT_CONFIRMED': {
            if (!rentalId) {
              app.log.info(`[asaas-webhook] ${event} sem rentalId — nada a atualizar`)
              return
            }

            await tx.rental.update({
              where: { id: rentalId },
              data: {
                status: 'PAID',
                paymentDate: payment.confirmedDate ? new Date(payment.confirmedDate) : new Date(),
                paidAmount: payment.value ? { set: payment.value } : undefined,
                paymentMethod: payment.billingType || 'UNDEFINED',
              },
            })

            const rental = await tx.rental.findUnique({
              where: { id: rentalId },
              include: {
                contract: {
                  select: {
                    companyId: true,
                    tenantName: true,
                    propertyAddress: true,
                    landlordName: true,
                    landlordId: true,
                    commission: true,
                  },
                },
              },
            })

            if (!rental?.contract) {
              app.log.warn(`[asaas-webhook] Rental ${rentalId} sem contrato — sem audit/repasse`)
              return
            }
            const contract = rental.contract as any

            // Audit log OBRIGATÓRIO — sem silent catch. Qualquer falha reverte a tx.
            await tx.auditLog.create({
              data: {
                companyId: contract.companyId,
                action: 'rental.pay',
                resource: 'rental',
                resourceId: rentalId,
                payload: {
                  asaasId: payment.id,
                  value: payment.value,
                  netValue: payment.netValue,
                  billingType: payment.billingType,
                  tenantName: contract.tenantName,
                  propertyAddress: contract.propertyAddress,
                  source: 'asaas_webhook',
                },
              },
            })

            // Outbox: ScheduledRepasse (+ SaasCommissionLog via service).
            // processDueRepasses drena a fila periodicamente
            // (wired em scheduled.jobs.ts).
            if (contract.landlordId && payment.value) {
              // Ordem determinística por createdAt evita selecionar tenant
              // arbitrário quando a company tem múltiplos tenants ativos
              // (cenário raro, mas possível em SaaS multi-filial).
              const tenant = await (tx as any).tenant.findFirst({
                where: { companyId: contract.companyId, isActive: true },
                orderBy: { createdAt: 'asc' },
                select: { id: true, splitPercent: true, repasseDelayDays: true, repasseFixedDay: true },
              })

              await scheduleRepasse(tx as any, {
                tenantId: tenant?.id || undefined,
                companyId: contract.companyId,
                contractId: rental.contractId || undefined,
                rentalId,
                landlordId: contract.landlordId,
                grossValue: Number(payment.value),
                // ?? preserva 0% de comissão (|| colapsaria para o default 10)
                commissionPercent: contract.commission != null ? Number(contract.commission) : 10,
                delayDays: tenant?.repasseDelayDays ?? 7,
                fixedDay: tenant?.repasseFixedDay ?? undefined,
              })

              app.log.info(
                `[asaas-webhook] Repasse D+${tenant?.repasseDelayDays ?? 7} agendado para rental ${rentalId} (R$ ${payment.value})`,
              )
            }

            app.log.info(`[asaas-webhook] Rental ${rentalId} marcado como PAID (${payment.billingType}, R$ ${payment.value})`)
            break
          }

          case 'PAYMENT_OVERDUE': {
            if (!rentalId) break
            await tx.rental.update({
              where: { id: rentalId },
              data: { status: 'LATE' },
            })
            app.log.info(`[asaas-webhook] Rental ${rentalId} marcado como LATE`)
            break
          }

          case 'PAYMENT_DELETED':
          case 'PAYMENT_REFUNDED': {
            if (!rentalId) break
            await tx.rental.update({
              where: { id: rentalId },
              data: {
                status: 'PENDING',
                paymentDate: null,
                paidAmount: null,
                reversedAt: new Date(),
                reversalReason: event === 'PAYMENT_REFUNDED' ? 'Estorno via Asaas' : 'Cancelamento via Asaas',
              },
            })
            app.log.info(`[asaas-webhook] Rental ${rentalId} revertido (${event})`)
            break
          }

          default:
            app.log.info(`[asaas-webhook] Evento não tratado: ${event}`)
        }
      }, {
        timeout: 20_000,
        maxWait: 5_000,
      }).catch((err: any) => {
        if (err?.__duplicate) {
          duplicateSkipped = true
          return
        }
        throw err
      })

      if (duplicateSkipped) {
        app.log.info(`[asaas-webhook] Duplicate event skipped (tx rollback): ${eventKey}`)
        if (eventRecordId) {
          await (app.prisma as any).asaasWebhookEvent
            .update({ where: { id: eventRecordId }, data: { processedAt: new Date(), result: 'duplicate' } })
            .catch(() => {})
        }
        return reply.send({ success: true, skipped: true, reason: 'duplicate', event, paymentId: payment.id })
      }

      if (eventRecordId) {
        await (app.prisma as any).asaasWebhookEvent
          .update({
            where: { id: eventRecordId },
            data: { processedAt: new Date(), result: 'ok' },
          })
          .catch((err: any) =>
            app.log.warn(`[asaas-webhook] Falha ao marcar evento ${eventRecordId} como processado: ${err?.message ?? err}`),
          )
      }
      return reply.send({ success: true, event, paymentId: payment.id })
    } catch (error: any) {
      app.log.error(`[asaas-webhook] Erro processando evento ${event}: ${error?.message ?? error}`)
      if (eventRecordId) {
        await (app.prisma as any).asaasWebhookEvent
          .update({
            where: { id: eventRecordId },
            data: { processedAt: new Date(), result: 'error', errorMessage: error?.message ?? String(error) },
          })
          .catch(() => {})
      }
      // 500 → Asaas retenta. O rollback da tx garante que nada foi
      // persistido parcialmente, então replay é seguro.
      return reply.status(500).send({ success: false, error: error?.message ?? String(error) })
    }
  })
}
