/**
 * Google Street View Service — Captura automática de fachadas
 *
 * Integra com a Google Street View Static API para gerar imagens
 * de fachada de imóveis e leilões a partir de coordenadas (lat/lng)
 * ou endereço textual.
 *
 * Features:
 * - Gera URL estática do Street View (600x400 default)
 * - Verifica disponibilidade de imagem (metadata API)
 * - Batch processing para imóveis sem fachada
 * - Integração com pipeline de scraping de leilões
 *
 * API Docs: https://developers.google.com/maps/documentation/streetview
 *
 * ⚠️ Requer GOOGLE_MAPS_API_KEY no env.
 *    Billing habilitado no Google Cloud Console.
 *    Custo: $7/1000 requisições (Static API) ou $0 (metadata check).
 */

import type { PrismaClient } from '@prisma/client'
import { env } from '../utils/env.js'

// ── Types ───────────────────────────────────────────────────────────────────

export interface StreetViewOptions {
  width?: number
  height?: number
  heading?: number     // 0-360 degrees (camera direction)
  pitch?: number       // -90 to 90 (camera angle up/down)
  fov?: number         // 10-120 (field of view / zoom)
  source?: 'default' | 'outdoor'  // outdoor = exclude indoor imagery
}

export interface StreetViewResult {
  available: boolean
  imageUrl: string | null
  metadataUrl: string | null
  location?: { lat: number; lng: number }
  panoId?: string
  date?: string        // capture date (e.g., "2023-07")
}

export interface BatchResult {
  processed: number
  updated: number
  unavailable: number
  errors: number
}

// ── Constants ───────────────────────────────────────────────────────────────

const STREETVIEW_BASE = 'https://maps.googleapis.com/maps/api/streetview'
const METADATA_BASE = 'https://maps.googleapis.com/maps/api/streetview/metadata'

const DEFAULT_OPTIONS: Required<StreetViewOptions> = {
  width: 600,
  height: 400,
  heading: 0,         // face building front (auto-adjusted by Google)
  pitch: 10,          // slightly above street level
  fov: 90,            // standard view
  source: 'outdoor',  // prefer outdoor imagery
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Retorna a API key configurada, ou null se não disponível.
 */
function getApiKey(): string | null {
  return (env as any).GOOGLE_MAPS_API_KEY || null
}

/**
 * Gera a URL estática do Google Street View para coordenadas ou endereço.
 *
 * @param location - "lat,lng" ou endereço textual
 * @param options  - dimensões, ângulo, zoom
 * @returns URL da imagem ou null se API key ausente
 */
export function buildStreetViewUrl(
  location: string,
  options?: StreetViewOptions,
): string | null {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const opts = { ...DEFAULT_OPTIONS, ...options }
  const params = new URLSearchParams({
    location,
    size: `${opts.width}x${opts.height}`,
    heading: String(opts.heading),
    pitch: String(opts.pitch),
    fov: String(opts.fov),
    source: opts.source,
    key: apiKey,
  })

  return `${STREETVIEW_BASE}?${params.toString()}`
}

/**
 * Gera URL a partir de latitude/longitude.
 */
export function buildStreetViewUrlFromCoords(
  latitude: number,
  longitude: number,
  options?: StreetViewOptions,
): string | null {
  return buildStreetViewUrl(`${latitude},${longitude}`, options)
}

/**
 * Gera URL a partir de endereço textual.
 * O Google resolve automaticamente para coordenadas.
 */
export function buildStreetViewUrlFromAddress(
  street: string,
  number: string | undefined,
  city: string,
  state: string,
  options?: StreetViewOptions,
): string | null {
  const parts = [street, number, city, state, 'Brasil'].filter(Boolean)
  return buildStreetViewUrl(parts.join(', '), options)
}

/**
 * Verifica se há imagem do Street View disponível para a localização.
 * A Metadata API é GRATUITA (não consome quota do Street View Static).
 *
 * @returns Metadata com disponibilidade, pano ID e data de captura
 */
export async function checkStreetViewAvailability(
  location: string,
): Promise<StreetViewResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { available: false, imageUrl: null, metadataUrl: null }
  }

  const params = new URLSearchParams({
    location,
    source: 'outdoor',
    key: apiKey,
  })

  try {
    const res = await fetch(`${METADATA_BASE}?${params.toString()}`)
    const data: any = await res.json()

    if (data.status === 'OK') {
      const imageUrl = buildStreetViewUrl(location)
      return {
        available: true,
        imageUrl,
        metadataUrl: `${METADATA_BASE}?${params.toString()}`,
        location: data.location ? { lat: data.location.lat, lng: data.location.lng } : undefined,
        panoId: data.pano_id,
        date: data.date,
      }
    }

    return {
      available: false,
      imageUrl: null,
      metadataUrl: null,
    }
  } catch (error: any) {
    console.error('[streetview] Metadata check failed:', error.message)
    return { available: false, imageUrl: null, metadataUrl: null }
  }
}

/**
 * Gera Street View URL para um imóvel, usando coords ou endereço como fallback.
 * Verifica disponibilidade antes de retornar.
 */
export async function getStreetViewForProperty(
  property: {
    latitude?: number | null
    longitude?: number | null
    street?: string | null
    number?: string | null
    city?: string | null
    state?: string | null
  },
  options?: StreetViewOptions,
): Promise<StreetViewResult> {
  // Priority 1: Use coordinates if available
  if (property.latitude && property.longitude) {
    const location = `${property.latitude},${property.longitude}`
    const result = await checkStreetViewAvailability(location)
    if (result.available) {
      result.imageUrl = buildStreetViewUrlFromCoords(
        property.latitude,
        property.longitude,
        options,
      )
      return result
    }
  }

  // Priority 2: Use address
  if (property.street && property.city && property.state) {
    const addressParts = [
      property.street,
      property.number,
      property.city,
      property.state,
      'Brasil',
    ].filter(Boolean)
    const location = addressParts.join(', ')

    const result = await checkStreetViewAvailability(location)
    if (result.available) {
      result.imageUrl = buildStreetViewUrlFromAddress(
        property.street,
        property.number || undefined,
        property.city,
        property.state,
        options,
      )
      return result
    }
  }

  return { available: false, imageUrl: null, metadataUrl: null }
}

/**
 * Processa em batch: busca imóveis sem streetViewUrl e tenta gerar.
 * Respeita rate limit do Google (50 QPS para Street View).
 */
export async function batchGenerateStreetView(
  prisma: PrismaClient,
  options?: {
    limit?: number
    type?: 'property' | 'auction'
    onlyWithCoords?: boolean
  },
): Promise<BatchResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { processed: 0, updated: 0, unavailable: 0, errors: 0 }
  }

  const limit = options?.limit || 50
  const type = options?.type || 'property'
  const result: BatchResult = { processed: 0, updated: 0, unavailable: 0, errors: 0 }

  if (type === 'property') {
    const where: any = {
      streetViewUrl: null,
      status: 'ACTIVE',
    }
    if (options?.onlyWithCoords) {
      where.latitude = { not: null }
      where.longitude = { not: null }
    }

    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true, latitude: true, longitude: true,
        street: true, number: true, city: true, state: true,
      },
      take: limit,
    })

    for (const prop of properties) {
      result.processed++
      try {
        const sv = await getStreetViewForProperty(prop)
        if (sv.available && sv.imageUrl) {
          await prisma.property.update({
            where: { id: prop.id },
            data: { streetViewUrl: sv.imageUrl },
          })
          result.updated++
        } else {
          result.unavailable++
        }
        // Rate limit: ~10 requests/sec to stay well under 50 QPS
        await new Promise(r => setTimeout(r, 100))
      } catch {
        result.errors++
      }
    }
  } else {
    // Auctions
    const auctions = await prisma.auction.findMany({
      where: {
        streetViewUrl: { equals: null },
        ...(options?.onlyWithCoords && {
          latitude: { not: null },
          longitude: { not: null },
        }),
      },
      select: {
        id: true, latitude: true, longitude: true,
        street: true, number: true, city: true, state: true,
      },
      take: limit,
    } as any)

    for (const auction of auctions) {
      result.processed++
      try {
        const sv = await getStreetViewForProperty(auction)
        if (sv.available && sv.imageUrl) {
          await prisma.auction.update({
            where: { id: auction.id },
            data: { streetViewUrl: sv.imageUrl } as any,
          })
          result.updated++
        } else {
          result.unavailable++
        }
        await new Promise(r => setTimeout(r, 100))
      } catch {
        result.errors++
      }
    }
  }

  return result
}
