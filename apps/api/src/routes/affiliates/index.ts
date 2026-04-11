/**
 * Affiliate Engine Routes — Sistema de afiliados
 *
 * POST /api/v1/affiliates — Criar afiliado
 * GET  /api/v1/affiliates — Listar afiliados (admin)
 * GET  /api/v1/affiliates/by-code/:code — Buscar por código (público)
 * GET  /api/v1/affiliates/:id — Detalhe do afiliado
 * GET  /api/v1/affiliates/:id/earnings — Ganhos do afiliado
 * GET  /api/v1/affiliates/:id/stats — Estatísticas do afiliado
 * PUT  /api/v1/affiliates/:id — Atualizar afiliado
 */

import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'

// Gamification: comissão por nível
const LEVEL_RATES: Record<string, number> = {
  bronze: 0.20,
  prata: 0.25,
  ouro: 0.30,
}

function generateCode(name: string): string {
  const clean = name.replace(/\s+/g, '').toUpperCase().slice(0, 6)
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `${clean}${rand}`
}

export default async function affiliateRoutes(app: FastifyInstance) {
  const prisma = app.prisma as any

  // ── POST / — Criar afiliado ─────────────────────────────────────────────────
  app.post('/', async (req, reply) => {
    const body = req.body as { name: string; email: string; phone?: string }

    if (!body.name || !body.email) {
      return reply.status(400).send({ error: 'Nome e email obrigatórios' })
    }

    const existing = await prisma.affiliate.findUnique({ where: { email: body.email } }).catch(() => null)
    if (existing) {
      return reply.status(409).send({ error: 'Email já cadastrado como afiliado', data: { code: existing.code } })
    }

    let code = generateCode(body.name)
    // Ensure uniqueness
    while (await prisma.affiliate.findUnique({ where: { code } }).catch(() => null)) {
      code = generateCode(body.name)
    }

    const affiliate = await prisma.affiliate.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        code,
        commissionRate: LEVEL_RATES.bronze,
        level: 'bronze',
      },
    })

    await prisma.auditLog.create({
      data: {
        companyId: 'platform',
        action: 'affiliate.created',
        resource: 'affiliate',
        resourceId: affiliate.id,
        payload: { code, email: body.email },
      },
    }).catch(() => {})

    return reply.status(201).send({ data: affiliate })
  })

  // ── GET / — Listar afiliados (admin) ───────────────────────────────────────���
  app.get('/', async (req, reply) => {
    const query = req.query as { limit?: string; offset?: string; isActive?: string }
    const limit = Math.min(parseInt(query.limit || '50'), 100)
    const offset = parseInt(query.offset || '0')

    const where: any = {}
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true'

    const [data, total] = await Promise.all([
      prisma.affiliate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.affiliate.count({ where }),
    ])

    return reply.send({ data, meta: { total, limit, offset } })
  })

  // ── GET /by-code/:code — Buscar por código (público, checkout) ──────────────
  app.get('/by-code/:code', async (req, reply) => {
    const { code } = req.params as { code: string }
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true, name: true, code: true, isActive: true },
    }).catch(() => null)

    if (!affiliate || !affiliate.isActive) {
      return reply.status(404).send({ error: 'Afiliado não encontrado' })
    }

    return reply.send({ data: affiliate })
  })

  // ── GET /:id — Detalhe do afiliado ──────────────────────────────────────────
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const affiliate = await prisma.affiliate.findUnique({ where: { id } })
    if (!affiliate) return reply.status(404).send({ error: 'Afiliado não encontrado' })
    return reply.send({ data: affiliate })
  })

  // ── GET /:id/earnings — Ganhos do afiliado ──────────────────────────────────
  app.get('/:id/earnings', async (req, reply) => {
    const { id } = req.params as { id: string }
    const query = req.query as { limit?: string; status?: string }
    const limit = Math.min(parseInt(query.limit || '50'), 100)

    const where: any = { affiliateId: id }
    if (query.status) where.status = query.status

    const earnings = await prisma.affiliateEarning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return reply.send({ data: earnings })
  })

  // ── GET /:id/stats — Estatísticas do afiliado ──────────────────────────────
  app.get('/:id/stats', async (req, reply) => {
    const { id } = req.params as { id: string }

    const affiliate = await prisma.affiliate.findUnique({ where: { id } })
    if (!affiliate) return reply.status(404).send({ error: 'Afiliado não encontrado' })

    const [totalEarnings, pendingEarnings, paidEarnings, totalClients] = await Promise.all([
      prisma.affiliateEarning.aggregate({
        where: { affiliateId: id },
        _sum: { amount: true },
      }),
      prisma.affiliateEarning.aggregate({
        where: { affiliateId: id, status: 'pending' },
        _sum: { amount: true },
      }),
      prisma.affiliateEarning.aggregate({
        where: { affiliateId: id, status: 'paid' },
        _sum: { amount: true },
      }),
      prisma.affiliateEarning.count({
        where: { affiliateId: id },
      }),
    ])

    return reply.send({
      totalEarnings: Number(totalEarnings._sum.amount || 0),
      pendingEarnings: Number(pendingEarnings._sum.amount || 0),
      paidEarnings: Number(paidEarnings._sum.amount || 0),
      totalClients,
      level: affiliate.level,
      commissionRate: Number(affiliate.commissionRate),
      code: affiliate.code,
    })
  })

  // ── PUT /:id — Atualizar afiliado ──────────────────────────────────────────
  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as { name?: string; phone?: string; level?: string; isActive?: boolean }

    const updateData: any = {}
    if (body.name) updateData.name = body.name
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.level && LEVEL_RATES[body.level]) {
      updateData.level = body.level
      updateData.commissionRate = LEVEL_RATES[body.level]
    }

    const updated = await prisma.affiliate.update({
      where: { id },
      data: updateData,
    })

    return reply.send({ data: updated })
  })
}
