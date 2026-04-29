/**
 * Apify Zuk Leilões Scraper Integration
 *
 * Zuk (portalzuk.com.br) is a multi-bank leilão portal that aggregates
 * auctions from Bradesco, Santander, Sicoob, Creditas, judicial auctions,
 * and more. The portal is a JS-rendered SPA so a raw HTML fetch returns
 * almost nothing — we hit the Apify actor that renders the page.
 *
 * Configure with APIFY_ZUK_ACTOR_ID; falls back to a sensible default.
 */

import type { PrismaClient } from '@prisma/client'
import { env } from '../utils/env.js'

const APIFY_ACTOR_ID = process.env.APIFY_ZUK_ACTOR_ID || 'brasil-scrapers~portalzuk-leiloes'
const APIFY_BASE = 'https://api.apify.com/v2'

interface ZukAuctionRound {
  label?: string | null            // "1º leilão" | "2º leilão" | "Valor"
  value?: string | null            // "R$ 435.255,85"
  date?: string | null             // "29/04/2026 às 11:11"
  percentDiscount?: string | null  // "39"
}

interface ApifyZukItem {
  url?: string | null
  title?: string | null
  image?: string | null
  type?: string | null               // "Casa" | "Apartamento" | "Terreno" ...
  occupancyStatus?: string | null    // "Desocupado" | null
  city?: string | null
  state?: string | null
  neighborhood?: string | null
  street?: string | null
  number?: string | null
  beds?: string | number | null
  baths?: string | number | null
  area?: string | null               // "156,97m² construída"
  auctions?: ZukAuctionRound[]
}

export interface ZukAuctionItem {
  id: string
  source: string
  bankName: string | null
  auctioneerName: string
  city: string
  state: string
  neighborhood: string | null
  street: string | null
  number: string | null
  address: string
  title: string
  propertyType: string
  occupation: string | null
  totalArea: number | null
  bedrooms: number
  firstRoundBid: number | null
  secondRoundBid: number | null
  appraisalValue: number | null
  minimumBid: number | null
  discount: number | null
  firstRoundDate: string | null
  secondRoundDate: string | null
  auctionDate: string | null
  link: string
  coverImageUrl: string | null
}

const MES_PT = ['', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

function parseBrPrice(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return null
  const cleaned = v.replace(/[R$\s.]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

function parseBrDate(v: string | null | undefined): Date | null {
  if (!v) return null
  // "29/04/2026 às 11:11"
  const m = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*às\s*(\d{1,2}):(\d{2}))?/)
  if (!m) return null
  const day = m[1].padStart(2, '0')
  const month = MES_PT[parseInt(m[2], 10)] ?? '01'
  const year = m[3]
  const hh = (m[4] || '00').padStart(2, '0')
  const mm = (m[5] || '00').padStart(2, '0')
  const iso = `${year}-${month}-${day}T${hh}:${mm}:00-03:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function parseArea(v: string | null | undefined): number | null {
  if (!v) return null
  // "156,97m² construída" | "32,33ha terreno" | "76.762,40m² terreno"
  const isHectare = /\bha\b/i.test(v)
  const m = v.match(/([\d.,]+)/)
  if (!m) return null
  const num = parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
  if (!Number.isFinite(num)) return null
  return isHectare ? num * 10000 : num
}

function parseInteger(v: string | number | null | undefined): number {
  if (v == null) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : 0
  const n = parseInt(String(v).replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

function inferBankFromTitle(title: string): string | null {
  const t = title.toLowerCase()
  if (t.includes('bradesco')) return 'Bradesco'
  if (t.includes('santander')) return 'Santander'
  if (t.includes('itaú') || t.includes('itau')) return 'Itaú'
  if (t.includes('caixa')) return 'Caixa Econômica Federal'
  if (t.includes('banco do brasil')) return 'Banco do Brasil'
  if (t.includes('sicoob')) return 'Sicoob'
  if (t.includes('creditas')) return 'Creditas'
  if (t.includes('tribunal')) return null
  return null
}

function inferSource(title: string): 'BRADESCO' | 'SANTANDER' | 'ITAU' | 'CAIXA' | 'BANCO_DO_BRASIL' | 'JUDICIAL' | 'LEILOEIRO' {
  const t = title.toLowerCase()
  if (t.includes('bradesco')) return 'BRADESCO'
  if (t.includes('santander')) return 'SANTANDER'
  if (t.includes('itaú') || t.includes('itau')) return 'ITAU'
  if (t.includes('caixa')) return 'CAIXA'
  if (t.includes('banco do brasil')) return 'BANCO_DO_BRASIL'
  if (t.includes('tribunal') || t.includes('justiça') || t.includes('justica')) return 'JUDICIAL'
  return 'LEILOEIRO'
}

function normalizeZukItem(item: ApifyZukItem): ZukAuctionItem | null {
  if (!item.url || !item.city) return null

  const rounds = Array.isArray(item.auctions) ? item.auctions : []
  // Round labels seen in Zuk: "1º leilão", "2º leilão", "Valor" (venda direta)
  const round1 = rounds.find(r => /1\s*º|primeiro/i.test(r?.label || ''))
  const round2 = rounds.find(r => /2\s*º|segundo/i.test(r?.label || ''))
  const direct = rounds.find(r => /valor/i.test(r?.label || ''))

  const firstRoundBid = parseBrPrice(round1?.value)
  const secondRoundBid = parseBrPrice(round2?.value)
  const directValue = parseBrPrice(direct?.value)

  // Appraisal = highest of round1/direct (Zuk uses round1 as the avaliação when there is a 2º leilão)
  const appraisalValue = firstRoundBid ?? directValue
  // Minimum bid = active round (2º if present and discounted, else 1º or direct)
  const minimumBid = secondRoundBid ?? directValue ?? firstRoundBid

  const discountStr = round2?.percentDiscount ?? direct?.percentDiscount
  const discount = discountStr ? parseFloat(String(discountStr)) : null

  const firstRoundDate = round1?.date || null
  const secondRoundDate = round2?.date || null
  const auctionDate = secondRoundDate || firstRoundDate || direct?.date || null

  const title = item.title || `Imóvel em leilão ${item.city}/${item.state || ''}`.trim()
  const externalIdMatch = item.url.match(/\/(\d+-\d+)$/)
  const externalId = externalIdMatch ? externalIdMatch[1] : item.url.split('/').filter(Boolean).pop() || `zuk-${Date.now()}`

  const street = item.street || ''
  const number = item.number || ''
  const neighborhood = item.neighborhood || ''
  const address = [street, number, neighborhood, item.city, item.state]
    .filter(Boolean)
    .join(', ')

  return {
    id: `zuk-${externalId}`,
    source: inferSource(title),
    bankName: inferBankFromTitle(title),
    auctioneerName: 'Zuk Leilões',
    city: item.city,
    state: item.state || 'SP',
    neighborhood: neighborhood || null,
    street: street || null,
    number: number || null,
    address,
    title: title.slice(0, 200),
    propertyType: item.type || 'Imóvel',
    occupation: item.occupancyStatus || null,
    totalArea: parseArea(item.area || null),
    bedrooms: parseInteger(item.beds),
    firstRoundBid,
    secondRoundBid,
    appraisalValue,
    minimumBid,
    discount,
    firstRoundDate,
    secondRoundDate,
    auctionDate,
    link: item.url,
    coverImageUrl: item.image || null,
  }
}

function mapPropertyType(raw: string): 'HOUSE' | 'APARTMENT' | 'LAND' | 'WAREHOUSE' | 'OFFICE' | 'STORE' | 'FARM' {
  const t = (raw || '').toLowerCase()
  if (t.includes('apartamento') || t.includes('flat')) return 'APARTMENT'
  if (t.includes('terreno') || t.includes('lote') || t.includes('vaga')) return 'LAND'
  if (t.includes('chácara') || t.includes('chacara') || t.includes('sítio') || t.includes('sitio') || t.includes('fazenda')) return 'FARM'
  if (t.includes('galp')) return 'WAREHOUSE'
  if (t.includes('sala') || t.includes('comercial')) return 'OFFICE'
  if (t.includes('loja')) return 'STORE'
  return 'HOUSE'
}

/**
 * Fetch the latest successful Zuk Apify dataset without burning credits.
 */
export async function fetchZukApifyLastRun(): Promise<ZukAuctionItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) return []

  try {
    const url = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/last/dataset/items?token=${token}&status=SUCCEEDED`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) {
      console.warn(`[Apify Zuk] Last run fetch ${res.status}`)
      return []
    }

    const raw = (await res.json()) as ApifyZukItem[]
    if (!Array.isArray(raw)) return []

    const normalized = raw.map(normalizeZukItem).filter((i): i is ZukAuctionItem => i !== null)
    console.log(`[Apify Zuk] Last run: ${raw.length} raw → ${normalized.length} normalizados`)
    return normalized
  } catch (err) {
    console.error('[Apify Zuk] Error:', err)
    return []
  }
}

/**
 * Trigger a fresh Zuk scrape (consumes Apify credits).
 */
export async function fetchZukViaApify(): Promise<ZukAuctionItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) return []

  try {
    const runUrl = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${token}`
    const res = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(180_000),
    })

    if (!res.ok) {
      console.error(`[Apify Zuk] Run failed ${res.status}`)
      return []
    }

    const raw = (await res.json()) as ApifyZukItem[]
    if (!Array.isArray(raw)) return []

    const normalized = raw.map(normalizeZukItem).filter((i): i is ZukAuctionItem => i !== null)
    console.log(`[Apify Zuk] Fresh run: ${raw.length} raw → ${normalized.length} normalizados`)
    return normalized
  } catch (err) {
    console.error('[Apify Zuk] Error:', err)
    return []
  }
}

/**
 * Persist Zuk Apify items into the auctions table.
 * Slug pattern: `zuk-<externalId>` so the same row keeps getting upserted
 * across runs (no duplicates when round dates change).
 */
export async function persistApifyZukItems(
  prisma: PrismaClient,
  items: ZukAuctionItem[],
): Promise<{ found: number; created: number; updated: number; errors: string[] }> {
  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const item of items) {
    const externalId = item.id.replace(/^zuk-/, '')
    const slug = `zuk-${externalId}`
    try {
      const firstDate = parseBrDate(item.firstRoundDate)
      const secondDate = parseBrDate(item.secondRoundDate)
      const auctionDate = secondDate || firstDate || parseBrDate(item.auctionDate)

      const data = {
        source: item.source as any,
        externalId,
        title: item.title,
        propertyType: mapPropertyType(item.propertyType),
        status: 'OPEN' as const,
        modality: 'ONLINE' as const,
        city: item.city || null,
        state: item.state || null,
        neighborhood: item.neighborhood,
        street: item.street,
        number: item.number,
        bedrooms: item.bedrooms || 0,
        totalArea: item.totalArea,
        minimumBid: item.minimumBid,
        appraisalValue: item.appraisalValue,
        firstRoundBid: item.firstRoundBid,
        secondRoundBid: item.secondRoundBid,
        firstRoundDate: firstDate,
        secondRoundDate: secondDate,
        auctionDate,
        discountPercent: item.discount,
        bankName: item.bankName,
        auctioneerName: item.auctioneerName,
        auctioneerUrl: 'https://www.portalzuk.com.br',
        sourceUrl: item.link,
        coverImage: item.coverImageUrl,
        occupation: item.occupation,
        lastScrapedAt: new Date(),
      }

      const result = await prisma.auction.upsert({
        where: { slug },
        create: { slug, ...data },
        update: { ...data, updatedAt: new Date() },
      })
      if (result.createdAt.getTime() === result.updatedAt.getTime()) created++
      else updated++
    } catch (err: any) {
      errors.push(`${slug}: ${err.message}`)
    }
  }

  return { found: items.length, created, updated, errors }
}
