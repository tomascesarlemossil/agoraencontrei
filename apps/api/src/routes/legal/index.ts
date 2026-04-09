/**
 * Módulo Jurídico — API Routes
 * Acesso restrito: apenas usuários com settings.moduleAccess contendo "juridico"
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { createAuditLog } from '../../services/audit.service.js'

function genId() { return 'c' + nanoid(24).toLowerCase().replace(/[^a-z0-9]/g, 'x') }

// Guard: verifica se o usuário tem acesso ao módulo jurídico
async function checkLegalAccess(app: FastifyInstance, userId: string, cid: string) {
  const rows = await app.prisma.$queryRawUnsafe<any[]>(
    `SELECT settings, role FROM users WHERE id = $1 AND "companyId" = $2`,
    userId, cid
  )
  if (!rows.length) return false
  const settings = typeof rows[0].settings === 'object' ? rows[0].settings : {}
  const moduleAccess: string[] = settings?.moduleAccess ?? []
  const role = rows[0]?.role ?? ''
  // Admin e LAWYER sempre têm acesso; outros precisam ter "juridico" no moduleAccess
  if (['ADMIN', 'SUPER_ADMIN', 'OWNER', 'LAWYER'].includes(role)) return true
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
  // ── POST /api/v1/legal ──────────────────────────────────────────────────────────
  app.post('/', async (req, reply) => {
    const cid = req.user.cid
    const b = z.object({
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
    }).parse(req.body)
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
    const newCase = rows[0]

    // ── Notificar todos os advogados (LAWYER) da empresa ───────────────────
    setImmediate(async () => {
      try {
        const lawyers = await app.prisma.$queryRawUnsafe<any[]>(`
          SELECT id, name, email, phone, settings
          FROM users
          WHERE "companyId" = $1
            AND role = 'LAWYER'
            AND status = 'ACTIVE'
        `, cid)

        if (!lawyers.length) return

        const typeLabel: Record<string, string> = {
          DESPEJO: 'Despejo', COBRANCA: 'Cobrança', REVISIONAL: 'Revisional',
          RESCISAO: 'Rescisão', DANO: 'Dano', TRABALHISTA: 'Trabalhista',
          CRIMINAL: 'Criminal', OUTROS: 'Outros',
        }
        const priorityLabel: Record<string, string> = {
          BAIXA: 'Baixa', NORMAL: 'Normal', ALTA: '⚠️ Alta', URGENTE: '🚨 Urgente',
        }
        const msgText = [
          `📋 *Novo Processo Jurídico Cadastrado*`,
          ``,
          `*Título:* ${b.title}`,
          `*Tipo:* ${typeLabel[b.type] ?? b.type}`,
          `*Prioridade:* ${priorityLabel[b.priority ?? 'NORMAL']}`,
          b.caseNumber ? `*Nº Processo:* ${b.caseNumber}` : null,
          b.plaintiffName ? `*Autor:* ${b.plaintiffName}` : null,
          b.defendantName ? `*Réu:* ${b.defendantName}` : null,
          b.court ? `*Vara/Tribunal:* ${b.court}` : null,
          ``,
          `Acesse o sistema para visualizar os detalhes.`,
        ].filter(Boolean).join('\n')

        const emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1B2B5B;padding:20px;border-radius:8px 8px 0 0">
              <h2 style="color:white;margin:0">📋 Novo Processo Jurídico</h2>
            </div>
            <div style="background:#f9f9f9;padding:20px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;font-weight:bold;width:140px">Título:</td><td style="padding:8px">${b.title}</td></tr>
                <tr style="background:#fff"><td style="padding:8px;font-weight:bold">Tipo:</td><td style="padding:8px">${typeLabel[b.type] ?? b.type}</td></tr>
                <tr><td style="padding:8px;font-weight:bold">Prioridade:</td><td style="padding:8px">${priorityLabel[b.priority ?? 'NORMAL']}</td></tr>
                ${b.caseNumber ? `<tr style="background:#fff"><td style="padding:8px;font-weight:bold">Nº Processo:</td><td style="padding:8px">${b.caseNumber}</td></tr>` : ''}
                ${b.plaintiffName ? `<tr><td style="padding:8px;font-weight:bold">Autor:</td><td style="padding:8px">${b.plaintiffName}</td></tr>` : ''}
                ${b.defendantName ? `<tr style="background:#fff"><td style="padding:8px;font-weight:bold">Réu:</td><td style="padding:8px">${b.defendantName}</td></tr>` : ''}
                ${b.court ? `<tr><td style="padding:8px;font-weight:bold">Vara/Tribunal:</td><td style="padding:8px">${b.court}</td></tr>` : ''}
              </table>
              <p style="margin-top:20px;color:#666">Acesse o sistema para visualizar os detalhes completos do processo.</p>
            </div>
          </div>`

        const { whatsappService } = await import('../../services/whatsapp.service.js')
        const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
        const emailOk = isEmailConfigured()

        for (const lawyer of lawyers) {
          const settings = typeof lawyer.settings === 'object' ? lawyer.settings : {}
          const notifyWA    = settings.notifyWhatsapp !== false // default true
          const notifyMail  = settings.notifyEmail    !== false // default true

          // WhatsApp
          if (notifyWA && lawyer.phone) {
            const phone = lawyer.phone.replace(/\D/g, '')
            whatsappService.sendText(phone, msgText).catch(() => {})
          }

          // E-mail
          if (notifyMail && lawyer.email && emailOk) {
            sendEmail({
              to: lawyer.email,
              subject: `[Jurídico] Novo Processo: ${b.title}`,
              html: emailHtml,
              text: msgText,
            }).catch(() => {})
          }
        }
      } catch (err) {
        console.error('[legal] notify lawyers error:', err)
      }
    })

    await createAuditLog({
      prisma: app.prisma, req,
      action: 'legal.create',
      resource: 'legal', resourceId: newCase.id,
      after: { title: newCase.title, type: newCase.type, status: newCase.status } as any,
    })
    return reply.status(201).send(newCase)
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
      WHERE lu."caseId" = $1
      ORDER BY lu."createdAt" DESC`, id)

    // Buscar documentos vinculados
    const documents = await app.prisma.$queryRawUnsafe<any[]>(`
      SELECT id, name, type, category, month, year, "mimeType", "fileSize", metadata, "createdAt"
      FROM documents
      WHERE "companyId" = $1 AND (
        "legalCaseId" = $3
        OR type = 'JURIDICO'
        OR ("clientId" = $2 AND type IN ('JURIDICO','CONTRATO','RESCISAO','DOCUMENTO'))
      )
      ORDER BY
        CASE WHEN "legalCaseId" = $3 THEN 0 ELSE 1 END,
        year DESC NULLS LAST, month DESC NULLS LAST, name ASC
      LIMIT 100`,
      cid, rows[0].clientId ?? 'none', id)

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
    await createAuditLog({
      prisma: app.prisma, req,
      action: 'legal.update',
      resource: 'legal', resourceId: id,
      after: rows[0] as any,
    })
    return reply.send(rows[0])
  })

  // ── DELETE /api/v1/legal/:id ────────────────────────────────────────────
  app.delete('/:id', async (req, reply) => {
    const cid = req.user.cid
    const { id } = req.params as { id: string }
    const rows = await app.prisma.$queryRawUnsafe<any[]>(
      `DELETE FROM legal_cases WHERE id = $1 AND "companyId" = $2 RETURNING id`, id, cid)
    if (!rows.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    await createAuditLog({
      prisma: app.prisma, req,
      action: 'legal.delete',
      resource: 'legal', resourceId: id,
    })
    return reply.send({ success: true })
  })

  // ── POST /api/v1/legal/:id/updates ───────────────────────────────────────────────────
  app.post('/:id/updates', async (req, reply) => {
    const cid = req.user.cid
    const userId = req.user.sub
    const { id } = req.params as { id: string }
    const b = z.object({
      description: z.string().min(3),
      type: z.enum(['ANDAMENTO','AUDIENCIA','DECISAO','RECURSO','ACORDO','CITACAO','PETICAO','OUTROS']).default('ANDAMENTO'),
      occurredAt: z.string().optional(),
    }).parse(req.body)
    const existing = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM legal_cases WHERE id = $1 AND "companyId" = $2`, id, cid)
    if (!existing.length) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updateId = genId()
    await app.prisma.$executeRawUnsafe(`
      INSERT INTO legal_case_updates (id, "caseId", "companyId", "userId", description, type, "date", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      updateId, id, cid, userId, b.description, b.type,
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
