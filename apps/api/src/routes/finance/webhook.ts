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
import { env } from '../../utils/env.js'
import type { AsaasWebhookEvent } from '../../services/asaas.service.js'
import { scheduleRepasse } from '../../services/repasse.service.js'
import { safeStringEqual } from '../../utils/crypto-safe.js'

export default async function asaasWebhookRoutes(app: FastifyInstance) {
  // POST /api/v1/finance/webhook/asaas — Público (chamado pelo Asaas)
  app.post('/asaas', {
    config: { rateLimit: { max: 100, timeWindow: '1 minute' } },
    schema: { tags: ['finance-webhook'] },
  }, async (req, reply) => {
    // Validate webhook secret if configured — timing-safe comparison so an
    // attacker cannot learn the token byte-by-byte via response latency.
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

    // Declarado fora do try/catch principal para que o catch externo consiga
    // marcar o registro como erro quando o processamento falhar.
    let eventRecordId: string | null = null

    try {
      // Idempotency guard — uses DB UNIQUE constraint on eventKey to handle
      // concurrent re-deliveries atomically (no race window between check and insert).
      const eventKey = `asaas:${event}:${payment.id}`
      try {
        await (app.prisma as any).webhookProcessedEvent.create({
          data: {
            eventKey,
            provider: 'asaas',
            eventType: event,
            externalId: payment.id,
            payload: { event, paymentId: payment.id, status: payment.status },
          },
        })
      } catch (uniqueErr: any) {
        // P2002 = Prisma unique constraint violation → duplicate delivery
        if (uniqueErr?.code === 'P2002') {
          app.log.info(`[asaas-webhook] Duplicate event skipped: ${eventKey}`)
          return reply.send({ success: true, skipped: true })
        }
        throw uniqueErr
      }

      // Extract rentalId from externalReference (format: "rental:clxxxxxx")
      const externalRef = (payment as any).externalReference as string | undefined
      const rentalId = externalRef?.startsWith('rental:') ? externalRef.replace('rental:', '') : null

      // ─── Idempotency gate ───────────────────────────────────────────────────
      // Asaas pode reentregar eventos em caso de timeout / retry.
      // Primeiro tentamos inserir um registro na tabela de dedup com UNIQUE
      // em dedupKey. Se falhar (P2002), é duplicata — pulamos com 200 OK.
      const eventTimestamp =
        (payment as any).confirmedDate ||
        (payment as any).clientPaymentDate ||
        body.dateCreated ||
        ''
      const dedupKey = body.id
        ? `asaas:${body.id}`
        : `asaas:${event}:${payment.id}:${payment.status ?? 'unknown'}:${eventTimestamp}`

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
        // P2002 unique constraint violation = duplicate webhook, já processamos
        if (err?.code === 'P2002') {
          app.log.info(`[asaas-webhook] Duplicate event ignored: ${dedupKey}`)
          return reply.send({ success: true, duplicate: true, event, paymentId: payment.id })
        }
        // Tabela pode não existir ainda em alguns ambientes — continua sem dedup
        app.log.warn(`[asaas-webhook] Dedup record creation failed (continuing): ${err?.message ?? err}`)
      }

      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED': {
          // 1. Atualiza o rental para PAID
          if (rentalId) {
            await app.prisma.rental.update({
              where: { id: rentalId },
              data: {
                status: 'PAID',
                paymentDate: payment.confirmedDate ? new Date(payment.confirmedDate) : new Date(),
                paidAmount: payment.value ? { set: payment.value } : undefined,
                paymentMethod: payment.billingType || 'UNDEFINED',
              },
            }).catch((e: any) => app.log.warn(`[asaas-webhook] Rental update failed: ${e.message}`))

            // 2. Log the payment
            const rental = await app.prisma.rental.findUnique({
              where: { id: rentalId },
              include: { contract: { select: { companyId: true, tenantName: true, propertyAddress: true, landlordName: true, landlordId: true, commission: true } } },
            })

            if (rental?.contract) {
              await app.prisma.auditLog.create({
                data: {
                  companyId: rental.contract.companyId,
                  action: 'rental.pay',
                  resource: 'rental',
                  resourceId: rentalId,
                  payload: {
                    asaasId: payment.id,
                    value: payment.value,
                    netValue: payment.netValue,
                    billingType: payment.billingType,
                    tenantName: rental.contract.tenantName,
                    propertyAddress: rental.contract.propertyAddress,
                    source: 'asaas_webhook',
                  },
                },
              }).catch(() => {})

              // 3. Schedule D+7 repasse to landlord
              const contract = rental.contract as any
              if (contract.landlordId && payment.value) {
                // Check if this company has a tenant (SaaS clone) for commission split
                const tenant = await (app.prisma as any).tenant?.findFirst?.({
                  where: { companyId: contract.companyId, isActive: true },
                  select: { id: true, splitPercent: true, repasseDelayDays: true, repasseFixedDay: true },
                }).catch(() => null)

                // `??` (not `||`) so commission=0 and delay=0 survive — `||`
                // would silently replace a zero with the default 10% / 7 days.
                const commissionRaw = contract.commission != null ? Number(contract.commission) : null
                const commissionPercent = (commissionRaw != null && Number.isFinite(commissionRaw))
                  ? commissionRaw
                  : 10
                const delayDays = tenant?.repasseDelayDays ?? 7

                await scheduleRepasse(app.prisma as any, {
                  tenantId: tenant?.id || undefined,
                  companyId: contract.companyId,
                  contractId: rental.contractId,
                  rentalId,
                  landlordId: contract.landlordId,
                  grossValue: payment.value,
                  commissionPercent,
                  delayDays,
                  fixedDay: tenant?.repasseFixedDay || undefined,
                })

                app.log.info(`[asaas-webhook] Repasse D+${delayDays} scheduled for rental ${rentalId} (R$ ${payment.value})`)
              }

              app.log.info(`[asaas-webhook] Rental ${rentalId} marked as PAID (${payment.billingType}, R$ ${payment.value})`)
            }
          }
          break
        }

        case 'PAYMENT_OVERDUE': {
          if (rentalId) {
            await app.prisma.rental.update({
              where: { id: rentalId },
              data: { status: 'LATE' },
            }).catch((e: any) => app.log.warn(`[asaas-webhook] Rental overdue update failed: ${e.message}`))

            app.log.info(`[asaas-webhook] Rental ${rentalId} marked as LATE`)
          }
          break
        }

        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED': {
          if (rentalId) {
            await app.prisma.rental.update({
              where: { id: rentalId },
              data: {
                status: 'PENDING',
                paymentDate: null,
                paidAmount: null,
                reversedAt: new Date(),
                reversalReason: event === 'PAYMENT_REFUNDED' ? 'Estorno via Asaas' : 'Cancelamento via Asaas',
              },
            }).catch((e: any) => app.log.warn(`[asaas-webhook] Rental reversal update failed: ${e.message}`))

            app.log.info(`[asaas-webhook] Rental ${rentalId} reversed (${event})`)
          }
          break
        }

        default:
          app.log.info(`[asaas-webhook] Unhandled event: ${event}`)
      }

      // Marca o evento de dedup como processado com sucesso
      if (eventRecordId) {
        await (app.prisma as any).asaasWebhookEvent
          .update({
            where: { id: eventRecordId },
            data: { processedAt: new Date(), result: 'ok' },
          })
          .catch((err: any) =>
            app.log.warn(`[asaas-webhook] Failed to mark event ${eventRecordId} as processed: ${err?.message ?? err}`),
          )
      }
      return reply.send({ success: true, event, paymentId: payment.id })
    } catch (error: any) {
      app.log.error(`[asaas-webhook] Error processing event ${event}:`, error.message)
      // Marca dedup record como erro para auditoria — útil para replay manual
      if (eventRecordId) {
        await (app.prisma as any).asaasWebhookEvent
          .update({
            where: { id: eventRecordId },
            data: { processedAt: new Date(), result: 'error', errorMessage: error?.message ?? String(error) },
          })
          .catch(() => {})
      }
      // Clear the hard-dedup record so Asaas's retry can re-enter and
      // reprocess the event; otherwise the first idempotency guard would
      // short-circuit every retry and the payment would never settle.
      const eventKey = `asaas:${event}:${payment.id}`
      await (app.prisma as any).webhookProcessedEvent
        .delete({ where: { eventKey } })
        .catch(() => {})
      // Return 5xx so Asaas retries — financial events must not be dropped.
      return reply.status(500).send({ success: false, error: 'PROCESSING_FAILED' })
    }
  })
}
