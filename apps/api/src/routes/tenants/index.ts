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

// Aceita tanto os 4 valores legados quanto as 9 chaves do catálogo de temas
// ricos (apps/web/src/lib/site-factory/theme-registry.ts, ThemeKey) — o
// front não pode importar esse arquivo (pacote/build diferente), então a
// lista é replicada aqui. `resolveTheme()` no site do tenant já suporta
// ambos os formatos via LAYOUT_TO_THEME.
const TENANT_LAYOUT_TYPES = z.enum([
  'luxury', 'clean', 'social', 'marketplace',
  'luxury_gold', 'urban_tech', 'landscape_living', 'classic_trust',
  'fast_sales_pro', 'signature_estate', 'minimal_studio', 'bold_agency',
  'editorial_journal',
])

type ReadinessItem = { id: string; label: string; complete: boolean }

async function getTenantReadiness(prisma: any, tenant: any) {
  const settings = (tenant.settings ?? {}) as Record<string, unknown>
  const company = tenant.companyId
    ? await prisma.company.findUnique({ where: { id: tenant.companyId } })
    : null
  const [propertyCount, teamCount] = tenant.companyId
    ? await Promise.all([
        prisma.property.count({ where: { companyId: tenant.companyId, status: 'ACTIVE', authorizedPublish: true } }),
        prisma.user.count({ where: { companyId: tenant.companyId, status: 'ACTIVE' } }),
      ])
    : [0, 0]

  const present = (...values: unknown[]) => values.some(value => typeof value === 'string' && value.trim().length > 0)
  const items: ReadinessItem[] = [
    { id: 'identity', label: 'Nome e identidade visual', complete: present(tenant.name) && present(tenant.logoUrl, company?.logoUrl) && present(tenant.primaryColor) },
    { id: 'contact', label: 'Telefone e e-mail', complete: present(settings.phone, company?.phone) && present(settings.email, company?.email) },
    { id: 'creci', label: 'CRECI da imobiliária', complete: present(settings.creci, company?.creci) },
    { id: 'address', label: 'Endereço e cidade', complete: present(settings.address, company?.address) && present(settings.city, company?.city) },
    { id: 'social', label: 'Ao menos uma rede social', complete: present(settings.instagramUrl, settings.facebookUrl, settings.youtubeUrl) },
    { id: 'content', label: 'Título, apresentação e sobre', complete: present(settings.heroTitle) && present(settings.heroSubtitle) && present(settings.aboutText) },
    { id: 'domain', label: 'Domínio ou subdomínio', complete: present(tenant.customDomain, tenant.subdomain) },
    { id: 'properties', label: 'Ao menos um imóvel publicado', complete: propertyCount > 0 },
    { id: 'team', label: 'Ao menos um usuário ativo na equipe', complete: teamCount > 0 },
  ]
  const completed = items.filter(item => item.complete).length
  return { complete: completed === items.length, completed, total: items.length, items, propertyCount, teamCount }
}

export default async function tenantRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST / — Cria novo tenant (clone)
  app.post('/', {
    schema: { tags: ['tenants'], summary: 'Create a new tenant (clone site)' },
  }, async (req, reply) => {
    // Criação direta de tenant é ação de PLATAFORMA (SUPER_ADMIN). Parceiros que
    // contratam um site passam pelo checkout (/api/v1/billing/saas/checkout),
    // que aplica plano/pagamento. Sem este guard, qualquer usuário autenticado
    // poderia auto-provisionar um tenant sem regra de plano/permissão.
    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'SUPER_ADMIN access required' })
    }
    const body = z.object({
      name: z.string().min(2),
      subdomain: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
      customDomain: z.string().optional(),
      domainType: z.enum(['subdomain', 'new', 'own']).default('subdomain'),
      layoutType: TENANT_LAYOUT_TYPES.default('clean'),
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

  // GET /mine — Retorna o tenant do usuário logado (self-service "Meu Site").
  // Não existia forma do dono descobrir o id do próprio tenant no client —
  // o JWT não carrega tenantId, então essa rota resolve por ownerId.
  app.get('/mine', {
    schema: { tags: ['tenants'], summary: 'Get the tenant owned by the logged-in user' },
  }, async (req, reply) => {
    // O objeto tenant carrega settings/dados financeiros/assinatura/repasses —
    // portanto NÃO é para corretor. Só quem GERE o site pode recebê-lo:
    // owner, ADMIN/MANAGER da mesma empresa, ou SUPER_ADMIN.
    const isManagerRole = ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(req.user.role)
    // Owner pode ser resolvido por ownerId; gestores da empresa, por companyId.
    const or: any[] = [{ ownerId: req.user.sub }]
    if (isManagerRole) or.push({ companyId: req.user.cid })
    const tenant = await (app.prisma as any).tenant.findFirst({
      where: { OR: or },
      orderBy: { createdAt: 'desc' },
    })
    if (!tenant) return reply.status(404).send({ error: 'NO_TENANT_FOR_USER' })
    // Defesa extra: se casou por empresa, exige papel de gestão (nunca BROKER).
    const canManage = tenant.ownerId === req.user.sub
      || (tenant.companyId === req.user.cid && isManagerRole)
    if (!canManage) return reply.status(403).send({ error: 'FORBIDDEN' })
    const readiness = await getTenantReadiness(app.prisma as any, tenant)
    return reply.send({ success: true, data: { ...tenant, readiness } })
  })

  // POST /mine/publication — publication gate backed by server-side data.
  app.post('/mine/publication', {
    schema: { tags: ['tenants'], summary: 'Publish or unpublish the current tenant site' },
  }, async (req, reply) => {
    const body = z.object({ published: z.boolean() }).parse(req.body)
    const isManagerRole = ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(req.user.role)
    const tenant = await (app.prisma as any).tenant.findFirst({
      where: { OR: [{ ownerId: req.user.sub }, ...(isManagerRole ? [{ companyId: req.user.cid }] : [])] },
      orderBy: { createdAt: 'desc' },
    })
    if (!tenant) return reply.status(404).send({ error: 'NO_TENANT_FOR_USER' })

    const readiness = await getTenantReadiness(app.prisma as any, tenant)
    if (body.published && !readiness.complete) {
      return reply.status(409).send({ error: 'ONBOARDING_INCOMPLETE', message: 'Conclua todos os itens obrigatórios antes de publicar.', data: readiness })
    }

    const settings = { ...(tenant.settings ?? {}), sitePublished: body.published, publicationUpdatedAt: new Date().toISOString() }
    const updated = await (app.prisma as any).tenant.update({ where: { id: tenant.id }, data: { settings } })
    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'automation.run' as any,
      resource: 'tenant', resourceId: tenant.id,
      meta: { type: body.published ? 'tenant.site_published' : 'tenant.site_unpublished' },
    })
    return reply.send({ success: true, data: { ...updated, readiness } })
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

    // Owner, ADMIN/MANAGER da mesma empresa, ou SUPER_ADMIN.
    const canManage = tenant.ownerId === req.user.sub
      || (tenant.companyId === req.user.cid && ['ADMIN', 'MANAGER'].includes(req.user.role))
      || req.user.role === 'SUPER_ADMIN'
    if (!canManage) {
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
      layoutType: TENANT_LAYOUT_TYPES.optional(),
      primaryColor: z.string().optional(),
      logoUrl: z.string().optional(),
      splitPercent: z.number().min(0).max(50).optional(),
      repasseDelayDays: z.number().min(1).max(30).optional(),
      repasseFixedDay: z.number().min(1).max(31).optional(),
      // Marca do cabeçalho do site do parceiro — mesmo padrão de
      // configurabilidade do site principal (ícone/texto/ocultar/posição).
      // Guardados dentro de `settings` (JSON) para não exigir migração —
      // idêntico ao mixin com `body.settings` logo abaixo.
      logoWordmarkUrl: z.string().optional(),
      logoVisible: z.boolean().optional(),
      logoShowText: z.boolean().optional(),
      logoPosition: z.enum(['left', 'center']).optional(),
      settings: z.record(z.any()).optional(),
    }).parse(req.body)

    const tenant = await (app.prisma as any).tenant.findUnique({ where: { id } })
    if (!tenant) return reply.status(404).send({ error: 'TENANT_NOT_FOUND' })

    // Owner, ADMIN/MANAGER da mesma empresa, ou SUPER_ADMIN podem editar o site.
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN'
    const canManage = tenant.ownerId === req.user.sub
      || (tenant.companyId === req.user.cid && ['ADMIN', 'MANAGER'].includes(req.user.role))
      || isSuperAdmin
    if (!canManage) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { logoWordmarkUrl, logoVisible, logoShowText, logoPosition, settings, ...columns } = body
    // Campos financeiros/comerciais (split e regras de repasse) só o SUPER_ADMIN
    // altera — um parceiro NÃO pode reduzir o próprio split da plataforma.
    if (!isSuperAdmin) {
      delete (columns as any).splitPercent
      delete (columns as any).repasseDelayDays
      delete (columns as any).repasseFixedDay
    }
    const brandingSettings: Record<string, any> = {}
    if (logoWordmarkUrl !== undefined) brandingSettings.logoWordmarkUrl = logoWordmarkUrl
    if (logoVisible !== undefined) brandingSettings.logoVisible = logoVisible
    if (logoShowText !== undefined) brandingSettings.logoShowText = logoShowText
    if (logoPosition !== undefined) brandingSettings.logoPosition = logoPosition

    const updated = await (app.prisma as any).tenant.update({
      where: { id },
      data: {
        ...columns,
        ...((settings || Object.keys(brandingSettings).length > 0) && {
          settings: { ...(tenant.settings || {}), ...settings, ...brandingSettings },
        }),
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

    // Authorization: só o dono do tenant ou um SUPER_ADMIN pode vincular um
    // domínio (mesmo padrão de GET/PATCH /:id). Sem isso, qualquer usuário
    // autenticado poderia apontar um domínio para o tenant de outra pessoa.
    if (tenant.ownerId !== req.user.sub && req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

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

  // DELETE /:id — Cancela o tenant (soft: preserva dados, desativa o site)
  app.delete('/:id', {
    schema: { tags: ['tenants'], summary: 'Cancel (soft-delete) a tenant' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    if (req.user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const tenant = await (app.prisma as any).tenant.findUnique({ where: { id } })
    if (!tenant) return reply.status(404).send({ error: 'TENANT_NOT_FOUND' })

    const updated = await (app.prisma as any).tenant.update({
      where: { id },
      data: { planStatus: 'CANCELLED', isActive: false, suspendedAt: new Date() },
    })

    return reply.send({ success: true, data: updated })
  })
}
