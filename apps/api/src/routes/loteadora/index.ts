/**
 * Módulo Loteadora — loteamentos, lotes, mapa e reservas online.
 *
 * Dashboard (autenticado):
 *   GET    /loteamentos                  — lista com estatísticas
 *   POST   /loteamentos                  — cria loteamento
 *   GET    /loteamentos/:id              — detalhe + lotes
 *   PATCH  /loteamentos/:id              — atualiza loteamento
 *   POST   /loteamentos/:id/lotes        — cria lotes em lote (bulk)
 *   PATCH  /lotes/:id                    — atualiza um lote
 *   DELETE /lotes/:id                    — remove um lote
 *   GET    /reservas                     — reservas do loteamento
 *
 * Público:
 *   GET    /public/:slug                 — loteamento + lotes para o mapa
 *   POST   /public/lotes/:id/reservar    — reserva um lote (expira em 24h)
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { notify } from '../../services/notification.service.js'

const RESERVA_HORAS = 24

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const LOTE_STATUS = ['AVAILABLE', 'RESERVED', 'NEGOTIATING', 'SOLD', 'BLOCKED'] as const

const LoteamentoBody = z.object({
  name:           z.string().min(2).max(200),
  description:    z.string().max(4000).optional(),
  city:           z.string().max(120).optional(),
  state:          z.string().max(40).optional(),
  coverImage:     z.string().optional(),
  status:         z.enum(['planning', 'launching', 'selling', 'sold_out']).optional(),
  infrastructure: z.array(z.string()).optional(),
})

const LoteInput = z.object({
  quadra:      z.string().max(20).optional(),
  numero:      z.string().min(1).max(20),
  area:        z.number().positive().optional(),
  frente:      z.number().positive().optional(),
  fundo:       z.number().positive().optional(),
  price:       z.number().positive().optional(),
  status:      z.enum(LOTE_STATUS).optional(),
  mapColumn:   z.number().int().min(0).optional(),
  mapRow:      z.number().int().min(0).optional(),
  description: z.string().max(2000).optional(),
  sunPosition: z.string().max(60).optional(),
})

/** Expira reservas vencidas e libera os lotes correspondentes. */
async function expireStaleReservas(app: FastifyInstance, loteamentoId?: string) {
  const stale = await app.prisma.loteReserva.findMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() },
      ...(loteamentoId && { lote: { loteamentoId } }),
    },
    select: { id: true, loteId: true },
  }).catch(() => [])
  if (!stale.length) return
  await app.prisma.loteReserva.updateMany({
    where: { id: { in: stale.map(s => s.id) } },
    data: { status: 'expired' },
  }).catch(() => {})
  // Libera lotes que continuam RESERVED por causa de uma reserva vencida.
  await app.prisma.lote.updateMany({
    where: { id: { in: stale.map(s => s.loteId) }, status: 'RESERVED' },
    data: { status: 'AVAILABLE' },
  }).catch(() => {})
}

function loteamentoStats(lotes: { status: string; price: unknown }[]) {
  const count = { total: lotes.length, AVAILABLE: 0, RESERVED: 0, NEGOTIATING: 0, SOLD: 0, BLOCKED: 0 }
  let vgvTotal = 0, vgvSold = 0
  for (const l of lotes) {
    count[l.status as keyof typeof count] = (count[l.status as keyof typeof count] as number ?? 0) + 1
    const price = Number(l.price ?? 0)
    vgvTotal += price
    if (l.status === 'SOLD') vgvSold += price
  }
  return { count, vgvTotal, vgvSold }
}

export default async function loteadoraRoutes(app: FastifyInstance) {
  // ── GET /loteamentos — lista da empresa com estatísticas ───────────────
  app.get('/loteamentos', { preHandler: [app.authenticate] }, async (req, reply) => {
    const items = await app.prisma.loteamento.findMany({
      where: { companyId: req.user.cid },
      include: { lotes: { select: { status: true, price: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({
      data: items.map(l => {
        const { lotes, ...rest } = l
        return { ...rest, stats: loteamentoStats(lotes) }
      }),
    })
  })

  // ── POST /loteamentos — cria ───────────────────────────────────────────
  app.post('/loteamentos', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = LoteamentoBody.parse(req.body)
    const baseSlug = slugify(body.name) || 'loteamento'
    let slug = baseSlug
    for (let i = 2; await app.prisma.loteamento.findUnique({
      where: { companyId_slug: { companyId: req.user.cid, slug } },
    }).catch(() => null); i++) slug = `${baseSlug}-${i}`

    const created = await app.prisma.loteamento.create({
      data: {
        companyId: req.user.cid,
        name: body.name,
        slug,
        description: body.description ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        coverImage: body.coverImage ?? null,
        status: body.status ?? 'selling',
        infrastructure: body.infrastructure ?? [],
      },
    })
    return reply.status(201).send({ data: created })
  })

  // ── GET /loteamentos/:id — detalhe + lotes ─────────────────────────────
  app.get('/loteamentos/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await expireStaleReservas(app, id)
    const loteamento = await app.prisma.loteamento.findFirst({
      where: { id, companyId: req.user.cid },
      include: { lotes: { orderBy: [{ quadra: 'asc' }, { numero: 'asc' }] } },
    })
    if (!loteamento) return reply.status(404).send({ error: 'NOT_FOUND' })
    const { lotes, ...rest } = loteamento
    return reply.send({ data: { ...rest, lotes, stats: loteamentoStats(lotes) } })
  })

  // ── PATCH /loteamentos/:id ─────────────────────────────────────────────
  app.patch('/loteamentos/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = LoteamentoBody.partial().parse(req.body)
    const existing = await app.prisma.loteamento.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await app.prisma.loteamento.update({ where: { id }, data: body })
    return reply.send({ data: updated })
  })

  // ── POST /loteamentos/:id/lotes — cria lotes em lote ───────────────────
  app.post('/loteamentos/:id/lotes', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({ lotes: z.array(LoteInput).min(1).max(500) }).parse(req.body)
    const loteamento = await app.prisma.loteamento.findFirst({ where: { id, companyId: req.user.cid } })
    if (!loteamento) return reply.status(404).send({ error: 'NOT_FOUND' })

    const result = await app.prisma.lote.createMany({
      data: body.lotes.map(l => ({
        loteamentoId: id,
        quadra: l.quadra ?? null,
        numero: l.numero,
        area: l.area ?? null,
        frente: l.frente ?? null,
        fundo: l.fundo ?? null,
        price: l.price ?? null,
        status: l.status ?? 'AVAILABLE',
        mapColumn: l.mapColumn ?? null,
        mapRow: l.mapRow ?? null,
        description: l.description ?? null,
        sunPosition: l.sunPosition ?? null,
      })),
    })
    return reply.status(201).send({ success: true, created: result.count })
  })

  // ── PATCH /lotes/:id — atualiza um lote ────────────────────────────────
  app.patch('/lotes/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = LoteInput.partial().parse(req.body)
    const lote = await app.prisma.lote.findFirst({
      where: { id, loteamento: { companyId: req.user.cid } },
    })
    if (!lote) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await app.prisma.lote.update({ where: { id }, data: body })
    return reply.send({ data: updated })
  })

  // ── DELETE /lotes/:id ──────────────────────────────────────────────────
  app.delete('/lotes/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const lote = await app.prisma.lote.findFirst({
      where: { id, loteamento: { companyId: req.user.cid } },
    })
    if (!lote) return reply.status(404).send({ error: 'NOT_FOUND' })
    await app.prisma.lote.delete({ where: { id } })
    return reply.send({ success: true })
  })

  // ── GET /reservas — reservas dos loteamentos da empresa ────────────────
  app.get('/reservas', { preHandler: [app.authenticate] }, async (req, reply) => {
    await expireStaleReservas(app)
    const reservas = await app.prisma.loteReserva.findMany({
      where: { lote: { loteamento: { companyId: req.user.cid } } },
      include: { lote: { select: { numero: true, quadra: true, loteamentoId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return reply.send({ data: reservas })
  })

  // ── GET /public/:slug — loteamento + lotes para o mapa interativo ──────
  app.get('/public/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const loteamento = await app.prisma.loteamento.findFirst({ where: { slug } })
    if (!loteamento) return reply.status(404).send({ error: 'NOT_FOUND' })
    await expireStaleReservas(app, loteamento.id)

    const lotes = await app.prisma.lote.findMany({
      where: { loteamentoId: loteamento.id },
      select: {
        id: true, quadra: true, numero: true, area: true, frente: true, fundo: true,
        price: true, status: true, mapColumn: true, mapRow: true, description: true, sunPosition: true,
      },
      orderBy: [{ mapRow: 'asc' }, { mapColumn: 'asc' }],
    })
    return reply.send({ data: { ...loteamento, lotes, stats: loteamentoStats(lotes) } })
  })

  // ── POST /public/lotes/:id/reservar — reserva online ───────────────────
  app.post('/public/lotes/:id/reservar', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      name:  z.string().min(2).max(160),
      email: z.string().email(),
      phone: z.string().max(30).optional(),
    }).parse(req.body)

    await expireStaleReservas(app)
    const lote = await app.prisma.lote.findUnique({
      where: { id },
      include: { loteamento: { select: { companyId: true, name: true } } },
    })
    if (!lote) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (lote.status !== 'AVAILABLE') {
      return reply.status(409).send({ error: 'LOTE_UNAVAILABLE', message: 'Este lote não está disponível.' })
    }

    const expiresAt = new Date(Date.now() + RESERVA_HORAS * 60 * 60 * 1000)
    const reserva = await app.prisma.loteReserva.create({
      data: { loteId: id, name: body.name, email: body.email, phone: body.phone ?? null, expiresAt },
    })
    await app.prisma.lote.update({ where: { id }, data: { status: 'RESERVED' } })

    await notify({
      prisma: app.prisma,
      companyId: lote.loteamento.companyId,
      type: 'lead_captured',
      title: `Reserva de lote: ${lote.loteamento.name} — ${lote.quadra ? `Q${lote.quadra} ` : ''}Lote ${lote.numero}`,
      body: [
        `${body.name} reservou o lote.`,
        `Contato: ${body.email}${body.phone ? ` · ${body.phone}` : ''}`,
        `Reserva válida até ${expiresAt.toLocaleString('pt-BR')}.`,
      ].join('\n'),
      payload: { loteId: id, reservaId: reserva.id },
    }).catch(() => {})

    return reply.status(201).send({
      success: true,
      data: { reservaId: reserva.id, expiresAt },
      message: `Lote reservado! A reserva vale por ${RESERVA_HORAS}h. A equipe entrará em contato.`,
    })
  })
}
