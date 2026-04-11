/**
 * Lead Scoring Routes — Priorização inteligente de leads por IA
 *
 * POST /api/v1/lead-scoring/calculate    — Calcula score de um lead
 * POST /api/v1/lead-scoring/batch        — Calcula scores em lote
 * GET  /api/v1/lead-scoring/ranking      — Ranking de leads por temperatura
 * POST /api/v1/lead-scoring/ai-insight   — Gera insight IA para abordagem
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { calculateLeadScore, getAILeadInsight, type LeadBehavior } from '../../services/lead-scoring.service.js'

const BehaviorSchema = z.object({
  totalPageViews: z.number().default(0),
  propertyViews: z.number().default(0),
  photoViews: z.number().default(0),
  timeOnSiteMinutes: z.number().default(0),
  messagesCount: z.number().default(0),
  whatsappClicks: z.number().default(0),
  phoneCallClicks: z.number().default(0),
  favoritesCount: z.number().default(0),
  searchesCount: z.number().default(0),
  returnVisits: z.number().default(0),
  lastVisitDaysAgo: z.number().default(30),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  interest: z.string().optional(),
  budget: z.number().optional(),
  hasEmail: z.boolean().default(false),
  hasPhone: z.boolean().default(false),
})

export default async function leadScoringRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /calculate — Calcula score de um lead específico
  app.post('/calculate', {
    schema: { tags: ['lead-scoring'], summary: 'Calculate lead score' },
  }, async (req, reply) => {
    const body = z.object({
      leadId: z.string().optional(),
      behavior: BehaviorSchema,
    }).parse(req.body)

    const result = calculateLeadScore(body.behavior as LeadBehavior)

    // If leadId is provided, update the lead's score in the database
    if (body.leadId) {
      await app.prisma.lead.update({
        where: { id: body.leadId },
        data: {
          score: result.score,
          tags: {
            push: `temperature:${result.temperature}`,
          },
          metadata: {
            ...(await app.prisma.lead.findUnique({
              where: { id: body.leadId },
              select: { metadata: true },
            }))?.metadata as any || {},
            leadScore: result,
            scoredAt: new Date().toISOString(),
          },
        },
      }).catch(() => {})
    }

    return reply.send({ success: true, data: result })
  })

  // POST /batch — Calcula scores para múltiplos leads
  app.post('/batch', {
    schema: { tags: ['lead-scoring'], summary: 'Calculate scores for multiple leads' },
  }, async (req, reply) => {
    const cid = req.user.cid

    // Get all leads with their metadata
    const leads = await app.prisma.lead.findMany({
      where: { companyId: cid },
      select: {
        id: true, name: true, email: true, phone: true,
        score: true, interest: true, budget: true,
        utmSource: true, utmMedium: true,
        metadata: true, lastContactAt: true,
        _count: { select: { activities: true, properties: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const results = leads.map((lead: any) => {
      const meta = (lead.metadata as any) || {}
      const lastVisitDaysAgo = lead.lastContactAt
        ? Math.round((Date.now() - lead.lastContactAt.getTime()) / (1000 * 60 * 60 * 24))
        : 30

      const behavior: LeadBehavior = {
        totalPageViews: meta.pageViews || 0,
        propertyViews: lead._count.properties || meta.propertyViews || 0,
        photoViews: meta.photoViews || 0,
        timeOnSiteMinutes: meta.timeOnSite || 0,
        messagesCount: lead._count.activities || 0,
        whatsappClicks: meta.whatsappClicks || 0,
        phoneCallClicks: meta.phoneCallClicks || 0,
        favoritesCount: meta.favoritesCount || 0,
        searchesCount: meta.searchesCount || 0,
        returnVisits: meta.returnVisits || 0,
        lastVisitDaysAgo,
        utmSource: lead.utmSource || undefined,
        utmMedium: lead.utmMedium || undefined,
        interest: lead.interest || undefined,
        budget: lead.budget ? Number(lead.budget) : undefined,
        hasEmail: !!lead.email,
        hasPhone: !!lead.phone,
      }

      const scoreResult = calculateLeadScore(behavior)

      return {
        leadId: lead.id,
        leadName: lead.name,
        ...scoreResult,
      }
    })

    // Sort by score descending (highest priority first)
    results.sort((a: any, b: any) => b.score - a.score)

    // Batch update scores in the database
    const updatePromises = results.map((r: any) =>
      app.prisma.lead.update({
        where: { id: r.leadId },
        data: { score: r.score },
      }).catch(() => {}),
    )
    await Promise.all(updatePromises)

    return reply.send({
      success: true,
      data: results,
      summary: {
        total: results.length,
        onFire: results.filter((r: any) => r.temperature === 'on_fire').length,
        hot: results.filter((r: any) => r.temperature === 'hot').length,
        warm: results.filter((r: any) => r.temperature === 'warm').length,
        cold: results.filter((r: any) => r.temperature === 'cold').length,
      },
    })
  })

  // GET /ranking — Ranking de leads por score
  app.get('/ranking', {
    schema: { tags: ['lead-scoring'], summary: 'Get lead ranking by score' },
  }, async (req, reply) => {
    const q = req.query as any
    const temperature = q.temperature as string | undefined
    const limit = parseInt(q.limit ?? '20', 10)

    const leads = await app.prisma.lead.findMany({
      where: {
        companyId: req.user.cid,
        score: temperature === 'on_fire' ? { gte: 76 }
             : temperature === 'hot' ? { gte: 51, lt: 76 }
             : temperature === 'warm' ? { gte: 26, lt: 51 }
             : temperature === 'cold' ? { lt: 26 }
             : undefined,
        status: { notIn: ['WON', 'LOST', 'ARCHIVED'] },
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { activities: true, properties: true } },
      },
      orderBy: { score: 'desc' },
      take: limit,
    })

    return reply.send({
      success: true,
      data: leads.map((l: any) => ({
        ...l,
        temperature: l.score >= 76 ? 'on_fire' : l.score >= 51 ? 'hot' : l.score >= 26 ? 'warm' : 'cold',
      })),
    })
  })

  // POST /ai-insight — Gera insight de IA sobre como abordar o lead
  app.post('/ai-insight', {
    schema: { tags: ['lead-scoring'], summary: 'Get AI insight for lead approach' },
  }, async (req, reply) => {
    const body = z.object({
      leadId: z.string(),
    }).parse(req.body)

    const lead = await app.prisma.lead.findFirst({
      where: { id: body.leadId, companyId: req.user.cid },
      select: {
        name: true, interest: true, budget: true, score: true,
        utmSource: true, utmMedium: true, metadata: true, lastContactAt: true,
        email: true, phone: true,
        _count: { select: { activities: true, properties: true } },
      },
    })

    if (!lead) {
      return reply.status(404).send({ error: 'LEAD_NOT_FOUND' })
    }

    const meta = (lead.metadata as any) || {}
    const behavior: LeadBehavior = {
      totalPageViews: meta.pageViews || 0,
      propertyViews: lead._count.properties || meta.propertyViews || 0,
      photoViews: meta.photoViews || 0,
      timeOnSiteMinutes: meta.timeOnSite || 0,
      messagesCount: lead._count.activities || 0,
      whatsappClicks: meta.whatsappClicks || 0,
      phoneCallClicks: meta.phoneCallClicks || 0,
      favoritesCount: meta.favoritesCount || 0,
      searchesCount: meta.searchesCount || 0,
      returnVisits: meta.returnVisits || 0,
      lastVisitDaysAgo: lead.lastContactAt
        ? Math.round((Date.now() - lead.lastContactAt.getTime()) / (1000 * 60 * 60 * 24))
        : 30,
      utmSource: lead.utmSource || undefined,
      utmMedium: lead.utmMedium || undefined,
      interest: lead.interest || undefined,
      budget: lead.budget ? Number(lead.budget) : undefined,
      hasEmail: !!lead.email,
      hasPhone: !!lead.phone,
    }

    const scoreResult = calculateLeadScore(behavior)
    const insight = await getAILeadInsight(lead.name, behavior, scoreResult)

    return reply.send({
      success: true,
      data: {
        score: scoreResult,
        aiInsight: insight,
      },
    })
  })
}
