/**
 * Mega Leilões — scraper estruturado (Fase 5).
 *
 * O megaleiloes.com.br serve HTML renderizado no servidor com cards de lote
 * consistentes (o GenericLeiloeiroScraper por regex genérico registra 0 nele).
 * Aqui parseamos os cards de verdade e alimentamos o BaseScraper — cada lote
 * entra com sourceUrl = página de detalhe, onde o desfecho ("arrematado por
 * R$ X"), a matrícula e o link do edital ficam disponíveis. Assim o lote flui
 * por todo o arquivo: snapshots (Fase 1), edital→S3 + matrícula (Fase 2),
 * captura de desfecho (Fase 3) e identidade do imóvel (Fase 4).
 */

import { BaseScraper, type ScrapedAuction } from './base-scraper.js'

const BASE = 'https://www.megaleiloes.com.br'
const LIST = `${BASE}/imoveis`

const TYPE_MAP: Record<string, string> = {
  casas: 'HOUSE', apartamentos: 'APARTMENT', terrenos: 'LAND', 'terrenos-e-lotes': 'LAND',
  comerciais: 'COMMERCIAL', 'salas-e-conjuntos': 'COMMERCIAL', galpoes: 'COMMERCIAL',
  predios: 'COMMERCIAL', lojas: 'COMMERCIAL', rurais: 'FARM', fazendas: 'FARM',
  'flats-e-lofts': 'APARTMENT', sobrados: 'HOUSE', chacaras: 'FARM',
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

function parseBR(s: string): number | undefined {
  const m = s.match(/([\d.]+,\d{2})/)
  if (!m) return undefined
  const n = Number(m[1].replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

// O leiloeiro é o Mega (auctioneerName); a `source` é a CATEGORIA jurídica,
// que o card informa ("Extrajudicial"/"Judicial"). Usa valores válidos do enum.
function mapSource(modalidade?: string): string {
  const t = (modalidade || '').toLowerCase()
  if (t.includes('extra')) return 'EXTRAJUDICIAL'
  if (t.includes('judicial')) return 'JUDICIAL'
  return 'LEILOEIRO'
}

function mapStatus(s: string): string {
  const t = s.toLowerCase()
  if (/arrematad|vendid/.test(t)) return 'SOLD'
  if (/deserto|negativo/.test(t)) return 'DESERTED'
  if (/encerrad/.test(t)) return 'CLOSED'
  if (/aberto|andamento|recebendo/.test(t)) return 'OPEN'
  return 'UPCOMING'
}

/**
 * Parser puro dos cards da listagem do Mega Leilões. Testável offline contra
 * o HTML real. Um card por `<a class="card-title">`.
 */
export function parseMegaListing(html: string): ScrapedAuction[] {
  const out: ScrapedAuction[] = []
  const cardRe = /<a class="card-title" href="([^"]+)"[^>]*>([^<]+)<\/a>/g
  const matches = [...html.matchAll(cardRe)]

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const start = m.index ?? 0
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? html.length) : html.length
    const block = html.slice(start, end)

    const detailUrl = m[1].split('?')[0]
    const title = decodeEntities(m[2])
    if (!title) continue

    const idm = detailUrl.match(/-x(\d+)/i) || block.match(/card-number[^>]*>\s*X?(\d+)/i)
    if (!idm) continue
    const externalId = `mega-${idm[1]}`

    const loc = block.match(/card-locality"[^>]*title="([^",]+),\s*([^"]+)"/i)
    const city = loc ? decodeEntities(loc[1]) : undefined
    const state = loc ? decodeEntities(loc[2]).slice(0, 2).toUpperCase() : undefined

    const st = block.match(/card-status[^>]*>\s*([^<]+)/i)
    const status = st ? mapStatus(st[1]) : 'OPEN'

    const pr = block.match(/card-price[^>]*>\s*R\$\s*([\d.]+,\d{2})/i)
    const minimumBid = pr ? parseBR(pr[1]) : undefined

    const mod = block.match(/card-instance-title"><a[^>]*>\s*([^<]+)/i)
    const modalidade = mod ? decodeEntities(mod[1]) : undefined

    const dt = block.match(/card-first-instance-date"><b>Data:<\/b>\s*(\d{2})\/(\d{2})\/(\d{4})/i)
    const auctionDate = dt ? new Date(`${dt[3]}-${dt[2]}-${dt[1]}T12:00:00Z`) : undefined

    const seg = detailUrl.match(/\/imoveis\/([a-z0-9-]+)\//i)
    const propertyType = seg ? (TYPE_MAP[seg[1].toLowerCase()] || 'HOUSE') : 'HOUSE'

    out.push({
      externalId,
      source: mapSource(modalidade),
      sourceUrl: detailUrl,
      auctioneerName: 'Mega Leilões',
      auctioneerUrl: BASE,
      title,
      city,
      state,
      status,
      modality: 'ONLINE',
      propertyType,
      minimumBid,
      auctionDate,
      metadata: modalidade ? { modalidade } : {},
    })
  }

  return out
}

export class MegaLeiloesScraper extends BaseScraper {
  private maxPages: number
  private fetchImpl: typeof fetch

  constructor(prisma: any, maxPages = 3, fetchImpl: typeof fetch = fetch) {
    super(prisma, 'MEGA_LEILOES', LIST)
    this.maxPages = maxPages
    this.fetchImpl = fetchImpl
  }

  async scrape(): Promise<ScrapedAuction[]> {
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'
    const seen = new Set<string>()
    const all: ScrapedAuction[] = []

    for (let page = 1; page <= this.maxPages; page++) {
      const url = page === 1 ? LIST : `${LIST}?pagina=${page}`
      let html = ''
      try {
        const res = await this.fetchImpl(url, { headers: { 'User-Agent': UA } })
        if (!res.ok) break
        html = await res.text()
      } catch {
        break
      }

      const items = parseMegaListing(html)
      if (!items.length) break

      let novos = 0
      for (const it of items) {
        if (seen.has(it.externalId)) continue
        seen.add(it.externalId)
        all.push(it)
        novos++
      }
      // Página sem itens novos (paginação ignorada/repetida) → para.
      if (novos === 0) break
    }

    return all
  }
}
