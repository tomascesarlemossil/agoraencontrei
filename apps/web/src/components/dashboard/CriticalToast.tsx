'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications, type NotificationType } from '@/stores/notifications.store'
import { useRouter } from 'next/navigation'
import { DollarSign, Gavel, UserPlus, X, ArrowRight } from 'lucide-react'

// ── Icon mapping by category ────────────────────────────────────────────────

function CategoryIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'plan_sale':
    case 'deal_updated':
      return <DollarSign className="h-6 w-6 text-emerald-400" />
    case 'proposal_received':
      return <Gavel className="h-6 w-6 text-amber-400" />
    case 'hunter_lead':
    case 'lead_created':
      return <UserPlus className="h-6 w-6 text-blue-400" />
    default:
      return <UserPlus className="h-6 w-6 text-gray-400" />
  }
}

function getActionRoute(type: NotificationType, payload?: Record<string, unknown>): string {
  switch (type) {
    case 'hunter_lead':
    case 'lead_created':
      return payload?.contactId
        ? `/dashboard/contacts?id=${payload.contactId}`
        : '/dashboard/leads'
    case 'proposal_received':
      return payload?.propertyId
        ? `/dashboard/properties/${payload.propertyId}`
        : '/dashboard/deals'
    case 'plan_sale':
      return '/dashboard/parceiros'
    default:
      return '/dashboard/notifications'
  }
}

function getBgGradient(type: NotificationType): string {
  switch (type) {
    case 'plan_sale':
      return 'from-emerald-900/95 to-emerald-950/95 border-emerald-500/40'
    case 'proposal_received':
      return 'from-amber-900/95 to-amber-950/95 border-amber-500/40'
    case 'hunter_lead':
      return 'from-blue-900/95 to-blue-950/95 border-blue-500/40'
    default:
      return 'from-gray-800/95 to-gray-900/95 border-gray-600/40'
  }
}

// ── Toast Component ─────────────────────────────────────────────────────────

export function CriticalToast() {
  const notifications = useNotifications(s => s.notifications)
  const markRead = useNotifications(s => s.markRead)
  const router = useRouter()
  const [visibleToasts, setVisibleToasts] = useState<string[]>([])

  // Show new critical notifications as toasts
  useEffect(() => {
    const critical = notifications.filter(n => n.critical && !n.read)
    const newIds = critical
      .filter(n => !visibleToasts.includes(n.id))
      .map(n => n.id)

    if (newIds.length > 0) {
      setVisibleToasts(prev => [...newIds, ...prev].slice(0, 3))
    }
  }, [notifications, visibleToasts])

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    if (visibleToasts.length === 0) return
    const timer = setTimeout(() => {
      setVisibleToasts(prev => prev.slice(0, -1))
    }, 12_000)
    return () => clearTimeout(timer)
  }, [visibleToasts])

  const dismiss = (id: string) => {
    setVisibleToasts(prev => prev.filter(t => t !== id))
    markRead(id)
  }

  const handleAction = (id: string) => {
    const n = notifications.find(x => x.id === id)
    if (n) {
      router.push(getActionRoute(n.type, n.payload))
      dismiss(id)
    }
  }

  const toastNotifications = visibleToasts
    .map(id => notifications.find(n => n.id === id))
    .filter(Boolean)

  return (
    <div
      className="fixed top-4 right-4 flex flex-col gap-3 pointer-events-none"
      style={{ zIndex: 99999 }}
    >
      <AnimatePresence mode="popLayout">
        {toastNotifications.map((n) => (
          <motion.div
            key={n!.id}
            layout
            initial={{ opacity: 0, x: 400, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border bg-gradient-to-r ${getBgGradient(n!.type)} backdrop-blur-xl shadow-2xl shadow-black/40`}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Category Icon */}
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/30">
                <CategoryIcon type={n!.type} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {n!.title}
                </p>
                {n!.body && (
                  <p className="mt-0.5 text-xs text-white/70 truncate">
                    {n!.body}
                  </p>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleAction(n!.id)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition-colors"
                >
                  Assumir Agora
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => dismiss(n!.id)}
                className="shrink-0 rounded-md p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
