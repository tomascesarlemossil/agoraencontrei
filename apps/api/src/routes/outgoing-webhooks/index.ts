/**
 * Outgoing Webhooks — gestão dos webhooks de saída da Open API.
 *
 * GET    /api/v1/webhooks      — lista os webhooks da empresa
 * POST   /api/v1/webhooks      — cria um webhook (retorna o segredo UMA vez)
 * DELETE /api/v1/webhooks/:id  — remove um webhook
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { WEBHOOK_EVENTS } from '../../services/outgoing-webhook.service.js'

export default async function outgoingWebhooksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET / — lista (sem o segredo)
  app.get('/', { schema: { tags: ['webhooks'] } }, async (req, reply) => {
    const hooks = await app.prisma.outgoingWebhook.findMany({
      where: { companyId: req.user.cid },
      select: {
        id: true, url: true, events: true, isActive: true,
        lastFiredAt: true, failCount: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ data: hooks, availableEvents: WEBHOOK_EVENTS })
  })

  // POST / — cria; o segredo só aparece nesta resposta
  app.post('/', { schema: { tags: ['webhooks'] } }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const body = z.object({
      url:    z.string().url(),
      events: z.array(z.enum(WEBHOOK_EVENTS as [string, ...string[]])).min(1),
    }).parse(req.body)

    const secret = `whsec_${randomBytes(24).toString('hex')}`
    const hook = await app.prisma.outgoingWebhook.create({
      data: { companyId: req.user.cid, url: body.url, secret, events: body.events },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    })
    return reply.status(201).send({ data: { ...hook, secret } })
  })

  // DELETE /:id
  app.delete('/:id', { schema: { tags: ['webhooks'] } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const result = await app.prisma.outgoingWebhook.deleteMany({
      where: { id, companyId: req.user.cid },
    })
    if (result.count === 0) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ success: true })
  })
}
