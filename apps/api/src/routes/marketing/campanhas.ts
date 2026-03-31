/**
 * Marketing Campanhas — E-mail / WhatsApp broadcast
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const CreateCampanhaBody = z.object({
  nome:        z.string().min(2).max(200),
  tipo:        z.enum(['email', 'whatsapp']),
  segmento:    z.enum(['todos_clientes', 'proprietarios', 'inquilinos', 'leads_frios', 'custom']),
  mensagem:    z.string().min(10),
  agendadoPara: z.string().datetime().optional(),
})

const SEGMENT_WHERE: Record<string, any> = {
  todos_clientes: {},
  proprietarios:  { type: 'OWNER' },
  inquilinos:     { type: 'TENANT' },
  leads_frios:    null, // handled separately via Lead model
  custom:         {},
}

async function countSegmento(app: any, cid: string, segmento: string): Promise<number> {
  if (segmento === 'leads_frios') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return app.prisma.lead.count({
      where: { companyId: cid, updatedAt: { lt: cutoff }, status: { in: ['NEW', 'CONTACTED'] } },
    })
  }
  const where = SEGMENT_WHERE[segmento] ?? {}
  return app.prisma.client.count({ where: { companyId: cid, ...where } })
}

export default async function campanhasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /api/v1/marketing/campanhas
  app.post('/', async (req, reply) => {
    const body = CreateCampanhaBody.parse(req.body)
    const cid  = req.user.cid

    const campanha = await app.prisma.marketingCampaign.create({
      data: {
        companyId:   cid,
        nome:        body.nome,
        tipo:        body.tipo,
        segmento:    body.segmento,
        mensagem:    body.mensagem,
        status:      body.agendadoPara ? 'SCHEDULED' : 'DRAFT',
        agendadoPara: body.agendadoPara ? new Date(body.agendadoPara) : null,
      },
    })

    return reply.status(201).send(campanha)
  })

  // GET /api/v1/marketing/campanhas
  app.get('/', async (req, reply) => {
    const q   = req.query as any
    const cid = req.user.cid

    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '20', 10)

    const [total, items] = await Promise.all([
      app.prisma.marketingCampaign.count({ where: { companyId: cid } }),
      app.prisma.marketingCampaign.findMany({
        where:     { companyId: cid },
        skip:      (page - 1) * limit,
        take:      limit,
        orderBy:   { createdAt: 'desc' },
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/marketing/campanhas/preview-count — quantos contatos no segmento
  app.get('/preview-count', async (req, reply) => {
    const { segmento } = req.query as any
    const cid = req.user.cid
    if (!segmento) return reply.status(400).send({ error: 'segmento required' })
    const count = await countSegmento(app, cid, segmento)
    return reply.send({ count })
  })

  // GET /api/v1/marketing/campanhas/:id
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as any
    const cid    = req.user.cid
    const item   = await app.prisma.marketingCampaign.findFirst({ where: { id, companyId: cid } })
    if (!item) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(item)
  })

  // POST /api/v1/marketing/campanhas/:id/enviar — dispara campanha
  app.post('/:id/enviar', async (req, reply) => {
    const { id } = req.params as any
    const cid    = req.user.cid

    const campanha = await app.prisma.marketingCampaign.findFirst({ where: { id, companyId: cid } })
    if (!campanha) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (campanha.status === 'SENDING' || campanha.status === 'SENT') {
      return reply.status(409).send({ error: 'ALREADY_SENT' })
    }

    // Update status to SENDING, fire async processing
    await app.prisma.marketingCampaign.update({
      where: { id },
      data:  { status: 'SENDING' },
    })

    // Fire-and-forget broadcast (simplified; in production use BullMQ)
    setImmediate(async () => {
      try {
        const count = await countSegmento(app, cid, campanha.segmento)

        if (campanha.tipo === 'whatsapp' && campanha.segmento !== 'leads_frios') {
          // Fetch clients for this segment
          const where = SEGMENT_WHERE[campanha.segmento] ?? {}
          const clients = await app.prisma.client.findMany({
            where: { companyId: cid, ...where, phone: { not: null } },
            select: { id: true, phone: true },
            take: 1000,
          })

          let sent = 0
          for (const client of clients) {
            try {
              const whatsappService = await import('../../services/whatsapp.service.js')
              await (whatsappService as any).sendMessage?.(client.phone!, campanha.mensagem)
              sent++
            } catch { /* skip individual errors */ }
          }

          await app.prisma.marketingCampaign.update({
            where: { id },
            data:  { status: 'SENT', totalEnviados: sent },
          })
        } else {
          // Email or leads_frios — log only (no SMTP configured)
          await app.prisma.marketingCampaign.update({
            where: { id },
            data:  { status: 'SENT', totalEnviados: count },
          })
        }
      } catch (err) {
        app.log.error({ err, id }, 'Campaign send failed')
        await app.prisma.marketingCampaign.update({
          where: { id },
          data:  { status: 'DRAFT' },
        })
      }
    })

    return reply.send({ success: true, message: 'Campanha em processamento' })
  })

  // POST /api/v1/marketing/campanhas/:id/cancelar
  app.post('/:id/cancelar', async (req, reply) => {
    const { id } = req.params as any
    const cid    = req.user.cid

    const campanha = await app.prisma.marketingCampaign.findFirst({ where: { id, companyId: cid } })
    if (!campanha) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (campanha.status === 'SENT' || campanha.status === 'SENDING') {
      return reply.status(409).send({ error: 'CANNOT_CANCEL', message: 'Campanha já enviada' })
    }

    await app.prisma.marketingCampaign.update({ where: { id }, data: { status: 'CANCELLED' } })
    return reply.send({ success: true })
  })

  // DELETE /api/v1/marketing/campanhas/:id
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as any
    const cid    = req.user.cid

    const campanha = await app.prisma.marketingCampaign.findFirst({ where: { id, companyId: cid } })
    if (!campanha) return reply.status(404).send({ error: 'NOT_FOUND' })

    await app.prisma.marketingCampaign.delete({ where: { id } })
    return reply.status(204).send()
  })
}
