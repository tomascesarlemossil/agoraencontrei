/**
 * Auction Detail Enrichment — descobre editalUrl/documentos na página de detalhe
 * do lote enquanto ele ainda está no ar.
 *
 * A listagem não traz o link do edital; a página de detalhe sim. Aqui buscamos
 * o sourceUrl (detalhe) e extraímos os PDFs públicos (edital, matrícula, laudo),
 * preenchendo editalUrl/documentsUrls. Isso alimenta a Fase 2 (arquivar no S3 +
 * extrair matrícula) sem esperar o leilão fechar.
 *
 * Best-effort e por-host: cada leiloeiro tem seu parser de detalhe.
 */

import type { PrismaClient } from '@prisma/client'

export interface EnrichmentDeps {
  fetchImpl?: typeof fetch
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'

/** Parser de detalhe do Mega Leilões — extrai os PDFs públicos do lote. */
export function parseMegaDetail(html: string): { editalUrl?: string; documentsUrls: string[] } {
  const pdfs = [...html.matchAll(/https:\/\/cdn\d*\.megaleiloes\.com\.br\/[^\s"'<>]+\.pdf/gi)].map((m) => m[0])
  const uniq = [...new Set(pdfs)]
  // Só documentos do lote (edital, matrícula, laudo/avaliação); exclui institucionais.
  const docs = uniq.filter((u) => /(edital|matricula|laudo|avalia)/i.test(u) && !/politica|privacidade/i.test(u))
  const editalUrl = docs.find((u) => /edital/i.test(u))
  return { editalUrl, documentsUrls: docs }
}

interface DetailParser {
  match: RegExp
  parse: (html: string) => { editalUrl?: string; documentsUrls: string[] }
}

// Registro de parsers por host. Extensível para outros leiloeiros SSR.
const DETAIL_PARSERS: DetailParser[] = [
  { match: /megaleiloes\.com\.br/i, parse: parseMegaDetail },
]

/** Filtro Prisma dos leilões que têm parser de detalhe conhecido. */
export const ENRICHABLE_HOSTS = ['megaleiloes']

/**
 * Enriquece um leilão a partir da página de detalhe: descobre editalUrl e
 * documentos. Marca detailEnrichedAt quando a página carrega (evita re-tentar
 * à toa); em falha de rede, deixa para a próxima rodada.
 */
export async function enrichAuctionDetail(
  prisma: PrismaClient,
  auctionId: string,
  deps: EnrichmentDeps = {},
): Promise<{ enriched: boolean }> {
  const fetchImpl = deps.fetchImpl || fetch
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: { id: true, sourceUrl: true, editalUrl: true, documentsUrls: true },
  })
  if (!auction?.sourceUrl) return { enriched: false }

  const parser = DETAIL_PARSERS.find((p) => p.match.test(auction.sourceUrl!))
  if (!parser) {
    await prisma.auction.update({ where: { id: auctionId }, data: { detailEnrichedAt: new Date() } }).catch(() => {})
    return { enriched: false }
  }

  let html = ''
  try {
    const res = await fetchImpl(auction.sourceUrl, { headers: { 'User-Agent': UA } })
    if (!res.ok) return { enriched: false } // rede falhou → tenta de novo depois
    html = await res.text()
  } catch {
    return { enriched: false }
  }

  const { editalUrl, documentsUrls } = parser.parse(html)
  const mergedDocs = [...new Set([...(auction.documentsUrls || []), ...documentsUrls])]
  const data: Record<string, unknown> = { detailEnrichedAt: new Date() }
  if (!auction.editalUrl && editalUrl) data.editalUrl = editalUrl
  if (mergedDocs.length !== (auction.documentsUrls || []).length) data.documentsUrls = mergedDocs

  await prisma.auction.update({ where: { id: auctionId }, data }).catch(() => {})
  return { enriched: !!(data.editalUrl || data.documentsUrls) }
}

/**
 * Passe agendado: enriquece leilões de leiloeiros com parser de detalhe que
 * ainda não foram enriquecidos. Limitado + sequencial.
 */
export async function runDetailEnrichmentBatch(
  prisma: PrismaClient,
  limit = 30,
  deps: EnrichmentDeps = {},
): Promise<{ processed: number; enriched: number }> {
  const pending = await prisma.auction.findMany({
    where: {
      detailEnrichedAt: null,
      sourceUrl: { not: null },
      OR: ENRICHABLE_HOSTS.map((h) => ({ sourceUrl: { contains: h } })),
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  let enriched = 0
  for (const a of pending) {
    const r = await enrichAuctionDetail(prisma, a.id, deps)
    if (r.enriched) enriched++
  }
  return { processed: pending.length, enriched }
}
