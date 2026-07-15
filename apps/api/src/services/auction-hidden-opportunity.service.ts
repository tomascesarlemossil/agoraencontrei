/**
 * Radar de Oportunidades Ocultas / Índice de Oportunidade Oculta (plano §1).
 *
 * Detecta imóveis que provavelmente estão subavaliados ou pouco disputados,
 * combinando sinais que já temos na base:
 *   • 2ª praça (preço já reduzido) e/ou sem lances;
 *   • imóvel republicado (foi a leilão mais de uma vez — identidade canônica);
 *   • pouco visto em relação à região;
 *   • encerrando em breve;
 *   • preço/m² abaixo da mediana regional;
 *   • desconto anunciado alto.
 *
 * Quanto maior o índice (0–100), maior a chance de a oportunidade ter passado
 * despercebida. Cada item vem com os MOTIVOS que dispararam o índice — nada de
 * caixa-preta.
 */

import type { PrismaClient, Prisma } from '@prisma/client'

export interface HiddenOpportunityFilters {
  city?: string
  state?: string
  propertyType?: string
  limit?: number
}

export interface HiddenOpportunityItem {
  slug: string
  title: string
  city: string | null
  state: string | null
  neighborhood: string | null
  status: string
  source: string | null
  coverImage: string | null
  minimumBid: number | null
  appraisalValue: number | null
  discountPercent: number | null
  pricePerM2: number | null
  auctionCount: number
  hiddenIndex: number
  reasons: string[]
}

const ACTIVE_STATUSES = ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] as const

function toNum(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function median(values: number[]): number {
  if (!values.length) return 0
  const v = [...values].sort((a, b) => a - b)
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

/**
 * Rankeia oportunidades ocultas ativas numa região. `now` é injetável para
 * testes (o ambiente de scripts não permite Date.now()).
 */
export async function buildHiddenOpportunities(
  prisma: PrismaClient,
  filters: HiddenOpportunityFilters = {},
  now: Date = new Date(),
): Promise<{ generatedAt: string; total: number; items: HiddenOpportunityItem[] }> {
  const where: Prisma.AuctionWhereInput = {
    status: { in: [...ACTIVE_STATUSES] },
    ...(filters.city ? { city: { contains: filters.city, mode: 'insensitive' } } : {}),
    ...(filters.state ? { state: { equals: filters.state, mode: 'insensitive' } } : {}),
    ...(filters.propertyType ? { propertyType: filters.propertyType.toUpperCase() as any } : {}),
  }

  const rows = await prisma.auction.findMany({
    where,
    select: {
      slug: true, title: true, city: true, state: true, neighborhood: true,
      status: true, source: true, auctioneerName: true, coverImage: true,
      minimumBid: true, appraisalValue: true, discountPercent: true,
      totalArea: true, views: true, currentBid: true, auctionEndDate: true,
      identity: { select: { auctionCount: true } },
    },
    take: 1500,
    orderBy: { createdAt: 'desc' },
  })
  if (!rows.length) return { generatedAt: now.toISOString(), total: 0, items: [] }

  // Referências regionais: mediana de preço/m² e de visualizações.
  const perM2All: number[] = []
  const viewsAll: number[] = []
  for (const r of rows) {
    const bid = toNum(r.minimumBid)
    const area = toNum(r.totalArea)
    if (bid && area && area > 0) perM2All.push(bid / area)
    viewsAll.push(r.views ?? 0)
  }
  const medM2 = median(perM2All)
  const medViews = median(viewsAll)
  const nowMs = now.getTime()

  const items: HiddenOpportunityItem[] = rows.map((r) => {
    const bid = toNum(r.minimumBid)
    const area = toNum(r.totalArea)
    const pricePerM2 = bid && area && area > 0 ? Math.round(bid / area) : null
    const auctionCount = r.identity?.auctionCount ?? 1
    const reasons: string[] = []
    let index = 0

    if (r.status === 'SECOND_ROUND') { index += 18; reasons.push('Em 2ª praça — preço já reduzido') }
    if ((r.status === 'SECOND_ROUND' || r.status === 'OPEN') && toNum(r.currentBid) == null) {
      index += 12; reasons.push('Sem lances registrados até agora')
    }
    if (auctionCount > 1) { index += 18; reasons.push(`Já foi a leilão ${auctionCount}x — republicado`) }
    if (medViews > 0 && (r.views ?? 0) <= medViews * 0.5) { index += 12; reasons.push('Pouco visto em relação à região') }
    if (r.auctionEndDate) {
      const hoursLeft = (new Date(r.auctionEndDate).getTime() - nowMs) / 3_600_000
      if (hoursLeft > 0 && hoursLeft <= 72) { index += 10; reasons.push('Encerrando em breve (até 72h)') }
    }
    if (pricePerM2 != null && medM2 > 0 && pricePerM2 <= medM2 * 0.6) {
      const below = Math.round((1 - pricePerM2 / medM2) * 100)
      index += 30; reasons.push(`Preço/m² ${below}% abaixo da mediana regional`)
    }
    if ((r.discountPercent ?? 0) >= 40) { index += 10; reasons.push(`Desconto anunciado de ${Math.round(r.discountPercent!)}%`) }

    return {
      slug: r.slug, title: r.title, city: r.city, state: r.state, neighborhood: r.neighborhood,
      status: r.status, source: r.auctioneerName || r.source, coverImage: r.coverImage,
      minimumBid: bid, appraisalValue: toNum(r.appraisalValue), discountPercent: r.discountPercent,
      pricePerM2, auctionCount,
      hiddenIndex: Math.min(100, index),
      reasons,
    }
  })

  const ranked = items
    .filter((it) => it.hiddenIndex >= 25 && it.reasons.length > 0)
    .sort((a, b) => b.hiddenIndex - a.hiddenIndex)
    .slice(0, Math.max(1, Math.min(filters.limit ?? 24, 60)))

  return { generatedAt: now.toISOString(), total: ranked.length, items: ranked }
}
