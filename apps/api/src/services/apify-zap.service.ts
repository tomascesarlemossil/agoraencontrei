/**
 * Apify ZAP Imóveis Scraper Integration
 *
 * ZAP is the largest real estate portal in Brazil.
 * Data includes structured pricing, location, attributes, media.
 * Used for:
 * - Market price reference per neighborhood
 * - Price/sqm comparison with auction properties
 * - Competitor listing analysis
 */

import { env } from '../utils/env.js'

const APIFY_ACTOR_ID = 'X8XU8wp5fgyRVuflF' // ZAP Imóveis Scraper
const APIFY_BASE = 'https://api.apify.com/v2'

export interface ZapListing {
  id: string
  url: string
  title: string
  description: string
  address: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  latitude: number | null
  longitude: number | null
  price: number
  condominiumFee: number
  iptu: number
  totalCost: number
  area: number
  bedrooms: number
  bathrooms: number
  parkingSpots: number
  suites: number
  propertyType: string
  listingType: 'sale' | 'rent'
  photos: string[]
  pricePerSqm: number
  yearBuilt: number | null
  amenities: string[]
  publishedAt: string | null
  updatedAt: string | null
}

interface ApifyZapItem {
  identity?: { id?: string; slug?: string }
  location?: {
    address?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
    coordinates?: { lat?: number; lon?: number }
    zone?: string
  }
  pricing?: {
    price?: number
    condominiumFee?: number
    iptu?: number
  }
  attributes?: {
    area?: number
    bedrooms?: number
    bathrooms?: number
    parkingSpaces?: number
    suites?: number
    propertyType?: string
    yearBuilt?: number
    [key: string]: unknown
  }
  content?: {
    title?: string
    description?: string
  }
  media?: {
    photos?: Array<{ url?: string }>
    images?: string[]
  }
  source_context?: {
    url?: string
    listing_type?: string
    category?: string
  }
  entities?: {
    amenities?: string[]
  }
  timestamps?: {
    publishedAt?: string
    updatedAt?: string
    createdAt?: string
  }
  availability?: {
    status?: string
  }
}

function normalizeZapItem(item: ApifyZapItem): ZapListing {
  const loc = item.location || {}
  const pricing = item.pricing || {}
  const attrs = item.attributes || {}
  const content = item.content || {}
  const media = item.media || {}
  const source = item.source_context || {}
  const identity = item.identity || {}
  const timestamps = item.timestamps || {}

  const area = attrs.area || 0
  const price = pricing.price || 0
  const condominiumFee = pricing.condominiumFee || 0
  const iptu = pricing.iptu || 0

  const photos: string[] = media.photos
    ? media.photos.map(p => p.url || '').filter(Boolean)
    : media.images || []

  const listingType = (source.listing_type || source.category || '').toLowerCase().includes('rent')
    ? 'rent' as const
    : 'sale' as const

  return {
    id: identity.id || identity.slug || `zap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    url: source.url || '',
    title: content.title || '',
    description: content.description || '',
    address: loc.address || '',
    neighborhood: loc.neighborhood || '',
    city: loc.city || '',
    state: loc.state || '',
    zipCode: loc.zipCode || '',
    latitude: loc.coordinates?.lat || null,
    longitude: loc.coordinates?.lon || null,
    price,
    condominiumFee,
    iptu,
    totalCost: price + condominiumFee + iptu,
    area,
    bedrooms: attrs.bedrooms || 0,
    bathrooms: attrs.bathrooms || 0,
    parkingSpots: attrs.parkingSpaces || 0,
    suites: attrs.suites || 0,
    propertyType: attrs.propertyType || 'Imóvel',
    listingType,
    photos,
    pricePerSqm: area > 0 ? Math.round(price / area) : 0,
    yearBuilt: attrs.yearBuilt || null,
    amenities: item.entities?.amenities || [],
    publishedAt: timestamps.publishedAt || null,
    updatedAt: timestamps.updatedAt || timestamps.createdAt || null,
  }
}

/**
 * Fetch ZAP listings from last successful Apify run.
 */
export async function fetchZapLastRun(): Promise<ZapListing[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) return []

  try {
    const url = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/last/dataset/items?token=${token}&status=SUCCEEDED&limit=5000`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) return []

    const rawItems = (await res.json()) as ApifyZapItem[]
    if (!Array.isArray(rawItems)) return []

    console.log(`[Apify ZAP] Last run: ${rawItems.length} listings`)
    return rawItems.map(normalizeZapItem)
  } catch (err) {
    console.error('[Apify ZAP] Error:', err)
    return []
  }
}

/**
 * Get market price reference from ZAP for a city/neighborhood.
 * Returns average price/sqm for sale and rent listings.
 */
export async function getMarketPriceReference(
  city: string,
  neighborhood?: string,
  listingType?: 'sale' | 'rent'
): Promise<{
  avgPricePerSqm: number
  avgPrice: number
  medianPrice: number
  sampleSize: number
  listingType: string
} | null> {
  const listings = await fetchZapLastRun()
  if (listings.length === 0) return null

  let filtered = listings.filter(l => {
    const cityMatch = l.city.toLowerCase().includes(city.toLowerCase())
    if (!cityMatch) return false
    if (neighborhood) {
      if (!l.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())) return false
    }
    if (listingType) {
      if (l.listingType !== listingType) return false
    }
    return l.price > 0
  })

  if (filtered.length === 0) return null

  // Sort by price for median
  filtered = filtered.sort((a, b) => a.price - b.price)

  const withArea = filtered.filter(l => l.pricePerSqm > 0)
  const avgPricePerSqm = withArea.length > 0
    ? Math.round(withArea.reduce((sum, l) => sum + l.pricePerSqm, 0) / withArea.length)
    : 0

  const avgPrice = Math.round(filtered.reduce((sum, l) => sum + l.price, 0) / filtered.length)
  const medianPrice = filtered[Math.floor(filtered.length / 2)].price

  return {
    avgPricePerSqm,
    avgPrice,
    medianPrice,
    sampleSize: filtered.length,
    listingType: listingType || 'all',
  }
}
