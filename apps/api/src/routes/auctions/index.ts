import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

// ── Schemas de validação ────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  city: z.string().optional(),
  state: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minDiscount: z.coerce.number().optional(),
  minScore: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['auctionDate', 'minimumBid', 'discountPercent', 'opportunityScore', 'createdAt']).default('auctionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

const calculateSchema = z.object({
  bidValue: z.number().positive(),
  appraisalValue: z.number().positive().optional(),
  city: z.string().optional(),
  state: z.string().default('SP'),
  propertyType: z.string().optional(),
  totalArea: z.number().optional(),
  needsReform: z.boolean().default(false),
  reformEstimate: z.number().default(0),
  isOccupied: z.boolean().default(false),
  financingMonths: z.number().default(0),
  monthlyRentEstimate: z.number().optional(),
})

const alertSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  propertyType: z.string().optional(),
  minDiscount: z.number().optional(),
  maxPrice: z.number().optional(),
  minScore: z.number().optional(),
  source: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  frequency: z.enum(['INSTANT', 'DAILY', 'WEEKLY']).default('DAILY'),
})

// ── Calculadora financeira de leilão ─────────────────────────────────────────

function calculateAuctionFinancials(data: z.infer<typeof calculateSchema>) {
  const { bidValue, appraisalValue, state, needsReform, reformEstimate, isOccupied, totalArea, monthlyRentEstimate } = data

  // ITBI — varia por município (média SP: 3%)
  const itbiRate = state === 'SP' ? 0.03 : 0.025
  const itbi = bidValue * itbiRate

  // Registro + escritura (média: 1-2% do valor)
  const registryRate = 0.015
  const registry = bidValue * registryRate

  // Honorários advocatícios (5-10% do lance)
  const lawyerRate = 0.05
  const lawyer = bidValue * lawyerRate

  // Custos de desocupação (se ocupado)
  const evictionCost = isOccupied ? Math.max(bidValue * 0.02, 5000) : 0

  // Reforma estimada
  const reformCost = needsReform ? reformEstimate || (totalArea ? totalArea * 500 : bidValue * 0.1) : 0

  // Custos totais
  const totalCosts = itbi + registry + lawyer + evictionCost + reformCost
  const totalInvestment = bidValue + totalCosts

  // Valor de mercado estimado (avaliação ou multiplicador)
  const marketValue = appraisalValue || bidValue * 1.5

  // Desconto sobre avaliação
  const discount = appraisalValue ? ((appraisalValue - bidValue) / appraisalValue * 100) : 0

  // Lucro potencial na revenda
  const potentialProfit = marketValue - totalInvestment
  const roiPercent = (potentialProfit / totalInvestment) * 100

  // Payback via aluguel
  const monthlyRent = monthlyRentEstimate || (marketValue * 0.005) // 0.5% ao mês
  const paybackMonths = monthlyRent > 0 ? Math.ceil(totalInvestment / monthlyRent) : null

  // Score de oportunidade (0-100)
  let score = 50
  if (discount > 50) score += 20
  else if (discount > 30) score += 15
  else if (discount > 20) score += 10
  else if (discount > 10) score += 5

  if (roiPercent > 50) score += 15
  else if (roiPercent > 30) score += 10
  else if (roiPercent > 15) score += 5

  if (!isOccupied) score += 10
  if (!needsReform) score += 5

  score = Math.min(100, Math.max(0, score))

  // Risco
  let riskLevel = 'MEDIUM'
  if (isOccupied && needsReform) riskLevel = 'HIGH'
  else if (!isOccupied && !needsReform && discount > 30) riskLevel = 'LOW'

  return {
    // Valores de entrada
    bidValue,
    appraisalValue: appraisalValue || null,
    marketValueEstimate: Number(marketValue.toFixed(2)),

    // Custos detalhados
    costs: {
      itbi: Number(itbi.toFixed(2)),
      itbiRate: `${(itbiRate * 100).toFixed(1)}%`,
      registry: Number(registry.toFixed(2)),
      lawyer: Number(lawyer.toFixed(2)),
      eviction: Number(evictionCost.toFixed(2)),
      reform: Number(reformCost.toFixed(2)),
      totalCosts: Number(totalCosts.toFixed(2)),
    },

    // Investimento total
    totalInvestment: Number(totalInvestment.toFixed(2)),

    // Retorno
    discount: Number(discount.toFixed(1)),
    potentialProfit: Number(potentialProfit.toFixed(2)),
    roiPercent: Number(roiPercent.toFixed(1)),
    monthlyRentEstimate: Number(monthlyRent.toFixed(2)),
    paybackMonths,

    // Score
    opportunityScore: score,
    riskLevel,

    // Lance máximo recomendado (para ROI mínimo de 20%)
    maxRecommendedBid: appraisalValue
      ? Number((appraisalValue * 0.7 - totalCosts * 0.7).toFixed(2))
      : Number((bidValue * 1.2).toFixed(2)),
  }
}

// ── Plugin de rotas ──────────────────────────────────────────────────────────

export default async function auctionsRoutes(app: FastifyInstance) {

  // ── GET /auctions — Listagem pública com filtros ───────────────────────────
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = listQuerySchema.safeParse(req.query)
    if (!result.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
    }
    const q = result.data
    const skip = (q.page - 1) * q.limit

    const where: any = {}
    if (q.city) where.city = { contains: q.city, mode: 'insensitive' }
    if (q.state) where.state = q.state.toUpperCase()
    if (q.source) where.source = q.source
    if (q.status) where.status = q.status
    if (q.propertyType) where.propertyType = q.propertyType
    if (q.bedrooms) where.bedrooms = { gte: q.bedrooms }
    if (q.minPrice || q.maxPrice) {
      where.minimumBid = {}
      if (q.minPrice) where.minimumBid.gte = q.minPrice
      if (q.maxPrice) where.minimumBid.lte = q.maxPrice
    }
    if (q.minDiscount) where.discountPercent = { gte: q.minDiscount }
    if (q.minScore) where.opportunityScore = { gte: q.minScore }
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { city: { contains: q.search, mode: 'insensitive' } },
        { neighborhood: { contains: q.search, mode: 'insensitive' } },
        { auctioneerName: { contains: q.search, mode: 'insensitive' } },
      ]
    }

    // Excluir cancelados/encerrados por padrão
    if (!q.status) {
      where.status = { notIn: ['CANCELLED', 'CLOSED'] }
    }

    const [auctions, total] = await Promise.all([
      app.prisma.auction.findMany({
        where,
        skip,
        take: q.limit,
        orderBy: { [q.sortBy]: q.sortOrder },
        select: {
          id: true,
          title: true,
          slug: true,
          source: true,
          status: true,
          modality: true,
          propertyType: true,
          category: true,
          city: true,
          state: true,
          neighborhood: true,
          totalArea: true,
          bedrooms: true,
          bathrooms: true,
          parkingSpaces: true,
          appraisalValue: true,
          minimumBid: true,
          firstRoundBid: true,
          secondRoundBid: true,
          discountPercent: true,
          firstRoundDate: true,
          secondRoundDate: true,
          auctionDate: true,
          coverImage: true,
          opportunityScore: true,
          estimatedROI: true,
          occupation: true,
          bankName: true,
          auctioneerName: true,
          financingAvailable: true,
          fgtsAllowed: true,
          views: true,
          favorites: true,
          createdAt: true,
        },
      }),
      app.prisma.auction.count({ where }),
    ])

    return reply.send({
      data: auctions,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    })
  })

  // ── GET /auctions/stats — Estatísticas gerais ──────────────────────────────
  app.get('/stats', async (_req: FastifyRequest, reply: FastifyReply) => {
    const [total, bySource, byStatus, avgDiscount, topCities] = await Promise.all([
      app.prisma.auction.count({
        where: { status: { notIn: ['CANCELLED', 'CLOSED'] } },
      }),
      app.prisma.auction.groupBy({
        by: ['source'],
        _count: { id: true },
        where: { status: { notIn: ['CANCELLED', 'CLOSED'] } },
      }),
      app.prisma.auction.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      app.prisma.auction.aggregate({
        _avg: { discountPercent: true },
        where: { discountPercent: { not: null }, status: { notIn: ['CANCELLED', 'CLOSED'] } },
      }),
      app.prisma.auction.groupBy({
        by: ['city', 'state'],
        _count: { id: true },
        where: { status: { notIn: ['CANCELLED', 'CLOSED'] } },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
    ])

    return reply.send({
      total,
      bySource: bySource.map(s => ({ source: s.source, count: s._count.id })),
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      averageDiscount: avgDiscount._avg.discountPercent
        ? Number(avgDiscount._avg.discountPercent.toFixed(1))
        : 0,
      topCities: topCities.map(c => ({ city: c.city, state: c.state, count: c._count.id })),
    })
  })

  // ── GET /auctions/:slug — Detalhe do leilão ───────────────────────────────
  app.get('/:slug', async (req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    const { slug } = req.params

    const auction = await app.prisma.auction.findUnique({
      where: { slug },
      include: {
        bids: { orderBy: { bidDate: 'desc' }, take: 10 },
        analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (!auction) {
      return reply.status(404).send({ error: 'Leilão não encontrado' })
    }

    // Incrementar views
    await app.prisma.auction.update({
      where: { id: auction.id },
      data: { views: { increment: 1 } },
    }).catch(() => {})

    return reply.send(auction)
  })

  // ── POST /auctions/calculate — Calculadora financeira ──────────────────────
  app.post('/calculate', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = calculateSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
    }

    const analysis = calculateAuctionFinancials(result.data)
    return reply.send(analysis)
  })

  // ── GET /auctions/:id/analysis — Análise completa com IA ──────────────────
  app.get('/:id/analysis', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = req.params

    const auction = await app.prisma.auction.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    })

    if (!auction) {
      return reply.status(404).send({ error: 'Leilão não encontrado' })
    }

    // Calcular análise financeira
    const analysis = calculateAuctionFinancials({
      bidValue: Number(auction.minimumBid || 0),
      appraisalValue: auction.appraisalValue ? Number(auction.appraisalValue) : undefined,
      city: auction.city || undefined,
      state: auction.state || 'SP',
      propertyType: auction.propertyType || undefined,
      totalArea: auction.totalArea || undefined,
      needsReform: false,
      reformEstimate: 0,
      isOccupied: auction.occupation === 'OCUPADO',
      financingMonths: 0,
    })

    // Buscar imóveis similares no marketplace para comparação
    const similarProperties = await app.prisma.property.findMany({
      where: {
        city: auction.city ? { equals: auction.city, mode: 'insensitive' } : undefined,
        type: auction.propertyType as any,
        status: 'ACTIVE' as const,
        price: { not: null },
      },
      select: {
        id: true,
        title: true,
        price: true,
        totalArea: true,
        neighborhood: true,
        bedrooms: true,
      },
      take: 5,
      orderBy: { price: 'asc' },
    })

    // Preço médio do m² na região
    const avgPriceM2 = similarProperties.length > 0
      ? similarProperties.reduce((acc, p) => {
          if (p.price && p.totalArea && p.totalArea > 0) {
            return acc + Number(p.price) / p.totalArea
          }
          return acc
        }, 0) / similarProperties.filter(p => p.price && p.totalArea).length
      : null

    return reply.send({
      auction: {
        id: auction.id,
        title: auction.title,
        city: auction.city,
        state: auction.state,
        appraisalValue: auction.appraisalValue,
        minimumBid: auction.minimumBid,
        totalArea: auction.totalArea,
      },
      financialAnalysis: analysis,
      marketComparison: {
        similarProperties,
        averagePricePerM2: avgPriceM2 ? Number(avgPriceM2.toFixed(2)) : null,
        auctionPricePerM2: auction.minimumBid && auction.totalArea
          ? Number((Number(auction.minimumBid) / auction.totalArea).toFixed(2))
          : null,
      },
    })
  })

  // ── POST /auctions/alerts — Criar alerta de leilão ────────────────────────
  app.post('/alerts', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = alertSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
    }

    const data = result.data
    if (!data.email && !data.phone) {
      return reply.status(400).send({ error: 'Email ou telefone é obrigatório' })
    }

    const alert = await app.prisma.auctionAlert.create({
      data: {
        email: data.email,
        phone: data.phone,
        city: data.city,
        state: data.state,
        propertyType: data.propertyType,
        minDiscount: data.minDiscount,
        maxPrice: data.maxPrice,
        minScore: data.minScore,
        source: data.source,
        keywords: data.keywords,
        frequency: data.frequency,
      },
    })

    return reply.status(201).send({
      id: alert.id,
      message: 'Alerta criado com sucesso! Você receberá notificações de novos leilões.',
      token: alert.token,
    })
  })

  // ── DELETE /auctions/alerts/:token — Cancelar alerta ──────────────────────
  app.delete('/alerts/:token', async (req: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) => {
    const { token } = req.params

    await app.prisma.auctionAlert.updateMany({
      where: { token },
      data: { active: false },
    })

    return reply.send({ message: 'Alerta cancelado com sucesso.' })
  })

  // ── GET /auctions/map — Dados para mapa interativo ────────────────────────
  app.get('/map', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = listQuerySchema.safeParse(req.query)
    const q = result.success ? result.data : { city: undefined, state: undefined, source: undefined, minPrice: undefined, maxPrice: undefined, minDiscount: undefined, propertyType: undefined, status: undefined, minScore: undefined, search: undefined, bedrooms: undefined, page: 1, limit: 1000, sortBy: 'auctionDate' as const, sortOrder: 'asc' as const }

    const where: any = {
      latitude: { not: null },
      longitude: { not: null },
      status: { notIn: ['CANCELLED', 'CLOSED'] },
    }
    if (q.city) where.city = { contains: q.city, mode: 'insensitive' }
    if (q.state) where.state = q.state.toUpperCase()
    if (q.source) where.source = q.source
    if (q.propertyType) where.propertyType = q.propertyType

    const auctions = await app.prisma.auction.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        latitude: true,
        longitude: true,
        minimumBid: true,
        appraisalValue: true,
        discountPercent: true,
        opportunityScore: true,
        propertyType: true,
        source: true,
        status: true,
        auctionDate: true,
        coverImage: true,
        city: true,
        neighborhood: true,
      },
      take: 2000,
    })

    return reply.send({ data: auctions, total: auctions.length })
  })

  // ── GET /auctions/sources — Lista de fontes ativas ────────────────────────
  app.get('/sources', async (_req: FastifyRequest, reply: FastifyReply) => {
    const sources = await app.prisma.scraperRun.groupBy({
      by: ['source'],
      _max: { finishedAt: true },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    return reply.send({
      sources: sources.map(s => ({
        source: s.source,
        lastUpdate: s._max.finishedAt,
        totalRuns: s._count.id,
      })),
    })
  })

  // ── GET /auctions/scraper-status — Status dos scrapers ────────────────────
  app.get('/scraper-status', async (_req: FastifyRequest, reply: FastifyReply) => {
    const runs = await app.prisma.scraperRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        source: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        itemsFound: true,
        itemsCreated: true,
        itemsUpdated: true,
        errorMessage: true,
      },
    })

    return reply.send({ runs })
  })

  // ── GET /auctions/analytics — Dashboard analytics completo ────────────
  app.get('/analytics', async (_req: FastifyRequest, reply: FastifyReply) => {
    const [
      totalBySource,
      scoreByCity,
      recentRuns,
      totalActive,
      totalValue,
      topOpportunities,
    ] = await Promise.all([
      // 1. Total por fonte
      app.prisma.auction.groupBy({
        by: ['source'],
        _count: { id: true },
        _avg: { discountPercent: true, opportunityScore: true },
        where: { status: { notIn: ['CANCELLED', 'CLOSED'] } },
        orderBy: { _count: { id: 'desc' } },
      }),

      // 2. Score médio por cidade
      app.prisma.auction.groupBy({
        by: ['city', 'state'],
        _avg: { opportunityScore: true, discountPercent: true },
        _count: { id: true },
        _min: { minimumBid: true },
        where: {
          city: { not: null },
          status: { notIn: ['CANCELLED', 'CLOSED'] },
        },
        orderBy: { _count: { id: 'desc' } },
        take: 30,
      }),

      // 3. Últimos scraper runs (para detectar bloqueios)
      app.prisma.scraperRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 30,
        select: {
          id: true,
          source: true,
          sourceUrl: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          itemsFound: true,
          itemsCreated: true,
          itemsUpdated: true,
          itemsRemoved: true,
          errorMessage: true,
        },
      }),

      // 4. Total de leilões ativos
      app.prisma.auction.count({
        where: { status: { notIn: ['CANCELLED', 'CLOSED', 'SOLD'] } },
      }),

      // 5. Valor total em leilões
      app.prisma.auction.aggregate({
        _sum: { minimumBid: true, appraisalValue: true },
        _avg: { minimumBid: true, discountPercent: true },
        where: { status: { notIn: ['CANCELLED', 'CLOSED'] } },
      }),

      // 6. Top oportunidades (maior score)
      app.prisma.auction.findMany({
        where: {
          opportunityScore: { gte: 70 },
          status: { notIn: ['CANCELLED', 'CLOSED', 'SOLD'] },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          city: true,
          state: true,
          source: true,
          minimumBid: true,
          appraisalValue: true,
          discountPercent: true,
          opportunityScore: true,
          occupation: true,
        },
        orderBy: { opportunityScore: 'desc' },
        take: 10,
      }),
    ])

    // Detectar possíveis bloqueios de IP
    const blockedSources = recentRuns
      .filter(r => r.status === 'FAILED' && r.itemsFound === 0)
      .map(r => ({
        source: r.source,
        url: r.sourceUrl,
        error: r.errorMessage?.substring(0, 200),
        at: r.startedAt,
      }))

    return reply.send({
      summary: {
        totalActive,
        totalValueMinBid: totalValue._sum.minimumBid ? Number(totalValue._sum.minimumBid) : 0,
        totalValueAppraisal: totalValue._sum.appraisalValue ? Number(totalValue._sum.appraisalValue) : 0,
        avgMinBid: totalValue._avg.minimumBid ? Number(totalValue._avg.minimumBid) : 0,
        avgDiscount: totalValue._avg.discountPercent ? Number(totalValue._avg.discountPercent) : 0,
      },
      bySource: totalBySource.map(s => ({
        source: s.source,
        count: s._count.id,
        avgDiscount: s._avg.discountPercent ? Number(Number(s._avg.discountPercent).toFixed(1)) : 0,
        avgScore: s._avg.opportunityScore ? Number(Number(s._avg.opportunityScore).toFixed(0)) : 0,
      })),
      byCity: scoreByCity.map(c => ({
        city: c.city,
        state: c.state,
        count: c._count.id,
        avgScore: c._avg.opportunityScore ? Number(Number(c._avg.opportunityScore).toFixed(0)) : 0,
        avgDiscount: c._avg.discountPercent ? Number(Number(c._avg.discountPercent).toFixed(1)) : 0,
        cheapest: c._min.minimumBid ? Number(c._min.minimumBid) : 0,
      })),
      scraperRuns: recentRuns,
      blockedSources,
      topOpportunities,
    })
  })
}
