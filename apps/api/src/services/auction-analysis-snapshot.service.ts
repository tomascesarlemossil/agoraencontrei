/**
 * Snapshot histórico da análise (plano §6/§33 + pedido do usuário).
 *
 * Congela a análise de um leilão (Desconto Real AE, comparáveis, Nota AE) no
 * momento do encerramento, para o histórico refletir o mercado da ÉPOCA e não o
 * atual. Depois de arrematado/deserto, os comparáveis mudam com o tempo — o
 * snapshot preserva o retrato do dia em que o leilão terminou.
 *
 * Reaproveita os serviços de análise já existentes. Best-effort e idempotente.
 */

import type { PrismaClient } from '@prisma/client'
import { computeRealDiscount } from './auction-real-discount.service.js'
import { findComparables } from './auction-comparables.service.js'
import { computeAgoraScore } from './auction-score.service.js'

export interface AnalysisSnapshot {
  realDiscount: unknown
  comparables: unknown
  agoraScore: unknown
  capturedAt: string
}

/** Computa a análise completa de um leilão (sem gravar). */
export async function computeAnalysisSnapshot(
  prisma: PrismaClient,
  auctionId: string,
  now: Date = new Date(),
): Promise<AnalysisSnapshot | null> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true, city: true, state: true, neighborhood: true, propertyType: true,
      latitude: true, longitude: true, totalArea: true, builtArea: true, landArea: true,
      appraisalValue: true, minimumBid: true, marketPriceEstimate: true,
      occupation: true, discountPercent: true, financingAvailable: true, fgtsAllowed: true,
      editalUrl: true, documentsUrls: true, registryNumber: true,
    },
  })
  if (!auction) return null

  const comparables = await findComparables(prisma, {
    id: auction.id, city: auction.city, state: auction.state,
    neighborhood: auction.neighborhood, propertyType: auction.propertyType,
    latitude: auction.latitude, longitude: auction.longitude,
    totalArea: auction.totalArea, builtArea: auction.builtArea, landArea: auction.landArea,
    appraisalValue: auction.appraisalValue ? Number(auction.appraisalValue) : null,
    minimumBid: auction.minimumBid ? Number(auction.minimumBid) : null,
    discountPercent: auction.discountPercent,
  }).catch(() => null)

  const marketOverride = comparables?.marketEstimate
    ? {
        conservative: comparables.marketEstimate.conservative,
        confidence: comparables.marketEstimate.confidence,
        pricePerM2: comparables.marketEstimate.pricePerM2,
        sampleSize: comparables.marketEstimate.sampleSize,
        originLabel: `Comparáveis da região (${comparables.marketEstimate.sampleSize} imóveis)`,
        note: comparables.marketEstimate.note,
      }
    : null

  const realDiscount = await computeRealDiscount(prisma, {
    city: auction.city, state: auction.state, propertyType: auction.propertyType,
    totalArea: auction.totalArea, builtArea: auction.builtArea, landArea: auction.landArea,
    appraisalValue: auction.appraisalValue ? Number(auction.appraisalValue) : null,
    minimumBid: auction.minimumBid ? Number(auction.minimumBid) : null,
    marketPriceEstimate: auction.marketPriceEstimate ? Number(auction.marketPriceEstimate) : null,
    occupation: auction.occupation, discountPercent: auction.discountPercent,
  }, marketOverride).catch(() => null)

  const agoraScore = computeAgoraScore(
    {
      occupation: auction.occupation,
      financingAvailable: auction.financingAvailable,
      fgtsAllowed: auction.fgtsAllowed,
      hasEdital: !!auction.editalUrl || (auction.documentsUrls || []).some((u) => /edital/i.test(u)),
      hasMatricula: (auction.documentsUrls || []).some((u) => /matricula/i.test(u)),
      hasRegistryNumber: !!auction.registryNumber,
    },
    realDiscount,
    comparables,
  )

  return { realDiscount, comparables, agoraScore, capturedAt: now.toISOString() }
}

/**
 * Grava o snapshot da análise no leilão, se ainda não houver um. Idempotente:
 * não sobrescreve um snapshot já registrado (o registro é imutável).
 */
export async function captureAnalysisSnapshot(
  prisma: PrismaClient,
  auctionId: string,
  now: Date = new Date(),
): Promise<{ captured: boolean }> {
  const existing = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { analysisSnapshotAt: true },
  })
  if (!existing) return { captured: false }
  if (existing.analysisSnapshotAt) return { captured: false } // já registrado

  const snapshot = await computeAnalysisSnapshot(prisma, auctionId, now)
  if (!snapshot) return { captured: false }

  await prisma.auction.update({
    where: { id: auctionId },
    data: { analysisSnapshot: snapshot as any, analysisSnapshotAt: now },
  }).catch(() => {})
  return { captured: true }
}

/**
 * Backfill: congela a análise de leilões já encerrados/arrematados que ainda não
 * têm snapshot. Bounded — throttle natural por rodada. (Retrato aproximado, já
 * que o encerramento pode ter sido antes; melhor que nada para o acervo antigo.)
 */
export async function runAnalysisSnapshotBacklog(
  prisma: PrismaClient,
  limit = 15,
  now: Date = new Date(),
): Promise<{ processed: number; captured: number }> {
  const pending = await prisma.auction.findMany({
    where: {
      status: { in: ['SOLD', 'DESERTED', 'CLOSED', 'SUSPENDED'] },
      analysisSnapshotAt: null,
    },
    select: { id: true },
    orderBy: { soldDate: 'desc' },
    take: limit,
  })
  let captured = 0
  for (const a of pending) {
    const r = await captureAnalysisSnapshot(prisma, a.id, now).catch(() => ({ captured: false }))
    if (r.captured) captured++
  }
  return { processed: pending.length, captured }
}
