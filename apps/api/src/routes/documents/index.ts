import type { FastifyInstance } from 'fastify'

export default async function documentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/documents — list documents with filters
  app.get('/', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as {
      type?: string
      category?: string
      month?: string
      year?: string
      contractId?: string
      clientId?: string
      search?: string
      page?: string
      limit?: string
    }

    const page  = Math.max(1, parseInt(q.page  || '1'))
    const limit = Math.min(100, parseInt(q.limit || '50'))
    const offset = (page - 1) * limit

    const conditions: string[] = ['"companyId" = $1']
    const params: any[] = [cid]
    let pi = 2

    if (q.type) { conditions.push(`type = $${pi++}`); params.push(q.type.toUpperCase()) }
    if (q.category) { conditions.push(`category = $${pi++}`); params.push(q.category) }
    if (q.month) { conditions.push(`month = $${pi++}`); params.push(q.month) }
    if (q.year) { conditions.push(`year = $${pi++}`); params.push(parseInt(q.year)) }
    if (q.contractId) { conditions.push(`"contractId" = $${pi++}`); params.push(q.contractId) }
    if (q.clientId) { conditions.push(`"clientId" = $${pi++}`); params.push(q.clientId) }
    if (q.search) { conditions.push(`name ILIKE $${pi++}`); params.push(`%${q.search}%`) }

    const where = conditions.join(' AND ')

    const [rows, countRows] = await Promise.all([
      app.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, "contractId", "clientId", "propertyId", type, category, name, month, year,
                "mimeType", "fileSize", "legacyRef", metadata, "createdAt"
         FROM documents
         WHERE ${where}
         ORDER BY year DESC, month DESC, name ASC
         LIMIT ${limit} OFFSET ${offset}`,
        ...params
      ),
      app.prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) as total FROM documents WHERE ${where}`,
        ...params
      ),
    ])

    return reply.send({
      documents: rows,
      total: parseInt(countRows[0]?.total || '0'),
      page,
      limit,
    })
  })

  // GET /api/v1/documents/stats — summary counts by type/month
  app.get('/stats', async (req, reply) => {
    const cid = req.user.cid

    const stats = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT type, category, month, year,
              COUNT(*)::int as count,
              COALESCE(SUM("fileSize"),0)::bigint as total_size
       FROM documents
       WHERE "companyId" = $1
       GROUP BY type, category, month, year
       ORDER BY year DESC NULLS LAST, month DESC NULLS LAST, type ASC`,
      cid
    )

    return reply.send({ stats: stats.map(s => ({ ...s, count: Number(s.count), total_size: Number(s.total_size) })) })
  })

  // GET /api/v1/documents/:id — get metadata (no file data)
  app.get('/:id', async (req, reply) => {
    const cid = req.user.cid
    const { id } = req.params as { id: string }

    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, "contractId", "clientId", "propertyId", type, category, name, month, year,
              "mimeType", "fileSize", "legacyRef", metadata, "createdAt", "uploadedBy"
       FROM documents WHERE id = $1 AND "companyId" = $2`,
      id, cid
    )

    if (!rows.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(rows[0])
  })

  // GET /api/v1/documents/:id/download — serve the file
  app.get('/:id/download', async (req, reply) => {
    const cid = req.user.cid
    const { id } = req.params as { id: string }

    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT name, "mimeType", "fileData" FROM documents WHERE id = $1 AND "companyId" = $2`,
      id, cid
    )

    if (!rows.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    const doc = rows[0]

    // Serve from DB
    if (!doc.fileData) return reply.status(404).send({ error: 'NO_FILE_DATA' })

    const filename = doc.name.replace(/[^a-zA-Z0-9._\- ]/g, '_') + (
      doc.mimeType === 'application/pdf' ? '.pdf' :
      doc.mimeType?.includes('sheet') ? '.xlsx' : '.doc'
    )

    reply.header('Content-Type', doc.mimeType || 'application/pdf')
    reply.header('Content-Disposition', `inline; filename="${filename}"`)
    return reply.send(doc.fileData)
  })

  // DELETE /api/v1/documents/:id
  app.delete('/:id', async (req, reply) => {
    const cid = req.user.cid
    const { id } = req.params as { id: string }

    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `DELETE FROM documents WHERE id = $1 AND "companyId" = $2 RETURNING id`,
      id, cid
    )
    if (!rows.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ success: true })
  })

  // POST /api/v1/documents/upload — upload a new document
  app.post('/upload', async (req, reply) => {
    const cid = req.user.cid
    const userId = req.user.sub

    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'NO_FILE' })

    const body = data.fields as any
    const type = (body.type?.value || 'DOCUMENTO').toUpperCase()
    const category = body.category?.value || 'geral'
    const name = body.name?.value || data.filename
    const contractId = body.contractId?.value || null
    const clientId = body.clientId?.value || null
    const month = body.month?.value || null
    const year = body.year?.value ? parseInt(body.year.value) : null

    const buffer = await data.toBuffer()

    const { nanoid } = await import('nanoid')
    const id = 'c' + nanoid(24).toLowerCase().replace(/[^a-z0-9]/g, 'x')

    await app.prisma.$executeRawUnsafe(
      `INSERT INTO documents (id, "companyId", "contractId", "clientId", type, category, name, month, year, "fileData", "fileSize", "mimeType", "uploadedBy", metadata, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, '{}', NOW(), NOW())`,
      id, cid, contractId, clientId, type, category, name, month, year,
      buffer, buffer.length, data.mimetype, userId
    )

    return reply.status(201).send({ id, name, type, category })
  })
}
