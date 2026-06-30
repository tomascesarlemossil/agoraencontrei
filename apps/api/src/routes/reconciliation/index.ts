/**
 * Reconciliation Routes — Conciliação bancária (extrato / CNAB retorno)
 *
 *   POST /api/v1/reconciliation/import   — importa entradas (CSV/CNAB400/JSON),
 *                                          concilia contra aluguéis em aberto
 *                                          e (opcional) dá baixa nos conciliados.
 *   GET  /api/v1/reconciliation          — lista lotes de conciliação
 *   GET  /api/v1/reconciliation/:id      — lote + entradas
 *   POST /api/v1/reconciliation/entries/:id/match — concilia manualmente uma entrada
 */

import type { FastifyInstance } from 'fastify'
import { requirePermission } from '../../utils/permissions.js'
import { z } from 'zod'
import {
  parseCsvStatement,
  parseCnab400Return,
  matchEntries,
  type ParsedEntry,
  type MatchCandidate,
} from '../../services/reconciliation.service.js'

export default async function reconciliationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)
  const canView = requirePermission('reconciliation', 'view')
  const canEdit = requirePermission('reconciliation', 'edit')
  const db = () => app.prisma as any

  // POST /import — importa + concilia
  app.post('/import', { preHandler: canEdit,
    schema: { tags: ['reconciliation'], summary: 'Import statement and reconcile' },
  }, async (req, reply) => {
    const b = z.object({
      source: z.enum(['CSV', 'CNAB400', 'JSON']),
      reference: z.string().optional(),
      bankCode: z.string().optional(),
      content: z.string().optional(), // para CSV/CNAB400
      delimiter: z.string().optional(),
      entries: z.array(z.object({ // para JSON
        entryDate: z.string(),
        amount: z.number(),
        direction: z.enum(['CREDIT', 'DEBIT']).optional(),
        description: z.string().optional(),
        nossoNumero: z.string().optional(),
        documentNumber: z.string().optional(),
        occurrenceCode: z.string().optional(),
      })).optional(),
      autoSettle: z.boolean().default(false), // dá baixa nos aluguéis conciliados
    }).parse(req.body)

    // 1. Parse das entradas conforme a origem.
    let parsed: ParsedEntry[] = []
    if (b.source === 'CSV') {
      if (!b.content) return reply.status(400).send({ error: 'MISSING_CONTENT' })
      parsed = parseCsvStatement(b.content, b.delimiter ?? ',')
    } else if (b.source === 'CNAB400') {
      if (!b.content) return reply.status(400).send({ error: 'MISSING_CONTENT' })
      parsed = parseCnab400Return(b.content)
    } else {
      parsed = (b.entries ?? []).map((e) => ({
        ...e,
        direction: e.direction ?? 'CREDIT',
        amount: Math.abs(e.amount),
      }))
    }
    if (parsed.length === 0) return reply.status(400).send({ error: 'NO_ENTRIES_PARSED' })

    // 2. Candidatos = aluguéis em aberto da empresa.
    const openRentals = await db().rental.findMany({
      where: { companyId: req.user.cid, status: { in: ['PENDING', 'LATE'] } },
      select: { id: true, boletoNumber: true, totalAmount: true, rentAmount: true, dueDate: true },
      take: 5000,
    })
    const candidates: MatchCandidate[] = openRentals.map((r: any) => ({
      rentalId: r.id,
      nossoNumero: r.boletoNumber ?? undefined,
      amount: Number(r.totalAmount ?? r.rentAmount ?? 0),
      dueDate: r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : undefined,
    }))

    // 3. Matching (puro).
    const matched = matchEntries(parsed, candidates)
    const matchedCount = matched.filter((m) => m.matchStatus === 'MATCHED').length

    // 4. Persiste o lote + entradas.
    const recon = await db().bankReconciliation.create({
      data: {
        companyId: req.user.cid,
        source: b.source,
        reference: b.reference ?? null,
        bankCode: b.bankCode ?? null,
        totalEntries: matched.length,
        matchedCount,
        unmatchedCount: matched.length - matchedCount,
        status: matchedCount === matched.length ? 'RECONCILED' : matchedCount > 0 ? 'PARTIAL' : 'IMPORTED',
        createdBy: req.user.sub ?? null,
        entries: {
          create: matched.map((m) => ({
            companyId: req.user.cid,
            entryDate: new Date(m.entryDate),
            amount: m.amount,
            direction: m.direction,
            description: m.description ?? null,
            nossoNumero: m.nossoNumero ?? null,
            documentNumber: m.documentNumber ?? null,
            occurrenceCode: m.occurrenceCode ?? null,
            matchStatus: m.matchStatus,
            matchedRentalId: m.matchedRentalId ?? null,
            matchedInvoiceId: m.matchedInvoiceId ?? null,
          })),
        },
      },
      include: { entries: true },
    })

    // 5. Baixa opcional dos aluguéis conciliados.
    let settled = 0
    if (b.autoSettle) {
      for (const m of matched) {
        if (m.matchStatus === 'MATCHED' && m.matchedRentalId) {
          await db().rental.update({
            where: { id: m.matchedRentalId },
            data: {
              status: 'PAID',
              paidAmount: m.amount,
              paymentDate: new Date(m.entryDate),
              paymentMethod: 'BOLETO',
            },
          }).then(() => { settled++ }).catch(() => {})
        }
      }
    }

    return reply.status(201).send({ success: true, data: { reconciliation: recon, matchedCount, settled } })
  })

  // GET / — lista lotes
  app.get('/', { preHandler: canView, schema: { tags: ['reconciliation'], summary: 'List reconciliation batches' } }, async (req, reply) => {
    const rows = await db().bankReconciliation.findMany({
      where: { companyId: req.user.cid }, orderBy: { importedAt: 'desc' }, take: 100,
    })
    return reply.send({ success: true, data: rows })
  })

  // GET /:id — lote + entradas
  app.get('/:id', { preHandler: canView, schema: { tags: ['reconciliation'], summary: 'Get reconciliation with entries' } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const row = await db().bankReconciliation.findFirst({
      where: { id, companyId: req.user.cid },
      include: { entries: { orderBy: { entryDate: 'asc' } } },
    })
    if (!row) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ success: true, data: row })
  })

  // POST /entries/:id/match — concilia manualmente uma entrada a um aluguel
  app.post('/entries/:id/match', { preHandler: canEdit, schema: { tags: ['reconciliation'], summary: 'Manually match an entry' } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const b = z.object({ rentalId: z.string(), settle: z.boolean().default(false) }).parse(req.body)

    const entry = await db().bankStatementEntry.findFirst({ where: { id, companyId: req.user.cid } })
    if (!entry) return reply.status(404).send({ error: 'NOT_FOUND' })
    const rental = await db().rental.findFirst({ where: { id: b.rentalId, companyId: req.user.cid }, select: { id: true } })
    if (!rental) return reply.status(404).send({ error: 'RENTAL_NOT_FOUND' })

    const updated = await db().bankStatementEntry.update({
      where: { id }, data: { matchStatus: 'MATCHED', matchedRentalId: b.rentalId },
    })
    if (b.settle) {
      await db().rental.update({
        where: { id: b.rentalId },
        data: { status: 'PAID', paidAmount: entry.amount, paymentDate: entry.entryDate, paymentMethod: 'BOLETO' },
      }).catch(() => {})
    }
    return reply.send({ success: true, data: updated })
  })
}
