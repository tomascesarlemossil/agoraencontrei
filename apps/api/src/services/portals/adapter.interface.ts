export interface PropertyPayload {
  id: string
  title: string
  description?: string
  type: string
  purpose: string
  price?: number
  priceRent?: number
  city?: string
  state?: string
  neighborhood?: string
  street?: string
  number?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  totalArea?: number
  builtArea?: number
  bedrooms?: number
  suites?: number
  bathrooms?: number
  parkingSpaces?: number
  features: string[]
  coverImage?: string
  images: string[]
  videoUrl?: string
  slug: string
}

export interface PortalAdapterConfig {
  apiKey?: string
  apiSecret?: string
  settings: Record<string, unknown>
}

export interface PublishResult {
  externalId?: string
  url?: string
  stubMode: boolean
  success: boolean
  message?: string
}

export interface UnpublishResult {
  success: boolean
  stubMode: boolean
  message?: string
}

export interface PortalAdapter {
  readonly portalId: string
  readonly stubMode: boolean
  publish(property: PropertyPayload, config: PortalAdapterConfig): Promise<PublishResult>
  unpublish(externalId: string, config: PortalAdapterConfig): Promise<UnpublishResult>
}
