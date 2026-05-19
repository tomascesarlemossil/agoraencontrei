import { create } from 'zustand'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export type NotificationType =
  | 'lead_created' | 'lead_updated' | 'deal_updated'
  | 'whatsapp_message' | 'automation_done' | 'notification'
  | 'hunter_lead' | 'proposal_received' | 'plan_sale'
  | 'lead_captured' | 'visit_requested' | 'broker_handoff' | 'partner_registered' | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  critical: boolean
  createdAt: Date
  /** Set when the row is backed by a persisted Notification row in the API. */
  persisted?: boolean
  payload?: Record<string, unknown>
}

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  criticalCount: number
  authToken: string | null
  add: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  hydrate: (token: string) => Promise<void>
  markRead: (id: string) => void
  markAllRead: () => void
  clear: () => void
  getCriticalUnread: () => AppNotification[]
}

const CRITICAL_TYPES: NotificationType[] = ['hunter_lead', 'proposal_received', 'plan_sale', 'broker_handoff']

const TYPE_LABELS: Record<NotificationType, string> = {
  lead_created:       'Novo Lead',
  lead_updated:       'Lead Atualizado',
  deal_updated:       'Negócio Atualizado',
  whatsapp_message:   'Nova Mensagem WhatsApp',
  automation_done:    'Automação Executada',
  notification:       'Notificação',
  hunter_lead:        'Lead Quente — Busca Externa',
  proposal_received:  'Nova Proposta',
  plan_sale:          'Venda de Plano',
  lead_captured:      'Novo Lead',
  visit_requested:    'Visita Solicitada',
  broker_handoff:     'Atendimento — Corretor',
  partner_registered: 'Novo Parceiro',
  system:             'Sistema',
}

function recompute(notifications: AppNotification[]) {
  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    criticalCount: notifications.filter(n => n.critical && !n.read).length,
  }
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  criticalCount: 0,
  authToken: null,

  add(n) {
    const isCritical = n.critical ?? CRITICAL_TYPES.includes(n.type)
    const notification: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: n.title || TYPE_LABELS[n.type] || 'Notificação',
      critical: isCritical,
      read: false,
      createdAt: new Date(),
    }
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1,
      criticalCount: state.criticalCount + (isCritical ? 1 : 0),
    }))
  },

  // Loads persisted notifications from the API so the center survives reloads.
  async hydrate(token) {
    set({ authToken: token })
    try {
      const res = await fetch(`${API_URL}/api/v1/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json() as {
        items: Array<{
          id: string; type: string; title: string; body: string
          read: boolean; createdAt: string; payload?: Record<string, unknown>
        }>
      }
      const persisted: AppNotification[] = data.items.map(it => ({
        id: it.id,
        type: (it.type as NotificationType) || 'notification',
        title: it.title,
        body: it.body,
        read: it.read,
        critical: CRITICAL_TYPES.includes(it.type as NotificationType),
        createdAt: new Date(it.createdAt),
        persisted: true,
        payload: it.payload,
      }))
      set(state => {
        // Keep any client-only (non-persisted) notifications, drop stale persisted.
        const clientOnly = state.notifications.filter(n => !n.persisted)
        const merged = [...persisted, ...clientOnly]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 100)
        return recompute(merged)
      })
    } catch {
      // offline — keep whatever is in memory
    }
  },

  markRead(id) {
    const target = get().notifications.find(n => n.id === id)
    set(state => recompute(
      state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    ))
    const token = get().authToken
    if (target?.persisted && token) {
      fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  },

  markAllRead() {
    set(state => recompute(state.notifications.map(n => ({ ...n, read: true }))))
    const token = get().authToken
    if (token) {
      fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  },

  clear() {
    set({ notifications: [], unreadCount: 0, criticalCount: 0 })
  },

  getCriticalUnread() {
    return get().notifications.filter(n => n.critical && !n.read)
  },
}))
