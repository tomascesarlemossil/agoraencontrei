/**
 * SaaS Finance Routes — Transações financeiras da plataforma
 *
 * GET  /api/v1/saas-finance/transactions — Lista transações SaaS
 * GET  /api/v1/saas-finance/summary — Resumo financeiro (cards)
 * GET  /api/v1/saas-finance/intelligence — Métricas master (forecast, canais, etc.)
 * POST /api/v1/saas-finance/sync-payment — Sincroniza pagamento do Asaas com SaasFinancialTransaction
 */

import type { FastifyInstance } from 'fastify'

export default async function saasFinanceRoutes(app: FastifyInstance) {
  const prisma = app.prisma as any

  // ── GET /transactions — Lista transações ────────────────────────────────────
  app.get('/transactions', async (req, reply) => {
    const query = req.query as {
      status?: string; type?: string; limit?: string; offset?: string
    }
    const limit = Math.min(parseInt(query.limit || '50'), 100)
    const offset = parseInt(query.offset || '0')

    const where: any = {}
    if (query.status && query.status !== 'all') where.status = query.status
    if (query.type && query.type !== 'all') where.type = query.type

    const [data, total] = await Promise.all([
      prisma.saasFinancialTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.saasFinancialTransaction.count({ where }),
    ])

    return reply.send({ data, meta: { total, limit, offset } })
  })

  // ── GET /summary — Resumo financeiro (cards topo) ──────────────────────────
  app.get('/summary', async (_req, reply) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [totalPaid, totalPending, totalOverdue, todayPaid, monthPaid, monthPending] = await Promise.all([
      prisma.saasFinancialTransaction.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.saasFinancialTransaction.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
      }),
      prisma.saasFinancialTransaction.aggregate({
        where: { status: 'overdue' },
        _sum: { amount: true },
      }),
      prisma.saasFinancialTransaction.aggregate({
        where: { status: 'paid', paidAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      prisma.saasFinancialTransaction.aggregate({
        where: { status: 'paid', paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.saasFinancialTransaction.aggregate({
        where: { status: 'pending', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ])

    // MRR: sum of active recurring subscriptions
    const activeTenants = await prisma.tenant.findMany({
      where: { planStatus: 'ACTIVE' },
      select: { planPrice: true },
    }).catch(() => [])

    const mrr = activeTenants.reduce((sum: number, t: any) => sum + Number(t.planPrice || 0), 0)

    return reply.send({
      totalReceived: Number(totalPaid._sum.amount || 0),
      totalPending: Number(totalPending._sum.amount || 0),
      totalOverdue: Number(totalOverdue._sum.amount || 0),
      todayReceived: Number(todayPaid._sum.amount || 0),
      monthReceived: Number(monthPaid._sum.amount || 0),
      monthPending: Number(monthPending._sum.amount || 0),
      mrr,
      arr: mrr * 12,
    })
  })

  // ─�� GET /intelligence — Métricas Master (forecast, canais, KPIs) ───────────
  app.get('/intelligence', async (_req, reply) => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()

    // Revenue this month
    const monthRevenue = await prisma.saasFinancialTransaction.aggregate({
      where: { status: 'paid', paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }))

    const monthRevenueVal = Number(monthRevenue._sum.amount || 0)
    const dailyAvg = dayOfMonth > 0 ? monthRevenueVal / dayOfMonth : 0
    const forecast = dailyAvg * daysInMonth

    // Tenants by status
    const tenantStats = await prisma.tenant.groupBy({
      by: ['planStatus'],
      _count: true,
    }).catch(() => [])

    const tenantByStatus: Record<string, number> = {}
    tenantStats.forEach((s: any) => { tenantByStatus[s.planStatus] = s._count })

    // Tenants by plan
    const tenantPlans = await prisma.tenant.groupBy({
      by: ['plan'],
      where: { planStatus: 'ACTIVE' },
      _count: true,
      _sum: { planPrice: true },
    }).catch(() => [])

    // Affiliate stats
    const affiliateTotal = await prisma.affiliateEarning.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }))

    // Active affiliates
    const activeAffiliates = await prisma.affiliate.count({
      where: { isActive: true },
    }).catch(() => 0)

    // MRR
    const activeTenants = await prisma.tenant.findMany({
      where: { planStatus: 'ACTIVE' },
      select: { planPrice: true },
    }).catch(() => [])
    const mrr = activeTenants.reduce((sum: number, t: any) => sum + Number(t.planPrice || 0), 0)

    // Transaction count by type
    const txByType = await prisma.saasFinancialTransaction.groupBy({
      by: ['type'],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }).catch(() => [])

    return reply.send({
      revenue: {
        today: Number((await prisma.saasFinancialTransaction.aggregate({
          where: { status: 'paid', paidAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
          _sum: { amount: true },
        }).catch(() => ({ _sum: { amount: 0 } })))._sum.amount || 0),
        month: monthRevenueVal,
        mrr,
        arr: mrr * 12,
        forecast: Math.round(forecast * 100) / 100,
        dailyAvg: Math.round(dailyAvg * 100) / 100,
      },
      tenants: {
        byStatus: tenantByStatus,
        byPlan: tenantPlans.map((p: any) => ({
          plan: p.plan,
          count: p._count,
          revenue: Number(p._sum.planPrice || 0),
        })),
        total: Object.values(tenantByStatus).reduce((a: number, b: number) => a + b, 0),
        active: tenantByStatus.ACTIVE || 0,
      },
      affiliates: {
        active: activeAffiliates,
        monthCommissions: Number(affiliateTotal._sum.amount || 0),
        monthTransactions: affiliateTotal._count,
      },
      transactions: {
        byType: txByType.map((t: any) => ({
          type: t.type,
          count: t._count,
          total: Number(t._sum.amount || 0),
        })),
      },
    })
  })

  // ── POST /sync-payment — Sincroniza pagamento Asaas → SaasFinancialTransaction
  app.post('/sync-payment', async (req, reply) => {
    const body = req.body as {
      asaasId: string
      tenantId?: string
      type: string
      status: string
      amount: number
      dueDate?: string
      description?: string
      externalRef?: string
      billingType?: string
      pixCode?: string
      bankSlipUrl?: string
      affiliateId?: string
      commissionAmount?: number
    }

    if (!body.asaasId || !body.type || !body.amount) {
      return reply.status(400).send({ error: 'asaasId, type, amount obrigatórios' })
    }

    // Upsert by asaasId
    const existing = await prisma.saasFinancialTransaction.findFirst({
      where: { asaasId: body.asaasId },
    }).catch(() => null)

    const data: any = {
      asaasId: body.asaasId,
      tenantId: body.tenantId || null,
      type: body.type,
      status: body.status,
      amount: body.amount,
      netAmount: body.commissionAmount
        ? body.amount - body.commissionAmount
        : body.amount,
      commissionAmount: body.commissionAmount || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      paidAt: body.status === 'paid' ? new Date() : null,
      description: body.description || null,
      externalRef: body.externalRef || null,
      billingType: body.billingType || null,
      pixCode: body.pixCode || null,
      bankSlipUrl: body.bankSlipUrl || null,
      affiliateId: body.affiliateId || null,
    }

    let tx
    if (existing) {
      tx = await prisma.saasFinancialTransaction.update({
        where: { id: existing.id },
        data,
      })
    } else {
      tx = await prisma.saasFinancialTransaction.create({ data })
    }

    // If paid and has affiliate, create earning
    if (body.status === 'paid' && body.affiliateId && body.commissionAmount) {
      await prisma.affiliateEarning.create({
        data: {
          affiliateId: body.affiliateId,
          tenantId: body.tenantId || null,
          transactionId: tx.id,
          amount: body.commissionAmount,
          grossValue: body.amount,
          status: 'pending',
          description: body.description || 'Comissão de indicação',
        },
      }).catch(() => {})

      // Update affiliate totals
      await prisma.affiliate.update({
        where: { id: body.affiliateId },
        data: {
          pendingEarnings: { increment: body.commissionAmount },
          totalEarnings: { increment: body.commissionAmount },
        },
      }).catch(() => {})

      await prisma.auditLog.create({
        data: {
          companyId: 'platform',
          action: 'affiliate.earning.created',
          resource: 'affiliate_earning',
          resourceId: body.affiliateId,
          payload: { amount: body.commissionAmount, tenantId: body.tenantId },
        },
      }).catch(() => {})
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        companyId: 'platform',
        action: existing ? 'finance.transaction.updated' : 'finance.transaction.created',
        resource: 'saas_financial_transaction',
        resourceId: tx.id,
        payload: { asaasId: body.asaasId, type: body.type, status: body.status, amount: body.amount },
      },
    }).catch(() => {})

    return reply.send({ data: tx })
  })
}
