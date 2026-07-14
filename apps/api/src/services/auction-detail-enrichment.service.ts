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
export const ENRICHABLE_HOSTS = ['megaleiloes', 'venda-imoveis.caixa.gov.br']

const BRAZILIAN_STATES = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
])

/** Gera a URL da matrícula oficial da Caixa sem depender da página com CAPTCHA. */
export function deriveCaixaMatriculaUrl(
  sourceUrl: string | null | undefined,
  state: string | null | undefined,
  externalId?: string | null,
): string | undefined {
  const uf = state?.trim().toUpperCase()
  if (!uf || !BRAZILIAN_STATES.has(uf)) return undefined

  let propertyId = ''
  if (sourceUrl && /venda-imoveis\.caixa\.gov\.br/i.test(sourceUrl)) {
    try {
      const url = new URL(sourceUrl)
      propertyId = url.searchParams.get('hdnimovel') || url.searchParams.get('idImo') || ''
    } catch {
      const match = sourceUrl.match(/[?&](?:hdnimovel|idImo)=([^&#]+)/i)
      propertyId = match?.[1] || ''
    }
  }
  if (!propertyId && externalId && /^CAIXA[-_:]/i.test(externalId)) {
    propertyId = externalId.replace(/^CAIXA[-_:]/i, '')
  }

  const digits = propertyId.replace(/\D/g, '')
  if (!digits) return undefined
  return `https://venda-imoveis.caixa.gov.br/editais/matricula/${uf}/${digits}.pdf`
}

async function officialPdfExists(url: string, fetchImpl: typeof fetch): Promise<'yes' | 'no' | 'retry'> {
  try {
    const head = await fetchImpl(url, { method: 'HEAD', headers: { 'User-Agent': UA } })
    if (head.ok && /pdf|octet-stream/i.test(head.headers.get('content-type') || '')) return 'yes'
    if (head.status === 404) return 'no'
    if (![403, 405, 501].includes(head.status)) return 'retry'

    const probe = await fetchImpl(url, {
      method: 'GET',
      headers: { 'User-Agent': UA, Range: 'bytes=0-4' },
    })
    if (probe.ok && /pdf|octet-stream/i.test(probe.headers.get('content-type') || '')) return 'yes'
    if (probe.status === 404) return 'no'
    return 'retry'
  } catch {
    return 'retry'
  }
}

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
    select: {
      id: true, sourceUrl: true, externalId: true, state: true,
      editalUrl: true, documentsUrls: true,
    },
  })
  if (!auction?.sourceUrl) return { enriched: false }

  const caixaMatriculaUrl = deriveCaixaMatriculaUrl(auction.sourceUrl, auction.state, auction.externalId)
  if (caixaMatriculaUrl) {
    const exists = await officialPdfExists(caixaMatriculaUrl, fetchImpl)
    if (exists === 'retry') return { enriched: false }

    const previousDocs = auction.documentsUrls || []
    const mergedDocs = exists === 'yes'
      ? [...new Set([...previousDocs, caixaMatriculaUrl])]
      : previousDocs
    const changed = mergedDocs.length !== previousDocs.length
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        detailEnrichedAt: new Date(),
        ...(changed ? { documentsUrls: mergedDocs } : {}),
      },
    }).catch(() => {})
    return { enriched: changed }
  }

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
  const baseWhere = {
    detailEnrichedAt: null,
    sourceUrl: { not: null },
    OR: ENRICHABLE_HOSTS.map((h) => ({ sourceUrl: { contains: h } })),
  }
  const active = await prisma.auction.findMany({
    where: {
      ...baseWhere,
      status: { in: ['OPEN', 'UPCOMING', 'FIRST_ROUND', 'SECOND_ROUND'] },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const remaining = limit - active.length
  const historical = remaining > 0 ? await prisma.auction.findMany({
    where: {
      ...baseWhere,
      id: { notIn: active.map((a) => a.id) },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: remaining,
  }) : []
  const pending = [...active, ...historical]

  let enriched = 0
  for (let i = 0; i < pending.length; i += 10) {
    const results = await Promise.all(
      pending.slice(i, i + 10).map((a) => enrichAuctionDetail(prisma, a.id, deps)),
    )
    enriched += results.filter((r) => r.enriched).length
  }
  return { processed: pending.length, enriched }
}
