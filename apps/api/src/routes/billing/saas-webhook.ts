/**
 * SaaS Webhook Handler — Asaas payment events for tenant activation & module unlock
 *
 * POST /api/v1/webhooks/asaas — Public (called by Asaas)
 *
 * Handles:
 * - PAYMENT_CONFIRMED: Activate tenant or unlock module
 * - PAYMENT_OVERDUE: Suspend tenant or mark module overdue
 * - PAYMENT_DELETED/REFUNDED: Cancel activation
 *
 * ExternalReference format:
 * - "tenant:subdomain" → Plan subscription
 * - "module:tenantId:moduleSlug" → Module purchase
 *
 * Security: Validates asaas-access-token header against ASAAS_WEBHOOK_SECRET
 * Idempotency: Checks existing status before updating to prevent double-processing
 */

import type { FastifyInstance } from 'fastify'
import { timingSafeEqual } from 'node:crypto'
import { env } from '../../utils/env.js'
import type { AsaasWebhookEvent } from '../../services/asaas.service.js'

/** Constant-time string comparison — defeats timing-oracle attacks. */
function safeStringEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) {
    timingSafeEqual(aBuf, aBuf)
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}

export default async function saasWebhookRoutes(app: FastifyInstance) {
  const prisma = app.prisma as any

  app.post('/asaas', {
    config: { rateLimit: { max: 200, timeWindow: '1 minute' } },
    schema: {
      tags: ['saas-webhook'],
      summary: 'Asaas webhook for SaaS billing',
      body: {
        type: 'object',
        properties: {
          event: { type: 'string', maxLength: 100 },
          payment: { type: 'object' },
        },
        required: ['event', 'payment'],
        additionalProperties: true,
      },
    },
    bodyLimit: 65536, // 64KB max payload
  }, async (req, reply) => {
    // 1. Validate webhook secret
    const webhookToken = (req.headers['asaas-access-token'] as string) || ''
    if (env.ASAAS_WEBHOOK_SECRET && !safeStringEqual(webhookToken, env.ASAAS_WEBHOOK_SECRET)) {
      app.log.warn('[saas-webhook] Invalid webhook token')

      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.webhook.unauthorized' as any,
          resource: 'webhook',
          resourceId: 'asaas',
          payload: { ip: req.ip, tokenProvided: !!webhookToken } as any,
        },
      }).catch(() => {})

      return reply.status(401).send({ error: 'UNAUTHORIZED' })
    }

    const body = req.body as AsaasWebhookEvent
    const { event, payment } = body

    if (!event || !payment?.id) {
      return reply.status(400).send({ error: 'INVALID_PAYLOAD' })
    }

    const externalRef = (payment as any).externalReference as string | undefined
    app.log.info(`[saas-webhook] Event: ${event}, Payment: ${payment.id}, Ref: ${externalRef}`)

    // 2. Route to correct handler based on externalReference
    try {
      if (externalRef?.startsWith('tenant:')) {
        await handleTenantEvent(app, prisma, event, payment, externalRef)
      } else if (externalRef?.startsWith('module:')) {
        await handleModuleEvent(app, prisma, event, payment, externalRef)
      } else {
        // Not a SaaS event — pass through (might be handled by finance webhook)
        app.log.info(`[saas-webhook] Unrecognized ref: ${externalRef}, skipping`)
      }

      return reply.send({ success: true })
    } catch (err: any) {
      app.log.error(`[saas-webhook] Error processing ${event}: ${err.message}`)

      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.webhook.error' as any,
          resource: 'webhook',
          resourceId: payment.id,
          payload: { event, error: err.message, externalRef } as any,
        },
      }).catch(() => {})

      // Erros de negócio não-transientes (tenant não encontrado, ref inválida)
      // são no-ops silenciosos dentro dos handlers (apenas log.warn + return).
      // Se chegou aqui, é falha inesperada — 500 → Asaas retenta com
      // backoff. Os handlers já têm idempotência (checa planStatus==='ACTIVE'
      // antes de reativar), então replay é seguro.
      return reply.status(500).send({ success: false, error: err.message })
    }
  })
}

// ─── Tenant Subscription Events ──────────────────────────────────────────────

async function handleTenantEvent(
  app: any,
  prisma: any,
  event: string,
  payment: any,
  externalRef: string,
) {
  const subdomain = externalRef.replace('tenant:', '')

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  })

  if (!tenant) {
    app.log.warn(`[saas-webhook] Tenant not found for subdomain: ${subdomain}`)
    return
  }

  switch (event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED': {
      // Idempotency: don't re-activate already active tenant
      if (tenant.planStatus === 'ACTIVE' && tenant.activatedAt) {
        app.log.info(`[saas-webhook] Tenant ${subdomain} already active, skipping`)
        return
      }

      // Activate tenant
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          planStatus: 'ACTIVE',
          isActive: true,
          activatedAt: new Date(),
          suspendedAt: null,
          settings: {
            ...(tenant.settings as any || {}),
            lastPaymentId: payment.id,
            lastPaymentDate: new Date().toISOString(),
          },
        },
      })

      app.log.info(`[saas-webhook] Tenant ${subdomain} ACTIVATED (plan: ${tenant.plan})`)

      // Audit log
      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.tenant.activated' as any,
          resource: 'tenant',
          resourceId: tenant.id,
          payload: {
            subdomain,
            plan: tenant.plan,
            paymentId: payment.id,
            value: payment.value,
            event,
          } as any,
        },
      }).catch(() => {})

      // ── Sales Funnel: mark as converted ─────────────────────────────────
      try {
        const { convertFunnelEntry } = await import('../../services/sales-funnel.service.js')
        const customerEmail = (tenant.settings as any)?.customerEmail
        const customerPhone = (tenant.settings as any)?.customerPhone
        await convertFunnelEntry(prisma, {
          phone: customerPhone,
          email: customerEmail,
        }, tenant.id)
        app.log.info(`[saas-webhook] Funnel converted for tenant ${subdomain}`)
      } catch (err: any) {
        app.log.warn(`[saas-webhook] Funnel conversion failed: ${err.message}`)
      }

      // ── Affiliate Commission: create earning if affiliate linked ────────
      try {
        const { calculateAffiliateCommission, createAffiliateEarning } = await import('../../services/affiliate-commission.service.js')
        // Check AffiliateReferral linked to this tenant
        const referral = await prisma.affiliateReferral.findFirst({
          where: { tenantId: tenant.id, status: 'converted' },
        }).catch(() => null)

        if (referral) {
          const commission = calculateAffiliateCommission(prisma, {
            affiliateId: referral.affiliateId,
            grossAmount: Number(payment.value || 0),
            transactionId: payment.id,
          })
          if (commission) {
            await createAffiliateEarning(prisma, {
              affiliateId: referral.affiliateId,
              transactionId: payment.id,
              grossAmount: Number(payment.value || 0),
              commissionAmount: (await commission).commissionAmount,
              description: `Comissão plano ${tenant.plan} — ${subdomain}`,
            })
            app.log.info(`[saas-webhook] Affiliate earning created for referral ${referral.affiliateId}`)
          }
        }
      } catch (err: any) {
        app.log.warn(`[saas-webhook] Affiliate commission failed: ${err.message}`)
      }

      // TODO: Trigger Vercel domain deploy when VERCEL_TOKEN is available
      // await deploySubdomain(tenant.subdomain)

      break
    }

    case 'PAYMENT_OVERDUE': {
      if (tenant.planStatus === 'PAST_DUE') return // Already marked

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          planStatus: 'PAST_DUE',
          settings: {
            ...(tenant.settings as any || {}),
            overduePaymentId: payment.id,
            overdueSince: new Date().toISOString(),
          },
        },
      })

      app.log.info(`[saas-webhook] Tenant ${subdomain} marked PAST_DUE`)

      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.tenant.overdue' as any,
          resource: 'tenant',
          resourceId: tenant.id,
          payload: { subdomain, paymentId: payment.id, event } as any,
        },
      }).catch(() => {})

      break
    }

    case 'PAYMENT_DELETED':
    case 'PAYMENT_REFUNDED': {
      // Suspend tenant on refund/cancellation
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          planStatus: 'SUSPENDED',
          isActive: false,
          suspendedAt: new Date(),
        },
      })

      app.log.info(`[saas-webhook] Tenant ${subdomain} SUSPENDED (${event})`)

      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.tenant.suspended' as any,
          resource: 'tenant',
          resourceId: tenant.id,
          payload: { subdomain, paymentId: payment.id, event } as any,
        },
      }).catch(() => {})

      break
    }
  }
}

// ─── Module Purchase Events ──────────────────────────────────────────────────

async function handleModuleEvent(
  app: any,
  prisma: any,
  event: string,
  payment: any,
  externalRef: string,
) {
  // Format: "module:tenantId:moduleSlug"
  const parts = externalRef.replace('module:', '').split(':')
  const tenantId = parts[0]
  const moduleSlug = parts[1]

  if (!tenantId || !moduleSlug) {
    app.log.warn(`[saas-webhook] Invalid module ref: ${externalRef}`)
    return
  }

  const mod = await prisma.moduleDefinition.findUnique({
    where: { slug: moduleSlug },
  }).catch(() => null)

  if (!mod) {
    app.log.warn(`[saas-webhook] Module not found: ${moduleSlug}`)
    return
  }

  const activation = await prisma.tenantModuleActivation.findUnique({
    where: { tenantId_moduleId: { tenantId, moduleId: mod.id } },
  }).catch(() => null)

  switch (event) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED': {
      // Idempotency
      if (activation?.status === 'active') {
        app.log.info(`[saas-webhook] Module ${moduleSlug} already active for tenant ${tenantId}`)
        return
      }

      // Activate module
      await prisma.tenantModuleActivation.upsert({
        where: { tenantId_moduleId: { tenantId, moduleId: mod.id } },
        create: {
          tenantId,
          moduleId: mod.id,
          status: 'active',
          asaasChargeId: payment.id,
          metadata: { paymentValue: payment.value, activatedViaWebhook: true },
        },
        update: {
          status: 'active',
          activatedAt: new Date(),
          cancelledAt: null,
          metadata: { paymentValue: payment.value, activatedViaWebhook: true },
        },
      })

      app.log.info(`[saas-webhook] Module ${moduleSlug} ACTIVATED for tenant ${tenantId}`)

      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.module.activated' as any,
          resource: 'module_activation',
          resourceId: `${tenantId}:${moduleSlug}`,
          payload: { moduleSlug, tenantId, paymentId: payment.id, value: payment.value } as any,
        },
      }).catch(() => {})

      break
    }

    case 'PAYMENT_OVERDUE': {
      if (activation) {
        await prisma.tenantModuleActivation.update({
          where: { id: activation.id },
          data: { status: 'suspended' },
        })
      }
      break
    }

    case 'PAYMENT_DELETED':
    case 'PAYMENT_REFUNDED': {
      if (activation) {
        await prisma.tenantModuleActivation.update({
          where: { id: activation.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        })

        app.log.info(`[saas-webhook] Module ${moduleSlug} CANCELLED for tenant ${tenantId}`)
      }
      break
    }
  }
}
