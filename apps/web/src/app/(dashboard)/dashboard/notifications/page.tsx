'use client'

import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { useNotifications, type AppNotification } from '@/stores/notifications.store'

const TYPE_COLORS: Record<AppNotification['type'], string> = {
  lead_created:     'bg-blue-50 text-blue-700',
  lead_updated:     'bg-indigo-50 text-indigo-700',
  deal_updated:     'bg-purple-50 text-purple-700',
  whatsapp_message: 'bg-green-50 text-green-700',
  automation_done:  'bg-yellow-50 text-yellow-700',
  notification:     'bg-gray-50 text-gray-700',
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, clear } = useNotifications()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-100 hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhuma notificação ainda</p>
          <p className="text-xs text-gray-400 mt-1">Eventos em tempo real aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors hover:border-gray-200 ${
                n.read ? 'border-gray-100 opacity-70' : 'border-blue-100 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[n.type]}`}>
                      {n.title}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {n.body && <p className="text-sm text-gray-600 mt-1">{n.body}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
