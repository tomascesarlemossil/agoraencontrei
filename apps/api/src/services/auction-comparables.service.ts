/**
 * Comparáveis automáticos + Detector de avaliação inflada (plano §2, §6, §7).
 *
 * Para cada leilão, busca imóveis SEMELHANTES na região (mesma cidade/UF, mesmo
 * tipo, área próxima) e usa o preço/m² desses comparáveis como âncora de mercado.
 * Com isso:
 *   • estima o valor de mercado em faixa (conservador/provável/otimista) com
 *     confiança declarada e a composição da amostra (quantos no bairro/cidade);
 *   • detecta AVALIAÇÃO INFLADA — quando a avaliação do edital está acima do
 *     preço/m² regional, o desconto anunciado é maior que o desconto real.
 *
 * Tudo calculado on-the-fly a partir da base de leilões — sem colunas novas.
 * O preço/m² usa a AVALIAÇÃO dos comparáveis como proxy de mercado (é uma
 * avaliação profissional, comparável entre imóveis), não o lance (que é abaixo
 * do mercado por natureza).
 */

import type { PrismaClient, Prisma } from '@prisma/client'

export interface ComparableInput {
  id?: string
  city: string | null
  state: string | null
  neighborhood: string | null
  propertyType: string | null
  latitude: number | null
  longitude: number | null
  totalArea: number | null
  builtArea: number | null
  landArea: number | null
  appraisalValue: number | null
  minimumBid: number | null
  discountPercent: number | null
}

export interface ComparableItem {
  slug: string
  title: string
  neighborhood: string | null
  city: string | null
  totalArea: number | null
  appraisalValue: number | null
  minimumBid: number | null
  pricePerM2: number
  sameNeighborhood: boolean
  distanceKm: number | null
}

export interface MarketEstimate {
  conservative: number
  likely: number
  optimistic: number
  pricePerM2: number
  confidence: number
  sampleSize: number
  breakdown: { sameNeighborhood: number; sameCity: number }
  note: string
}

export interface InflatedAppraisal {
  appraisalPerM2: number | null
  marketPerM2: number | null
  appraisalAboveMarketPercent: number | null // >0 = avaliação acima do mercado
  announcedDiscountPercent: number | null
  realDiscountPercent: number | null         // vs mercado (antes de custos)
  verdict: 'INFLATED' | 'FAIR' | 'BELOW' | 'UNKNOWN'
  message: string
}

export interface ComparablesResult {
  comparables: ComparableItem[]
  marketEstimate: MarketEstimate | null
  inflatedAppraisal: InflatedAppraisal
}

function effectiveArea(a: { totalArea: number | null; builtArea: number | null; landArea: number | null }): number {
  return Number(a.builtArea) || Number(a.totalArea) || Number(a.landArea) || 0
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b)
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

/**
 * Busca comparáveis e calcula a estimativa de mercado + detector de inflação.
 * `limit` controla quantos comparáveis são retornados na lista (o cálculo usa
 * uma amostra maior internamente).
 */
export async function findComparables(
  prisma: PrismaClient,
  auction: ComparableInput,
  limit = 8,
): Promise<ComparablesResult> {
  const area = effectiveArea(auction)
  const appraisal = auction.appraisalValue && auction.appraisalValue > 0 ? Number(auction.appraisalValue) : null
  const minimumBid = auction.minimumBid && auction.minimumBid > 0 ? Number(auction.minimumBid) : null

  const emptyInflated: InflatedAppraisal = {
    appraisalPerM2: area > 0 && appraisal ? Math.round(appraisal / area) : null,
    marketPerM2: null, appraisalAboveMarketPercent: null,
    announcedDiscountPercent: auction.discountPercent ?? null,
    realDiscountPercent: null, verdict: 'UNKNOWN',
    message: 'Sem comparáveis suficientes na região para avaliar o desconto real.',
  }

  if (!auction.city) {
    return { comparables: [], marketEstimate: null, inflatedAppraisal: emptyInflated }
  }

  const where: Prisma.AuctionWhereInput = {
    id: auction.id ? { not: auction.id } : undefined,
    city: { equals: auction.city, mode: 'insensitive' },
    ...(auction.state ? { state: { equals: auction.state, mode: 'insensitive' } } : {}),
    ...(auction.propertyType ? { propertyType: auction.propertyType as any } : {}),
    status: { not: 'CANCELLED' },
    totalArea: { gt: 0 },
    appraisalValue: { gt: 0 },
  }

  const rows = await prisma.auction.findMany({
    where,
    select: {
      slug: true, title: true, neighborhood: true, city: true,
      latitude: true, longitude: true, totalArea: true,
      appraisalValue: true, minimumBid: true,
    },
    take: 200,
    orderBy: { createdAt: 'desc' },
  })

  // Filtra por área próxima quando conhecemos a área do alvo (±40%).
  const areaLo = area > 0 ? area * 0.6 : 0
  const areaHi = area > 0 ? area * 1.4 : Infinity

  const scored: ComparableItem[] = []
  for (const r of rows) {
    const ra = Number(r.totalArea)
    const rApp = Number(r.appraisalValue)
    if (!(ra > 0) || !(rApp > 0)) continue
    if (area > 0 && (ra < areaLo || ra > areaHi)) continue
    const sameNeighborhood = !!auction.neighborhood && !!r.neighborhood &&
      auction.neighborhood.trim().toLowerCase() === r.neighborhood.trim().toLowerCase()
    const distanceKm = auction.latitude != null && auction.longitude != null && r.latitude != null && r.longitude != null
      ? Math.round(haversineKm(auction.latitude, auction.longitude, r.latitude, r.longitude) * 10) / 10
      : null
    scored.push({
      slug: r.slug, title: r.title, neighborhood: r.neighborhood, city: r.city,
      totalArea: ra, appraisalValue: Math.round(rApp),
      minimumBid: r.minimumBid ? Math.round(Number(r.minimumBid)) : null,
      pricePerM2: Math.round(rApp / ra),
      sameNeighborhood, distanceKm,
    })
  }

  if (scored.length < 3) {
    return { comparables: [], marketEstimate: null, inflatedAppraisal: emptyInflated }
  }

  // Ordena por relevância: mesmo bairro primeiro, depois mais próximo.
  scored.sort((a, b) => {
    if (a.sameNeighborhood !== b.sameNeighborhood) return a.sameNeighborhood ? -1 : 1
    if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
    return 0
  })

  const perM2Values = scored.map((s) => s.pricePerM2)
  const marketPerM2 = median(perM2Values)
  const sameNeighborhood = scored.filter((s) => s.sameNeighborhood).length
  const sampleSize = scored.length

  // Dispersão (coeficiente robusto) reduz a confiança quando os comparáveis
  // variam muito entre si.
  const med = marketPerM2 || 1
  const absDev = median(perM2Values.map((v) => Math.abs(v - med)))
  const dispersion = med > 0 ? absDev / med : 1
  let confidence = Math.min(85, 35 + sampleSize * 2 + sameNeighborhood * 3)
  if (dispersion > 0.3) confidence = Math.max(30, confidence - 20)
  else if (dispersion > 0.2) confidence = Math.max(35, confidence - 10)

  let marketEstimate: MarketEstimate | null = null
  if (area > 0) {
    const likely = Math.round(marketPerM2 * area)
    marketEstimate = {
      conservative: Math.round(likely * 0.9),
      likely,
      optimistic: Math.round(likely * 1.08),
      pricePerM2: marketPerM2,
      confidence,
      sampleSize,
      breakdown: { sameNeighborhood, sameCity: sampleSize - sameNeighborhood },
      note: `Baseado em ${sampleSize} comparáveis (${sameNeighborhood} no mesmo bairro), mediana de R$ ${marketPerM2.toLocaleString('pt-BR')}/m².`,
    }
  }

  // ── Detector de avaliação inflada ─────────────────────────────────────────
  const appraisalPerM2 = area > 0 && appraisal ? Math.round(appraisal / area) : null
  const aboveMarket = appraisalPerM2 && marketPerM2 > 0
    ? Math.round(((appraisalPerM2 / marketPerM2) - 1) * 100)
    : null
  const likelyMarket = marketEstimate?.likely ?? null
  const realDiscount = likelyMarket && minimumBid
    ? Math.round((1 - minimumBid / likelyMarket) * 100)
    : null

  let verdict: InflatedAppraisal['verdict'] = 'UNKNOWN'
  let message = emptyInflated.message
  if (aboveMarket != null) {
    if (aboveMarket >= 15) {
      verdict = 'INFLATED'
      message = `A avaliação do edital está cerca de ${aboveMarket}% acima do preço/m² de imóveis semelhantes na região — o desconto anunciado tende a ser maior que o real.`
    } else if (aboveMarket <= -10) {
      verdict = 'BELOW'
      message = `A avaliação está abaixo do preço/m² regional (${Math.abs(aboveMarket)}%) — pode indicar oportunidade ou avaliação conservadora.`
    } else {
      verdict = 'FAIR'
      message = 'A avaliação do edital está alinhada ao preço/m² de imóveis semelhantes na região.'
    }
  }

  return {
    comparables: scored.slice(0, limit),
    marketEstimate,
    inflatedAppraisal: {
      appraisalPerM2,
      marketPerM2,
      appraisalAboveMarketPercent: aboveMarket,
      announcedDiscountPercent: auction.discountPercent ?? null,
      realDiscountPercent: realDiscount,
      verdict,
      message,
    },
  }
}
