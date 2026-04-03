import type { FastifyInstance } from 'fastify'
import nodemailer from 'nodemailer'
import { createCharge, findOrCreateCustomer } from '../../services/asaas.service.js'
import { env } from '../../utils/env.js'
import { createAuditLog } from '../../services/audit.service.js'

export default async function financeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/finance/summary — receita, despesas, saldo, inadimplência do mês de referência (latestTx)
  app.get('/summary', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()

    // Find most recent month with actual transaction data
    const latestTx = await app.prisma.transaction.findFirst({
      where: { companyId: cid },
      orderBy: { transactionDate: 'desc' },
      select: { transactionDate: true },
    })
    // If latestTx is older than 45 days (legacy import), use current month instead
    const STALE_THRESHOLD_MS = 45 * 24 * 60 * 60 * 1000
    const isStaleData = !latestTx || (now.getTime() - latestTx.transactionDate.getTime()) > STALE_THRESHOLD_MS
    const refDate  = isStaleData ? now : latestTx!.transactionDate
    const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
    const monthEnd   = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59)

    const next30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [
      income,
      expenses,
      activeContracts,
      totalClients,
      lateRentals,
      totalRentals,
      upcomingRentals,
      // UnilocWeb stats
      newContractsThisMonth,
      contractsFinishedThisMonth,
      contractsExpiringSoon,
      contractsWithRepasse,
      totalContracts,
      finishedContracts,
      canceledContracts,
      contractsWithIptu,
      lateRentalsList,
      pendingRentalsSum,
      paidRentalsSum,
    ] = await Promise.all([
      // Receita do mês (transações INCOME)
      app.prisma.transaction.aggregate({
        where: { companyId: cid, type: 'INCOME', transactionDate: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      // Despesas do mês (transações EXPENSE)
      app.prisma.transaction.aggregate({
        where: { companyId: cid, type: 'EXPENSE', transactionDate: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      // Contratos ativos
      app.prisma.contract.count({ where: { companyId: cid, status: 'ACTIVE' } }),
      // Total de clientes
      app.prisma.client.count({ where: { companyId: cid } }),
      // Aluguéis em atraso (todos os LATE — representa inadimplência acumulada real)
      app.prisma.rental.count({ where: { companyId: cid, status: 'LATE' } }),
      // Total geral de aluguéis (base para calcular % inadimplência)
      app.prisma.rental.count({ where: { companyId: cid } }),
      // Próximos vencimentos (próximos 30 dias)
      app.prisma.rental.findMany({
        where: {
          companyId: cid,
          status: 'PENDING',
          dueDate: { gte: now, lte: next30 },
        },
        include: {
          contract: {
            select: { tenantName: true, propertyAddress: true, landlordName: true },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      // Contratos novos no mês
      app.prisma.contract.count({
        where: { companyId: cid, createdAt: { gte: monthStart, lte: monthEnd } },
      }),
      // Contratos encerrados no mês (rescisão ou status FINISHED atualizado no mês)
      app.prisma.contract.count({
        where: {
          companyId: cid,
          status: 'FINISHED',
          OR: [
            { rescissionDate: { gte: monthStart, lte: monthEnd } },
            { updatedAt:      { gte: monthStart, lte: monthEnd } },
          ],
        },
      }),
      // Contratos a vencer nos próximos 30 dias (rescisão agendada)
      app.prisma.contract.count({
        where: {
          companyId: cid,
          status: 'ACTIVE',
          rescissionDate: { gte: now, lte: next30 },
        },
      }),
      // Contratos ativos com repasse (landlordDueDay configurado)
      app.prisma.contract.count({
        where: { companyId: cid, status: 'ACTIVE', landlordDueDay: { not: null } },
      }),
      // Total geral de contratos
      app.prisma.contract.count({ where: { companyId: cid } }),
      // Contratos encerrados (total)
      app.prisma.contract.count({ where: { companyId: cid, status: 'FINISHED' } }),
      // Contratos cancelados
      app.prisma.contract.count({ where: { companyId: cid, status: 'CANCELED' } }),
      // Contratos ativos com IPTU (imóveis identificados)
      app.prisma.contract.count({
        where: { companyId: cid, status: 'ACTIVE', iptuCode: { not: null } },
      }),
      // Lista de aluguéis em atraso (para tarefas)
      app.prisma.rental.findMany({
        where: { companyId: cid, status: 'LATE' },
        include: {
          contract: { select: { tenantName: true, propertyAddress: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      // Cobranças a receber (aluguéis PENDING)
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PENDING' },
        _sum: { totalAmount: true },
      }),
      // Cobranças recebidas no período de referência (aluguéis PAID no período)
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PAID', paymentDate: { gte: monthStart, lte: monthEnd } },
        _sum: { totalAmount: true },
      }),
    ])

    // Receita esperada do mês (contratos ativos * valor do aluguel)
    const expectedIncome = await app.prisma.contract.aggregate({
      where: { companyId: cid, status: 'ACTIVE' },
      _sum: { rentValue: true },
    })

    const totalIncome   = Number(income._sum.amount   ?? 0)
    const totalExpenses = Number(expenses._sum.amount ?? 0)
    const balance       = totalIncome - totalExpenses
    const inadimplencia = totalRentals > 0 ? (lateRentals / totalRentals) * 100 : 0

    return reply.send({
      period: { start: monthStart, end: monthEnd, isLegacy: isStaleData && !!latestTx },
      income:           totalIncome,
      expenses:         totalExpenses,
      balance,
      expectedIncome:   Number(expectedIncome._sum.rentValue ?? 0),
      activeContracts,
      totalClients,
      lateRentals,
      totalRentals,
      inadimplencia:    Math.round(inadimplencia * 10) / 10,
      upcomingRentals,
      // UnilocWeb stats
      newContractsThisMonth,
      contractsFinishedThisMonth,
      contractsExpiringSoon,
      contractsWithRepasse,
      totalContracts,
      finishedContracts,
      canceledContracts,
      contractsWithIptu,
      lateRentalsList,
      cobrancasAReceber: Number(pendingRentalsSum._sum.totalAmount ?? 0),
      cobrancasRecebidas: Number(paidRentalsSum._sum.totalAmount ?? 0),
    })
  })

  // GET /api/v1/finance/commissions — alias for reports/commissions (comissões de corretores)
  app.get('/commissions', async (req, reply) => {
    const { z } = await import('zod')
    const q = z.object({
      page:     z.coerce.number().int().min(1).default(1),
      limit:    z.coerce.number().int().min(1).max(100).default(20),
      status:   z.string().optional(),
      brokerId: z.string().optional(),
    }).parse(req.query)

    const where: any = { companyId: req.user.cid }
    if (q.status)   where.status   = q.status.toUpperCase()
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

  // GET /api/v1/finance/cashflow — fluxo dos últimos 12 meses (Transaction + forecast de contratos)
  app.get('/cashflow', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()

    // Use most recent month with actual data; fall back to current month if legacy (>45 days old)
    const latestTx = await app.prisma.transaction.findFirst({
      where: { companyId: cid },
      orderBy: { transactionDate: 'desc' },
      select: { transactionDate: true },
    })
    const STALE_THRESHOLD_MS = 45 * 24 * 60 * 60 * 1000
    const isStaleData = !latestTx || (now.getTime() - latestTx.transactionDate.getTime()) > STALE_THRESHOLD_MS
    const refDate = isStaleData ? now : latestTx!.transactionDate

    // Gera os últimos 12 meses a partir da data mais recente com dados
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - (11 - i), 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) }
    })

    const chartData = await Promise.all(months.map(async ({ year, month, label }) => {
      const start = new Date(year, month - 1, 1)
      const end   = new Date(year, month, 0, 23, 59, 59)

      const [income, expenses, forecasts] = await Promise.all([
        app.prisma.transaction.aggregate({
          where: { companyId: cid, type: 'INCOME', transactionDate: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        app.prisma.transaction.aggregate({
          where: { companyId: cid, type: 'EXPENSE', transactionDate: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        app.prisma.financialForecast.aggregate({
          where: { companyId: cid, year, month },
          _sum: { amount: true },
        }),
      ])

      const realized = Number(income._sum.amount ?? 0)
      const spent    = Number(expenses._sum.amount ?? 0)
      const forecast = Number(forecasts._sum.amount ?? 0)

      return {
        label,
        year,
        month,
        income:   realized,
        expenses: spent,
        balance:  realized - spent,
        forecast,
      }
    }))

    // Contratos ativos como previsão para meses futuros
    const activeContractsTotal = await app.prisma.contract.aggregate({
      where: { companyId: cid, status: 'ACTIVE' },
      _sum: { rentValue: true },
    })
    const monthlyForecast = Number(activeContractsTotal._sum.rentValue ?? 0)

    return reply.send({ data: chartData, monthlyForecast })
  })

  // GET /api/v1/finance/contracts — contratos paginados com info de aluguel
  app.get('/contracts', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '50', 10)
    const status = q.status  // ACTIVE | FINISHED | CANCELED | '' (all)
    const search = q.search

    const where: any = {
      companyId: cid,
      ...(status && { status }),
      ...(search && {
        OR: [
          { tenantName:   { contains: search, mode: 'insensitive' } },
          { landlordName: { contains: search, mode: 'insensitive' } },
          { propertyAddress: { contains: search, mode: 'insensitive' } },
          { legacyId: { contains: search } },
        ],
      }),
    }

    const [total, items] = await Promise.all([
      app.prisma.contract.count({ where }),
      app.prisma.contract.findMany({
        where,
        include: {
          tenant:   { select: { id: true, name: true, phone: true, email: true } },
          landlord: { select: { id: true, name: true, phone: true } },
          property: { select: { id: true, reference: true, type: true, street: true, neighborhood: true, city: true, status: true } },
          _count:   { select: { documents: true } },
        },
        orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/finance/contracts/:id — detalhe completo do contrato
  app.get('/contracts/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const contract = await app.prisma.contract.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        tenant:   { select: { id: true, name: true, phone: true, email: true, document: true, roles: true } },
        landlord: { select: { id: true, name: true, phone: true, email: true, document: true, roles: true } },
        property: { select: { id: true, reference: true, type: true, street: true, neighborhood: true, city: true, status: true, slug: true } },
        documents: {
          select: { id: true, name: true, type: true, category: true, month: true, year: true, mimeType: true, fileSize: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        rentals: {
          orderBy: { dueDate: 'desc' },
          take: 36,
        },
      },
    })
    if (!contract) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(contract)
  })

  // GET /api/v1/finance/clients — clientes legados paginados
  app.get('/clients', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '50', 10)
    const role   = q.role   // TENANT | LANDLORD | GUARANTOR | BENEFICIARY | LEAD
    const search = q.search

    const where: any = {
      companyId: cid,
      ...(role && { roles: { has: role } }),
      ...(search && {
        OR: [
          { name:       { contains: search, mode: 'insensitive' } },
          { document:   { contains: search } },
          { email:      { contains: search, mode: 'insensitive' } },
          { phone:      { contains: search } },
          { phoneMobile: { contains: search } },
          { legacyId:   { contains: search } },
        ],
      }),
    }

    const [total, items] = await Promise.all([
      app.prisma.client.count({ where }),
      app.prisma.client.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/finance/clients/:id
  app.get('/clients/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const client = await app.prisma.client.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        contractsAsTenant: {
          orderBy: { startDate: 'desc' },
          take: 50,
          include: {
            landlord:  { select: { id: true, name: true, phone: true } },
            property:  { select: { id: true, reference: true, type: true, title: true, neighborhood: true, city: true } },
            _count:    { select: { documents: true } },
          },
        },
        contractsAsLandlord: {
          orderBy: { startDate: 'desc' },
          take: 50,
          include: {
            tenant:   { select: { id: true, name: true, phone: true } },
            property: { select: { id: true, reference: true, type: true, title: true, neighborhood: true, city: true } },
            _count:   { select: { documents: true } },
          },
        },
        contractsAsGuarantor: {
          orderBy: { startDate: 'desc' },
          take: 20,
          include: {
            property: { select: { id: true, reference: true, type: true, title: true } },
          },
        },
        documents: {
          select: { id: true, name: true, type: true, month: true, year: true, mimeType: true, fileSize: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })
    if (!client) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Also fetch leads by email/phone match (cross-reference)
    const leadsWhere: any = { companyId: req.user.cid }
    if ((client as any).email || (client as any).phoneMobile || (client as any).phone) {
      leadsWhere.OR = [
        ...((client as any).email ? [{ email: { contains: (client as any).email, mode: 'insensitive' } }] : []),
        ...((client as any).phoneMobile ? [{ phone: { contains: (client as any).phoneMobile } }] : []),
        ...((client as any).phone ? [{ phone: { contains: (client as any).phone } }] : []),
      ]
    }
    const leads = leadsWhere.OR?.length > 0
      ? await app.prisma.lead.findMany({
          where: leadsWhere,
          select: { id: true, name: true, email: true, phone: true, status: true, notes: true, metadata: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      : []

    return reply.send({ ...client, leads })
  })

  // GET /api/v1/finance/rentals — aluguéis paginados com info de contrato
  app.get('/rentals', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const page   = parseInt(q.page   ?? '1',  10)
    const limit  = parseInt(q.limit  ?? '30', 10)
    const status = q.status  // PENDING | LATE | PAID
    const month  = q.month   // YYYY-MM filter
    const search = q.search

    const now = new Date()
    let monthFilter: any = undefined
    if (month) {
      const [y, m] = month.split('-').map(Number)
      monthFilter = {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      }
    } else if (!status || status === 'PENDING' || status === 'LATE') {
      // Default: show current month + overdue
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      monthFilter = { lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) } // next 60 days
    }

    const where: any = {
      companyId: cid,
      ...(status && { status }),
      ...(monthFilter && { dueDate: monthFilter }),
      ...(search && {
        contract: {
          OR: [
            { tenantName:      { contains: search, mode: 'insensitive' } },
            { landlordName:    { contains: search, mode: 'insensitive' } },
            { propertyAddress: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    }

    const [total, items] = await Promise.all([
      app.prisma.rental.count({ where }),
      app.prisma.rental.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true,
              legacyId: true,
              propertyAddress: true,
              tenantName: true,
              landlordName: true,
              commission: true,
              tenantDueDay: true,
              tenant:   { select: { id: true, name: true, phone: true } },
              landlord: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/finance/repasses — contratos ativos com repasse (proprietário a receber)
  app.get('/repasses', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const q = req.query as Record<string, string>
    const search = q.search

    const where: any = {
      companyId: cid,
      status: 'ACTIVE',
      landlordDueDay: { not: null },
      ...(search && {
        OR: [
          { tenantName:      { contains: search, mode: 'insensitive' } },
          { landlordName:    { contains: search, mode: 'insensitive' } },
          { propertyAddress: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const contracts = await app.prisma.contract.findMany({
      where,
      include: {
        landlord: {
          select: { id: true, name: true, phone: true, email: true, document: true },
        },
        tenant: {
          select: { id: true, name: true, phone: true },
        },
        // Last rental for this contract to check repasse status
        rentals: {
          where: { dueDate: { gte: monthStart, lte: monthEnd } },
          orderBy: { dueDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { landlordDueDay: 'asc' },
    })

    // Calculate repasse value for each contract
    const result = contracts.map(c => {
      const rentValue    = Number(c.rentValue ?? 0)
      const commission   = Number(c.commission ?? 0) // % commission
      const repasseValue = commission > 0
        ? rentValue - (rentValue * commission / 100)
        : rentValue
      const thisMonthRental = c.rentals[0] ?? null

      return {
        id:              c.id,
        legacyId:        c.legacyId,
        propertyAddress: c.propertyAddress,
        landlordName:    c.landlord?.name ?? c.landlordName,
        tenantName:      c.tenant?.name   ?? c.tenantName,
        landlord:        c.landlord,
        tenant:          c.tenant,
        rentValue,
        commission,
        repasseValue:    Math.round(repasseValue * 100) / 100,
        landlordDueDay:  c.landlordDueDay,
        tenantDueDay:    c.tenantDueDay,
        adjustmentIndex: c.adjustmentIndex,
        thisMonthRental: thisMonthRental ? {
          id:          thisMonthRental.id,
          status:      thisMonthRental.status,
          totalAmount: Number(thisMonthRental.totalAmount ?? 0),
          paidAmount:  Number(thisMonthRental.paidAmount  ?? 0),
          paymentDate: thisMonthRental.paymentDate,
          dueDate:     thisMonthRental.dueDate,
        } : null,
        repassePaid: thisMonthRental?.status === 'PAID',
      }
    })

    const totalRepasseAReceber  = result.filter(r => !r.repassePaid).reduce((s, r) => s + r.repasseValue, 0)
    const totalRepassePago      = result.filter(r =>  r.repassePaid).reduce((s, r) => s + r.repasseValue, 0)

    return reply.send({
      data: result,
      meta: {
        total: result.length,
        totalRepasseAReceber:  Math.round(totalRepasseAReceber  * 100) / 100,
        totalRepassePago:      Math.round(totalRepassePago      * 100) / 100,
      },
    })
  })

  // POST /api/v1/finance/contracts/:id/rescisao — registrar rescisão/encerramento
  app.post('/contracts/:id/rescisao', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as {
      rescissionDate?: string
      status?: 'FINISHED' | 'CANCELED'
      notes?: string
    }

    const contract = await app.prisma.contract.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!contract) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (contract.status !== 'ACTIVE') return reply.status(400).send({ error: 'CONTRACT_NOT_ACTIVE' })

    const updated = await app.prisma.contract.update({
      where: { id },
      data: {
        status:         body.status ?? 'FINISHED',
        isActive:       false,
        rescissionDate: body.rescissionDate ? new Date(body.rescissionDate) : new Date(),
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'contract.rescission',
      resource: 'contract',
      resourceId: id,
      before: { status: contract.status, isActive: contract.isActive },
      after:  { status: updated.status, isActive: false, rescissionDate: updated.rescissionDate },
    })

    return reply.send(updated)
  })

  // POST /api/v1/finance/rentals/:id/pay — registrar pagamento manual de aluguel
  app.post('/rentals/:id/pay', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as {
      paidAmount?: number
      paymentDate?: string
    }

    const rental = await app.prisma.rental.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!rental) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.rental.update({
      where: { id },
      data: {
        status:      'PAID',
        paidAmount:  body.paidAmount   ?? Number(rental.totalAmount ?? rental.rentAmount ?? 0),
        paymentDate: body.paymentDate  ? new Date(body.paymentDate) : new Date(),
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'rental.pay',
      resource: 'rental',
      resourceId: id,
      before: { status: rental.status, paidAmount: rental.paidAmount },
      after:  { status: 'PAID', paidAmount: updated.paidAmount, paymentDate: updated.paymentDate },
    })

    return reply.send(updated)
  })

  // ── NEW ENDPOINTS ────────────────────────────────────────────────────────────

  // POST /api/v1/finance/contracts — Create new contract
  app.post('/contracts', async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as {
      propertyAddress?:    string
      legacyPropertyCode?: string
      tenantName?:         string
      tenantId?:           string
      landlordId?:         string
      guarantorId?:        string
      rentValue?:          number
      tenantDueDay?:       number
      landlordDueDay?:     number
      startDate?:          string
      rescissionDate?:     string
      adjustmentIndex?:    string
      adjustmentPercent?:  number
      penalty?:            number
      commission?:         number
      contractHtml?:       string
      guaranteeType?:      string
      status?:             string
    }

    const created = await app.prisma.contract.create({
      data: {
        companyId:         cid,
        propertyAddress:   body.propertyAddress   ?? null,
        legacyPropertyCode: body.legacyPropertyCode ?? null,
        tenantName:        body.tenantName         ?? null,
        tenantId:          body.tenantId           ?? null,
        landlordId:        body.landlordId         ?? null,
        guarantorId:       body.guarantorId        ?? null,
        rentValue:         body.rentValue          ?? null,
        tenantDueDay:      body.tenantDueDay       ?? null,
        landlordDueDay:    body.landlordDueDay     ?? null,
        startDate:         body.startDate          ? new Date(body.startDate)      : null,
        rescissionDate:    body.rescissionDate     ? new Date(body.rescissionDate) : null,
        adjustmentIndex:   body.adjustmentIndex    ?? null,
        adjustmentPercent: body.adjustmentPercent  ?? null,
        penalty:           body.penalty            ?? null,
        commission:        body.commission         ?? null,
        contractHtml:      body.contractHtml       ?? null,
        status:            (body.status as any)    ?? 'ACTIVE',
        isActive:          (body.status ?? 'ACTIVE') === 'ACTIVE',
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'contract.create',
      resource: 'contract',
      resourceId: created.id,
      before: null,
      after: created as any,
    })

    return reply.status(201).send(created)
  })

  // PATCH /api/v1/finance/contracts/:id — Edit contract fields
  app.patch('/contracts/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as {
      rentValue?:       number
      dueDay?:          number   // maps to tenantDueDay
      landlordDueDay?:  number
      startDate?:       string
      endDate?:         string   // stored as rescissionDate (planned end)
      adjustmentIndex?: string
      observations?:    string   // stored in the closest text field (no-op if field absent)
      contractHtml?:    string
    }

    const contract = await app.prisma.contract.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!contract) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.contract.update({
      where: { id },
      data: {
        ...(body.rentValue       !== undefined && { rentValue:        body.rentValue }),
        ...(body.dueDay          !== undefined && { tenantDueDay:     body.dueDay }),
        ...(body.landlordDueDay  !== undefined && { landlordDueDay:   body.landlordDueDay }),
        ...(body.startDate       !== undefined && { startDate:        new Date(body.startDate) }),
        ...(body.endDate         !== undefined && { rescissionDate:   new Date(body.endDate) }),
        ...(body.adjustmentIndex !== undefined && { adjustmentIndex:  body.adjustmentIndex }),
        ...(body.contractHtml    !== undefined && { contractHtml:     body.contractHtml }),
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'contract.update',
      resource: 'contract',
      resourceId: id,
      before: contract as any,
      after:  updated  as any,
    })

    return reply.send(updated)
  })

  // ── Receipt HTML builder (shared helper) ─────────────────────────────────────
  function buildReceiptHtml(
    rental: {
      dueDate?: Date | string | null
      paymentDate?: Date | string | null
      totalAmount?: any
      rentAmount?: any
      paidAmount?: any
      penaltyAmount?: any
    },
    contract: {
      tenantName?: string | null
      propertyAddress?: string | null
    },
  ): string {
    const fmt = (v: number) =>
      v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const dueDate     = rental.dueDate     ? new Date(rental.dueDate)     : null
    const paymentDate = rental.paymentDate ? new Date(rental.paymentDate) : null

    const monthYear = dueDate
      ? dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : '—'

    const fmtDate = (d: Date | null) =>
      d ? d.toLocaleDateString('pt-BR') : '—'

    const totalAmount   = Number(rental.totalAmount   ?? rental.rentAmount ?? 0)
    const paidAmount    = Number(rental.paidAmount    ?? totalAmount)
    const penaltyAmount = Number(rental.penaltyAmount ?? 0)

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 0; padding: 24px; }
  .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { margin: 0 0 4px; font-size: 18px; text-transform: uppercase; }
  .header p  { margin: 2px 0; font-size: 12px; }
  .title { text-align: center; font-size: 15px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  td { padding: 6px 8px; border: 1px solid #ccc; vertical-align: top; }
  td.label { font-weight: bold; width: 40%; background: #f5f5f5; }
  .total-row td { font-weight: bold; background: #e8f4e8; font-size: 14px; }
  .footer { margin-top: 40px; border-top: 1px solid #aaa; padding-top: 16px; text-align: center; font-size: 11px; color: #555; }
  .signature { margin-top: 50px; border-top: 1px solid #222; width: 60%; margin-left: auto; margin-right: auto; padding-top: 8px; text-align: center; font-size: 12px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Imobiliária Lemos</h1>
    <p>CRECI 61053-F</p>
    <p>Rua Simão Caleiro, 2383 — Franca/SP</p>
    <p>Tel: (16) 3723-0045</p>
  </div>

  <div class="title">Recibo de Aluguel — ${monthYear}</div>

  <table>
    <tr><td class="label">Locatário</td><td>${contract.tenantName ?? '—'}</td></tr>
    <tr><td class="label">Imóvel</td><td>${contract.propertyAddress ?? '—'}</td></tr>
    <tr><td class="label">Vencimento</td><td>${fmtDate(dueDate)}</td></tr>
    <tr><td class="label">Data de Pagamento</td><td>${fmtDate(paymentDate)}</td></tr>
    <tr><td class="label">Valor do Aluguel</td><td>${fmt(totalAmount)}</td></tr>
    ${penaltyAmount > 0 ? `<tr><td class="label">Multa</td><td>${fmt(penaltyAmount)}</td></tr>` : ''}
    <tr class="total-row"><td class="label">Total Pago</td><td>${fmt(paidAmount)}</td></tr>
  </table>

  <p>Declaro ter recebido a importância acima referente ao aluguel do imóvel descrito, dando plena, geral e irrevogável quitação.</p>

  <div class="signature">
    Imobiliária Lemos<br/>
    Franca, ${new Date().toLocaleDateString('pt-BR')}
  </div>

  <div class="footer">
    Este recibo foi gerado eletronicamente pelo sistema Lemos Bank.
  </div>
</body>
</html>`
  }

  // GET /api/v1/finance/rentals/:id/recibo — Generate receipt HTML
  app.get('/rentals/:id/recibo', async (req, reply) => {
    const { id } = req.params as { id: string }

    const rental = await app.prisma.rental.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        contract: {
          select: {
            tenantName: true,
            propertyAddress: true,
            landlordName: true,
          },
        },
      },
    })
    if (!rental) return reply.status(404).send({ error: 'NOT_FOUND' })

    const html = buildReceiptHtml(rental, rental.contract ?? {})
    return reply.send({ html })
  })

  // GET /api/v1/finance/reports/proprietarios — Owner payment report
  app.get('/reports/proprietarios', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const month      = q.month      // YYYY-MM required
    const contractId = q.contractId // optional filter

    if (!month) {
      return reply.status(400).send({ error: 'MONTH_REQUIRED', message: 'Forneça month no formato YYYY-MM' })
    }

    const [y, m] = month.split('-').map(Number)
    if (!y || !m) return reply.status(400).send({ error: 'INVALID_MONTH' })

    const periodStart = new Date(y, m - 1, 1)
    const periodEnd   = new Date(y, m, 0, 23, 59, 59)

    const where: any = {
      companyId: cid,
      status:    'PAID',
      paymentDate: { gte: periodStart, lte: periodEnd },
      ...(contractId && { contractId }),
    }

    const rentals = await app.prisma.rental.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            legacyId: true,
            tenantName: true,
            landlordName: true,
            propertyAddress: true,
            rentValue: true,
            commission: true,
            landlord: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { paymentDate: 'asc' },
    })

    // Group by contractId
    const grouped = new Map<string, any>()
    for (const rental of rentals) {
      const c = rental.contract
      if (!c) continue

      if (!grouped.has(c.id)) {
        const rentValue     = Number(c.rentValue  ?? 0)
        const commission    = Number(c.commission ?? 0) // %
        const netToLandlord = commission > 0
          ? rentValue - (rentValue * commission / 100)
          : rentValue

        grouped.set(c.id, {
          contractId:      c.id,
          legacyId:        c.legacyId,
          landlordName:    c.landlord?.name ?? c.landlordName,
          landlord:        c.landlord,
          tenantName:      c.tenantName,
          propertyAddress: c.propertyAddress,
          rentValue:       Math.round(rentValue     * 100) / 100,
          commission,
          netToLandlord:   Math.round(netToLandlord * 100) / 100,
          payments:        [] as any[],
          totalAmountPaid: 0,
          totalPenalty:    0,
        })
      }

      const entry        = grouped.get(c.id)!
      const paidAmount   = Number(rental.paidAmount   ?? rental.totalAmount ?? 0)
      const penaltyAmount = Number(rental.penaltyAmount ?? 0)

      entry.payments.push({
        rentalId:    rental.id,
        dueDate:     rental.dueDate,
        paymentDate: rental.paymentDate,
        amountPaid:  Math.round(paidAmount    * 100) / 100,
        penalty:     Math.round(penaltyAmount * 100) / 100,
      })
      entry.totalAmountPaid += paidAmount
      entry.totalPenalty    += penaltyAmount
    }

    const data = Array.from(grouped.values()).map(e => ({
      ...e,
      totalAmountPaid: Math.round(e.totalAmountPaid * 100) / 100,
      totalPenalty:    Math.round(e.totalPenalty    * 100) / 100,
    }))

    return reply.send({ data, total: data.length, period: month })
  })

  // POST /api/v1/finance/rentals/:id/send-email — Send receipt via email
  app.post('/rentals/:id/send-email', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as { to: string; subject?: string; message?: string }

    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      return reply.status(503).send({ error: 'SMTP_NOT_CONFIGURED' })
    }

    const rental = await app.prisma.rental.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        contract: {
          select: {
            tenantName: true,
            propertyAddress: true,
            landlordName: true,
          },
        },
      },
    })
    if (!rental) return reply.status(404).send({ error: 'NOT_FOUND' })

    const html = buildReceiptHtml(rental, rental.contract ?? {})

    const transporter = nodemailer.createTransport({
      host:   env.SMTP_HOST,
      port:   env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })

    const dueDate = rental.dueDate
      ? new Date(rental.dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : ''

    await transporter.sendMail({
      from:    env.SMTP_FROM ?? env.SMTP_USER,
      to:      body.to,
      subject: body.subject ?? `Recibo de Aluguel — ${dueDate} — Imobiliária Lemos`,
      html:    body.message
        ? `<p>${body.message}</p><hr/>${html}`
        : html,
    })

    return reply.send({ sent: true, to: body.to })
  })

  // POST /api/v1/finance/rentals/:id/send-whatsapp — Send receipt via WhatsApp
  app.post('/rentals/:id/send-whatsapp', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as { phone: string; message?: string }

    if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) {
      return reply.status(503).send({ error: 'WHATSAPP_NOT_CONFIGURED' })
    }

    const rental = await app.prisma.rental.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        contract: {
          select: {
            tenantName: true,
            propertyAddress: true,
          },
        },
      },
    })
    if (!rental) return reply.status(404).send({ error: 'NOT_FOUND' })

    const totalAmount = Number(rental.totalAmount ?? rental.rentAmount ?? 0)
    const dueDate     = rental.dueDate
      ? new Date(rental.dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : ''
    const fmtCurrency = (v: number) =>
      v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    const textMessage = body.message ?? [
      `*Recibo de Aluguel — Imobiliária Lemos*`,
      `CRECI 61053-F | (16) 3723-0045`,
      ``,
      `Locatário: ${rental.contract?.tenantName ?? '—'}`,
      `Imóvel: ${rental.contract?.propertyAddress ?? '—'}`,
      `Referência: ${dueDate}`,
      `Valor pago: ${fmtCurrency(Number(rental.paidAmount ?? totalAmount))}`,
      ``,
      `Obrigado!`,
    ].join('\n')

    // Normalize phone: strip non-digits, ensure country code
    const phone = body.phone.replace(/\D/g, '')

    const waRes = await fetch(
      `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to:   phone,
          type: 'text',
          text: { body: textMessage },
        }),
      },
    )

    if (!waRes.ok) {
      const errBody = await waRes.text()
      app.log.error({ errBody }, 'WhatsApp send error')
      return reply.status(502).send({ error: 'WHATSAPP_SEND_FAILED', detail: errBody })
    }

    return reply.send({ sent: true })
  })

  // POST /api/v1/finance/charges — Create avulsa (individual) charge via Asaas
  // Creates an Invoice record (which tracks asaasId) linked to the contract.
  app.post('/charges', async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as {
      contractId:   string
      description:  string
      amount:       number
      dueDate:      string   // YYYY-MM-DD
      billingType?: 'BOLETO' | 'PIX'
    }

    if (!body.contractId || !body.description || !body.amount || !body.dueDate) {
      return reply.status(400).send({
        error: 'MISSING_FIELDS',
        required: ['contractId', 'description', 'amount', 'dueDate'],
      })
    }

    // Find contract + tenant info
    const contract = await app.prisma.contract.findFirst({
      where: { id: body.contractId, companyId: cid },
      include: {
        tenant: {
          select: { id: true, name: true, document: true, email: true, phone: true },
        },
      },
    })
    if (!contract) return reply.status(404).send({ error: 'CONTRACT_NOT_FOUND' })
    if (!contract.tenant?.document) {
      return reply.status(422).send({
        error:   'TENANT_NO_DOCUMENT',
        message: 'O locatário não possui CPF/CNPJ cadastrado para cobrança Asaas.',
      })
    }

    // Create or find Asaas customer for the tenant
    const asaasCustomer = await findOrCreateCustomer({
      name:    contract.tenant.name,
      cpfCnpj: contract.tenant.document,
      email:   contract.tenant.email  ?? undefined,
      phone:   contract.tenant.phone  ?? undefined,
    })

    // Create Asaas charge
    const asaasCharge = await createCharge({
      customer:          asaasCustomer.id,
      billingType:       body.billingType ?? 'PIX',
      value:             body.amount,
      dueDate:           body.dueDate,
      description:       body.description,
      externalReference: contract.legacyId ?? contract.id,
    })

    // Persist invoice record in DB with asaasId for tracking
    const invoice = await app.prisma.invoice.create({
      data: {
        companyId:       cid,
        contractId:      contract.id,
        dueDate:         new Date(body.dueDate),
        amount:          body.amount,
        mensagem:        body.description,
        asaasId:         asaasCharge.id,
        asaasStatus:     asaasCharge.status ?? 'PENDING',
        asaasBankSlipUrl: asaasCharge.bankSlipUrl ?? null,
        asaasPixCode:    asaasCharge.pixCode ?? null,
      },
    })

    return reply.status(201).send({ invoice, asaasCharge })
  })

  // PATCH /api/v1/finance/rentals/:id/estorno — Estornar pagamento (PAID → PENDING)
  app.patch('/rentals/:id/estorno', async (req, reply) => {
    const { id } = req.params as { id: string }
    const rental = await app.prisma.rental.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!rental) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (rental.status !== 'PAID') {
      return reply.status(400).send({ error: 'RENTAL_NOT_PAID', message: 'Somente aluguéis pagos podem ser estornados.' })
    }
    const updated = await app.prisma.rental.update({
      where: { id },
      data: { status: 'PENDING', paidAmount: null, paymentDate: null },
    })
    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'rental.estorno',
      resource: 'rental',
      resourceId: id,
      before: { status: rental.status, paidAmount: rental.paidAmount, paymentDate: rental.paymentDate },
      after:  { status: 'PENDING', paidAmount: null, paymentDate: null },
    })
    return reply.send(updated)
  })

  // GET /api/v1/finance/summary/month — Resumo financeiro de um mês específico (YYYY-MM)
  app.get('/summary/month', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const month = q.month
    if (!month) return reply.status(400).send({ error: 'MONTH_REQUIRED', message: 'Forneça month no formato YYYY-MM' })
    const [y, m] = month.split('-').map(Number)
    if (!y || !m || m < 1 || m > 12) return reply.status(400).send({ error: 'INVALID_MONTH' })
    const periodStart = new Date(y, m - 1, 1)
    const periodEnd   = new Date(y, m, 0, 23, 59, 59)
    const [paid, pending, late, total] = await Promise.all([
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PAID', paymentDate: { gte: periodStart, lte: periodEnd } },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'PENDING', dueDate: { gte: periodStart, lte: periodEnd } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      app.prisma.rental.aggregate({
        where: { companyId: cid, status: 'LATE', dueDate: { gte: periodStart, lte: periodEnd } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      app.prisma.rental.count({
        where: { companyId: cid, dueDate: { gte: periodStart, lte: periodEnd } },
      }),
    ])
    return reply.send({
      period: month,
      paid:    { count: paid._count,    total: Number(paid._sum.paidAmount ?? paid._sum.totalAmount ?? 0) },
      pending: { count: pending._count, total: Number(pending._sum.totalAmount ?? 0) },
      late:    { count: late._count,    total: Number(late._sum.totalAmount ?? 0) },
      totalRentals: total,
      inadimplencia: total > 0 ? Math.round(((late._count + pending._count) / total) * 1000) / 10 : 0,
    })
  })

  // GET /api/v1/finance/rentals/by-month — Alugueis de um mês específico paginados
  app.get('/rentals/by-month', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const month = q.month
    const status = q.status
    const search = q.search
    const page = Math.max(1, parseInt(q.page ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? '30')))
    if (!month) return reply.status(400).send({ error: 'MONTH_REQUIRED' })
    const [y, m] = month.split('-').map(Number)
    if (!y || !m) return reply.status(400).send({ error: 'INVALID_MONTH' })
    const periodStart = new Date(y, m - 1, 1)
    const periodEnd   = new Date(y, m, 0, 23, 59, 59)
    const where: any = {
      companyId: cid,
      dueDate: { gte: periodStart, lte: periodEnd },
    }
    if (status && status !== 'ALL') where.status = status.toUpperCase()
    if (search) {
      where.contract = {
        OR: [
          { tenantName:      { contains: search, mode: 'insensitive' } },
          { landlordName:    { contains: search, mode: 'insensitive' } },
          { propertyAddress: { contains: search, mode: 'insensitive' } },
        ],
      }
    }
    const [total, rentals] = await Promise.all([
      app.prisma.rental.count({ where }),
      app.prisma.rental.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true, legacyId: true,
              tenantName: true, landlordName: true, propertyAddress: true,
              tenant: { select: { id: true, name: true, phone: true, email: true } },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])
    return reply.send({
      data: rentals,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  })
}
