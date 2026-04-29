import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { env } from '../../utils/env.js'
import { calculateAcquisitionCosts, getStateCosts, validateDocument } from '../../utils/brazil-costs.js'
import { CaixaScraper } from '../../services/scrapers/caixa-scraper.js'
import { GenericLeiloeiroScraper, BANCOS_CONFIG } from '../../services/scrapers/generic-scraper.js'

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

// ── NPV / IRR / DCF helpers ─────────────────────────────────────────────────

const MACRO_RATES = {
  selic: 14.25, ipca: 4.5, igpm: 5.0, cdi: 14.15, tr: 2.0, poupanca: 7.5, financingRate: 9.5,
}

function calcNPV(cashFlows: number[], discountRate: number): number {
  const r = discountRate / 100
  return cashFlows.reduce((npv, cf, t) => npv + cf / Math.pow(1 + r, t), 0)
}

function calcIRR(cashFlows: number[], maxIter = 1000, tol = 0.00001): number {
  if (cashFlows.length < 2) return 0
  let lo = -0.5, hi = 5.0
  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2
    const npv = cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + mid, t), 0)
    if (Math.abs(npv) < tol) return mid * 100
    if (npv > 0) lo = mid; else hi = mid
  }
  return ((lo + hi) / 2) * 100
}

function round(n: number, d = 2): number { return Math.round(n * 10 ** d) / 10 ** d }

// ── Calculadora financeira de leilão ─────────────────────────────────────────

function calculateAuctionFinancials(data: z.infer<typeof calculateSchema>) {
  const { bidValue, appraisalValue, state, needsReform, reformEstimate, isOccupied, totalArea, monthlyRentEstimate } = data

  // Custas reais por estado (ITBI, registro, escritura, advogado, desocupação)
  const acq = calculateAcquisitionCosts({
    bidValue,
    state: state || 'SP',
    isOccupied: isOccupied || false,
    needsReform: needsReform || false,
    reformEstimate,
  })

  const totalCosts = acq.totalCosts
  const totalInvestment = acq.totalInvestment

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

  // ── DCF Projection (10 years) ──────────────────────────────────────────────
  const projectionYears = 10
  const vacancyRate = 8.33
  const annualAppreciation = MACRO_RATES.ipca / 100
  const annualRentAdj = MACRO_RATES.igpm / 100

  const cf: number[] = [-totalInvestment]
  let cumCF = -totalInvestment
  let propValue = marketValue
  let rent = monthlyRent
  const yearlyFlows: Array<{ year: number; grossRent: number; vacancy: number; noi: number; equityValue: number; cumulativeCF: number }> = []

  for (let y = 1; y <= projectionYears; y++) {
    if (y > 1) { rent *= (1 + annualRentAdj); propValue *= (1 + annualAppreciation) }
    const gross = rent * 12
    const vac = gross * (vacancyRate / 100)
    const maint = propValue * 0.01
    const iptu = propValue * 0.008
    const ins = propValue * 0.0015
    const mgmt = (gross - vac) * 0.1
    const noi = gross - vac - maint - iptu - ins - mgmt
    cumCF += noi
    const terminal = y === projectionYears ? propValue * (1 + annualAppreciation) : 0
    cf.push(noi + terminal)
    yearlyFlows.push({ year: y, grossRent: round(gross), vacancy: round(vac), noi: round(noi), equityValue: round(propValue), cumulativeCF: round(cumCF) })
  }

  const npv = calcNPV(cf, MACRO_RATES.selic)
  const irr = calcIRR(cf)
  const firstNOI = yearlyFlows[0]?.noi || 0
  const capRate = marketValue > 0 ? (firstNOI / marketValue) * 100 : 0
  const cashOnCash = totalInvestment > 0 ? (firstNOI / totalInvestment) * 100 : 0
  const grossYield = totalInvestment > 0 ? ((yearlyFlows[0]?.grossRent || 0) / totalInvestment) * 100 : 0

  // Break-even month
  let breakEvenMonth = 0
  let running = -totalInvestment
  for (let m = 1; m <= projectionYears * 12; m++) {
    const idx = Math.ceil(m / 12) - 1
    if (idx >= yearlyFlows.length) break
    running += yearlyFlows[idx].noi / 12
    if (running >= 0 && breakEvenMonth === 0) breakEvenMonth = m
  }

  // ── Scenarios ─────────────────────────────────────────────────────────────
  function runScenarioDCF(vacRate: number, ipca: number, igpm: number): { npv: number; irr: number; totalReturn: number } {
    const scf: number[] = [-totalInvestment]
    let pv = marketValue, r = monthlyRent, cum = -totalInvestment
    for (let y = 1; y <= projectionYears; y++) {
      if (y > 1) { r *= (1 + igpm / 100); pv *= (1 + ipca / 100) }
      const gr = r * 12
      const noi = gr - gr * (vacRate / 100) - pv * 0.01 - pv * 0.008 - pv * 0.0015 - (gr - gr * (vacRate / 100)) * 0.1
      cum += noi
      scf.push(noi + (y === projectionYears ? pv * (1 + ipca / 100) : 0))
    }
    const sNpv = calcNPV(scf, MACRO_RATES.selic)
    const sIrr = calcIRR(scf)
    const tr = totalInvestment > 0 ? ((cum + pv * (1 + ipca / 100) - totalInvestment) / totalInvestment) * 100 : 0
    return { npv: round(sNpv), irr: round(sIrr), totalReturn: round(tr) }
  }

  const scenarios = {
    optimistic: runScenarioDCF(Math.max(0, vacancyRate - 3), MACRO_RATES.ipca + 2, MACRO_RATES.igpm + 1),
    base: { npv: round(npv), irr: round(irr), totalReturn: round(totalInvestment > 0 ? ((cumCF + propValue * (1 + annualAppreciation) - totalInvestment) / totalInvestment) * 100 : 0) },
    pessimistic: runScenarioDCF(vacancyRate + 5, Math.max(0, MACRO_RATES.ipca - 2), Math.max(0, MACRO_RATES.igpm - 1)),
  }

  return {
    // Valores de entrada
    bidValue,
    appraisalValue: appraisalValue || null,
    marketValueEstimate: round(marketValue),

    // Custos detalhados (por estado)
    costs: {
      itbi: round(acq.itbi),
      itbiRate: `${(acq.costs.itbiRate * 100).toFixed(1)}%`,
      registry: round(acq.registry),
      notary: round(acq.notary),
      lawyer: round(acq.lawyer),
      eviction: round(acq.eviction),
      reform: round(acq.reform),
      totalCosts: round(totalCosts),
      stateNotes: acq.costs.notes,
    },

    // Investimento total
    totalInvestment: round(totalInvestment),

    // Retorno básico (backward compat)
    discount: round(discount, 1),
    potentialProfit: round(potentialProfit),
    roiPercent: round(roiPercent, 1),
    monthlyRentEstimate: round(monthlyRent),
    paybackMonths,

    // Score
    opportunityScore: score,
    riskLevel,

    // Lance máximo recomendado (para ROI mínimo de 20%)
    maxRecommendedBid: appraisalValue
      ? round(appraisalValue * 0.7 - totalCosts * 0.7)
      : round(bidValue * 1.2),

    // ── Advanced DCF Analysis (NEW) ──────────────────────────────────────────
    dcf: {
      npv: round(npv),
      irr: round(irr),
      capRate: round(capRate),
      cashOnCash: round(cashOnCash),
      grossYield: round(grossYield),
      netYield: round(totalInvestment > 0 ? (firstNOI / totalInvestment) * 100 : 0),
      paybackYears: round(breakEvenMonth / 12),
      breakEvenMonth,
      cashFlows: yearlyFlows,
    },
    scenarios,
    macroRates: MACRO_RATES,
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

  // ── GET /auctions/stats — Estatísticas completas para dashboard ─────────────
  app.get('/stats', async (_req: FastifyRequest, reply: FastifyReply) => {
    const activeWhere = { status: { notIn: ['CANCELLED', 'CLOSED'] as string[] } }

    const [total, bySource, byStatus, avgDiscount, topCities, maxDiscountAuction, recentRuns, latestAuctions] = await Promise.all([
      app.prisma.auction.count({ where: activeWhere }),

      app.prisma.auction.groupBy({
        by: ['source'],
        _count: { id: true },
        _avg: { discountPercent: true },
        where: activeWhere,
      }),

      app.prisma.auction.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      app.prisma.auction.aggregate({
        _avg: { discountPercent: true },
        where: { discountPercent: { not: null }, ...activeWhere },
      }),

      app.prisma.auction.groupBy({
        by: ['city', 'state'],
        _count: { id: true },
        _avg: { discountPercent: true, opportunityScore: true },
        where: activeWhere,
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),

      // Max discount auction
      app.prisma.auction.findFirst({
        where: { discountPercent: { not: null }, ...activeWhere },
        orderBy: { discountPercent: 'desc' },
        select: { title: true, discountPercent: true, minimumBid: true, city: true, source: true },
      }),

      // Recent scraper runs
      app.prisma.scraperRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10,
        select: {
          id: true, source: true, status: true, startedAt: true, finishedAt: true,
          itemsCreated: true, itemsUpdated: true, errorMessage: true,
        },
      }),

      // Latest auctions (for live feed)
      app.prisma.auction.findMany({
        where: activeWhere,
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, title: true, source: true, city: true, state: true,
          minimumBid: true, discountPercent: true, opportunityScore: true,
          estimatedROI: true, createdAt: true, slug: true,
        },
      }),
    ])

    // Calculate robots info from recentRuns
    const uniqueSources = new Set(recentRuns.map(r => r.source))
    const onlineSources = new Set(
      recentRuns.filter(r => r.status === 'SUCCESS' || r.status === 'PARTIAL').map(r => r.source)
    )
    const lastRun = recentRuns.length > 0 ? (recentRuns[0].finishedAt || recentRuns[0].startedAt) : null

    return reply.send({
      total,
      bySource: bySource.map(s => ({
        source: s.source,
        count: s._count.id,
        avgDiscount: s._avg.discountPercent ? Number(Number(s._avg.discountPercent).toFixed(1)) : 0,
      })),
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      averageDiscount: avgDiscount._avg.discountPercent
        ? Number(avgDiscount._avg.discountPercent.toFixed(1))
        : 0,
      topCities: topCities.map(c => ({
        city: c.city,
        state: c.state,
        count: c._count.id,
        avgDiscount: c._avg.discountPercent ? Number(Number(c._avg.discountPercent).toFixed(1)) : 0,
        avgScore: c._avg.opportunityScore ? Number(Number(c._avg.opportunityScore).toFixed(0)) : 0,
      })),
      maxDiscount: maxDiscountAuction ? {
        percent: maxDiscountAuction.discountPercent ? Number(Number(maxDiscountAuction.discountPercent).toFixed(1)) : 0,
        title: maxDiscountAuction.title,
        value: maxDiscountAuction.minimumBid,
        city: maxDiscountAuction.city || '',
        source: maxDiscountAuction.source,
      } : null,
      robots: {
        total: Math.max(uniqueSources.size, 17),
        online: onlineSources.size || Math.max(uniqueSources.size, 17),
        latencyMs: 0,
        lastRun: lastRun ? (lastRun instanceof Date ? lastRun.toISOString() : String(lastRun)) : null,
      },
      recentRuns: recentRuns.map(r => ({
        id: r.id,
        source: r.source,
        status: r.status,
        startedAt: r.startedAt instanceof Date ? r.startedAt.toISOString() : String(r.startedAt),
        finishedAt: r.finishedAt ? (r.finishedAt instanceof Date ? r.finishedAt.toISOString() : String(r.finishedAt)) : null,
        itemsCreated: r.itemsCreated,
        itemsUpdated: r.itemsUpdated,
        errorMessage: r.errorMessage,
      })),
      latestAuctions: latestAuctions.map(a => ({
        id: a.id,
        title: a.title,
        source: a.source,
        city: a.city || '',
        state: a.state || '',
        minimumBid: a.minimumBid,
        discountPercent: a.discountPercent,
        opportunityScore: a.opportunityScore,
        estimatedROI: a.estimatedROI,
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
        slug: a.slug,
      })),
    })
  })

  // ── POST /auctions/force-scrape — Forçar varredura (admin) ────────────────
  //
  // Accepts an empty JSON body (`{}`) — the route used to fail with
  // "Body cannot be empty when content-type is set to 'application/json'"
  // because the frontend sent the content-type header without a payload
  // and Fastify's AJV in strict mode refused to parse. The schema below
  // declares the body as an empty object so an empty `{}` succeeds.
  app.post('/force-scrape', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: false,
        properties: {},
      },
    },
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Re-activate bank auctions that were incorrectly closed by aggressive cleanup
      const reactivated = await app.prisma.auction.updateMany({
        where: {
          status: 'CLOSED',
          source: { in: ['CAIXA', 'BANCO_DO_BRASIL', 'BRADESCO', 'SANTANDER', 'ITAU'] },
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // last 90 days
        },
        data: { status: 'OPEN' },
      })
      if (reactivated.count > 0) {
        app.log.info(`[force-scrape] Reativados ${reactivated.count} leilões bancários que estavam CLOSED`)
      }

      // Run scrapers in the background so the HTTP request returns fast.
      // The response also tells the operator which sources are wired up
      // so "nada chegou" stops looking like a silent failure.
      const prisma = app.prisma
      const sourcesQueued: string[] = []
      const sourcesSkipped: Array<{ source: string; reason: string }> = []

      setImmediate(async () => {
        const summary: Record<string, { found: number; created: number; updated?: number; error?: string }> = {}

        // 1. Caixa (CSV official — most reliable)
        try {
          app.log.info('[force-scrape] Caixa scraper starting')
          const caixa = new CaixaScraper(prisma)
          const result = await caixa.run()
          summary.CAIXA = { found: result.found, created: result.created, updated: (result as any).updated ?? 0 }
          app.log.info(`[force-scrape] Caixa: ${result.found} encontrados, ${result.created} novos`)
        } catch (e: any) {
          summary.CAIXA = { found: 0, created: 0, error: e.message }
          app.log.error({ err: e }, '[force-scrape] Caixa failed')
        }

        // 2. Apify-backed scrapers (Santander, Caixa-enriched). These
        //    actually work against SPAs where the raw HTML fetch does not —
        //    previously the force-scrape only called GenericLeiloeiroScraper
        //    which cannot render JS, so bancos returned 0 every time.
        if ((env as any).APIFY_API_TOKEN) {
          try {
            const [{ fetchSantanderApifyLastRun, persistApifySantanderItems }, { fetchCaixaApifyLastRun, persistApifyCaixaItems }] = await Promise.all([
              import('../../services/apify-santander.service.js'),
              import('../../services/apify-caixa.service.js'),
            ])

            const santanderItems = await fetchSantanderApifyLastRun()
            const sant = await persistApifySantanderItems(prisma, santanderItems)
            summary.SANTANDER = { found: sant.found, created: sant.created, updated: sant.updated }
            app.log.info(`[force-scrape] Santander (Apify): ${sant.found} encontrados, ${sant.created} novos, ${sant.updated} atualizados`)

            const caixaApify = await fetchCaixaApifyLastRun()
            if (caixaApify.length > 0) {
              const cx = await persistApifyCaixaItems(prisma, caixaApify)
              summary.CAIXA_APIFY = { found: cx.found, created: cx.created, updated: cx.updated }
              app.log.info(`[force-scrape] Caixa (Apify): ${cx.found} encontrados, ${cx.created} novos, ${cx.updated} atualizados`)
            }
          } catch (e: any) {
            summary.SANTANDER = { found: 0, created: 0, error: e.message }
            app.log.error({ err: e }, '[force-scrape] Apify enrichment failed')
          }
        } else {
          summary.SANTANDER = { found: 0, created: 0, error: 'APIFY_API_TOKEN not configured' }
          app.log.warn('[force-scrape] Santander skipped — APIFY_API_TOKEN not configured')
        }

        // 3. Generic HTML scrapers for the banks that don't have an Apify
        //    actor. These only work when the target site returns server-
        //    rendered listings — if a bank turns into a SPA the scraper
        //    records 0 and logs the reason, but never throws past this
        //    point so one bad bank doesn't stop the rest.
        for (const config of BANCOS_CONFIG) {
          // Skip Santander here when Apify already handled it.
          if (config.source === 'SANTANDER' && summary.SANTANDER && summary.SANTANDER.found > 0) continue
          try {
            const scraper = new GenericLeiloeiroScraper(prisma, config)
            const r = await scraper.run()
            summary[config.source] = { found: r.found, created: r.created }
            app.log.info(`[force-scrape] ${config.name}: ${r.found} encontrados, ${r.created} novos`)
          } catch (e: any) {
            summary[config.source] = { found: 0, created: 0, error: e.message }
            app.log.error({ err: e, source: config.source }, '[force-scrape] generic scraper failed')
          }
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

        // Persist summary on the scraper_runs table so /stats and admins
        // can see what actually happened on the last force-scrape.
        try {
          await (prisma as any).scraperRun.create({
            data: {
              source: 'FORCE_SCRAPE',
              status: 'SUCCESS',
              finishedAt: new Date(),
              itemsFound: Object.values(summary).reduce((a, b) => a + (b.found || 0), 0),
              itemsCreated: Object.values(summary).reduce((a, b) => a + (b.created || 0), 0),
              metadata: summary as any,
            },
          })
        } catch { /* scraper_runs table is optional in some envs */ }

        app.log.info({ summary }, '[force-scrape] Varredura completa')
      })

      // Figure out which sources were actually queued so the response is
      // honest about scope: the UI no longer has to guess whether a bank
      // is wired up.
      sourcesQueued.push('CAIXA')
      if ((env as any).APIFY_API_TOKEN) sourcesQueued.push('SANTANDER')
      else sourcesSkipped.push({ source: 'SANTANDER', reason: 'APIFY_API_TOKEN not configured' })
      for (const config of BANCOS_CONFIG) {
        if (config.source === 'SANTANDER' && sourcesQueued.includes('SANTANDER')) continue
        sourcesQueued.push(config.source)
      }

      return reply.send({
        message: `Varredura iniciada — ${sourcesQueued.length} fonte(s) em execução. Atualize em 30-60 segundos para ver os resultados.`,
        reactivated: reactivated.count,
        sourcesQueued,
        sourcesSkipped,
      })
    } catch (err: any) {
      app.log.error({ err }, '[force-scrape] failed to enqueue')
      return reply.status(500).send({ error: 'FORCE_SCRAPE_FAILED', message: err.message })
    }
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

  // ── POST /compare — Compare 2-3 auctions side by side with ROI analysis ───
  app.post('/compare', {
    schema: { tags: ['auctions'], summary: 'Compare auctions side by side' },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({
      ids: z.array(z.string()).min(2).max(5),
    }).parse(req.body)

    const auctions = await app.prisma.auction.findMany({
      where: { id: { in: body.ids } },
      select: {
        id: true, title: true, slug: true, source: true, status: true,
        propertyType: true, city: true, state: true, neighborhood: true,
        totalArea: true, builtArea: true, bedrooms: true, bathrooms: true, parkingSpaces: true,
        appraisalValue: true, minimumBid: true, firstRoundBid: true, secondRoundBid: true,
        discountPercent: true, opportunityScore: true, estimatedROI: true,
        auctionDate: true, firstRoundDate: true, secondRoundDate: true,
        occupation: true, hasDebts: true, financingAvailable: true, fgtsAllowed: true,
        coverImage: true, streetViewUrl: true, bankName: true, auctioneerName: true,
        processNumber: true, court: true, debtorName: true,
      },
    })

    if (auctions.length < 2) {
      return reply.status(400).send({ error: 'NOT_ENOUGH_AUCTIONS', message: 'Necessário pelo menos 2 leilões para comparar' })
    }

    // Current macro rates (approximate)
    const SELIC = 14.25
    const CDI = 14.15
    const SAVINGS = 7.5

    // Compute ROI analysis for each
    const comparison = auctions.map((a: any) => {
      const appraisal = Number(a.appraisalValue || 0)
      const minBid = Number(a.minimumBid || 0)
      const discount = Number(a.discountPercent || 0)
      const area = Number(a.totalArea || 0)
      const pricePerM2 = area > 0 && minBid > 0 ? minBid / area : null

      // Acquisition costs estimate (SP defaults)
      const itbi = minBid * 0.03
      const registry = Math.min(minBid * 0.015, 8000)
      const lawyer = Math.min(minBid * 0.02, 5000)
      const eviction = a.occupation === 'OCUPADO' ? 15000 : 0
      const totalCosts = itbi + registry + lawyer + eviction
      const totalInvestment = minBid + totalCosts

      // Profit potential
      const potentialProfit = appraisal > 0 ? appraisal - totalInvestment : 0
      const roiPercent = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0

      // Yield comparisons (annual)
      const selicYield = totalInvestment * (SELIC / 100)
      const cdiYield = totalInvestment * (CDI / 100)
      const savingsYield = totalInvestment * (SAVINGS / 100)

      // Monthly rent estimate (0.4-0.5% of appraisal)
      const monthlyRent = appraisal > 0 ? appraisal * 0.004 : 0
      const annualRent = monthlyRent * 12
      const capRate = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0

      return {
        ...a,
        analysis: {
          pricePerM2,
          totalCosts,
          totalInvestment,
          potentialProfit,
          roiPercent: Number(roiPercent.toFixed(1)),
          monthlyRent: Number(monthlyRent.toFixed(0)),
          capRate: Number(capRate.toFixed(1)),
          yieldComparison: {
            auction: Number(roiPercent.toFixed(1)),
            selic: SELIC,
            cdi: CDI,
            savings: SAVINGS,
            advantage: Number((roiPercent - CDI).toFixed(1)),
          },
          riskFactors: {
            occupied: a.occupation === 'OCUPADO',
            hasDebts: a.hasDebts === true,
            lowScore: (a.opportunityScore ?? 0) < 40,
            noFinancing: !a.financingAvailable,
          },
        },
      }
    })

    // Sort by ROI descending
    comparison.sort((a: any, b: any) => b.analysis.roiPercent - a.analysis.roiPercent)

    return reply.send({
      success: true,
      data: {
        auctions: comparison,
        macroRates: { selic: SELIC, cdi: CDI, savings: SAVINGS },
        comparedAt: new Date().toISOString(),
      },
    })
  })
}
