/**
 * Apify Caixa Econômica Federal Scraper Integration
 *
 * Uses the Apify actor "efraimkaov/caixa-economica-federal-imoveis"
 * to get complete auction data including:
 * - Photos array, matrícula PDF, edital PDF
 * - 1st and 2nd auction dates
 * - Payment methods and expense rules
 * - Auctioneer info
 * - Property registration details
 *
 * Falls back to CSV scraper if Apify is unavailable or token not configured.
 */

import { env } from '../utils/env.js'

interface AuctionItem {
  id: string
  source: string
  bankName: string
  city: string
  state: string
  neighborhood: string
  address: string
  price: number
  appraisalValue: number
  discount: number
  financeable: boolean
  fgtsAllowed: boolean
  description: string
  saleType: string
  link: string
  propertyType: string
  bedrooms: number
  totalArea: number
  privateArea: number
  landArea: number
  parkingSpots: number
  coverImageUrl: string | null
  auctionDate: string | null
  leiloeiro: string | null
}

const APIFY_ACTOR_ID = 'efraimkaov~caixa-economica-federal-imoveis'
const APIFY_BASE = 'https://api.apify.com/v2'

interface ApifyCaixaItem {
  id?: string
  propertyNumber?: string
  city?: string
  state?: string
  district?: string
  address?: string
  evaluationValue?: number
  minimumSaleValue1?: number
  minimumSaleValue2?: number
  discount?: number
  acceptsFinancing?: boolean
  description?: string
  saleModality?: string
  link?: string
  propertyType?: string
  rooms?: number
  garage?: number
  privateArea?: number
  landArea?: number
  totalArea?: number
  registrationNumber?: string
  realEstateRegistration?: string
  auctionRecord?: string
  matriculaUrl?: string
  paymentMethods?: string
  expenseRules?: string
  notice?: string
  auctioneer?: string
  firstAuctionDate?: string
  secondAuctionDate?: string
  fotos?: string[]
  office?: string
}

export type ApifyCaixaEnrichedItem = AuctionItem & {
  matriculaUrl: string | null
  paymentMethods: string | null
  expenseRules: string | null
  noticeUrl: string | null
  firstAuctionDate: string | null
  secondAuctionDate: string | null
  photos: string[]
  registrationNumber: string | null
  realEstateRegistration: string | null
  auctionRecord: string | null
  office: string | null
}

function normalizeApifyItem(item: ApifyCaixaItem, index: number): ApifyCaixaEnrichedItem {
  const id = item.propertyNumber || item.id || `apify-${index}`
  const price = item.minimumSaleValue1 || item.minimumSaleValue2 || 0
  const appraisalValue = item.evaluationValue || 0
  const discount = item.discount
    ? item.discount
    : appraisalValue > 0
      ? ((appraisalValue - price) / appraisalValue) * 100
      : 0

  const desc = (item.description || '').toLowerCase()
  let propertyType = item.propertyType || 'Imóvel'
  if (!item.propertyType) {
    if (desc.includes('apartamento')) propertyType = 'Apartamento'
    else if (desc.includes('casa')) propertyType = 'Casa'
    else if (desc.includes('terreno') || desc.includes('lote')) propertyType = 'Terreno'
    else if (desc.includes('galpao') || desc.includes('galp')) propertyType = 'Galpão'
  }

  const fgtsMatch = desc.includes('fgts')
  const photos = item.fotos?.length ? item.fotos : [`https://venda-imoveis.caixa.gov.br/fotos-imoveis/${id}_1.jpg`]

  return {
    id: `caixa-${id}`,
    source: 'CAIXA',
    bankName: 'Caixa Econômica Federal',
    city: item.city || '',
    state: item.state || '',
    neighborhood: item.district || '',
    address: item.address || '',
    price,
    appraisalValue,
    discount: Math.round(discount * 100) / 100,
    financeable: !!item.acceptsFinancing,
    fgtsAllowed: fgtsMatch,
    description: item.description || `${propertyType} em ${item.city}/${item.state}`,
    saleType: item.saleModality || 'Venda Direta',
    link: item.link || `https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=${id}`,
    propertyType,
    bedrooms: item.rooms || 0,
    totalArea: item.totalArea || 0,
    privateArea: item.privateArea || 0,
    landArea: item.landArea || 0,
    parkingSpots: item.garage || 0,
    coverImageUrl: photos[0] || null,
    auctionDate: item.firstAuctionDate || item.secondAuctionDate || null,
    leiloeiro: item.auctioneer || 'Caixa Econômica Federal',
    // Enriched fields
    matriculaUrl: item.matriculaUrl || null,
    paymentMethods: item.paymentMethods || null,
    expenseRules: item.expenseRules || null,
    noticeUrl: item.notice || null,
    firstAuctionDate: item.firstAuctionDate || null,
    secondAuctionDate: item.secondAuctionDate || null,
    photos,
    registrationNumber: item.registrationNumber || null,
    realEstateRegistration: item.realEstateRegistration || null,
    auctionRecord: item.auctionRecord || null,
    office: item.office || null,
  }
}

/**
 * Run Apify actor synchronously and return dataset items.
 * Uses sync run with a 120s timeout — the actor scrapes Caixa's public listing.
 */
export async function fetchCaixaViaApify(states?: string[]): Promise<ApifyCaixaEnrichedItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) {
    console.warn('[Apify Caixa] APIFY_API_TOKEN not configured, skipping')
    return []
  }

  try {
    // Run actor synchronously — returns dataset items directly
    const input: Record<string, unknown> = {}
    if (states?.length) {
      input.states = states
    }

    const runUrl = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${token}`
    const res = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(180_000), // 3 min timeout for full scrape
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'unknown')
      console.error(`[Apify Caixa] Actor run failed: ${res.status} ${errorText}`)
      return []
    }

    const rawItems = (await res.json()) as ApifyCaixaItem[]
    if (!Array.isArray(rawItems)) {
      console.error('[Apify Caixa] Unexpected response format')
      return []
    }

    console.log(`[Apify Caixa] Received ${rawItems.length} items`)
    return rawItems.map((item, i) => normalizeApifyItem(item, i))
  } catch (err) {
    console.error('[Apify Caixa] Error:', err)
    return []
  }
}

/**
 * Fetch last run dataset items without triggering a new run.
 * Useful for getting cached/recent results without burning Apify credits.
 */
export async function fetchCaixaApifyLastRun(): Promise<ApifyCaixaEnrichedItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) return []

  try {
    const url = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/last/dataset/items?token=${token}&status=SUCCEEDED`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return []

    const rawItems = (await res.json()) as ApifyCaixaItem[]
    if (!Array.isArray(rawItems)) return []

    console.log(`[Apify Caixa] Last run: ${rawItems.length} items`)
    return rawItems.map((item, i) => normalizeApifyItem(item, i))
  } catch (err) {
    console.error('[Apify Caixa] Last run fetch error:', err)
    return []
  }
}
