/**
 * Auction Outcome Service — captura do desfecho do leilão ("arrematado por quanto").
 *
 * Quando um leilão sai da listagem da fonte (disappearedAt) ou sua data passa, a
 * página de detalhe do lote (sourceUrl) normalmente sobrevive mais tempo e passa
 * a exibir o resultado: "ARREMATADO por R$ X", "VENDIDO", "DESERTO", "REVOGADO".
 * Re-visitamos essa página e extraímos o desfecho — abordagem genérica que cobre
 * a maioria dos leiloeiros sem scraper de listagem site-a-site.
 *
 * LGPD: capturamos apenas o VALOR do arremate (dado público). Nome/CPF do
 * arrematante NÃO são persistidos.
 */

import type { PrismaClient } from '@prisma/client'

export type Outcome = 'SOLD' | 'DESERTED' | 'CANCELLED' | 'INCONCLUSIVE'

export interface OutcomeDeps {
  fetchImpl?: typeof fetch
}

const MAX_ATTEMPTS = 5

/** Converte "250.000,00" / "R$ 1.250.000,50" em número. */
export function parseBRCurrency(s: string): number | null {
  const m = s.match(/([\d.]+,\d{2})/)
  if (!m) return null
  const n = Number(m[1].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Extrai o desfecho de um texto/HTML da página do lote. Determinístico e testável.
 * Prioridade: arrematado > deserto > cancelado/revogado.
 */
export function parseOutcome(text: string): { status: Outcome; soldValue?: number } {
  if (!text) return { status: 'INCONCLUSIVE' }
  const t = text.replace(/\s+/g, ' ')

  // Arrematado / vendido — tenta capturar o valor próximo do marcador.
  if (/arrematad[oa]|arremata[çc][ãa]o\s+(?:realizada|conclu[íi]da)|lote\s+vendid[oa]|\bvendid[oa]\b/i.test(t)) {
    // "arrematado por R$ 250.000,00" (valor após o marcador)
    // Obs.: não usar [^R$] com a flag /i — ela também exclui o 'r' minúsculo
    // (ex.: "por"), cortando o match antes do "R$". Usamos quantificador lazy.
    let soldValue: number | null = null
    const near = t.match(/(?:arrematad[oa]|vendid[oa]|arremata[çc][ãa]o)[\s\S]{0,60}?R\$\s*([\d.]+,\d{2})/i)
    if (near) soldValue = parseBRCurrency(near[1])
    // fallback: "valor da arrematação: R$ X" / "lance vencedor R$ X"
    if (soldValue == null) {
      const alt = t.match(/(?:valor\s+d[ae]\s+arremata[çc][ãa]o|lance\s+vencedor|valor\s+arrematad[oa])[\s\S]{0,30}?R\$\s*([\d.]+,\d{2})/i)
      if (alt) soldValue = parseBRCurrency(alt[1])
    }
    return soldValue != null ? { status: 'SOLD', soldValue } : { status: 'SOLD' }
  }

  if (/\bdeserto\b|leil[ãa]o\s+negativo|sem\s+lances?|n[ãa]o\s+houve\s+lance/i.test(t)) {
    return { status: 'DESERTED' }
  }

  if (/\brevogad[oa]\b|\bcancelad[oa]\b|leil[ãa]o\s+suspenso|\bsobrestad[oa]\b/i.test(t)) {
    return { status: 'CANCELLED' }
  }

  return { status: 'INCONCLUSIVE' }
}

/**
 * Re-visita o sourceUrl de um leilão e captura o desfecho. Best-effort:
 * conclusivo → grava status/soldValue/soldDate + snapshot + lance vencedor;
 * inconclusivo → incrementa outcomeAttempts (limite anti-hammer).
 */
export async function captureAuctionOutcome(
  prisma: PrismaClient,
  auctionId: string,
  deps: OutcomeDeps = {},
): Promise<{ outcome: Outcome; soldValue?: number }> {
  const fetchImpl = deps.fetchImpl || fetch
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { id: true, sourceUrl: true, soldValue: true, currentBid: true, status: true },
  })
  if (!auction) return { outcome: 'INCONCLUSIVE' }

  const bumpAttempt = () =>
    prisma.auction.update({ where: { id: auctionId }, data: { outcomeAttempts: { increment: 1 } } }).catch(() => {})

  if (!auction.sourceUrl) { await bumpAttempt(); return { outcome: 'INCONCLUSIVE' } }

  let text = ''
  try {
    const res = await fetchImpl(auction.sourceUrl)
    if (!res.ok) { await bumpAttempt(); return { outcome: 'INCONCLUSIVE' } }
    text = await res.text()
  } catch {
    await bumpAttempt()
    return { outcome: 'INCONCLUSIVE' }
  }

  const parsed = parseOutcome(text)
  if (parsed.status === 'INCONCLUSIVE') { await bumpAttempt(); return { outcome: 'INCONCLUSIVE' } }

  const now = new Date()
  const fallbackValue = Number(auction.soldValue ?? auction.currentBid ?? 0) || undefined
  const soldValue = parsed.status === 'SOLD' ? (parsed.soldValue ?? fallbackValue) : undefined

  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      status: parsed.status as any,
      outcomeCapturedAt: now,
      outcomeAttempts: { increment: 1 },
      ...(parsed.status === 'SOLD' && soldValue ? { soldValue, soldDate: now } : {}),
    },
  }).catch(() => {})

  // Snapshot do desfecho na linha do tempo histórica (best-effort).
  await prisma.auctionSnapshot.create({
    data: {
      auctionId,
      status: parsed.status,
      soldValue: parsed.status === 'SOLD' ? soldValue : undefined,
      raw: { outcome: parsed.status, source: 'sourceUrl-refetch' },
    },
  }).catch(() => {})

  // Lance vencedor (só o valor — sem dados pessoais do arrematante).
  if (parsed.status === 'SOLD' && soldValue) {
    const hasWinning = await prisma.auctionBid.findFirst({ where: { auctionId, isWinning: true } }).catch(() => null)
    if (!hasWinning) {
      await prisma.auctionBid.create({
        data: { auctionId, round: 2, bidValue: soldValue, isWinning: true, bidDate: now, metadata: { source: 'outcome-capture' } },
      }).catch(() => {})
    }
  }

  // Congela a análise no encerramento (registro imutável do mercado da época).
  try {
    const { captureAnalysisSnapshot } = await import('./auction-analysis-snapshot.service.js')
    await captureAnalysisSnapshot(prisma, auctionId, now)
  } catch { /* best-effort */ }

  return { outcome: parsed.status, soldValue }
}

/**
 * Passe agendado: tenta capturar o desfecho de leilões que saíram da fonte ou
 * cuja data passou e ainda não têm desfecho conclusivo. Limitado + sequencial.
 */
export async function runAuctionOutcomeBatch(
  prisma: PrismaClient,
  limit = 20,
  deps: OutcomeDeps = {},
): Promise<{ processed: number; sold: number; deserted: number }> {
  const now = new Date()
  const pending = await prisma.auction.findMany({
    where: {
      sourceUrl: { not: null },
      outcomeCapturedAt: null,
      outcomeAttempts: { lt: MAX_ATTEMPTS },
      status: { notIn: ['SOLD', 'DESERTED', 'CANCELLED'] },
      OR: [{ disappearedAt: { not: null } }, { auctionDate: { lt: now } }],
    },
    select: { id: true },
    orderBy: { disappearedAt: 'desc' },
    take: limit,
  })

  let sold = 0, deserted = 0
  for (const a of pending) {
    const r = await captureAuctionOutcome(prisma, a.id, deps)
    if (r.outcome === 'SOLD') sold++
    else if (r.outcome === 'DESERTED') deserted++
  }
  return { processed: pending.length, sold, deserted }
}
