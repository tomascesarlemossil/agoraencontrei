import type { PortalAdapter, PortalAdapterConfig, PropertyPayload, PublishResult, UnpublishResult } from './adapter.interface.js'

export class WebhookAdapter implements PortalAdapter {
  readonly portalId: string
  readonly stubMode: boolean
  private readonly webhookUrl: string

  constructor(portalId: string, config: PortalAdapterConfig) {
    this.portalId = portalId
    this.webhookUrl = (config.settings?.webhookUrl as string) ?? ''
    this.stubMode = !this.webhookUrl
  }

  async publish(property: PropertyPayload, _config: PortalAdapterConfig): Promise<PublishResult> {
    if (this.stubMode) {
      return {
        externalId: `stub-webhook-${property.id}`,
        stubMode: true,
        success: true,
        message: 'Webhook stub mode — configure settings.webhookUrl to enable',
      }
    }

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'property.published', property }),
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        return { success: false, stubMode: false, message: `Webhook returned HTTP ${res.status}` }
      }

      const data = await res.json().catch(() => ({}))
      return {
        externalId: (data as any).externalId ?? `webhook-${property.id}`,
        url: (data as any).url,
        stubMode: false,
        success: true,
      }
    } catch (err: any) {
      return { success: false, stubMode: false, message: err.message }
    }
  }

  async unpublish(externalId: string, _config: PortalAdapterConfig): Promise<UnpublishResult> {
    if (this.stubMode) {
      return { success: true, stubMode: true, message: 'Webhook stub mode — unpublish skipped' }
    }

    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'property.unpublished', externalId }),
        signal: AbortSignal.timeout(10_000),
      })
      return { success: res.ok, stubMode: false }
    } catch {
      return { success: false, stubMode: false }
    }
  }
}
