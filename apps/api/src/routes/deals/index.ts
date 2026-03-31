import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { emitAutomation } from '../../services/automation.emitter.js'

const toUpper = (v: unknown) => typeof v === 'string' ? v.toUpperCase() : v

const CreateDealBody = z.object({
  title:           z.string().min(2).max(255),
  type:            z.preprocess(toUpper, z.enum(['SALE', 'RENT'])).default('SALE'),
  status:          z.preprocess(toUpper, z.enum(['OPEN','IN_PROGRESS','PROPOSAL','CONTRACT','CLOSED_WON','CLOSED_LOST'])).default('OPEN'),
  value:           z.number().positive().optional(),
  commission:      z.number().min(0).max(100).optional(),   // percentage
  notes:           z.string().optional(),
  leadId:          z.string().cuid().optional(),
  contactId:       z.string().cuid().optional(),
  propertyIds:     z.array(z.string().cuid()).default([]),
  expectedCloseAt: z.string().optional(),
})

const UpdateDealBody = z.object({
  title:           z.string().min(2).max(255).optional(),
  status:          z.preprocess(toUpper, z.enum(['OPEN','IN_PROGRESS','PROPOSAL','CONTRACT','CLOSED_WON','CLOSED_LOST'])).optional(),
  value:           z.number().positive().optional(),
  commission:      z.number().min(0).max(100).optional(),
  notes:           z.string().optional(),
  contactId:       z.string().cuid().optional(),
  expectedCloseAt: z.string().optional(),
  closedAt:        z.string().optional(),
})

const DealFilters = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  status:   z.string().optional(),
  type:     z.string().optional(),
  brokerId: z.string().optional(),
  search:   z.string().optional(),
})

const CommissionBody = z.object({
  commissionRate: z.number().min(0).max(100),
  splitRate:      z.number().min(0).max(100).default(100),
  dueAt:          z.string().optional(),
  notes:          z.string().optional(),
})

export default async function dealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/deals
  app.get('/', {
    schema: { tags: ['deals'], summary: 'List deals' },
  }, async (req, reply) => {
    const q = DealFilters.parse(req.query)
    const isBroker = req.user.role === 'BROKER'

    const where: any = {
      companyId: req.user.cid,
      ...(isBroker && { brokerId: req.user.sub }),
      ...(q.status && { status: q.status.toUpperCase() }),
      ...(q.type && { type: q.type.toUpperCase() }),
      ...(q.brokerId && !isBroker && { brokerId: q.brokerId }),
    }

    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { notes: { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const [total, items] = await Promise.all([
      app.prisma.deal.count({ where }),
      app.prisma.deal.findMany({
        where,
        include: {
          broker: { select: { id: true, name: true, avatarUrl: true } },
          contact: { select: { id: true, name: true, phone: true, email: true } },
          lead: { select: { id: true, name: true, status: true } },
          properties: { include: { property: { select: { id: true, title: true, slug: true, coverImage: true } } } },
          commissions: { select: { id: true, status: true, netValue: true, paidAmount: true } },
        },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    return reply.send({
      data: items,
      meta: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
    })
  })

  // GET /api/v1/deals/pipeline — grouped by status for kanban
  app.get('/pipeline', {
    schema: { tags: ['deals'], summary: 'Deal pipeline grouped by status' },
  }, async (req, reply) => {
    const isBroker = req.user.role === 'BROKER'
    const where: any = {
      companyId: req.user.cid,
      status: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
      ...(isBroker && { brokerId: req.user.sub }),
    }

    const deals = await app.prisma.deal.findMany({
      where,
      include: {
        broker: { select: { id: true, name: true, avatarUrl: true } },
        contact: { select: { id: true, name: true } },
        properties: { include: { property: { select: { id: true, title: true, coverImage: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const pipeline: Record<string, any[]> = {
      OPEN: [], IN_PROGRESS: [], PROPOSAL: [], CONTRACT: [],
    }
    for (const deal of deals) {
      if (pipeline[deal.status]) pipeline[deal.status].push(deal)
    }

    return reply.send(pipeline)
  })

  // GET /api/v1/deals/:id
  app.get('/:id', {
    schema: { tags: ['deals'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const isBroker = req.user.role === 'BROKER'

    const deal = await app.prisma.deal.findFirst({
      where: {
        id,
        companyId: req.user.cid,
        ...(isBroker && { brokerId: req.user.sub }),
      },
      include: {
        broker: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        contact: true,
        lead: { select: { id: true, name: true, status: true, email: true, phone: true } },
        properties: { include: { property: true } },
        commissions: {
          include: { broker: { select: { id: true, name: true } } },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    })

    if (!deal) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(deal)
  })

  // POST /api/v1/deals
  app.post('/', {
    schema: { tags: ['deals'], summary: 'Create deal' },
  }, async (req, reply) => {
    const body = CreateDealBody.parse(req.body)
    const { propertyIds, ...dealData } = body

    const deal = await app.prisma.deal.create({
      data: {
        ...dealData,
        value: dealData.value ? dealData.value : undefined,
        commission: dealData.commission ? dealData.commission : undefined,
        companyId: req.user.cid,
        brokerId: req.user.sub,
        expectedCloseAt: dealData.expectedCloseAt ? new Date(dealData.expectedCloseAt) : undefined,
        properties: {
          create: propertyIds.map((propertyId) => ({ propertyId })),
        },
      },
      include: {
        broker: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        properties: { include: { property: { select: { id: true, title: true } } } },
      },
    })

    await app.prisma.activity.create({
      data: {
        companyId: req.user.cid,
        userId: req.user.sub,
        dealId: deal.id,
        ...(body.contactId && { contactId: body.contactId }),
        type: 'system',
        title: 'Negociação criada',
        description: `Negociação "${body.title}" criada`,
      },
    })

    emitAutomation({ companyId: req.user.cid, event: 'deal_created', data: { id: deal.id, title: deal.title, status: deal.status, contactId: deal.contactId, brokerId: deal.brokerId } })

    return reply.status(201).send(deal)
  })

  // PATCH /api/v1/deals/:id
  app.patch('/:id', {
    schema: { tags: ['deals'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = UpdateDealBody.parse(req.body)

    const existing = await app.prisma.deal.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    if (req.user.role === 'BROKER' && existing.brokerId !== req.user.sub) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const prevStatus = existing.status

    const updated = await app.prisma.deal.update({
      where: { id },
      data: {
        ...body,
        value: body.value ?? undefined,
        commission: body.commission ?? undefined,
        expectedCloseAt: body.expectedCloseAt ? new Date(body.expectedCloseAt) : undefined,
        closedAt: body.closedAt ? new Date(body.closedAt)
          : (body.status && ['CLOSED_WON', 'CLOSED_LOST'].includes(body.status as string) && !existing.closedAt)
            ? new Date() : undefined,
      },
    })

    // Log status change
    if (body.status && body.status !== prevStatus) {
      await app.prisma.activity.create({
        data: {
          companyId: req.user.cid,
          userId: req.user.sub,
          dealId: id,
          type: 'status_change',
          title: 'Status atualizado',
          description: `Status: ${prevStatus} → ${body.status}`,
        },
      })
      emitAutomation({ companyId: req.user.cid, event: 'deal_status_changed', data: { id: updated.id, status: updated.status, previousStatus: prevStatus, contactId: updated.contactId } })
    }

    return reply.send(updated)
  })

  // POST /api/v1/deals/:id/commission — create commission for a deal
  app.post('/:id/commission', {
    preHandler: [app.authenticate],
    schema: { tags: ['deals'], summary: 'Create commission for deal' },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCIAL'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { id } = req.params as { id: string }
    const body = CommissionBody.parse(req.body)

    const deal = await app.prisma.deal.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!deal) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (!deal.value) return reply.status(422).send({ error: 'DEAL_HAS_NO_VALUE', message: 'Defina o valor da negociação antes de gerar comissão' })

    const dealValue = Number(deal.value)
    const grossValue = dealValue * (body.commissionRate / 100)
    const netValue = grossValue * (body.splitRate / 100)

    const commission = await app.prisma.commission.create({
      data: {
        companyId: req.user.cid,
        dealId: id,
        brokerId: deal.brokerId,
        dealValue: dealValue,
        commissionRate: body.commissionRate,
        grossValue,
        splitRate: body.splitRate,
        netValue,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
        notes: body.notes,
      },
    })

    return reply.status(201).send(commission)
  })

  // PATCH /api/v1/deals/:id/commission/:cid — mark commission paid
  app.patch('/:id/commission/:cid', {
    schema: { tags: ['deals'], summary: 'Update commission status' },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCIAL'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { cid } = req.params as { id: string; cid: string }
    const body = z.object({
      status:     z.preprocess(toUpper, z.enum(['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'])).optional(),
      paidAmount: z.number().min(0).optional(),
      paidAt:     z.string().optional(),
      notes:      z.string().optional(),
    }).parse(req.body)

    const commission = await app.prisma.commission.findFirst({
      where: { id: cid, companyId: req.user.cid },
    })
    if (!commission) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.commission.update({
      where: { id: cid },
      data: {
        ...body,
        paidAt: body.paidAt ? new Date(body.paidAt)
          : (body.status === 'PAID' && !commission.paidAt) ? new Date() : undefined,
      },
    })

    return reply.send(updated)
  })
}
