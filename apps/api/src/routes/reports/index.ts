import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const PeriodQuery = z.object({
  year:  z.coerce.number().int().default(new Date().getFullYear()),
  month: z.coerce.number().int().min(1).max(12).optional(),
})

export default async function reportsRoutes(app: FastifyInstance) {
  // All reports require at least manager level
  app.addHook('preHandler', async (req, reply) => {
    await app.authenticate(req, reply)
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCIAL'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
  })

  // GET /api/v1/reports/overview — Lemosbank main KPIs
  app.get('/overview', {
    schema: { tags: ['reports'], summary: 'Lemosbank financial overview' },
  }, async (req, reply) => {
    const q = PeriodQuery.parse(req.query)
    const cid = req.user.cid

    const startDate = q.month
      ? new Date(q.year, q.month - 1, 1)
      : new Date(q.year, 0, 1)
    const endDate = q.month
      ? new Date(q.year, q.month, 0, 23, 59, 59)
      : new Date(q.year, 11, 31, 23, 59, 59)

    const periodWhere = { companyId: cid, createdAt: { gte: startDate, lte: endDate } }

    const [
      totalDeals,
      closedWon,
      closedLost,
      openDeals,
      dealValues,
      commissions,
      pendingCommissions,
      paidCommissions,
      brokerPerformance,
      dealsByMonth,
      recentDeals,
    ] = await Promise.all([
      app.prisma.deal.count({ where: { companyId: cid } }),
      app.prisma.deal.count({ where: { companyId: cid, status: 'CLOSED_WON' } }),
      app.prisma.deal.count({ where: { companyId: cid, status: 'CLOSED_LOST' } }),
      app.prisma.deal.count({ where: { companyId: cid, status: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } }),

      // Sum of closed deal values in period
      app.prisma.deal.aggregate({
        where: { companyId: cid, status: 'CLOSED_WON', closedAt: { gte: startDate, lte: endDate } },
        _sum: { value: true },
        _count: true,
      }),

      // All commissions in period
      app.prisma.commission.aggregate({
        where: { companyId: cid, createdAt: { gte: startDate, lte: endDate } },
        _sum: { grossValue: true, netValue: true, paidAmount: true },
        _count: true,
      }),

      // Pending commissions
      app.prisma.commission.aggregate({
        where: { companyId: cid, status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { netValue: true },
        _count: true,
      }),

      // Paid commissions in period
      app.prisma.commission.aggregate({
        where: { companyId: cid, status: 'PAID', paidAt: { gte: startDate, lte: endDate } },
        _sum: { netValue: true, paidAmount: true },
        _count: true,
      }),

      // Top brokers by deal count + value
      app.prisma.deal.groupBy({
        by: ['brokerId'],
        where: { companyId: cid, status: 'CLOSED_WON', closedAt: { gte: startDate, lte: endDate } },
        _count: true,
        _sum: { value: true },
        orderBy: { _count: { brokerId: 'desc' } },
        take: 10,
      }),

      // Deals closed per month for chart
      app.prisma.$queryRaw<Array<{ month: string; count: bigint; total: string | null }>>`
        SELECT
          TO_CHAR("closedAt", 'YYYY-MM') AS month,
          COUNT(*)::bigint                AS count,
          SUM(value)::text                AS total
        FROM deals
        WHERE "companyId" = ${cid}
          AND status = 'CLOSED_WON'
          AND "closedAt" >= ${startDate}
          AND "closedAt" <= ${endDate}
        GROUP BY month
        ORDER BY month
      `,

      // Last 5 closed deals
      app.prisma.deal.findMany({
        where: { companyId: cid, status: 'CLOSED_WON' },
        include: {
          broker: { select: { id: true, name: true, avatarUrl: true } },
          contact: { select: { id: true, name: true } },
        },
        orderBy: { closedAt: 'desc' },
        take: 5,
      }),
    ])

    // Resolve broker names
    const brokerIds = brokerPerformance.map((b) => b.brokerId)
    const brokers = await app.prisma.user.findMany({
      where: { id: { in: brokerIds } },
      select: { id: true, name: true, avatarUrl: true },
    })
    const brokerMap = Object.fromEntries(brokers.map((b) => [b.id, b]))

    const conversionRate = (totalDeals > 0)
      ? ((closedWon / totalDeals) * 100).toFixed(1)
      : '0.0'

    return reply.send({
      period: { year: q.year, month: q.month, startDate, endDate },
      deals: {
        total: totalDeals,
        closedWon,
        closedLost,
        open: openDeals,
        conversionRate: parseFloat(conversionRate),
        closedValue: Number(dealValues._sum.value ?? 0),
        closedCount: dealValues._count,
      },
      commissions: {
        total: commissions._count,
        grossTotal: Number(commissions._sum.grossValue ?? 0),
        netTotal: Number(commissions._sum.netValue ?? 0),
        paid: Number(paidCommissions._sum.paidAmount ?? 0),
        pending: Number(pendingCommissions._sum.netValue ?? 0),
        pendingCount: pendingCommissions._count,
      },
      brokerRanking: brokerPerformance.map((b) => ({
        broker: brokerMap[b.brokerId] ?? { id: b.brokerId, name: 'Unknown' },
        dealsCount: b._count,
        totalValue: Number(b._sum.value ?? 0),
      })),
      dealsByMonth: dealsByMonth.map((row) => ({
        month: row.month,
        count: Number(row.count),
        total: Number(row.total ?? 0),
      })),
      recentDeals,
    })
  })

  // GET /api/v1/reports/commissions — full commission list
  app.get('/commissions', {
    schema: { tags: ['reports'], summary: 'Commission ledger' },
  }, async (req, reply) => {
    const q = z.object({
      page:     z.coerce.number().int().min(1).default(1),
      limit:    z.coerce.number().int().min(1).max(100).default(20),
      status:   z.string().optional(),
      brokerId: z.string().optional(),
    }).parse(req.query)

    const where: any = { companyId: req.user.cid }
    if (q.status)   where.status = q.status.toUpperCase()
    if (q.brokerId) where.brokerId = q.brokerId

    const [total, items] = await Promise.all([
      app.prisma.commission.count({ where }),
      app.prisma.commission.findMany({
        where,
        include: {
          broker: { select: { id: true, name: true, avatarUrl: true } },
          deal:   { select: { id: true, title: true, type: true, value: true } },
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

  // GET /api/v1/reports/leads — lead funnel report by period
  app.get('/leads', {
    schema: { tags: ['reports'], summary: 'Lead funnel report' },
  }, async (req, reply) => {
    const q = PeriodQuery.parse(req.query)
    const cid = req.user.cid

    const startDate = q.month
      ? new Date(q.year, q.month - 1, 1)
      : new Date(q.year, 0, 1)
    const endDate = q.month
      ? new Date(q.year, q.month, 0, 23, 59, 59)
      : new Date(q.year, 11, 31, 23, 59, 59)

    const periodWhere = { companyId: cid, createdAt: { gte: startDate, lte: endDate } }

    const [
      total,
      byStatus,
      bySource,
      byBroker,
      byMonth,
      recentLeads,
    ] = await Promise.all([
      app.prisma.lead.count({ where: periodWhere }),

      // Count by status
      app.prisma.lead.groupBy({
        by: ['status'],
        where: periodWhere,
        _count: { id: true },
      }),

      // Count by source
      app.prisma.lead.groupBy({
        by: ['source'],
        where: periodWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Count by broker
      app.prisma.lead.groupBy({
        by: ['brokerId'],
        where: { ...periodWhere, brokerId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Leads per month for chart
      app.prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') AS month, COUNT(*)::bigint AS count
        FROM leads
        WHERE "companyId" = ${cid}
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY month ORDER BY month
      `,

      // 5 most recent
      app.prisma.lead.findMany({
        where: periodWhere,
        select: { id: true, name: true, phone: true, source: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    // Resolve broker names
    const brokerIds = byBroker.map(b => b.brokerId).filter(Boolean) as string[]
    const brokers = await app.prisma.user.findMany({
      where: { id: { in: brokerIds } },
      select: { id: true, name: true, avatarUrl: true },
    })
    const brokerMap = Object.fromEntries(brokers.map(b => [b.id, b]))

    return reply.send({
      period: { year: q.year, month: q.month, startDate, endDate },
      total,
      byStatus:  byStatus.map(r => ({ status: r.status, count: r._count.id })),
      bySource:  bySource.map(r => ({ source: r.source, count: r._count.id })),
      byBroker:  byBroker.map(r => ({
        broker: brokerMap[r.brokerId!] ?? { id: r.brokerId, name: 'Sem corretor' },
        count: r._count.id,
      })),
      byMonth:   byMonth.map(r => ({ month: r.month, count: Number(r.count) })),
      recentLeads,
    })
  })

  // GET /api/v1/reports/broker/:id — individual broker report
  app.get('/broker/:id', {
    schema: { tags: ['reports'], summary: 'Broker performance report' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const q = PeriodQuery.parse(req.query)

    const startDate = q.month ? new Date(q.year, q.month - 1, 1) : new Date(q.year, 0, 1)
    const endDate   = q.month ? new Date(q.year, q.month, 0, 23, 59, 59) : new Date(q.year, 11, 31, 23, 59, 59)

    const broker = await app.prisma.user.findFirst({
      where: { id, companyId: req.user.cid },
      select: { id: true, name: true, avatarUrl: true, creciNumber: true, email: true },
    })
    if (!broker) return reply.status(404).send({ error: 'NOT_FOUND' })

    const [deals, commissionSummary, leadCount, propertyCount] = await Promise.all([
      app.prisma.deal.findMany({
        where: { brokerId: id, companyId: req.user.cid, createdAt: { gte: startDate, lte: endDate } },
        select: { id: true, title: true, status: true, value: true, closedAt: true, type: true },
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.commission.aggregate({
        where: { brokerId: id, companyId: req.user.cid, createdAt: { gte: startDate, lte: endDate } },
        _sum: { grossValue: true, netValue: true, paidAmount: true },
        _count: true,
      }),
      app.prisma.lead.count({
        where: { brokerId: id, companyId: req.user.cid, createdAt: { gte: startDate, lte: endDate } },
      }),
      app.prisma.property.count({
        where: { userId: id, companyId: req.user.cid },
      }),
    ])

    const closedWon = deals.filter((d) => d.status === 'CLOSED_WON')

    return reply.send({
      broker,
      period: { year: q.year, month: q.month },
      summary: {
        totalDeals: deals.length,
        closedWon: closedWon.length,
        totalValue: closedWon.reduce((s, d) => s + Number(d.value ?? 0), 0),
        leads: leadCount,
        properties: propertyCount,
      },
      commissions: {
        count: commissionSummary._count,
        gross: Number(commissionSummary._sum.grossValue ?? 0),
        net: Number(commissionSummary._sum.netValue ?? 0),
        paid: Number(commissionSummary._sum.paidAmount ?? 0),
      },
      deals,
    })
  })
}
