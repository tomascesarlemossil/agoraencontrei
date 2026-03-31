import type { FastifyInstance } from 'fastify'

export default async function financeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/finance/summary — receita, despesas, saldo, inadimplência do mês atual
  app.get('/summary', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

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
      // Aluguéis em atraso do mês (dueDate no mês atual e status LATE)
      app.prisma.rental.count({ where: { companyId: cid, status: 'LATE', dueDate: { gte: monthStart, lte: monthEnd } } }),
      // Total de aluguéis do mês
      app.prisma.rental.count({ where: { companyId: cid, dueDate: { gte: monthStart, lte: monthEnd } } }),
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
      // Contratos a vencer nos próximos 30 dias (rescissão agendada)
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
      // Cobranças recebidas este mês (aluguéis PAID no mês)
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
      period: { start: monthStart, end: monthEnd },
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

  // GET /api/v1/finance/cashflow — fluxo dos últimos 12 meses (Transaction + forecast de contratos)
  app.get('/cashflow', async (req, reply) => {
    const cid = req.user.cid
    const now = new Date()

    // Gera os últimos 12 meses
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
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
    const limit = parseInt(q.limit ?? '20', 10)
    const status = q.status  // ACTIVE | FINISHED | CANCELED
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
    const limit = parseInt(q.limit ?? '20', 10)
    const role   = q.role   // TENANT | LANDLORD | GUARANTOR | BENEFICIARY
    const search = q.search

    const where: any = {
      companyId: cid,
      ...(role && { roles: { has: role } }),
      ...(search && {
        OR: [
          { name:     { contains: search, mode: 'insensitive' } },
          { document: { contains: search } },
          { email:    { contains: search, mode: 'insensitive' } },
          { phone:    { contains: search } },
        ],
      }),
    }

    const [total, items] = await Promise.all([
      app.prisma.client.count({ where }),
      app.prisma.client.findMany({
        where,
        orderBy: { name: 'asc' },
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
          take: 20,
          include: { landlord: { select: { id: true, name: true, phone: true } } },
        },
        contractsAsLandlord: {
          orderBy: { startDate: 'desc' },
          take: 20,
          include: { tenant: { select: { id: true, name: true, phone: true } } },
        },
        contractsAsGuarantor: {
          orderBy: { startDate: 'desc' },
          take: 10,
        },
      },
    })
    if (!client) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(client)
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

    return reply.send(updated)
  })
}
