/**
 * SaaS Billing Routes — Checkout, Subscription & Module Purchase
 *
 * POST /checkout          — Create Asaas customer + subscription for a plan
 * POST /module            — Purchase a module add-on (one-time or recurring charge)
 * GET  /tenant/billing    — Get tenant's billing status (plan, modules, charges)
 *
 * All routes are public or optionally authenticated.
 * Price is ALWAYS read from the database — never from the frontend.
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../utils/env.js'
import {
  findOrCreateCustomer,
  createSubscription,
  createCharge,
  type AsaasBillingType,
} from '../../services/asaas.service.js'

export default async function saasBillingRoutes(app: FastifyInstance) {
  const prisma = app.prisma as any

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /checkout — Create subscription for a plan
  // ═══════════════════════════════════════════════════════════════════════════

  app.post('/checkout', {
    schema: {
      tags: ['saas-billing'],
      summary: 'Create Asaas subscription for a plan',
      body: {
        type: 'object',
        properties: {
          planSlug: { type: 'string' },
          billingCycle: { type: 'string', enum: ['MONTHLY', 'YEARLY'], default: 'MONTHLY' },
          customer: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
              cpfCnpj: { type: 'string' },
              phone: { type: 'string' },
              mobilePhone: { type: 'string' },
            },
            required: ['name', 'email', 'cpfCnpj'],
          },
          // Tenant creation data
          tenantName: { type: 'string' },
          subdomain: { type: 'string' },
          layoutType: { type: 'string' },
          primaryColor: { type: 'string' },
        },
        required: ['planSlug', 'customer', 'tenantName', 'subdomain'],
      },
    },
  }, async (req, reply) => {
    if (!env.ASAAS_API_KEY) {
      return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED', message: 'Billing integration not configured' })
    }

    const body = req.body as {
      planSlug: string
      billingCycle?: 'MONTHLY' | 'YEARLY'
      customer: { name: string; email: string; cpfCnpj: string; phone?: string; mobilePhone?: string }
      tenantName: string
      subdomain: string
      layoutType?: string
      primaryColor?: string
    }

    // 1. Validate plan exists and is active — price from DB, never frontend
    const plan = await prisma.planDefinition.findUnique({
      where: { slug: body.planSlug },
    })

    if (!plan || !plan.isActive) {
      return reply.status(404).send({ error: 'PLAN_NOT_FOUND', message: 'Plano não encontrado ou inativo' })
    }

    // 2. Validate subdomain uniqueness
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: body.subdomain },
    }).catch(() => null)

    if (existingTenant) {
      return reply.status(409).send({ error: 'SUBDOMAIN_TAKEN', message: 'Subdomínio já está em uso' })
    }

    // 3. Price from DB — never trust frontend
    const cycle = body.billingCycle || 'MONTHLY'
    const price = cycle === 'YEARLY' && plan.priceYearly
      ? Number(plan.priceYearly)
      : Number(plan.priceMonthly)

    const asaasCycle = cycle === 'YEARLY' ? 'YEARLY' as const : 'MONTHLY' as const

    try {
      // 4. Find or create Asaas customer
      const customer = await findOrCreateCustomer({
        name: body.customer.name,
        cpfCnpj: body.customer.cpfCnpj,
        email: body.customer.email,
        phone: body.customer.phone,
        mobilePhone: body.customer.mobilePhone,
      })

      // 5. Calculate next due date (today + 3 days for first payment)
      const nextDue = new Date()
      nextDue.setDate(nextDue.getDate() + 3)
      const nextDueDate = nextDue.toISOString().split('T')[0]

      // 6. Create Asaas subscription
      const subscription = await createSubscription({
        customer: customer.id,
        billingType: 'UNDEFINED' as AsaasBillingType, // Let user choose at checkout
        value: price,
        nextDueDate,
        cycle: asaasCycle,
        description: `AgoraEncontrei — Plano ${plan.name} (${asaasCycle})`,
        externalReference: `tenant:${body.subdomain}`,
      })

      // 7. Create tenant in TRIAL status (activated after payment)
      const tenant = await prisma.tenant.create({
        data: {
          name: body.tenantName,
          subdomain: body.subdomain,
          layoutType: body.layoutType || 'urban_tech',
          primaryColor: body.primaryColor || '#d4a853',
          plan: plan.slug.toUpperCase(),
          planStatus: 'TRIAL',
          planPrice: price,
          asaasSubscriptionId: subscription.id,
          trialEndsAt: nextDue,
          settings: {
            asaasCustomerId: customer.id,
            planSlug: plan.slug,
            billingCycle: cycle,
          },
        },
      })

      // 8. Audit log
      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.checkout' as any,
          resource: 'tenant',
          resourceId: tenant.id,
          payload: {
            planSlug: plan.slug,
            price,
            cycle,
            asaasCustomerId: customer.id,
            asaasSubscriptionId: subscription.id,
            subdomain: body.subdomain,
          } as any,
        },
      }).catch(() => {})

      return reply.status(201).send({
        success: true,
        data: {
          tenantId: tenant.id,
          subdomain: tenant.subdomain,
          plan: plan.name,
          price,
          cycle,
          asaasSubscriptionId: subscription.id,
          // Client should redirect to Asaas payment page
          paymentUrl: `https://www.asaas.com/c/${subscription.id}`,
          message: 'Assinatura criada! Complete o pagamento para ativar seu site.',
        },
      })
    } catch (err: any) {
      app.log.error(`[saas-billing] Checkout failed: ${err.message}`)

      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.checkout.error' as any,
          resource: 'billing',
          resourceId: body.subdomain,
          payload: { error: err.message, planSlug: body.planSlug } as any,
        },
      }).catch(() => {})

      return reply.status(500).send({
        error: 'CHECKOUT_FAILED',
        message: 'Erro ao criar assinatura. Tente novamente.',
      })
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /module — Purchase a module add-on
  // ═══════════════════════════════════════════════════════════════════════════

  app.post('/module', {
    schema: { tags: ['saas-billing'], summary: 'Purchase module add-on' },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    if (!env.ASAAS_API_KEY) {
      return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED' })
    }

    const body = z.object({
      tenantId: z.string(),
      moduleSlug: z.string(),
    }).parse(req.body)

    // 1. Get module definition — price from DB
    const mod = await prisma.moduleDefinition.findUnique({
      where: { slug: body.moduleSlug },
    })

    if (!mod || !mod.isActive) {
      return reply.status(404).send({ error: 'MODULE_NOT_FOUND' })
    }

    if (mod.billingType === 'included') {
      return reply.status(400).send({ error: 'MODULE_INCLUDED', message: 'Este módulo já está incluso no plano' })
    }

    // 2. Check if already activated
    const existing = await prisma.tenantModuleActivation.findUnique({
      where: { tenantId_moduleId: { tenantId: body.tenantId, moduleId: mod.id } },
    }).catch(() => null)

    if (existing && existing.status === 'active') {
      return reply.status(409).send({ error: 'ALREADY_ACTIVE', message: 'Módulo já está ativo' })
    }

    // 3. Get tenant's Asaas customer ID
    const tenant = await prisma.tenant.findUnique({
      where: { id: body.tenantId },
    })

    if (!tenant) {
      return reply.status(404).send({ error: 'TENANT_NOT_FOUND' })
    }

    const asaasCustomerId = (tenant.settings as any)?.asaasCustomerId
    if (!asaasCustomerId) {
      return reply.status(400).send({ error: 'NO_BILLING_ACCOUNT', message: 'Tenant sem conta de faturamento' })
    }

    // 4. Price from DB
    const price = mod.billingType === 'one_time'
      ? Number(mod.priceOneTime || 0)
      : Number(mod.priceMonthly || 0)

    if (price <= 0) {
      return reply.status(400).send({ error: 'INVALID_PRICE' })
    }

    try {
      // 5. Create charge or subscription
      const nextDue = new Date()
      nextDue.setDate(nextDue.getDate() + 1)
      const dueDate = nextDue.toISOString().split('T')[0]

      let chargeId: string

      if (mod.billingType === 'recurring') {
        // Create recurring subscription for the module
        const sub = await createSubscription({
          customer: asaasCustomerId,
          billingType: 'UNDEFINED' as AsaasBillingType,
          value: price,
          nextDueDate: dueDate,
          cycle: 'MONTHLY',
          description: `AgoraEncontrei — Módulo ${mod.name}`,
          externalReference: `module:${tenant.id}:${mod.slug}`,
        })
        chargeId = sub.id
      } else {
        // Create one-time charge
        const charge = await createCharge({
          customer: asaasCustomerId,
          billingType: 'UNDEFINED' as AsaasBillingType,
          value: price,
          dueDate,
          description: `AgoraEncontrei — ${mod.name} (avulso)`,
          externalReference: `module:${tenant.id}:${mod.slug}`,
        })
        chargeId = charge.id
      }

      // 6. Create activation record in pending_payment status
      const activation = await prisma.tenantModuleActivation.upsert({
        where: { tenantId_moduleId: { tenantId: body.tenantId, moduleId: mod.id } },
        create: {
          tenantId: body.tenantId,
          moduleId: mod.id,
          status: 'pending_payment',
          asaasChargeId: chargeId,
          metadata: { price, billingType: mod.billingType },
        },
        update: {
          status: 'pending_payment',
          asaasChargeId: chargeId,
          cancelledAt: null,
          metadata: { price, billingType: mod.billingType },
        },
      })

      // 7. Audit log
      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.module.purchase' as any,
          resource: 'module_activation',
          resourceId: activation.id,
          userId: req.user.sub,
          payload: { moduleSlug: mod.slug, price, chargeId, tenantId: body.tenantId } as any,
        },
      }).catch(() => {})

      return reply.status(201).send({
        success: true,
        data: {
          activationId: activation.id,
          module: mod.name,
          price,
          billingType: mod.billingType,
          asaasChargeId: chargeId,
          paymentUrl: `https://www.asaas.com/c/${chargeId}`,
          message: 'Cobrança gerada! O módulo será ativado após confirmação do pagamento.',
        },
      })
    } catch (err: any) {
      app.log.error(`[saas-billing] Module purchase failed: ${err.message}`)
      return reply.status(500).send({ error: 'PURCHASE_FAILED', message: 'Erro ao gerar cobrança.' })
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /tenant/billing — Tenant billing status
  // ═══════════════════════════════════════════════════════════════════════════

  app.get('/tenant/billing', {
    schema: { tags: ['saas-billing'], summary: 'Get tenant billing status' },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const q = req.query as { tenantId?: string }
    if (!q.tenantId) {
      return reply.status(400).send({ error: 'TENANT_ID_REQUIRED' })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: q.tenantId },
    }).catch(() => null)

    if (!tenant) {
      return reply.status(404).send({ error: 'TENANT_NOT_FOUND' })
    }

    const activeModules = await prisma.tenantModuleActivation.findMany({
      where: { tenantId: q.tenantId, status: 'active' },
      include: { module: { select: { slug: true, name: true, priceMonthly: true } } },
    }).catch(() => [])

    const pendingModules = await prisma.tenantModuleActivation.findMany({
      where: { tenantId: q.tenantId, status: 'pending_payment' },
      include: { module: { select: { slug: true, name: true } } },
    }).catch(() => [])

    const serviceOrders = await prisma.tenantServiceOrder.findMany({
      where: { tenantId: q.tenantId },
      include: { service: { select: { slug: true, name: true, price: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => [])

    return reply.send({
      success: true,
      data: {
        plan: tenant.plan,
        planStatus: tenant.planStatus,
        planPrice: tenant.planPrice,
        asaasSubscriptionId: tenant.asaasSubscriptionId,
        trialEndsAt: tenant.trialEndsAt,
        activatedAt: tenant.activatedAt,
        activeModules,
        pendingModules,
        serviceOrders,
      },
    })
  })
}
