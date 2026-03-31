import { EventEmitter } from 'node:events'

export interface SSEEvent {
  type: 'lead_created' | 'lead_updated' | 'deal_updated' | 'whatsapp_message' | 'automation_done' | 'notification'
  companyId: string
  payload: Record<string, unknown>
}

class SSEEmitter extends EventEmitter {}
export const sseEmitter = new SSEEmitter()
sseEmitter.setMaxListeners(500) // one per connected client

export function emitSSE(event: SSEEvent) {
  sseEmitter.emit(`sse:${event.companyId}`, event)
}
