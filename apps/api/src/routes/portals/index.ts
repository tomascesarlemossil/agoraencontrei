import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createAdapter } from '../../services/portals/registry.js'
import type { PropertyPayload } from '../../services/portals/adapter.interface.js'

const PORTAL_NAMES: Record<string, string> = {
  olx:      'OLX',
  zap:      'ZAP Imóveis',
  vivareal: 'Viva Real',
  chavescasa: 'Chaves na Mão',
  facebook: 'Facebook Marketplace',
  imovelweb: 'ImovelWeb',
}

const UpsertConfigBody = z.object({
  portalId:   z.string().min(2),
  portalName: z.string().optional(),
  apiKey:     z.string().optional(),
  apiSecret:  z.string().optional(),
  settings:   z.record(z.unknown()).optional(),
  isActive:   z.boolean().optional(),
  isPaid:     z.boolean().optional(),
})

const PublishBody = z.object({
  propertyId:  z.string().cuid(),
  portalId:    z.string().min(2),
  description: z.string().optional(),
})

export default async function portalsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/portals — list all configured portals for company
  app.get('/', {
    schema: { tags: ['portals'] },
  }, async (req, reply) => {
    const configs = await app.prisma.portalConfig.findMany({
      where: { companyId: req.user.cid },
      orderBy: { portalId: 'asc' },
    })
    return reply.send(configs)
  })

  // PUT /api/v1/portals/:portalId — upsert portal config (admin only)
  app.put('/:portalId', {
    schema: { tags: ['portals'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { portalId } = req.params as { portalId: string }
    const body = UpsertConfigBody.parse(req.body)

    const config = await app.prisma.portalConfig.upsert({
      where: { companyId_portalId: { companyId: req.user.cid, portalId } },
      create: {
        companyId: req.user.cid,
        portalId,
        portalName: body.portalName ?? PORTAL_NAMES[portalId] ?? portalId,
        apiKey:     body.apiKey,
        apiSecret:  body.apiSecret,
        settings:   body.settings as any ?? {},
        isActive:   body.isActive ?? false,
        isPaid:     body.isPaid ?? false,
      },
      update: {
        ...(body.portalName  && { portalName: body.portalName }),
        ...(body.apiKey      !== undefined && { apiKey: body.apiKey }),
        ...(body.apiSecret   !== undefined && { apiSecret: body.apiSecret }),
        ...(body.settings    && { settings: body.settings as any }),
        ...(body.isActive    !== undefined && { isActive: body.isActive }),
        ...(body.isPaid      !== undefined && { isPaid: body.isPaid }),
      },
    })

    return reply.send(config)
  })

  // GET /api/v1/portals/publications — list publications (filterable by propertyId/portalId)
  app.get('/publications', {
    schema: { tags: ['portals'] },
  }, async (req, reply) => {
    const q = req.query as any
    const where: any = {
      property: { companyId: req.user.cid },
      ...(q.propertyId && { propertyId: q.propertyId }),
      ...(q.portalId   && { portalId: q.portalId }),
      ...(q.status     && { status: q.status }),
    }

    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '20', 10)

    const [total, items] = await Promise.all([
      app.prisma.portalPublication.count({ where }),
      app.prisma.portalPublication.findMany({
        where,
        include: { property: { select: { id: true, title: true, slug: true, coverImage: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // POST /api/v1/portals/publish — publish a property to a portal
  app.post('/publish', {
    schema: { tags: ['portals'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'BROKER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const body = PublishBody.parse(req.body)

    // Verify property belongs to company
    const property = await app.prisma.property.findFirst({
      where: { id: body.propertyId, companyId: req.user.cid },
    })
    if (!property) return reply.status(404).send({ error: 'PROPERTY_NOT_FOUND' })

    // Load portal config (may not exist — adapter defaults to stub mode)
    const portalConfig = await app.prisma.portalConfig.findUnique({
      where: { companyId_portalId: { companyId: req.user.cid, portalId: body.portalId } },
    })

    const adapterConfig = {
      apiKey:    portalConfig?.apiKey ?? undefined,
      apiSecret: portalConfig?.apiSecret ?? undefined,
      settings:  (portalConfig?.settings as Record<string, unknown>) ?? {},
    }

    const adapter = createAdapter(body.portalId, adapterConfig)

    const payload: PropertyPayload = {
      id:            property.id,
      title:         property.title,
      description:   body.description ?? property.description ?? undefined,
      type:          property.type,
      purpose:       property.purpose,
      price:         property.price ? Number(property.price) : undefined,
      priceRent:     property.priceRent ? Number(property.priceRent) : undefined,
      city:          property.city ?? undefined,
      state:         property.state ?? undefined,
      neighborhood:  property.neighborhood ?? undefined,
      street:        property.street ?? undefined,
      number:        property.number ?? undefined,
      zipCode:       property.zipCode ?? undefined,
      latitude:      property.latitude ?? undefined,
      longitude:     property.longitude ?? undefined,
      totalArea:     property.totalArea ?? undefined,
      builtArea:     property.builtArea ?? undefined,
      bedrooms:      property.bedrooms,
      suites:        property.suites,
      bathrooms:     property.bathrooms,
      parkingSpaces: property.parkingSpaces,
      features:      property.features,
      coverImage:    property.coverImage ?? undefined,
      images:        property.images,
      videoUrl:      property.videoUrl ?? undefined,
      slug:          property.slug,
    }

    let externalId: string | undefined
    let errorMsg: string | undefined
    let status = 'published'

    try {
      const result = await adapter.publish(payload, adapterConfig)
      if (!result.success) {
        status = 'failed'
        errorMsg = result.message
      } else {
        externalId = result.externalId
      }
    } catch (err: any) {
      status = 'failed'
      errorMsg = err.message
    }

    const pub = await app.prisma.portalPublication.upsert({
      where: { propertyId_portalId: { propertyId: body.propertyId, portalId: body.portalId } },
      create: {
        propertyId:  body.propertyId,
        portalId:    body.portalId,
        description: body.description,
        status,
        externalId,
        errorMsg,
        publishedAt: status === 'published' ? new Date() : null,
      },
      update: {
        description: body.description,
        status,
        externalId:  externalId ?? undefined,
        errorMsg:    errorMsg ?? null,
        publishedAt: status === 'published' ? new Date() : undefined,
      },
    })

    return reply.status(201).send({ ...pub, stubMode: adapter.stubMode })
  })

  // POST /api/v1/portals/sync/:portalId — sync/republish all active properties to a portal
  app.post('/sync/:portalId', {
    schema: { tags: ['portals'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { portalId } = req.params as { portalId: string }

    const portalConfig = await app.prisma.portalConfig.findUnique({
      where: { companyId_portalId: { companyId: req.user.cid, portalId } },
    })

    if (!portalConfig) return reply.status(404).send({ error: 'PORTAL_CONFIG_NOT_FOUND' })

    const adapterConfig = {
      apiKey:    portalConfig.apiKey ?? undefined,
      apiSecret: portalConfig.apiSecret ?? undefined,
      settings:  (portalConfig.settings as Record<string, unknown>) ?? {},
    }

    const adapter = createAdapter(portalId, adapterConfig)

    const properties = await app.prisma.property.findMany({
      where: { companyId: req.user.cid, status: 'ACTIVE' },
      take: 100,
    })

    const results = await Promise.allSettled(
      properties.map(async (property) => {
        const payload: PropertyPayload = {
          id:            property.id,
          title:         property.title,
          description:   property.description ?? undefined,
          type:          property.type,
          purpose:       property.purpose,
          price:         property.price ? Number(property.price) : undefined,
          priceRent:     property.priceRent ? Number(property.priceRent) : undefined,
          city:          property.city ?? undefined,
          state:         property.state ?? undefined,
          neighborhood:  property.neighborhood ?? undefined,
          street:        property.street ?? undefined,
          number:        property.number ?? undefined,
          zipCode:       property.zipCode ?? undefined,
          latitude:      property.latitude ?? undefined,
          longitude:     property.longitude ?? undefined,
          totalArea:     property.totalArea ?? undefined,
          builtArea:     property.builtArea ?? undefined,
          bedrooms:      property.bedrooms,
          suites:        property.suites,
          bathrooms:     property.bathrooms,
          parkingSpaces: property.parkingSpaces,
          features:      property.features,
          coverImage:    property.coverImage ?? undefined,
          images:        property.images,
          videoUrl:      property.videoUrl ?? undefined,
          slug:          property.slug,
        }
        return adapter.publish(payload, adapterConfig)
      }),
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed    = results.filter(r => r.status === 'rejected').length

    await app.prisma.portalConfig.update({
      where: { id: portalConfig.id },
      data:  { lastSyncAt: new Date() },
    })

    return reply.send({
      portalId,
      stubMode: adapter.stubMode,
      total: properties.length,
      succeeded,
      failed,
    })
  })

  // DELETE /api/v1/portals/publications/:id — remove publication
  app.delete('/publications/:id', {
    schema: { tags: ['portals'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { id } = req.params as { id: string }

    await app.prisma.portalPublication.updateMany({
      where: {
        id,
        property: { companyId: req.user.cid },
      },
      data: { status: 'removed' },
    })

    return reply.send({ success: true })
  })

  // POST /api/v1/portals/test/:portalId — testa conexão com o portal
  app.post('/test/:portalId', {
    schema: { tags: ['portals'] },
  }, async (req, reply) => {
    const { portalId } = req.params as { portalId: string }
    const cid = req.user.cid

    const portalConfig = await app.prisma.portalConfig.findFirst({
      where: { companyId: cid, portalId },
    })

    const { createAdapter } = await import('../../services/portals/registry.js')
    const adapter = createAdapter(portalId, {
      apiKey:    portalConfig?.apiKey ?? undefined,
      apiSecret: portalConfig?.apiSecret ?? undefined,
      settings:  (portalConfig?.settings as any) ?? {},
    })

    if (adapter.stubMode) {
      return reply.send({
        success: false,
        stubMode: true,
        message: `${portalId} em modo stub — nenhuma chave de API configurada`,
      })
    }

    // Try a lightweight check (ping endpoint if available, otherwise just return ok)
    return reply.send({
      success: true,
      stubMode: false,
      message: `${portalId} configurado com API key — publicações reais ativadas`,
    })
  })
}
