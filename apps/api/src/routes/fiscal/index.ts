import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { FiscalService } from '../../services/fiscal.service.js'

const VALID_STATUSES = ['DRAFT', 'ISSUED', 'SENT', 'RECEIVED', 'CANCELLED', 'ERROR'] as const

export default async function fiscalRoutes(app: FastifyInstance) {
  // ── GET /api/v1/fiscal — lista notas ─────────────────────────────────
  app.get('/', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Listar notas fiscais' },
  }, async (req, reply) => {
    const q = req.query as any
    const svc = new FiscalService(app.prisma)
    const result = await svc.listar(req.user.cid, {
      month: q.month ? parseInt(q.month) : undefined,
      year: q.year ? parseInt(q.year) : undefined,
      status: q.status || undefined,
      page: q.page ? parseInt(q.page) : 1,
      limit: q.limit ? Math.min(parseInt(q.limit), 100) : 50,
    })
    return reply.send(result)
  })

  // ── POST /api/v1/fiscal/gerar — geração em lote ───────────────────────
  app.post('/gerar', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Gerar notas fiscais do mês' },
  }, async (req, reply) => {
    const { month, year } = z.object({
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2000),
    }).parse(req.body)

    const svc = new FiscalService(app.prisma)
    const result = await svc.gerarMensal(req.user.cid, month, year, req.user.sub)

    return reply.status(201).send({
      message: `Geração concluída: ${result.created} criadas, ${result.skipped} ignoradas, ${result.errors} erros`,
      data: result,
    })
  })

  // ── POST /api/v1/fiscal — cria nota individual ────────────────────────
  app.post('/', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Criar nota fiscal manual' },
  }, async (req, reply) => {
    const body = z.object({
      landlordName: z.string().min(1),
      landlordCpf: z.string().min(11),
      landlordId: z.string().optional(),
      landlordEmail: z.string().email().optional(),
      landlordPhone: z.string().optional(),
      landlordAddress: z.string().optional(),
      propertyId: z.string().optional(),
      propertyAddress: z.string().optional(),
      rentalId: z.string().optional(),
      rentalMonth: z.number().int().min(1).max(12),
      rentalYear: z.number().int().min(2000),
      rentalValue: z.number().positive(),
    }).parse(req.body)

    const svc = new FiscalService(app.prisma)
    const note = await svc.criar(req.user.cid, { ...body, createdById: req.user.sub })
    return reply.status(201).send(note)
  })

  // ── GET /api/v1/fiscal/:id/xml — baixar XML ───────────────────────────
  app.get('/:id/xml', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Download XML NFS-e' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const svc = new FiscalService(app.prisma)
    const note = await svc.buscarPorId(id, req.user.cid)
    const xml = note.nfeXml ?? svc.gerarXml(note)

    reply.header('Content-Type', 'application/xml')
    reply.header('Content-Disposition', `attachment; filename="nfse_${id}.xml"`)
    return reply.send(xml)
  })

  // ── GET /api/v1/fiscal/:id ────────────────────────────────────────────
  app.get('/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Buscar nota fiscal' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const svc = new FiscalService(app.prisma)
    const note = await svc.buscarPorId(id, req.user.cid)
    return reply.send(note)
  })

  // ── PATCH /api/v1/fiscal/:id/status ──────────────────────────────────
  app.patch('/:id/status', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Atualizar status da nota' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status } = z.object({
      status: z.enum(VALID_STATUSES),
    }).parse(req.body)

    const svc = new FiscalService(app.prisma)
    const updated = await svc.atualizarStatus(id, req.user.cid, status, req.user.sub)
    return reply.send(updated)
  })

  // ── DELETE /api/v1/fiscal/:id ─────────────────────────────────────────
  app.delete('/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Excluir nota (apenas DRAFT)' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const svc = new FiscalService(app.prisma)
    await svc.deletar(id, req.user.cid, req.user.sub)
    return reply.send({ success: true, message: 'Nota fiscal excluída com sucesso' })
  })
}
