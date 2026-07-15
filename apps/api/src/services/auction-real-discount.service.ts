/**
 * Desconto Real AE — a métrica proprietária do AgoraEncontrei (plano §8 e §30).
 *
 * O desconto que os leiloeiros anunciam usa a AVALIAÇÃO como referência — que
 * costuma estar acima do mercado. Aqui recalculamos a vantagem LÍQUIDA de
 * verdade: partimos de um valor de mercado com procedência declarada, subtraímos
 * o lance e TODOS os custos de arrematação (comissão, ITBI, registro, escritura,
 * advogado, desocupação, reforma) e uma margem de segurança, e mostramos a
 * margem líquida real, o % sobre o investimento e o lance máximo recomendado
 * para um retorno-alvo.
 *
 * Princípio do plano: nada de "lucro garantido". Todo número traz a origem e a
 * confiança do valor de mercado usado.
 */

import type { PrismaClient, Prisma } from '@prisma/client'
import { calculateAcquisitionCosts } from '../utils/brazil-costs.js'

const AUCTIONEER_COMMISSION_RATE = 0.05 // comissão do leiloeiro (padrão de mercado)
const SAFETY_MARGIN_RATE = 0.05         // margem de imprevistos sobre o investimento
const DEFAULT_TARGET_RETURN = 0.20      // retorno-alvo padrão p/ o lance máximo

export type MarketValueOrigin = 'AI_ESTIMATE' | 'REGIONAL_M2' | 'APPRAISAL_HAIRCUT'

export interface RealDiscountResult {
  currency: 'BRL'
  minimumBid: number | null
  appraisalValue: number | null
  announcedDiscountPercent: number | null // desconto que a fonte anuncia (sobre a avaliação)
  marketValue: {
    conservative: number
    origin: MarketValueOrigin
    originLabel: string
    confidence: number // 0-100
    pricePerM2?: number | null
    sampleSize?: number | null
    note: string
  } | null
  costs: {
    auctioneerCommission: number
    itbi: number
    registry: number
    notary: number
    lawyer: number
    eviction: number
    reform: number
    safetyMargin: number
    totalCosts: number
  } | null
  totalInvestment: number | null
  netMargin: number | null        // valor de mercado conservador − investimento total
  netMarginPercent: number | null // margem líquida sobre o investimento
  realDiscountPercent: number | null // desconto real: 1 − (investimento / mercado)
  maxRecommendedBid: number | null   // lance máximo p/ atingir o retorno-alvo
  targetReturnPercent: number
  verdict: 'STRONG' | 'MODERATE' | 'WEAK' | 'NEGATIVE' | 'INSUFFICIENT_DATA'
  assumptions: string[]
}

function round(n: number): number {
  return Math.round(n)
}

/** Mediana de R$/m² de leilões comparáveis na região (sinal de preço regional). */
async function regionalPricePerM2(
  prisma: PrismaClient,
  auction: { city: string | null; state: string | null; propertyType: string | null },
): Promise<{ median: number; sample: number } | null> {
  if (!auction.city) return null
  const baseWhere: Prisma.AuctionWhereInput = {
    city: { equals: auction.city, mode: 'insensitive' },
    ...(auction.state ? { state: { equals: auction.state, mode: 'insensitive' } } : {}),
    totalArea: { gt: 0 },
    status: { not: 'CANCELLED' },
  }
  // Primeiro tenta com o mesmo tipo de imóvel; se a amostra for pobre, abre p/ cidade.
  for (const where of [
    { ...baseWhere, propertyType: (auction.propertyType || undefined) as any },
    baseWhere,
  ]) {
    const rows = await prisma.auction.findMany({
      where,
      select: { soldValue: true, minimumBid: true, appraisalValue: true, totalArea: true },
      take: 400,
    })
    const perM2: number[] = []
    for (const r of rows) {
      const area = Number(r.totalArea)
      // Preferimos avaliação (proxy de mercado) > arremate > lance mínimo.
      const val = Number(r.appraisalValue) || Number(r.soldValue) || Number(r.minimumBid)
      if (area > 0 && val > 0) perM2.push(val / area)
    }
    if (perM2.length >= 5) {
      perM2.sort((a, b) => a - b)
      const mid = Math.floor(perM2.length / 2)
      const median = perM2.length % 2 ? perM2[mid] : (perM2[mid - 1] + perM2[mid]) / 2
      return { median, sample: perM2.length }
    }
  }
  return null
}

export interface RealDiscountInput {
  city: string | null
  state: string | null
  propertyType: string | null
  totalArea: number | null
  builtArea: number | null
  landArea: number | null
  appraisalValue: number | null
  minimumBid: number | null
  marketPriceEstimate: number | null
  occupation: string | null
  discountPercent: number | null
}

/**
 * Calcula o Desconto Real AE de um leilão. Escolhe o melhor valor de mercado
 * disponível (estimativa de IA > R$/m² regional > avaliação com deságio) e
 * declara a procedência + confiança de forma transparente.
 */
export async function computeRealDiscount(
  prisma: PrismaClient,
  auction: RealDiscountInput,
): Promise<RealDiscountResult> {
  const minimumBid = auction.minimumBid && auction.minimumBid > 0 ? Number(auction.minimumBid) : null
  const appraisalValue = auction.appraisalValue && auction.appraisalValue > 0 ? Number(auction.appraisalValue) : null
  const area = Number(auction.builtArea) || Number(auction.totalArea) || Number(auction.landArea) || 0
  const assumptions: string[] = []

  // ── Valor de mercado conservador (com procedência) ───────────────────────
  let market: RealDiscountResult['marketValue'] = null
  const aiEstimate = auction.marketPriceEstimate && auction.marketPriceEstimate > 0 ? Number(auction.marketPriceEstimate) : null

  if (aiEstimate) {
    market = {
      conservative: round(aiEstimate * 0.95), // deságio conservador sobre a estimativa
      origin: 'AI_ESTIMATE',
      originLabel: 'Estimativa de mercado do AgoraEncontrei',
      confidence: 70,
      note: 'Estimativa própria com deságio conservador de 5%.',
    }
  } else if (area > 0) {
    const regional = await regionalPricePerM2(prisma, auction).catch(() => null)
    if (regional) {
      // Deságio para chegar a um cenário conservador de venda rápida.
      const conservative = regional.median * area * 0.9
      const confidence = Math.min(75, 35 + regional.sample) // mais amostra → mais confiança
      market = {
        conservative: round(conservative),
        origin: 'REGIONAL_M2',
        originLabel: `R$/m² regional (${auction.city})`,
        confidence,
        pricePerM2: round(regional.median),
        sampleSize: regional.sample,
        note: `Baseado na mediana de R$ ${round(regional.median).toLocaleString('pt-BR')}/m² de ${regional.sample} imóveis comparáveis na região, com deságio conservador de 10%.`,
      }
      assumptions.push(`Valor de mercado estimado por R$/m² regional (${regional.sample} comparáveis).`)
    }
  }
  if (!market && appraisalValue) {
    // Último recurso: avaliação com deságio forte (avaliação tende a ser otimista).
    market = {
      conservative: round(appraisalValue * 0.8),
      origin: 'APPRAISAL_HAIRCUT',
      originLabel: 'Avaliação com deságio',
      confidence: 30,
      note: 'Sem comparáveis suficientes: usamos a avaliação com deságio de 20%. A avaliação pode estar acima do mercado — confiança baixa.',
    }
    assumptions.push('Sem comparáveis regionais suficientes — valor de mercado derivado da avaliação (confiança baixa).')
  }

  const announcedDiscountPercent = auction.discountPercent ??
    (appraisalValue && minimumBid ? round(((appraisalValue - minimumBid) / appraisalValue) * 100) : null)

  // ── Sem lance ou sem mercado → não dá para calcular a vantagem líquida ────
  if (!minimumBid || !market) {
    return {
      currency: 'BRL', minimumBid, appraisalValue, announcedDiscountPercent,
      marketValue: market, costs: null, totalInvestment: null, netMargin: null,
      netMarginPercent: null, realDiscountPercent: null, maxRecommendedBid: null,
      targetReturnPercent: DEFAULT_TARGET_RETURN * 100,
      verdict: 'INSUFFICIENT_DATA',
      assumptions: [...assumptions, 'Dados insuficientes (lance mínimo ou valor de mercado ausente) para o Desconto Real.'],
    }
  }

  // ── Custos de arrematação ─────────────────────────────────────────────────
  const isOccupied = auction.occupation === 'OCUPADO'
  const needsReform = true // premissa conservadora: prevê reforma leve (10% do lance)
  const acq = calculateAcquisitionCosts({
    bidValue: minimumBid,
    state: auction.state || 'SP',
    isOccupied,
    needsReform,
  })
  const auctioneerCommission = minimumBid * AUCTIONEER_COMMISSION_RATE
  const safetyMargin = (minimumBid + acq.totalCosts + auctioneerCommission) * SAFETY_MARGIN_RATE
  const totalCosts = acq.totalCosts + auctioneerCommission + safetyMargin
  const totalInvestment = minimumBid + totalCosts

  const netMargin = market.conservative - totalInvestment
  const netMarginPercent = totalInvestment > 0 ? (netMargin / totalInvestment) * 100 : 0
  const realDiscountPercent = market.conservative > 0 ? (1 - totalInvestment / market.conservative) * 100 : 0

  // Lance máximo para o retorno-alvo: investimento(lance) = mercado / (1+alvo).
  // Aproxima os custos como fração ~ (custos/lance) fixa neste ponto de operação.
  const costRatio = totalInvestment / minimumBid // multiplicador lance → investimento
  const maxInvestmentForTarget = market.conservative / (1 + DEFAULT_TARGET_RETURN)
  const maxRecommendedBid = round(maxInvestmentForTarget / costRatio)

  let verdict: RealDiscountResult['verdict']
  if (netMarginPercent >= 20) verdict = 'STRONG'
  else if (netMarginPercent >= 10) verdict = 'MODERATE'
  else if (netMarginPercent >= 0) verdict = 'WEAK'
  else verdict = 'NEGATIVE'

  assumptions.push(
    `Comissão do leiloeiro ${(AUCTIONEER_COMMISSION_RATE * 100).toFixed(0)}%, margem de segurança ${(SAFETY_MARGIN_RATE * 100).toFixed(0)}%.`,
    isOccupied ? 'Imóvel ocupado — inclui custo estimado de desocupação.' : 'Imóvel considerado desocupado.',
    'Inclui reforma leve estimada em 10% do lance (premissa conservadora).',
  )

  return {
    currency: 'BRL',
    minimumBid,
    appraisalValue,
    announcedDiscountPercent,
    marketValue: market,
    costs: {
      auctioneerCommission: round(auctioneerCommission),
      itbi: round(acq.itbi),
      registry: round(acq.registry),
      notary: round(acq.notary),
      lawyer: round(acq.lawyer),
      eviction: round(acq.eviction),
      reform: round(acq.reform),
      safetyMargin: round(safetyMargin),
      totalCosts: round(totalCosts),
    },
    totalInvestment: round(totalInvestment),
    netMargin: round(netMargin),
    netMarginPercent: Math.round(netMarginPercent * 10) / 10,
    realDiscountPercent: Math.round(realDiscountPercent * 10) / 10,
    maxRecommendedBid,
    targetReturnPercent: DEFAULT_TARGET_RETURN * 100,
    verdict,
    assumptions,
  }
}
