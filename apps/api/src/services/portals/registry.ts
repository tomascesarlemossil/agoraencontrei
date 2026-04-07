import type { PortalAdapter, PortalAdapterConfig } from './adapter.interface.js'
import { OlxAdapter } from './olx.adapter.js'
import { ZapAdapter } from './zap.adapter.js'
import { VivarealAdapter } from './vivareal.adapter.js'
import { FacebookAdapter } from './facebook.adapter.js'
import { WebhookAdapter } from './webhook.adapter.js'

export function createAdapter(portalId: string, config: PortalAdapterConfig): PortalAdapter {
  switch (portalId) {
    case 'olx':       return new OlxAdapter(config)
    case 'zap':       return new ZapAdapter(config)
    case 'vivareal':  return new VivarealAdapter(config)
    case 'facebook':  return new FacebookAdapter(config)
    default:          return new WebhookAdapter(portalId, config)
  }
}
