/**
 * IPTU Carnê Routes — Carnê de IPTU parcelado (Uniloc iptu/lanciptu)
 *
 *   POST /api/v1/iptu                          — cria carnê + gera parcelas
 *   GET  /api/v1/iptu                           — lista (filtros: propertyId, year, status)
 *   GET  /api/v1/iptu/:id                        — carnê + parcelas
 *   POST /api/v1/iptu/:id/installments/:n/pay    — paga uma parcela (fecha o carnê se todas pagas)
 *   POST /api/v1/iptu/:id/cancel                 — cancela carnê
 *
 * O cronograma de parcelas reaproveita `generateInstallmentPlan` (acordos).
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { generateInstallmentPlan } from '../../services/agreement.service.js'

export default async function iptuRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)
  const db = () => app.prisma as any

  // POST / — cria carnê e gera parcelas
  app.post('/', { schema: { tags: ['iptu'], summary: 'Create IPTU carnê with installments' } }, async (req, reply) => {
    const b = z.object({
      propertyId: z.string().optional(),
      contractId: z.string().optional(),
      year: z.number().int().min(2000).max(2100),
      iptuCode: z.string().optional(),
      totalAmount: z.number().positive(),
      installments: z.number().int().min(1).max(24),
      firstDueDate: z.string(),
      chargeToTenant: z.boolean().default(true),
      notes: z.string().optional(),
    }).parse(req.body)

    const plan = generateInstallmentPlan({
      agreedValue: b.totalAmount,
      installments: b.installments,
      firstDueDate: new Date(b.firstDueDate),
    })

    const created = await db().iptuCarne.create({
      data: {
        companyId: req.user.cid,
        propertyId: b.propertyId ?? null,
        contractId: b.contractId ?? null,
        year: b.year,
        iptuCode: b.iptuCode ?? null,
        totalAmount: b.totalAmount,
        installments: b.installments,
        chargeToTenant: b.chargeToTenant,
        notes: b.notes ?? null,
        createdBy: req.user.sub ?? null,
        schedule: { create: plan.map((p) => ({ number: p.number, dueDate: new Date(p.dueDate), amount: p.amount })) },
      },
      include: { schedule: { orderBy: { number: 'asc' } } },
    })
    return reply.status(201).send({ success: true, data: created })
  })

  // GET / — lista carnês
  app.get('/', { schema: { tags: ['iptu'], summary: 'List IPTU carnês' } }, async (req, reply) => {
    const q = req.query as any
    const where: any = { companyId: req.user.cid }
    if (q.propertyId) where.propertyId = q.propertyId
    if (q.year) where.year = parseInt(q.year)
    if (q.status) where.status = q.status
    const rows = await db().iptuCarne.findMany({ where, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }], include: { schedule: { orderBy: { number: 'asc' } } }, take: 200 })
    return reply.send({ success: true, data: rows })
  })

  // GET /:id — carnê + parcelas
  app.get('/:id', { schema: { tags: ['iptu'], summary: 'Get IPTU carnê' } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const row = await db().iptuCarne.findFirst({ where: { id, companyId: req.user.cid }, include: { schedule: { orderBy: { number: 'asc' } } } })
    if (!row) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ success: true, data: row })
  })

  // POST /:id/installments/:number/pay
  app.post('/:id/installments/:number/pay', { schema: { tags: ['iptu'], summary: 'Pay IPTU installment' } }, async (req, reply) => {
    const { id, number } = req.params as { id: string; number: string }
    const carne = await db().iptuCarne.findFirst({ where: { id, companyId: req.user.cid }, select: { id: true, status: true } })
    if (!carne) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (carne.status === 'CANCELLED') return reply.status(409).send({ error: 'CANCELLED' })

    const inst = await db().iptuInstallment.findFirst({ where: { carneId: id, number: parseInt(number) } })
    if (!inst) return reply.status(404).send({ error: 'INSTALLMENT_NOT_FOUND' })

    await db().iptuInstallment.update({ where: { id: inst.id }, data: { status: 'PAID', paidAt: new Date() } })

    const pending = await db().iptuInstallment.count({ where: { carneId: id, status: { not: 'PAID' } } })
    if (pending === 0) await db().iptuCarne.update({ where: { id }, data: { status: 'SETTLED' } })

    const updated = await db().iptuCarne.findFirst({ where: { id }, include: { schedule: { orderBy: { number: 'asc' } } } })
    return reply.send({ success: true, data: updated })
  })

  // POST /:id/cancel
  app.post('/:id/cancel', { schema: { tags: ['iptu'], summary: 'Cancel IPTU carnê' } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const carne = await db().iptuCarne.findFirst({ where: { id, companyId: req.user.cid }, select: { id: true } })
    if (!carne) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await db().iptuCarne.update({ where: { id }, data: { status: 'CANCELLED' } })
    return reply.send({ success: true, data: updated })
  })
}
