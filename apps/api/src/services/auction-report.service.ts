/**
 * Auction Report Service — inteligência agregada sobre o arquivo histórico de
 * leilões, para o Tomás/copilot responderem perguntas por localização, tipo e
 * valor. Ex.: "quais foram os valores dos imóveis residenciais no centro de
 * Franca-SP", "qual o desconto médio dos apartamentos", "quantos foram
 * arrematados".
 *
 * Cobre leilões ATIVOS e HISTÓRICOS (já arrematados) — todos os dados públicos
 * capturados: avaliação, lance mínimo, valor de arremate, desconto, ocupação.
 */

import type { PrismaClient, Prisma } from '@prisma/client'

export interface AuctionReportFilters {
  city?: string
  neighborhood?: string
  state?: string
  propertyType?: string // HOUSE | APARTMENT | LAND | COMMERCIAL | ...
  category?: string      // RESIDENTIAL | COMMERCIAL | ...
  status?: string        // SOLD | OPEN | DESERTED | ...
  source?: string        // CAIXA | SANTANDER | JUDICIAL | ...
  soldOnly?: boolean      // só arrematados (com valor de arremate)
  minDiscount?: number
  maxPrice?: number       // teto sobre o lance mínimo
  sinceMonths?: number    // janela temporal (createdAt)
}

const CAP = 5000

function toNum(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

interface NumStats { count: number; min: number; avg: number; median: number; max: number }

function numStats(values: (number | null | undefined)[]): NumStats | null {
  const v = values.map(toNum).filter((x): x is number => x != null && x > 0).sort((a, b) => a - b)
  if (!v.length) return null
  const sum = v.reduce((a, b) => a + b, 0)
  const mid = Math.floor(v.length / 2)
  const median = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
  const round = (n: number) => Math.round(n)
  return { count: v.length, min: round(v[0]), avg: round(sum / v.length), median: round(median), max: round(v[v.length - 1]) }
}

/** Monta o where do Prisma a partir dos filtros. */
export function buildAuctionWhere(f: AuctionReportFilters): Prisma.AuctionWhereInput {
  const where: Prisma.AuctionWhereInput = {}
  if (f.city) where.city = { contains: f.city, mode: 'insensitive' }
  if (f.neighborhood) where.neighborhood = { contains: f.neighborhood, mode: 'insensitive' }
  if (f.state) where.state = { equals: f.state, mode: 'insensitive' }
  if (f.propertyType) where.propertyType = f.propertyType.toUpperCase() as any
  if (f.category) where.category = f.category.toUpperCase() as any
  if (f.source) where.source = f.source.toUpperCase() as any
  if (f.minDiscount != null) where.discountPercent = { gte: f.minDiscount }
  if (f.maxPrice != null) where.minimumBid = { lte: f.maxPrice }
  if (f.soldOnly) {
    where.status = 'SOLD'
    where.soldValue = { not: null }
  } else if (f.status) {
    where.status = f.status.toUpperCase() as any
  } else {
    // Por padrão, exclui cancelados (ruído) — mantém ativos + históricos.
    where.status = { not: 'CANCELLED' }
  }
  if (f.sinceMonths != null && f.sinceMonths > 0) {
    const since = new Date(Date.now() - f.sinceMonths * 30 * 24 * 60 * 60 * 1000)
    where.createdAt = { gte: since }
  }
  return where
}

/** Lista leilões que batem com os filtros (para o tool buscar_leiloes). */
export async function queryAuctions(prisma: PrismaClient, f: AuctionReportFilters, limit = 12) {
  const rows = await prisma.auction.findMany({
    where: buildAuctionWhere(f),
    select: {
      slug: true, title: true, city: true, neighborhood: true, state: true,
      propertyType: true, category: true, status: true, source: true,
      appraisalValue: true, minimumBid: true, soldValue: true, discountPercent: true,
      totalArea: true, occupation: true, auctionDate: true, soldDate: true, registryNumber: true,
    },
    orderBy: [{ soldDate: 'desc' }, { discountPercent: 'desc' }],
    take: Math.max(1, Math.min(limit, 30)),
  })
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    city: r.city,
    neighborhood: r.neighborhood,
    state: r.state,
    propertyType: r.propertyType,
    category: r.category,
    status: r.status,
    source: r.source,
    appraisalValue: toNum(r.appraisalValue),
    minimumBid: toNum(r.minimumBid),
    soldValue: toNum(r.soldValue),
    discountPercent: r.discountPercent ?? null,
    totalArea: r.totalArea ?? null,
    occupation: r.occupation ?? null,
    auctionDate: r.auctionDate ?? null,
    soldDate: r.soldDate ?? null,
    registryNumber: r.registryNumber ?? null,
    url: `https://agoraencontrei.com.br/leiloes/${r.slug}`,
  }))
}

/**
 * Relatório estatístico agregado (para o tool relatorio_leiloes).
 * Responde "valores dos imóveis residenciais no centro de Franca-SP" etc.
 */
export async function buildAuctionReport(prisma: PrismaClient, f: AuctionReportFilters) {
  const where = buildAuctionWhere(f)

  const rows = await prisma.auction.findMany({
    where,
    select: {
      appraisalValue: true, minimumBid: true, soldValue: true, discountPercent: true,
      opportunityScore: true, totalArea: true, propertyType: true, category: true,
      neighborhood: true, city: true, status: true, occupation: true,
    },
    take: CAP,
  })

  const total = rows.length
  if (!total) {
    return { filters: f, total: 0, message: 'Nenhum leilão encontrado com esses filtros no arquivo.' }
  }

  // pricePerM2 (usa arremate se houver, senão lance mínimo)
  const perM2: number[] = []
  for (const r of rows) {
    const val = toNum(r.soldValue) ?? toNum(r.minimumBid)
    const area = toNum(r.totalArea)
    if (val && area && area > 0) perM2.push(val / area)
  }

  // recorte por bairro (top) e por tipo/status
  const byNeighborhood = new Map<string, { count: number; sum: number; n: number }>()
  const byType = new Map<string, number>()
  const byStatus = new Map<string, number>()
  let soldCount = 0, occupiedCount = 0
  for (const r of rows) {
    const nb = (r.neighborhood || 'Não informado').trim()
    const agg = byNeighborhood.get(nb) || { count: 0, sum: 0, n: 0 }
    agg.count++
    const v = toNum(r.soldValue) ?? toNum(r.minimumBid)
    if (v) { agg.sum += v; agg.n++ }
    byNeighborhood.set(nb, agg)
    byType.set(r.propertyType || '?', (byType.get(r.propertyType || '?') || 0) + 1)
    byStatus.set(r.status || '?', (byStatus.get(r.status || '?') || 0) + 1)
    if (r.status === 'SOLD') soldCount++
    if (r.occupation === 'OCUPADO') occupiedCount++
  }

  const neighborhoods = [...byNeighborhood.entries()]
    .map(([name, a]) => ({ neighborhood: name, count: a.count, avgValue: a.n ? Math.round(a.sum / a.n) : null }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  return {
    filters: f,
    total,
    truncated: total >= CAP,
    counts: {
      sold: soldCount,
      occupied: occupiedCount,
      byStatus: Object.fromEntries([...byStatus.entries()].sort((a, b) => b[1] - a[1])),
      byPropertyType: Object.fromEntries([...byType.entries()].sort((a, b) => b[1] - a[1])),
    },
    values: {
      appraisalValue: numStats(rows.map((r) => toNum(r.appraisalValue))),
      minimumBid: numStats(rows.map((r) => toNum(r.minimumBid))),
      soldValue: numStats(rows.map((r) => toNum(r.soldValue))),
      pricePerM2: numStats(perM2),
      discountPercent: numStats(rows.map((r) => r.discountPercent)),
      opportunityScore: numStats(rows.map((r) => r.opportunityScore)),
    },
    topNeighborhoods: neighborhoods,
  }
}
