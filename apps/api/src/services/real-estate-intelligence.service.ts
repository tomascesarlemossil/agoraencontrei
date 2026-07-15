import type { PrismaClient } from '@prisma/client'
import { resolveTerritorialAddress } from './territorial-intelligence.service.js'

type Scope = { companyId?: string; publicOnly: boolean }
type ComparableInput = {
  city: string; neighborhood?: string; propertyType?: string; purpose?: string
  builtArea?: number; landArea?: number; bedrooms?: number; excludePropertyId?: string; limit?: number
}

const number = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const median = (values: number[]): number | null => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const percentile = (values: number[], p: number): number | null => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index); const upper = Math.ceil(index)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

function scopedWhere(scope: Scope): Record<string, unknown> {
  const where: Record<string, unknown> = { status: 'ACTIVE' }
  if (scope.companyId) where.companyId = scope.companyId
  if (scope.publicOnly) where.authorizedPublish = true
  return where
}

export async function identifyNeighborhood(prisma: PrismaClient, input: { city: string; street: string }, scope: Scope) {
  try {
    const territorial = await resolveTerritorialAddress(prisma, input)
    if (territorial.resolved && territorial.neighborhood) {
      const territorialConfidence = territorial.confidence ?? 0
      return {
        classification: territorial.classification,
        neighborhood: territorial.neighborhood.name,
        confidence: territorialConfidence >= 85 ? 'high' : territorialConfidence >= 60 ? 'moderate' : 'low',
        confidenceScore: territorialConfidence,
        references: 1,
        candidates: [{ name: territorial.neighborhood.name, references: 1 }],
        territorial,
        warning: undefined,
      }
    }
  } catch { /* cadastro territorial pode ainda não estar migrado */ }

  const rows = await prisma.property.findMany({
    where: { ...scopedWhere(scope), city: { contains: input.city, mode: 'insensitive' }, street: { contains: input.street, mode: 'insensitive' }, neighborhood: { not: null } } as any,
    select: { neighborhood: true }, take: 50,
  })
  const counts = new Map<string, number>()
  for (const row of rows) if (row.neighborhood) counts.set(row.neighborhood, (counts.get(row.neighborhood) || 0) + 1)
  const candidates = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, references]) => ({ name, references }))
  return {
    classification: 'inference_from_listings', neighborhood: candidates[0]?.name ?? null,
    confidence: candidates.length === 1 && rows.length >= 3 ? 'high' : rows.length ? 'moderate' : 'insufficient',
    references: rows.length, candidates,
    warning: 'Inferência do cadastro de imóveis; valide em fonte territorial oficial antes de tratá-la como bairro oficial.',
  }
}

export async function findComparables(prisma: PrismaClient, input: ComparableInput, scope: Scope) {
  const area = input.builtArea || input.landArea
  const where: Record<string, any> = { ...scopedWhere(scope), city: { contains: input.city, mode: 'insensitive' } }
  if (input.neighborhood) where.neighborhood = { contains: input.neighborhood, mode: 'insensitive' }
  if (input.propertyType) where.type = input.propertyType.toUpperCase()
  if (input.purpose) where.purpose = input.purpose.toUpperCase()
  if (input.bedrooms !== undefined) where.bedrooms = { gte: Math.max(0, input.bedrooms - 1), lte: input.bedrooms + 1 }
  if (input.excludePropertyId) where.id = { not: input.excludePropertyId }
  if (area) where[input.builtArea ? 'builtArea' : 'landArea'] = { gte: area * 0.7, lte: area * 1.3 }

  const rows = await prisma.property.findMany({
    where: where as any,
    select: { id: true, reference: true, title: true, city: true, neighborhood: true, type: true, purpose: true, price: true, priceRent: true, builtArea: true, landArea: true, totalArea: true, bedrooms: true, updatedAt: true, publishedAt: true },
    orderBy: { updatedAt: 'desc' }, take: Math.min(Math.max(input.limit || 20, 3), 50),
  })
  const comparables = rows.map(row => {
    const selectedArea = input.builtArea ? row.builtArea : input.landArea ? row.landArea : (row.builtArea || row.totalArea || row.landArea)
    const price = input.purpose?.toUpperCase() === 'RENT' ? number(row.priceRent) : number(row.price)
    return { ...row, price, pricePerM2: price && selectedArea ? Math.round(price / selectedArea) : null, dataClass: 'listing' }
  }).filter(row => row.price)
  return { found: comparables.length, comparables, periodEnd: new Date().toISOString(), dataClass: 'asking_prices' }
}

export async function estimateMarketValue(prisma: PrismaClient, input: ComparableInput, scope: Scope) {
  const result = await findComparables(prisma, { ...input, limit: Math.max(input.limit || 20, 8) }, scope)
  const area = input.builtArea || input.landArea
  const values = result.comparables.map(row => row.pricePerM2).filter((value): value is number => value !== null)
  if (!area || values.length < 3) return { estimate: null, confidence: 'insufficient', validComparables: values.length, warning: 'Sem área ou comparáveis suficientes. Não apresente um valor de mercado.' }
  const low = percentile(values, 0.25)!; const central = median(values)!; const high = percentile(values, 0.75)!
  return {
    estimate: { low: Math.round(low * area), central: Math.round(central * area), high: Math.round(high * area), pricePerM2: { low: Math.round(low), central: Math.round(central), high: Math.round(high) } },
    confidence: values.length >= 10 ? 'moderate' : 'low', validComparables: values.length,
    dataClass: 'statistical_estimate_from_asking_prices', periodEnd: new Date().toISOString(),
    warning: 'Estimativa preliminar baseada em preços anunciados; não é laudo oficial nem valor confirmado de fechamento.',
  }
}

export async function getNeighborhoodIndex(prisma: PrismaClient, input: { city: string; neighborhood: string; propertyType?: string; purpose?: string }, scope: Scope) {
  const result = await findComparables(prisma, { ...input, limit: 50 }, scope)
  const values = result.comparables.map(row => row.pricePerM2).filter((value): value is number => value !== null)
  return {
    ...input, references: result.found, pricedReferences: values.length,
    askingPricePerM2: values.length ? { p25: Math.round(percentile(values, .25)!), median: Math.round(median(values)!), p75: Math.round(percentile(values, .75)!) } : null,
    confidence: values.length >= 15 ? 'high' : values.length >= 5 ? 'moderate' : 'low',
    dataClass: 'aggregated_listing_index', updatedAt: new Date().toISOString(),
  }
}

export async function getPriceHistory(prisma: PrismaClient, propertyId: string, scope: Scope) {
  const property = await prisma.property.findFirst({ where: { ...scopedWhere(scope), id: propertyId } as any, select: { id: true, price: true, priceRent: true, createdAt: true, updatedAt: true } })
  if (!property) return { error: 'property_not_found' }
  const valuations = await prisma.propertyValuation.findMany({ where: { propertyId }, select: { valuatedAt: true, value: true, source: true, pricePerM2: true, methodology: true }, orderBy: { valuatedAt: 'asc' } })
  let snapshots: any[] = []
  try {
    snapshots = await (prisma as any).propertyListingSnapshot.findMany({
      where: { propertyId },
      select: { capturedAt: true, listingStatus: true, askingPrice: true, rentPrice: true, sourceReliability: true, source: { select: { name: true, slug: true } } },
      orderBy: { capturedAt: 'asc' },
    })
  } catch { /* compatível antes da migração ser aplicada */ }
  return {
    propertyId, currentAskingPrice: number(property.price), currentRentPrice: number(property.priceRent), firstSeenAt: property.createdAt, lastChangedAt: property.updatedAt,
    daysObserved: Math.max(0, Math.floor((Date.now() - property.createdAt.getTime()) / 86_400_000)),
    valuations: valuations.map(v => ({ ...v, value: number(v.value), pricePerM2: number(v.pricePerM2) })),
    snapshots: snapshots.map(snapshot => ({ ...snapshot, askingPrice: number(snapshot.askingPrice), rentPrice: number(snapshot.rentPrice), dataClass: 'listing_snapshot' })),
    warning: snapshots.length ? undefined : 'O histórico completo dependerá dos snapshots de ingestão; estes são os eventos hoje disponíveis.',
  }
}
