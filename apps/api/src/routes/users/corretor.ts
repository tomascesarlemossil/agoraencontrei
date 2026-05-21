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

  // GET /api/v1/corretor/today — vista enxuta do dia para uso mobile.
  // Próxima visita destacada + agenda do dia + leads novos + KPIs.
  app.get('/today', async (req, reply) => {
    const userId = req.user.sub
    const cid    = req.user.cid
    const now    = new Date()
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0)
    const dayEnd   = new Date(now); dayEnd.setHours(23, 59, 59, 999)

    const [todayVisits, nextVisit, newLeadsToday, pendingTasks] = await Promise.all([
      app.prisma.propertyVisit.findMany({
        where: {
          companyId: cid,
          brokerId: userId,
          scheduledAt: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 50,
      }),
      app.prisma.propertyVisit.findFirst({
        where: {
          companyId: cid,
          brokerId: userId,
          status: { in: ['pending', 'confirmed'] },
          scheduledAt: { gte: now },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      app.prisma.lead.findMany({
        where: {
          companyId: cid,
          assignedToId: userId,
          createdAt: { gte: dayStart },
        },
        select: { id: true, name: true, phone: true, email: true, status: true, source: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      app.prisma.activity.count({
        where: {
          companyId: cid, userId,
          type: 'task',
          scheduledAt: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    // Enrich visits with property title for the agenda display.
    const propIds = [...new Set([
      ...todayVisits.map(v => v.propertyId),
      ...(nextVisit ? [nextVisit.propertyId] : []),
    ])]
    const props = propIds.length
      ? await app.prisma.property.findMany({
          where: { id: { in: propIds } },
          select: { id: true, title: true, slug: true, street: true, number: true, neighborhood: true, city: true, latitude: true, longitude: true },
        }).catch(() => [])
      : []
    const propById = new Map(props.map(p => [p.id, p]))

    function mapsUrl(p: typeof props[number] | undefined) {
      if (!p) return null
      if (p.latitude && p.longitude) {
        return `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`
      }
      const addr = [p.street && p.number ? `${p.street}, ${p.number}` : p.street, p.neighborhood, p.city]
        .filter(Boolean).join(', ')
      return addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : null
    }

    // Top leads quentes que NÃO receberam pitch hoje. "Pitch" = qualquer
    // Activity tipo whatsapp/call/email registrada hoje.
    const hotCandidates = await app.prisma.lead.findMany({
      where: {
        companyId: cid,
        assignedToId: userId,
        score: { gte: 51 },
        status: { notIn: ['WON', 'LOST', 'ARCHIVED'] },
      },
      select: { id: true, name: true, phone: true, score: true, status: true, interest: true, budget: true },
      orderBy: { score: 'desc' },
      take: 20,
    })

    let topHotLeads: typeof hotCandidates = []
    if (hotCandidates.length > 0) {
      const pitchedIds = new Set<string>(
        (await app.prisma.activity.findMany({
          where: {
            companyId: cid, userId,
            leadId: { in: hotCandidates.map(l => l.id) },
            type: { in: ['whatsapp', 'call', 'email'] },
            createdAt: { gte: dayStart },
          },
          select: { leadId: true },
        }).catch(() => [])).map(a => a.leadId).filter((id): id is string => !!id),
      )
      topHotLeads = hotCandidates.filter(l => !pitchedIds.has(l.id)).slice(0, 2)
    }

    return reply.send({
      now: now.toISOString(),
      nextVisit: nextVisit
        ? { ...nextVisit, property: propById.get(nextVisit.propertyId) ?? null, mapsUrl: mapsUrl(propById.get(nextVisit.propertyId)) }
        : null,
      todayVisits: todayVisits.map(v => ({
        ...v,
        property: propById.get(v.propertyId) ?? null,
        mapsUrl: mapsUrl(propById.get(v.propertyId)),
      })),
      newLeadsToday,
      topHotLeads,
      kpis: {
        visitsToday: todayVisits.length,
        leadsToday: newLeadsToday.length,
        pendingTasks,
      },
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
