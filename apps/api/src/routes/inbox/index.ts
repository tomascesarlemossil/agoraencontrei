import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

export default async function inboxRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/inbox — list conversations
  app.get('/', {
    schema: { tags: ['inbox'] },
  }, async (req, reply) => {
    const q = req.query as any
    const isBroker = req.user.role === 'BROKER'

    const where: any = {
      companyId: req.user.cid,
      ...(isBroker && { assignedToId: req.user.sub }),
      ...(q.status && { status: q.status }),
      ...(q.channel && { channel: q.channel }),
    }

    if (q.search) {
      where.OR = [
        { phone: { contains: q.search } },
        { contactName: { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const page = parseInt(q.page ?? '1', 10)
    const limit = parseInt(q.limit ?? '20', 10)

    const [total, items] = await Promise.all([
      app.prisma.conversation.count({ where }),
      app.prisma.conversation.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
          lead: { select: { id: true, name: true, status: true } },
          contact: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/inbox/:id — get conversation with messages
  app.get('/:id', {
    schema: { tags: ['inbox'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const conversation = await app.prisma.conversation.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        lead: { select: { id: true, name: true, status: true } },
        contact: { select: { id: true, name: true, phone: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    })

    if (!conversation) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Mark as read
    await app.prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    })

    return reply.send(conversation)
  })

  // PATCH /api/v1/inbox/:id — update conversation (assign, change status)
  app.patch('/:id', {
    schema: { tags: ['inbox'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      status: z.enum(['bot', 'open', 'assigned', 'resolved']).optional(),
      assignedToId: z.string().cuid().nullable().optional(),
    }).parse(req.body)

    const conversation = await app.prisma.conversation.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!conversation) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.conversation.update({
      where: { id },
      data: body,
    })

    return reply.send(updated)
  })

  // GET /api/v1/inbox/stats — inbox summary
  app.get('/stats/summary', {
    schema: { tags: ['inbox'] },
  }, async (req, reply) => {
    const companyId = req.user.cid

    const [total, open, bot, unread] = await Promise.all([
      app.prisma.conversation.count({ where: { companyId } }),
      app.prisma.conversation.count({ where: { companyId, status: { in: ['open', 'assigned'] } } }),
      app.prisma.conversation.count({ where: { companyId, status: 'bot' } }),
      app.prisma.conversation.aggregate({
        where: { companyId },
        _sum: { unreadCount: true },
      }),
    ])

    return reply.send({
      total,
      open,
      bot,
      unreadTotal: unread._sum.unreadCount ?? 0,
    })
  })
}
