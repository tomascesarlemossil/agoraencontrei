/**
 * Hunter Mode Routes — Leads de busca difícil
 *
 * POST /api/v1/hunter/leads — Cria lead Hunter (quando Tomás detecta busca sem resultado)
 * GET  /api/v1/hunter/leads — Lista leads Hunter (dashboard)
 * PUT  /api/v1/hunter/leads/:id — Atualiza status do lead Hunter
 * GET  /api/v1/hunter/stats — Estatísticas do Hunter Mode
 */

import type { FastifyInstance } from 'fastify'

export default async function hunterRoutes(app: FastifyInstance) {
  const prisma = app.prisma as any

  // ── POST /leads — Criar HunterLead ──────────────────────────────────────────
  app.post('/leads', async (req, reply) => {
    const body = req.body as {
      leadId?: string
      contactId?: string
      visitorId?: string
      name?: string
      phone?: string
      email?: string
      filters: {
        city?: string
        neighborhood?: string
        priceMin?: number
        priceMax?: number
        type?: string
        bedrooms?: number
        intent?: string
      }
      source?: string
    }

    if (!body.filters || Object.keys(body.filters).length === 0) {
      return reply.status(400).send({ error: 'Filtros obrigatórios' })
    }

    const hunterLead = await prisma.hunterLead.create({
      data: {
        leadId: body.leadId || null,
        contactId: body.contactId || null,
        visitorId: body.visitorId || null,
        name: body.name || null,
        phone: body.phone || null,
        email: body.email || null,
        filters: body.filters,
        status: 'active',
        priority: 'URGENTE_HUNTER',
        source: body.source || 'site_search',
      },
    })

    // Audit event: hunter.lead.created
    await prisma.auditLog.create({
      data: {
        companyId: 'platform',
        action: 'hunter.lead.created',
        resource: 'hunter_lead',
        resourceId: hunterLead.id,
        payload: {
          filters: body.filters,
          priority: 'URGENTE_HUNTER',
          source: body.source || 'site_search',
        },
      },
    }).catch(() => {})

    app.log.info(`[hunter] Lead created: ${hunterLead.id} — filters: ${JSON.stringify(body.filters)}`)

    return reply.status(201).send({ data: hunterLead })
  })

  // ─�� GET /leads — Listar HunterLeads ──────────────────────────────────���──────
  app.get('/leads', async (req, reply) => {
    const query = req.query as { status?: string; limit?: string; offset?: string }
    const limit = Math.min(parseInt(query.limit || '50'), 100)
    const offset = parseInt(query.offset || '0')

    const where: any = {}
    if (query.status && query.status !== 'all') {
      where.status = query.status
    }

    const [data, total] = await Promise.all([
      prisma.hunterLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.hunterLead.count({ where }),
    ])

    return reply.send({ data, meta: { total, limit, offset } })
  })

  // ── PUT /leads/:id — Atualizar status ───────────────────────────────────────
  app.put('/leads/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as { status?: string; notes?: string }

    const existing = await prisma.hunterLead.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ error: 'Hunter lead não encontrado' })

    const updateData: any = {}
    if (body.status) {
      updateData.status = body.status
      if (body.status === 'fulfilled') updateData.fulfilledAt = new Date()
      if (body.status === 'expired') updateData.expiredAt = new Date()
    }
    if (body.notes !== undefined) updateData.notes = body.notes

    const updated = await prisma.hunterLead.update({
      where: { id },
      data: updateData,
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        companyId: 'platform',
        action: 'hunter.lead.updated',
        resource: 'hunter_lead',
        resourceId: id,
        payload: { oldStatus: existing.status, newStatus: body.status },
      },
    }).catch(() => {})

    return reply.send({ data: updated })
  })

  // ��─ GET /stats — Estatísticas ───────────────────────────────────────────────
  app.get('/stats', async (_req, reply) => {
    const [total, active, fulfilled, expired, contacted] = await Promise.all([
      prisma.hunterLead.count(),
      prisma.hunterLead.count({ where: { status: 'active' } }),
      prisma.hunterLead.count({ where: { status: 'fulfilled' } }),
      prisma.hunterLead.count({ where: { status: 'expired' } }),
      prisma.hunterLead.count({ where: { status: 'contacted' } }),
    ])

    return reply.send({ total, active, fulfilled, expired, contacted })
  })
}
