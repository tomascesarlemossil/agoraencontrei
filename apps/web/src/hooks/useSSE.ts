'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useNotifications } from '@/stores/notifications.store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

type SSEEventType = 'lead_created' | 'lead_updated' | 'deal_updated' | 'whatsapp_message' | 'automation_done' | 'notification'

interface SSEMessage {
  type: SSEEventType
  payload: Record<string, unknown>
}

function getTitle(type: SSEEventType, payload: Record<string, unknown>): string {
  switch (type) {
    case 'lead_created':     return `Novo lead: ${payload.name ?? ''}`
    case 'lead_updated':     return `Lead atualizado`
    case 'deal_updated':     return `Negócio atualizado`
    case 'whatsapp_message': return `Mensagem de ${payload.phone ?? ''}`
    case 'automation_done':  return `Automação executada`
    default:                 return 'Notificação'
  }
}

export function useSSE() {
  const token = useAuthStore(s => s.accessToken)
  const add = useNotifications(s => s.add)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!token) return

    const url = `${API_URL}/api/v1/events/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const msg: SSEMessage = JSON.parse(e.data)
        add({
          type:    msg.type,
          title:   getTitle(msg.type, msg.payload),
          body:    '',
          payload: msg.payload,
        })
      } catch {}
    }

    es.onerror = () => {
      // EventSource auto-reconnects — nothing to do
    }

    return () => {
      es.close()
      esRef.current = null
    }
  }, [token, add])
}
