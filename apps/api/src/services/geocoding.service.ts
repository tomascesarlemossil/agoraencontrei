/**
 * Geocoding Service — Nominatim (OpenStreetMap)
 * Converts addresses to lat/lng coordinates.
 * Rate limit: 1 request/second (Nominatim policy).
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'AgoraEncontrei-Imobiliaria/1.0 (contato@agoraencontrei.com.br)'

export interface GeocodingResult {
  latitude: number
  longitude: number
  displayName: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Geocode a single address string.
 * Returns null if no result found.
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      countrycodes: 'br',
    })

    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    })

    if (!res.ok) return null

    const data = await res.json() as any[]
    if (!data || data.length === 0) return null

    const result = data[0]
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)

    if (isNaN(lat) || isNaN(lon)) return null

    // Determine confidence based on result type
    const type = result.type ?? ''
    const cls  = result.class ?? ''
    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (['house', 'building', 'residential'].includes(type)) confidence = 'high'
    else if (['road', 'street', 'neighbourhood', 'suburb'].includes(type)) confidence = 'medium'
    else if (cls === 'highway' || cls === 'place') confidence = 'medium'

    return { latitude: lat, longitude: lon, displayName: result.display_name, confidence }
  } catch {
    return null
  }
}

/**
 * Build the best possible address string from property fields.
 * Tries progressively less specific queries if the first fails.
 */
export function buildAddressQueries(property: {
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
}): string[] {
  const { street, number, neighborhood, city, state, zipCode } = property
  const queries: string[] = []

  // 1. Full address (most specific)
  if (street && city) {
    const parts = [street, number, neighborhood, city, state, 'Brasil'].filter(Boolean)
    queries.push(parts.join(', '))
  }

  // 2. Street + city (without number)
  if (street && city) {
    const parts = [street, neighborhood, city, state, 'Brasil'].filter(Boolean)
    queries.push(parts.join(', '))
  }

  // 3. Neighborhood + city
  if (neighborhood && city) {
    queries.push([neighborhood, city, state, 'Brasil'].filter(Boolean).join(', '))
  }

  // 4. ZIP code only
  if (zipCode) {
    const clean = zipCode.replace(/\D/g, '')
    if (clean.length === 8) {
      queries.push(`${clean.slice(0, 5)}-${clean.slice(5)}, Brasil`)
    }
  }

  // 5. City only (fallback)
  if (city) {
    queries.push([city, state, 'Brasil'].filter(Boolean).join(', '))
  }

  // Deduplicate
  return [...new Set(queries)]
}

/**
 * Geocode a property using multiple fallback queries.
 * Respects Nominatim's 1 req/sec rate limit.
 */
export async function geocodeProperty(property: {
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
}): Promise<GeocodingResult | null> {
  const queries = buildAddressQueries(property)

  for (const query of queries) {
    if (!query.trim()) continue
    const result = await geocodeAddress(query)
    if (result) return result
    // Rate limit: wait 1.1s between requests
    await new Promise(r => setTimeout(r, 1100))
  }

  return null
}

/**
 * Sleep helper for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
