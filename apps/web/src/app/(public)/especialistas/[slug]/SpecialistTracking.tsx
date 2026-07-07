'use client'

/**
 * Rastreamento de eventos da página pública do parceiro (profile_view e
 * whatsapp_click) → POST /api/v1/public/partner-track. Alimenta as métricas
 * que o parceiro vê no editor/painel (GET /specialists/:id/stats).
 */
import { useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

function track(specialistId: string, event: 'profile_view' | 'whatsapp_click' | 'phone_click') {
  try {
    fetch(`${API_URL}/api/v1/public/partner-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId: specialistId,
        event,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* silencioso — rastreamento nunca quebra a página */ }
}

export function ProfileViewBeacon({ specialistId }: { specialistId: string }) {
  useEffect(() => {
    if (specialistId) track(specialistId, 'profile_view')
  }, [specialistId])
  return null
}

export function TrackedLink({
  specialistId, event, href, className, children,
}: {
  specialistId: string
  event: 'whatsapp_click' | 'phone_click'
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => track(specialistId, event)} className={className}>
      {children}
    </a>
  )
}
