/**
 * Admin Dynamic Config Routes — "The Master Toggle"
 *
 * SUPER_ADMIN only routes for managing dynamic platform configuration.
 * All prices, plans, niches, modules, and settings editable without deploys.
 *
 * PLANS:
 *   GET    /plans           — List all plan definitions
 *   POST   /plans           — Create plan
 *   PUT    /plans/:id       — Update plan
 *   DELETE /plans/:id       — Soft-delete (deactivate) plan
 *
 * NICHES:
 *   GET    /niches          — List all niche templates
 *   POST   /niches          — Create niche
 *   PUT    /niches/:id      — Update niche
 *   DELETE /niches/:id      — Soft-delete niche
 *
 * MODULES:
 *   GET    /modules         — List all module definitions
 *   POST   /modules         — Create module
 *   PUT    /modules/:id     — Update module
 *   DELETE /modules/:id     — Soft-delete module
 *
 * SERVICES:
 *   GET    /services        — List all service definitions
 *   POST   /services        — Create service
 *   PUT    /services/:id    — Update service
 *   DELETE /services/:id    — Soft-delete service
 *
 * SETTINGS:
 *   GET    /settings        — Get global system settings
 *   PUT    /settings        — Update global system settings
 *
 * PUBLIC (no auth):
 *   GET    /public/catalog  — Public catalog (plans, modules, services) for landing page
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

// ─── Validators ──────────────────────────────────────────────────────────────

const planSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  longDescription: z.string().max(5000).optional().nullable(),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0).optional().nullable(),
  maxProperties: z.number().int().min(-1).default(-1),
  maxLeadViews: z.number().int().min(-1).default(-1),
  maxUsers: z.number().int().min(-1).default(1),
  maxAIRequests: z.number().int().min(-1).default(0),
  themes: z.array(z.string()).default([]),
  modules: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  nicheFilter: z.array(z.string()).default([]),
  billingType: z.enum(['recurring', 'one_time']).default('recurring'),
  highlighted: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const nicheSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(100),
  icon: z.string().max(50).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  tomasPersona: z.string().min(10).max(5000),
  tomasGreeting: z.string().max(1000).optional().nullable(),
  tomasTone: z.enum(['formal', 'agil', 'acolhedor', 'consultivo', 'direto']).default('consultivo'),
  itemLabel: z.string().max(50).default('Imóvel'),
  itemLabelPlural: z.string().max(50).default('Imóveis'),
  searchFields: z.any().default([]),
  categoryFields: z.any().default([]),
  seoKeywords: z.array(z.string()).default([]),
  seoTitleTemplate: z.string().max(200).optional().nullable(),
  defaultTheme: z.string().max(50).default('urban_tech'),
  availableThemes: z.array(z.string()).default([]),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const moduleSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  priceMonthly: z.number().min(0).optional().nullable(),
  priceOneTime: z.number().min(0).optional().nullable(),
  billingType: z.enum(['recurring', 'one_time', 'included']).default('recurring'),
  category: z.enum(['feature', 'integration', 'ai', 'design']).default('feature'),
  requiredPlan: z.string().max(50).optional().nullable(),
  nicheFilter: z.array(z.string()).default([]),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const serviceSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional().nullable(),
  longDescription: z.string().max(5000).optional().nullable(),
  price: z.number().min(0),
  billingType: z.enum(['one_time', 'recurring']).default('one_time'),
  category: z.enum(['service', 'consulting', 'premium']).default('service'),
  nicheFilter: z.array(z.string()).default([]),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

const settingsSchema = z.object({
  seoDefaults: z.any().optional(),
  landingContent: z.any().optional(),
  billingConfig: z.any().optional(),
  featureFlags: z.any().optional(),
  brandConfig: z.any().optional(),
  metadata: z.any().optional(),
})

// ─── Routes ──────────────────────────────────────────────────────────────────

export default async function adminConfigRoutes(app: FastifyInstance) {
  const prisma = app.prisma as any

  // ═══════════════════════════════════════════════════════════════════════════
  // PLANS
  // ═══════════════════════════════════════════════════════════════════════════

  app.get('/plans', async (_req, reply) => {
    const plans = await prisma.planDefinition.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return reply.send({ success: true, data: plans })
  })

  app.post('/plans', async (req, reply) => {
    const data = planSchema.parse(req.body)
    const plan = await prisma.planDefinition.create({ data })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.plan.create' as any,
        resource: 'plan_definition', resourceId: plan.id,
        userId: req.user.sub, payload: data as any,
      },
    }).catch(() => {})

    return reply.status(201).send({ success: true, data: plan })
  })

  app.put('/plans/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = planSchema.partial().parse(req.body)
    const plan = await prisma.planDefinition.update({ where: { id }, data })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.plan.update' as any,
        resource: 'plan_definition', resourceId: id,
        userId: req.user.sub, payload: data as any,
      },
    }).catch(() => {})

    return reply.send({ success: true, data: plan })
  })

  app.delete('/plans/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const plan = await prisma.planDefinition.update({
      where: { id },
      data: { isActive: false },
    })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.plan.deactivate' as any,
        resource: 'plan_definition', resourceId: id,
        userId: req.user.sub,
      },
    }).catch(() => {})

    return reply.send({ success: true, data: plan })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NICHES
  // ═══════════════════════════════════════════════════════════════════════════

  app.get('/niches', async (_req, reply) => {
    const niches = await prisma.nicheTemplate.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return reply.send({ success: true, data: niches })
  })

  app.post('/niches', async (req, reply) => {
    const data = nicheSchema.parse(req.body)
    const niche = await prisma.nicheTemplate.create({ data })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.niche.create' as any,
        resource: 'niche_template', resourceId: niche.id,
        userId: req.user.sub, payload: { slug: data.slug, name: data.name } as any,
      },
    }).catch(() => {})

    return reply.status(201).send({ success: true, data: niche })
  })

  app.put('/niches/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = nicheSchema.partial().parse(req.body)
    const niche = await prisma.nicheTemplate.update({ where: { id }, data })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.niche.update' as any,
        resource: 'niche_template', resourceId: id,
        userId: req.user.sub, payload: data as any,
      },
    }).catch(() => {})

    return reply.send({ success: true, data: niche })
  })

  app.delete('/niches/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const niche = await prisma.nicheTemplate.update({
      where: { id },
      data: { isActive: false },
    })
    return reply.send({ success: true, data: niche })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULES
  // ═══════════════════════════════════════════════════════════════════════════

  app.get('/modules', async (_req, reply) => {
    const modules = await prisma.moduleDefinition.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { activations: true } } },
    })
    return reply.send({ success: true, data: modules })
  })

  app.post('/modules', async (req, reply) => {
    const data = moduleSchema.parse(req.body)
    const mod = await prisma.moduleDefinition.create({ data })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.module.create' as any,
        resource: 'module_definition', resourceId: mod.id,
        userId: req.user.sub, payload: { slug: data.slug, name: data.name } as any,
      },
    }).catch(() => {})

    return reply.status(201).send({ success: true, data: mod })
  })

  app.put('/modules/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = moduleSchema.partial().parse(req.body)
    const mod = await prisma.moduleDefinition.update({ where: { id }, data })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.module.update' as any,
        resource: 'module_definition', resourceId: id,
        userId: req.user.sub, payload: data as any,
      },
    }).catch(() => {})

    return reply.send({ success: true, data: mod })
  })

  app.delete('/modules/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const mod = await prisma.moduleDefinition.update({
      where: { id },
      data: { isActive: false },
    })
    return reply.send({ success: true, data: mod })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  app.get('/services', async (_req, reply) => {
    const services = await prisma.serviceDefinition.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { orders: true } } },
    })
    return reply.send({ success: true, data: services })
  })

  app.post('/services', async (req, reply) => {
    const data = serviceSchema.parse(req.body)
    const svc = await prisma.serviceDefinition.create({ data })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.service.create' as any,
        resource: 'service_definition', resourceId: svc.id,
        userId: req.user.sub, payload: { slug: data.slug, name: data.name } as any,
      },
    }).catch(() => {})

    return reply.status(201).send({ success: true, data: svc })
  })

  app.put('/services/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = serviceSchema.partial().parse(req.body)
    const svc = await prisma.serviceDefinition.update({ where: { id }, data })
    return reply.send({ success: true, data: svc })
  })

  app.delete('/services/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const svc = await prisma.serviceDefinition.update({
      where: { id },
      data: { isActive: false },
    })
    return reply.send({ success: true, data: svc })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  app.get('/settings', async (_req, reply) => {
    let settings = await prisma.globalSystemSettings.findUnique({
      where: { id: 'global' },
    })

    if (!settings) {
      settings = await prisma.globalSystemSettings.create({
        data: { id: 'global' },
      })
    }

    return reply.send({ success: true, data: settings })
  })

  app.put('/settings', async (req, reply) => {
    const data = settingsSchema.parse(req.body)
    const settings = await prisma.globalSystemSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', ...data, updatedBy: req.user.sub },
      update: { ...data, updatedBy: req.user.sub },
    })

    await app.prisma.auditLog.create({
      data: {
        companyId: 'platform', action: 'admin.settings.update' as any,
        resource: 'global_system_settings', resourceId: 'global',
        userId: req.user.sub, payload: { keys: Object.keys(data) } as any,
      },
    }).catch(() => {})

    return reply.send({ success: true, data: settings })
  })
}

// ─── Public Catalog (no auth) ────────────────────────────────────────────────

export async function publicCatalogRoutes(app: FastifyInstance) {
  const prisma = app.prisma as any

  // GET /public/catalog — Landing page data (plans, modules, services, niches)
  app.get('/catalog', async (req, reply) => {
    const q = req.query as any
    const nicheSlug = q.niche as string | undefined

    const [plans, modules, services, niches, settings] = await Promise.all([
      prisma.planDefinition.findMany({
        where: {
          isActive: true,
          ...(nicheSlug && {
            OR: [
              { nicheFilter: { isEmpty: true } },
              { nicheFilter: { has: nicheSlug } },
            ],
          }),
        },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, slug: true, name: true, description: true, longDescription: true,
          priceMonthly: true, priceYearly: true, maxProperties: true, maxLeadViews: true,
          maxUsers: true, themes: true, modules: true, features: true, billingType: true,
          highlighted: true, sortOrder: true,
        },
      }).catch(() => []),
      prisma.moduleDefinition.findMany({
        where: {
          isActive: true,
          billingType: { not: 'included' },
          ...(nicheSlug && {
            OR: [
              { nicheFilter: { isEmpty: true } },
              { nicheFilter: { has: nicheSlug } },
            ],
          }),
        },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, slug: true, name: true, description: true,
          priceMonthly: true, priceOneTime: true, billingType: true,
          category: true, requiredPlan: true, icon: true,
        },
      }).catch(() => []),
      prisma.serviceDefinition.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, slug: true, name: true, description: true,
          price: true, billingType: true, category: true, icon: true,
        },
      }).catch(() => []),
      prisma.nicheTemplate.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, slug: true, name: true, icon: true, description: true,
          itemLabel: true, itemLabelPlural: true, defaultTheme: true,
        },
      }).catch(() => []),
      prisma.globalSystemSettings.findUnique({
        where: { id: 'global' },
        select: { landingContent: true, brandConfig: true },
      }).catch(() => null),
    ])

    return reply.send({
      success: true,
      data: { plans, modules, services, niches, settings },
    })
  })

  // GET /public/niche/:slug — Niche-specific config for tenant rendering
  app.get('/niche/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const niche = await prisma.nicheTemplate.findUnique({
      where: { slug },
    }).catch(() => null)

    if (!niche || !niche.isActive) {
      return reply.status(404).send({ error: 'NICHE_NOT_FOUND' })
    }

    return reply.send({ success: true, data: niche })
  })
}
