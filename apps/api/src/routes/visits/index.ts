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
    return reply.send({ data: updated })
  })
}
