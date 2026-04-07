import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { FiscalService } from '../../services/fiscal.service.js'
import { createInvoice as createAsaasInvoice, getInvoice as getAsaasInvoice, cancelInvoice as cancelAsaasInvoice, findOrCreateCustomer } from '../../services/asaas.service.js'
import { createAuditLog } from '../../services/audit.service.js'

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

  // ── POST /api/v1/fiscal/:id/emitir-asaas — emitir NFS-e via Asaas ────
  app.post('/:id/emitir-asaas', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Emitir NFS-e via Asaas' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const cid = req.user.cid

    const note = await app.prisma.fiscalNote.findFirst({
      where: { id, companyId: cid },
    })
    if (!note) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (note.asaasNfeId) return reply.status(400).send({ error: 'ALREADY_SUBMITTED', asaasNfeId: note.asaasNfeId })

    // NFS-e é emitida no valor da taxa de administração (não do aluguel)
    const nfValue = Number(note.serviceFeeValue)
    if (nfValue <= 0) return reply.status(400).send({ error: 'NO_SERVICE_FEE', message: 'Taxa de administração é zero' })

    const competencia = `${note.rentalYear}-${String(note.rentalMonth).padStart(2, '0')}-01`

    const asaasInvoice = await createAsaasInvoice({
      serviceDescription: note.serviceDescription ?? 'Prestação de serviços de administração e intermediação imobiliária',
      observations: `Contrato de locação — ${note.propertyAddress ?? 'Imóvel'}\nProprietário: ${note.landlordName}\nCPF: ${note.landlordCpf}\nReferência: ${String(note.rentalMonth).padStart(2, '0')}/${note.rentalYear}`,
      value: nfValue,
      effectiveDate: competencia,
      externalReference: note.id,
      taxes: {
        retainIss: false,
        iss: 5,       // ISS 5% padrão para serviços imobiliários
      },
    })

    // Atualizar nota no banco com dados do Asaas
    const updated = await app.prisma.fiscalNote.update({
      where: { id },
      data: {
        asaasNfeId:     asaasInvoice.id,
        asaasNfeStatus: asaasInvoice.status,
        asaasNfePdfUrl: asaasInvoice.pdfUrl ?? null,
        nfeNumber:      asaasInvoice.number ?? null,
        status:         'ISSUED',
      },
    })

    // Log
    await app.prisma.fiscalNoteLog.create({
      data: {
        noteId: id, action: 'ASAAS_SUBMIT',
        oldStatus: note.status, newStatus: 'ISSUED',
        details: { asaasId: asaasInvoice.id, status: asaasInvoice.status, value: nfValue },
        createdById: req.user.sub,
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'legal.create',
      resource: 'fiscal-note',
      resourceId: id,
      before: { status: note.status },
      after: { status: 'ISSUED', asaasNfeId: asaasInvoice.id },
    })

    return reply.send({ note: updated, asaas: asaasInvoice })
  })

  // ── POST /api/v1/fiscal/emitir-lote-asaas — emitir NFS-e em lote ─────
  app.post('/emitir-lote-asaas', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Emitir NFS-e em lote via Asaas' },
  }, async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as { month: number; year: number; noteIds?: string[] }

    const where: any = {
      companyId: cid,
      status: 'DRAFT',
      asaasNfeId: null,
      serviceFeeValue: { gt: 0 },
    }
    if (body.noteIds?.length) {
      where.id = { in: body.noteIds }
    } else if (body.month && body.year) {
      where.rentalMonth = body.month
      where.rentalYear = body.year
    }

    const notes = await app.prisma.fiscalNote.findMany({ where })
    const results = { emitidas: 0, erros: [] as string[], total: notes.length }

    for (const note of notes) {
      try {
        const nfValue = Number(note.serviceFeeValue)
        if (nfValue <= 0) { results.erros.push(`${note.id}: taxa zero`); continue }

        const competencia = `${note.rentalYear}-${String(note.rentalMonth).padStart(2, '0')}-01`

        const asaasInvoice = await createAsaasInvoice({
          serviceDescription: note.serviceDescription ?? 'Prestação de serviços de administração e intermediação imobiliária',
          observations: `Proprietário: ${note.landlordName} | CPF: ${note.landlordCpf} | Ref: ${String(note.rentalMonth).padStart(2, '0')}/${note.rentalYear}`,
          value: nfValue,
          effectiveDate: competencia,
          externalReference: note.id,
          taxes: { retainIss: false, iss: 5 },
        })

        await app.prisma.fiscalNote.update({
          where: { id: note.id },
          data: {
            asaasNfeId: asaasInvoice.id, asaasNfeStatus: asaasInvoice.status,
            asaasNfePdfUrl: asaasInvoice.pdfUrl ?? null, nfeNumber: asaasInvoice.number ?? null,
            status: 'ISSUED',
          },
        })

        results.emitidas++
        await new Promise(r => setTimeout(r, 500))
      } catch (err: any) {
        results.erros.push(`${note.landlordName}: ${err.message}`)
      }
    }

    return reply.send(results)
  })

  // ── GET /api/v1/fiscal/:id/sync-asaas — sincronizar status da NFS-e ──
  app.get('/:id/sync-asaas', {
    preHandler: [app.authenticate],
    schema: { tags: ['fiscal'], summary: 'Sincronizar status NFS-e do Asaas' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const note = await app.prisma.fiscalNote.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!note) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (!note.asaasNfeId) return reply.status(400).send({ error: 'NOT_SUBMITTED' })

    const asaasInvoice = await getAsaasInvoice(note.asaasNfeId)

    const updated = await app.prisma.fiscalNote.update({
      where: { id },
      data: {
        asaasNfeStatus: asaasInvoice.status,
        asaasNfePdfUrl: asaasInvoice.pdfUrl ?? note.asaasNfePdfUrl,
        nfeNumber:      asaasInvoice.number ?? note.nfeNumber,
        status:         asaasInvoice.status === 'AUTHORIZED' ? 'ISSUED'
                      : asaasInvoice.status === 'CANCELLED'  ? 'CANCELLED'
                      : asaasInvoice.status === 'ERROR'      ? 'ERROR'
                      : note.status,
      },
    })

    return reply.send({ note: updated, asaas: asaasInvoice })
  })
}
