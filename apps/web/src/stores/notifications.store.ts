import { create } from 'zustand'

export interface AppNotification {
  id: string
  type: 'lead_created' | 'lead_updated' | 'deal_updated' | 'whatsapp_message' | 'automation_done' | 'notification'
  title: string
  body: string
  read: boolean
  createdAt: Date
  payload?: Record<string, unknown>
}

interface NotificationsState {
  notifications: AppNotification[]
  unreadCount: number
  add: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clear: () => void
}

const TYPE_LABELS: Record<AppNotification['type'], string> = {
  lead_created:    'Novo Lead',
  lead_updated:    'Lead Atualizado',
  deal_updated:    'Negócio Atualizado',
  whatsapp_message:'Nova Mensagem WhatsApp',
  automation_done: 'Automação Executada',
  notification:    'Notificação',
}

export const useNotifications = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,

  add(n) {
    const notification: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: n.title || TYPE_LABELS[n.type] || 'Notificação',
      read: false,
      createdAt: new Date(),
    }
    set(state => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    }))
  },

  markRead(id) {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
    }))
  },

  markAllRead() {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },

  clear() {
    set({ notifications: [], unreadCount: 0 })
  },
}))
