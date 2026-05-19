/**
 * AgoraEncontrei Open API — API pública para parceiros.
 *
 * Autenticada por API key (header `x-api-key`). Endpoints versionados:
 *   GET  /public-api/v1/properties        — lista imóveis da empresa
 *   GET  /public-api/v1/properties/:id    — detalhe de um imóvel
 *   POST /public-api/v1/leads             — cria um lead
 *
 * Cada chave tem escopos (properties:read, properties:write, leads:write).
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import argon2 from 'argon2'
import { apiKeyPrefix } from '../api-keys/index.js'
import { notify } from '../../services/notification.service.js'

interface ApiKeyContext { companyId: string; scopes: string[] }

// Explicit per-route rate limit for the public partner API.
const PUBLIC_API_RATE_LIMIT = { rateLimit: { max: 120, timeWindow: '1 minute' } }

const PROPERTY_SELECT = {
  id: true, reference: true, title: true, slug: true, type: true, purpose: true,
  status: true, price: true, priceRent: true, city: true, neighborhood: true,
  bedrooms: true, bathrooms: true, parkingSpaces: true, totalArea: true,
  builtArea: true, coverImage: true, images: true, createdAt: true,
} satisfies Prisma.PropertySelect

export default async function publicApiRoutes(app: FastifyInstance) {
  // ── Autenticação por API key ───────────────────────────────────────────
  app.addHook('preHandler', async (req, reply) => {
    const raw = (req.headers['x-api-key'] as string | undefined)?.trim()
    if (!raw) {
      return reply.status(401).send({ error: 'MISSING_API_KEY', message: 'Informe o header x-api-key.' })
    }
    // Narrow by prefix, then verify the full token against the argon2 hash.
    const candidates = await app.prisma.apiKey
      .findMany({ where: { prefix: apiKeyPrefix(raw), isActive: true } })
      .catch(() => [])
    let key: (typeof candidates)[number] | null = null
    for (const c of candidates) {
      if (c.expiresAt && c.expiresAt < new Date()) continue
      if (await argon2.verify(c.keyHash, raw).catch(() => false)) { key = c; break }
    }
    if (!key) {
      return reply.status(401).send({ error: 'INVALID_API_KEY' })
    }
    ;(req as unknown as { apiKey: ApiKeyContext }).apiKey = {
      companyId: key.companyId, scopes: key.scopes,
    }
    app.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
  })

  const ctx = (req: FastifyRequest): ApiKeyContext =>
    (req as unknown as { apiKey: ApiKeyContext }).apiKey

  function requireScope(req: FastifyRequest, reply: FastifyReply, scope: string): boolean {
    if (!ctx(req).scopes.includes(scope)) {
      reply.status(403).send({ error: 'INSUFFICIENT_SCOPE', message: `Escopo necessário: ${scope}` })
      return false
    }
    return true
  }

  // ── GET /v1/properties ─────────────────────────────────────────────────
  app.get('/v1/properties', { config: PUBLIC_API_RATE_LIMIT }, async (req, reply) => {
    if (!requireScope(req, reply, 'properties:read')) return
    const q = req.query as { page?: string; limit?: string; status?: string }
    const limit = Math.min(Number(q.limit) || 20, 100)
    const page = Math.max(Number(q.page) || 1, 1)
    const where: Prisma.PropertyWhereInput = {
      companyId: ctx(req).companyId,
      ...(q.status && { status: q.status.toUpperCase() as Prisma.PropertyWhereInput['status'] }),
    }
    const [total, items] = await Promise.all([
      app.prisma.property.count({ where }),
      app.prisma.property.findMany({
        where, select: PROPERTY_SELECT,
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
    ])
    return reply.send({ data: items, meta: { total, page, limit } })
  })

  // ── GET /v1/properties/:id ─────────────────────────────────────────────
  app.get('/v1/properties/:id', { config: PUBLIC_API_RATE_LIMIT }, async (req, reply) => {
    if (!requireScope(req, reply, 'properties:read')) return
    const { id } = req.params as { id: string }
    const property = await app.prisma.property.findFirst({
      where: { id, companyId: ctx(req).companyId },
      select: PROPERTY_SELECT,
    })
    if (!property) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ data: property })
  })

  // ── POST /v1/leads ─────────────────────────────────────────────────────
  app.post('/v1/leads', { config: PUBLIC_API_RATE_LIMIT }, async (req, reply) => {
    if (!requireScope(req, reply, 'leads:write')) return
    const body = z.object({
      name:     z.string().min(2).max(160),
      email:    z.string().email().optional(),
      phone:    z.string().max(30).optional(),
      interest: z.string().max(40).optional(),
      message:  z.string().max(2000).optional(),
    }).parse(req.body)

    const companyId = ctx(req).companyId
    const lead = await app.prisma.lead.create({
      data: {
        companyId,
        name: body.name,
        email: body.email ?? undefined,
        phone: body.phone ?? undefined,
        interest: body.interest ?? undefined,
        notes: body.message ?? undefined,
        source: 'open_api',
        status: 'NEW',
      },
    })

    await notify({
      prisma: app.prisma,
      companyId,
      type: 'lead_captured',
      title: `Novo lead via API: ${body.name}`,
      body: [body.phone && `Telefone: ${body.phone}`, body.email && `E-mail: ${body.email}`,
        body.interest && `Interesse: ${body.interest}`].filter(Boolean).join('\n') || 'Lead recebido via Open API.',
      payload: { leadId: lead.id, source: 'open_api' },
      email: false,
    }).catch(() => {})

    return reply.status(201).send({ data: { id: lead.id } })
  })
}
