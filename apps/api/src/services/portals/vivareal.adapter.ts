// @ts-nocheck
import type { PortalAdapter, PortalAdapterConfig, PropertyPayload, PublishResult, UnpublishResult } from './adapter.interface.js'

// VivaReal API — mesmo grupo do ZAP (Grupo ZAP-VIVA REAL)
const VIVAREAL_API_BASE = 'https://www.vivareal.com.br/api/v2'

const VR_TYPE_MAP: Record<string, string> = {
  house:      'RESIDENCIAL_CASA',
  apartment:  'RESIDENCIAL_APARTAMENTO',
  commercial: 'COMERCIAL_SALA',
  land:       'TERRENO_PADRAO',
  rural:      'RURAL_SITIO',
}

export class VivarealAdapter implements PortalAdapter {
  readonly portalId = 'vivareal'
  readonly stubMode: boolean
  private apiKey: string | undefined

  constructor(config: PortalAdapterConfig) {
    this.apiKey   = config.apiKey
    this.stubMode = !config.apiKey
  }

  private buildPayload(property: PropertyPayload) {
    return {
      externalId:    property.id,
      title:         property.title,
      description:   property.description ?? property.title,
      category:      VR_TYPE_MAP[property.type] ?? 'RESIDENCIAL_CASA',
      transactionType: property.purpose === 'rent' ? 'LOCACAO' : 'VENDA',
      price:         property.purpose === 'rent' ? property.priceRent : property.price,
      address: {
        city:         property.city ?? '',
        state:        property.state ?? 'SP',
        neighborhood: property.neighborhood ?? '',
        zipCode:      property.zipCode ?? '',
        lat:          property.latitude,
        lng:          property.longitude,
      },
      characteristics: {
        totalArea:    property.totalArea,
        bedrooms:     property.bedrooms,
        bathrooms:    property.bathrooms,
        garageSpaces: property.parkingSpaces,
      },
      photos:  property.images.slice(0, 25).map((url, i) => ({ url, main: i === 0 })),
      siteUrl: `https://agoraencontrei.com.br/imoveis/${property.slug}`,
    }
  }

  async publish(property: PropertyPayload, _config: PortalAdapterConfig): Promise<PublishResult> {
    if (this.stubMode) {
      return {
        externalId: `stub-vr-${property.id}`,
        stubMode: true,
        success: true,
        message: 'VivaReal stub mode — configure VIVAREAL_API_KEY no Railway para ativar',
      }
    }

    try {
      const payload = this.buildPayload(property)
      const res = await fetch(`${VIVAREAL_API_BASE}/listings`, {
        method: 'POST',
        headers: { 'X-API-Key': this.apiKey!, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(`VivaReal API ${res.status}: ${json.message ?? JSON.stringify(json).slice(0, 200)}`)
      return { externalId: json.id ?? `vr-${property.id}`, url: json.url, stubMode: false, success: true, message: 'Publicado no VivaReal' }
    } catch (err: any) {
      return { stubMode: false, success: false, message: `Erro VivaReal: ${err.message}` }
    }
  }

  async unpublish(externalId: string, _config: PortalAdapterConfig): Promise<UnpublishResult> {
    if (this.stubMode) {
      return { success: true, stubMode: true, message: 'VivaReal stub mode — unpublish skipped' }
    }
    try {
      const res = await fetch(`${VIVAREAL_API_BASE}/listings/${externalId}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': this.apiKey! },
        signal: AbortSignal.timeout(10_000),
      })
      return { success: res.ok, stubMode: false, message: res.ok ? 'Removido do VivaReal' : `Erro ${res.status}` }
    } catch (err: any) {
      return { success: false, stubMode: false, message: err.message }
    }
  }
}
