'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useNotifications, type NotificationType } from '@/stores/notifications.store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface SSEMessage {
  type: NotificationType
  payload: Record<string, unknown>
}

function getTitle(type: NotificationType, payload: Record<string, unknown>): string {
  switch (type) {
    case 'lead_created':      return `Novo lead: ${payload.name ?? ''}`
    case 'lead_updated':      return `Lead atualizado`
    case 'deal_updated':      return `Negócio atualizado`
    case 'whatsapp_message':  return `Mensagem de ${payload.phone ?? ''}`
    case 'automation_done':   return `Automação executada`
    case 'hunter_lead':       return `Investidor identificado: ${payload.name ?? 'Lead Quente'}`
    case 'proposal_received': return `Nova proposta: R$ ${Number(payload.value ?? 0).toLocaleString('pt-BR')}`
    case 'plan_sale':         return `Venda de plano: ${payload.planName ?? ''}`
    default:                  return 'Notificação'
  }
}

function getBody(type: NotificationType, payload: Record<string, unknown>): string {
  switch (type) {
    case 'hunter_lead':
      return `${payload.neighborhoods ?? ''} — ${payload.city ?? 'Franca'} — Budget: R$ ${Number(payload.budgetMax ?? 0).toLocaleString('pt-BR')}`
    case 'proposal_received':
      return `${payload.propertyTitle ?? 'Imóvel'} — ${payload.neighborhood ?? ''}`
    case 'plan_sale':
      return `Parceiro: ${payload.companyName ?? ''} — R$ ${Number(payload.value ?? 0).toLocaleString('pt-BR')}/mês`
    default:
      return ''
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
          type:     msg.type,
          title:    getTitle(msg.type, msg.payload),
          body:     getBody(msg.type, msg.payload),
          critical: false, // store sets critical based on type
          payload:  msg.payload,
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
