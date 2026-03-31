import type { PortalAdapter, PortalAdapterConfig, PropertyPayload, PublishResult, UnpublishResult } from './adapter.interface.js'

// OLX Imóveis Autoupload XML format
// Docs: https://developers.olx.com.br/
const OLX_API_URL = 'https://apps.olx.com.br/autoupload/api'

const OLX_CATEGORY_MAP: Record<string, string> = {
  house:      'Casas',
  apartment:  'Apartamentos',
  commercial: 'Comercial e Industrial',
  land:       'Terrenos',
  rural:      'Sítios e Fazendas',
}

const OLX_TYPE_MAP: Record<string, string> = {
  sell: 'Venda',
  rent: 'Aluguel',
  buy:  'Venda',
}

export class OlxAdapter implements PortalAdapter {
  readonly portalId = 'olx'
  readonly stubMode: boolean
  private apiKey: string | undefined

  constructor(config: PortalAdapterConfig) {
    this.apiKey   = config.apiKey
    this.stubMode = !config.apiKey
  }

  private buildXML(property: PropertyPayload): string {
    const category   = OLX_CATEGORY_MAP[property.type] ?? 'Imóveis'
    const adType     = OLX_TYPE_MAP[property.purpose] ?? 'Venda'
    const price      = property.purpose === 'rent' ? property.priceRent : property.price
    const priceTag   = price ? `<Price>${Math.round(price)}</Price>` : ''
    const imagesTags = property.images.slice(0, 20)
      .map(url => `<Picture><Url><![CDATA[${url}]]></Url></Picture>`)
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<ListingService>
  <Listings>
    <Listing>
      <Id><![CDATA[${property.id}]]></Id>
      <Title><![CDATA[${property.title}]]></Title>
      <Body><![CDATA[${property.description ?? property.title}]]></Body>
      <Category><![CDATA[${category}]]></Category>
      <AdType><![CDATA[${adType}]]></AdType>
      ${priceTag}
      <Region><![CDATA[${property.state ?? 'SP'}]]></Region>
      <Municipality><![CDATA[${property.city ?? ''}]]></Municipality>
      <Neighbourhood><![CDATA[${property.neighborhood ?? ''}]]></Neighbourhood>
      <ZipCode><![CDATA[${property.zipCode ?? ''}]]></ZipCode>
      <Details>
        <AreaTotal>${property.totalArea ?? 0}</AreaTotal>
        <AreaUseful>${property.builtArea ?? 0}</AreaUseful>
        <Bedrooms>${property.bedrooms ?? 0}</Bedrooms>
        <Bathrooms>${property.bathrooms ?? 0}</Bathrooms>
        <Garages>${property.parkingSpaces ?? 0}</Garages>
      </Details>
      <Images>${imagesTags}</Images>
      <Url><![CDATA[https://agoraencontrei.com.br/imoveis/${property.slug}]]></Url>
    </Listing>
  </Listings>
</ListingService>`
  }

  async publish(property: PropertyPayload, _config: PortalAdapterConfig): Promise<PublishResult> {
    if (this.stubMode) {
      return {
        externalId: `stub-olx-${property.id}`,
        stubMode: true,
        success: true,
        message: 'OLX stub mode — configure OLX_API_KEY no Railway para ativar',
      }
    }

    try {
      const xml = this.buildXML(property)
      const res = await fetch(`${OLX_API_URL}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/xml; charset=UTF-8',
        },
        body: xml,
        signal: AbortSignal.timeout(15_000),
      })

      const text = await res.text()
      if (!res.ok) throw new Error(`OLX API ${res.status}: ${text.slice(0, 200)}`)

      const idMatch = text.match(/<ExternalId>([^<]+)<\/ExternalId>/)
      const externalId = idMatch ? idMatch[1] : `olx-${property.id}`

      return { externalId, stubMode: false, success: true, message: 'Publicado no OLX Imóveis' }
    } catch (err: any) {
      return { stubMode: false, success: false, message: `Erro OLX: ${err.message}` }
    }
  }

  async unpublish(externalId: string, _config: PortalAdapterConfig): Promise<UnpublishResult> {
    if (this.stubMode) {
      return { success: true, stubMode: true, message: 'OLX stub mode — unpublish skipped' }
    }
    try {
      const res = await fetch(`${OLX_API_URL}/delete/${externalId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(10_000),
      })
      return { success: res.ok, stubMode: false, message: res.ok ? 'Removido do OLX' : `Erro ${res.status}` }
    } catch (err: any) {
      return { success: false, stubMode: false, message: err.message }
    }
  }
}
