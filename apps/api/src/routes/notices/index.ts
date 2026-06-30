/**
 * Formal Notices Routes — Notificações formais/extrajudiciais (Uniloc notifics)
 *
 *   GET    /api/v1/notices                 — lista (filtros: status, type, contractId)
 *   POST   /api/v1/notices                 — cria notificação
 *   PATCH  /api/v1/notices/:id             — atualiza
 *   POST   /api/v1/notices/:id/send        — marca como enviada
 *   POST   /api/v1/notices/:id/resolve     — marca como resolvida
 *   DELETE /api/v1/notices/:id             — cancela
 */

import type { FastifyInstance } from 'fastify'
import { requirePermission } from '../../utils/permissions.js'
import { z } from 'zod'

const TYPES = ['AVISO_COBRANCA', 'EXTRAJUDICIAL', 'DESPEJO', 'REAJUSTE', 'RENOVACAO', 'OUTRO'] as const
const RECIPIENTS = ['TENANT', 'LANDLORD', 'OTHER'] as const

export default async function noticesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)
  const canView = requirePermission('notices', 'view')
  const canEdit = requirePermission('notices', 'edit')
  const db = () => app.prisma as any

  app.get('/', { preHandler: canView, schema: { tags: ['notices'], summary: 'List formal notices' } }, async (req, reply) => {
    const q = req.query as any
    const where: any = { companyId: req.user.cid }
    if (q.status) where.status = q.status
    if (q.type) where.type = q.type
    if (q.contractId) where.contractId = q.contractId
    const rows = await db().formalNotice.findMany({ where, orderBy: { noticeDate: 'desc' }, take: 200 })
    return reply.send({ success: true, data: rows })
  })

  app.post('/', { preHandler: canEdit, schema: { tags: ['notices'], summary: 'Create formal notice' } }, async (req, reply) => {
    const b = z.object({
      contractId: z.string().optional(),
      recipient: z.enum(RECIPIENTS).default('TENANT'),
      recipientName: z.string().optional(),
      type: z.enum(TYPES),
      subject: z.string().min(1),
      body: z.string().optional(),
      noticeDate: z.string().optional(),
    }).parse(req.body)

    if (b.contractId) {
      const c = await app.prisma.contract.findFirst({ where: { id: b.contractId, companyId: req.user.cid }, select: { id: true } })
      if (!c) return reply.status(404).send({ error: 'CONTRACT_NOT_FOUND' })
    }

    const created = await db().formalNotice.create({
      data: {
        companyId: req.user.cid,
        contractId: b.contractId ?? null,
        recipient: b.recipient,
        recipientName: b.recipientName ?? null,
        type: b.type,
        subject: b.subject,
        body: b.body ?? null,
        noticeDate: b.noticeDate ? new Date(b.noticeDate) : new Date(),
        operator: req.user.sub ?? null,
      },
    })
    return reply.status(201).send({ success: true, data: created })
  })

  app.patch('/:id', { preHandler: canEdit, schema: { tags: ['notices'], summary: 'Update formal notice' } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().formalNotice.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const b = z.object({
      subject: z.string().min(1).optional(),
      body: z.string().optional(),
      type: z.enum(TYPES).optional(),
      recipientName: z.string().optional(),
    }).parse(req.body)
    const updated = await db().formalNotice.update({
      where: { id },
      data: {
        ...(b.subject !== undefined ? { subject: b.subject } : {}),
        ...(b.body !== undefined ? { body: b.body } : {}),
        ...(b.type !== undefined ? { type: b.type } : {}),
        ...(b.recipientName !== undefined ? { recipientName: b.recipientName } : {}),
      },
    })
    return reply.send({ success: true, data: updated })
  })

  app.post('/:id/send', { preHandler: canEdit, schema: { tags: ['notices'], summary: 'Mark notice as sent' } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().formalNotice.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await db().formalNotice.update({ where: { id }, data: { status: 'SENT' } })
    return reply.send({ success: true, data: updated })
  })

  app.post('/:id/resolve', { preHandler: canEdit, schema: { tags: ['notices'], summary: 'Resolve notice' } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().formalNotice.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await db().formalNotice.update({ where: { id }, data: { status: 'RESOLVED', resolvedAt: new Date() } })
    return reply.send({ success: true, data: updated })
  })

  app.delete('/:id', { preHandler: canEdit, schema: { tags: ['notices'], summary: 'Cancel notice' } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().formalNotice.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await db().formalNotice.update({ where: { id }, data: { status: 'CANCELLED' } })
    return reply.send({ success: true, data: updated })
  })
}
