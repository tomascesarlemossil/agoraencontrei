import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const RuleBody = z.object({
  name:        z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  trigger:     z.enum([
    'lead_created', 'lead_updated', 'deal_created', 'deal_status_changed',
    'whatsapp_message', 'agent_job_done', 'schedule',
  ]),
  conditions: z.array(z.object({
    field: z.string(),
    op:    z.enum(['eq', 'neq', 'gt', 'lt', 'contains', 'in']),
    value: z.unknown(),
  })).default([]),
  actions: z.array(z.object({
    type:   z.enum(['send_whatsapp', 'create_activity', 'update_lead', 'score_lead', 'notify_webhook', 'assign_broker']),
    params: z.record(z.unknown()).default({}),
  })).min(1),
  isActive: z.boolean().default(true),
})

const PatchBody = RuleBody.partial()

export default async function automationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET / — list rules
  app.get('/', { schema: { tags: ['automations'] } }, async (req, reply) => {
    const q = req.query as any
    const page  = Math.max(1, parseInt(q.page  ?? '1',  10))
    const limit = Math.min(50, parseInt(q.limit ?? '20', 10))

    const [rules, total] = await app.prisma.$transaction([
      app.prisma.automationRule.findMany({
        where: { companyId: req.user.cid },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      app.prisma.automationRule.count({ where: { companyId: req.user.cid } }),
    ])

    return reply.send({ data: rules, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
  })

  // POST / — create rule
  app.post('/', { schema: { tags: ['automations'] } }, async (req, reply) => {
    const body = RuleBody.parse(req.body)
    const rule = await app.prisma.automationRule.create({
      data: { ...body, companyId: req.user.cid, conditions: body.conditions as any, actions: body.actions as any },
    })
    return reply.status(201).send(rule)
  })

  // GET /:id — get rule with last 20 logs
  app.get('/:id', { schema: { tags: ['automations'] } }, async (req, reply) => {
    const { id } = req.params as any
    const rule = await app.prisma.automationRule.findFirst({
      where: { id, companyId: req.user.cid },
      include: { logs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
    if (!rule) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(rule)
  })

  // PATCH /:id — update rule
  app.patch('/:id', { schema: { tags: ['automations'] } }, async (req, reply) => {
    const { id } = req.params as any
    const body = PatchBody.parse(req.body)

    const existing = await app.prisma.automationRule.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.automationRule.update({
      where: { id },
      data: {
        ...body,
        ...(body.conditions !== undefined && { conditions: body.conditions as any }),
        ...(body.actions    !== undefined && { actions:    body.actions    as any }),
      },
    })
    return reply.send(updated)
  })

  // DELETE /:id — delete rule
  app.delete('/:id', { schema: { tags: ['automations'] } }, async (req, reply) => {
    const { id } = req.params as any
    const existing = await app.prisma.automationRule.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    await app.prisma.automationRule.delete({ where: { id } })
    return reply.status(204).send()
  })

  // GET /:id/logs — paginated execution logs
  app.get('/:id/logs', { schema: { tags: ['automations'] } }, async (req, reply) => {
    const { id } = req.params as any
    const q = req.query as any
    const page  = Math.max(1, parseInt(q.page  ?? '1',  10))
    const limit = Math.min(100, parseInt(q.limit ?? '20', 10))

    const rule = await app.prisma.automationRule.findFirst({ where: { id, companyId: req.user.cid } })
    if (!rule) return reply.status(404).send({ error: 'NOT_FOUND' })

    const [logs, total] = await app.prisma.$transaction([
      app.prisma.automationLog.findMany({
        where: { ruleId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      app.prisma.automationLog.count({ where: { ruleId: id } }),
    ])

    return reply.send({ data: logs, meta: { total, page, limit, pages: Math.ceil(total / limit) } })
  })

  // POST /:id/test — enqueue dry-run with empty payload
  app.post('/:id/test', { schema: { tags: ['automations'] } }, async (req, reply) => {
    const { id } = req.params as any
    const rule = await app.prisma.automationRule.findFirst({ where: { id, companyId: req.user.cid } })
    if (!rule) return reply.status(404).send({ error: 'NOT_FOUND' })

    if (app.automationQueue) {
      await app.automationQueue.add('process', {
        companyId: req.user.cid,
        event: rule.trigger,
        data: { _dryRun: true, ruleId: rule.id },
      })
      return reply.send({ queued: true })
    }

    return reply.status(503).send({ error: 'QUEUE_NOT_AVAILABLE', message: 'REDIS_URL not configured' })
  })
}
