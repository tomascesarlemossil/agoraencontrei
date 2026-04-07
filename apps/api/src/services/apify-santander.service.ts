/**
 * Apify Santander Imóveis Scraper Integration
 *
 * Uses the Apify actor for Santander real estate properties.
 * Returns enriched data including:
 * - Multiple photos (imageUrls array)
 * - Matrícula numbers, RGI, inscrição municipal
 * - Occupation status (Ocupado/Desocupado)
 * - Condomínio value
 * - Cartório (registry office) info
 */

import { env } from '../utils/env.js'

const APIFY_ACTOR_ID = 'gqjg9RZsLWXjy9c3u' // Santander Imóveis API
const APIFY_BASE = 'https://api.apify.com/v2'

interface ApifySantanderItem {
  url?: string
  titulo?: string
  codigo?: string
  endereco?: string
  valorAvaliado?: number
  valorVenda?: number
  desagio?: number | string
  ocupacao?: string
  matriculas?: string
  rgi?: string
  inscricaoPrefeitura?: string
  condominio?: number | string | null
  dataLeilao?: string
  imageUrls?: string[]
  urlLeiloeiro?: string | null
}

interface SantanderAuctionItem {
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
  photos: string[]
  occupation: string | null
  matriculas: string | null
  rgi: string | null
  inscricaoMunicipal: string | null
  condominioValue: number | null
}

function extractCityState(url: string): { city: string; state: string } {
  // URL format: .../imovel/tipo-a-venda-na-rua-xxx-cidade-estado-.../
  const parts = url.split('/')
  const slug = parts[parts.length - 2] || ''
  // Try to extract state (2 letter code before last segment)
  const stateMatch = slug.match(/-([a-z]{2})-codigo-/i)
  const state = stateMatch ? stateMatch[1].toUpperCase() : 'SP'

  // Try to extract city from slug
  const cityMatch = slug.match(/-([a-z-]+)-[a-z]{2}-codigo-/i)
  const city = cityMatch
    ? cityMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : ''

  return { city, state }
}

function normalizePropertyType(titulo: string): string {
  const t = titulo.toLowerCase()
  if (t.includes('apartamento')) return 'Apartamento'
  if (t.includes('casa')) return 'Casa'
  if (t.includes('terreno') || t.includes('lote')) return 'Terreno'
  if (t.includes('sala comercial') || t.includes('sala')) return 'Sala Comercial'
  if (t.includes('loja')) return 'Loja'
  if (t.includes('galpão') || t.includes('galpao')) return 'Galpão'
  if (t.includes('prédio') || t.includes('predio')) return 'Prédio'
  if (t.startsWith('ex-')) return 'Comercial'
  return 'Imóvel'
}

function normalizeSantanderItem(item: ApifySantanderItem): SantanderAuctionItem {
  const id = item.codigo || `sant-${Date.now()}`
  const { city, state } = item.url ? extractCityState(item.url) : { city: '', state: 'SP' }
  const price = item.valorVenda || 0
  const appraisalValue = item.valorAvaliado || 0
  const discount = typeof item.desagio === 'string'
    ? parseFloat(item.desagio.replace('%', '')) || 0
    : item.desagio || 0
  const photos = item.imageUrls?.length ? item.imageUrls : []
  const condominioValue = item.condominio
    ? (typeof item.condominio === 'string'
      ? parseFloat(item.condominio.replace(/[^\d,.]/g, '').replace(',', '.')) || null
      : item.condominio)
    : null

  return {
    id: `santander-${id}`,
    source: 'SANTANDER',
    bankName: 'Santander',
    city,
    state,
    neighborhood: '',
    address: item.endereco || '',
    price,
    appraisalValue,
    discount,
    financeable: false,
    fgtsAllowed: false,
    description: item.titulo || `Imóvel Santander em ${city}/${state}`,
    saleType: 'Venda Direta',
    link: item.url || '',
    propertyType: normalizePropertyType(item.titulo || ''),
    bedrooms: 0,
    totalArea: 0,
    privateArea: 0,
    landArea: 0,
    parkingSpots: 0,
    coverImageUrl: photos[0] || null,
    auctionDate: item.dataLeilao || null,
    leiloeiro: 'Santander',
    photos,
    occupation: item.ocupacao || null,
    matriculas: item.matriculas?.toString() || null,
    rgi: item.rgi || null,
    inscricaoMunicipal: item.inscricaoPrefeitura || null,
    condominioValue: condominioValue as number | null,
  }
}

/**
 * Fetch Santander properties from last successful Apify run.
 */
export async function fetchSantanderApifyLastRun(): Promise<SantanderAuctionItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) return []

  try {
    const url = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/last/dataset/items?token=${token}&status=SUCCEEDED`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })

    if (!res.ok) return []

    const rawItems = (await res.json()) as ApifySantanderItem[]
    if (!Array.isArray(rawItems)) return []

    console.log(`[Apify Santander] Last run: ${rawItems.length} items`)
    return rawItems.map(normalizeSantanderItem)
  } catch (err) {
    console.error('[Apify Santander] Error:', err)
    return []
  }
}

/**
 * Trigger a new Santander scrape via Apify.
 */
export async function fetchSantanderViaApify(): Promise<SantanderAuctionItem[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) {
    console.warn('[Apify Santander] APIFY_API_TOKEN not configured')
    return []
  }

  try {
    const runUrl = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${token}`
    const res = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) {
      console.error(`[Apify Santander] Actor run failed: ${res.status}`)
      return []
    }

    const rawItems = (await res.json()) as ApifySantanderItem[]
    if (!Array.isArray(rawItems)) return []

    console.log(`[Apify Santander] Fresh run: ${rawItems.length} items`)
    return rawItems.map(normalizeSantanderItem)
  } catch (err) {
    console.error('[Apify Santander] Error:', err)
    return []
  }
}
