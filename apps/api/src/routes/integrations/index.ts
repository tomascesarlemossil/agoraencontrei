/**
 * Integrations Hub — per-tenant integration credentials.
 *
 * GET    /api/v1/integrations          — catalogue + this company's status
 * PUT    /api/v1/integrations/:provider — save this company's credentials
 * DELETE /api/v1/integrations/:provider — remove (revert to platform default)
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  INTEGRATION_CATALOG,
  getIntegrationConfig,
} from '../../services/integration-config.service.js'

export default async function integrationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  function ensureAdmin(req: any, reply: any): boolean {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      reply.status(403).send({ error: 'FORBIDDEN', message: 'Apenas administradores podem gerenciar integrações.' })
      return false
    }
    return true
  }

  // GET / — catalogue + status for the authenticated company
  app.get('/', {
    schema: { tags: ['integrations'], summary: 'List integrations and their status' },
  }, async (req, reply) => {
    const companyId = req.user.cid

    const rows = await app.prisma.integrationCredential
      .findMany({ where: { companyId } })
      .catch(() => [])
    const byProvider = new Map(rows.map(r => [r.provider, r]))

    const items = await Promise.all(INTEGRATION_CATALOG.map(async (desc) => {
      const own = byProvider.get(desc.provider)
      const ownCreds = (own?.credentials as Record<string, string> | undefined) ?? {}
      const resolved = await getIntegrationConfig(app.prisma, companyId, desc.provider)

      // Source: own config if the tenant saved any field, else env, else none.
      const hasOwn = Object.values(ownCreds).some(Boolean) && (own?.isActive ?? false)
      const source = hasOwn ? 'tenant' : (Object.keys(resolved).length ? 'platform' : 'none')

      return {
        provider: desc.provider,
        label: desc.label,
        description: desc.description,
        fields: desc.fields,
        connected: Object.keys(resolved).length > 0,
        source,
        isActive: own?.isActive ?? true,
        testStatus: own?.testStatus ?? 'untested',
        lastTestedAt: own?.lastTestedAt ?? null,
        // Saved values — secret fields are masked, never returned in clear.
        values: Object.fromEntries(desc.fields.map(f => [
          f.key,
          f.secret ? (ownCreds[f.key] ? '••••••••' : '') : (ownCreds[f.key] ?? ''),
        ])),
      }
    }))

    return reply.send({ data: items })
  })

  // PUT /:provider — upsert the company's credentials
  app.put('/:provider', {
    schema: { tags: ['integrations'], summary: 'Save integration credentials' },
  }, async (req, reply) => {
    if (!ensureAdmin(req, reply)) return

    const { provider } = req.params as { provider: string }
    const desc = INTEGRATION_CATALOG.find(d => d.provider === provider)
    if (!desc) return reply.status(404).send({ error: 'UNKNOWN_PROVIDER' })

    const body = z.object({
      credentials: z.record(z.string()),
      isActive: z.boolean().optional(),
    }).parse(req.body)

    const companyId = req.user.cid
    const existing = await app.prisma.integrationCredential
      .findUnique({ where: { companyId_provider: { companyId, provider } } })
      .catch(() => null)
    const prevCreds = (existing?.credentials as Record<string, string> | undefined) ?? {}

    // Masked secret fields ('••••••••') keep the previously stored value.
    const merged: Record<string, string> = { ...prevCreds }
    for (const field of desc.fields) {
      const incoming = body.credentials[field.key]
      if (incoming === undefined) continue
      if (field.secret && incoming === '••••••••') continue
      merged[field.key] = incoming
    }

    const saved = await app.prisma.integrationCredential.upsert({
      where: { companyId_provider: { companyId, provider } },
      create: { companyId, provider, credentials: merged, isActive: body.isActive ?? true },
      update: { credentials: merged, isActive: body.isActive ?? existing?.isActive ?? true, testStatus: 'untested' },
    })

    return reply.send({ success: true, data: { provider: saved.provider, isActive: saved.isActive } })
  })

  // DELETE /:provider — remove the company's own credentials
  app.delete('/:provider', {
    schema: { tags: ['integrations'], summary: 'Remove integration credentials' },
  }, async (req, reply) => {
    if (!ensureAdmin(req, reply)) return

    const { provider } = req.params as { provider: string }
    const companyId = req.user.cid

    await app.prisma.integrationCredential
      .deleteMany({ where: { companyId, provider } })
      .catch(() => {})

    return reply.send({ success: true })
  })
}
