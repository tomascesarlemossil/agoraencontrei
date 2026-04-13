import { EventEmitter } from 'node:events'

export interface SSEEvent {
  // Os eventos aqui são sinalizações ao front-end (tempo real via SSE). Mantemos
  // a união sincronizada com os triggers de automação que o front consome.
  type:
    | 'lead_created'
    | 'lead_updated'
    | 'deal_created'
    | 'deal_updated'
    | 'whatsapp_message'
    | 'automation_done'
    | 'notification'
  companyId: string
  payload: Record<string, unknown>
}

class SSEEmitter extends EventEmitter {}
export const sseEmitter = new SSEEmitter()
sseEmitter.setMaxListeners(500) // one per connected client

export function emitSSE(event: SSEEvent) {
  sseEmitter.emit(`sse:${event.companyId}`, event)
}
