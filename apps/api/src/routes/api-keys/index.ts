/**
 * API Keys — gestão das chaves da AgoraEncontrei Open API.
 *
 * GET    /api/v1/api-keys      — lista as chaves da empresa (sem o segredo)
 * POST   /api/v1/api-keys      — cria uma chave (retorna o segredo UMA vez)
 * DELETE /api/v1/api-keys/:id  — revoga uma chave
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'

/** Prefix used to narrow the key lookup before the (slow) argon2 verify. */
export function apiKeyPrefix(raw: string): string {
  return raw.slice(0, 16)
}

const VALID_SCOPES = ['properties:read', 'properties:write', 'leads:write'] as const

export default async function apiKeysRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET / — lista (apenas prefixo, nunca o segredo)
  app.get('/', { schema: { tags: ['api-keys'] } }, async (req, reply) => {
    const keys = await app.prisma.apiKey.findMany({
      where: { companyId: req.user.cid },
      select: {
        id: true, name: true, prefix: true, scopes: true,
        isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ data: keys })
  })

  // POST / — cria uma chave; o segredo só é exibido nesta resposta
  app.post('/', { schema: { tags: ['api-keys'] } }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const body = z.object({
      name:   z.string().min(2).max(120),
      scopes: z.array(z.enum(VALID_SCOPES)).min(1),
    }).parse(req.body)

    const raw = `ae_live_${randomBytes(24).toString('hex')}`
    const key = await app.prisma.apiKey.create({
      data: {
        companyId: req.user.cid,
        userId: req.user.sub,
        name: body.name,
        keyHash: await argon2.hash(raw, { type: argon2.argon2id }),
        prefix: apiKeyPrefix(raw),
        scopes: body.scopes,
      },
      select: { id: true, name: true, prefix: true, scopes: true, createdAt: true },
    })

    // `secret` aparece só aqui — não é recuperável depois.
    return reply.status(201).send({ data: { ...key, secret: raw } })
  })

  // DELETE /:id — revoga
  app.delete('/:id', { schema: { tags: ['api-keys'] } }, async (req, reply) => {
    const { id } = req.params as { id: string }
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const result = await app.prisma.apiKey.updateMany({
      where: { id, companyId: req.user.cid },
      data: { isActive: false },
    })
    if (result.count === 0) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({ success: true })
  })
}
