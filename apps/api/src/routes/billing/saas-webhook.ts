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
import { env } from '../../utils/env.js'
import type { AsaasWebhookEvent } from '../../services/asaas.service.js'
import { safeStringEqual } from '../../utils/crypto-safe.js'

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

      // Return 200 to Asaas to prevent retries for processing errors
      return reply.send({ success: false, error: err.message })
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

      const settings = (tenant.settings as any) || {}
      const tempPasswordPlain: string | undefined = settings.tempPasswordPlain
      const customerEmail: string | undefined = settings.customerEmail
      const customerPhone: string | undefined = settings.customerPhone

      // Limpa a senha temporária do settings na hora da ativação — uma vez
      // que vai ser enviada por e-mail/WhatsApp não pode ficar parada no
      // banco indefinidamente.
      const cleanedSettings = { ...settings }
      delete cleanedSettings.tempPasswordPlain

      // Activate tenant + Company (mesma transação para não deixar Tenant
      // ACTIVE com Company isActive=false em caso de falha)
      await prisma.$transaction(async (tx: any) => {
        await tx.tenant.update({
          where: { id: tenant.id },
          data: {
            planStatus: 'ACTIVE',
            isActive: true,
            activatedAt: new Date(),
            suspendedAt: null,
            settings: {
              ...cleanedSettings,
              lastPaymentId: payment.id,
              lastPaymentDate: new Date().toISOString(),
              tempPasswordIssued: false,
            },
          },
        })
        if (tenant.companyId) {
          await tx.company.update({
            where: { id: tenant.companyId },
            data: { isActive: true },
          }).catch(() => null)
        }
      })

      // Envia credenciais ao parceiro (e-mail + WhatsApp em paralelo).
      // Tudo feito em try/catch independentes pra um canal falhar sem
      // travar a ativação.
      if (tempPasswordPlain && customerEmail) {
        try {
          const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
          if (isEmailConfigured()) {
            const siteUrl = `https://${subdomain}.agoraencontrei.com.br`
            const html = `
              <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f6f1;color:#1B2B5B">
                <h1 style="color:#1B2B5B;margin:0 0 8px">Bem-vindo(a) ao AgoraEncontrei!</h1>
                <p style="margin:0 0 16px;color:#475569">Pagamento confirmado. Seu site está no ar 🎉</p>
                <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:16px 0">
                  <p style="margin:0 0 8px"><strong>Painel administrativo:</strong></p>
                  <p style="margin:0 0 12px"><a href="https://agoraencontrei.com.br/login" style="color:#C9A84C">https://agoraencontrei.com.br/login</a></p>
                  <p style="margin:0 0 8px"><strong>Seu site:</strong></p>
                  <p style="margin:0 0 12px"><a href="${siteUrl}" style="color:#C9A84C">${siteUrl}</a></p>
                  <p style="margin:0 0 8px"><strong>E-mail:</strong> ${customerEmail}</p>
                  <p style="margin:0"><strong>Senha temporária:</strong> <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">${tempPasswordPlain}</code></p>
                </div>
                <p style="margin:16px 0;color:#475569">No primeiro acesso troque a senha em <em>Perfil → Segurança</em>.</p>
                <p style="margin:24px 0 0;font-size:13px;color:#64748b">Qualquer dúvida, responda este e-mail.</p>
              </div>`
            await sendEmail({
              to: customerEmail,
              subject: '🎉 Seu site no AgoraEncontrei está ativo — credenciais de acesso',
              html,
            })
            app.log.info(`[saas-webhook] Welcome e-mail enviado para ${customerEmail}`)
          } else {
            app.log.warn('[saas-webhook] SMTP não configurado — credenciais não enviadas por e-mail')
          }
        } catch (e: any) {
          app.log.error({ err: e }, '[saas-webhook] welcome email failed')
        }

        if (customerPhone) {
          try {
            const cleanPhone = customerPhone.replace(/\D/g, '')
            const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
            const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
            const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
            if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
              const siteUrl = `https://${subdomain}.agoraencontrei.com.br`
              const msg =
                `🎉 *AgoraEncontrei — Pagamento confirmado!*\n\n` +
                `Seu site está no ar:\n${siteUrl}\n\n` +
                `*Acesso ao painel:*\nhttps://agoraencontrei.com.br/login\n\n` +
                `*E-mail:* ${customerEmail}\n` +
                `*Senha temporária:* ${tempPasswordPlain}\n\n` +
                `Troque a senha no primeiro acesso (Perfil → Segurança).`
              await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: formattedPhone,
                  type: 'text',
                  text: { body: msg, preview_url: false },
                }),
              })
              app.log.info(`[saas-webhook] Welcome WhatsApp enviado para ${formattedPhone}`)
            } else {
              app.log.warn('[saas-webhook] WhatsApp não configurado — credenciais não enviadas por WhatsApp')
            }
          } catch (e: any) {
            app.log.error({ err: e }, '[saas-webhook] welcome whatsapp failed')
          }
        }
      } else {
        app.log.warn(`[saas-webhook] Tenant ${subdomain} sem tempPasswordPlain — credenciais NÃO enviadas (provavelmente checkout antigo)`)
      }

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
