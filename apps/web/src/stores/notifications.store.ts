import { create } from 'zustand'

export type NotificationType =
  | 'lead_created' | 'lead_updated' | 'deal_updated'
  | 'whatsapp_message' | 'automation_done' | 'notification'
  | 'hunter_lead' | 'proposal_received' | 'plan_sale'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  critical: boolean
  createdAt: Date
  payload?: Record<string, unknown>
}

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  criticalCount: number
  add: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clear: () => void
  getCriticalUnread: () => AppNotification[]
}

const CRITICAL_TYPES: NotificationType[] = ['hunter_lead', 'proposal_received', 'plan_sale']

const TYPE_LABELS: Record<NotificationType, string> = {
  lead_created:      'Novo Lead',
  lead_updated:      'Lead Atualizado',
  deal_updated:      'Negócio Atualizado',
  whatsapp_message:  'Nova Mensagem WhatsApp',
  automation_done:   'Automação Executada',
  notification:      'Notificação',
  hunter_lead:       'Lead Quente — Busca Externa',
  proposal_received: 'Nova Proposta',
  plan_sale:         'Venda de Plano',
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  criticalCount: 0,

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

  markRead(id) {
    set(state => {
      const target = state.notifications.find(n => n.id === id && !n.read)
      return {
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - (target ? 1 : 0)),
        criticalCount: Math.max(0, state.criticalCount - (target?.critical ? 1 : 0)),
      }
    })
  },

  markAllRead() {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
      criticalCount: 0,
    }))
  },

  clear() {
    set({ notifications: [], unreadCount: 0, criticalCount: 0 })
  },

  getCriticalUnread() {
    return get().notifications.filter(n => n.critical && !n.read)
  },
}))
