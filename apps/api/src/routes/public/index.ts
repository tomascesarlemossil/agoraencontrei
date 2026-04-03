import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../utils/env.js'

const PublicFilters = z.object({
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(50).default(12),
  search:       z.string().optional(),
  type:         z.string().optional(),
  purpose:      z.string().optional(),
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
})

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

async function resolveCompany(app: FastifyInstance) {
  const companyId = env.PUBLIC_COMPANY_ID ?? undefined

  if (companyId) {
    return app.prisma.company.findUnique({ where: { id: companyId } })
  }

  return app.prisma.company.findFirst({ where: { isActive: true } })
}

// ── Redis cache helpers ────────────────────────────────────────────────────────
const CACHE_TTL = 300 // 5 minutes

async function cacheGet(redis: FastifyInstance['redis'], key: string): Promise<unknown | null> {
  if (!redis) return null
  try {
    const raw = await redis.get(key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

async function cacheSet(redis: FastifyInstance['redis'], key: string, value: unknown): Promise<void> {
  if (!redis) return
  try { await redis.setex(key, CACHE_TTL, JSON.stringify(value)) } catch { /* ignore */ }
}

export default async function publicRoutes(app: FastifyInstance) {
  // No auth required — public endpoints

  // GET /api/v1/public/properties — listing with filters
  app.get('/properties', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const filters = PublicFilters.parse(req.query)

    const where: any = {
      companyId: company.id,
      status: 'ACTIVE',
      authorizedPublish: true,
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
      ...(filters.type         && { type:    filters.type.toUpperCase() }),
      ...(filters.purpose      && { purpose: filters.purpose.toUpperCase() }),
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
    const cacheKey = `pub:props:${company.id}:${JSON.stringify(req.query)}`
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

    const result = {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }

    if (!filters.search) await cacheSet(app.redis, cacheKey, result)

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

    return reply.send(property)
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
      status: 'ACTIVE',
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

    return reply.send(similar)
  })

  // GET /api/v1/public/featured — featured properties
  app.get('/featured', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const items = await app.prisma.property.findMany({
      where:   { companyId: company.id, status: 'ACTIVE', authorizedPublish: true, isFeatured: true },
      select:  PUBLIC_PROPERTY_SELECT,
      orderBy: { updatedAt: 'desc' },
      take:    8,
    })

    return reply.send(items)
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

    const body = LeadCaptureBody.parse(req.body)

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

  // GET /api/v1/public/site-settings — public site configuration (hero video, etc.)
  app.get('/site-settings', async (_req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const settings = (company.settings as any) ?? {}
    return reply.send({
      heroVideoUrl: settings.heroVideoUrl ?? null,
      heroVideoType: settings.heroVideoType ?? 'youtube', // 'youtube' | 'upload'
      companyName: company.name,
      logoUrl: company.logoUrl,
    })
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
  app.get('/map-clusters', async (req, reply) => {
    const company = await resolveCompany(app)
    if (!company) return reply.status(503).send({ error: 'SERVICE_UNAVAILABLE' })

    const { purpose, type } = req.query as { purpose?: string; type?: string }

    const where: any = {
      companyId: company.id,
      status: 'ACTIVE',
      authorizedPublish: true,
      neighborhood: { not: null },
      ...(purpose && { purpose: purpose.toUpperCase() }),
      ...(type && { type: type.toUpperCase() }),
    }

    const clusters = await app.prisma.property.groupBy({
      by: ['neighborhood', 'city', 'state'],
      where,
      _count: { id: true },
      _avg:   { latitude: true, longitude: true },
      orderBy: { _count: { id: 'desc' } },
    })

    return reply.send(clusters.map(c => ({
      neighborhood: c.neighborhood,
      city:         c.city,
      state:        c.state,
      count:        c._count.id,
      lat:          c._avg.latitude,
      lng:          c._avg.longitude,
    })))
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
}
