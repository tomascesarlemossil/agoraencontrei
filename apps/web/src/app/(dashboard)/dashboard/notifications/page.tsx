'use client'

import { Bell, CheckCheck, Trash2, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNotifications, type AppNotification, type NotificationType } from '@/stores/notifications.store'
import { buildWaLink, visitConfirmationMsg } from '@/lib/whatsapp-templates'

/** Para onde cada tipo de notificação leva ao ser clicada. */
function getActionRoute(type: NotificationType, payload?: Record<string, unknown>): string {
  const contactId = payload?.contactId as string | undefined
  const propertyId = payload?.propertyId as string | undefined
  switch (type) {
    case 'visit_requested':
      // Agenda de visitas — confirmar, cancelar, WhatsApp e feedback num só lugar.
      return payload?.visitId ? `/dashboard/agenda?focus=${payload.visitId}` : '/dashboard/agenda'
    case 'hunter_lead':
    case 'lead_captured':
    case 'lead_created':
    case 'lead_updated':
      return contactId ? `/dashboard/contacts/${contactId}` : '/dashboard/leads'
    case 'proposal_received':
      return propertyId ? `/dashboard/properties/${propertyId}` : '/dashboard/propostas'
    case 'deal_updated':
      return '/dashboard/deals'
    case 'plan_sale':
    case 'partner_registered':
      return '/dashboard/admin/tenants'
    case 'whatsapp_message':
      return '/dashboard/inbox'
    default:
      return ''
  }
}

const TYPE_COLORS: Record<AppNotification['type'], string> = {
  lead_created:      'bg-blue-50 text-blue-700',
  lead_updated:      'bg-indigo-50 text-indigo-700',
  deal_updated:      'bg-purple-50 text-purple-700',
  whatsapp_message:  'bg-green-50 text-green-700',
  automation_done:   'bg-yellow-50 text-yellow-700',
  notification:      'bg-gray-50 text-gray-700',
  hunter_lead:       'bg-amber-50 text-amber-700',
  proposal_received: 'bg-emerald-50 text-emerald-700',
  plan_sale:         'bg-violet-50 text-violet-700',
  lead_captured:     'bg-blue-50 text-blue-700',
  visit_requested:   'bg-cyan-50 text-cyan-700',
  broker_handoff:    'bg-amber-50 text-amber-700',
  partner_registered:'bg-fuchsia-50 text-fuchsia-700',
  system:            'bg-gray-50 text-gray-700',
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, clear } = useNotifications()
  const router = useRouter()

  function handleClick(n: AppNotification) {
    markRead(n.id)
    const route = getActionRoute(n.type, n.payload)
    if (route) router.push(route)
  }

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
          {notifications.map(n => {
            const isVisit = n.type === 'visit_requested'
            const visitorPhone = n.payload?.visitorPhone as string | undefined
            const waLink = isVisit && visitorPhone
              ? buildWaLink(visitorPhone, visitConfirmationMsg({
                  visitorName: n.payload?.visitorName as string | undefined,
                  propertyTitle: n.payload?.propertyTitle as string | undefined,
                  scheduledAt: n.payload?.scheduledAt as string | undefined,
                }))
              : null
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
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
                    {n.body && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{n.body}</p>}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { e.stopPropagation(); markRead(n.id) }}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Enviar confirmação no WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
