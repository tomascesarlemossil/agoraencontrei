/**
 * Owner Dashboard Routes — Painel exclusivo do proprietário
 *
 * GET /api/v1/owner-dashboard/:ownerId/summary     — Resumo geral
 * GET /api/v1/owner-dashboard/:ownerId/income       — Rendimentos detalhados
 * GET /api/v1/owner-dashboard/:ownerId/statements   — Extratos mensais
 * GET /api/v1/owner-dashboard/:ownerId/properties   — Imóveis do proprietário
 * GET /api/v1/owner-dashboard/:ownerId/valuation    — Valorização do patrimônio
 * GET /api/v1/owner-dashboard/:ownerId/forecast      — Previsão de fluxo de caixa (6 meses)
 */

import type { FastifyInstance } from 'fastify'

export default async function ownerDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /:ownerId/summary — Resumo geral do proprietário
  app.get('/:ownerId/summary', {
    schema: { tags: ['owner-dashboard'], summary: 'Owner dashboard summary' },
  }, async (req, reply) => {
    const { ownerId } = req.params as { ownerId: string }
    const cid = req.user.cid

    // Get owner data
    const owner = await app.prisma.client.findFirst({
      where: { id: ownerId, companyId: cid },
      select: { id: true, name: true, document: true, email: true, phone: true },
    })

    if (!owner) {
      return reply.status(404).send({ error: 'OWNER_NOT_FOUND' })
    }

    // Get active contracts where this client is the landlord
    const contracts = await app.prisma.contract.findMany({
      where: { companyId: cid, landlordId: ownerId, status: 'ACTIVE' },
      include: {
        property: { select: { id: true, title: true, city: true, neighborhood: true, price: true } },
        tenant: { select: { name: true } },
        rentals: {
          where: { status: 'PAID' },
          select: { rentAmount: true, totalAmount: true, paymentDate: true },
          orderBy: { paymentDate: 'desc' },
          take: 12,
        },
      },
    })

    // Calculate totals
    let totalMonthlyIncome = 0
    let totalRentValue = 0
    let totalCommission = 0

    for (const c of contracts) {
      const rent = Number(c.rentValue || 0)
      const commission = Number(c.commission || 0)
      totalRentValue += rent
      totalCommission += rent * (commission / 100)
      totalMonthlyIncome += rent - (rent * (commission / 100))
    }

    // Get paid rentals for the last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const paidRentals = await app.prisma.rental.findMany({
      where: {
        companyId: cid,
        contract: { landlordId: ownerId },
        status: 'PAID',
        paymentDate: { gte: twelveMonthsAgo },
      },
      select: { totalAmount: true, rentAmount: true, paymentDate: true },
      orderBy: { paymentDate: 'asc' },
    })

    const totalReceivedLast12Months = paidRentals.reduce(
      (sum: number, r: any) => sum + Number(r.totalAmount || r.rentAmount || 0),
      0,
    )

    // Count late rentals
    const lateRentals = await app.prisma.rental.count({
      where: {
        companyId: cid,
        contract: { landlordId: ownerId },
        status: 'LATE',
      },
    })

    return reply.send({
      success: true,
      data: {
        owner: { id: owner.id, name: owner.name },
        summary: {
          activeContracts: contracts.length,
          totalMonthlyRent: totalRentValue,
          totalMonthlyCommission: totalCommission,
          netMonthlyIncome: totalMonthlyIncome,
          totalReceivedLast12Months,
          lateRentals,
          occupancyRate: contracts.length > 0 ? 100 : 0, // Simplified
        },
        contracts: contracts.map((c: any) => ({
          id: c.id,
          propertyTitle: c.property?.title || c.propertyAddress,
          tenantName: c.tenant?.name || c.tenantName,
          rentValue: Number(c.rentValue || 0),
          commission: Number(c.commission || 0),
          netValue: Number(c.rentValue || 0) * (1 - Number(c.commission || 0) / 100),
          startDate: c.startDate,
          lastPayments: c.rentals.slice(0, 3).map((r: any) => ({
            amount: Number(r.totalAmount || r.rentAmount || 0),
            date: r.paymentDate,
          })),
        })),
      },
    })
  })

  // GET /:ownerId/income — Rendimentos detalhados mês a mês
  app.get('/:ownerId/income', {
    schema: { tags: ['owner-dashboard'], summary: 'Owner income breakdown' },
  }, async (req, reply) => {
    const { ownerId } = req.params as { ownerId: string }
    const q = req.query as any
    const months = parseInt(q.months ?? '12', 10)
    const cid = req.user.cid

    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const rentals = await app.prisma.rental.findMany({
      where: {
        companyId: cid,
        contract: { landlordId: ownerId },
        dueDate: { gte: startDate },
      },
      include: {
        contract: {
          select: { commission: true, propertyAddress: true, rentValue: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    // Group by month
    const monthlyData: Record<string, {
      month: string
      totalRent: number
      totalPaid: number
      commission: number
      netIncome: number
      pendingCount: number
      paidCount: number
      lateCount: number
    }> = {}

    for (const r of rentals) {
      if (!r.dueDate) continue
      const key = `${r.dueDate.getFullYear()}-${String(r.dueDate.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: key,
          totalRent: 0,
          totalPaid: 0,
          commission: 0,
          netIncome: 0,
          pendingCount: 0,
          paidCount: 0,
          lateCount: 0,
        }
      }

      const amount = Number(r.totalAmount || r.rentAmount || 0)
      const commPct = Number(r.contract?.commission || 0) / 100

      monthlyData[key].totalRent += amount

      if (r.status === 'PAID') {
        const paid = Number(r.paidAmount || amount)
        monthlyData[key].totalPaid += paid
        monthlyData[key].commission += paid * commPct
        monthlyData[key].netIncome += paid * (1 - commPct)
        monthlyData[key].paidCount++
      } else if (r.status === 'LATE') {
        monthlyData[key].lateCount++
      } else {
        monthlyData[key].pendingCount++
      }
    }

    return reply.send({
      success: true,
      data: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
    })
  })

  // GET /:ownerId/statements — Extratos mensais (para download/impressão)
  app.get('/:ownerId/statements', {
    schema: { tags: ['owner-dashboard'], summary: 'Owner monthly statements' },
  }, async (req, reply) => {
    const { ownerId } = req.params as { ownerId: string }
    const q = req.query as any
    const month = parseInt(q.month ?? String(new Date().getMonth() + 1), 10)
    const year = parseInt(q.year ?? String(new Date().getFullYear()), 10)
    const cid = req.user.cid

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const owner = await app.prisma.client.findFirst({
      where: { id: ownerId, companyId: cid },
      select: { name: true, document: true, pixKey: true, bankName: true, bankBranch: true, bankAccount: true },
    })

    const rentals = await app.prisma.rental.findMany({
      where: {
        companyId: cid,
        contract: { landlordId: ownerId },
        dueDate: { gte: startDate, lte: endDate },
      },
      include: {
        contract: {
          select: {
            propertyAddress: true, tenantName: true, commission: true,
            rentValue: true, adminFee: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    const items = rentals.map((r: any) => {
      const amount = Number(r.paidAmount || r.totalAmount || r.rentAmount || 0)
      const commPct = Number(r.contract?.commission || 0) / 100
      const adminPct = Number(r.contract?.adminFee || 0) / 100

      return {
        property: r.contract?.propertyAddress || 'N/A',
        tenant: r.contract?.tenantName || 'N/A',
        dueDate: r.dueDate,
        status: r.status,
        grossValue: amount,
        commission: amount * commPct,
        adminFee: amount * adminPct,
        netValue: amount * (1 - commPct - adminPct),
        paymentDate: r.paymentDate,
        paymentMethod: r.paymentMethod,
      }
    })

    const totals = items.reduce(
      (acc: any, item: any) => ({
        grossValue: acc.grossValue + item.grossValue,
        commission: acc.commission + item.commission,
        adminFee: acc.adminFee + item.adminFee,
        netValue: acc.netValue + item.netValue,
      }),
      { grossValue: 0, commission: 0, adminFee: 0, netValue: 0 },
    )

    return reply.send({
      success: true,
      data: {
        owner,
        period: { month, year },
        items,
        totals,
      },
    })
  })

  // GET /:ownerId/properties — Imóveis do proprietário com status
  app.get('/:ownerId/properties', {
    schema: { tags: ['owner-dashboard'], summary: 'Owner properties with status' },
  }, async (req, reply) => {
    const { ownerId } = req.params as { ownerId: string }
    const cid = req.user.cid

    const contracts = await app.prisma.contract.findMany({
      where: { companyId: cid, landlordId: ownerId },
      include: {
        property: {
          select: {
            id: true, title: true, type: true, status: true,
            city: true, neighborhood: true, street: true, number: true,
            price: true, priceRent: true, coverImage: true,
            totalArea: true, bedrooms: true, bathrooms: true,
          },
        },
        tenant: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({
      success: true,
      data: contracts.map((c: any) => ({
        contractId: c.id,
        contractStatus: c.status,
        property: c.property,
        tenant: c.tenant ? { name: c.tenant.name, phone: c.tenant.phone } : null,
        rentValue: Number(c.rentValue || 0),
        startDate: c.startDate,
        endDate: c.endDate,
      })),
    })
  })

  // GET /:ownerId/forecast — Previsão de fluxo de caixa (6 meses)
  app.get('/:ownerId/forecast', {
    schema: { tags: ['owner-dashboard'], summary: 'Owner 6-month cash flow forecast' },
  }, async (req, reply) => {
    const { ownerId } = req.params as { ownerId: string }
    const cid = req.user.cid

    // Get active contracts
    const contracts = await app.prisma.contract.findMany({
      where: { companyId: cid, landlordId: ownerId, status: 'ACTIVE' },
      select: {
        rentValue: true, commission: true, adminFee: true,
        adjustmentIndex: true, adjustmentPercent: true,
        propertyAddress: true,
      },
    })

    // Historical payment rate (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [paidCount, totalCount] = await Promise.all([
      app.prisma.rental.count({
        where: { companyId: cid, contract: { landlordId: ownerId }, status: 'PAID', dueDate: { gte: sixMonthsAgo } },
      }),
      app.prisma.rental.count({
        where: { companyId: cid, contract: { landlordId: ownerId }, dueDate: { gte: sixMonthsAgo } },
      }),
    ])

    const paymentRate = totalCount > 0 ? paidCount / totalCount : 0.95

    // Generate forecast for next 6 months
    const forecast = []
    const now = new Date()

    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(now)
      futureDate.setMonth(now.getMonth() + i)
      const monthKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`

      let expectedGross = 0
      let expectedNet = 0

      for (const c of contracts) {
        const rent = Number(c.rentValue || 0)
        const commPct = Number(c.commission || 0) / 100
        const adminPct = Number(c.adminFee || 0) / 100
        expectedGross += rent
        expectedNet += rent * (1 - commPct - adminPct)
      }

      // Apply adjustment estimate (IGPM/IPCA ~0.5%/month average)
      const adjustmentFactor = 1 + (0.005 * i)
      expectedGross *= adjustmentFactor
      expectedNet *= adjustmentFactor

      forecast.push({
        month: monthKey,
        expectedGross: Math.round(expectedGross * 100) / 100,
        expectedNet: Math.round(expectedNet * 100) / 100,
        // Pessimistic estimate based on historical payment rate
        pessimisticNet: Math.round(expectedNet * paymentRate * 100) / 100,
        confidence: Math.round(paymentRate * 100),
      })
    }

    return reply.send({
      success: true,
      data: {
        forecast,
        assumptions: {
          activeContracts: contracts.length,
          historicalPaymentRate: Math.round(paymentRate * 100),
          adjustmentEstimate: '0.5% ao mês (média IGPM/IPCA)',
        },
      },
    })
  })
}
