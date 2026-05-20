'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar, MapPin, Phone, MessageCircle, RefreshCw,
  Check, X, Loader2, UserPlus, Map, Star, Clock, AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Property {
  id: string; title: string; slug: string | null
  street: string | null; number: string | null
  neighborhood: string | null; city: string | null
  latitude: number | null; longitude: number | null
}
interface Visit {
  id: string; visitorName: string; visitorPhone: string
  scheduledAt: string; status: string; mode: string; notes: string | null
  property: Property | null; mapsUrl: string | null
}
interface Lead {
  id: string; name: string; phone: string | null; email: string | null
  status: string; source: string | null; createdAt: string
}
interface Today {
  now: string
  nextVisit: Visit | null
  todayVisits: Visit[]
  newLeadsToday: Lead[]
  kpis: { visitsToday: number; leadsToday: number; pendingTasks: number }
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendente',   cls: 'bg-yellow-500/15 text-yellow-300' },
  confirmed: { label: 'Confirmada', cls: 'bg-blue-500/15 text-blue-300' },
  done:      { label: 'Realizada',  cls: 'bg-emerald-500/15 text-emerald-300' },
  cancelled: { label: 'Cancelada',  cls: 'bg-gray-500/15 text-gray-400' },
  no_show:   { label: 'Não veio',   cls: 'bg-red-500/15 text-red-300' },
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}
function fmtCountdown(min: number): string {
  if (min < 0) return `${-min}min atrás`
  if (min < 60) return `em ${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `em ${h}h` : `em ${h}h ${m}min`
}
function relTime(iso: string): string {
  const sec = (Date.now() - new Date(iso).getTime()) / 1000
  if (sec < 60) return 'agora'
  if (sec < 3600) return `${Math.floor(sec / 60)}min atrás`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function CorretorHojePage() {
  const { getValidToken } = useAuth()
  const [data, setData] = useState<Today | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/corretor/today`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setData(await res.json())
    } catch { /* keep prior */ }
    finally { setLoading(false) }
  }, [getValidToken])

  useEffect(() => { load() }, [load])

  async function patchVisit(id: string, body: Record<string, unknown>) {
    setBusy(id)
    try {
      const token = await getValidToken()
      await fetch(`${API_URL}/api/v1/visits/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      await load()
    } finally { setBusy(null) }
  }

  const next = data?.nextVisit
  const nextMin = next ? minutesUntil(next.scheduledAt) : null
  const isImminent = nextMin != null && nextMin <= 60 && nextMin >= -30

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-8">
      {/* Header */}
      <div className="border-b border-gray-800 sticky top-0 z-10 bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center gap-3">
          <Calendar size={22} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">Hoje</h1>
            <p className="text-[11px] text-gray-500 leading-tight">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
          <button onClick={load}
            className="rounded-lg border border-gray-700 p-2 text-gray-300 hover:bg-gray-800">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4 space-y-5">
        {loading && !data ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : !data ? (
          <p className="py-10 text-center text-sm text-gray-600">Sem dados.</p>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Visitas</p>
                <p className="mt-1 text-2xl font-bold text-white">{data.kpis.visitsToday}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Leads</p>
                <p className="mt-1 text-2xl font-bold text-amber-300">{data.kpis.leadsToday}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Tarefas</p>
                <p className="mt-1 text-2xl font-bold text-blue-300">{data.kpis.pendingTasks}</p>
              </div>
            </div>

            {/* Próxima visita — destaque grande */}
            {next ? (
              <div className={`rounded-2xl border p-4 ${isImminent ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-800 bg-gray-900/40'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Próxima visita</p>
                    <p className="mt-1 text-xl font-bold truncate">{next.property?.title ?? 'Imóvel'}</p>
                    {(next.property?.neighborhood || next.property?.city) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[next.property.neighborhood, next.property.city].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-amber-300">{fmtTime(next.scheduledAt)}</p>
                    {nextMin != null && (
                      <p className={`text-[10px] ${isImminent ? 'text-amber-300' : 'text-gray-500'}`}>
                        <Clock size={9} className="inline" /> {fmtCountdown(nextMin)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-gray-950/60 px-3 py-2">
                  <p className="text-xs">
                    <span className="text-gray-500">Cliente:</span>{' '}
                    <span className="font-semibold text-white">{next.visitorName}</span>
                  </p>
                  {next.notes && (
                    <p className="mt-1 text-[11px] italic text-gray-400">&ldquo;{next.notes}&rdquo;</p>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <a href={`https://wa.me/55${next.visitorPhone.replace(/\D/g, '')}`}
                     target="_blank" rel="noopener noreferrer"
                     className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <a href={`tel:${next.visitorPhone.replace(/\D/g, '')}`}
                     className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-700 px-3 py-2.5 text-xs font-semibold text-white">
                    <Phone size={14} /> Ligar
                  </a>
                  {next.mapsUrl ? (
                    <a href={next.mapsUrl} target="_blank" rel="noopener noreferrer"
                       className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white">
                      <Map size={14} /> Maps
                    </a>
                  ) : (
                    <button disabled
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-800 px-3 py-2.5 text-xs text-gray-500">
                      <Map size={14} /> Sem mapa
                    </button>
                  )}
                </div>

                {next.status === 'pending' && (
                  <button onClick={() => patchVisit(next.id, { status: 'confirmed' })} disabled={busy === next.id}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 disabled:opacity-50">
                    <Check size={12} /> Confirmar visita
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 text-center">
                <p className="text-sm text-gray-500">Nenhuma visita agendada na sequência.</p>
              </div>
            )}

            {/* Agenda do dia */}
            {data.todayVisits.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Agenda de hoje</h2>
                  <Link href="/dashboard/agenda" className="text-xs text-amber-400">Ver tudo →</Link>
                </div>
                <div className="space-y-2">
                  {data.todayVisits.map(v => {
                    const s = STATUS[v.status] ?? STATUS.pending
                    const closed = v.status === 'done' || v.status === 'cancelled' || v.status === 'no_show'
                    return (
                      <div key={v.id} className={`rounded-xl border border-gray-800 bg-gray-900/40 p-3 ${closed ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-amber-300">{fmtTime(v.scheduledAt)}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${s.cls}`}>{s.label}</span>
                            </div>
                            <p className="mt-0.5 text-sm font-semibold text-white truncate">{v.visitorName}</p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {v.property?.title ?? 'Imóvel'}
                              {v.property?.neighborhood && <span className="text-gray-600"> · {v.property.neighborhood}</span>}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <a href={`https://wa.me/55${v.visitorPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                               className="rounded-md bg-emerald-600/20 p-1.5 text-emerald-300">
                              <MessageCircle size={12} />
                            </a>
                            {v.mapsUrl && (
                              <a href={v.mapsUrl} target="_blank" rel="noopener noreferrer"
                                 className="rounded-md bg-blue-600/20 p-1.5 text-blue-300">
                                <MapPin size={12} />
                              </a>
                            )}
                          </div>
                        </div>
                        {!closed && (
                          <div className="mt-2 flex gap-1.5">
                            {v.status === 'pending' && (
                              <button onClick={() => patchVisit(v.id, { status: 'confirmed' })} disabled={busy === v.id}
                                className="flex-1 flex items-center justify-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300 disabled:opacity-50">
                                <Check size={10} /> Confirmar
                              </button>
                            )}
                            <button onClick={() => patchVisit(v.id, { status: 'done' })} disabled={busy === v.id}
                              className="flex-1 flex items-center justify-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 disabled:opacity-50">
                              <Star size={10} /> Realizada
                            </button>
                            <button onClick={() => patchVisit(v.id, { status: 'no_show' })} disabled={busy === v.id}
                              className="flex-1 flex items-center justify-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300 disabled:opacity-50">
                              <AlertCircle size={10} /> No-show
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Leads novos do dia */}
            {data.newLeadsToday.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Leads novos hoje</h2>
                  <Link href="/dashboard/leads" className="text-xs text-amber-400">Ver tudo →</Link>
                </div>
                <div className="space-y-2">
                  {data.newLeadsToday.map(l => (
                    <Link key={l.id} href={`/dashboard/leads/${l.id}`}
                      className="block rounded-xl border border-gray-800 bg-gray-900/40 p-3 active:bg-gray-900">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <UserPlus size={12} className="text-amber-400 flex-shrink-0" />
                            <p className="text-sm font-semibold truncate">{l.name}</p>
                          </div>
                          <p className="mt-0.5 text-[11px] text-gray-400 truncate">
                            {l.phone || l.email || 'Sem contato'} · {l.source ?? 'site'}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{relTime(l.createdAt)}</span>
                      </div>
                      {l.phone && (
                        <div className="mt-2 flex gap-1.5" onClick={e => e.stopPropagation()}>
                          <a href={`https://wa.me/55${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-1.5 text-[11px] font-semibold text-white">
                            <MessageCircle size={11} /> WhatsApp
                          </a>
                          <a href={`tel:${l.phone.replace(/\D/g, '')}`}
                            className="rounded-md bg-gray-700 px-3 py-1.5 text-[11px] text-white">
                            <Phone size={11} />
                          </a>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {data.todayVisits.length === 0 && data.newLeadsToday.length === 0 && !next && (
              <p className="py-8 text-center text-sm text-gray-600">
                Dia leve. Que tal prospectar alguns leads?
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
