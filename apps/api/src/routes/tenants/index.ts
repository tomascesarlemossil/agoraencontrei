/**
 * Tenant Management Routes — Gestão de Clones SaaS
 *
 * POST /api/v1/tenants                    — Cria novo tenant (clone)
 * GET  /api/v1/tenants                    — Lista tenants (master only)
 * GET  /api/v1/tenants/:id                — Detalhes do tenant
 * PATCH /api/v1/tenants/:id               — Atualiza tenant
 * POST /api/v1/tenants/:id/activate       — Ativa tenant
 * POST /api/v1/tenants/:id/suspend        — Suspende tenant
 * GET  /api/v1/tenants/check-subdomain    — Verifica disponibilidade
 * GET  /api/v1/tenants/mrr                — Métricas MRR (master)
 * POST /api/v1/tenants/:id/domain         — Registra domínio customizado
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createTenant,
  activateTenant,
  suspendTenant,
  listTenants,
  isSubdomainAvailable,
  calculateMRR,
  addDomainToVercel,
} from '../../services/tenant.service.js'
import { createAuditLog } from '../../services/audit.service.js'

export default async function tenantRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST / — Cria novo tenant (clone)
  app.post('/', {
    schema: { tags: ['tenants'], summary: 'Create a new tenant (clone site)' },
  }, async (req, reply) => {
    const body = z.object({
      name: z.string().min(2),
      subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
      customDomain: z.string().optional(),
      domainType: z.enum(['subdomain', 'new', 'own']).default('subdomain'),
      layoutType: z.enum(['luxury', 'clean', 'social', 'marketplace']).default('clean'),
      plan: z.enum(['LITE', 'PRO', 'ENTERPRISE']).default('LITE'),
      primaryColor: z.string().optional(),
      logoUrl: z.string().optional(),
      asaasApiKey: z.string().optional(),
    }).parse(req.body)

    // Verificar disponibilidade
    const available = await isSubdomainAvailable(app.prisma, body.subdomain)
    if (!available.available) {
      return reply.status(409).send({ error: 'SUBDOMAIN_TAKEN', message: available.reason })
    }

    const result = await createTenant(app.prisma, {
      ...body,
      ownerId: req.user.sub,
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'automation.run' as any,
      resource: 'tenant',
      resourceId: result.tenant.id,
      meta: { type: 'tenant.created', subdomain: body.subdomain, plan: body.plan },
    })

    return reply.status(201).send({
      success: true,
      data: {
        tenant: result.tenant,
        company: result.company,
        siteUrl: `${body.subdomain}.agoraencontrei.com.br`,
      },
    })
  })

  // GET / — Lista tenants (apenas SUPER_ADMIN)
  app.get('/', {
    schema: { tags: ['tenants'], summary: 'List all tenants (master only)' },
  }, async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const q = req.query as any
    const tenants = await listTenants(app.prisma, {
      planStatus: q.planStatus,
      isActive: q.isActive === 'true' ? true : q.isActive === 'false' ? false : undefined,
    })

    return reply.send({ success: true, data: tenants })
  })

  // GET /check-subdomain — Verifica disponibilidade
  app.get('/check-subdomain', {
    schema: { tags: ['tenants'], summary: 'Check subdomain availability' },
  }, async (req, reply) => {
    const q = req.query as any
    const subdomain = q.subdomain as string

    if (!subdomain) {
      return reply.status(400).send({ error: 'MISSING_SUBDOMAIN' })
    }

    const result = await isSubdomainAvailable(app.prisma, subdomain)
    return reply.send({ success: true, data: result })
  })

  // GET /mrr — Métricas MRR (apenas SUPER_ADMIN)
  app.get('/mrr', {
    schema: { tags: ['tenants'], summary: 'SaaS MRR metrics (master only)' },
  }, async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const mrr = await calculateMRR(app.prisma)
    return reply.send({ success: true, data: mrr })
  })

  // GET /:id — Detalhes do tenant
  app.get('/:id', {
    schema: { tags: ['tenants'], summary: 'Get tenant details' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const tenant = await (app.prisma as any).tenant.findUnique({
      where: { id },
    })

    if (!tenant) {
      return reply.status(404).send({ error: 'TENANT_NOT_FOUND' })
    }

    // Allow access for tenant owner or SUPER_ADMIN
    if (tenant.ownerId !== req.user.sub && req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    return reply.send({ success: true, data: tenant })
  })

  // PATCH /:id — Atualiza tenant
  app.patch('/:id', {
    schema: { tags: ['tenants'], summary: 'Update tenant configuration' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      name: z.string().optional(),
      layoutType: z.enum(['luxury', 'clean', 'social', 'marketplace']).optional(),
      primaryColor: z.string().optional(),
      logoUrl: z.string().optional(),
      splitPercent: z.number().min(0).max(50).optional(),
      repasseDelayDays: z.number().min(1).max(30).optional(),
      repasseFixedDay: z.number().min(1).max(31).optional(),
      settings: z.record(z.any()).optional(),
    }).parse(req.body)

    const tenant = await (app.prisma as any).tenant.findUnique({ where: { id } })
    if (!tenant) return reply.status(404).send({ error: 'TENANT_NOT_FOUND' })

    if (tenant.ownerId !== req.user.sub && req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const updated = await (app.prisma as any).tenant.update({
      where: { id },
      data: {
        ...body,
        ...(body.settings && { settings: { ...(tenant.settings || {}), ...body.settings } }),
      },
    })

    return reply.send({ success: true, data: updated })
  })

  // POST /:id/activate — Ativa tenant
  app.post('/:id/activate', {
    schema: { tags: ['tenants'], summary: 'Activate tenant after payment' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      asaasSubscriptionId: z.string().optional(),
    }).parse(req.body || {})

    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const tenant = await activateTenant(app.prisma, id, body.asaasSubscriptionId)
    return reply.send({ success: true, data: tenant })
  })

  // POST /:id/suspend — Suspende tenant
  app.post('/:id/suspend', {
    schema: { tags: ['tenants'], summary: 'Suspend tenant for non-payment' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const tenant = await suspendTenant(app.prisma, id)
    return reply.send({ success: true, data: tenant })
  })

  // POST /:id/domain — Registra domínio customizado na Vercel
  app.post('/:id/domain', {
    schema: { tags: ['tenants'], summary: 'Register custom domain via Vercel' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      domain: z.string().min(4),
    }).parse(req.body)

    const tenant = await (app.prisma as any).tenant.findUnique({ where: { id } })
    if (!tenant) return reply.status(404).send({ error: 'TENANT_NOT_FOUND' })

    // Register in Vercel
    const result = await addDomainToVercel(body.domain)

    if (result.success) {
      await (app.prisma as any).tenant.update({
        where: { id },
        data: {
          customDomain: body.domain,
          domainType: 'own',
          vercelDomainId: result.data?.name || body.domain,
        },
      })
    }

    return reply.send({
      success: result.success,
      data: {
        domain: body.domain,
        vercelResult: result.data,
        dnsInstructions: {
          aRecord: { type: 'A', name: '@', value: '76.76.21.21' },
          cnameRecord: { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
        },
      },
      ...(result.error && { error: result.error }),
    })
  })
}
