/**
 * System Events — inspeção do log de eventos do domínio (admin).
 *
 * GET /api/v1/system-events?type=&entity=&limit=
 */

import type { FastifyInstance } from 'fastify'

export default async function systemEventsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/', { schema: { tags: ['system-events'] } }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const q = req.query as { type?: string; entity?: string; limit?: string }
    const take = Math.min(Number(q.limit) || 100, 500)

    const events = await app.prisma.systemEvent.findMany({
      where: {
        companyId: req.user.cid,
        ...(q.type && { eventType: q.type }),
        ...(q.entity && { entityType: q.entity }),
      },
      orderBy: { createdAt: 'desc' },
      take,
    })
    return reply.send({ data: events })
  })
}
