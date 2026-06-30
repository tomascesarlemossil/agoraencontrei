/**
 * Payables Routes — Contas a Pagar + Cheques
 *
 * Financeiro interno da imobiliária (equivalente Uniloc cadespe/cp_cheqs).
 *
 * Contas a pagar:
 *   GET    /api/v1/payables                 — lista (filtros: status, vencidas, período)
 *   GET    /api/v1/payables/summary         — totais por status
 *   POST   /api/v1/payables                 — cria conta a pagar
 *   PATCH  /api/v1/payables/:id             — atualiza
 *   POST   /api/v1/payables/:id/pay         — marca como paga
 *   DELETE /api/v1/payables/:id             — cancela (status CANCELLED)
 *
 * Cheques:
 *   GET    /api/v1/payables/checks          — lista cheques
 *   POST   /api/v1/payables/checks          — cria cheque
 *   POST   /api/v1/payables/checks/:id/clear — compensa cheque
 *   POST   /api/v1/payables/checks/:id/cancel — cancela cheque
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const PAYABLE_STATUS = ['PENDING', 'PAID', 'CANCELLED'] as const
const CHECK_STATUS = ['PENDING', 'CLEARED', 'CANCELLED'] as const

export default async function payablesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)
  const db = () => app.prisma as any

  // ── Contas a Pagar ────────────────────────────────────────────────────────

  // GET / — lista contas a pagar
  app.get('/', {
    schema: { tags: ['payables'], summary: 'List accounts payable' },
  }, async (req, reply) => {
    const q = req.query as any
    const where: any = { companyId: req.user.cid }
    if (q.status && (PAYABLE_STATUS as readonly string[]).includes(q.status)) where.status = q.status
    if (q.overdue === 'true') {
      where.status = 'PENDING'
      where.dueDate = { lt: new Date() }
    }
    if (q.from || q.to) {
      where.dueDate = {
        ...(where.dueDate ?? {}),
        ...(q.from ? { gte: new Date(q.from) } : {}),
        ...(q.to ? { lte: new Date(q.to) } : {}),
      }
    }
    const page = Math.max(1, parseInt(q.page ?? '1'))
    const limit = Math.min(200, Math.max(1, parseInt(q.limit ?? '50')))
    const [items, total] = await Promise.all([
      db().accountPayable.findMany({
        where, orderBy: { dueDate: 'asc' }, skip: (page - 1) * limit, take: limit,
      }),
      db().accountPayable.count({ where }),
    ])
    return reply.send({ success: true, data: { items, total, page, limit } })
  })

  // GET /summary — totais por status
  app.get('/summary', {
    schema: { tags: ['payables'], summary: 'Accounts payable summary' },
  }, async (req, reply) => {
    const companyId = req.user.cid
    const now = new Date()
    const grouped = await db().accountPayable.groupBy({
      by: ['status'],
      where: { companyId },
      _sum: { amount: true },
      _count: { _all: true },
    })
    const overdue = await db().accountPayable.aggregate({
      where: { companyId, status: 'PENDING', dueDate: { lt: now } },
      _sum: { amount: true },
      _count: { _all: true },
    })
    return reply.send({
      success: true,
      data: {
        byStatus: grouped.map((g: any) => ({
          status: g.status,
          total: Number(g._sum.amount ?? 0),
          count: g._count._all,
        })),
        overdue: { total: Number(overdue._sum.amount ?? 0), count: overdue._count._all },
      },
    })
  })

  // POST / — cria conta a pagar
  app.post('/', {
    schema: { tags: ['payables'], summary: 'Create account payable' },
  }, async (req, reply) => {
    const body = z.object({
      description: z.string().min(1),
      payeeName: z.string().min(1),
      payeeId: z.string().optional(),
      category: z.string().optional(),
      documentNumber: z.string().optional(),
      amount: z.number().positive(),
      dueDate: z.string(),
      paymentMethod: z.string().optional(),
      contractId: z.string().optional(),
      propertyId: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body)

    const created = await db().accountPayable.create({
      data: {
        companyId: req.user.cid,
        description: body.description,
        payeeName: body.payeeName,
        payeeId: body.payeeId ?? null,
        category: body.category ?? null,
        documentNumber: body.documentNumber ?? null,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        paymentMethod: body.paymentMethod ?? null,
        contractId: body.contractId ?? null,
        propertyId: body.propertyId ?? null,
        notes: body.notes ?? null,
        createdBy: req.user.sub ?? null,
      },
    })
    return reply.status(201).send({ success: true, data: created })
  })

  // PATCH /:id — atualiza campos editáveis
  app.patch('/:id', {
    schema: { tags: ['payables'], summary: 'Update account payable' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().accountPayable.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    const body = z.object({
      description: z.string().min(1).optional(),
      payeeName: z.string().min(1).optional(),
      category: z.string().optional(),
      documentNumber: z.string().optional(),
      amount: z.number().positive().optional(),
      dueDate: z.string().optional(),
      paymentMethod: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body)

    const updated = await db().accountPayable.update({
      where: { id },
      data: {
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.payeeName !== undefined ? { payeeName: body.payeeName } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.documentNumber !== undefined ? { documentNumber: body.documentNumber } : {}),
        ...(body.amount !== undefined ? { amount: body.amount } : {}),
        ...(body.dueDate !== undefined ? { dueDate: new Date(body.dueDate) } : {}),
        ...(body.paymentMethod !== undefined ? { paymentMethod: body.paymentMethod } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
    })
    return reply.send({ success: true, data: updated })
  })

  // POST /:id/pay — marca como paga
  app.post('/:id/pay', {
    schema: { tags: ['payables'], summary: 'Mark account payable as paid' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().accountPayable.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (existing.status === 'CANCELLED') return reply.status(409).send({ error: 'CANCELLED' })

    const body = z.object({
      paidAt: z.string().optional(),
      paymentDoc: z.string().optional(),
      paymentMethod: z.string().optional(),
    }).parse(req.body ?? {})

    const updated = await db().accountPayable.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        ...(body.paymentDoc !== undefined ? { paymentDoc: body.paymentDoc } : {}),
        ...(body.paymentMethod !== undefined ? { paymentMethod: body.paymentMethod } : {}),
      },
    })
    return reply.send({ success: true, data: updated })
  })

  // DELETE /:id — cancela (não apaga, mantém histórico)
  app.delete('/:id', {
    schema: { tags: ['payables'], summary: 'Cancel account payable' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().accountPayable.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await db().accountPayable.update({ where: { id }, data: { status: 'CANCELLED' } })
    return reply.send({ success: true, data: updated })
  })

  // ── Cheques ────────────────────────────────────────────────────────────────

  // GET /checks — lista cheques
  app.get('/checks', {
    schema: { tags: ['payables'], summary: 'List bank checks' },
  }, async (req, reply) => {
    const q = req.query as any
    const where: any = { companyId: req.user.cid }
    if (q.status && (CHECK_STATUS as readonly string[]).includes(q.status)) where.status = q.status
    const checks = await db().bankCheck.findMany({ where, orderBy: { dueDate: 'asc' }, take: 200 })
    return reply.send({ success: true, data: checks })
  })

  // POST /checks — cria cheque (opcionalmente vinculado a uma conta a pagar)
  app.post('/checks', {
    schema: { tags: ['payables'], summary: 'Create bank check' },
  }, async (req, reply) => {
    const body = z.object({
      checkNumber: z.string().min(1),
      amount: z.number().positive(),
      bankCode: z.string().optional(),
      payeeName: z.string().optional(),
      category: z.string().optional(),
      issueDate: z.string().optional(),
      dueDate: z.string().optional(),
      accountPayableId: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body)

    // Se vinculado a conta a pagar, garante que pertence à mesma empresa.
    if (body.accountPayableId) {
      const ap = await db().accountPayable.findFirst({
        where: { id: body.accountPayableId, companyId: req.user.cid },
        select: { id: true },
      })
      if (!ap) return reply.status(404).send({ error: 'ACCOUNT_PAYABLE_NOT_FOUND' })
    }

    const created = await db().bankCheck.create({
      data: {
        companyId: req.user.cid,
        checkNumber: body.checkNumber,
        amount: body.amount,
        bankCode: body.bankCode ?? null,
        payeeName: body.payeeName ?? null,
        category: body.category ?? null,
        issueDate: body.issueDate ? new Date(body.issueDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        accountPayableId: body.accountPayableId ?? null,
        notes: body.notes ?? null,
      },
    })
    return reply.status(201).send({ success: true, data: created })
  })

  // POST /checks/:id/clear — compensa cheque
  app.post('/checks/:id/clear', {
    schema: { tags: ['payables'], summary: 'Clear bank check' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().bankCheck.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (existing.status === 'CANCELLED') return reply.status(409).send({ error: 'CANCELLED' })
    const updated = await db().bankCheck.update({
      where: { id }, data: { status: 'CLEARED', clearedAt: new Date() },
    })
    return reply.send({ success: true, data: updated })
  })

  // POST /checks/:id/cancel — cancela cheque
  app.post('/checks/:id/cancel', {
    schema: { tags: ['payables'], summary: 'Cancel bank check' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().bankCheck.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await db().bankCheck.update({ where: { id }, data: { status: 'CANCELLED' } })
    return reply.send({ success: true, data: updated })
  })
}
