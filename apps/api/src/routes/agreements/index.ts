/**
 * Agreements Routes — Acordos / Renegociação de dívida
 *
 *   POST /api/v1/agreements                       — cria acordo + gera parcelas
 *   POST /api/v1/agreements/preview               — pré-visualiza o cronograma
 *   GET  /api/v1/agreements                        — lista (filtros: status, contractId)
 *   GET  /api/v1/agreements/:id                    — acordo + parcelas
 *   POST /api/v1/agreements/:id/installments/:n/pay — paga uma parcela
 *   POST /api/v1/agreements/:id/cancel             — cancela acordo
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { generateInstallmentPlan } from '../../services/agreement.service.js'

const createSchema = z.object({
  contractId: z.string().optional(),
  tenantName: z.string().optional(),
  originalDebt: z.number().positive(),
  discountValue: z.number().min(0).default(0),
  agreedValue: z.number().positive(),
  installments: z.number().int().min(1).max(120),
  firstDueDate: z.string(),
  intervalMonths: z.number().int().min(1).max(12).optional(),
  notes: z.string().optional(),
})

export default async function agreementsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)
  const db = () => app.prisma as any

  // POST /preview — pré-visualiza o cronograma sem salvar
  app.post('/preview', {
    schema: { tags: ['agreements'], summary: 'Preview installment plan' },
  }, async (req, reply) => {
    const b = z.object({
      agreedValue: z.number().positive(),
      installments: z.number().int().min(1).max(120),
      firstDueDate: z.string(),
      intervalMonths: z.number().int().min(1).max(12).optional(),
    }).parse(req.body)
    const plan = generateInstallmentPlan({
      agreedValue: b.agreedValue,
      installments: b.installments,
      firstDueDate: new Date(b.firstDueDate),
      intervalMonths: b.intervalMonths,
    })
    return reply.send({ success: true, data: plan })
  })

  // POST / — cria acordo e gera as parcelas
  app.post('/', {
    schema: { tags: ['agreements'], summary: 'Create agreement with schedule' },
  }, async (req, reply) => {
    const b = createSchema.parse(req.body)

    if (b.contractId) {
      const contract = await app.prisma.contract.findFirst({
        where: { id: b.contractId, companyId: req.user.cid },
        select: { id: true },
      })
      if (!contract) return reply.status(404).send({ error: 'CONTRACT_NOT_FOUND' })
    }

    const plan = generateInstallmentPlan({
      agreedValue: b.agreedValue,
      installments: b.installments,
      firstDueDate: new Date(b.firstDueDate),
      intervalMonths: b.intervalMonths,
    })

    const created = await db().agreement.create({
      data: {
        companyId: req.user.cid,
        contractId: b.contractId ?? null,
        tenantName: b.tenantName ?? null,
        originalDebt: b.originalDebt,
        discountValue: b.discountValue,
        agreedValue: b.agreedValue,
        installments: b.installments,
        firstDueDate: new Date(b.firstDueDate),
        status: 'ACTIVE',
        notes: b.notes ?? null,
        createdBy: req.user.sub ?? null,
        schedule: {
          create: plan.map((p) => ({
            number: p.number,
            dueDate: new Date(p.dueDate),
            amount: p.amount,
          })),
        },
      },
      include: { schedule: { orderBy: { number: 'asc' } } },
    })
    return reply.status(201).send({ success: true, data: created })
  })

  // GET / — lista acordos
  app.get('/', {
    schema: { tags: ['agreements'], summary: 'List agreements' },
  }, async (req, reply) => {
    const q = req.query as any
    const where: any = { companyId: req.user.cid }
    if (q.status) where.status = q.status
    if (q.contractId) where.contractId = q.contractId
    const rows = await db().agreement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { schedule: { orderBy: { number: 'asc' } } },
      take: 200,
    })
    return reply.send({ success: true, data: rows })
  })

  // GET /:id — acordo + parcelas
  app.get('/:id', {
    schema: { tags: ['agreements'], summary: 'Get agreement with schedule' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const row = await db().agreement.findFirst({
      where: { id, companyId: req.user.cid },
      include: { schedule: { orderBy: { number: 'asc' } } },
    })
    if (!row) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ success: true, data: row })
  })

  // POST /:id/installments/:number/pay — paga uma parcela; fecha o acordo se todas pagas
  app.post('/:id/installments/:number/pay', {
    schema: { tags: ['agreements'], summary: 'Pay an installment' },
  }, async (req, reply) => {
    const { id, number } = req.params as { id: string; number: string }
    const num = parseInt(number)

    const agreement = await db().agreement.findFirst({
      where: { id, companyId: req.user.cid },
      select: { id: true, status: true },
    })
    if (!agreement) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (agreement.status === 'CANCELLED') return reply.status(409).send({ error: 'CANCELLED' })

    const installment = await db().agreementInstallment.findFirst({
      where: { agreementId: id, number: num },
    })
    if (!installment) return reply.status(404).send({ error: 'INSTALLMENT_NOT_FOUND' })

    const body = z.object({
      paidAt: z.string().optional(),
      paidAmount: z.number().positive().optional(),
    }).parse(req.body ?? {})

    await db().agreementInstallment.update({
      where: { id: installment.id },
      data: {
        status: 'PAID',
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        paidAmount: body.paidAmount ?? installment.amount,
      },
    })

    // Se todas as parcelas estiverem pagas, marca o acordo como cumprido.
    const pendingCount = await db().agreementInstallment.count({
      where: { agreementId: id, status: { not: 'PAID' } },
    })
    if (pendingCount === 0) {
      await db().agreement.update({ where: { id }, data: { status: 'FULFILLED' } })
    }

    const updated = await db().agreement.findFirst({
      where: { id },
      include: { schedule: { orderBy: { number: 'asc' } } },
    })
    return reply.send({ success: true, data: updated })
  })

  // POST /:id/cancel — cancela o acordo
  app.post('/:id/cancel', {
    schema: { tags: ['agreements'], summary: 'Cancel agreement' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const agreement = await db().agreement.findFirst({ where: { id, companyId: req.user.cid }, select: { id: true } })
    if (!agreement) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await db().agreement.update({ where: { id }, data: { status: 'CANCELLED' } })
    return reply.send({ success: true, data: updated })
  })
}
