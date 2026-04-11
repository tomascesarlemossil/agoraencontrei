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

// Plan limits for lead views per month (-1 = unlimited)
const PLAN_LEAD_LIMITS: Record<string, number> = {
  LITE: 10,
  START: 10,
  MODERADO: 50,
  PRIME: 50,
  PRO: -1,
  VIP: -1,
  ENTERPRISE: -1,
}

function maskContact(value: string | null): string | null {
  if (!value) return null
  if (value.includes('@')) {
    const [user, domain] = value.split('@')
    return `${user.slice(0, 2)}***@${domain}`
  }
  // Phone: show first 4 digits + mask
  return value.slice(0, 4) + '****' + value.slice(-2)
}

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

    // ── Plan-based lead view gating ──
    let planGated = false
    let viewsUsed = 0
    let viewsLimit = -1

    // Only gate non-admin users
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      // Lookup user's plan via company tenant
      const tenant = await (app.prisma as any).tenant?.findFirst?.({
        where: { companyId: req.user.cid, isActive: true },
        select: { plan: true },
      }).catch(() => null)

      const plan = tenant?.plan || 'LITE'
      viewsLimit = PLAN_LEAD_LIMITS[plan] ?? PLAN_LEAD_LIMITS.LITE

      if (viewsLimit !== -1) {
        // Count lead views this month
        const monthStart = new Date()
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)

        viewsUsed = await app.prisma.auditLog.count({
          where: {
            companyId: req.user.cid,
            action: 'lead.view' as any,
            userId: req.user.sub,
            createdAt: { gte: monthStart },
          },
        }).catch(() => 0)

        planGated = viewsUsed >= viewsLimit
      }
    }

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

    // If plan-gated, mask contact data for items beyond the limit
    const maskedItems = planGated
      ? items.map((item: any) => ({
          ...item,
          email: maskContact(item.email),
          phone: maskContact(item.phone),
          _planGated: true,
        }))
      : items

    return reply.send({
      data: maskedItems,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      planQuota: viewsLimit !== -1 ? { used: viewsUsed, limit: viewsLimit, gated: planGated } : undefined,
    })
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

    // Track lead view for plan quota
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      await app.prisma.auditLog.create({
        data: {
          companyId: req.user.cid,
          userId: req.user.sub,
          action: 'lead.view' as any,
          resource: 'lead',
          resourceId: id,
        },
      }).catch(() => {})
    }

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

  // POST /api/v1/leads/:id/start-deal — convert lead into a deal ("Iniciar Negócio")
  app.post('/:id/start-deal', {
    schema: { tags: ['leads'], summary: 'Convert lead into a deal' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      title:       z.string().optional(),
      type:        z.enum(['SALE', 'RENT']).optional(),
      value:       z.number().positive().optional(),
      commission:  z.number().min(0).max(100).optional(),
      notes:       z.string().optional(),
      propertyIds: z.array(z.string().cuid()).default([]),
    }).parse(req.body || {})

    const lead = await app.prisma.lead.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        properties: { select: { propertyId: true } },
        contact: { select: { id: true, name: true } },
      },
    })
    if (!lead) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Auto-infer deal properties
    const dealType = body.type || (lead.interest === 'rent' ? 'RENT' : 'SALE')
    const dealTitle = body.title || `${dealType === 'RENT' ? 'Locação' : 'Venda'} — ${lead.name}`
    const propertyIds = body.propertyIds.length > 0
      ? body.propertyIds
      : lead.properties.map(p => p.propertyId)

    const deal = await app.prisma.deal.create({
      data: {
        companyId:  req.user.cid,
        brokerId:   lead.assignedToId || req.user.sub,
        leadId:     lead.id,
        contactId:  lead.contactId || undefined,
        title:      dealTitle,
        type:       dealType as any,
        status:     'OPEN',
        value:      body.value || (lead.budget ? Number(lead.budget) : undefined),
        commission: body.commission,
        notes:      body.notes || lead.notes || undefined,
        properties: {
          create: propertyIds.map(propertyId => ({ propertyId })),
        },
      },
      include: {
        broker:     { select: { id: true, name: true } },
        properties: { include: { property: { select: { id: true, title: true, coverImage: true } } } },
      },
    })

    // Update lead status to NEGOTIATING
    await app.prisma.lead.update({
      where: { id },
      data: { status: 'NEGOTIATING' },
    })

    // Create activity on both lead and deal
    await app.prisma.activity.create({
      data: {
        companyId: req.user.cid,
        userId:    req.user.sub,
        leadId:    id,
        dealId:    deal.id,
        type:      'system',
        title:     'Negócio iniciado',
        description: `Lead convertido em negociação "${dealTitle}"`,
      },
    })

    emitAutomation({
      companyId: req.user.cid,
      event: 'deal_created',
      data: { id: deal.id, title: deal.title, status: deal.status, leadId: id, brokerId: deal.brokerId },
    })
    emitSSE({
      type: 'deal_created',
      companyId: req.user.cid,
      payload: { id: deal.id, title: deal.title, leadId: id },
    })

    await createAuditLog({
      prisma: app.prisma, req,
      action: 'lead.start_deal',
      resource: 'lead', resourceId: id,
      after: { dealId: deal.id, dealTitle: deal.title, type: dealType } as any,
    })

    return reply.status(201).send({
      deal,
      lead: { id, status: 'NEGOTIATING' },
      message: 'Negociação criada com sucesso a partir do lead.',
    })
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
