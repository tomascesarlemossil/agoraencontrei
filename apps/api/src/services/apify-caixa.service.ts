/**
 * Apify Caixa Econômica Federal Scraper Integration
 *
 * Uses the Apify actor "efraimkaov/caixa-economica-federal-imoveis"
 * Real data structure from API (verified):
 *   { price, description, image, type, rooms, edital, propertyNumber,
 *     numberItem, address, garage, url }
 *
 * Actor input: { state, city, numberOfPages, isDetailsEnable, sameDomainDelaySecs }
 *
 * Falls back to CSV scraper if Apify is unavailable or token not configured.
 */

import { env } from '../utils/env.js'

const APIFY_ACTOR_ID = 'brasil-scrapers~caixa-leiloes-api'
const APIFY_BASE = 'https://api.apify.com/v2'

/** Exact shape returned by the Caixa Apify actor */
interface ApifyCaixaRawItem {
  price: number | null
  description: string | null
  image: string | null
  type: string | null
  rooms: number | null
  edital: string | null
  propertyNumber: string | null
  numberItem: number | null
  address: string | null
  garage: number | null
  url: string | null
}

export interface CaixaApifyItem {
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
  edital: string | null
  propertyNumber: string | null
}

function extractCityFromDescription(description: string): string {
  // Format: "SAO PAULO - ITAQUERA | R$ 211.672,99"
  // or "SAO PAULO - RESIDENCIAL DAS LARANJEIRAS"
  const parts = description.split(' - ')
  if (parts.length >= 1) {
    return parts[0].trim()
  }
  return ''
}

function extractNeighborhoodFromDescription(description: string): string {
  // Format: "SAO PAULO - ITAQUERA | R$ 211.672,99"
  const parts = description.split(' - ')
  if (parts.length >= 2) {
    const afterCity = parts.slice(1).join(' - ')
    // Remove price part after |
    const beforePrice = afterCity.split('|')[0]
    return beforePrice.trim()
  }
  return ''
}

function detectPropertyType(address: string, description: string): string {
  const text = `${address} ${description}`.toLowerCase()
  if (text.includes('apto') || text.includes('apartamento')) return 'Apartamento'
  if (text.includes('casa')) return 'Casa'
  if (text.includes('terreno') || text.includes('lote')) return 'Terreno'
  if (text.includes('galpao') || text.includes('galpão')) return 'Galpão'
  if (text.includes('sala') || text.includes('comercial')) return 'Sala Comercial'
  if (text.includes('loja')) return 'Loja'
  if (text.includes('prédio') || text.includes('predio')) return 'Prédio'
  // If address contains "Apto" it's likely an apartment
  if (address.toLowerCase().includes('apto')) return 'Apartamento'
  return 'Imóvel'
}

function normalizeCaixaItem(item: ApifyCaixaRawItem, inputState?: string): CaixaApifyItem {
  const id = item.propertyNumber || `apify-${item.numberItem || Math.random().toString(36).slice(2)}`
  const description = item.description || ''
  const city = extractCityFromDescription(description)
  const neighborhood = extractNeighborhoodFromDescription(description)
  const address = item.address || ''
  const propertyType = item.type || detectPropertyType(address, description)

  return {
    id: `caixa-${id}`,
    source: 'CAIXA',
    bankName: 'Caixa Econômica Federal',
    city,
    state: inputState || 'SP',
    neighborhood,
    address,
    price: item.price || 0,
    appraisalValue: 0, // Not available in basic mode
    discount: 0,        // Not available in basic mode
    financeable: false,
    fgtsAllowed: false,
    description,
    saleType: 'Leilão Caixa',
    link: item.url || `https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=${id.replace(/-/g, '')}`,
    propertyType,
    bedrooms: item.rooms || 0,
    totalArea: 0,
    privateArea: 0,
    landArea: 0,
    parkingSpots: item.garage || 0,
    coverImageUrl: item.image || null,
    auctionDate: null,
    leiloeiro: 'Caixa Econômica Federal',
    edital: item.edital || null,
    propertyNumber: item.propertyNumber || null,
  }
}

/**
 * Run Apify actor synchronously and return dataset items.
 * Input: { state, city, numberOfPages, isDetailsEnable, sameDomainDelaySecs }
 */
export async function fetchCaixaViaApify(
  state?: string,
  city?: string,
  numberOfPages?: number
): Promise<CaixaApifyItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) {
    console.warn('[Apify Caixa] APIFY_API_TOKEN not configured, skipping')
    return []
  }

  try {
    const input = {
      state: state || 'SP',
      city: city || '',
      numberOfPages: numberOfPages || 50,
      isDetailsEnable: false,
      sameDomainDelaySecs: 1,
      proxy: { useApifyProxy: false },
    }

    const runUrl = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${token}`
    const res = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(300_000), // 5 min timeout
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'unknown')
      console.error(`[Apify Caixa] Actor run failed: ${res.status} ${errorText}`)
      return []
    }

    const rawItems = (await res.json()) as ApifyCaixaRawItem[]
    if (!Array.isArray(rawItems)) {
      console.error('[Apify Caixa] Unexpected response format')
      return []
    }

    console.log(`[Apify Caixa] Received ${rawItems.length} items from ${state || 'SP'}`)
    return rawItems.map(item => normalizeCaixaItem(item, state))
  } catch (err) {
    console.error('[Apify Caixa] Error:', err)
    return []
  }
}

/**
 * Fetch last run dataset items without triggering a new run.
 * Free — no credits consumed.
 */
export async function fetchCaixaApifyLastRun(): Promise<CaixaApifyItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) return []

  try {
    const url = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/last/dataset/items?token=${token}&status=SUCCEEDED`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return []

    const rawItems = (await res.json()) as ApifyCaixaRawItem[]
    if (!Array.isArray(rawItems)) return []

    console.log(`[Apify Caixa] Last run: ${rawItems.length} items`)
    return rawItems.map(item => normalizeCaixaItem(item))
  } catch (err) {
    console.error('[Apify Caixa] Last run fetch error:', err)
    return []
  }
}

/**
 * Fetch from a specific dataset ID directly.
 * Useful for accessing specific run results.
 */
export async function fetchCaixaFromDataset(datasetId: string): Promise<CaixaApifyItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) return []

  try {
    const url = `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return []

    const rawItems = (await res.json()) as ApifyCaixaRawItem[]
    if (!Array.isArray(rawItems)) return []

    console.log(`[Apify Caixa] Dataset ${datasetId}: ${rawItems.length} items`)
    return rawItems.map(item => normalizeCaixaItem(item))
  } catch (err) {
    console.error('[Apify Caixa] Dataset fetch error:', err)
    return []
  }
}
