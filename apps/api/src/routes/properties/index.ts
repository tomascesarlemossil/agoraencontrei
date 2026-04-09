import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createAuditLog } from '../../services/audit.service.js'
import { geocodeProperty, sleep } from '../../services/geocoding.service.js'

const toUpper = (v: unknown) => typeof v === 'string' ? v.toUpperCase() : v

const PropertyFilters = z.object({
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(200).default(50),
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
  coverImage:   z.string().optional(),   // accepts URLs, data URLs, relative paths
  images:       z.array(z.string()).default([]),
  reference:    z.string().optional(),
  videoUrl:     z.string().optional().or(z.literal('')),
  videos:       z.array(z.string()).default([]),
  metaTitle:    z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).default([]),
  // Extended pricing
  pricePromo:   z.number().optional(),
  pricePerM2:   z.number().optional(),
  allowExchange: z.boolean().optional(),
  valueUnderConsultation: z.boolean().optional(),
  // Commercial details
  currentState: z.string().optional(),
  occupation:   z.string().optional(),
  standard:     z.string().optional(),
  auxReference: z.string().optional(),
  // Extended location
  commercialNeighborhood: z.string().optional(),
  region:       z.string().optional(),
  referencePoint: z.string().optional(),
  condoName:    z.string().optional(),
  closedCondo:  z.boolean().optional(),
  adminCompany: z.string().optional(),
  constructionCompany: z.string().optional(),
  signOnSite:   z.boolean().optional(),
  // Rooms breakdown
  suitesWithCloset: z.number().int().min(0).optional(),
  demiSuites:   z.number().int().min(0).optional(),
  rooms:        z.number().int().min(0).optional(),
  livingRooms:  z.number().int().min(0).optional(),
  diningRooms:  z.number().int().min(0).optional(),
  tvRooms:      z.number().int().min(0).optional(),
  garagesCovered: z.number().int().min(0).optional(),
  garagesOpen:  z.number().int().min(0).optional(),
  elevators:    z.number().int().min(0).optional(),
  // Extended areas
  commonArea:   z.number().optional(),
  ceilingHeight: z.number().optional(),
  landDimensions: z.string().optional(),
  landFace:     z.string().optional(),
  sunExposure:  z.string().optional(),
  position:     z.string().optional(),
  // Internal notes
  descriptionInternal: z.string().optional(),
  // Confidential
  cib:          z.string().optional(),
  iptuRegistration: z.string().optional(),
  cartorioMatricula: z.string().optional(),
  electricityInfo: z.string().optional(),
  waterInfo:    z.string().optional(),
  documentationPending: z.boolean().optional(),
  documentationNotes: z.string().optional(),
  isReserved:   z.boolean().optional(),
  authorizedPublish: z.boolean().default(true),
  showExactLocation: z.boolean().default(true), // Exibir localização exata no mapa
  // Captação
  captorName:   z.string().optional(),
  captorCommissionPct: z.number().optional(),
  exclusivityContract: z.boolean().optional(),
  commercialConditions: z.string().optional(),
  yearLastReformed: z.number().int().optional(),
  keyLocation:  z.string().optional(),
  // Additional property fields
  totalFloors:  z.number().int().min(0).optional(),
  isPremium:    z.boolean().optional(),
  isFeatured:   z.boolean().optional(),
  featuredUntil: z.string().optional(), // ISO date string
  // Portal publication toggles (stored in portalDescriptions JSON)
  portalDescriptions: z.record(z.unknown()).optional(),
  // SEO slug override
  slug:         z.string().optional(),
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
    const _parsed = PropertyFilters.safeParse(req.query)
    if (!_parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', details: _parsed.error.errors })
    }
    const q = _parsed.data

    // Scope by company when authenticated; restrict to public-safe defaults when not
    const isAuth = !!(req as any).user
    const userSettings = isAuth ? ((await app.prisma.user.findUnique({ where: { id: (req as any).user.sub }, select: { settings: true } }))?.settings as any ?? {}) : {}
    const isIsolated = userSettings.isolatedCompany === true
    const showAllProperties = isAuth && (req.query as any).showAll === 'true'

    // Isolated users always see all ACTIVE properties (read-only marketplace)
    const showMarketplace = showAllProperties || isIsolated

    const where: any = {
      ...(isAuth && !showMarketplace && { companyId: (req as any).user.cid }),
      ...(isAuth && showMarketplace && { status: 'ACTIVE', authorizedPublish: true }),
      ...(!isAuth && { status: 'ACTIVE', authorizedPublish: true }),
      ...(isAuth && !showMarketplace && q.status && { status: q.status }),
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
          id: true, companyId: true, reference: true, title: true, slug: true,
          type: true, purpose: true, status: true,
          price: true, priceRent: true, condoFee: true,
          neighborhood: true, city: true, state: true, street: true, number: true,
          totalArea: true, builtArea: true,
          bedrooms: true, suites: true, bathrooms: true, parkingSpaces: true,
          coverImage: true, images: true,
          isFeatured: true, isPremium: true,
          views: true, favorites: true,
          createdAt: true,
          latitude: true, longitude: true,
          // Cross-reference data
          contracts: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              rentValue: true,
              tenantDueDay: true,
              tenant: { select: { id: true, name: true, phone: true } },
            },
            take: 1,
          },
          _count: { select: { contracts: true, documents: true } },
        },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { [q.sortBy]: q.sortOrder },
      }),
    ])

    // Strip confidential data from properties of other companies
    const userCid = isAuth ? (req as any).user.cid : null
    const sanitizedItems = items.map((item: any) => {
      // Own company: show everything
      if (isAuth && item.companyId === userCid && !isIsolated) return item
      // Other company or isolated user: hide confidential fields
      return {
        id: item.id,
        companyId: item.companyId,
        reference: item.reference,
        title: item.title,
        slug: item.slug,
        type: item.type,
        purpose: item.purpose,
        status: item.status,
        price: item.price,
        priceRent: item.priceRent,
        condoFee: item.condoFee,
        neighborhood: item.neighborhood,
        city: item.city,
        state: item.state,
        // CONFIDENTIAL: hide street, number, exact location
        street: null,
        number: null,
        latitude: null,
        longitude: null,
        // Show areas and specs
        totalArea: item.totalArea,
        builtArea: item.builtArea,
        bedrooms: item.bedrooms,
        suites: item.suites,
        bathrooms: item.bathrooms,
        parkingSpaces: item.parkingSpaces,
        // Show photos
        coverImage: item.coverImage,
        images: item.images,
        isFeatured: item.isFeatured,
        isPremium: item.isPremium,
        views: item.views,
        favorites: item.favorites,
        createdAt: item.createdAt,
        // CONFIDENTIAL: hide contracts, owners, counts
        contracts: [],
        _count: { contracts: 0, documents: 0 },
        _readOnly: true,
      }
    })

    return reply.send({
      data: sanitizedItems,
      meta: {
        total,
        page: q.page,
        limit: q.limit,
        totalPages: Math.ceil(total / q.limit),
      },
    })
  })

  // GET /api/v1/properties/map-pins — all properties with coordinates for admin map
  app.get('/map-pins', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'] },
  }, async (req, reply) => {
    const items = await app.prisma.property.findMany({
      where: {
        companyId: req.user.cid,
        latitude:  { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        reference: true,
        title: true,
        slug: true,
        type: true,
        purpose: true,
        status: true,
        price: true,
        priceRent: true,
        neighborhood: true,
        city: true,
        state: true,
        street: true,
        number: true,
        latitude: true,
        longitude: true,
        coverImage: true,
        bedrooms: true,
        bathrooms: true,
        totalArea: true,
        isFeatured: true,
      },
      orderBy: { createdAt: 'desc' },
    })
     return reply.send(items)
  })

  // POST /api/v1/properties/geocode-batch — geocode all properties without lat/lng
  app.post('/geocode-batch', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'] },
  }, async (req, reply) => {
    // Only ADMIN/MANAGER can run batch geocoding
    if (!['ADMIN', 'MANAGER', 'OWNER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const properties = await app.prisma.property.findMany({
      where: {
        companyId: req.user.cid,
        OR: [
          { latitude: null },
          { longitude: null },
        ],
      },
      select: {
        id: true,
        street: true,
        number: true,
        neighborhood: true,
        city: true,
        state: true,
        zipCode: true,
      },
    })

    if (properties.length === 0) {
      return reply.send({ message: 'Todos os imóveis já possuem coordenadas.', total: 0, updated: 0 })
    }

    // Run geocoding in background, respond immediately with count
    reply.send({
      message: `Geocoding iniciado para ${properties.length} imóvel(is). Processo em background.`,
      total: properties.length,
    })

    // Background processing (non-blocking)
    ;(async () => {
      let updated = 0
      let failed = 0
      for (const prop of properties) {
        try {
          const result = await geocodeProperty(prop)
          if (result) {
            await app.prisma.property.update({
              where: { id: prop.id },
              data: { latitude: result.latitude, longitude: result.longitude },
            })
            updated++
          } else {
            failed++
          }
        } catch {
          failed++
        }
        // Rate limit: 1.1s between requests
        await sleep(1100)
      }
      app.log.info(`[geocode-batch] Done: ${updated} updated, ${failed} failed out of ${properties.length}`)
    })().catch(e => app.log.error('[geocode-batch] Error:', e))
  })

  // GET /api/v1/properties/geocode-status — count properties without coordinates
  app.get('/geocode-status', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'] },
  }, async (req, reply) => {
    const [withCoords, withoutCoords, total] = await Promise.all([
      app.prisma.property.count({
        where: { companyId: req.user.cid, latitude: { not: null }, longitude: { not: null } },
      }),
      app.prisma.property.count({
        where: { companyId: req.user.cid, OR: [{ latitude: null }, { longitude: null }] },
      }),
      app.prisma.property.count({ where: { companyId: req.user.cid } }),
    ])
    return reply.send({ total, withCoords, withoutCoords })
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
    if (req.method !== 'GET') {
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
        contracts: {
          select: {
            id: true, status: true, rentValue: true, startDate: true, rescissionDate: true,
            tenantDueDay: true, landlordDueDay: true, legacyId: true,
            tenant: { select: { id: true, name: true, phone: true, email: true } },
            landlord: { select: { id: true, name: true, phone: true } },
            _count: { select: { documents: true, rentals: true } },
          },
          orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
          take: 5,
        },
        documents: {
          select: { id: true, name: true, type: true, month: true, year: true, mimeType: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { contracts: true, documents: true } },
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

    // Auto-geocode if address is provided but lat/lng are missing
    let autoLat = body.latitude
    let autoLng = body.longitude
    if ((!autoLat || !autoLng) && (body.street || body.neighborhood || body.city)) {
      try {
        const geo = await geocodeProperty({
          street: body.street, number: body.number,
          neighborhood: body.neighborhood, city: body.city,
          state: body.state, zipCode: body.zipCode,
        })
        if (geo) { autoLat = geo.latitude; autoLng = geo.longitude }
      } catch { /* geocoding failure is non-fatal */ }
    }

    const property = await app.prisma.property.create({
      data: {
        ...body,
        slug,
        companyId: req.user.cid,
        userId: req.user.sub,
        price: body.price ? body.price : undefined,
        priceRent: body.priceRent ? body.priceRent : undefined,
        publishedAt: body.status === 'ACTIVE' ? new Date() : undefined,
        authorizedPublish: body.authorizedPublish ?? (body.status === 'ACTIVE'),
        showExactLocation: body.showExactLocation ?? true,
        portalDescriptions: body.portalDescriptions as any,
        ...(autoLat && autoLng && { latitude: autoLat, longitude: autoLng }),
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

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'property.create',
      resource: 'property',
      resourceId: property.id,
      before: null,
      after: property as any,
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
    // Only ADMIN and SUPER_ADMIN can set isFeatured (homepage highlights)
    if (body.isFeatured !== undefined && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      delete (body as any).isFeatured
    }

    // Auto-geocode when address fields change and lat/lng are missing
    let geoUpdate: { latitude?: number; longitude?: number } = {}
    const addressChanged = body.street !== undefined || body.neighborhood !== undefined ||
      body.city !== undefined || body.zipCode !== undefined
    const hasNoCoords = !body.latitude && !body.longitude && !existing.latitude && !existing.longitude
    if (addressChanged && hasNoCoords) {
      const addrForGeo = {
        street: body.street ?? existing.street,
        number: body.number ?? existing.number,
        neighborhood: body.neighborhood ?? existing.neighborhood,
        city: body.city ?? existing.city,
        state: body.state ?? existing.state,
        zipCode: body.zipCode ?? existing.zipCode,
      }
      if (addrForGeo.street || addrForGeo.neighborhood || addrForGeo.city) {
        try {
          const geo = await geocodeProperty(addrForGeo)
          if (geo) geoUpdate = { latitude: geo.latitude, longitude: geo.longitude }
        } catch { /* non-fatal */ }
      }
    }

    const updated = await app.prisma.property.update({
      where: { id },
      data: {
        ...body,
        ...geoUpdate,
        ...(body.status === 'ACTIVE' && !existing.publishedAt && { publishedAt: new Date() }),
        ...(body.portalDescriptions !== undefined && { portalDescriptions: body.portalDescriptions as any }),
      },
    })
    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'property.update',
      resource: 'property',
      resourceId: id,
      before: existing as any,
      after:  updated  as any,
    })

    // Auto-post to Instagram when property becomes ACTIVE
    let autoPostStatus: string | null = null
    if (body.status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      try {
        const { generatePropertyCaption } = await import('../../services/caption-generator.service.js')
        const { publishPropertyToInstagram } = await import('../../services/instagram-publisher.service.js')

        // Read Instagram tokens from company settings first, fallback to env
        const company = await app.prisma.company.findUnique({ where: { id: req.user.cid }, select: { settings: true } })
        const companySettings = (company?.settings as any) ?? {}
        const igToken = companySettings.instagramPageAccessToken || env.INSTAGRAM_PAGE_ACCESS_TOKEN
        const igUserId = companySettings.instagramBusinessAccountId || env.INSTAGRAM_BUSINESS_ACCOUNT_ID

        if (igToken && igUserId && updated.coverImage) {
          const { caption, hashtags } = await generatePropertyCaption(updated as any)
          await publishPropertyToInstagram(updated.coverImage, `${caption}\n\n${hashtags}`, igUserId, igToken)
          autoPostStatus = 'posted'
          app.log.info(`[auto-post] Instagram post published for property ${id}`)
        } else {
          autoPostStatus = 'skipped'
        }
      } catch (err: any) {
        autoPostStatus = `failed: ${err.message}`
        app.log.warn({ err }, '[auto-post] Failed to auto-post to Instagram')
      }
    }

    return reply.send({ ...updated, _autoPost: autoPostStatus })
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

    const toDelete = await app.prisma.property.findFirst({
      where: { id, companyId: req.user.cid },
      select: { id: true, title: true, status: true, reference: true },
    })

    await app.prisma.property.update({
      where: { id, companyId: req.user.cid },
      data: { status: 'INACTIVE' },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'property.delete',
      resource: 'property',
      resourceId: id,
      before: toDelete as any,
      after:  { ...toDelete, status: 'INACTIVE' } as any,
    })

    return reply.send({ success: true })
  })

  // GET /api/v1/properties/by-id/:id/leads — lead history for a property
  app.get('/by-id/:id/leads', {
    preHandler: [app.authenticate],
    schema: { tags: ['properties'], summary: 'Lead history for a property' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const q = req.query as any
    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '50', 10)

    // Find by propertyId directly, or by propertyRef in metadata
    const prop = await app.prisma.property.findFirst({
      where: { id, companyId: req.user.cid },
      select: { reference: true },
    })
    if (!prop) return reply.status(404).send({ error: 'NOT_FOUND' })

    const where: any = {
      companyId: req.user.cid,
      OR: [
        { metadata: { path: ['propertyId'], equals: id } },
        ...(prop.reference ? [{ metadata: { path: ['propertyRef'], equals: prop.reference } }] : []),
      ],
    }

    const [total, leads] = await Promise.all([
      app.prisma.lead.count({ where }),
      app.prisma.lead.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true,
          status: true, source: true, notes: true, metadata: true,
          createdAt: true,
          contact: { select: { id: true, name: true, cpf: true, mobilePhone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: leads, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
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
