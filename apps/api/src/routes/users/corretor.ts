import type { FastifyInstance } from 'fastify'

export default async function corretorRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/corretor/stats — broker own performance stats
  app.get('/stats', async (req, reply) => {
    const userId = req.user.sub
    const cid    = req.user.cid
    const now    = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalLeads, newLeads, activeLeads, wonLeads, lostLeads,
      totalDeals, activeDeals, wonDeals,
      totalActivities, monthActivities, pendingActivities,
    ] = await Promise.all([
      app.prisma.lead.count({ where: { companyId: cid, assignedToId: userId } }),
      app.prisma.lead.count({ where: { companyId: cid, assignedToId: userId, status: 'NEW' } }),
      app.prisma.lead.count({ where: {
        companyId: cid, assignedToId: userId,
        status: { in: ['CONTACTED', 'QUALIFIED', 'VISITING', 'PROPOSAL', 'NEGOTIATING'] },
      }}),
      app.prisma.lead.count({ where: { companyId: cid, assignedToId: userId, status: 'WON' } }),
      app.prisma.lead.count({ where: { companyId: cid, assignedToId: userId, status: 'LOST' } }),
      app.prisma.deal.count({ where: { companyId: cid, brokerId: userId } }),
      app.prisma.deal.count({ where: { companyId: cid, brokerId: userId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      app.prisma.deal.count({ where: { companyId: cid, brokerId: userId, status: 'CLOSED_WON' } }),
      app.prisma.activity.count({ where: { companyId: cid, userId } }),
      app.prisma.activity.count({ where: { companyId: cid, userId, createdAt: { gte: monthStart } } }),
      app.prisma.activity.count({ where: { companyId: cid, userId, type: 'task', scheduledAt: { gte: now } } }),
    ])

    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    return reply.send({
      leads:        { total: totalLeads, new: newLeads, active: activeLeads, won: wonLeads, lost: lostLeads },
      deals:        { total: totalDeals, active: activeDeals, won: wonDeals },
      activities:   { total: totalActivities, thisMonth: monthActivities, pending: pendingActivities },
      conversionRate,
    })
  })

  // GET /api/v1/corretor/leads — broker's assigned leads
  app.get('/leads', async (req, reply) => {
    const q      = req.query as any
    const userId = req.user.sub
    const cid    = req.user.cid

    const where: any = { companyId: cid, assignedToId: userId }
    if (q.status) where.status = q.status
    if (q.search) {
      where.OR = [
        { name:  { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '20', 10)

    const [total, items] = await Promise.all([
      app.prisma.lead.count({ where }),
      app.prisma.lead.findMany({
        where,
        include: {
          activities: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/corretor/deals — broker's assigned deals
  app.get('/deals', async (req, reply) => {
    const q      = req.query as any
    const userId = req.user.sub
    const cid    = req.user.cid

    const where: any = { companyId: cid, brokerId: userId }
    if (q.status) where.status = q.status

    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '20', 10)

    const [total, items] = await Promise.all([
      app.prisma.deal.count({ where }),
      app.prisma.deal.findMany({
        where,
        include: {
          lead:    { select: { id: true, name: true, phone: true } },
          contact: { select: { id: true, name: true } },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/corretor/activities — broker's activities/tasks
  app.get('/activities', async (req, reply) => {
    const q      = req.query as any
    const userId = req.user.sub
    const cid    = req.user.cid
    const now    = new Date()

    const where: any = { companyId: cid, userId }
    if (q.pending === 'true') {
      where.type      = 'task'
      where.scheduledAt = { gte: now }
    }

    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '20', 10)

    const [total, items] = await Promise.all([
      app.prisma.activity.count({ where }),
      app.prisma.activity.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { scheduledAt: 'asc' },
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/corretor/ranking — broker ranking in company
  app.get('/ranking', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const brokers = await app.prisma.user.findMany({
      where: { companyId: cid, role: 'BROKER', status: 'ACTIVE' },
      select: { id: true, name: true, avatarUrl: true },
    })

    const ranking = await Promise.all(
      brokers.map(async (b) => {
        const [leads, wonDeals, monthLeads] = await Promise.all([
          app.prisma.lead.count({ where: { companyId: cid, assignedToId: b.id } }),
          app.prisma.deal.count({ where: { companyId: cid, brokerId: b.id, status: 'CLOSED_WON' } }),
          app.prisma.lead.count({ where: { companyId: cid, assignedToId: b.id, createdAt: { gte: monthStart } } }),
        ])
        return { ...b, leads, wonDeals, monthLeads, score: wonDeals * 3 + monthLeads * 2 + leads }
      })
    )

    ranking.sort((a, b) => b.score - a.score)
    return reply.send(ranking)
  })
}
