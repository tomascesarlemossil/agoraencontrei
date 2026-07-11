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
import { randomBytes, createPublicKey } from 'node:crypto'
import { loadLicensePrivateKey } from '../../services/license.service.js'
import { env } from '../../utils/env.js'
import {
  findOrCreateCustomer,
  createSubscription,
  createCharge,
  getSubscriptionInvoiceUrl,
  type AsaasBillingType,
} from '../../services/asaas.service.js'
import { isSubdomainAvailable } from '../../services/tenant.service.js'

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
  // GET /check-subdomain — disponibilidade do subdomínio (PÚBLICO)
  // O checkout é público; a versão em /tenants exige auth e por isso o checkout
  // recebia 401 e marcava TODO subdomínio como indisponível (botão travado).
  // Retorna shape PLANO { available, reason } — o front lê direto.
  // ═══════════════════════════════════════════════════════════════════════════
  app.get('/check-subdomain', async (req, reply) => {
    const sd = String((req.query as any)?.subdomain ?? '').trim()
    if (!sd) return reply.status(400).send({ available: false, reason: 'Informe um subdomínio.' })
    const result = await isSubdomainAvailable(prisma, sd).catch(() => ({
      available: false,
      reason: 'Não foi possível verificar agora. Tente novamente.',
    }))
    return reply.send(result)
  })

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
    // Planos internos (ex.: "fundador") NUNCA podem ser adquiridos via checkout
    // público — são atribuídos só por processo interno (provisionamento/master).
    // Defensivo: bloqueia por slug E por metadata.internal.
    if (plan.slug === 'fundador' || (plan.metadata as any)?.internal === true) {
      return reply.status(403).send({
        error: 'PLAN_NOT_AVAILABLE',
        message: `Plano "${plan.name}" não está disponível para contratação.`,
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

    // CPF é único por usuário. Se este CPF já pertence a outra conta (ex.: dono
    // de mais de uma imobiliária), NÃO gravamos no novo usuário — evita abortar
    // a transação por violação de unicidade. O login por CPF resolve a 1ª conta.
    const cpfTaken = cpfClean.length === 11
      ? await app.prisma.user.findUnique({ where: { cpf: cpfClean } }).then((u: any) => !!u).catch(() => false)
      : false

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
            // Guarda o CPF (11 dígitos) para permitir login white-label por
            // documento. CNPJ (14 dígitos) não é credencial de pessoa e CPF já
            // usado por outra conta fica de fora (ver cpfTaken acima).
            cpf: cpfClean.length === 11 && !cpfTaken ? cpfClean : null,
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
              // A senha nasce aleatória e só o hash argon2 fica no User; o
              // parceiro define a própria senha pelo link de 1º acesso que o
              // webhook envia (createPasswordSetupToken). NUNCA guardamos a
              // senha em texto puro no banco. A flag abaixo só sinaliza que o
              // onboarding ainda não teve o primeiro login.
              tempPasswordIssued: true,
              // Novos sites ficam em preparação até o checklist obrigatório
              // ser concluído e a publicação ser confirmada pelo parceiro.
              sitePublished: false,
            },
          },
        })

        // Provision the video editor quota when the chosen plan unlocks the
        // module. Only Nível Máximo includes `video_editor` today; future
        // plans that bundle it just need the same string in their modules
        // array — no code changes required.
        const planModules = (plan.modules as string[] | null) ?? []
        if (planModules.includes('video_editor')) {
          await tx.videoEditorQuota.upsert({
            where:  { companyId: company.id },
            create: {
              companyId:    company.id,
              dailyLimit:   50,
              brollCredits: 0,
              dailyResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
            update: {},
          })
        }

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

      // Link pagável real = invoiceUrl da 1ª cobrança da assinatura.
      const invoiceUrl = await getSubscriptionInvoiceUrl(subscription.id)

      // Confirmação imediata do cadastro (best-effort, não-fatal). O link para
      // definir a senha só sai depois do pagamento confirmado (via webhook),
      // aqui apenas avisamos que recebemos o cadastro e incluímos o link de
      // pagamento se houver.
      try {
        const paymentLine = invoiceUrl
          ? `\n\n*Link para pagamento:*\n${invoiceUrl}`
          : ''
        const confirmMsg =
          `Recebemos seu cadastro do plano ${plan.name}. ` +
          `Assim que o pagamento for confirmado você recebe o link para definir sua senha e acessar.`

        // E-mail
        try {
          const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
          if (isEmailConfigured()) {
            const html = `
              <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f6f1;color:#1B2B5B">
                <h1 style="color:#1B2B5B;margin:0 0 8px">Cadastro recebido!</h1>
                <p style="margin:0 0 16px;color:#475569">${confirmMsg}</p>
                ${invoiceUrl ? `<div style="text-align:center;margin:24px 0"><a href="${invoiceUrl}" style="display:inline-block;background:#C9A84C;color:#1B2B5B;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none">Concluir pagamento →</a></div><p style="margin:0 0 16px;word-break:break-all;color:#475569">${invoiceUrl}</p>` : ''}
                <p style="margin:24px 0 0;font-size:13px;color:#64748b">Qualquer dúvida, responda este e-mail.</p>
              </div>`
            await sendEmail({
              to: body.customer.email,
              subject: `Recebemos seu cadastro — Plano ${plan.name}`,
              html,
            })
          }
        } catch (e: any) {
          app.log.error({ err: e }, '[saas-billing] confirmation email failed')
        }

        // WhatsApp
        const notifyPhone = body.customer.mobilePhone || body.customer.phone
        if (notifyPhone) {
          try {
            const { sendWhatsappText } = await import('../../services/whatsapp-notify.service.js')
            await sendWhatsappText(notifyPhone, `✅ *AgoraEncontrei*\n\n${confirmMsg}${paymentLine}`)
          } catch (e: any) {
            app.log.error({ err: e }, '[saas-billing] confirmation whatsapp failed')
          }
        }
      } catch (e: any) {
        app.log.error({ err: e }, '[saas-billing] checkout confirmation notify failed')
      }

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
          paymentUrl: invoiceUrl,
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

    // SEGURANÇA (multi-tenant): só o dono do tenant (ou SUPER_ADMIN) compra
    // add-on para ele (antes: qualquer usuário gerava cobrança/ativação contra
    // o tenant de outra empresa informando o tenantId no corpo).
    const ownerTenant = await prisma.tenant.findUnique({
      where: { id: body.tenantId }, select: { ownerId: true },
    }).catch(() => null)
    if (!ownerTenant || ((ownerTenant as any).ownerId !== req.user.sub && req.user.role !== 'SUPER_ADMIN')) {
      return reply.status(404).send({ error: 'TENANT_NOT_FOUND' })
    }

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
      let paymentUrl: string | null = null

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
        paymentUrl = await getSubscriptionInvoiceUrl(sub.id)
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
        paymentUrl = charge.invoiceUrl ?? null
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
          paymentUrl,
          message: 'Cobrança gerada! O módulo será ativado após confirmação do pagamento.',
        },
      })
    } catch (err: any) {
      app.log.error(`[saas-billing] Module purchase failed: ${err.message}`)
      return reply.status(500).send({ error: 'PURCHASE_FAILED', message: 'Erro ao gerar cobrança.' })
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // POST /addon — contratar pacote avulso (cota de imóveis ou destaques).
  // Catálogo é server-authoritative (preço/quantidade NUNCA vêm do frontend).
  // Add-ons são empilháveis: cada compra cria um novo TenantAddon e a cota
  // efetiva = maxProperties do plano + soma das quantidades ativas.
  // ───────────────────────────────────────────────────────────────────────────
  const ADDON_CATALOG: Record<string, { kind: string; label: string; quantity: number; price: number; billingType: 'recurring' | 'one_time' }> = {
    PKG10: { kind: 'property_quota',   label: '10 Imóveis',         quantity: 10, price: 150,    billingType: 'recurring' },
    PKG20: { kind: 'property_quota',   label: '20 Imóveis',         quantity: 20, price: 199.90, billingType: 'recurring' },
    PKG30: { kind: 'property_quota',   label: '30 Imóveis',         quantity: 30, price: 249.90, billingType: 'recurring' },
    DEST3: { kind: 'highlight',        label: '3 Destaques',        quantity: 3,  price: 60,     billingType: 'recurring' },
    DEST6: { kind: 'super_highlight',  label: '6 Super Destaques',  quantity: 6,  price: 99.90,  billingType: 'recurring' },
  }

  app.post('/addon', {
    schema: { tags: ['saas-billing'], summary: 'Purchase property-quota / highlight add-on package' },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    if (!env.ASAAS_API_KEY) {
      return reply.status(503).send({ error: 'ASAAS_NOT_CONFIGURED' })
    }

    const body = z.object({ packageSlug: z.string() }).parse(req.body)
    const pkg = ADDON_CATALOG[body.packageSlug]
    if (!pkg) {
      return reply.status(404).send({ error: 'PACKAGE_NOT_FOUND' })
    }

    // Tenant derivado do usuário autenticado (não confiamos num tenantId do body).
    const tenant = await prisma.tenant.findFirst({
      where: { companyId: req.user.cid },
    })
    if (!tenant) {
      return reply.status(404).send({ error: 'TENANT_NOT_FOUND', message: 'Nenhum site/parceiro vinculado a esta conta.' })
    }

    const asaasCustomerId = (tenant.settings as any)?.asaasCustomerId
    if (!asaasCustomerId) {
      return reply.status(400).send({ error: 'NO_BILLING_ACCOUNT', message: 'Tenant sem conta de faturamento.' })
    }

    // 1. Cria o add-on em pending_payment para obter o id usado na externalReference.
    const addon = await prisma.tenantAddon.create({
      data: {
        tenantId: tenant.id,
        kind: pkg.kind,
        packageSlug: body.packageSlug,
        label: pkg.label,
        quantity: pkg.quantity,
        price: pkg.price,
        billingType: pkg.billingType,
        status: 'pending_payment',
        metadata: { requestedBy: req.user.sub },
      },
    })

    try {
      // 2. Gera cobrança/assinatura no Asaas com externalReference = addon:{id}.
      const nextDue = new Date()
      nextDue.setDate(nextDue.getDate() + 1)
      const dueDate = nextDue.toISOString().split('T')[0]

      let chargeId: string
      let paymentUrl: string | null = null
      if (pkg.billingType === 'recurring') {
        const sub = await createSubscription({
          customer: asaasCustomerId,
          billingType: 'UNDEFINED' as AsaasBillingType,
          value: pkg.price,
          nextDueDate: dueDate,
          cycle: 'MONTHLY',
          description: `AgoraEncontrei — Pacote ${pkg.label}`,
          externalReference: `addon:${addon.id}`,
        })
        chargeId = sub.id
        paymentUrl = await getSubscriptionInvoiceUrl(sub.id)
      } else {
        const charge = await createCharge({
          customer: asaasCustomerId,
          billingType: 'UNDEFINED' as AsaasBillingType,
          value: pkg.price,
          dueDate,
          description: `AgoraEncontrei — Pacote ${pkg.label} (avulso)`,
          externalReference: `addon:${addon.id}`,
        })
        chargeId = charge.id
        paymentUrl = charge.invoiceUrl ?? null
      }

      // 3. Vincula a cobrança ao add-on.
      await prisma.tenantAddon.update({
        where: { id: addon.id },
        data: { asaasChargeId: chargeId },
      })

      // 4. Auditoria.
      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'saas.addon.purchase' as any,
          resource: 'tenant_addon',
          resourceId: addon.id,
          userId: req.user.sub,
          payload: { packageSlug: body.packageSlug, price: pkg.price, chargeId, tenantId: tenant.id } as any,
        },
      }).catch(() => {})

      return reply.status(201).send({
        success: true,
        data: {
          addonId: addon.id,
          package: pkg.label,
          kind: pkg.kind,
          quantity: pkg.quantity,
          price: pkg.price,
          billingType: pkg.billingType,
          asaasChargeId: chargeId,
          paymentUrl,
          message: 'Cobrança gerada! O pacote será ativado após a confirmação do pagamento.',
        },
      })
    } catch (err: any) {
      // Falhou ao gerar cobrança — remove o add-on pendente órfão.
      await prisma.tenantAddon.delete({ where: { id: addon.id } }).catch(() => {})
      app.log.error(`[saas-billing] Addon purchase failed: ${err.message}`)
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

    // SEGURANÇA (multi-tenant): só o dono do tenant (ou SUPER_ADMIN) vê o billing
    // (antes: qualquer usuário autenticado lia plano/módulos/pedidos de qualquer
    // tenant informando o tenantId).
    if ((tenant as any).ownerId !== req.user.sub && req.user.role !== 'SUPER_ADMIN') {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /offline-purchase — compra da edição OFFLINE (licença instalável)
  // PÚBLICO. Cria a cobrança no Asaas com externalReference
  // 'offline-license:<plan>:<email>'. Ao confirmar, o webhook emite a licença
  // assinada e envia por e-mail com o link do instalador.
  // ═══════════════════════════════════════════════════════════════════════════
  app.post('/offline-purchase', async (req, reply) => {
    const body = req.body as { name?: string; cpfCnpj?: string; email?: string; phone?: string; plan?: string }
    const name = (body.name || '').trim()
    const email = (body.email || '').trim()
    const cpfCnpj = (body.cpfCnpj || '').replace(/\D/g, '')
    const plan = (body.plan || 'basic').toLowerCase()
    if (!name || !email || !cpfCnpj) {
      return reply.status(400).send({ error: 'Informe nome, e-mail e CPF/CNPJ.' })
    }
    // Catálogo offline: mensal/anual são RECORRENTES (assinatura); vitalícia é
    // pagamento ÚNICO. Em todos, o externalReference 'offline-license:...' aciona
    // a emissão da licença no webhook quando o pagamento é confirmado.
    const OFFLINE_PLANS: Record<string, { value: number; cycle: 'MONTHLY' | 'YEARLY' | null; label: string }> = {
      'offline-mensal':    { value: 197,  cycle: 'MONTHLY', label: 'Offline Mensal' },
      'offline-anual':     { value: 1970, cycle: 'YEARLY',  label: 'Offline Anual' },
      'offline-vitalicia': { value: 2497, cycle: null,      label: 'Offline Vitalícia' },
      basic:               { value: 797,  cycle: null,      label: 'Offline (legado)' }, // compat
    }
    const def = OFFLINE_PLANS[plan]
    if (!def) return reply.status(400).send({ error: 'Plano offline inválido.', available: Object.keys(OFFLINE_PLANS) })
    if (!env.ASAAS_API_KEY) return reply.status(503).send({ error: 'Pagamento indisponível no momento.' })

    try {
      const customer = await findOrCreateCustomer({ name, cpfCnpj, email, mobilePhone: body.phone })
      const due = new Date(); due.setDate(due.getDate() + 3)
      const dueDate = due.toISOString().slice(0, 10)
      const externalReference = `offline-license:${plan}:${email}`
      const description = `Sistema Administrador AgoraEncontrei (offline) — ${def.label}`

      if (def.cycle) {
        // RECORRENTE — Asaas gera e envia o 1º boleto/PIX ao e-mail do cliente.
        const sub = await createSubscription({
          customer: customer.id,
          billingType: 'UNDEFINED' as AsaasBillingType,
          value: def.value,
          nextDueDate: dueDate,
          cycle: def.cycle,
          description,
          externalReference,
        })
        return reply.send({
          success: true, recurring: true, subscriptionId: sub.id, value: def.value, plan,
          message: 'Assinatura criada. O Asaas enviará o boleto/PIX da 1ª cobrança ao seu e-mail.',
        })
      }

      // PAGAMENTO ÚNICO (vitalícia/legado)
      const charge = await createCharge({
        customer: customer.id,
        billingType: 'UNDEFINED' as AsaasBillingType,
        value: def.value,
        dueDate,
        description,
        externalReference,
      })
      return reply.send({
        success: true, recurring: false,
        paymentUrl: charge.invoiceUrl, pixCode: charge.pixCode, boletoUrl: charge.bankSlipUrl,
        value: def.value, plan,
      })
    } catch (err: any) {
      app.log.error(`[offline-purchase] ${err?.message || err}`)
      return reply.status(502).send({ error: 'Não foi possível criar a cobrança. Tente novamente.' })
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /license-pubkey — diagnóstico do licenciamento offline (PÚBLICO/seguro).
  // Devolve APENAS a chave PÚBLICA derivada da LICENSE_PRIVATE_KEY configurada
  // no servidor — chave pública não é segredo. Serve para confirmar que a chave
  // do Railway é o par da chave embutida no app (apps/desktop/license.js), sem
  // jamais expor a privada. Em caso de troca de chave, é só comparar de novo.
  // ═══════════════════════════════════════════════════════════════════════════
  app.get('/license-pubkey', async (_req, reply) => {
    if (!env.LICENSE_PRIVATE_KEY) {
      return reply.send({ configured: false, publicKey: null })
    }
    try {
      // usa o mesmo carregador tolerante a formato do issueLicense (aceita PEM
      // com quebras reais, `\n` literais, aspas ou base64 puro)
      const priv = loadLicensePrivateKey()
      const publicKey = createPublicKey(priv).export({ type: 'spki', format: 'pem' }).toString().trim()
      const publicKeyB64 = createPublicKey(priv).export({ type: 'spki', format: 'der' }).toString('base64')
      return reply.send({ configured: true, publicKey, publicKeyB64 })
    } catch {
      return reply.status(500).send({ configured: true, error: 'LICENSE_PRIVATE_KEY inválida (não é uma chave PEM ed25519 válida).' })
    }
  })
}
