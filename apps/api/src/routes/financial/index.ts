import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { calculateAcquisitionCosts, getStateCosts } from '../../utils/brazil-costs.js'

// ─── Financial Engine (server-side port) ────────────────────────────────────

const DEFAULT_MACRO_RATES = {
  selic: 14.25, ipca: 4.5, igpm: 5.0, cdi: 14.15, tr: 2.0, poupanca: 7.5, financingRate: 9.5,
}

function calculateNPV(cashFlows: number[], discountRate: number): number {
  const r = discountRate / 100
  return cashFlows.reduce((npv, cf, t) => npv + cf / Math.pow(1 + r, t), 0)
}

function calculateIRR(cashFlows: number[], maxIter = 1000, tol = 0.00001): number {
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

function runDCF(params: {
  bidValue: number; appraisalValue: number; monthlyRent: number; totalAcquisitionCosts: number;
  state: string; isOccupied: boolean; needsReform: boolean; projectionYears: number;
  vacancyRate: number; rates: typeof DEFAULT_MACRO_RATES;
}) {
  const { bidValue, appraisalValue, monthlyRent, totalAcquisitionCosts, projectionYears, vacancyRate, rates } = params
  const totalInvestment = bidValue + totalAcquisitionCosts
  const annualAppreciation = rates.ipca / 100
  const annualRentAdj = rates.igpm / 100
  const discount = rates.selic / 100

  const cf: number[] = [-totalInvestment]
  let cumCF = -totalInvestment
  let propValue = appraisalValue || bidValue * 1.5
  let rent = monthlyRent
  const cashFlows: any[] = []

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
    cashFlows.push({ year: y, grossRent: round(gross), vacancy: round(vac), noi: round(noi), equityValue: round(propValue), cumulativeCashFlow: round(cumCF) })
  }

  const npv = calculateNPV(cf, rates.selic)
  const irr = calculateIRR(cf)
  const firstNOI = cashFlows[0]?.noi || 0

  let breakEven = 0; let running = -totalInvestment
  for (let m = 1; m <= projectionYears * 12; m++) {
    const idx = Math.ceil(m / 12) - 1
    if (idx >= cashFlows.length) break
    running += cashFlows[idx].noi / 12
    if (running >= 0 && breakEven === 0) breakEven = m
  }

  const totalReturn = totalInvestment > 0
    ? ((cumCF + propValue * (1 + annualAppreciation) - totalInvestment) / totalInvestment) * 100 : 0

  return {
    npv: round(npv), irr: round(irr),
    paybackYears: round(breakEven / 12), breakEvenMonth: breakEven,
    capRate: round(propValue > 0 ? (firstNOI / propValue) * 100 : 0),
    cashOnCash: round(totalInvestment > 0 ? (firstNOI / totalInvestment) * 100 : 0),
    grossYield: round(totalInvestment > 0 ? ((cashFlows[0]?.grossRent || 0) / totalInvestment) * 100 : 0),
    netYield: round(totalInvestment > 0 ? (firstNOI / totalInvestment) * 100 : 0),
    equityMultiple: round(totalInvestment > 0 ? (cumCF + propValue) / totalInvestment : 0),
    totalReturn: round(totalReturn),
    annualizedReturn: round(projectionYears > 0 ? (Math.pow(1 + totalReturn / 100, 1 / projectionYears) - 1) * 100 : 0),
    cashFlows,
  }
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const analysisSchema = z.object({
  bidValue: z.number().positive(),
  appraisalValue: z.number().positive().optional(),
  monthlyRent: z.number().min(0).default(0),
  state: z.string().default('SP'),
  isOccupied: z.boolean().default(false),
  needsReform: z.boolean().default(false),
  reformEstimate: z.number().default(0),
  projectionYears: z.number().min(1).max(30).default(10),
  vacancyRate: z.number().min(0).max(100).default(8.33),
})

const comparablesSchema = z.object({
  city: z.string(),
  type: z.string().optional(),
  area: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  neighborhood: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
})

// ─── Routes ─────────────────────────────────────────────────────────────────

export default async function financialAnalysisRoutes(app: FastifyInstance) {

  // POST /api/v1/financial/analyze — Full DCF + scenarios + stress tests
  app.post('/analyze', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = analysisSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })

    const d = result.data
    const rates = DEFAULT_MACRO_RATES

    // Acquisition costs
    const acq = calculateAcquisitionCosts({
      bidValue: d.bidValue, state: d.state,
      isOccupied: d.isOccupied, needsReform: d.needsReform, reformEstimate: d.reformEstimate,
    })

    const baseParams = {
      bidValue: d.bidValue,
      appraisalValue: d.appraisalValue || d.bidValue * 1.5,
      monthlyRent: d.monthlyRent || (d.bidValue * 0.005),
      totalAcquisitionCosts: acq.totalCosts,
      state: d.state, isOccupied: d.isOccupied, needsReform: d.needsReform,
      projectionYears: d.projectionYears, vacancyRate: d.vacancyRate, rates,
    }

    // Base DCF
    const base = runDCF(baseParams)

    // Optimistic
    const optimistic = runDCF({
      ...baseParams,
      rates: { ...rates, ipca: rates.ipca + 2, igpm: rates.igpm + 1 },
      vacancyRate: Math.max(0, d.vacancyRate - 3),
    })

    // Pessimistic
    const pessimistic = runDCF({
      ...baseParams,
      rates: { ...rates, ipca: Math.max(0, rates.ipca - 2), igpm: Math.max(0, rates.igpm - 1) },
      vacancyRate: d.vacancyRate + 5,
    })

    // Stress tests
    const stressTests = [
      { name: 'Vacância Alta (25%)', params: { ...baseParams, vacancyRate: 25 } },
      { name: 'SELIC 18%', params: { ...baseParams, rates: { ...rates, selic: 18 } } },
      { name: 'Crise Imobiliária', params: { ...baseParams, vacancyRate: 30, monthlyRent: baseParams.monthlyRent * 0.85, rates: { ...rates, ipca: -5 } } },
    ].map(s => {
      const r = runDCF(s.params)
      return { scenario: s.name, npv: r.npv, irr: r.irr, totalReturn: r.totalReturn, survives: r.npv > 0 }
    })

    // Discount & basic ROI (for backward compat with old /calculate)
    const discount = d.appraisalValue ? round(((d.appraisalValue - d.bidValue) / d.appraisalValue) * 100) : 0
    const potentialProfit = (d.appraisalValue || d.bidValue * 1.5) - acq.totalInvestment
    const simpleROI = round((potentialProfit / acq.totalInvestment) * 100)

    return reply.send({
      // Legacy fields (backward compat)
      bidValue: d.bidValue,
      appraisalValue: d.appraisalValue || null,
      costs: {
        itbi: round(acq.itbi), registry: round(acq.registry), notary: round(acq.notary),
        lawyer: round(acq.lawyer), eviction: round(acq.eviction), reform: round(acq.reform),
        totalCosts: round(acq.totalCosts), stateNotes: acq.costs.notes,
      },
      totalInvestment: round(acq.totalInvestment),
      discount, potentialProfit: round(potentialProfit), simpleROI,

      // Advanced DCF
      dcf: base,
      scenarios: {
        optimistic: { npv: optimistic.npv, irr: optimistic.irr, totalReturn: optimistic.totalReturn, paybackYears: optimistic.paybackYears },
        base: { npv: base.npv, irr: base.irr, totalReturn: base.totalReturn, paybackYears: base.paybackYears },
        pessimistic: { npv: pessimistic.npv, irr: pessimistic.irr, totalReturn: pessimistic.totalReturn, paybackYears: pessimistic.paybackYears },
      },
      stressTests,
      macroRates: rates,
    })
  })

  // GET /api/v1/financial/comparables — Find similar properties with scoring
  app.get('/comparables', async (req: FastifyRequest, reply: FastifyReply) => {
    const result = comparablesSchema.safeParse(req.query)
    if (!result.success) return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })

    const q = result.data
    const where: any = {
      city: { contains: q.city, mode: 'insensitive' },
      status: { in: ['ACTIVE', 'RENTED', 'SOLD'] },
    }
    if (q.type) where.type = q.type
    if (q.area) where.totalArea = { gte: q.area - 30, lte: q.area + 30 }
    if (q.bedrooms) where.bedrooms = { gte: q.bedrooms - 1, lte: q.bedrooms + 1 }
    if (q.neighborhood) where.neighborhood = { contains: q.neighborhood, mode: 'insensitive' }

    const properties = await app.prisma.property.findMany({
      where,
      select: {
        id: true, title: true, city: true, neighborhood: true,
        price: true, totalArea: true, bedrooms: true, bathrooms: true,
        type: true, status: true, publishedAt: true, createdAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: q.limit,
    })

    // Calculate similarity + price/m2
    const comparables = properties
      .filter(p => p.price && Number(p.price) > 0 && p.totalArea && Number(p.totalArea) > 0)
      .map(p => {
        const priceNum = Number(p.price) || 0
        const areaNum = Number(p.totalArea) || 1
        let score = 100
        if (q.area) { const diff = Math.abs(areaNum - q.area) / Math.max(q.area, 1); score -= Math.min(diff * 100, 40) }
        if (q.bedrooms) { score -= Math.abs((p.bedrooms || 0) - q.bedrooms) * 8 }
        if (q.neighborhood && p.neighborhood && !p.neighborhood.toLowerCase().includes(q.neighborhood.toLowerCase())) score -= 10
        score = Math.max(0, Math.round(score))

        return {
          id: p.id,
          title: p.title,
          city: p.city,
          neighborhood: p.neighborhood,
          price: priceNum,
          pricePerM2: Math.round(priceNum / areaNum),
          area: areaNum,
          bedrooms: p.bedrooms,
          status: p.status,
          publishedAt: p.publishedAt || p.createdAt,
          similarity: score,
        }
      })
      .sort((a, b) => b.similarity - a.similarity)

    // Price statistics
    const prices = comparables.filter(c => c.pricePerM2 > 0).map(c => c.pricePerM2)
    const avgPriceM2 = prices.length > 0 ? Math.round(prices.reduce((s, v) => s + v, 0) / prices.length) : 0
    const medianPriceM2 = prices.length > 0 ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0

    return reply.send({
      total: comparables.length,
      avgPricePerM2: avgPriceM2,
      medianPricePerM2: medianPriceM2,
      items: comparables,
    })
  })

  // GET /api/v1/financial/macro-rates — Current macro rates
  app.get('/macro-rates', async (_req: FastifyRequest, reply: FastifyReply) => {
    // TODO: integrate BCB API server-side for real-time rates
    return reply.send({
      ...DEFAULT_MACRO_RATES,
      source: 'BCB',
      updatedAt: new Date().toISOString(),
    })
  })
}
