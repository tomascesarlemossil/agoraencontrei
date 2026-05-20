/**
 * Property Visits — agenda de visitas no dashboard.
 *
 * GET   /api/v1/visits          — lista visitas da empresa (filtros)
 * PATCH /api/v1/visits/:id      — atualiza status/responsável/feedback
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

export default async function visitsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /stats — métricas agregadas da agenda no período (default 30d).
  app.get('/stats', { schema: { tags: ['visits'] } }, async (req, reply) => {
    const q = req.query as { days?: string }
    const days = Math.min(Math.max(Number(q.days) || 30, 1), 365)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const visits = await app.prisma.propertyVisit.findMany({
      where: { companyId: req.user.cid, createdAt: { gte: since } },
      select: {
        id: true, status: true, propertyId: true, brokerId: true,
        rating: true, scheduledAt: true, createdAt: true,
      },
    })

    const byStatus: Record<string, number> = {
      pending: 0, confirmed: 0, done: 0, cancelled: 0, no_show: 0,
    }
    const propertyCount = new Map<string, number>()
    const brokerStats = new Map<string, { total: number; done: number; ratingSum: number; ratingCount: number }>()
    let ratingSum = 0
    let ratingCount = 0

    for (const v of visits) {
      byStatus[v.status] = (byStatus[v.status] ?? 0) + 1
      propertyCount.set(v.propertyId, (propertyCount.get(v.propertyId) ?? 0) + 1)

      if (v.brokerId) {
        const b = brokerStats.get(v.brokerId) ?? { total: 0, done: 0, ratingSum: 0, ratingCount: 0 }
        b.total += 1
        if (v.status === 'done') b.done += 1
        if (v.rating != null) { b.ratingSum += v.rating; b.ratingCount += 1 }
        brokerStats.set(v.brokerId, b)
      }

      if (v.rating != null) { ratingSum += v.rating; ratingCount += 1 }
    }

    const completedOrNoShow = byStatus.done + byStatus.no_show
    const noShowRate = completedOrNoShow > 0 ? byStatus.no_show / completedOrNoShow : 0
    const conversionRate = visits.length > 0 ? byStatus.done / visits.length : 0
    const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0

    const topPropertyIds = [...propertyCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)
    const topBrokerIds = [...brokerStats.keys()]

    const [props, brokers] = await Promise.all([
      topPropertyIds.length
        ? app.prisma.property.findMany({
            where: { id: { in: topPropertyIds } },
            select: { id: true, title: true, slug: true, neighborhood: true },
          }).catch(() => [])
        : Promise.resolve([]),
      topBrokerIds.length
        ? app.prisma.user.findMany({
            where: { id: { in: topBrokerIds } },
            select: { id: true, name: true, avatarUrl: true },
          }).catch(() => [])
        : Promise.resolve([]),
    ])

    const propById = new Map(props.map(p => [p.id, p]))
    const brokerById = new Map(brokers.map(b => [b.id, b]))

    return reply.send({
      periodDays: days,
      total: visits.length,
      byStatus,
      noShowRate,
      conversionRate,
      avgRating,
      ratingCount,
      topProperties: topPropertyIds.map(id => ({
        ...propById.get(id),
        visits: propertyCount.get(id) ?? 0,
      })),
      topBrokers: [...brokerStats.entries()]
        .map(([id, s]) => ({
          ...brokerById.get(id),
          id,
          total: s.total,
          done: s.done,
          avgRating: s.ratingCount > 0 ? s.ratingSum / s.ratingCount : null,
        }))
        .sort((a, b) => b.done - a.done)
        .slice(0, 5),
    })
  })

  app.get('/', { schema: { tags: ['visits'] } }, async (req, reply) => {
    const q = req.query as { status?: string; from?: string; limit?: string }
    const take = Math.min(Number(q.limit) || 100, 500)

    const visits = await app.prisma.propertyVisit.findMany({
      where: {
        companyId: req.user.cid,
        ...(q.status && { status: q.status }),
        ...(q.from && { scheduledAt: { gte: new Date(q.from) } }),
      },
      orderBy: { scheduledAt: 'asc' },
      take,
    })

    // Anexa o título/slug do imóvel e o nome do corretor responsável (se houver).
    const propertyIds = [...new Set(visits.map(v => v.propertyId))]
    const brokerIds = [...new Set(visits.map(v => v.brokerId).filter((b): b is string => !!b))]

    const [properties, brokers] = await Promise.all([
      app.prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, title: true, slug: true, coverImage: true, neighborhood: true, city: true },
      }).catch(() => []),
      brokerIds.length
        ? app.prisma.user.findMany({
            where: { id: { in: brokerIds } },
            select: { id: true, name: true, avatarUrl: true },
          }).catch(() => [])
        : Promise.resolve([]),
    ])

    const pById = new Map(properties.map(p => [p.id, p]))
    const bById = new Map(brokers.map(b => [b.id, b]))

    return reply.send({
      data: visits.map(v => ({
        ...v,
        property: pById.get(v.propertyId) ?? null,
        broker: v.brokerId ? bById.get(v.brokerId) ?? null : null,
      })),
    })
  })

  app.patch('/:id', { schema: { tags: ['visits'] } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      status:      z.enum(['pending', 'confirmed', 'done', 'cancelled', 'no_show']).optional(),
      brokerId:    z.string().optional().nullable(),
      scheduledAt: z.string().optional(),
      mode:        z.enum(['in_person', 'video']).optional(),
      notes:       z.string().max(2000).optional(),
      rating:      z.number().int().min(1).max(5).optional(),
      feedback:    z.string().max(2000).optional(),
    }).parse(req.body)

    const visit = await app.prisma.propertyVisit.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!visit) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.propertyVisit.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.brokerId !== undefined && { brokerId: body.brokerId }),
        ...(body.scheduledAt !== undefined && { scheduledAt: new Date(body.scheduledAt) }),
        ...(body.mode !== undefined && { mode: body.mode }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.feedback !== undefined && { feedback: body.feedback }),
      },
    })

    // Re-pontua leads ligados a este visitante por telefone — visita
    // realizada/no-show é sinal forte de mudança de temperatura.
    if (body.status !== undefined) {
      void (async () => {
        try {
          const leads = await app.prisma.lead.findMany({
            where: { companyId: req.user.cid, phone: updated.visitorPhone },
            select: { id: true },
          }).catch(() => [])
          const { scoreLeadFromDb } = await import('../../services/lead-auto-score.service.js')
          for (const l of leads) await scoreLeadFromDb(app.prisma, l.id)
        } catch { /* non-fatal */ }
      })()
    }

    return reply.send({ data: updated })
  })
}
