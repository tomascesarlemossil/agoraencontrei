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
 */

import type { FastifyInstance } from 'fastify'
import { env } from '../../utils/env.js'
import type { AsaasWebhookEvent } from '../../services/asaas.service.js'
import { scheduleRepasse } from '../../services/repasse.service.js'

export default async function asaasWebhookRoutes(app: FastifyInstance) {
  // POST /api/v1/finance/webhook/asaas — Público (chamado pelo Asaas)
  app.post('/asaas', {
    config: { rateLimit: { max: 100, timeWindow: '1 minute' } },
    schema: { tags: ['finance-webhook'] },
  }, async (req, reply) => {
    // Validate webhook secret if configured
    const webhookToken = (req.headers['asaas-access-token'] as string) || ''
    if (env.ASAAS_WEBHOOK_SECRET && webhookToken !== env.ASAAS_WEBHOOK_SECRET) {
      app.log.warn('[asaas-webhook] Invalid webhook token')
      return reply.status(401).send({ error: 'UNAUTHORIZED' })
    }

    const body = req.body as AsaasWebhookEvent
    const { event, payment } = body

    if (!event || !payment?.id) {
      return reply.status(400).send({ error: 'INVALID_PAYLOAD' })
    }

    app.log.info(`[asaas-webhook] Event: ${event}, Payment: ${payment.id}, Status: ${payment.status}`)

    try {
      // Extract rentalId from externalReference (format: "rental:clxxxxxx")
      const externalRef = (payment as any).externalReference as string | undefined
      const rentalId = externalRef?.startsWith('rental:') ? externalRef.replace('rental:', '') : null

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

                await scheduleRepasse(app.prisma as any, {
                  tenantId: tenant?.id || undefined,
                  companyId: contract.companyId,
                  contractId: rental.contractId,
                  rentalId,
                  landlordId: contract.landlordId,
                  grossValue: payment.value,
                  commissionPercent: Number(contract.commission) || 10,
                  delayDays: tenant?.repasseDelayDays || 7,
                  fixedDay: tenant?.repasseFixedDay || undefined,
                }).catch((e: any) => {
                  app.log.warn(`[asaas-webhook] Repasse scheduling failed: ${e.message}`)
                })

                app.log.info(`[asaas-webhook] Repasse D+${tenant?.repasseDelayDays || 7} scheduled for rental ${rentalId} (R$ ${payment.value})`)
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

      return reply.send({ success: true, event, paymentId: payment.id })
    } catch (error: any) {
      app.log.error(`[asaas-webhook] Error processing event ${event}:`, error.message)
      // Return 200 to prevent Asaas from retrying (log the error)
      return reply.send({ success: false, error: error.message })
    }
  })
}
