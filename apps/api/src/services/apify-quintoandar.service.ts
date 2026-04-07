/**
 * Apify QuintoAndar Scraper Integration
 *
 * Fetches rental listing data from QuintoAndar via Apify.
 * Used for:
 * - Rental price comparison on auction property pages
 * - ROI calculation (auction price vs rental income)
 * - Market price reference per neighborhood
 */

import { env } from '../utils/env.js'

const APIFY_ACTOR_ID = 'iBHSek1aCC8EADyUC' // Quinto Andar API
const APIFY_BASE = 'https://api.apify.com/v2'

export interface QuintoAndarListing {
  id: string
  url: string
  title: string
  address: string
  neighborhood: string
  city: string
  state: string
  rent: number
  totalCost: number
  condominio: number
  iptu: number
  area: number
  bedrooms: number
  bathrooms: number
  parkingSpots: number
  photos: string[]
  amenities: string[]
  propertyType: string
  pricePerSqm: number
}

interface ApifyQuintoAndarItem {
  url?: string
  title?: string
  address?: string
  neighborhood?: string
  city?: string
  state?: string
  rent?: number
  totalCost?: number
  condominiumFee?: number
  iptu?: number
  area?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number
  photos?: string[]
  imageUrls?: string[]
  amenities?: string[]
  propertyType?: string
  id?: string
}

function normalizeQuintoAndarItem(item: ApifyQuintoAndarItem): QuintoAndarListing {
  const area = item.area || 0
  const rent = item.rent || item.totalCost || 0

  return {
    id: item.id || item.url?.split('/').pop() || `qa-${Date.now()}`,
    url: item.url || '',
    title: item.title || '',
    address: item.address || '',
    neighborhood: item.neighborhood || '',
    city: item.city || 'São Paulo',
    state: item.state || 'SP',
    rent: item.rent || 0,
    totalCost: item.totalCost || 0,
    condominio: item.condominiumFee || 0,
    iptu: item.iptu || 0,
    area,
    bedrooms: item.bedrooms || 0,
    bathrooms: item.bathrooms || 0,
    parkingSpots: item.parkingSpaces || 0,
    photos: item.photos || item.imageUrls || [],
    amenities: item.amenities || [],
    propertyType: item.propertyType || 'Imóvel',
    pricePerSqm: area > 0 ? Math.round(rent / area) : 0,
  }
}

/**
 * Fetch QuintoAndar listings from last successful Apify run.
 */
export async function fetchQuintoAndarLastRun(): Promise<QuintoAndarListing[]> {
  const token = env.APIFY_API_TOKEN
  if (!token) return []

  try {
    const url = `${APIFY_BASE}/acts/${APIFY_ACTOR_ID}/runs/last/dataset/items?token=${token}&status=SUCCEEDED&limit=5000`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) return []

    const rawItems = (await res.json()) as ApifyQuintoAndarItem[]
    if (!Array.isArray(rawItems)) return []

    console.log(`[Apify QuintoAndar] Last run: ${rawItems.length} listings`)
    return rawItems.map(normalizeQuintoAndarItem)
  } catch (err) {
    console.error('[Apify QuintoAndar] Error:', err)
    return []
  }
}

/**
 * Get average rental price per sqm for a neighborhood/city.
 * Useful for auction ROI calculations.
 */
export async function getRentalPriceReference(
  city: string,
  neighborhood?: string
): Promise<{ avgRentPerSqm: number; avgRent: number; sampleSize: number } | null> {
  const listings = await fetchQuintoAndarLastRun()
  if (listings.length === 0) return null

  const filtered = listings.filter(l => {
    const cityMatch = l.city.toLowerCase().includes(city.toLowerCase())
    if (!cityMatch) return false
    if (neighborhood) {
      return l.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())
    }
    return true
  })

  if (filtered.length === 0) return null

  const withArea = filtered.filter(l => l.pricePerSqm > 0)
  const avgRentPerSqm = withArea.length > 0
    ? Math.round(withArea.reduce((sum, l) => sum + l.pricePerSqm, 0) / withArea.length)
    : 0

  const avgRent = Math.round(filtered.reduce((sum, l) => sum + l.rent, 0) / filtered.length)

  return {
    avgRentPerSqm,
    avgRent,
    sampleSize: filtered.length,
  }
}
