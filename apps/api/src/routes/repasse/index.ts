/**
 * Repasse Routes — D+7 Custody / Scheduled Transfers
 *
 * POST /api/v1/repasse/schedule          — Schedule a new repasse
 * POST /api/v1/repasse/process           — Process due repasses (cron/admin)
 * GET  /api/v1/repasse                   — List repasses with filters
 * GET  /api/v1/repasse/summary           — Get repasse summary/metrics
 * POST /api/v1/repasse/:id/retry         — Retry a failed repasse
 * GET  /api/v1/repasse/commissions       — SaaS commission logs (tenant)
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  scheduleRepasse,
  processDueRepasses,
  listRepasses,
  getRepasseSummary,
  retryRepasse,
  getTenantCommissions,
} from '../../services/repasse.service.js'

export default async function repasseRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /schedule — Schedule a new repasse (custody transfer)
  app.post('/schedule', {
    schema: { tags: ['repasse'], summary: 'Schedule a new D+7 repasse' },
  }, async (req, reply) => {
    const body = z.object({
      contractId: z.string().optional(),
      rentalId: z.string().optional(),
      landlordId: z.string(),
      grossValue: z.number().positive(),
      commissionPercent: z.number().min(0).max(100).optional(),
      delayDays: z.number().int().min(1).max(90).optional(),
      fixedDay: z.number().int().min(1).max(31).optional(),
    }).parse(req.body)

    const repasse = await scheduleRepasse(app.prisma as any, {
      companyId: req.user.cid,
      landlordId: body.landlordId,
      grossValue: body.grossValue,
      commissionPercent: body.commissionPercent,
      contractId: body.contractId,
      rentalId: body.rentalId,
      delayDays: body.delayDays,
      fixedDay: body.fixedDay,
    })

    return reply.status(201).send({ success: true, data: repasse })
  })

  // POST /process — Process all due repasses (SUPER_ADMIN or cron)
  app.post('/process', {
    schema: { tags: ['repasse'], summary: 'Process all due repasses' },
  }, async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const result = await processDueRepasses(app.prisma as any)
    return reply.send({ success: true, data: result })
  })

  // GET / — List repasses with filters
  app.get('/', {
    schema: { tags: ['repasse'], summary: 'List repasses with filters' },
  }, async (req, reply) => {
    const q = req.query as any

    const filters: any = { companyId: req.user.cid }
    if (q.status) filters.status = q.status
    if (q.landlordId) filters.landlordId = q.landlordId
    if (q.page) filters.page = parseInt(q.page)
    if (q.limit) filters.limit = parseInt(q.limit)

    // SUPER_ADMIN can see all
    if (req.user.role === 'SUPER_ADMIN' && q.companyId) {
      filters.companyId = q.companyId
    }

    const result = await listRepasses(app.prisma as any, filters)
    return reply.send({ success: true, data: result })
  })

  // GET /summary — Repasse metrics/summary
  app.get('/summary', {
    schema: { tags: ['repasse'], summary: 'Get repasse summary metrics' },
  }, async (req, reply) => {
    const q = req.query as any
    const filters: any = { companyId: req.user.cid }

    if (req.user.role === 'SUPER_ADMIN' && q.tenantId) {
      filters.tenantId = q.tenantId
    }

    const summary = await getRepasseSummary(app.prisma as any, filters)
    return reply.send({ success: true, data: summary })
  })

  // POST /:id/retry — Retry a failed repasse
  app.post('/:id/retry', {
    schema: { tags: ['repasse'], summary: 'Retry a failed repasse' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const repasse = await retryRepasse(app.prisma as any, id)
    return reply.send({ success: true, data: repasse })
  })

  // GET /commissions — SaaS commission logs
  app.get('/commissions', {
    schema: { tags: ['repasse'], summary: 'Get SaaS commission logs' },
  }, async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const q = req.query as any
    const tenantId = q.tenantId as string

    if (!tenantId) {
      return reply.status(400).send({ error: 'MISSING_TENANT_ID' })
    }

    const result = await getTenantCommissions(app.prisma as any, tenantId)
    return reply.send({ success: true, data: result })
  })
}
