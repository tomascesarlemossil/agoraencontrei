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

export default async function masterRoutes(app: FastifyInstance) {
  // All master routes require SUPER_ADMIN
  app.addHook('preHandler', app.authenticate)
  app.addHook('preHandler', async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'SUPER_ADMIN access required' })
    }
  })

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

    const PLAN_PRICES: Record<string, number> = {
      LITE: 450,
      PRO: 1199,
      ENTERPRISE: 2499,
    }

    const updateData: any = { ...body }
    if (body.plan && !body.planPrice) {
      updateData.planPrice = PLAN_PRICES[body.plan]
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
}
