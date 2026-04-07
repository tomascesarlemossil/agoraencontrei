import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../utils/env.js'

const PROPERTY_TYPES  = ['HOUSE','APARTMENT','LAND','FARM','RANCH','WAREHOUSE','OFFICE','STORE','STUDIO','PENTHOUSE','CONDO','KITNET'] as const
const PROPERTY_PURPOSES = ['SALE','RENT','BOTH','SEASON'] as const

const PublicFilters = z.object({
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(50).default(12),
  search:       z.string().optional(),
  ids:          z.string().optional(),  // CSV de IDs para favoritos/comparação
  // type and purpose: coerce to uppercase then validate against enum — invalid values return 400
  type:         z.preprocess(
    v => typeof v === 'string' ? v.toUpperCase() : v,
    z.enum(PROPERTY_TYPES).optional()
  ),
  purpose:      z.preprocess(
    v => typeof v === 'string' ? v.toUpperCase() : v,
    z.enum(PROPERTY_PURPOSES).optional()
  ),
  city:         z.string().optional(),
  neighborhood: z.string().optional(),
  state:        z.string().optional(),
  minPrice:     z.coerce.number().optional(),
  maxPrice:     z.coerce.number().optional(),
  bedrooms:     z.coerce.number().int().optional(),
  minArea:      z.coerce.number().optional(),
  maxArea:      z.coerce.number().optional(),
  bathrooms:    z.coerce.number().int().optional(),
  isFeatured:   z.coerce.boolean().optional(),
  closedCondo:  z.coerce.boolean().optional(),
  sortBy:       z.enum(['createdAt', 'price', 'priceRent', 'views']).default('createdAt'),
  sortOrder:    z.enum(['asc', 'desc']).default('desc'),
})

const LeadCaptureBody = z.object({
  name:       z.string().min(2).max(100),
  email:      z.string().email().optional(),
  phone:      z.string().min(8).max(20),
  interest:   z.enum(['buy', 'rent']).optional(),
  message:    z.string().max(1000).optional(),
  propertyId: z.string().cuid().optional(),
  utmSource:  z.string().optional(),
  utmMedium:  z.string().optional(),
  utmCampaign: z.string().optional(),
  // Fotos enviadas pelo cliente no formulário de anúncio
  photoUrls:  z.array(z.string()).max(50).optional(),
})

// ── Location privacy helper ─────────────────────────────────────────────────
// Exact coordinates are NEVER exposed publicly unless showExactLocation=true.
// When false, lat/lng are nulled — frontend must use city/neighborhood for map.
// showExactLocation IS returned to frontend so the map knows which mode to use.
type WithLocation = { latitude?: number | null; longitude?: number | null; showExactLocation?: boolean }
function applyLocationPrivacy<T extends WithLocation>(p: T): T {
  return {
    ...p,
    latitude:  p.showExactLocation ? p.latitude  : null,
    longitude: p.showExactLocation ? p.longitude : null,
    // showExactLocation kept in response so frontend renders correct map mode
  }
}

// Public fields exposed — no sensitive data
const PUBLIC_PROPERTY_SELECT = {
  id: true,
  reference: true,
  title: true,
  slug: true,
  description: true,
  type: true,
  purpose: true,
  category: true,
  status: true,
  price: true,
  priceRent: true,
  priceNegotiable: true,
  condoFee: true,
  iptu: true,
  city: true,
  state: true,
  neighborhood: true,
  // street, number, zipCode omitted — addresses are private (CRM only)
  // showExactLocation controls whether lat/lng are exposed — default false (approximate only)
  showExactLocation: true,
  latitude: true,
  longitude: true,
  condoName: true,
  totalArea: true,
  builtArea: true,
  landArea: true,
  bedrooms: true,
  suites: true,
  bathrooms: true,
  parkingSpaces: true,
  floor: true,
  yearBuilt: true,
  coverImage: true,
  images: true,
  videoUrl: true,
  virtualTourUrl: true,
  features: true,
  isFeatured: true,
  isPremium: true,
  views: true,
  createdAt: true,
  metaTitle: true,
  metaDescription: true,
  valueUnderConsultation: true,
  allowExchange: true,
  suitesWithCloset: true,
  demiSuites: true,
  rooms: true,
  livingRooms: true,
  diningRooms: true,
  tvRooms: true,
  garagesCovered: true,
  garagesOpen: true,
  elevators: true,
  commonArea: true,
  ceilingHeight: true,
  landDimensions: true,
  landFace: true,
  sunExposure: true,
  position: true,
  closedCondo: true,
  region: true,
  referencePoint: true,
  yearLastReformed: true,
  captorName: true,
  company: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      website: true,
      logoUrl: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      avatarUrl: true,
      creciNumber: true,
    },
  },
} as const

// ── In-memory company cache (avoids DB hit on every request) ──────────────────
let _companyCached: any = null
let _companyCachedAt = 0
const COMPANY_CACHE_TTL = 60_000 // 60 seconds in-memory

async function resolveCompany(app: FastifyInstance) {
  const now = Date.now()
  if (_companyCached && (now - _companyCachedAt) < COMPANY_CACHE_TTL) {
    return _companyCached
  }
  const companyId = env.PUBLIC_COMPANY_ID ?? undefined
  const company = companyId
    ? await app.prisma.company.findUnique({ where: { id: companyId } })
    : await app.prisma.company.findFirst({ where: { isActive: true } })
  if (company) {
    _companyCached = company
    _companyCachedAt = now
  }
  return company
}

// ── In-memory fallback cache (when Redis is unavailable) ──────────────────────
const _memCache = new Map<string, { value: unknown; expiresAt: number }>()

function memCacheGet(key: string): unknown | null {
  const entry = _memCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { _memCache.delete(key); return null }
  return entry.value
}

function memCacheSet(key: string, value: unknown, ttlSeconds: number): void {
  _memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  // Prevent unbounded growth
  if (_memCache.size > 500) {
    const oldest = [..._memCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0]
    if (oldest) _memCache.delete(oldest[0])
  }
}

// ── Redis cache helpers ────────────────────────────────────────────────────────
const CACHE_TTL = 600 // 10 minutes (increased from 5)

async function cacheGet(redis: FastifyInstance['redis'], key: string): Promise<unknown | null> {
  // Try Redis first, fall back to in-memory cache
  if (redis) {
    try {
      const raw = await redis.get(key)
      if (raw) return JSON.parse(raw)
    } catch { /* fall through to mem cache */ }
  }
  return memCacheGet(key)
}

async function cacheSet(redis: FastifyInstance['redis'], key: string, value: unknown, ttl = CACHE_TTL): Promise<void> {
  // Write to Redis if available
  if (redis) {
    try { await redis.setex(key, ttl, JSON.stringify(value)) } catch { /* ignore */ }
  }
  // Always write to in-memory cache as fallback
  memCacheSet(key, value, ttl)
}

export default async function publicRoutes(app: FastifyInstance) {
  // No auth required — public endpoints

  // GET /api/v1/public/properties — listing with filters
  app.get('/properties', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const _parsed = PublicFilters.safeParse(req.query)
    if (!_parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', message: _parsed.error.message })
    }
    const filters = _parsed.data

    const where: any = {
      companyId: company.id,
      status: 'ACTIVE',
      authorizedPublish: true,
      ...(filters.ids && { id: { in: filters.ids.split(',').map(s => s.trim()).filter(Boolean) } }),
      ...(filters.search && {
        OR: [
          { title:        { contains: filters.search, mode: 'insensitive' } },
          { description:  { contains: filters.search, mode: 'insensitive' } },
          { neighborhood: { contains: filters.search, mode: 'insensitive' } },
          { city:         { contains: filters.search, mode: 'insensitive' } },
          { reference:    { contains: filters.search, mode: 'insensitive' } },
          { street:       { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.type         && { type:    filters.type }),
      // Purpose filter: RENT includes BOTH, SALE includes BOTH
      ...(filters.purpose === 'RENT' && { purpose: { in: ['RENT', 'BOTH'] } }),
      ...(filters.purpose === 'SALE' && { purpose: { in: ['SALE', 'BOTH'] } }),
      ...(filters.purpose === 'BOTH' && { purpose: 'BOTH' }),
      ...(filters.purpose === 'SEASON' && { purpose: 'SEASON' }),
      ...(filters.city         && { city:    { contains: filters.city,         mode: 'insensitive' } }),
      ...(filters.neighborhood && { neighborhood: { contains: filters.neighborhood, mode: 'insensitive' } }),
      ...(filters.state        && { state:   { equals: filters.state,        mode: 'insensitive' } }),
      ...(filters.bedrooms  && { bedrooms:  { gte: filters.bedrooms } }),
      ...(filters.bathrooms && { bathrooms: { gte: filters.bathrooms } }),
      ...(filters.minArea   && { totalArea: { gte: filters.minArea } }),
      ...(filters.maxArea   && { totalArea: { lte: filters.maxArea } }),
      ...(filters.isFeatured  && { isFeatured:  { equals: true } }),
      ...(filters.closedCondo && { closedCondo: { equals: true } }),
    }

    // Price filter: use priceRent for RENT, price for SALE, or both fields for unspecified
    if (filters.minPrice || filters.maxPrice) {
      const priceRange = {
        ...(filters.minPrice && { gte: filters.minPrice }),
        ...(filters.maxPrice && { lte: filters.maxPrice }),
      }
      if (filters.purpose === 'RENT') {
        where.priceRent = priceRange
      } else if (filters.purpose === 'SALE') {
        where.price = priceRange
      } else {
        where.OR = [
          ...(where.OR ?? []),
          { price: priceRange },
          { priceRent: priceRange },
        ]
      }
    }

    const orderBy: any = { [filters.sortBy]: filters.sortOrder }

    const page  = filters.page
    const limit = filters.limit
    const skip  = (page - 1) * limit

    // Redis cache: skip cache for searches (dynamic), cache simple filters 5 min
    const cacheKey = `pub:props:v2:${company.id}:${JSON.stringify(req.query)}`
    if (!filters.search) {
      const cached = await cacheGet(app.redis, cacheKey)
      if (cached) return reply.send(cached)
    }

    const [total, items] = await Promise.all([
      app.prisma.property.count({ where }),
      app.prisma.property.findMany({
        where,
        select: PUBLIC_PROPERTY_SELECT,
        orderBy: [{ isFeatured: 'desc' }, orderBy],
        skip,
        take: limit,
      }),
    ])

    // Sort: when bedrooms filter is used, put residential types (HOUSE/APARTMENT) first
    const residentialTypes = ['HOUSE', 'APARTMENT', 'STUDIO', 'PENTHOUSE', 'CONDO', 'KITNET']
    const sortedItems = (filters.bedrooms || filters.bathrooms)
      ? [...items].sort((a: any, b: any) => {
          const aRes = residentialTypes.includes(a.type) ? 0 : 1
          const bRes = residentialTypes.includes(b.type) ? 0 : 1
          if (aRes !== bRes) return aRes - bRes
          // secondary: featured first
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)
        })
      : items

    // Fallback: when no results found, relax filters progressively to show similar properties
    let fallbackItems: any[] = []
    let isFallback = false
    if (total === 0 && page === 1) {
      isFallback = true
      const baseWhere = { companyId: company.id, status: 'ACTIVE' as const, authorizedPublish: true }

      // Step 1: same type + same purpose (drop neighborhood/price/bedrooms)
      if (filters.type && filters.purpose) {
        const purposeFilter: any = filters.purpose === 'RENT' ? { purpose: { in: ['RENT', 'BOTH'] } }
          : filters.purpose === 'SALE' ? { purpose: { in: ['SALE', 'BOTH'] } }
          : { purpose: filters.purpose }
        fallbackItems = await app.prisma.property.findMany({
          where: { ...baseWhere, type: filters.type, ...purposeFilter },
          select: PUBLIC_PROPERTY_SELECT,
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: limit,
        })
      }

      // Step 2: same purpose only (drop type) — but keep residential/rural separation
      if (fallbackItems.length < 3 && filters.purpose) {
        const RESIDENTIAL = ['HOUSE','APARTMENT','STUDIO','KITNET','PENTHOUSE','CONDO']
        const RURAL = ['FARM','RANCH']
        const isResidentialSearch = filters.type && RESIDENTIAL.includes(filters.type)
        const isRuralSearch = filters.type && RURAL.includes(filters.type)
        const purposeFilter: any = filters.purpose === 'RENT' ? { purpose: { in: ['RENT', 'BOTH'] } }
          : filters.purpose === 'SALE' ? { purpose: { in: ['SALE', 'BOTH'] } }
          : { purpose: filters.purpose }
        const existing = new Set(fallbackItems.map((p: any) => p.id))
        // When searching for residential, exclude rural types and vice versa
        const typeFilter = isResidentialSearch
          ? { type: { in: RESIDENTIAL } }
          : isRuralSearch
          ? { type: { in: RURAL } }
          : {}
        const more = await app.prisma.property.findMany({
          where: { ...baseWhere, ...purposeFilter, ...typeFilter, id: { notIn: Array.from(existing) as string[] } },
          select: PUBLIC_PROPERTY_SELECT,
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: limit - fallbackItems.length,
        })
        fallbackItems = [...fallbackItems, ...more]
      }

      // Step 3: same type only (drop purpose)
      if (fallbackItems.length < 3 && filters.type) {
        const existing = new Set(fallbackItems.map((p: any) => p.id))
        const more = await app.prisma.property.findMany({
          where: { ...baseWhere, type: filters.type, id: { notIn: Array.from(existing) as string[] } },
          select: PUBLIC_PROPERTY_SELECT,
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: limit - fallbackItems.length,
        })
        fallbackItems = [...fallbackItems, ...more]
      }

      // Step 4: same neighborhood (drop type/purpose/price)
      if (fallbackItems.length < 3 && filters.neighborhood) {
        const existing = new Set(fallbackItems.map((p: any) => p.id))
        const more = await app.prisma.property.findMany({
          where: { ...baseWhere, neighborhood: { contains: filters.neighborhood, mode: 'insensitive' }, id: { notIn: Array.from(existing) as string[] } },
          select: PUBLIC_PROPERTY_SELECT,
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: limit,
        })
        fallbackItems = [...fallbackItems, ...more]
      }

      // Step 5: any active featured properties as last resort — keep residential/rural separation
      if (fallbackItems.length === 0) {
        const RESIDENTIAL_LAST = ['HOUSE','APARTMENT','STUDIO','KITNET','PENTHOUSE','CONDO'] as const
        const RURAL_LAST = ['FARM','RANCH'] as const
        const isResidentialSearch = filters.type && (RESIDENTIAL_LAST as readonly string[]).includes(filters.type)
        const isRuralSearch = filters.type && (RURAL_LAST as readonly string[]).includes(filters.type)
        const typeFilter: any = isResidentialSearch
          ? { type: { in: RESIDENTIAL_LAST } }
          : isRuralSearch
          ? { type: { in: RURAL_LAST } }
          : {}
        fallbackItems = await app.prisma.property.findMany({
          where: { ...baseWhere, ...typeFilter },
          select: PUBLIC_PROPERTY_SELECT,
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: limit,
        })
      }
    }

    const finalData = isFallback ? fallbackItems.map(applyLocationPrivacy) : sortedItems.map(applyLocationPrivacy)

    const result = {
      data: finalData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        ...(isFallback && { isFallback: true, fallbackMessage: 'Não encontramos resultados exatos. Veja imóveis semelhantes:' }),
      },
    }

    if (!filters.search && !isFallback) await cacheSet(app.redis, cacheKey, result)

    return reply.send(result)
  })

  // GET /api/v1/public/properties/:slug — single property detail
  app.get('/properties/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const company  = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const property = await app.prisma.property.findFirst({
      where:  { slug, companyId: company.id, status: 'ACTIVE', authorizedPublish: true },
      select: PUBLIC_PROPERTY_SELECT,
    })

    if (!property) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Increment view count (fire and forget)
    app.prisma.property.update({
      where: { id: property.id },
      data:  { views: { increment: 1 } },
    }).catch(() => {})

    return reply.send(applyLocationPrivacy(property))
  })

  // GET /api/v1/public/properties/:slug/similar — similar properties (same type + city)
  app.get('/properties/:slug/similar', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const company  = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const base = await app.prisma.property.findFirst({
      where:  { slug, companyId: company.id, status: 'ACTIVE', authorizedPublish: true },
      select: { id: true, type: true, purpose: true, city: true, price: true, priceRent: true },
    })

    if (!base) return reply.status(404).send({ error: 'NOT_FOUND' })

    const baseWhere = {
      companyId: company.id,
      status: 'ACTIVE' as const,
      authorizedPublish: true,
      id: { not: base.id },
    }

    // Try same type + same city first
    let similar = base.city
      ? await app.prisma.property.findMany({
          where: { ...baseWhere, type: base.type, city: { contains: base.city, mode: 'insensitive' as const } },
          select: PUBLIC_PROPERTY_SELECT,
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: 6,
        })
      : []

    // Fallback: same type in any city
    if (similar.length < 3) {
      const moreIds = new Set(similar.map((p: any) => p.id))
      const more = await app.prisma.property.findMany({
        where: { ...baseWhere, type: base.type, id: { notIn: [base.id, ...Array.from(moreIds) as string[]] } },
        select: PUBLIC_PROPERTY_SELECT,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: 6 - similar.length,
      })
      similar = [...similar, ...more]
    }

    // Last resort: same purpose
    if (similar.length === 0) {
      similar = await app.prisma.property.findMany({
        where: { ...baseWhere, purpose: base.purpose },
        select: PUBLIC_PROPERTY_SELECT,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: 6,
      })
    }

    return reply.send(similar.map(applyLocationPrivacy))
  })

  // GET /api/v1/public/featured — featured properties
  app.get('/featured', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const cacheKey = `pub:featured:v1:${company.id}`
    const cached = await cacheGet(app.redis, cacheKey)
    if (cached) return reply.send(cached)

    const items = await app.prisma.property.findMany({
      where:   { companyId: company.id, status: 'ACTIVE', authorizedPublish: true, isFeatured: true },
      select:  PUBLIC_PROPERTY_SELECT,
      orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
      take:    8,
    })

    const result = items.map(applyLocationPrivacy)
    await cacheSet(app.redis, cacheKey, result, 300) // 5 min cache
    return reply.send(result)
  })

  // GET /api/v1/public/cities — list of cities with property counts
  app.get('/cities', async (_req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const cities = await app.prisma.property.groupBy({
      by: ['city', 'state'],
      where: { companyId: company.id, status: 'ACTIVE', authorizedPublish: true, city: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    })

    return reply.send(cities.map(c => ({
      city:  c.city,
      state: c.state,
      count: c._count.id,
    })))
  })

  // POST /api/v1/public/leads — capture lead from public portal
  app.post('/leads', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const _bodyParsed = LeadCaptureBody.safeParse(req.body)
    if (!_bodyParsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', message: _bodyParsed.error.message })
    }
    const body = _bodyParsed.data

    // Find or create contact
    let contact = body.email
      ? await app.prisma.contact.findFirst({
          where: { companyId: company.id, email: body.email },
        })
      : null

    if (!contact) {
      contact = await app.prisma.contact.create({
        data: {
          companyId: company.id,
          name:  body.name,
          email: body.email,
          phone: body.phone,
          type:  'INDIVIDUAL',
        },
      })
    }

    const lead = await app.prisma.lead.create({
      data: {
        companyId: company.id,
        name:      body.name,
        email:     body.email,
        phone:     body.phone,
        interest:  body.interest,
        notes:     body.message,
        source:    'portal_publico',
        utmSource:   body.utmSource,
        utmMedium:   body.utmMedium,
        utmCampaign: body.utmCampaign,
        contactId:   contact.id,
        status:      'NEW',
        // Armazenar fotos enviadas pelo cliente no metadata
        ...(body.photoUrls && body.photoUrls.length > 0 && {
          metadata: { photoUrls: body.photoUrls, photoCount: body.photoUrls.length },
        }),
        ...(body.propertyId && {
          properties: {
            create: { propertyId: body.propertyId },
          },
        }),
      },
    })

    // Fire SSE + automation
    const { emitAutomation } = await import('../../services/automation.emitter.js')
    const { emitSSE }        = await import('../../services/sse.emitter.js')
    emitAutomation({ companyId: company.id, event: 'lead_created', data: { ...lead } })
    emitSSE({ type: 'lead_created', companyId: company.id, payload: { id: lead.id, name: lead.name, source: lead.source } })

    // Email notification — non-blocking
    try {
      const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
      if (isEmailConfigured()) {
        const notes = body.message ?? ''
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1B2B5B;padding:20px 28px;border-radius:8px 8px 0 0">
              <h2 style="color:#C9A84C;margin:0;font-size:18px">🏠 Novo Lead — Imobiliária Lemos</h2>
            </div>
            <div style="background:#fff;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <p style="margin:0 0 12px;color:#111;font-size:15px"><strong>Nome:</strong> ${body.name}</p>
              ${body.phone ? `<p style="margin:0 0 12px;color:#111"><strong>Telefone:</strong> ${body.phone}</p>` : ''}
              ${body.email ? `<p style="margin:0 0 12px;color:#111"><strong>E-mail:</strong> ${body.email}</p>` : ''}
              ${body.interest ? `<p style="margin:0 0 12px;color:#111"><strong>Interesse:</strong> ${body.interest === 'buy' ? 'Comprar' : 'Alugar'}</p>` : ''}
              ${notes ? `<p style="margin:0 0 12px;color:#111"><strong>Mensagem:</strong><br/><span style="white-space:pre-wrap">${notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></p>` : ''}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
              <p style="font-size:12px;color:#888;margin:0">Enviado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
            </div>
          </div>`
        await sendEmail({
          to: ['imobiliarialemosfranca@gmail.com', 'tomascesarlemossilva@gmail.com', 'blognairalemos@gmail.com'],
          subject: `🏠 Novo lead: ${body.name} — Imobiliária Lemos`,
          html,
          replyTo: body.email,
        })
      }
    } catch { /* non-fatal */ }

    // WhatsApp notification via WhatsApp Cloud API — non-blocking
    try {
      const { env: envVars } = await import('../../utils/env.js')
      if (envVars.WHATSAPP_TOKEN && envVars.WHATSAPP_PHONE_ID) {
        const waMsgLines = [
          `🏠 *Novo Lead — Site*`,
          `👤 *Nome:* ${body.name}`,
          body.phone ? `📱 *Tel:* ${body.phone}` : '',
          body.email ? `📧 *Email:* ${body.email}` : '',
          body.interest ? `🎯 *Interesse:* ${body.interest === 'buy' ? 'Comprar' : 'Alugar'}` : '',
          body.message ? `💬 *Mensagem:* ${body.message.slice(0, 200)}` : '',
        ].filter(Boolean).join('\n')

        await fetch(
          `https://graph.facebook.com/v19.0/${envVars.WHATSAPP_PHONE_ID}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${envVars.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: '5516981010004',
              type: 'text',
              text: { body: waMsgLines },
            }),
          }
        )
      }
    } catch { /* non-fatal */ }

    return reply.status(201).send({ id: lead.id, message: 'Obrigado! Em breve entraremos em contato.' })
  })

  // POST /api/v1/public/proposta — Compra 100% Online proposal
  app.post('/proposta', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const body = req.body as any
    const { name, email, phone, cpf, propertyId, proposta } = body ?? {}

    if (!name || !phone) {
      return reply.status(400).send({ error: 'MISSING_FIELDS', message: 'Nome e telefone são obrigatórios.' })
    }

    // Find or create contact
    let contact = email
      ? await app.prisma.contact.findFirst({ where: { companyId: company.id, email } })
      : null

    if (!contact) {
      contact = await app.prisma.contact.create({
        data: {
          companyId: company.id,
          name,
          email: email ?? undefined,
          phone,
          cpf: cpf ?? undefined,
          type: 'INDIVIDUAL',
        },
      })
    }

    const propostaJson = JSON.stringify(proposta ?? {})
    const notes = [
      `=== PROPOSTA ONLINE ===`,
      proposta?.valorProposta ? `Valor proposto: R$ ${(proposta.valorProposta / 100).toLocaleString('pt-BR')}` : '',
      proposta?.formaPagamento ? `Forma de pagamento: ${proposta.formaPagamento}` : '',
      proposta?.entradaValor ? `Entrada: R$ ${(proposta.entradaValor / 100).toLocaleString('pt-BR')}` : '',
      proposta?.entradaFGTS  ? `FGTS: R$ ${(proposta.entradaFGTS / 100).toLocaleString('pt-BR')}` : '',
      proposta?.bancoFinanciamento ? `Banco: ${proposta.bancoFinanciamento}` : '',
      proposta?.prazoFinanciamento ? `Prazo: ${proposta.prazoFinanciamento} anos` : '',
      proposta?.permutaImovel ? `Permuta imóvel: ${JSON.stringify(proposta.permutaImovel)}` : '',
      proposta?.permutaVeiculo ? `Permuta veículo: ${JSON.stringify(proposta.permutaVeiculo)}` : '',
      proposta?.observacoes ? `Observações: ${proposta.observacoes}` : '',
      cpf ? `CPF: ${cpf}` : '',
    ].filter(Boolean).join('\n')

    const lead = await app.prisma.lead.create({
      data: {
        companyId: company.id,
        name,
        email: email ?? undefined,
        phone,
        interest: 'buy',
        notes,
        source: 'proposta_online',
        tags: ['proposta_online'],
        budget: proposta?.valorProposta ? proposta.valorProposta / 100 : undefined,
        contactId: contact.id,
        status: 'NEW',
        ...(propertyId && {
          properties: { create: { propertyId } },
        }),
      },
    })

    // Notify via SSE + automation
    try {
      const { emitAutomation } = await import('../../services/automation.emitter.js')
      const { emitSSE }        = await import('../../services/sse.emitter.js')
      emitAutomation({ companyId: company.id, event: 'lead_created', data: { ...lead } })
      emitSSE({ type: 'lead_created', companyId: company.id, payload: { id: lead.id, name: lead.name, source: 'proposta_online' } })
    } catch { /* non-fatal */ }

    // Email notification for proposta
    try {
      const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
      if (isEmailConfigured()) {
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#1B2B5B;padding:20px 28px;border-radius:8px 8px 0 0">
              <h2 style="color:#C9A84C;margin:0;font-size:18px">📋 Nova Proposta Online — Imobiliária Lemos</h2>
            </div>
            <div style="background:#fff;padding:24px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
              <p style="margin:0 0 12px;color:#111"><strong>Nome:</strong> ${name}</p>
              ${phone ? `<p style="margin:0 0 12px;color:#111"><strong>Telefone:</strong> ${phone}</p>` : ''}
              ${email ? `<p style="margin:0 0 12px;color:#111"><strong>E-mail:</strong> ${email}</p>` : ''}
              ${cpf ? `<p style="margin:0 0 12px;color:#111"><strong>CPF:</strong> ${cpf}</p>` : ''}
              <p style="margin:0 0 12px;color:#111"><strong>Detalhes:</strong><br/><span style="white-space:pre-wrap;font-size:13px">${notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
              <p style="font-size:12px;color:#888;margin:0">Enviado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
            </div>
          </div>`
        await sendEmail({
          to: ['imobiliarialemosfranca@gmail.com', 'tomascesarlemossilva@gmail.com'],
          subject: `📋 Nova proposta online: ${name} — Imobiliária Lemos`,
          html,
          replyTo: email,
        })
      }
    } catch { /* non-fatal */ }

    return reply.status(201).send({
      id: lead.id,
      message: 'Proposta recebida! Nossa equipe entrará em contato em até 24 horas.',
    })
  })

  // GET /api/v1/public/search-ai — interpret natural language search query
  app.get('/search-ai', async (req, reply) => {
    const { q } = req.query as { q?: string }
    if (!q || q.trim().length < 3) {
      return reply.send({ search: q ?? '' })
    }

    try {
      const { interpretSearchQuery } = await import('../../services/ai.service.js')
      const filters = await interpretSearchQuery(q.trim())
      return reply.send(filters)
    } catch (err) {
      // Fallback to simple text search if AI fails
      app.log.warn({ err }, '[search-ai] AI interpretation failed, using fallback')
      return reply.send({ search: q.trim() })
    }
  })

  // GET /api/v1/public/site-settings — public site configuration (hero video, theme, SEO, etc.)
  app.get('/site-settings', async (_req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const cacheKey = `pub:site-settings:v1:${company.id}`
    const cached = await cacheGet(app.redis, cacheKey)
    if (cached) return reply.send(cached)

    const settings     = (company.settings as any) ?? {}
    const systemConfig = settings.systemConfig ?? {}
    const siteConfig   = systemConfig.site   ?? {}
    const seoConfig    = systemConfig.seo    ?? {}
    const designConfig = systemConfig.design ?? {}

    const siteSettingsResult = {
      // ── Legado (compatibilidade) ──────────────────────────────────────
      heroVideoUrl:  settings.heroVideoUrl  ?? siteConfig.heroVideoUrl  ?? null,
      heroVideoType: settings.heroVideoType ?? siteConfig.heroVideoType ?? 'youtube',
      logoUrl:       settings.logoUrl       ?? company.logoUrl          ?? null,
      heroImageUrl:  settings.heroImageUrl  ?? siteConfig.heroImageUrl  ?? null,
      // ── Empresa ──────────────────────────────────────────────────────
      companyName:    company.tradeName || company.name,
      companyPhone:   company.phone    ?? '',
      companyEmail:   company.email    ?? '',
      companyAddress: company.address  ?? '',
      companyCity:    company.city     ?? '',
      companyState:   company.state    ?? '',
      companyCnpj:    company.cnpj     ?? '',
      companyCreci:   company.creci    ?? '',
      companyWebsite: company.website  ?? '',
      // ── Tema visual ───────────────────────────────────────────────────
      siteTheme: siteConfig.siteTheme ?? 'classic-blue',
      // ── Textos do hero ────────────────────────────────────────────────
      heroBadge:          siteConfig.heroBadge          ?? null,
      heroTitle:          siteConfig.heroTitle          ?? null,
      heroTitleHighlight: siteConfig.heroTitleHighlight ?? null,
      heroSubtitle:       siteConfig.heroSubtitle       ?? null,
      featuredTitle:      siteConfig.featuredTitle      ?? null,
      featuredSubtitle:   siteConfig.featuredSubtitle   ?? null,
      trustTitle:         siteConfig.trustTitle         ?? null,
      ctaTitle:           siteConfig.ctaTitle           ?? null,
      ctaSubtitle:        siteConfig.ctaSubtitle        ?? null,
      ctaButton:          siteConfig.ctaButton          ?? null,
      // ── Contato ───────────────────────────────────────────────────────
      whatsappNumber:  siteConfig.whatsappNumber  ?? '',
      whatsappMessage: siteConfig.whatsappMessage ?? 'Olá! Gostaria de saber mais sobre os imóveis.',
      phoneFixed:      siteConfig.phoneFixed      ?? company.phone ?? '',
      phoneMobile:     siteConfig.phoneMobile     ?? '',
      // ── Redes sociais ─────────────────────────────────────────────────
      instagramUrl:      siteConfig.instagramUrl      ?? '',
      instagramUrlTomas: siteConfig.instagramUrlTomas ?? '',
      facebookUrl:       siteConfig.facebookUrl       ?? '',
      youtubeUrl:        siteConfig.youtubeUrl        ?? '',
      linkedinUrl:       siteConfig.linkedinUrl       ?? '',
      tiktokUrl:         siteConfig.tiktokUrl         ?? '',
      // ── SEO ───────────────────────────────────────────────────────────
      seoTitle:            seoConfig.title            ?? null,
      seoDescription:      seoConfig.description      ?? null,
      seoKeywords:         seoConfig.keywords         ?? [],
      seoOgImage:          seoConfig.ogImage          ?? null,
      seoCanonical:        seoConfig.canonical        ?? null,
      seoGoogleAnalytics:  seoConfig.googleAnalytics  ?? null,
      seoGoogleTagManager: seoConfig.googleTagManager ?? null,
      seoFacebookPixel:    seoConfig.facebookPixel    ?? null,
      seoGoogleSiteVerify: seoConfig.googleSiteVerify ?? null,
      seoBingVerify:       seoConfig.bingVerify       ?? null,
      seoRobots:           seoConfig.robots           ?? 'index, follow',
      seoSchemaOrg:        seoConfig.schemaOrg        ?? true,
      // ── Seções visíveis ───────────────────────────────────────────────
      showHeroVideo:           siteConfig.showHeroVideo           ?? true,
      showSearchBar:           siteConfig.showSearchBar           ?? true,
      showFeaturedProperties:  siteConfig.showFeaturedProperties  ?? true,
      showServicesSection:     siteConfig.showServicesSection     ?? true,
      showBlogSection:         siteConfig.showBlogSection         ?? true,
      showCorretoresSection:   siteConfig.showCorretoresSection   ?? true,
      showFinanciamentos:      siteConfig.showFinanciamentos      ?? true,
      showWhatsappButton:      siteConfig.showWhatsappButton      ?? true,
      showChatWidget:          siteConfig.showChatWidget          ?? true,
      showTrustBadges:         siteConfig.showTrustBadges         ?? true,
      showStatsBar:            siteConfig.showStatsBar            ?? true,
      showSmartQuiz:           siteConfig.showSmartQuiz           ?? true,
      showAvaliacao:           siteConfig.showAvaliacao           ?? true,
      showAnunciarSection:     siteConfig.showAnunciarSection     ?? true,
      maintenanceMode:         siteConfig.maintenanceMode         ?? false,
      maintenanceMessage:      siteConfig.maintenanceMessage      ?? 'Site em manutenção. Voltamos em breve.',
      // ── Cores do site público ──────────────────────────────────────────
      primaryColor:       siteConfig.primaryColor       ?? '#1B2B5B',
      accentColor:        siteConfig.accentColor        ?? '#C9A84C',
      backgroundColor:    siteConfig.backgroundColor    ?? '#f9f7f4',
      textColor:          siteConfig.textColor          ?? '#1a1a1a',
      buttonPrimaryColor: siteConfig.buttonPrimaryColor ?? '#1B2B5B',
      buttonTextColor:    siteConfig.buttonTextColor    ?? '#ffffff',
      buttonBorderRadius: siteConfig.buttonBorderRadius ?? 12,
      // ── Cores do design ───────────────────────────────────────────────
      designPrimaryColor: designConfig.primaryColor ?? '#1B2B5B',
      designAccentColor:  designConfig.accentColor  ?? '#C9A84C',
      // ── Customização visual extra ─────────────────────────────────────
      customCss:        siteConfig.customCss        ?? '',
      customJs:         siteConfig.customJs         ?? '',
      faviconUrl:       siteConfig.faviconUrl       ?? null,
      ogImageUrl:       siteConfig.ogImageUrl       ?? seoConfig.ogImage ?? null,
      cookieBannerText: siteConfig.cookieBannerText ?? 'Usamos cookies para melhorar sua experiência.',
      showCookieBanner: siteConfig.showCookieBanner ?? true,
      // ── Vídeo de Apresentação ─────────────────────────────────────────────
      presentationMediaType:  siteConfig.presentationMediaType  ?? 'video',
      presentationVideoUrl:   siteConfig.presentationVideoUrl   ?? null,
      presentationBannerUrl:  siteConfig.presentationBannerUrl  ?? null,
      presentationBannerLink: siteConfig.presentationBannerLink ?? null,
      presentationTitle:      siteConfig.presentationTitle      ?? null,
      presentationSubtitle:   siteConfig.presentationSubtitle   ?? null,
    };
    await cacheSet(app.redis, cacheKey, siteSettingsResult, 600); // 10 min cache
    return reply.send(siteSettingsResult);
  })

  // POST /api/v1/public/avaliacao — estimativa de valor de imóvel em tempo real
  app.post('/avaliacao', async (req, reply) => {
    const body = req.body as any
    const { cidade, tipo, finalidade, area, quartos, banheiros, garagens } = body ?? {}

    if (!cidade || !tipo || !area) {
      return reply.status(400).send({ error: 'MISSING_FIELDS', message: 'cidade, tipo e area são obrigatórios' })
    }

    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    // Buscar imóveis comparáveis
    const where: any = {
      companyId: company.id,
      status:    'ACTIVE',
      authorizedPublish: true,
      city:      { contains: cidade, mode: 'insensitive' },
    }
    if (tipo)      where.type    = tipo
    if (finalidade) where.purpose = finalidade
    if (quartos)   where.bedrooms = { gte: Math.max(0, quartos - 1), lte: quartos + 1 }

    const comparaveis = await app.prisma.property.findMany({
      where,
      select: {
        id:           true,
        title:        true,
        price:        true,
        priceRent:    true,
        totalArea:    true,
        builtArea:    true,
        bedrooms:     true,
        neighborhood: true,
        slug:         true,
      },
      take: 30,
    })

    const usePrice = (p: any) => finalidade === 'rent' ? (p.priceRent ?? p.price) : p.price
    const getArea  = (p: any) => p.builtArea ?? p.totalArea ?? 0

    // Calcular média de preço por m²
    const comM2 = comparaveis.filter(p => Number(getArea(p)) > 0 && Number(usePrice(p)) > 0)
    const precosPorM2 = comM2.map(p => Number(usePrice(p)) / Number(getArea(p)))
    const mediaM2 = precosPorM2.length > 0
      ? precosPorM2.reduce((a, b) => a + b, 0) / precosPorM2.length
      : 0

    const valorEstimado = mediaM2 > 0 ? Math.round(mediaM2 * Number(area)) : 0

    // Badge
    let badge = 'NA_MEDIA'
    if (comparaveis.length > 3) {
      const valores = comparaveis.map(p => Number(usePrice(p))).filter(v => v > 0).sort((a,b)=>a-b)
      const p25 = valores[Math.floor(valores.length * 0.25)]
      const p75 = valores[Math.floor(valores.length * 0.75)]
      if (valorEstimado < p25) badge = 'ABAIXO_MEDIA'
      else if (valorEstimado > p75) badge = 'ACIMA_MEDIA'
    }

    // IA qualitativa (se ANTHROPIC_API_KEY configurado)
    let analiseIA: string | null = null
    if (env.ANTHROPIC_API_KEY) {
      try {
        const { analyzarMercado } = await import('../../services/ai.service.js') as any
        if (typeof analyzarMercado === 'function') {
          analiseIA = await analyzarMercado({
            cidade, tipo, finalidade, area, quartos,
            mediaM2: Math.round(mediaM2),
            valorEstimado,
            totalComparaveis: comparaveis.length,
          })
        }
      } catch { /* non-fatal */ }
    }

    return reply.send({
      valorEstimado,
      faixaMin:        Math.round(valorEstimado * 0.85),
      faixaMax:        Math.round(valorEstimado * 1.15),
      mediaM2:         Math.round(mediaM2),
      totalComparaveis: comparaveis.length,
      badge,
      analiseIA,
      comparaveis:     comparaveis.slice(0, 5).map(p => ({
        id:           p.id,
        slug:         p.slug,
        title:        p.title,
        price:        Number(usePrice(p)),
        area:         Number(getArea(p)),
        bedrooms:     p.bedrooms,
        neighborhood: p.neighborhood,
        precoM2:      Number(getArea(p)) > 0 ? Math.round(Number(usePrice(p)) / Number(getArea(p))) : 0,
      })),
    })
  })

  // GET /api/v1/public/map-clusters — neighborhoods with property count + avg coordinates
  // Supports BBOX filter: swLat, swLng, neLat, neLng (bounding box for viewport)
  app.get('/map-clusters', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const { purpose, type, swLat, swLng, neLat, neLng } = req.query as {
      purpose?: string; type?: string
      swLat?: string; swLng?: string; neLat?: string; neLng?: string
    }

    // BBOX filter — only apply when all 4 coords are provided
    const hasBbox = swLat && swLng && neLat && neLng
    const bboxStr = hasBbox ? `:${swLat},${swLng},${neLat},${neLng}` : ''
    const cacheKey = `pub:map-clusters:v2:${company.id}:${purpose ?? ''}:${type ?? ''}${bboxStr}`
    const cached = await cacheGet(app.redis, cacheKey)
    if (cached) return reply.send(cached)

    const where: any = {
      companyId: company.id,
      status: 'ACTIVE',
      authorizedPublish: true,
      neighborhood: { not: null },
      ...(purpose && { purpose: purpose.toUpperCase() }),
      ...(type && { type: type.toUpperCase() }),
      // BBOX spatial filter — only include properties within the viewport
      ...(hasBbox && {
        latitude:  { gte: parseFloat(swLat!), lte: parseFloat(neLat!) },
        longitude: { gte: parseFloat(swLng!), lte: parseFloat(neLng!) },
      }),
    }

    const clusters = await app.prisma.property.groupBy({
      by: ['neighborhood', 'city', 'state'],
      where,
      _count: { id: true },
      _avg:   { latitude: true, longitude: true },
      orderBy: { _count: { id: 'desc' } },
      take: 500, // limit to 500 clusters max for performance
    })

    const result = clusters.map(c => ({
      neighborhood: c.neighborhood,
      city:         c.city,
      state:        c.state,
      count:        c._count.id,
      lat:          c._avg.latitude,
      lng:          c._avg.longitude,
    }))

    await cacheSet(app.redis, cacheKey, result, 120) // 2 min cache (shorter for BBOX)
    return reply.send(result)
  })

  // POST /api/v1/public/visits — schedule a visit (public, no auth)
  const { default: visitRoutes } = await import('./visits.js')
  app.register(visitRoutes, { prefix: '/visits' })

  // GET /api/v1/public/neighborhoods — unique neighborhoods for autocomplete
  app.get('/neighborhoods', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const { city, purpose } = req.query as { city?: string; purpose?: string }

    const where: any = {
      companyId: company.id,
      status: 'ACTIVE',
      authorizedPublish: true,
      neighborhood: { not: null },
      ...(city    && { city:    { contains: city,    mode: 'insensitive' } }),
      ...(purpose && { purpose: purpose.toUpperCase() }),
    }

    const rows = await app.prisma.property.groupBy({
      by: ['neighborhood', 'city'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 100,
    })

    return reply.send(rows.map(r => ({
      neighborhood: r.neighborhood,
      city:         r.city,
      count:        r._count.id,
    })))
  })

  // POST /api/v1/public/voice-search
  // Recebe áudio (multipart), transcreve com Whisper e interpreta como busca
  // Funciona em Safari iOS (MediaRecorder) e todos os navegadores
  app.post('/voice-search', async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'NO_AUDIO', message: 'Nenhum arquivo de áudio enviado' })

      const apiKey = process.env.OPENAI_API_KEY ?? env.OPENAI_API_KEY
      if (!apiKey) {
        // Sem chave OpenAI: retorna vazio para o frontend usar busca textual
        return reply.send({ transcript: '', filters: {} })
      }

      // Ler buffer do áudio
      const chunks: Buffer[] = []
      for await (const chunk of data.file) chunks.push(chunk)
      const audioBuffer = Buffer.concat(chunks)

      if (audioBuffer.length < 100) {
        return reply.status(400).send({ error: 'AUDIO_TOO_SHORT', message: 'Áudio muito curto' })
      }

      // Mapear mimetype para extensão aceita pelo Whisper
      const mime = data.mimetype ?? 'audio/webm'
      const extMap: Record<string, string> = {
        'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a',
        'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-m4a': 'm4a',
        'video/webm': 'webm', 'audio/aac': 'aac', 'audio/flac': 'flac',
      }
      const ext = extMap[mime] ?? 'webm'

      // Chamar Whisper via fetch (sem SDK)
      const formData = new FormData()
      const blob = new Blob([audioBuffer], { type: mime })
      formData.append('file', blob, `audio.${ext}`)
      formData.append('model', 'whisper-1')
      formData.append('language', 'pt')
      formData.append('response_format', 'json')

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      })

      if (!whisperRes.ok) {
        const errText = await whisperRes.text()
        app.log.warn({ status: whisperRes.status, body: errText }, '[voice-search] Whisper error')
        return reply.send({ transcript: '', filters: {} })
      }

      const whisperData = await whisperRes.json() as { text: string }
      const transcript = (whisperData.text ?? '').trim()

      if (!transcript) return reply.send({ transcript: '', filters: {} })

      // Interpretar transcrição com IA (reutiliza função existente)
      let filters: Record<string, unknown> = {}
      try {
        const { interpretSearchQuery } = await import('../../services/ai.service.js')
        filters = await interpretSearchQuery(transcript) as Record<string, unknown>
      } catch {
        filters = { search: transcript }
      }

      return reply.send({ transcript, filters })
    } catch (err) {
      app.log.error({ err }, '[voice-search] Unexpected error')
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Erro ao processar áudio' })
    }
  })

  // POST /api/v1/public/upload-photo — upload de foto pública (sem autenticação)
  // Usado pelo formulário de anúncio de imóvel pelo cliente
  app.post('/upload-photo', async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'NO_FILE' })

      const chunks: Buffer[] = []
      for await (const chunk of data.file) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      const mimetype = data.mimetype || 'application/octet-stream'

      // Se S3 estiver configurado, usar S3
      const { s3Service } = await import('../../services/s3.service.js')
      if (s3Service.isConfigured()) {
        const { nanoid } = await import('nanoid')
        const key = `public-leads/${nanoid()}/${data.filename}`
        const url = await s3Service.upload(key, buffer, mimetype)
        return reply.send({ url, size: buffer.length, contentType: mimetype })
      }

      // Fallback: base64 data URL
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${mimetype};base64,${base64}`
      return reply.send({ url: dataUrl, size: buffer.length, contentType: mimetype, inline: true })
    } catch (err) {
      app.log.error({ err }, '[public/upload-photo] Error')
      return reply.status(500).send({ error: 'UPLOAD_FAILED' })
    }
  })

  // POST /api/v1/public/photo-edit-checkout — cria cobrança Asaas para edição de fotos (R$10)
  app.post('/photo-edit-checkout', async (req, reply) => {
    try {
      const body = req.body as { name?: string; email?: string; phone?: string; cpf?: string }
      const { name, email, phone, cpf } = body
      if (!name || !phone) return reply.status(400).send({ error: 'MISSING_FIELDS' })
      const { findOrCreateCustomer, createCharge, getPixQrCode } = await import('../../services/asaas.service.js')
      const customer = await findOrCreateCustomer({
        name,
        email: email ?? `${phone.replace(/\D/g, '')}@noemail.com`,
        phone,
        cpfCnpj: cpf || '',
      })
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)
      const charge = await createCharge({
        customer: customer.id,
        billingType: 'PIX',
        value: 10.00,
        dueDate: dueDate.toISOString().split('T')[0],
        description: 'Serviço de Edição de Fotos — até 20 fotos | Imobiliária Lemos',
        externalReference: `photo-edit-${Date.now()}`,
      })
      let pixQrCode: string | null = null
      let pixCopyCola: string | null = null
      try {
        const pix = await getPixQrCode(charge.id)
        pixQrCode = (pix as any)?.encodedImage ?? null
        pixCopyCola = (pix as any)?.payload ?? null
      } catch { /* ignore */ }
      return reply.send({
        chargeId: charge.id,
        value: charge.value,
        status: charge.status,
        invoiceUrl: (charge as any).invoiceUrl ?? null,
        bankSlipUrl: (charge as any).bankSlipUrl ?? null,
        pixQrCode,
        pixCopyCola,
        dueDate: (charge as any).dueDate ?? null,
      })
    } catch (err) {
      app.log.error({ err }, '[public/photo-edit-checkout] Error')
      return reply.status(500).send({ error: 'CHECKOUT_FAILED', message: String(err) })
    }
  })

  // GET /api/v1/public/photo-edit-status/:chargeId — verifica status do pagamento
  app.get('/photo-edit-status/:chargeId', async (req, reply) => {
    try {
      const { chargeId } = req.params as { chargeId: string }
      const { getCharge } = await import('../../services/asaas.service.js')
      const charge = await getCharge(chargeId)
      return reply.send({
        chargeId: (charge as any).id,
        status: (charge as any).status,
        paid: ['RECEIVED', 'CONFIRMED'].includes((charge as any).status),
      })
    } catch (err) {
      app.log.error({ err }, '[public/photo-edit-status] Error')
      return reply.status(500).send({ error: 'STATUS_CHECK_FAILED' })
    }
  })

  // GET /api/v1/public/team — lista pública de corretores com creciNumber
  app.get('/team', async (_req, reply) => {
    try {
      const company = await resolveCompany(app)
      if (!company) return reply.send([])

      const cacheKey = `pub:team:v1:${company.id}`
      const cached = await cacheGet(app.redis, cacheKey)
      if (cached) return reply.send(cached)

      const users = await app.prisma.user.findMany({
        where: {
          companyId: company.id,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          role: true,
          creciNumber: true,
        },
        orderBy: { createdAt: 'asc' },
      })
      await cacheSet(app.redis, cacheKey, users, 600) // 10 min cache
      return reply.send(users)
    } catch (err) {
      app.log.error({ err }, '[team] Error fetching team')
      return reply.status(500).send({ error: 'INTERNAL_ERROR' })
    }
  })

  // ── GET /auctions — Imóveis da Caixa (Apify enriched → CSV fallback) ──
  app.get('/auctions', async (req, reply) => {
    try {
      const { state: stateFilter } = req.query as { state?: string }
      const cacheKey = `pub:caixa:auctions:${stateFilter || 'ALL'}:v4`
      const cached = await cacheGet(app.redis, cacheKey)
      if (cached) return reply.send(cached)

      // Strategy: try Apify last-run data first (free, fast), then CSV fallback
      let auctions: Array<Record<string, unknown>> = []
      let source = 'csv'
      const sources: string[] = []

      // 1. Try Apify enriched data (last successful run — no credits consumed)
      try {
        const [{ fetchCaixaApifyLastRun }, { fetchSantanderApifyLastRun }] = await Promise.all([
          import('../../services/apify-caixa.service.js'),
          import('../../services/apify-santander.service.js'),
        ])

        const [caixaApify, santanderApify] = await Promise.all([
          fetchCaixaApifyLastRun(),
          fetchSantanderApifyLastRun(),
        ])

        if (caixaApify.length > 0) {
          auctions.push(...caixaApify.map(item => ({
            ...item,
            coverImageUrl: item.photos?.[0] || item.coverImageUrl,
          })))
          sources.push('apify-caixa')
          app.log.info(`[auctions] Apify Caixa: ${caixaApify.length} items`)
        }

        if (santanderApify.length > 0) {
          auctions.push(...santanderApify.map(item => ({
            ...item,
            coverImageUrl: item.photos?.[0] || item.coverImageUrl,
          })))
          sources.push('apify-santander')
          app.log.info(`[auctions] Apify Santander: ${santanderApify.length} items`)
        }

        if (auctions.length > 0) source = 'apify'
      } catch (apifyErr) {
        app.log.warn({ err: apifyErr }, '[auctions] Apify fallback failed, using CSV')
      }

      // 2. Fallback to CSV scraper if Apify returned nothing
      if (auctions.length === 0) {
        const UFS = stateFilter
          ? [stateFilter.toUpperCase()]
          : ['SP', 'MG', 'RJ', 'PR', 'GO', 'MS', 'RS', 'SC', 'BA', 'CE', 'PE', 'DF']

        for (const uf of UFS) {
          try {
            const csvUrl = `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${uf}.csv`
            const response = await fetch(csvUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://venda-imoveis.caixa.gov.br/',
              },
              signal: AbortSignal.timeout(15000),
            })
            if (!response.ok) continue

            const buffer = await response.arrayBuffer()
            const csvText = new TextDecoder('latin1').decode(buffer)
            const lines = csvText.split('\n').slice(2)

            for (const line of lines) {
              if (!line.trim()) continue
              const cols = line.split(';')
              if (cols.length < 11) continue

              const id = (cols[0] ?? '').trim()
              if (!id) continue

              const city = (cols[2] ?? '').trim()
              const neighborhood = (cols[3] ?? '').trim()
              const address = (cols[4] ?? '').trim()
              const price = parseFloat(((cols[5] ?? '0').replace(/\./g, '').replace(',', '.').trim())) || 0
              const appraisalValue = parseFloat(((cols[6] ?? '0').replace(/\./g, '').replace(',', '.').trim())) || 0
              const discount = parseFloat(((cols[7] ?? '0').replace(',', '.').trim())) || 0
              const financeable = (cols[8] ?? '').trim().toLowerCase() === 'sim'
              const description = (cols[9] ?? '').trim()
              const saleType = (cols[10] ?? '').trim()
              const link = (cols[11] ?? '').trim()

              const d = description.toLowerCase()
              let propertyType = 'Imóvel'
              if (d.includes('apartamento')) propertyType = 'Apartamento'
              else if (d.includes('casa')) propertyType = 'Casa'
              else if (d.includes('terreno') || d.includes('lote')) propertyType = 'Terreno'
              else if (d.includes('galpao') || d.includes('galp')) propertyType = 'Galpão'

              const bedroomsMatch = description.match(/(\d+)\s*qto/i)
              const totalAreaMatch = description.match(/([\d,.]+)\s*de\s*área\s*total/i)
              const privateAreaMatch = description.match(/([\d,.]+)\s*de\s*área\s*privativa/i)
              const landAreaMatch = description.match(/([\d,.]+)\s*de\s*área\s*do\s*terreno/i)
              const parkingMatch = description.match(/(\d+)\s*vaga/i)

              auctions.push({
                id: `caixa-${id}`, source: 'CAIXA', bankName: 'Caixa Econômica Federal',
                city, state: uf, neighborhood, address,
                price, appraisalValue, discount, financeable,
                fgtsAllowed: !!d.match(/fgts/i),
                description, saleType, link, propertyType,
                bedrooms: bedroomsMatch ? parseInt(bedroomsMatch[1]) : 0,
                totalArea: totalAreaMatch ? parseFloat(totalAreaMatch[1].replace(',', '.')) : 0,
                privateArea: privateAreaMatch ? parseFloat(privateAreaMatch[1].replace(',', '.')) : 0,
                landArea: landAreaMatch ? parseFloat(landAreaMatch[1].replace(',', '.')) : 0,
                parkingSpots: parkingMatch ? parseInt(parkingMatch[1]) : 0,
                coverImageUrl: `https://venda-imoveis.caixa.gov.br/fotos-imoveis/${id}_1.jpg`,
                auctionDate: null,
                leiloeiro: 'Caixa Econômica Federal',
              })
            }
          } catch { /* skip failed state */ }
        }
      }

      // Filter by state if Apify returned all states
      if (stateFilter && source === 'apify') {
        auctions = auctions.filter(a => (a.state as string)?.toUpperCase() === stateFilter.toUpperCase())
      }

      auctions.sort((a, b) => ((b.discount as number) || 0) - ((a.discount as number) || 0))

      const result = {
        total: auctions.length,
        updatedAt: new Date().toISOString(),
        source,
        items: auctions,
      }

      await cacheSet(app.redis, cacheKey, result, 21600) // 6h cache
      return reply.send(result)
    } catch (err) {
      app.log.error({ err }, '[auctions] Error fetching auctions')
      return reply.status(500).send({ error: 'INTERNAL_ERROR' })
    }
  })

  // ── POST /auctions/apify-trigger — Trigger new Apify Caixa scrape ──
  app.post('/auctions/apify-trigger', async (_req, reply) => {
    try {
      const { fetchCaixaViaApify } = await import('../../services/apify-caixa.service.js')
      const items = await fetchCaixaViaApify()
      return reply.send({
        total: items.length,
        updatedAt: new Date().toISOString(),
        source: 'apify-fresh',
        items,
      })
    } catch (err) {
      app.log.error({ err }, '[auctions] Apify trigger failed')
      return reply.status(500).send({ error: 'APIFY_ERROR' })
    }
  })

  // ── GET /rental-prices — Referência de preços de aluguel (QuintoAndar via Apify) ──
  app.get('/rental-prices', async (req, reply) => {
    try {
      const { city, neighborhood } = req.query as { city?: string; neighborhood?: string }
      if (!city) return reply.status(400).send({ error: 'city parameter required' })

      const cacheKey = `pub:rental:${city}:${neighborhood || 'all'}`
      const cached = await cacheGet(app.redis, cacheKey)
      if (cached) return reply.send(cached)

      const { getRentalPriceReference } = await import('../../services/apify-quintoandar.service.js')
      const result = await getRentalPriceReference(city, neighborhood)

      if (!result) {
        return reply.send({ avgRentPerSqm: 0, avgRent: 0, sampleSize: 0, city, neighborhood })
      }

      const response = { ...result, city, neighborhood }
      await cacheSet(app.redis, cacheKey, response, 86400) // 24h cache
      return reply.send(response)
    } catch (err) {
      app.log.error({ err }, '[rental-prices] Error')
      return reply.status(500).send({ error: 'INTERNAL_ERROR' })
    }
  })

  // ── GET /market-prices — Preços de mercado (ZAP Imóveis via Apify) ──
  app.get('/market-prices', async (req, reply) => {
    try {
      const { city, neighborhood, type } = req.query as { city?: string; neighborhood?: string; type?: 'sale' | 'rent' }
      if (!city) return reply.status(400).send({ error: 'city parameter required' })

      const cacheKey = `pub:market:${city}:${neighborhood || 'all'}:${type || 'all'}`
      const cached = await cacheGet(app.redis, cacheKey)
      if (cached) return reply.send(cached)

      const { getMarketPriceReference } = await import('../../services/apify-zap.service.js')
      const result = await getMarketPriceReference(city, neighborhood, type)

      const response = result || { avgPricePerSqm: 0, avgPrice: 0, medianPrice: 0, sampleSize: 0, listingType: type || 'all' }
      const finalResponse = { ...response, city, neighborhood }
      await cacheSet(app.redis, cacheKey, finalResponse, 86400)
      return reply.send(finalResponse)
    } catch (err) {
      app.log.error({ err }, '[market-prices] Error')
      return reply.status(500).send({ error: 'INTERNAL_ERROR' })
    }
  })
}
