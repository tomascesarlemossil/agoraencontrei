import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const toUpper = (v: unknown) => typeof v === 'string' ? v.toUpperCase() : v

const PropertyFilters = z.object({
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(100).default(20),
  search:       z.string().optional(),
  type:         z.string().transform(v => v.toUpperCase()).optional(),
  purpose:      z.preprocess(toUpper, z.enum(['SALE', 'RENT', 'BOTH', 'SEASON'])).optional(),
  status:       z.string().transform(v => v.toUpperCase()).optional(),
  city:         z.string().optional(),
  neighborhood: z.string().optional(),
  state:        z.string().optional(),
  minPrice:     z.coerce.number().optional(),
  maxPrice:     z.coerce.number().optional(),
  bedrooms:     z.coerce.number().int().optional(),
  minArea:      z.coerce.number().optional(),
  maxArea:      z.coerce.number().optional(),
  sortBy:       z.enum(['createdAt', 'price', 'priceRent', 'updatedAt', 'views']).default('createdAt'),
  sortOrder:    z.enum(['asc', 'desc']).default('desc'),
})

const CreatePropertyBody = z.object({
  title:        z.string().min(3).max(255),
  description:  z.string().optional(),
  type:         z.preprocess(toUpper, z.enum(['HOUSE','APARTMENT','LAND','FARM','RANCH','WAREHOUSE','OFFICE','STORE','STUDIO','PENTHOUSE','CONDO','KITNET'])),
  purpose:      z.preprocess(toUpper, z.enum(['SALE', 'RENT', 'BOTH', 'SEASON'])),
  category:     z.preprocess(toUpper, z.enum(['RESIDENTIAL','COMMERCIAL','RURAL','INDUSTRIAL'])).default('RESIDENTIAL'),
  status:       z.preprocess(toUpper, z.enum(['ACTIVE','INACTIVE','SOLD','RENTED','PENDING','DRAFT'])).default('ACTIVE'),
  price:        z.number().positive().optional(),
  priceRent:    z.number().positive().optional(),
  condoFee:     z.number().optional(),
  iptu:         z.number().optional(),
  zipCode:      z.string().optional(),
  street:       z.string().optional(),
  number:       z.string().optional(),
  complement:   z.string().optional(),
  neighborhood: z.string().optional(),
  city:         z.string().optional(),
  state:        z.string().max(2).optional(),
  totalArea:    z.number().positive().optional(),
  builtArea:    z.number().positive().optional(),
  landArea:     z.number().positive().optional(),
  latitude:     z.number().min(-90).max(90).optional(),
  longitude:    z.number().min(-180).max(180).optional(),
  bedrooms:     z.number().int().min(0).default(0),
  suites:       z.number().int().min(0).default(0),
  bathrooms:    z.number().int().min(0).default(0),
  parkingSpaces: z.number().int().min(0).default(0),
  yearBuilt:    z.number().int().min(1900).optional(),
  features:     z.array(z.string()).default([]),
  coverImage:   z.string().url().optional(),
  images:       z.array(z.string().url()).default([]),
  reference:    z.string().optional(),
  metaTitle:    z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).default([]),
})

function buildSlug(title: string, reference?: string | null): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 80)
  const suffix = reference ?? Date.now().toString(36)
  return `${base}-${suffix}`
}

export default async function propertiesRoutes(app: FastifyInstance) {
  // ── Public routes ────────────────────────────────────────────────────────

  // GET /api/v1/properties — public listing with filters
  app.get('/', {
    preHandler: [app.optionalAuth],
    schema: { tags: ['properties'], summary: 'List properties (public)' },
  }, async (req, reply) => {
    const q = PropertyFilters.parse(req.query)

    const where: any = {
      status: q.status ?? 'ACTIVE',
      ...(q.type        && { type: q.type }),
      ...(q.purpose     && { purpose: q.purpose }),
      ...(q.city        && { city: { contains: q.city, mode: 'insensitive' } }),
      ...(q.neighborhood && { neighborhood: { contains: q.neighborhood, mode: 'insensitive' } }),
      ...(q.state       && { state: q.state.toUpperCase() }),
      ...(q.bedrooms    && { bedrooms: { gte: q.bedrooms } }),
      ...(q.minArea     && { totalArea: { gte: q.minArea } }),
      ...(q.maxArea     && { totalArea: { lte: q.maxArea } }),
    }

    // Price filter based on purpose
    if (q.minPrice || q.maxPrice) {
      const priceField = q.purpose === 'RENT' ? 'priceRent' : 'price'
      where[priceField] = {
        ...(q.minPrice && { gte: q.minPrice }),
        ...(q.maxPrice && { lte: q.maxPrice }),
      }
    }

    // Full-text search
    if (q.search) {
      where.OR = [
        { title:        { contains: q.search, mode: 'insensitive' } },
        { description:  { contains: q.search, mode: 'insensitive' } },
        { neighborhood: { contains: q.search, mode: 'insensitive' } },
        { city:         { contains: q.search, mode: 'insensitive' } },
        { reference:    { contains: q.search, mode: 'insensitive' } },
      ]
    }

    const [total, items] = await Promise.all([
      app.prisma.property.count({ where }),
      app.prisma.property.findMany({
        where,
        select: {
          id: true, reference: true, title: true, slug: true,
          type: true, purpose: true, status: true,
          price: true, priceRent: true, condoFee: true,
          neighborhood: true, city: true, state: true,
          totalArea: true, builtArea: true,
          bedrooms: true, suites: true, bathrooms: true, parkingSpaces: true,
          coverImage: true, images: true,
          isFeatured: true, isPremium: true,
          views: true, favorites: true,
          createdAt: true,
        },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { [q.sortBy]: q.sortOrder },
      }),
    ])

    return reply.send({
      data: items,
      meta: {
        total,
        page: q.page,
        limit: q.limit,
        totalPages: Math.ceil(total / q.limit),
      },
    })
  })

  // GET /api/v1/properties/:slug — public detail
  app.get('/:slug', {
    preHandler: [app.optionalAuth],
    schema: { tags: ['properties'] },
  }, async (req, reply) => {
    const { slug } = req.params as { slug: string }

    const property = await app.prisma.property.findFirst({
      where: { slug, status: { not: 'DRAFT' } },
      include: {
        owners: { include: { contact: { select: { id: true, name: true, phone: true } } } },
        user: { select: { id: true, name: true, avatarUrl: true, phone: true, creciNumber: true } },
      },
    })

    if (!property) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Increment views
    app.prisma.property.update({
      where: { id: property.id },
      data: { views: { increment: 1 } },
    }).catch(() => {}) // fire and forget

    return reply.send(property)
  })

  // ── Protected routes ─────────────────────────────────────────────────────

  app.addHook('preHandler', async (req, reply) => {
    if (req.routerMethod !== 'GET') {
      await app.authenticate(req, reply)
    }
  })

  // GET /api/v1/properties/by-id/:id — authenticated detail by CUID (dashboard)
  app.get('/by-id/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'], summary: 'Get property detail by ID (admin)' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const where: any = { id, companyId: req.user.cid }
    if (req.user.role === 'BROKER') where.userId = req.user.sub

    const property = await app.prisma.property.findFirst({
      where,
      include: {
        owners: {
          include: {
            contact: {
              select: { id: true, name: true, phone: true, email: true, cpf: true, cnpj: true },
            },
          },
        },
        user: { select: { id: true, name: true, avatarUrl: true, phone: true, creciNumber: true } },
      },
    })

    if (!property) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(property)
  })

  // POST /api/v1/properties
  app.post('/', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'], summary: 'Create a property' },
  }, async (req, reply) => {
    const body = CreatePropertyBody.parse(req.body)
    const slug = buildSlug(body.title, body.reference)

    const property = await app.prisma.property.create({
      data: {
        ...body,
        slug,
        companyId: req.user.cid,
        userId: req.user.sub,
        price: body.price ? body.price : undefined,
        priceRent: body.priceRent ? body.priceRent : undefined,
        publishedAt: body.status === 'ACTIVE' ? new Date() : undefined,
      },
    })

    await app.prisma.activity.create({
      data: {
        companyId: req.user.cid,
        userId: req.user.sub,
        propertyId: property.id,
        type: 'system',
        title: 'Imóvel cadastrado',
        description: `${body.title} cadastrado por ${req.user.sub}`,
      },
    })

    return reply.status(201).send(property)
  })

  // PATCH /api/v1/properties/:id
  app.patch('/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = CreatePropertyBody.partial().parse(req.body)

    const existing = await app.prisma.property.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Brokers can only edit their own
    if (req.user.role === 'BROKER' && existing.userId !== req.user.sub) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const updated = await app.prisma.property.update({
      where: { id },
      data: {
        ...body,
        ...(body.status === 'ACTIVE' && !existing.publishedAt && { publishedAt: new Date() }),
      },
    })

    return reply.send(updated)
  })

  // DELETE /api/v1/properties/:id (soft — set INACTIVE)
  app.delete('/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    await app.prisma.property.update({
      where: { id, companyId: req.user.cid },
      data: { status: 'INACTIVE' },
    })

    return reply.send({ success: true })
  })

  // GET /api/v1/properties/stats — dashboard KPIs
  app.get('/stats/summary', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'], summary: 'Property stats for dashboard' },
  }, async (req, reply) => {
    const where = req.user.role === 'BROKER'
      ? { companyId: req.user.cid, userId: req.user.sub }
      : { companyId: req.user.cid }

    const [total, active, sold, rented, byType, byCityTop5] = await Promise.all([
      app.prisma.property.count({ where }),
      app.prisma.property.count({ where: { ...where, status: 'ACTIVE' } }),
      app.prisma.property.count({ where: { ...where, status: 'SOLD' } }),
      app.prisma.property.count({ where: { ...where, status: 'RENTED' } }),
      app.prisma.property.groupBy({ by: ['type'], where, _count: true }),
      app.prisma.property.groupBy({
        by: ['city'],
        where: { ...where, status: 'ACTIVE' },
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 5,
      }),
    ])

    return reply.send({ total, active, sold, rented, byType, byCityTop5 })
  })
}
