'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useNotifications } from '@/stores/notifications.store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const POLL_INTERVAL = 15_000 // 15 seconds

/**
 * Polls for critical events: hunter leads, new proposals, plan sales.
 * Complements SSE — catches events even if the SSE stream drops.
 */
export function useRealTimeNotifications() {
  const token = useAuthStore(s => s.accessToken)
  const add = useNotifications(s => s.add)
  const lastCheckRef = useRef<string>(new Date().toISOString())
  const seenIdsRef = useRef<Set<string>>(new Set())

  const poll = useCallback(async () => {
    if (!token) return

    try {
      const since = encodeURIComponent(lastCheckRef.current)
      const res = await fetch(
        `${API_URL}/api/v1/notifications/critical?since=${since}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (!res.ok) return

      const data = await res.json() as Array<{
        id: string
        type: 'hunter_lead' | 'proposal_received' | 'plan_sale' | 'lead_created'
        title: string
        body: string
        payload: Record<string, unknown>
        createdAt: string
      }>

      for (const item of data) {
        if (seenIdsRef.current.has(item.id)) continue
        seenIdsRef.current.add(item.id)

        add({
          type: item.type,
          title: item.title,
          body: item.body,
          critical: true,
          payload: { ...item.payload, notificationId: item.id },
        })
      }

      lastCheckRef.current = new Date().toISOString()

      // Keep seenIds bounded
      if (seenIdsRef.current.size > 500) {
        const arr = Array.from(seenIdsRef.current)
        seenIdsRef.current = new Set(arr.slice(-200))
      }
    } catch {
      // Network error — retry on next interval
    }
  }, [token, add])

  useEffect(() => {
    if (!token) return

    // Initial poll
    poll()

    const interval = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [token, poll])
}
