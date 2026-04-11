'use client'

import { useNotifications } from '@/stores/notifications.store'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

/**
 * Fixed gold bar at the top of the dashboard that pulses
 * when there are unattended critical leads (hunter leads, new proposals).
 * Stays visible until the notification is read.
 */
export function UnattendedLeadTicker() {
  const notifications = useNotifications(s => s.notifications)
  const markRead = useNotifications(s => s.markRead)
  const router = useRouter()

  const unattended = notifications.filter(n => n.critical && !n.read)
  const oldest = unattended[unattended.length - 1]

  if (!oldest) return null

  const handleClick = () => {
    // Navigate based on type
    if (oldest.type === 'hunter_lead' || oldest.type === 'lead_created') {
      const contactId = oldest.payload?.contactId as string | undefined
      router.push(contactId ? `/dashboard/contacts?id=${contactId}` : '/dashboard/leads')
    } else if (oldest.type === 'proposal_received') {
      router.push('/dashboard/deals')
    } else {
      router.push('/dashboard/notifications')
    }
    markRead(oldest.id)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={handleClick}
        className="relative cursor-pointer overflow-hidden"
        style={{ zIndex: 99998 }}
      >
        {/* Pulsing gold background */}
        <motion.div
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-4 py-2.5"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-950 shrink-0" />
            <span className="text-sm font-semibold text-amber-950 truncate">
              {unattended.length === 1
                ? oldest.title
                : `${unattended.length} alertas críticos aguardando atenção`}
            </span>
            {oldest.body && (
              <span className="hidden sm:inline text-xs text-amber-900/80 truncate">
                — {oldest.body}
              </span>
            )}
            <span className="ml-2 inline-flex items-center rounded-md bg-amber-950/20 px-2 py-0.5 text-xs font-medium text-amber-950">
              Clique para atender
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
