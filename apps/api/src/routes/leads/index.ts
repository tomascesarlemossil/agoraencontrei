import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { emitAutomation } from '../../services/automation.emitter.js'
import { emitSSE } from '../../services/sse.emitter.js'
import { createAuditLog } from '../../services/audit.service.js'

const CreateLeadBody = z.object({
  name:       z.string().min(2),
  email:      z.string().email().optional(),
  phone:      z.string().optional(),
  interest:   z.enum(['buy', 'rent']).optional(),
  budget:     z.number().positive().optional(),
  notes:      z.string().optional(),
  source:     z.string().default('manual'),
  propertyId: z.string().cuid().optional(),
  utmSource:  z.string().optional(),
  utmMedium:  z.string().optional(),
  utmCampaign: z.string().optional(),
})

const UpdateLeadBody = z.object({
  status:      z.enum(['NEW','CONTACTED','QUALIFIED','VISITING','PROPOSAL','NEGOTIATING','WON','LOST','ARCHIVED']).optional(),
  assignedToId: z.string().cuid().optional(),
  notes:       z.string().optional(),
  score:       z.number().int().min(0).max(100).optional(),
  tags:        z.array(z.string()).optional(),
})

export default async function leadsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/leads
  app.get('/', {
    schema: { tags: ['leads'] },
  }, async (req, reply) => {
    const q = req.query as any
    const isBroker = req.user.role === 'BROKER'

    const where: any = {
      companyId: req.user.cid,
      ...(isBroker && { assignedToId: req.user.sub }),
      ...(q.status && { status: q.status }),
      ...(q.source && { source: q.source }),
    }

    if (q.search) {
      where.OR = [
        { name:  { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '50', 10)

    const [total, items] = await Promise.all([
      app.prisma.lead.count({ where }),
      app.prisma.lead.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
          contact:    { select: { id: true, name: true } },
          _count:     { select: { activities: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // POST /api/v1/leads — create (also used by portal webhooks)
  app.post('/', {
    schema: { tags: ['leads'], summary: 'Create a lead' },
  }, async (req, reply) => {
    const body = CreateLeadBody.parse(req.body)

    const lead = await app.prisma.lead.create({
      data: {
        companyId:   req.user.cid,
        brokerId:    req.user.sub,
        assignedToId: req.user.sub,
        name:        body.name,
        email:       body.email,
        phone:       body.phone,
        interest:    body.interest,
        budget:      body.budget,
        notes:       body.notes,
        source:      body.source,
        utmSource:   body.utmSource,
        utmMedium:   body.utmMedium,
        utmCampaign: body.utmCampaign,
        status:      'NEW',
      },
    })

    // Link to property if provided
    if (body.propertyId) {
      await app.prisma.leadProperty.create({
        data: { leadId: lead.id, propertyId: body.propertyId },
      }).catch(() => {})
    }

    await app.prisma.activity.create({
      data: {
        companyId:  req.user.cid,
        userId:     req.user.sub,
        leadId:     lead.id,
        type:       'system',
        title:      'Lead criado',
        description: `Novo lead de ${body.source}`,
      },
    })

    emitAutomation({ companyId: req.user.cid, event: 'lead_created', data: { ...lead, id: lead.id } })
    emitSSE({ type: 'lead_created', companyId: req.user.cid, payload: { id: lead.id, name: lead.name, source: lead.source } })

    await createAuditLog({
      prisma: app.prisma, req,
      action: 'lead.create',
      resource: 'lead', resourceId: lead.id,
      after: lead as any,
    })

    return reply.status(201).send(lead)
  })

  // GET /api/v1/leads/:id
  app.get('/:id', {
    schema: { tags: ['leads'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const isBroker = req.user.role === 'BROKER'

    const lead = await app.prisma.lead.findFirst({
      where: {
        id,
        companyId: req.user.cid,
        ...(isBroker && { assignedToId: req.user.sub }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
        contact:    { select: { id: true, name: true, phone: true, email: true } },
        properties: { include: { property: { select: { id: true, title: true, slug: true, coverImage: true, type: true } } } },
        deals:      { select: { id: true, title: true, status: true, value: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    })

    if (!lead) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(lead)
  })

  // PATCH /api/v1/leads/:id
  app.patch('/:id', {
    schema: { tags: ['leads'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = UpdateLeadBody.parse(req.body)

    const existing = await app.prisma.lead.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    if (req.user.role === 'BROKER' && existing.assignedToId !== req.user.sub) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const old = existing.status
    const lead = await app.prisma.lead.update({ where: { id }, data: body })

    if (body.status && body.status !== old) {
      await app.prisma.activity.create({
        data: {
          companyId: req.user.cid,
          userId: req.user.sub,
          leadId: id,
          type: 'status_change',
          title: `Status: ${old} → ${body.status}`,
        },
      })
      emitAutomation({ companyId: req.user.cid, event: 'lead_updated', data: { ...lead, previousStatus: old } })
      emitSSE({ type: 'lead_updated', companyId: req.user.cid, payload: { id: lead.id, status: lead.status } })
    }

    await createAuditLog({
      prisma: app.prisma, req,
      action: 'lead.update',
      resource: 'lead', resourceId: id,
      before: existing as any,
      after: lead as any,
    })

    return reply.send(lead)
  })

  // POST /api/v1/leads/:id/activities — add activity to lead timeline
  app.post('/:id/activities', {
    schema: { tags: ['leads'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      type:        z.enum(['note','call','email','visit','whatsapp']),
      title:       z.string(),
      description: z.string().optional(),
      scheduledAt: z.string().datetime().optional(),
    }).parse(req.body)

    const activity = await app.prisma.activity.create({
      data: {
        companyId: req.user.cid,
        userId: req.user.sub,
        leadId: id,
        type: body.type,
        title: body.title,
        description: body.description,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      },
    })

    await app.prisma.lead.update({
      where: { id },
      data: { lastContactAt: new Date() },
    })

    return reply.status(201).send(activity)
  })
}
