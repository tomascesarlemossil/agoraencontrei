import type { FastifyInstance } from 'fastify'

/**
 * Portal routes — accessed by proprietários/inquilinos via CPF+birthdate JWT
 * Token has type='portal' and sub=clientId
 */
export default async function portalRoutes(app: FastifyInstance) {
  // Auth guard for portal tokens
  const portalAuth = async (req: any, reply: any) => {
    try {
      await req.jwtVerify()
      if (req.user?.type !== 'portal') {
        return reply.status(401).send({ error: 'INVALID_TOKEN' })
      }
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' })
    }
  }

  // GET /api/v1/portal/dashboard — summary for the logged-in client
  app.get('/dashboard', { preHandler: [portalAuth] }, async (req: any, reply) => {
    const clientId = req.user.sub

    // Get client info + contracts
    const contracts = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT c.id, c."legacyId", c."landlordName", c."tenantName", c."propertyAddress",
              c."rentValue", c.status, c."startDate", c."rescissionDate", c."isActive",
              c."tenantId", c."landlordId"
       FROM contracts c
       WHERE c."tenantId" = $1 OR c."landlordId" = $1
       ORDER BY c."isActive" DESC, c."startDate" DESC`,
      clientId
    )

    const activeContract = contracts.find((c: any) => c.isActive) ?? contracts[0]
    const contractId = activeContract?.id

    // Count documents
    const docCounts = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT type, COUNT(*) as count FROM documents
       WHERE "clientId" = $1 OR "contractId" = $2
       GROUP BY type`,
      clientId, contractId ?? 'none'
    )
    const docMap: Record<string, number> = {}
    for (const d of docCounts) {
      docMap[d.type] = parseInt(d.count)
    }

    // Count pending rentals (boletos)
    const pendingRentals = contractId ? await app.prisma.rental.count({
      where: { contractId, status: { in: ['PENDING', 'LATE'] } },
    }) : 0

    // Count historical forecasts (from Uniloc migration)
    const forecastCount = await app.prisma.financialForecast.count({
      where: { tenantId: clientId },
    })

    // Get recent rentals
    const recentRentals = contractId ? await app.prisma.rental.findMany({
      where: { contractId },
      orderBy: { dueDate: 'desc' },
      take: 6,
      select: { id: true, dueDate: true, status: true, totalAmount: true, paidAmount: true, paymentDate: true },
    }) : []

    return reply.send({
      client: {
        id: clientId,
        name: req.user.name,
      },
      contract: activeContract ? {
        id: activeContract.id,
        legacyId: activeContract.legacyId,
        propertyAddress: activeContract.propertyAddress,
        rentValue: activeContract.rentValue,
        status: activeContract.status,
        startDate: activeContract.startDate,
        isActive: activeContract.isActive,
        role: activeContract.tenantId === clientId ? 'inquilino' : 'proprietario',
      } : null,
      counts: {
        contratos: contracts.length,
        boletos: pendingRentals,
        extratos: (docMap['EXTRATO'] ?? 0) + forecastCount,
        documentos: (docMap['REAJUSTE'] ?? 0) + (docMap['DOCUMENTO'] ?? 0),
        vistorias: 0,
      },
      recentRentals,
    })
  })

  // GET /api/v1/portal/contratos — list contracts for this client
  app.get('/contratos', { preHandler: [portalAuth] }, async (req: any, reply) => {
    const clientId = req.user.sub
    const contracts = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT c.id, c."legacyId", c."propertyAddress", c."landlordName", c."tenantName",
              c."rentValue", c.status, c."startDate", c."rescissionDate", c."isActive",
              c."tenantDueDay", c."adjustmentIndex"
       FROM contracts c
       WHERE c."tenantId" = $1 OR c."landlordId" = $1
       ORDER BY c."isActive" DESC, c."startDate" DESC`,
      clientId
    )
    return reply.send({ contracts })
  })

  // GET /api/v1/portal/boletos — rentals + boletos bancários (Invoices) para o cliente
  // Inclui histórico de FinancialForecast (dados migrados do Uniloc)
  app.get('/boletos', { preHandler: [portalAuth] }, async (req: any, reply) => {
    const clientId = req.user.sub

    // Get all contracts (active and inactive) for this client
    const allContracts = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, "isActive" FROM contracts WHERE "tenantId" = $1 ORDER BY "isActive" DESC`,
      clientId
    )

    const activeContract = allContracts.find((c: any) => c.isActive)
    const contractId = activeContract?.id
    const allContractIds = allContracts.map((c: any) => c.id)

    const [rentals, invoices, forecasts] = await Promise.all([
      // Current system rentals
      contractId ? app.prisma.rental.findMany({
        where: { contractId, status: { in: ['PENDING', 'LATE', 'PAID'] } },
        orderBy: { dueDate: 'desc' },
        take: 36,
        select: {
          id: true, dueDate: true, status: true, totalAmount: true,
          paidAmount: true, paymentDate: true,
        },
      }) : Promise.resolve([]),

      // Bank invoices (Asaas)
      allContractIds.length > 0 ? app.prisma.invoice.findMany({
        where: { contractId: { in: allContractIds } },
        orderBy: { dueDate: 'desc' },
        take: 36,
        select: {
          id: true, dueDate: true, issueDate: true, amount: true,
          numBoleto: true, linhaDigitavel: true, codigoBarras: true,
          asaasStatus: true, asaasBankSlipUrl: true, asaasPixCode: true,
          mensagem: true,
        },
      }) : Promise.resolve([]),

      // Historical data from Uniloc migration (FinancialForecast)
      app.prisma.financialForecast.findMany({
        where: { tenantId: clientId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 60,
        select: {
          id: true, dueDate: true, amount: true, month: true, year: true,
          forecastStatus: true, valorAluguel: true, taxaAdm: true,
          valorRepasse: true, numeroBoleto: true, endereco: true,
          proprietarioNome: true, clienteNome: true,
        },
      }),
    ])

    return reply.send({ rentals, invoices, forecasts })
  })

  // GET /api/v1/portal/extratos — extratos + histórico financeiro para o cliente
  app.get('/extratos', { preHandler: [portalAuth] }, async (req: any, reply) => {
    const clientId = req.user.sub

    // Documents stored in DB
    const docs = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, month, year, "fileSize", "mimeType", "createdAt"
       FROM documents
       WHERE "clientId" = $1 AND type = 'EXTRATO'
       ORDER BY year DESC, month DESC`,
      clientId
    )

    // Historical financial forecasts from Uniloc migration
    const forecasts = await app.prisma.financialForecast.findMany({
      where: { tenantId: clientId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 120,
      select: {
        id: true, dueDate: true, amount: true, month: true, year: true,
        forecastStatus: true, valorAluguel: true, taxaAdm: true,
        valorRepasse: true, numeroBoleto: true, endereco: true,
        proprietarioNome: true,
      },
    })

    return reply.send({ documents: docs, forecasts })
  })

  // GET /api/v1/portal/documentos — all documents for this client
  app.get('/documentos', { preHandler: [portalAuth] }, async (req: any, reply) => {
    const clientId = req.user.sub
    const docs = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, type, month, year, "fileSize", "mimeType", "createdAt"
       FROM documents
       WHERE "clientId" = $1
       ORDER BY year DESC, month DESC, name ASC`,
      clientId
    )
    return reply.send({ documents: docs })
  })

  // GET /api/v1/portal/documentos/:id/download — serve file for portal user
  app.get('/documentos/:id/download', { preHandler: [portalAuth] }, async (req: any, reply) => {
    const clientId = req.user.sub
    const { id } = req.params as { id: string }

    // Get contracts for this client to verify access
    const contracts = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM contracts WHERE "tenantId" = $1 OR "landlordId" = $1`,
      clientId
    )
    const contractIds = contracts.map((c: any) => c.id)

    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT name, "mimeType", "fileData"
       FROM documents
       WHERE id = $1 AND ("clientId" = $2 OR "contractId" = ANY($3::text[]))`,
      id, clientId, contractIds
    )
    if (!rows.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    const doc = rows[0]

    if (!doc.fileData) return reply.status(404).send({ error: 'NO_FILE' })

    const ext = doc.mimeType === 'application/pdf' ? '.pdf' : doc.mimeType?.includes('sheet') ? '.xlsx' : '.doc'
    const baseName = doc.name.replace(/[^a-zA-Z0-9._\- ]/g, '_')
    const filename = baseName.toLowerCase().endsWith(ext) ? baseName : baseName + ext
    reply.header('Content-Type', doc.mimeType || 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="${filename}"`)
    return reply.send(doc.fileData)
  })
}
