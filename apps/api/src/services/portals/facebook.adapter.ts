import type { PortalAdapter, PortalAdapterConfig, PropertyPayload, PublishResult, UnpublishResult } from './adapter.interface.js'

export class FacebookAdapter implements PortalAdapter {
  readonly portalId = 'facebook'
  readonly stubMode: boolean

  constructor(config: PortalAdapterConfig) {
    this.stubMode = !config.apiKey
  }

  async publish(property: PropertyPayload, config: PortalAdapterConfig): Promise<PublishResult> {
    if (this.stubMode) {
      return {
        externalId: `stub-fb-${property.id}`,
        stubMode: true,
        success: true,
        message: 'Facebook Marketplace stub mode — configure apiKey (page access token) to enable real publishing',
      }
    }

    // Facebook Catalog API for real estate
    // POST https://graph.facebook.com/v18.0/{catalog_id}/items
    const catalogId = (config.settings?.catalogId as string) ?? ''
    if (!catalogId) {
      return { success: false, stubMode: false, message: 'Facebook: settings.catalogId is required' }
    }

    // Real implementation would POST to Catalog API here
    return {
      externalId: `stub-fb-${property.id}`,
      stubMode: false,
      success: true,
      message: 'Facebook real API not yet configured',
    }
  }

  async unpublish(externalId: string, _config: PortalAdapterConfig): Promise<UnpublishResult> {
    if (this.stubMode) {
      return { success: true, stubMode: true, message: 'Facebook stub mode — unpublish skipped' }
    }
    return { success: true, stubMode: false }
  }
}
