/**
 * Módulo Jurídico — API Routes
 * Acesso restrito: apenas usuários com settings.moduleAccess contendo "juridico"
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { nanoid } from 'nanoid'

function genId() { return 'c' + nanoid(24).toLowerCase().replace(/[^a-z0-9]/g, 'x') }

// Guard: verifica se o usuário tem acesso ao módulo jurídico
async function checkLegalAccess(app: FastifyInstance, userId: string, cid: string) {
  const rows = await app.prisma.$queryRawUnsafe<any[]>(
    `SELECT settings FROM users WHERE id = $1 AND "companyId" = $2`,
    userId, cid
  )
  if (!rows.length) return false
  const settings = typeof rows[0].settings === 'object' ? rows[0].settings : {}
  const moduleAccess: string[] = settings?.moduleAccess ?? []
  const role = rows[0]?.role ?? ''
  // Admin sempre tem acesso; outros precisam ter "juridico" no moduleAccess
  if (role === 'ADMIN' || role === 'OWNER') return true
  return moduleAccess.includes('juridico')
}

export default async function legalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // Middleware de acesso ao módulo
  app.addHook('preHandler', async (req, reply) => {
    const cid = req.user.cid
    const userId = req.user.sub
    const hasAccess = await checkLegalAccess(app, userId, cid)
    if (!hasAccess) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Acesso ao módulo Jurídico não autorizado para este usuário.',
      })
    }
  })

  // ── GET /api/v1/legal/stats ─────────────────────────────────────────────
  app.get('/stats', async (req, reply) => {
    const cid = req.user.cid
    const [totals, byType, byStatus, upcoming] = await Promise.all([
      app.prisma.$queryRawUnsafe<any[]>(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'ATIVO')::int as ativos,
          COUNT(*) FILTER (WHERE status = 'ENCERRADO')::int as encerrados,
          COUNT(*) FILTER (WHERE status = 'SUSPENSO')::int as suspensos,
          COALESCE(SUM("claimedValue"), 0)::float as total_reclamado,
          COALESCE(SUM("settledValue"), 0)::float as total_acordado,
          COALESCE(SUM("courtCosts"), 0)::float as total_custas
        FROM legal_cases WHERE "companyId" = $1`, cid),
      app.prisma.$queryRawUnsafe<any[]>(`
        SELECT type, COUNT(*)::int as cnt FROM legal_cases
        WHERE "companyId" = $1 GROUP BY type ORDER BY cnt DESC`, cid),
      app.prisma.$queryRawUnsafe<any[]>(`
        SELECT status, COUNT(*)::int as cnt FROM legal_cases
        WHERE "companyId" = $1 GROUP BY status ORDER BY cnt DESC`, cid),
      app.prisma.$queryRawUnsafe<any[]>(`
        SELECT id, title, "caseNumber", "nextHearingAt", type, status
        FROM legal_cases
        WHERE "companyId" = $1 AND "nextHearingAt" >= NOW()
        ORDER BY "nextHearingAt" ASC LIMIT 5`, cid),
    ])
    return reply.send({
      ...totals[0],
      byType,
      byStatus,
      upcomingHearings: upcoming,
    })
  })

  // ── GET /api/v1/legal ───────────────────────────────────────────────────
  app.get('/', async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as {
      status?: string; type?: string; priority?: string
      clientId?: string; contractId?: string; propertyId?: string
      search?: string; page?: string; limit?: string
      sortBy?: string; sortDir?: string
    }
    const page  = Math.max(1, parseInt(q.page  || '1'))
    const limit = Math.min(100, parseInt(q.limit || '25'))
    const offset = (page - 1) * limit
    const sortBy  = ['title','caseNumber','openedAt','nextHearingAt','claimedValue','createdAt'].includes(q.sortBy ?? '') ? q.sortBy! : 'createdAt'
    const sortDir = q.sortDir === 'asc' ? 'ASC' : 'DESC'

    const conditions: string[] = ['"companyId" = $1']
    const params: any[] = [cid]
    let pi = 2
    if (q.status)     { conditions.push(`status = $${pi++}`);       params.push(q.status.toUpperCase()) }
    if (q.type)       { conditions.push(`type = $${pi++}`);         params.push(q.type.toUpperCase()) }
    if (q.priority)   { conditions.push(`priority = $${pi++}`);     params.push(q.priority.toUpperCase()) }
    if (q.clientId)   { conditions.push(`"clientId" = $${pi++}`);   params.push(q.clientId) }
    if (q.contractId) { conditions.push(`"contractId" = $${pi++}`); params.push(q.contractId) }
    if (q.propertyId) { conditions.push(`"propertyId" = $${pi++}`); params.push(q.propertyId) }
    if (q.search) {
      conditions.push(`(title ILIKE $${pi} OR "caseNumber" ILIKE $${pi} OR "plaintiffName" ILIKE $${pi} OR "defendantName" ILIKE $${pi} OR "lawyerName" ILIKE $${pi})`)
      params.push(`%${q.search}%`); pi++
    }
    const where = conditions.join(' AND ')

    const [rows, countRows] = await Promise.all([
      app.prisma.$queryRawUnsafe<any[]>(`
        SELECT lc.id, lc."caseNumber", lc.title, lc.type, lc.status, lc.priority,
               lc."plaintiffName", lc."defendantName", lc."lawyerName", lc."lawyerOab",
               lc.court, lc."courtCity", lc."openedAt", lc."closedAt", lc."nextHearingAt",
               lc."claimedValue", lc."settledValue", lc."courtCosts",
               lc."clientId", lc."contractId", lc."propertyId",
               lc.tags, lc."createdAt", lc."updatedAt",
               cl.name as "clientName",
               co.reference as "contractRef"
        FROM legal_cases lc
        LEFT JOIN clients cl ON cl.id = lc."clientId"
        LEFT JOIN contracts co ON co.id = lc."contractId"
        WHERE ${where}
        ORDER BY lc."${sortBy}" ${sortDir} NULLS LAST
        LIMIT ${limit} OFFSET ${offset}`, ...params),
      app.prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*) as total FROM legal_cases WHERE ${where}`, ...params),
    ])
    const total = parseInt(countRows[0]?.total || '0')
    return reply.send({ data: rows, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // ── POST /api/v1/legal ──────────────────────────────────────────────────
  app.post('/', {
    schema: {
      body: z.object({
        title:          z.string().min(3),
        type:           z.enum(['DESPEJO','COBRANCA','REVISIONAL','RESCISAO','DANO','TRABALHISTA','CRIMINAL','OUTROS']),
        status:         z.enum(['ATIVO','ENCERRADO','SUSPENSO','ARQUIVADO']).default('ATIVO'),
        priority:       z.enum(['BAIXA','NORMAL','ALTA','URGENTE']).default('NORMAL'),
        caseNumber:     z.string().optional(),
        plaintiffName:  z.string().optional(),
        defendantName:  z.string().optional(),
        lawyerName:     z.string().optional(),
        lawyerOab:      z.string().optional(),
        lawyerPhone:    z.string().optional(),
        lawyerEmail:    z.string().email().optional().or(z.literal('')),
        court:          z.string().optional(),
        courtSection:   z.string().optional(),
        courtCity:      z.string().optional(),
        openedAt:       z.string().optional(),
        closedAt:       z.string().optional(),
        nextHearingAt:  z.string().optional(),
        claimedValue:   z.number().optional(),
        settledValue:   z.number().optional(),
        courtCosts:     z.number().optional(),
        clientId:       z.string().optional(),
        contractId:     z.string().optional(),
        propertyId:     z.string().optional(),
        observations:   z.string().optional(),
        internalNotes:  z.string().optional(),
        tags:           z.array(z.string()).default([]),
      }),
    },
  }, async (req, reply) => {
    const cid = req.user.cid
    const b = req.body as any
    const id = genId()
    await app.prisma.$executeRawUnsafe(`
      INSERT INTO legal_cases (
        id, "companyId", "caseNumber", title, type, status, priority,
        "plaintiffName", "defendantName", "lawyerName", "lawyerOab", "lawyerPhone", "lawyerEmail",
        court, "courtSection", "courtCity",
        "openedAt", "closedAt", "nextHearingAt",
        "claimedValue", "settledValue", "courtCosts",
        "clientId", "contractId", "propertyId",
        observations, "internalNotes", tags, metadata,
        "createdAt", "updatedAt"
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28::text[],'{}',NOW(),NOW()
      )`,
      id, cid,
      b.caseNumber ?? null, b.title, b.type, b.status, b.priority,
      b.plaintiffName ?? null, b.defendantName ?? null,
      b.lawyerName ?? null, b.lawyerOab ?? null, b.lawyerPhone ?? null, b.lawyerEmail ?? null,
      b.court ?? null, b.courtSection ?? null, b.courtCity ?? null,
      b.openedAt ? new Date(b.openedAt) : null,
      b.closedAt ? new Date(b.closedAt) : null,
      b.nextHearingAt ? new Date(b.nextHearingAt) : null,
      b.claimedValue ?? null, b.settledValue ?? null, b.courtCosts ?? null,
      b.clientId ?? null, b.contractId ?? null, b.propertyId ?? null,
      b.observations ?? null, b.internalNotes ?? null,
      b.tags ?? [],
    )
    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM legal_cases WHERE id = $1`, id)
    return reply.status(201).send(rows[0])
  })

  // ── GET /api/v1/legal/:id ───────────────────────────────────────────────
  app.get('/:id', async (req, reply) => {
    const cid = req.user.cid
    const { id } = req.params as { id: string }
    const rows = await app.prisma.$queryRawUnsafe<any[]>(`
      SELECT lc.*,
             cl.name as "clientName", cl.email as "clientEmail", cl.phone as "clientPhone",
             co.reference as "contractRef",
             pr.title as "propertyTitle", pr.address as "propertyAddress"
      FROM legal_cases lc
      LEFT JOIN clients cl ON cl.id = lc."clientId"
      LEFT JOIN contracts co ON co.id = lc."contractId"
      LEFT JOIN properties pr ON pr.id = lc."propertyId"
      WHERE lc.id = $1 AND lc."companyId" = $2`, id, cid)
    if (!rows.length) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Buscar andamentos
    const updates = await app.prisma.$queryRawUnsafe<any[]>(`
      SELECT lu.*, u.name as "userName"
      FROM legal_case_updates lu
      LEFT JOIN users u ON u.id = lu."userId"
      WHERE lu."legalCaseId" = $1
      ORDER BY lu."createdAt" DESC`, id)

    // Buscar documentos vinculados
    const documents = await app.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, name, type, category, month, year, "mimeType", "fileSize", metadata, "createdAt"
      FROM documents
      WHERE "companyId" = $1 AND (
        type = 'JURIDICO'
        OR ("clientId" = $2 AND type IN ('JURIDICO','CONTRATO','RESCISAO','DOCUMENTO'))
      )
      ORDER BY year DESC NULLS LAST, month DESC NULLS LAST, name ASC
      LIMIT 50`,
      cid, rows[0].clientId ?? 'none')

    return reply.send({ ...rows[0], updates, documents })
  })

  // ── PATCH /api/v1/legal/:id ─────────────────────────────────────────────
  app.patch('/:id', async (req, reply) => {
    const cid = req.user.cid
    const { id } = req.params as { id: string }
    const b = req.body as any
    const existing = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM legal_cases WHERE id = $1 AND "companyId" = $2`, id, cid)
    if (!existing.length) return reply.status(404).send({ error: 'NOT_FOUND' })

    const fields: string[] = []
    const params: any[] = []
    let pi = 1
    const updatable = [
      'caseNumber','title','type','status','priority',
      'plaintiffName','defendantName','lawyerName','lawyerOab','lawyerPhone','lawyerEmail',
      'court','courtSection','courtCity','observations','internalNotes',
      'claimedValue','settledValue','courtCosts',
      'clientId','contractId','propertyId',
    ]
    for (const key of updatable) {
      if (b[key] !== undefined) {
        fields.push(`"${key}" = $${pi++}`)
        params.push(b[key] === '' ? null : b[key])
      }
    }
    for (const dateKey of ['openedAt','closedAt','nextHearingAt']) {
      if (b[dateKey] !== undefined) {
        fields.push(`"${dateKey}" = $${pi++}`)
        params.push(b[dateKey] ? new Date(b[dateKey]) : null)
      }
    }
    if (b.tags !== undefined) {
      fields.push(`tags = $${pi++}::text[]`)
      params.push(b.tags)
    }
    if (!fields.length) return reply.status(400).send({ error: 'NO_FIELDS' })
    fields.push(`"updatedAt" = NOW()`)
    params.push(id, cid)
    await app.prisma.$executeRawUnsafe(
      `UPDATE legal_cases SET ${fields.join(', ')} WHERE id = $${pi} AND "companyId" = $${pi + 1}`,
      ...params)
    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM legal_cases WHERE id = $1`, id)
    return reply.send(rows[0])
  })

  // ── DELETE /api/v1/legal/:id ────────────────────────────────────────────
  app.delete('/:id', async (req, reply) => {
    const cid = req.user.cid
    const { id } = req.params as { id: string }
    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `DELETE FROM legal_cases WHERE id = $1 AND "companyId" = $2 RETURNING id`, id, cid)
    if (!rows.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ success: true })
  })

  // ── POST /api/v1/legal/:id/updates ─────────────────────────────────────
  app.post('/:id/updates', {
    schema: {
      body: z.object({
        description: z.string().min(3),
        type: z.enum(['ANDAMENTO','AUDIENCIA','DECISAO','RECURSO','ACORDO','CITACAO','PETICAO','OUTROS']).default('ANDAMENTO'),
        occurredAt: z.string().optional(),
      }),
    },
  }, async (req, reply) => {
    const cid = req.user.cid
    const userId = req.user.sub
    const { id } = req.params as { id: string }
    const b = req.body as any
    const existing = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM legal_cases WHERE id = $1 AND "companyId" = $2`, id, cid)
    if (!existing.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updateId = genId()
    await app.prisma.$executeRawUnsafe(`
      INSERT INTO legal_case_updates (id, "legalCaseId", "userId", description, type, "occurredAt", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      updateId, id, userId, b.description, b.type,
      b.occurredAt ? new Date(b.occurredAt) : null)
    // Atualizar updatedAt do caso
    await app.prisma.$executeRawUnsafe(
      `UPDATE legal_cases SET "updatedAt" = NOW() WHERE id = $1`, id)
    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT lu.*, u.name as "userName" FROM legal_case_updates lu
       LEFT JOIN users u ON u.id = lu."userId"
       WHERE lu.id = $1`, updateId)
    return reply.status(201).send(rows[0])
  })

  // ── GET /api/v1/legal/:id/documents ────────────────────────────────────
  app.get('/:id/documents', async (req, reply) => {
    const cid = req.user.cid
    const { id } = req.params as { id: string }
    const legalCase = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT "clientId" FROM legal_cases WHERE id = $1 AND "companyId" = $2`, id, cid)
    if (!legalCase.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    const clientId = legalCase[0].clientId
    const docs = await app.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, name, type, category, month, year, "mimeType", "fileSize", "legacyRef", metadata, "createdAt"
      FROM documents
      WHERE "companyId" = $1
        AND (type = 'JURIDICO' OR (${clientId ? '"clientId" = $2' : 'false'}))
      ORDER BY year DESC NULLS LAST, month DESC NULLS LAST, name ASC
      LIMIT 100`,
      ...(clientId ? [cid, clientId] : [cid]))
    return reply.send({ data: docs })
  })

  // ── GET /api/v1/legal/export/csv ────────────────────────────────────────
  app.get('/export/csv', async (req, reply) => {
    const cid = req.user.cid
    const rows = await app.prisma.$queryRawUnsafe<any[]>(`
      SELECT lc."caseNumber", lc.title, lc.type, lc.status, lc.priority,
             lc."plaintiffName", lc."defendantName", lc."lawyerName", lc."lawyerOab",
             lc.court, lc."courtCity",
             to_char(lc."openedAt", 'DD/MM/YYYY') as "dataAbertura",
             to_char(lc."nextHearingAt", 'DD/MM/YYYY HH24:MI') as "proximaAudiencia",
             lc."claimedValue", lc."settledValue", lc."courtCosts",
             cl.name as "clientName"
      FROM legal_cases lc
      LEFT JOIN clients cl ON cl.id = lc."clientId"
      WHERE lc."companyId" = $1
      ORDER BY lc."createdAt" DESC`, cid)

    const headers = [
      'Nº Processo','Título','Tipo','Status','Prioridade',
      'Autor/Requerente','Réu/Requerido','Advogado','OAB',
      'Tribunal','Cidade','Data Abertura','Próx. Audiência',
      'Valor Reclamado','Valor Acordado','Custas','Cliente',
    ]
    const csvRows = rows.map(r => [
      r.caseNumber ?? '', r.title, r.type, r.status, r.priority,
      r.plaintiffName ?? '', r.defendantName ?? '', r.lawyerName ?? '', r.lawyerOab ?? '',
      r.court ?? '', r.courtCity ?? '', r.dataAbertura ?? '', r.proximaAudiencia ?? '',
      r.claimedValue ?? '', r.settledValue ?? '', r.courtCosts ?? '', r.clientName ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

    const csv = [headers.join(','), ...csvRows].join('\n')
    reply.header('Content-Type', 'text/csv; charset=utf-8')
    reply.header('Content-Disposition', 'attachment; filename="processos-juridicos.csv"')
    return reply.send('\uFEFF' + csv) // BOM para Excel
  })
}
