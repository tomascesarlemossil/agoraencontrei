import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const FinancingBody = z.object({
  stage:          z.enum(['SIMULACAO','ANALISE_CREDITO','ANALISE_JURIDICA','EMISSAO_CONTRATO','REGISTRO_CONTRATO','CONCLUIDO','CANCELADO']).default('SIMULACAO'),
  bank:           z.string().max(100).optional(),
  propertyValue:  z.number().positive().optional(),
  financedValue:  z.number().positive().optional(),
  downPayment:    z.number().min(0).optional(),
  fgtsValue:      z.number().min(0).optional(),
  monthlyPayment: z.number().positive().optional(),
  term:           z.number().int().min(1).max(420).optional(), // up to 35 years in months
  rate:           z.number().min(0).max(99).optional(),        // annual rate %
  notes:          z.string().max(2000).optional(),
  simulatorLink:  z.string().url().optional(),
  clientName:     z.string().max(100).optional(),
  clientPhone:    z.string().max(20).optional(),
  clientEmail:    z.string().email().optional(),
  propertyId:     z.string().cuid().optional(),
  contactId:      z.string().cuid().optional(),
  dealId:         z.string().cuid().optional(),
})

const FinancingFilters = z.object({
  page:    z.coerce.number().int().min(1).default(1),
  limit:   z.coerce.number().int().min(1).max(100).default(20),
  stage:   z.string().optional(),
  search:  z.string().optional(),
  bank:    z.string().optional(),
})

export default async function financingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/financings
  app.get('/', async (req, reply) => {
    const q = FinancingFilters.parse(req.query)
    const where: any = {
      companyId: req.user.cid,
      ...(q.stage && { stage: q.stage }),
      ...(q.bank  && { bank: { contains: q.bank, mode: 'insensitive' } }),
    }
    if (req.user.role === 'BROKER') where.brokerId = req.user.sub

    if (q.search) {
      where.OR = [
        { clientName:  { contains: q.search, mode: 'insensitive' } },
        { clientPhone: { contains: q.search, mode: 'insensitive' } },
        { bank:        { contains: q.search, mode: 'insensitive' } },
        { notes:       { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const [total, items] = await Promise.all([
      app.prisma.financing.count({ where }),
      app.prisma.financing.findMany({
        where,
        include: {
          contact:  { select: { id: true, name: true, phone: true, email: true } },
          property: { select: { id: true, reference: true, title: true, coverImage: true } },
          broker:   { select: { id: true, name: true } },
          deal:     { select: { id: true, title: true, status: true } },
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

  // GET /api/v1/financings/summary — KPI totals
  app.get('/summary', async (req, reply) => {
    const where: any = { companyId: req.user.cid }
    if (req.user.role === 'BROKER') where.brokerId = req.user.sub

    const [total, byStage, totalValue] = await Promise.all([
      app.prisma.financing.count({ where }),
      app.prisma.financing.groupBy({
        by: ['stage'],
        where,
        _count: { _all: true },
        _sum: { financedValue: true },
      }),
      app.prisma.financing.aggregate({
        where: { ...where, stage: { notIn: ['CANCELADO'] } },
        _sum: { financedValue: true, propertyValue: true },
        _count: { _all: true },
      }),
    ])

    const active = byStage.filter(s => !['CONCLUIDO','CANCELADO'].includes(s.stage))
    const completed = byStage.find(s => s.stage === 'CONCLUIDO')

    return reply.send({
      total,
      active:    active.reduce((a, s) => a + s._count._all, 0),
      completed: completed?._count._all ?? 0,
      cancelled: byStage.find(s => s.stage === 'CANCELADO')?._count._all ?? 0,
      totalFinancedValue: Number(totalValue._sum.financedValue ?? 0),
      totalPropertyValue: Number(totalValue._sum.propertyValue ?? 0),
      byStage: byStage.map(s => ({
        stage: s.stage,
        count: s._count._all,
        value: Number(s._sum.financedValue ?? 0),
      })),
    })
  })

  // GET /api/v1/financings/:id
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const where: any = { id, companyId: req.user.cid }
    if (req.user.role === 'BROKER') where.brokerId = req.user.sub

    const item = await app.prisma.financing.findFirst({
      where,
      include: {
        contact:  true,
        property: { select: { id: true, reference: true, title: true, coverImage: true, city: true, state: true } },
        broker:   { select: { id: true, name: true, phone: true, avatarUrl: true } },
        deal:     { select: { id: true, title: true, status: true, value: true } },
      },
    })
    if (!item) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(item)
  })

  // POST /api/v1/financings
  app.post('/', async (req, reply) => {
    const body = FinancingBody.parse(req.body)

    const financing = await app.prisma.financing.create({
      data: {
        ...body,
        companyId:  req.user.cid,
        brokerId:   req.user.sub,
        completedAt: body.stage === 'CONCLUIDO' ? new Date() : undefined,
        cancelledAt: body.stage === 'CANCELADO' ? new Date() : undefined,
      },
      include: {
        contact:  { select: { id: true, name: true, phone: true } },
        property: { select: { id: true, reference: true, title: true } },
      },
    })

    // Create activity
    await app.prisma.activity.create({
      data: {
        companyId:  req.user.cid,
        userId:     req.user.sub,
        propertyId: body.propertyId,
        contactId:  body.contactId,
        type:       'system',
        title:      'Financiamento iniciado',
        description: `Financiamento ${body.bank ? `(${body.bank})` : ''} em etapa: ${body.stage}`,
      },
    }).catch(() => {})

    return reply.status(201).send(financing)
  })

  // PATCH /api/v1/financings/:id
  app.patch('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = FinancingBody.partial().parse(req.body)

    const existing = await app.prisma.financing.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    if (req.user.role === 'BROKER' && existing.brokerId !== req.user.sub) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const updated = await app.prisma.financing.update({
      where: { id },
      data: {
        ...body,
        completedAt: body.stage === 'CONCLUIDO' && !existing.completedAt ? new Date() : existing.completedAt,
        cancelledAt: body.stage === 'CANCELADO' && !existing.cancelledAt ? new Date() : existing.cancelledAt,
      },
    })

    return reply.send(updated)
  })

  // DELETE /api/v1/financings/:id
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const where: any = { id, companyId: req.user.cid }
    if (req.user.role === 'BROKER') where.brokerId = req.user.sub

    await app.prisma.financing.delete({ where })
    return reply.send({ success: true })
  })
}
