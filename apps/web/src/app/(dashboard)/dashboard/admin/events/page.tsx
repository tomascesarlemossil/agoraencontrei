'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Loader2, RefreshCw, Filter } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface SysEvent {
  id: string; eventType: string; source: string | null
  entityType: string | null; entityId: string | null
  payload: Record<string, unknown>; processed: boolean
  errorMessage: string | null; createdAt: string
}

const EVENT_TYPES = ['', 'lead.created', 'property.created', 'deal.payment_received', 'deal.proposal_accepted']
const ENTITY_TYPES = ['', 'lead', 'property', 'deal', 'deal_payment', 'contact']

const TYPE_BADGE: Record<string, string> = {
  'lead.created':           'bg-blue-500/15 text-blue-300',
  'property.created':       'bg-emerald-500/15 text-emerald-300',
  'deal.payment_received':  'bg-amber-500/15 text-amber-300',
  'deal.proposal_accepted': 'bg-fuchsia-500/15 text-fuchsia-300',
}

export default function SystemEventsPage() {
  const { getValidToken } = useAuth()
  const [events, setEvents] = useState<SysEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterEntity, setFilterEntity] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getValidToken()
      const q = new URLSearchParams()
      if (filterType) q.set('type', filterType)
      if (filterEntity) q.set('entity', filterEntity)
      q.set('limit', '200')
      const res = await fetch(`${API_URL}/api/v1/system-events?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await res.json()
      setEvents(j.data ?? [])
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }, [filterType, filterEntity, getValidToken])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <Activity size={24} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold">Eventos do sistema</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400">
              Log central de eventos de domínio — auditoria e base de automações
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-3">
          <Filter size={14} className="text-gray-500 mb-1.5" />
          <div>
            <label className="block text-[10px] text-gray-500">Tipo de evento</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white">
              {EVENT_TYPES.map(t => <option key={t || 'all'} value={t}>{t || 'Todos'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500">Entidade</label>
            <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}
              className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white">
              {ENTITY_TYPES.map(t => <option key={t || 'all'} value={t}>{t || 'Todas'}</option>)}
            </select>
          </div>
          <span className="text-xs text-gray-500 ml-auto self-end pb-1.5">{events.length} evento(s)</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">Nenhum evento.</p>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/60 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Quando</th>
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2">Origem</th>
                  <th className="px-3 py-2">Entidade</th>
                  <th className="px-3 py-2">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-900/40">
                    <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(ev.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_BADGE[ev.eventType] ?? 'bg-white/10 text-white/60'}`}>
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-400">{ev.source ?? '—'}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">
                      {ev.entityType && <span>{ev.entityType}</span>}
                      {ev.entityId && <code className="ml-1 text-[10px] text-gray-600">{ev.entityId.slice(0, 8)}…</code>}
                    </td>
                    <td className="px-3 py-2">
                      <code className="text-[11px] text-gray-500 line-clamp-1 max-w-md inline-block truncate">
                        {JSON.stringify(ev.payload)}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
