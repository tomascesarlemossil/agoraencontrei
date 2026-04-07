import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const CreateActivityBody = z.object({
  type:        z.enum(['note', 'call', 'email', 'visit', 'whatsapp', 'task', 'system']),
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  leadId:      z.string().cuid().optional(),
  dealId:      z.string().cuid().optional(),
  contactId:   z.string().cuid().optional(),
  propertyId:  z.string().cuid().optional(),
  scheduledAt: z.string().optional(),
  metadata:    z.record(z.unknown()).default({}),
})

const ActivityFilters = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(30),
  type:       z.string().optional(),
  leadId:     z.string().optional(),
  dealId:     z.string().optional(),
  contactId:  z.string().optional(),
  propertyId: z.string().optional(),
  userId:     z.string().optional(),
})

export default async function activitiesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/activities
  app.get('/', {
    schema: { tags: ['activities'], summary: 'List activities (timeline)' },
  }, async (req, reply) => {
    const q = ActivityFilters.parse(req.query)
    const isBroker = req.user.role === 'BROKER'

    const where: any = { companyId: req.user.cid }
    if (isBroker) where.userId = req.user.sub
    if (q.type)       where.type = q.type
    if (q.leadId)     where.leadId = q.leadId
    if (q.dealId)     where.dealId = q.dealId
    if (q.contactId)  where.contactId = q.contactId
    if (q.propertyId) where.propertyId = q.propertyId
    if (q.userId && !isBroker) where.userId = q.userId

    const [total, items] = await Promise.all([
      app.prisma.activity.count({ where }),
      app.prisma.activity.findMany({
        where,
        include: {
          user:     { select: { id: true, name: true, avatarUrl: true } },
          lead:     { select: { id: true, name: true } },
          deal:     { select: { id: true, title: true } },
          contact:  { select: { id: true, name: true } },
          property: { select: { id: true, title: true, slug: true } },
        },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return reply.send({
      data: items,
      meta: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
    })
  })

  // POST /api/v1/activities
  app.post('/', {
    schema: { tags: ['activities'], summary: 'Create activity' },
  }, async (req, reply) => {
    const body = CreateActivityBody.parse(req.body)

    const activity = await app.prisma.activity.create({
      data: {
        ...body,
        metadata: body.metadata as any,
        companyId: req.user.cid,
        userId: req.user.sub,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return reply.status(201).send(activity)
  })

  // PATCH /api/v1/activities/:id — complete a task
  app.patch('/:id', {
    schema: { tags: ['activities'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      title:       z.string().optional(),
      description: z.string().optional(),
      completedAt: z.string().optional(),
      scheduledAt: z.string().optional(),
    }).parse(req.body)

    const existing = await app.prisma.activity.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.activity.update({
      where: { id },
      data: {
        ...body,
        completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      },
    })

    return reply.send(updated)
  })

  // DELETE /api/v1/activities/:id
  app.delete('/:id', {
    schema: { tags: ['activities'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const existing = await app.prisma.activity.findFirst({
      where: {
        id,
        companyId: req.user.cid,
        userId: req.user.role === 'BROKER' ? req.user.sub : undefined,
      },
    })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    await app.prisma.activity.delete({ where: { id } })
    return reply.send({ success: true })
  })
}
