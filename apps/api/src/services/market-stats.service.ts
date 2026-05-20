/**
 * Market Stats — Radar de Mercado e Precificador.
 *
 * Calcula agregados de mercado (preço médio, preço/m², distribuição) a partir
 * dos imóveis ativos e autorizados do marketplace, e estima o valor de um
 * imóvel novo a partir de comparáveis.
 */

import type { Prisma, PrismaClient } from '@prisma/client'

export interface StatsFilter {
  city?: string
  neighborhood?: string
  type?: string
  purpose?: 'SALE' | 'RENT'
}

export interface NeighborhoodStat {
  neighborhood: string
  count: number
  avgPricePerSqm: number | null
}

export interface TypeStat {
  type: string
  count: number
  avgPrice: number | null
}

export interface PriceBucket {
  range: string
  count: number
}

export interface MarketStats {
  totalListings: number
  avgPrice: number | null
  avgPricePerSqm: number | null
  medianPricePerSqm: number | null
  byType: TypeStat[]
  byNeighborhood: NeighborhoodStat[]
  priceBuckets: PriceBucket[]
}

const BUCKETS: { label: string; min: number; max: number }[] = [
  { label: 'Até 300 mil',     min: 0,        max: 300_000 },
  { label: '300 a 500 mil',   min: 300_000,  max: 500_000 },
  { label: '500 a 750 mil',   min: 500_000,  max: 750_000 },
  { label: '750 mil a 1 mi',  min: 750_000,  max: 1_000_000 },
  { label: 'Acima de 1 mi',   min: 1_000_000, max: Infinity },
]

function area(p: { builtArea?: number | null; totalArea?: number | null; landArea?: number | null }): number {
  return Number(p.builtArea ?? 0) || Number(p.totalArea ?? 0) || Number(p.landArea ?? 0)
}

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

function buildWhere(f: StatsFilter): Prisma.PropertyWhereInput {
  return {
    status: 'ACTIVE',
    authorizedPublish: true,
    ...(f.city && { city: { equals: f.city, mode: 'insensitive' } }),
    ...(f.neighborhood && { neighborhood: { equals: f.neighborhood, mode: 'insensitive' } }),
    ...(f.type && { type: f.type.toUpperCase() as Prisma.PropertyWhereInput['type'] }),
    ...(f.purpose === 'RENT'
      ? { purpose: { in: ['RENT', 'BOTH'] } }
      : f.purpose === 'SALE'
        ? { purpose: { in: ['SALE', 'BOTH'] } }
        : {}),
  }
}

export async function getMarketStats(prisma: PrismaClient, filter: StatsFilter): Promise<MarketStats> {
  const rows = await prisma.property.findMany({
    where: buildWhere(filter),
    select: {
      price: true, priceRent: true, builtArea: true, totalArea: true, landArea: true,
      type: true, neighborhood: true,
    },
    take: 5000,
  }).catch(() => [] as Array<{
    price: unknown; priceRent: unknown; builtArea: number | null; totalArea: number | null; landArea: number | null
    type: string; neighborhood: string | null
  }>)

  const isRent = filter.purpose === 'RENT'
  const priceField = (r: typeof rows[number]) => Number(isRent ? r.priceRent ?? 0 : r.price ?? 0)
  const valid = rows.filter(r => priceField(r) > 0)

  const prices = valid.map(priceField)
  const perSqm = valid.map(r => { const a = area(r); return a > 0 ? priceField(r) / a : null })
    .filter((v): v is number => v != null && v > 0)

  // by type
  const typeMap = new Map<string, number[]>()
  for (const r of valid) {
    const arr = typeMap.get(r.type) ?? []
    arr.push(priceField(r))
    typeMap.set(r.type, arr)
  }
  const byType: TypeStat[] = [...typeMap.entries()]
    .map(([type, arr]) => ({ type, count: arr.length, avgPrice: mean(arr) }))
    .sort((a, b) => b.count - a.count)

  // by neighborhood
  const nbMap = new Map<string, number[]>()
  for (const r of valid) {
    if (!r.neighborhood) continue
    const a = area(r)
    const p = priceField(r)
    if (a <= 0 || p <= 0) continue
    const arr = nbMap.get(r.neighborhood) ?? []
    arr.push(p / a)
    nbMap.set(r.neighborhood, arr)
  }
  const byNeighborhood: NeighborhoodStat[] = [...nbMap.entries()]
    .map(([neighborhood, arr]) => ({ neighborhood, count: arr.length, avgPricePerSqm: mean(arr) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)

  // buckets (sale only — buckets are sized for SALE prices)
  const priceBuckets: PriceBucket[] = BUCKETS.map(b => ({
    range: b.label,
    count: prices.filter(p => p >= b.min && p < b.max).length,
  }))

  return {
    totalListings: valid.length,
    avgPrice: mean(prices),
    avgPricePerSqm: mean(perSqm),
    medianPricePerSqm: median(perSqm),
    byType, byNeighborhood, priceBuckets,
  }
}

export interface EstimateInput {
  city: string
  neighborhood?: string
  type?: string
  area: number
  bedrooms?: number
  purpose?: 'SALE' | 'RENT'
}

export interface EstimateResult {
  estimate: number | null
  low: number | null
  high: number | null
  pricePerSqm: number | null
  comparableCount: number
  basis: 'tight' | 'broad' | 'fallback'
}

/** Estimate a property value from comparable active listings (median × area). */
export async function estimatePrice(prisma: PrismaClient, input: EstimateInput): Promise<EstimateResult> {
  if (input.area <= 0) {
    return { estimate: null, low: null, high: null, pricePerSqm: null, comparableCount: 0, basis: 'fallback' }
  }

  const tightFilter: StatsFilter = {
    city: input.city,
    neighborhood: input.neighborhood,
    type: input.type,
    purpose: input.purpose ?? 'SALE',
  }
  const broadFilter: StatsFilter = { city: input.city, purpose: input.purpose ?? 'SALE' }

  async function gather(f: StatsFilter): Promise<number[]> {
    const rows = await prisma.property.findMany({
      where: {
        ...buildWhere(f),
        ...(input.bedrooms && { bedrooms: { gte: Math.max(1, input.bedrooms - 1), lte: input.bedrooms + 1 } }),
      },
      select: { price: true, priceRent: true, builtArea: true, totalArea: true, landArea: true },
      take: 500,
    }).catch(() => [])
    const isRent = (f.purpose ?? 'SALE') === 'RENT'
    return rows.map(r => {
      const p = Number(isRent ? r.priceRent ?? 0 : r.price ?? 0)
      const a = area(r)
      return a > 0 && p > 0 ? p / a : NaN
    }).filter(v => Number.isFinite(v))
  }

  let perSqm = await gather(tightFilter)
  let basis: EstimateResult['basis'] = 'tight'
  if (perSqm.length < 3) {
    perSqm = await gather(broadFilter)
    basis = 'broad'
  }
  if (perSqm.length < 3) {
    return { estimate: null, low: null, high: null, pricePerSqm: null, comparableCount: perSqm.length, basis: 'fallback' }
  }

  const m = median(perSqm)!
  const estimate = Math.round(m * input.area)
  return {
    estimate,
    low: Math.round(estimate * 0.85),
    high: Math.round(estimate * 1.15),
    pricePerSqm: Math.round(m),
    comparableCount: perSqm.length,
    basis,
  }
}
