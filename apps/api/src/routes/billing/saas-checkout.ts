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
import argon2 from 'argon2'
import { randomBytes } from 'node:crypto'
import { env } from '../../utils/env.js'
import {
  findOrCreateCustomer,
  createSubscription,
  createCharge,
  type AsaasBillingType,
} from '../../services/asaas.service.js'

/**
 * Gera senha temporária legível (ex: "Onda7-Mar9-Lua") — fácil de copiar
 * via WhatsApp e ainda assim com entropia razoável (>40 bits).
 */
function generateTempPassword(): string {
  const words = ['Onda', 'Mar', 'Lua', 'Sol', 'Vento', 'Rio', 'Pico', 'Brisa', 'Fogo', 'Areia', 'Pedra', 'Ouro']
  const w = () => words[randomBytes(1)[0] % words.length]
  const n = () => randomBytes(1)[0] % 90 + 10 // 10..99
  return `${w()}${n()}-${w()}${n()}-${w()}`
}

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
          nicheSlug: { type: 'string' },
        },
        required: ['planSlug', 'customer', 'tenantName', 'subdomain'],
      },
    },
  }, async (req, reply) => {
    if (!env.ASAAS_API_KEY) {
      return reply.status(503).send({
        error: 'ASAAS_NOT_CONFIGURED',
        message: 'A integração de pagamento (Asaas) ainda não foi configurada no servidor. Avise o administrador.',
      })
    }

    const body = req.body as {
      planSlug: string
      billingCycle?: 'MONTHLY' | 'YEARLY'
      customer: { name: string; email: string; cpfCnpj: string; phone?: string; mobilePhone?: string }
      tenantName: string
      subdomain: string
      layoutType?: string
      primaryColor?: string
      nicheSlug?: string
    }

    // Sanity-check obrigatórios antes de bater no Asaas — devolve o motivo
    // exato pro front em vez do "Erro ao criar assinatura. Tente novamente."
    // genérico que escondia o problema real.
    const cpfClean = (body.customer.cpfCnpj || '').replace(/\D/g, '')
    if (cpfClean.length !== 11 && cpfClean.length !== 14) {
      return reply.status(400).send({
        error: 'INVALID_CPF_CNPJ',
        message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos.',
      })
    }
    if (!/^[a-z0-9-]{3,}$/.test(body.subdomain || '')) {
      return reply.status(400).send({
        error: 'INVALID_SUBDOMAIN',
        message: 'Subdomínio deve ter pelo menos 3 caracteres (letras, números e hífen).',
      })
    }

    // 1. Validate plan exists and is active — price from DB, never frontend
    const plan = await prisma.planDefinition.findUnique({
      where: { slug: body.planSlug },
    }).catch((e: any) => {
      app.log.error({ err: e, planSlug: body.planSlug }, '[saas-billing] planDefinition lookup failed')
      return null
    })

    if (!plan) {
      return reply.status(404).send({
        error: 'PLAN_NOT_FOUND',
        message: `Plano "${body.planSlug}" não encontrado. Verifique se ele foi cadastrado em PlanDefinition.`,
      })
    }
    if (!plan.isActive) {
      return reply.status(409).send({
        error: 'PLAN_INACTIVE',
        message: `Plano "${plan.name}" está marcado como inativo.`,
      })
    }

    // 2. Validate subdomain uniqueness
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: body.subdomain },
    }).catch(() => null)

    if (existingTenant) {
      return reply.status(409).send({
        error: 'SUBDOMAIN_TAKEN',
        message: `O subdomínio "${body.subdomain}" já está em uso. Escolha outro.`,
      })
    }

    // Bloqueia checkout duplicado — se o e-mail já tem conta, manda logar
    // em vez de criar uma segunda Company silenciosamente.
    const existingUser = await app.prisma.user.findUnique({
      where: { email: body.customer.email.toLowerCase().trim() },
    }).catch(() => null)
    if (existingUser) {
      return reply.status(409).send({
        error: 'EMAIL_IN_USE',
        message: `Já existe uma conta com o e-mail ${body.customer.email}. Faça login no painel ou use outro e-mail.`,
        hint: 'Se esqueceu a senha, use "Recuperar senha" na tela de login.',
      })
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

      // 7. Cria Company + Tenant + User admin em transação. Antes só
      //    criava Tenant; o parceiro pagava e ficava sem CRM e sem login.
      //    Agora nasce tudo em TRIAL e o webhook só precisa marcar ACTIVE.
      const tempPassword = generateTempPassword()
      const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id })

      const { tenant, company, user } = await app.prisma.$transaction(async (tx: any) => {
        const company = await tx.company.create({
          data: {
            name: body.tenantName,
            plan: plan.slug.toLowerCase(),
            isActive: true,
            settings: {
              isTenant: true,
              layoutType: body.layoutType || 'urban_tech',
              primaryColor: body.primaryColor || '#d4a853',
              nicheSlug: body.nicheSlug || 'imobiliaria',
              subdomain: body.subdomain,
            },
          },
        })

        const user = await tx.user.create({
          data: {
            companyId: company.id,
            name: body.customer.name,
            email: body.customer.email.toLowerCase().trim(),
            phone: body.customer.phone || null,
            passwordHash,
            role: 'ADMIN' as any,
            status: 'ACTIVE' as any,
          },
        })

        const tenant = await tx.tenant.create({
          data: {
            name: body.tenantName,
            subdomain: body.subdomain,
            layoutType: body.layoutType || 'urban_tech',
            primaryColor: body.primaryColor || '#d4a853',
            plan: plan.slug.toUpperCase(),
            planStatus: 'TRIAL',
            planPrice: price,
            asaasSubscriptionId: subscription.id,
            companyId: company.id,
            ownerId: user.id,
            trialEndsAt: nextDue,
            settings: {
              asaasCustomerId: customer.id,
              planSlug: plan.slug,
              billingCycle: cycle,
              nicheSlug: body.nicheSlug || 'imobiliaria',
              customerEmail: body.customer.email,
              customerPhone: body.customer.phone || null,
              // Marcamos a senha como temporária para o webhook saber que
              // ele deve incluí-la no e-mail/WhatsApp de boas-vindas. Após
              // o primeiro login bem-sucedido a flag deve sair.
              tempPasswordIssued: true,
              tempPasswordPlain: tempPassword,
            },
          },
        })

        return { tenant, company, user }
      })

      // 8. Audit log
      await app.prisma.auditLog.create({
        data: {
          companyId: company.id,
          action: 'saas.checkout' as any,
          resource: 'tenant',
          resourceId: tenant.id,
          userId: user.id,
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
          // Client deve redirecionar para a página de sucesso (que mostra
          // próximos passos) e em paralelo abrir o link do Asaas.
          paymentUrl: `https://www.asaas.com/c/${subscription.id}`,
          successUrl: `/checkout/sucesso?ref=${encodeURIComponent(body.subdomain)}`,
          loginUrl: '/login',
          // Não devolvemos a senha — ela vai pelo e-mail/WhatsApp do
          // webhook de pagamento confirmado, evitando vazar em logs do
          // cliente / paywall.
          message: 'Assinatura criada! Você receberá os dados de acesso por e-mail e WhatsApp assim que o pagamento for confirmado.',
        },
      })
    } catch (err: any) {
      app.log.error({ err }, `[saas-billing] Checkout failed: ${err.message}`)

      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.checkout.error' as any,
          resource: 'billing',
          resourceId: body.subdomain,
          payload: { error: err.message, planSlug: body.planSlug } as any,
        },
      }).catch(() => {})

      // Tenta extrair o motivo real do Asaas — o serviço lança
      // "Asaas API <status>: <body json>" e o body costuma trazer
      // { errors: [{ code, description }] } — vale ouro pra mostrar.
      const raw: string = err?.message || ''
      let errorCode = 'CHECKOUT_FAILED'
      let humanMsg = 'Não conseguimos criar a assinatura agora.'

      const asaasMatch = raw.match(/Asaas API (\d+):\s*(.*)$/s)
      if (asaasMatch) {
        const status = parseInt(asaasMatch[1], 10)
        const bodyText = asaasMatch[2]
        try {
          const parsed = JSON.parse(bodyText)
          const first = Array.isArray(parsed?.errors) && parsed.errors[0]
          if (first?.description) humanMsg = first.description
          if (first?.code) errorCode = `ASAAS_${first.code}`
        } catch {
          if (bodyText) humanMsg = bodyText.slice(0, 200)
        }
        if (status === 401) {
          errorCode = 'ASAAS_AUTH'
          humanMsg = 'A chave do Asaas é inválida ou expirou. Avise o administrador.'
        }
      } else if (/CPF|CNPJ|cpfCnpj/i.test(raw)) {
        errorCode = 'INVALID_CPF_CNPJ'
        humanMsg = 'CPF/CNPJ inválido para o gateway de pagamento.'
      }

      return reply.status(502).send({
        error: errorCode,
        message: humanMsg,
        // hint usado pelo front pra orientar o usuário
        hint: 'Confira CPF/CNPJ, e-mail e tente novamente. Se persistir, fale com o suporte.',
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
