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
        extratos: docMap['EXTRATO'] ?? 0,
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

  // GET /api/v1/portal/boletos — pending rentals for this client
  app.get('/boletos', { preHandler: [portalAuth] }, async (req: any, reply) => {
    const clientId = req.user.sub
    const contracts = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM contracts WHERE "tenantId" = $1 AND "isActive" = true LIMIT 1`,
      clientId
    )
    if (!contracts.length) return reply.send({ rentals: [] })
    const contractId = contracts[0].id

    const rentals = await app.prisma.rental.findMany({
      where: { contractId, status: { in: ['PENDING', 'LATE', 'PAID'] } },
      orderBy: { dueDate: 'desc' },
      take: 24,
      select: {
        id: true, dueDate: true, status: true, totalAmount: true,
        paidAmount: true, paymentDate: true,
      },
    })
    return reply.send({ rentals })
  })

  // GET /api/v1/portal/extratos — extratos for this client
  app.get('/extratos', { preHandler: [portalAuth] }, async (req: any, reply) => {
    const clientId = req.user.sub
    const docs = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, month, year, "fileSize", "mimeType", "createdAt"
       FROM documents
       WHERE "clientId" = $1 AND type = 'EXTRATO'
       ORDER BY year DESC, month DESC`,
      clientId
    )
    return reply.send({ documents: docs })
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

    reply.header('Content-Type', doc.mimeType || 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="${doc.name.replace(/[^a-zA-Z0-9._\- ]/g, '_')}.pdf"`)
    return reply.send(doc.fileData)
  })
}
