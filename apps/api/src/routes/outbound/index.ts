/**
 * Outbound Routes — Manage outbound campaigns, messages, and follow-ups
 *
 * POST /api/v1/outbound/send          — Enqueue single outbound message
 * POST /api/v1/outbound/campaign      — Enqueue batch campaign
 * GET  /api/v1/outbound/metrics       — Outbound performance metrics
 * GET  /api/v1/outbound/messages      — List outbound messages (paginated)
 * POST /api/v1/outbound/message/:id/status — Update message status (webhook)
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { enqueueOutbound, enqueueBatchOutbound, getOutboundMetrics } from '../../services/outbound-queue.service.js'
import { scheduleFollowUps, getFollowUpMetrics } from '../../services/followup.service.js'
import { ingestLead, getFunnelMetrics } from '../../services/lead-ingestion.service.js'
import { getFunnelConversionMetrics } from '../../services/sales-funnel.service.js'

export default async function outboundRoutes(app: FastifyInstance) {
  // All outbound routes require SUPER_ADMIN
  app.addHook('preHandler', app.authenticate)
  app.addHook('preHandler', async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
  })

  // ── POST /send — Single outbound message ──────────────────────────────
  app.post('/send', {
    schema: { tags: ['outbound'], summary: 'Enqueue single outbound message' },
  }, async (req, reply) => {
    const body = z.object({
      name: z.string().min(1),
      phone: z.string().min(8),
      previewSiteName: z.string().optional(),
      campaignId: z.string().optional(),
      templateVersion: z.string().optional(),
      source: z.string().default('whatsapp_outbound'),
    }).parse(req.body)

    // Ingest as lead first
    const ingested = await ingestLead(app.prisma, {
      name: body.name,
      phone: body.phone,
      source: body.source,
      campaign: body.campaignId,
    })

    // Enqueue outbound
    const result = await enqueueOutbound(app.prisma, app.automationQueue, {
      leadId: ingested.leadId ?? undefined,
      funnelId: ingested.funnelId,
      name: body.name,
      phone: body.phone,
      previewSiteName: body.previewSiteName,
      campaignId: body.campaignId,
      templateVersion: body.templateVersion,
    })

    // Schedule follow-ups
    if (ingested.leadId || ingested.funnelId) {
      await scheduleFollowUps(app.prisma, {
        leadId: ingested.leadId || ingested.funnelId,
        outboundId: result.outboundId,
        phone: body.phone,
        name: body.name,
      }).catch(() => {})
    }

    return reply.send({
      success: true,
      data: {
        outboundId: result.outboundId,
        template: result.template,
        funnelId: ingested.funnelId,
        isDuplicate: ingested.isDuplicate,
        score: ingested.score,
      },
    })
  })

  // ── POST /campaign — Batch outbound campaign ──────────────────────────
  app.post('/campaign', {
    schema: { tags: ['outbound'], summary: 'Enqueue batch outbound campaign' },
  }, async (req, reply) => {
    const body = z.object({
      campaignId: z.string().min(1),
      leads: z.array(z.object({
        name: z.string().min(1),
        phone: z.string().min(8),
        previewSiteName: z.string().optional(),
      })).max(500),
    }).parse(req.body)

    // Ingest all leads first
    const enrichedLeads = []
    for (const lead of body.leads) {
      const ingested = await ingestLead(app.prisma, {
        name: lead.name,
        phone: lead.phone,
        source: 'whatsapp_outbound',
        campaign: body.campaignId,
      })
      if (!ingested.isDuplicate) {
        enrichedLeads.push({
          leadId: ingested.leadId ?? undefined,
          funnelId: ingested.funnelId,
          name: lead.name,
          phone: lead.phone,
          previewSiteName: lead.previewSiteName,
        })
      }
    }

    // Enqueue batch
    const result = await enqueueBatchOutbound(
      app.prisma,
      app.automationQueue,
      enrichedLeads,
      body.campaignId,
    )

    return reply.send({
      success: true,
      data: {
        campaignId: body.campaignId,
        totalLeads: body.leads.length,
        enqueued: result.enqueued,
        skipped: result.skipped,
        duplicatesRemoved: body.leads.length - enrichedLeads.length,
      },
    })
  })

  // ── GET /metrics — Outbound + Funnel + Follow-up metrics ──────────────
  app.get('/metrics', {
    schema: { tags: ['outbound'], summary: 'Outbound performance metrics' },
  }, async (_req, reply) => {
    const [outbound, funnel, followUp, funnelConversion] = await Promise.all([
      getOutboundMetrics(app.prisma),
      getFunnelMetrics(app.prisma),
      getFollowUpMetrics(app.prisma),
      getFunnelConversionMetrics(app.prisma),
    ])

    return reply.send({
      success: true,
      data: {
        outbound,
        funnel,
        followUp,
        funnelConversion,
        generatedAt: new Date().toISOString(),
      },
    })
  })

  // ── GET /messages — List outbound messages with filters ───────────────
  app.get('/messages', {
    schema: { tags: ['outbound'], summary: 'List outbound messages' },
  }, async (req, reply) => {
    const q = req.query as any
    const page = parseInt(q.page) || 1
    const limit = Math.min(parseInt(q.limit) || 50, 100)
    const where: any = {}

    if (q.status) where.status = q.status
    if (q.campaignId) where.campaignId = q.campaignId
    if (q.templateVersion) where.templateVersion = q.templateVersion

    const [messages, total] = await Promise.all([
      (app.prisma as any).outboundMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }).catch(() => []),
      (app.prisma as any).outboundMessage.count({ where }).catch(() => 0),
    ])

    return reply.send({
      success: true,
      data: { messages, total, page, limit },
    })
  })

  // ── POST /message/:id/status — Update message status (delivery webhook) ─
  app.post('/message/:id/status', {
    schema: { tags: ['outbound'], summary: 'Update message delivery status' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      status: z.enum(['delivered', 'read', 'replied', 'failed']),
    }).parse(req.body)

    const data: any = { status: body.status }
    if (body.status === 'delivered') data.deliveredAt = new Date()
    if (body.status === 'read') data.readAt = new Date()
    if (body.status === 'replied') data.repliedAt = new Date()

    await (app.prisma as any).outboundMessage.update({
      where: { id },
      data,
    })

    return reply.send({ success: true })
  })

  // ── GET /followups — List follow-up schedules ─────────────────────────
  app.get('/followups', {
    schema: { tags: ['outbound'], summary: 'List follow-up schedules' },
  }, async (req, reply) => {
    const q = req.query as any
    const where: any = {}
    if (q.status) where.status = q.status
    if (q.step) where.step = q.step

    const followups = await (app.prisma as any).followUpSchedule.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: Math.min(parseInt(q.limit) || 50, 100),
    }).catch(() => [])

    return reply.send({ success: true, data: followups })
  })

  // ── GET /funnel — Sales funnel entries ────────────────────────────────
  app.get('/funnel', {
    schema: { tags: ['outbound'], summary: 'Sales funnel entries' },
  }, async (req, reply) => {
    const q = req.query as any
    const page = parseInt(q.page) || 1
    const limit = Math.min(parseInt(q.limit) || 50, 100)
    const where: any = {}

    if (q.stage) where.stage = q.stage
    if (q.source) where.source = q.source

    const [entries, total] = await Promise.all([
      (app.prisma as any).salesFunnel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }).catch(() => []),
      (app.prisma as any).salesFunnel.count({ where }).catch(() => 0),
    ])

    return reply.send({
      success: true,
      data: { entries, total, page, limit },
    })
  })

  // ── POST /ingest — Manual lead ingestion endpoint ─────────────────────
  app.post('/ingest', {
    schema: { tags: ['outbound'], summary: 'Manually ingest a lead' },
  }, async (req, reply) => {
    const body = z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      source: z.string().default('manual'),
      campaign: z.string().optional(),
      affiliateCode: z.string().optional(),
      interest: z.string().optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
    }).parse(req.body)

    const result = await ingestLead(app.prisma, body)

    return reply.send({ success: true, data: result })
  })
}
