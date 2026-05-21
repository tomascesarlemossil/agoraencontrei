/**
 * Master Dashboard Routes — God Mode Admin Panel
 *
 * SUPER_ADMIN only routes for managing the entire SaaS platform.
 *
 * GET  /api/v1/master/overview          — Platform overview (MRR, tenants, revenue)
 * GET  /api/v1/master/tenants           — All tenants with metrics
 * GET  /api/v1/master/revenue           — Revenue breakdown
 * GET  /api/v1/master/commissions       — SaaS commission logs
 * POST /api/v1/master/tenant/:id/config — Update tenant split/plan
 * GET  /api/v1/master/health            — Platform health check
 * GET  /api/v1/master/activity           — Recent activity log
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { calculateMRR } from '../../services/tenant.service.js'
import { getRepasseSummary } from '../../services/repasse.service.js'
import { buildMasterIntelligence } from '../../services/master/intelligence.service.js'
import {
  provisionQuota as provisionVideoQuota,
  topUpBrollCredits,
  snapshot as videoQuotaSnapshot,
} from '../../services/video-editor/quota.service.js'
import adminConfigRoutes from './admin-config.js'

export default async function masterRoutes(app: FastifyInstance) {
  // All master routes require SUPER_ADMIN
  app.addHook('preHandler', app.authenticate)
  app.addHook('preHandler', async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      // Log unauthorized access attempt
      await app.prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'admin.access_denied' as any,
          resource: 'master_panel',
          resourceId: req.url,
          userId: req.user?.sub || 'unknown',
          payload: { ip: req.ip, method: req.method, url: req.url } as any,
        },
      }).catch(() => {})
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'SUPER_ADMIN access required' })
    }
  })

  // Register dynamic config sub-routes under /master/config/*
  await app.register(adminConfigRoutes, { prefix: '/config' })

  // GET /overview — Platform-wide overview
  app.get('/overview', {
    schema: { tags: ['master'], summary: 'Platform overview dashboard' },
  }, async (_req, reply) => {
    const [
      mrr,
      repasseSummary,
      totalUsers,
      totalProperties,
      totalAuctions,
      recentSignups,
    ] = await Promise.all([
      calculateMRR(app.prisma as any),
      getRepasseSummary(app.prisma as any, {}),
      app.prisma.user.count().catch(() => 0),
      app.prisma.property.count().catch(() => 0),
      app.prisma.auction.count().catch(() => 0),
      app.prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }).catch(() => 0),
    ])

    return reply.send({
      success: true,
      data: {
        saas: mrr,
        repasses: repasseSummary,
        platform: {
          totalUsers,
          totalProperties,
          totalAuctions,
          recentSignups,
        },
        generatedAt: new Date().toISOString(),
      },
    })
  })

  // GET /tenants — All tenants with full metrics
  app.get('/tenants', {
    schema: { tags: ['master'], summary: 'All tenants with metrics' },
  }, async (req, reply) => {
    const q = req.query as any

    const tenants = await (app.prisma as any).tenant.findMany({
      orderBy: { createdAt: 'desc' },
      ...(q.planStatus && { where: { planStatus: q.planStatus } }),
    }).catch(() => [])

    // Enrich with property counts per tenant
    const enriched = await Promise.all(
      tenants.map(async (t: any) => {
        const propertyCount = await app.prisma.property.count({
          where: { companyId: t.companyId },
        }).catch(() => 0)

        const commissionTotal = await (app.prisma as any).saasCommissionLog.aggregate({
          where: { tenantId: t.id },
          _sum: { commissionValue: true },
        }).catch(() => ({ _sum: { commissionValue: 0 } }))

        return {
          ...t,
          propertyCount,
          totalCommission: Number(commissionTotal._sum?.commissionValue || 0),
        }
      }),
    )

    return reply.send({ success: true, data: enriched })
  })

  // GET /revenue — Revenue breakdown by plan, month
  app.get('/revenue', {
    schema: { tags: ['master'], summary: 'Revenue breakdown' },
  }, async (_req, reply) => {
    const tenants = await (app.prisma as any).tenant.findMany({
      select: { plan: true, planStatus: true, planPrice: true, activatedAt: true, createdAt: true },
    }).catch(() => [])

    // Group by plan
    const byPlan: Record<string, { count: number; mrr: number }> = {}
    for (const t of tenants) {
      const plan = t.plan || 'LITE'
      if (!byPlan[plan]) byPlan[plan] = { count: 0, mrr: 0 }
      byPlan[plan].count++
      if (t.planStatus === 'ACTIVE') {
        byPlan[plan].mrr += Number(t.planPrice || 0)
      }
    }

    // Monthly signups (last 12 months)
    const monthlySignups: Array<{ month: string; count: number }> = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const count = tenants.filter((t: any) => {
        const created = new Date(t.createdAt)
        return created >= start && created <= end
      }).length

      monthlySignups.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        count,
      })
    }

    // Commission totals
    const commissions = await (app.prisma as any).saasCommissionLog.aggregate({
      _sum: { commissionValue: true },
      _count: true,
    }).catch(() => ({ _sum: { commissionValue: 0 }, _count: 0 }))

    return reply.send({
      success: true,
      data: {
        byPlan,
        monthlySignups,
        commissions: {
          total: Number(commissions._sum?.commissionValue || 0),
          count: commissions._count || 0,
        },
      },
    })
  })

  // GET /commissions — SaaS commission logs with filters
  app.get('/commissions', {
    schema: { tags: ['master'], summary: 'SaaS commission logs' },
  }, async (req, reply) => {
    const q = req.query as any
    const where: any = {}
    if (q.tenantId) where.tenantId = q.tenantId
    if (q.status) where.status = q.status

    const [logs, total] = await Promise.all([
      (app.prisma as any).saasCommissionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(q.limit) || 50,
        skip: ((parseInt(q.page) || 1) - 1) * (parseInt(q.limit) || 50),
      }),
      (app.prisma as any).saasCommissionLog.count({ where }),
    ]).catch(() => [[], 0])

    return reply.send({ success: true, data: { logs, total } })
  })

  // POST /tenant/:id/config — Update tenant configuration (split, plan, etc)
  app.post('/tenant/:id/config', {
    schema: { tags: ['master'], summary: 'Update tenant split/plan configuration' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      plan: z.enum(['LITE', 'PRO', 'ENTERPRISE']).optional(),
      planStatus: z.enum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
      planPrice: z.number().positive().optional(),
      splitPercent: z.number().min(0).max(50).optional(),
      repasseDelayDays: z.number().int().min(1).max(30).optional(),
      repasseFixedDay: z.number().int().min(1).max(31).optional(),
    }).parse(req.body)

    const updateData: any = { ...body }

    // If changing plan without explicit price, read from PlanDefinition (never hardcode)
    if (body.plan && !body.planPrice) {
      const planDef = await (app.prisma as any).planDefinition.findFirst({
        where: { slug: body.plan.toLowerCase(), isActive: true },
        select: { priceMonthly: true },
      }).catch(() => null)
      if (planDef) {
        updateData.planPrice = Number(planDef.priceMonthly)
      }
    }
    if (body.planStatus === 'ACTIVE' && !updateData.activatedAt) {
      updateData.activatedAt = new Date()
    }
    if (body.planStatus === 'SUSPENDED') {
      updateData.suspendedAt = new Date()
      updateData.isActive = false
    }

    const tenant = await (app.prisma as any).tenant.update({
      where: { id },
      data: updateData,
    })

    return reply.send({ success: true, data: tenant })
  })

  // GET /health — Platform health check
  app.get('/health', {
    schema: { tags: ['master'], summary: 'Platform health check' },
  }, async (_req, reply) => {
    const checks: Record<string, any> = {}

    // Database
    try {
      await app.prisma.$queryRaw`SELECT 1`
      checks.database = { status: 'ok' }
    } catch (e: any) {
      checks.database = { status: 'error', message: e.message }
    }

    // Redis
    try {
      if (app.redis) {
        await app.redis.ping()
        checks.redis = { status: 'ok' }
      } else {
        checks.redis = { status: 'not_configured' }
      }
    } catch (e: any) {
      checks.redis = { status: 'error', message: e.message }
    }

    // Counts
    try {
      const [users, props, auctions] = await Promise.all([
        app.prisma.user.count(),
        app.prisma.property.count(),
        app.prisma.auction.count(),
      ])
      checks.data = { users, properties: props, auctions }
    } catch {
      checks.data = { status: 'error' }
    }

    const allOk = Object.values(checks).every((c: any) =>
      c.status === 'ok' || c.status === 'not_configured' || !c.status,
    )

    return reply.send({
      success: true,
      data: {
        status: allOk ? 'healthy' : 'degraded',
        checks,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    })
  })

  // GET /repasse-rules — List all repasse configurations per tenant
  app.get('/repasse-rules', {
    schema: { tags: ['master'], summary: 'Repasse rules by tenant' },
  }, async (_req, reply) => {
    const tenants = await (app.prisma as any).tenant.findMany({
      select: {
        id: true, subdomain: true, companyName: true, plan: true,
        splitPercent: true, repasseDelayDays: true, repasseFixedDay: true,
        isActive: true, planStatus: true,
      },
      orderBy: { companyName: 'asc' },
    }).catch(() => [])

    // Global defaults
    const defaults = {
      splitPercent: 10,
      repasseDelayDays: 7,
      repasseFixedDay: null,
    }

    return reply.send({
      success: true,
      data: { defaults, tenants },
    })
  })

  // PATCH /repasse-rules/:tenantId — Update repasse rules for a specific tenant
  app.patch('/repasse-rules/:tenantId', {
    schema: { tags: ['master'], summary: 'Update repasse rules for tenant' },
  }, async (req, reply) => {
    const { tenantId } = req.params as { tenantId: string }
    const body = z.object({
      splitPercent: z.number().min(0).max(50).optional(),
      repasseDelayDays: z.number().int().min(1).max(30).optional(),
      repasseFixedDay: z.number().int().min(1).max(31).nullable().optional(),
    }).parse(req.body)

    const tenant = await (app.prisma as any).tenant.update({
      where: { id: tenantId },
      data: body,
    })

    return reply.send({ success: true, data: tenant })
  })

  // GET /repasse-queue — fila de repasses agendados/processados (cross-tenant)
  app.get('/repasse-queue', {
    schema: { tags: ['master'], summary: 'Scheduled repasse queue' },
  }, async (req, reply) => {
    const q = req.query as { status?: string; limit?: string }
    const take = Math.min(Number(q.limit) || 100, 500)

    const repasses = await (app.prisma as any).scheduledRepasse.findMany({
      where: { ...(q.status && { status: q.status }) },
      orderBy: [{ status: 'asc' }, { scheduledDate: 'asc' }],
      take,
    }).catch(() => [])

    const summary: Record<string, { count: number; total: number }> = {
      SCHEDULED: { count: 0, total: 0 }, PROCESSING: { count: 0, total: 0 },
      COMPLETED: { count: 0, total: 0 }, FAILED: { count: 0, total: 0 },
    }
    for (const r of repasses) {
      const s = r.status ?? 'SCHEDULED'
      if (!summary[s]) summary[s] = { count: 0, total: 0 }
      summary[s].count++
      summary[s].total += Number(r.netValue || 0)
    }

    const companyIds = [...new Set(repasses.map((r: any) => r.companyId).filter(Boolean))] as string[]
    const landlordIds = [...new Set(repasses.map((r: any) => r.landlordId).filter(Boolean))] as string[]
    const [companies, landlords] = await Promise.all([
      companyIds.length
        ? app.prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true, tradeName: true } }).catch(() => [])
        : Promise.resolve([]),
      landlordIds.length
        ? (app.prisma as any).client.findMany({ where: { id: { in: landlordIds } }, select: { id: true, name: true } }).catch(() => [])
        : Promise.resolve([]),
    ])
    const compById = new Map(companies.map((c: any) => [c.id, c.tradeName || c.name]))
    const landlordById = new Map(landlords.map((l: any) => [l.id, l.name]))

    return reply.send({
      success: true,
      data: {
        summary,
        repasses: repasses.map((r: any) => ({
          id: r.id,
          status: r.status,
          grossValue: Number(r.grossValue || 0),
          commissionValue: Number(r.commissionValue || 0),
          netValue: Number(r.netValue || 0),
          scheduledDate: r.scheduledDate,
          processedAt: r.processedAt,
          failureReason: r.failureReason,
          companyName: compById.get(r.companyId) ?? null,
          landlordName: landlordById.get(r.landlordId) ?? null,
        })),
        timestamp: new Date().toISOString(),
      },
    })
  })

  // GET /webhook-health — Monitor webhook endpoints and recent delivery status
  app.get('/webhook-health', {
    schema: { tags: ['master'], summary: 'Webhook health monitor' },
  }, async (_req, reply) => {
    // Check Asaas webhook logs from audit log
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      webhookLogs24h,
      webhookLogs7d,
      paymentEvents,
      repasseEvents,
      scraperRuns,
    ] = await Promise.all([
      app.prisma.auditLog.count({
        where: { action: { startsWith: 'webhook' }, createdAt: { gte: last24h } },
      }).catch(() => 0),
      app.prisma.auditLog.count({
        where: { action: { startsWith: 'webhook' }, createdAt: { gte: last7d } },
      }).catch(() => 0),
      app.prisma.auditLog.findMany({
        where: { action: { startsWith: 'payment' }, createdAt: { gte: last24h } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, action: true, resourceId: true, createdAt: true },
      }).catch(() => []),
      (app.prisma as any).scheduledRepasse?.findMany({
        where: { createdAt: { gte: last7d } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, status: true, grossValue: true, scheduledDate: true, createdAt: true },
      }).catch(() => []),
      (app.prisma as any).scraperRun?.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, source: true, status: true,
          itemsFound: true, itemsCreated: true, itemsUpdated: true,
          errorMessage: true, createdAt: true, finishedAt: true,
        },
      }).catch(() => []),
    ])

    // Asaas config check
    const asaasConfigured = !!(process.env.ASAAS_API_KEY || process.env.ASAAS_SANDBOX_KEY)
    const clicksignConfigured = !!(process.env.CLICKSIGN_ACCESS_TOKEN)
    const streetviewConfigured = !!(process.env.GOOGLE_MAPS_API_KEY)
    const whatsappConfigured = !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY)

    return reply.send({
      success: true,
      data: {
        integrations: {
          asaas: { configured: asaasConfigured, status: asaasConfigured ? 'active' : 'not_configured' },
          clicksign: { configured: clicksignConfigured, status: clicksignConfigured ? 'active' : 'not_configured' },
          streetview: { configured: streetviewConfigured, status: streetviewConfigured ? 'active' : 'not_configured' },
          whatsapp: { configured: whatsappConfigured, status: whatsappConfigured ? 'active' : 'not_configured' },
        },
        webhooks: {
          last24h: webhookLogs24h,
          last7d: webhookLogs7d,
          recentPayments: paymentEvents,
        },
        repasses: repasseEvents,
        scraperRuns,
        timestamp: new Date().toISOString(),
      },
    })
  })

  // GET /launch-readiness — verifica se todas as integrações críticas para
  // o lançamento público estão configuradas. Read-only, nunca expõe valores
  // (só booleanos). Detecta Asaas em sandbox vs produção.
  app.get('/launch-readiness', {
    schema: { tags: ['master'], summary: 'Launch readiness — env/integration check' },
  }, async (_req, reply) => {
    const e = process.env
    const has = (...keys: string[]) => keys.every(k => !!(e[k] && String(e[k]).trim().length > 0))
    const asaasBase = e.ASAAS_BASE_URL ?? 'https://www.asaas.com/api/v3'
    const asaasSandbox = /sandbox/i.test(asaasBase)

    const checks = [
      { key: 'database',   label: 'Banco de dados',          configured: has('DATABASE_URL'), critical: true,
        note: 'Conexão PostgreSQL' },
      { key: 'jwt',        label: 'Segredos (JWT/Cookie)',   configured: has('JWT_SECRET', 'COOKIE_SECRET'), critical: true,
        note: 'Autenticação e sessões' },
      { key: 'asaas',      label: 'Asaas (pagamentos)',       configured: has('ASAAS_API_KEY'), critical: true,
        note: asaasSandbox ? '⚠️ Em SANDBOX — troque para produção antes de cobrar' : 'Modo produção',
        warn: asaasSandbox },
      { key: 'whatsapp',   label: 'WhatsApp',                 configured: has('WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID'), critical: true,
        note: 'Bot qualificador + notificações' },
      { key: 'smtp',       label: 'E-mail (SMTP)',            configured: has('SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'), critical: true,
        note: 'Notificações, digest, propostas' },
      { key: 'anthropic',  label: 'IA (Anthropic)',           configured: has('ANTHROPIC_API_KEY'), critical: false,
        note: 'Tomás e agentes de IA' },
      { key: 'openai',     label: 'OpenAI (voz/legendas)',    configured: has('OPENAI_API_KEY'), critical: false,
        note: 'Busca por voz, legendas de vídeo' },
      { key: 's3',         label: 'AWS S3 (uploads)',         configured: has('AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID'), critical: true,
        note: 'Upload de fotos de imóveis' },
      { key: 'cloudinary', label: 'Cloudinary (watermark)',   configured: has('CLOUDINARY_CLOUD_NAME'), critical: false,
        note: 'Presets e marca d\'água nas imagens' },
      { key: 'redis',      label: 'Redis (filas/cache)',      configured: has('REDIS_URL'), critical: false,
        note: 'BullMQ e cache; sem ele usa fallback em memória' },
      { key: 'maps',       label: 'Google Maps / Street View', configured: has('GOOGLE_MAPS_API_KEY'), critical: false,
        note: 'Mapas e fachadas' },
      { key: 'clicksign',  label: 'Clicksign (assinatura)',   configured: has('CLICKSIGN_ACCESS_TOKEN'), critical: false,
        note: 'Assinatura digital de contratos' },
      { key: 'ga',         label: 'Google Analytics',         configured: has('NEXT_PUBLIC_GA_MEASUREMENT_ID'), critical: false,
        note: 'Definido no app web; pode aparecer vazio aqui' },
    ]

    const criticalMissing = checks.filter(c => c.critical && !c.configured).map(c => c.label)
    const warnings = checks.filter(c => (c as any).warn).map(c => c.label)
    const ready = criticalMissing.length === 0 && warnings.length === 0

    return reply.send({
      success: true,
      data: {
        ready,
        criticalMissing,
        warnings,
        checks,
        timestamp: new Date().toISOString(),
      },
    })
  })

  // GET /ai-config — AI feature configuration per plan
  app.get('/ai-config', {
    schema: { tags: ['master'], summary: 'AI feature configuration per plan' },
  }, async (_req, reply) => {
    const config = {
      plans: {
        LITE: {
          aiAnalysis: false,
          aiLeadScoring: false,
          aiColumnMapping: true,
          aiEditalAnalysis: false,
          aiROICalculator: true,
          aiVisualEnhancement: false,
          maxAIRequestsPerMonth: 0,
          description: 'Plano básico — apenas IA de mapeamento CSV e calculadora ROI',
        },
        PRO: {
          aiAnalysis: true,
          aiLeadScoring: true,
          aiColumnMapping: true,
          aiEditalAnalysis: true,
          aiROICalculator: true,
          aiVisualEnhancement: false,
          maxAIRequestsPerMonth: 100,
          description: 'Plano profissional — análise de editais, lead scoring, mapeamento CSV',
        },
        ENTERPRISE: {
          aiAnalysis: true,
          aiLeadScoring: true,
          aiColumnMapping: true,
          aiEditalAnalysis: true,
          aiROICalculator: true,
          aiVisualEnhancement: true,
          maxAIRequestsPerMonth: -1, // unlimited
          description: 'Plano enterprise — todas as features de IA, incluindo visual enhancement',
        },
      },
      models: {
        leadScoring: 'claude-haiku-4-5-20251001',
        editalAnalysis: 'claude-sonnet-4-6',
        columnMapping: 'claude-haiku-4-5-20251001',
        visualEnhancement: 'claude-sonnet-4-6',
      },
    }

    // Get usage stats
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const aiUsage = await app.prisma.auditLog.count({
      where: {
        action: { in: ['ai.analysis', 'ai.lead_score', 'ai.edital_analysis', 'ai.column_mapping'] as any },
        createdAt: { gte: thisMonth },
      },
    }).catch(() => 0)

    return reply.send({
      success: true,
      data: {
        ...config,
        usage: {
          thisMonth: aiUsage,
          period: `${thisMonth.toISOString().substring(0, 7)}`,
        },
      },
    })
  })

  // PATCH /ai-config/:plan — Update AI limits per plan (for future use)
  app.patch('/ai-config/:plan', {
    schema: { tags: ['master'], summary: 'Update AI config for a plan' },
  }, async (req, reply) => {
    const { plan } = req.params as { plan: string }
    if (!['LITE', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return reply.status(400).send({ error: 'INVALID_PLAN' })
    }

    const body = z.object({
      maxAIRequestsPerMonth: z.number().int().min(-1).optional(),
      aiEditalAnalysis: z.boolean().optional(),
      aiLeadScoring: z.boolean().optional(),
      aiVisualEnhancement: z.boolean().optional(),
    }).parse(req.body)

    // Store in company settings or a platform config table
    // For now, log the change to audit
    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform',
        action: 'ai_config.update' as any,
        resource: 'platform',
        resourceId: plan,
        payload: body as any,
      },
    }).catch(() => {})

    return reply.send({
      success: true,
      message: `AI config for plan ${plan} updated`,
      data: body,
    })
  })

  // GET /plan-settings — Partner plan prices and limits (reads from PlanDefinition)
  app.get('/plan-settings', {
    schema: { tags: ['master'], summary: 'Partner plan pricing and limits' },
  }, async (_req, reply) => {
    // Read from PlanDefinition — single source of truth, no hardcoded defaults
    const planDefs = await (app.prisma as any).planDefinition.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        slug: true, name: true, priceMonthly: true, priceYearly: true,
        maxProperties: true, maxLeadViews: true, maxUsers: true,
        features: true, modules: true, highlighted: true,
      },
    }).catch(() => [])

    const plans: Record<string, any> = {}
    for (const p of planDefs) {
      plans[p.slug.toUpperCase()] = {
        name: p.name,
        price: Number(p.priceMonthly),
        priceYearly: p.priceYearly ? Number(p.priceYearly) : null,
        maxLeadViews: p.maxLeadViews,
        maxProperties: p.maxProperties,
        maxUsers: p.maxUsers,
        features: p.features ?? [],
        modules: p.modules ?? [],
        highlighted: p.highlighted,
      }
    }

    return reply.send({ success: true, data: { plans } })
  })

  // PUT /plan-settings — Update plan prices via PlanDefinition (single source of truth)
  app.put('/plan-settings', {
    schema: { tags: ['master'], summary: 'Bulk update plan pricing and limits' },
  }, async (req, reply) => {
    const body = z.object({
      plans: z.record(z.object({
        name: z.string().optional(),
        price: z.number().min(0),
        priceYearly: z.number().min(0).nullable().optional(),
        maxLeadViews: z.number().int().min(-1),
        maxProperties: z.number().int().min(-1),
        maxUsers: z.number().int().min(-1).optional(),
        features: z.array(z.string()).default([]),
      })),
    }).parse(req.body)

    const results: any[] = []
    for (const [slug, planData] of Object.entries(body.plans)) {
      const updated = await (app.prisma as any).planDefinition.updateMany({
        where: { slug: slug.toLowerCase() },
        data: {
          ...(planData.name && { name: planData.name }),
          priceMonthly: planData.price,
          ...(planData.priceYearly !== undefined && { priceYearly: planData.priceYearly }),
          maxLeadViews: planData.maxLeadViews,
          maxProperties: planData.maxProperties,
          ...(planData.maxUsers !== undefined && { maxUsers: planData.maxUsers }),
          features: planData.features,
        },
      }).catch(() => ({ count: 0 }))
      results.push({ slug, updated: updated.count })
    }

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform',
        action: 'plan_settings.update' as any,
        resource: 'platform',
        resourceId: 'plan_definitions',
        userId: req.user.sub,
        payload: { plans: Object.keys(body.plans), results } as any,
      },
    }).catch(() => {})

    return reply.send({ success: true, data: { results } })
  })

  // GET /activity — Recent platform activity
  app.get('/activity', {
    schema: { tags: ['master'], summary: 'Recent platform activity' },
  }, async (_req, reply) => {
    const [
      recentUsers,
      recentProperties,
      recentLeads,
    ] = await Promise.all([
      app.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }).catch(() => []),
      app.prisma.property.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, type: true, purpose: true, price: true, createdAt: true },
      }).catch(() => []),
      app.prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, email: true, source: true, createdAt: true },
      }).catch(() => []),
    ])

    return reply.send({
      success: true,
      data: {
        recentUsers,
        recentProperties,
        recentLeads,
      },
    })
  })

  // ── GET /intelligence — Master Intelligence (Dashboard Goldman Sachs) ───
  app.get('/intelligence', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { tags: ['master'], summary: 'Full master intelligence — revenue, sales, channels, retention, forecast, advisor' },
  }, async (_req, reply) => {
    try {
      const intelligence = await buildMasterIntelligence(app.prisma as any)
      return reply.send({ success: true, data: intelligence })
    } catch (err: any) {
      app.log.error(`[master/intelligence] ${err.message}`)
      return reply.status(500).send({ error: 'Erro ao gerar inteligência master', details: err.message })
    }
  })

  // ════════════════════════════════════════════════════════════════════════
  // Video Editor Quota — admin provisioning + B-roll credit top-up
  // ════════════════════════════════════════════════════════════════════════

  // GET /master/video-editor/quota/:companyId — read snapshot
  app.get('/video-editor/quota/:companyId', {
    schema: { tags: ['master'], summary: 'Read video editor quota for a company' },
  }, async (req, reply) => {
    const { companyId } = req.params as { companyId: string }
    const snap = await videoQuotaSnapshot(app.prisma, companyId)
    if (!snap) return reply.status(404).send({ error: 'NOT_PROVISIONED' })
    return reply.send(snap)
  })

  // POST /master/video-editor/quota/:companyId/provision — create the row
  // (used when a partner upgraded outside the checkout, e.g. manual contract).
  app.post('/video-editor/quota/:companyId/provision', {
    schema: { tags: ['master'], summary: 'Provision the video editor quota for a company' },
  }, async (req, reply) => {
    const { companyId } = req.params as { companyId: string }
    const body = z.object({
      dailyLimit:   z.number().int().min(1).max(1000).optional(),
      brollCredits: z.number().int().min(0).max(10000).optional(),
    }).parse(req.body ?? {})

    const company = await app.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return reply.status(404).send({ error: 'COMPANY_NOT_FOUND' })

    await provisionVideoQuota(app.prisma, companyId, body)
    await app.prisma.auditLog.create({
      data: {
        companyId, action: 'video_editor.quota.provision' as any,
        resource: 'video_editor_quota', resourceId: companyId,
        userId: (req.user as any)?.sub ?? 'unknown', payload: body as any,
      },
    }).catch(() => {})
    const snap = await videoQuotaSnapshot(app.prisma, companyId)
    return reply.send({ ok: true, quota: snap })
  })

  // POST /master/video-editor/quota/:companyId/topup — add B-roll credits
  app.post('/video-editor/quota/:companyId/topup', {
    schema: { tags: ['master'], summary: 'Top up B-roll credits for a company' },
  }, async (req, reply) => {
    const { companyId } = req.params as { companyId: string }
    const body = z.object({
      credits: z.number().int().min(1).max(10000),
      reason:  z.string().max(500).optional(),
    }).parse(req.body)

    const company = await app.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return reply.status(404).send({ error: 'COMPANY_NOT_FOUND' })

    const after = await topUpBrollCredits(app.prisma, companyId, body.credits)
    await app.prisma.auditLog.create({
      data: {
        companyId, action: 'video_editor.quota.topup' as any,
        resource: 'video_editor_quota', resourceId: companyId,
        userId: (req.user as any)?.sub ?? 'unknown',
        payload: { credits: body.credits, reason: body.reason ?? null } as any,
      },
    }).catch(() => {})
    return reply.send({ ok: true, quota: after })
  })

  // PATCH /master/video-editor/quota/:companyId/limit — change daily limit
  app.patch('/video-editor/quota/:companyId/limit', {
    schema: { tags: ['master'], summary: 'Update daily render limit for a company' },
  }, async (req, reply) => {
    const { companyId } = req.params as { companyId: string }
    const body = z.object({ dailyLimit: z.number().int().min(1).max(1000) }).parse(req.body)
    const updated = await app.prisma.videoEditorQuota.update({
      where: { companyId },
      data:  { dailyLimit: body.dailyLimit },
    }).catch(() => null)
    if (!updated) return reply.status(404).send({ error: 'NOT_PROVISIONED' })
    const snap = await videoQuotaSnapshot(app.prisma, companyId)
    return reply.send({ ok: true, quota: snap })
  })
}
