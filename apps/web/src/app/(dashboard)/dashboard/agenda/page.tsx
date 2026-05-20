'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, Loader2, RefreshCw, Check, X, Phone, MessageCircle, Star, TrendingUp, AlertTriangle, Award } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Visit {
  id: string
  visitorName: string; visitorEmail: string | null; visitorPhone: string
  scheduledAt: string; mode: string; status: string
  notes: string | null; rating: number | null; feedback: string | null
  property: { id: string; title: string; slug: string | null; neighborhood: string | null; city: string | null } | null
  broker: { id: string; name: string; avatarUrl: string | null } | null
}

interface Stats {
  periodDays: number
  total: number
  byStatus: Record<string, number>
  noShowRate: number
  conversionRate: number
  avgRating: number
  ratingCount: number
  topProperties: { id?: string; title?: string; slug?: string | null; neighborhood?: string | null; visits: number }[]
  topBrokers: { id: string; name?: string; avatarUrl?: string | null; total: number; done: number; avgRating: number | null }[]
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendente',   cls: 'bg-yellow-500/15 text-yellow-300' },
  confirmed: { label: 'Confirmada', cls: 'bg-blue-500/15 text-blue-300' },
  done:      { label: 'Realizada',  cls: 'bg-emerald-500/15 text-emerald-300' },
  cancelled: { label: 'Cancelada',  cls: 'bg-gray-500/15 text-gray-400' },
  no_show:   { label: 'Não compareceu', cls: 'bg-red-500/15 text-red-300' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AgendaPage() {
  const { getValidToken } = useAuth()
  const [visits, setVisits] = useState<Visit[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [fbText, setFbText] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getValidToken()
      const q = new URLSearchParams()
      if (filter) q.set('status', filter)
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/visits?${q}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/v1/visits/stats?days=30`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const list = await listRes.json()
      setVisits(list.data ?? [])
      if (statsRes.ok) setStats(await statsRes.json())
    } catch { setVisits([]) }
    finally { setLoading(false) }
  }, [filter, getValidToken])

  useEffect(() => { load() }, [load])

  async function patch(id: string, data: Record<string, unknown>) {
    setBusy(id)
    try {
      const token = await getValidToken()
      await fetch(`${API_URL}/api/v1/visits/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      await load()
    } finally { setBusy(null) }
  }

  async function submitFeedback() {
    if (!feedbackFor) return
    await patch(feedbackFor, { status: 'done', rating, feedback: fbText })
    setFeedbackFor(null); setRating(5); setFbText('')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <Calendar size={24} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold">Agenda de visitas</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400">
              Confirme, acompanhe e colete feedback das visitas agendadas pelo site
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 space-y-4">
        {/* Stats — últimos 30 dias */}
        {stats && stats.total > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                  <Calendar size={11} /> Visitas (30d)
                </div>
                <p className="mt-1 text-xl font-bold text-white">{stats.total}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {stats.byStatus.pending + stats.byStatus.confirmed} agendadas
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                  <TrendingUp size={11} /> Conversão
                </div>
                <p className="mt-1 text-xl font-bold text-emerald-300">
                  {(stats.conversionRate * 100).toFixed(0)}%
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">{stats.byStatus.done} realizadas</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                  <AlertTriangle size={11} /> No-show
                </div>
                <p className={`mt-1 text-xl font-bold ${stats.noShowRate >= 0.2 ? 'text-red-300' : 'text-white'}`}>
                  {(stats.noShowRate * 100).toFixed(0)}%
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">{stats.byStatus.no_show} não compareceu</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                  <Star size={11} /> Avaliação média
                </div>
                <p className="mt-1 text-xl font-bold text-amber-300">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">{stats.ratingCount} avaliações</p>
              </div>
            </div>

            {(stats.topProperties.length > 0 || stats.topBrokers.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-2">
                {stats.topProperties.length > 0 && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                      <Award size={11} /> Imóveis mais visitados
                    </div>
                    <ul className="mt-2 space-y-1">
                      {stats.topProperties.slice(0, 3).map((p, i) => (
                        <li key={p.id ?? i} className="flex items-center justify-between text-xs">
                          <Link href={p.slug || p.id ? `/imoveis/${p.slug ?? p.id}` : '#'}
                            className="truncate text-gray-300 hover:text-amber-400">
                            {p.title ?? 'Imóvel removido'}
                            {p.neighborhood && <span className="text-gray-600"> · {p.neighborhood}</span>}
                          </Link>
                          <span className="ml-2 flex-shrink-0 text-amber-300 font-semibold">{p.visits}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {stats.topBrokers.length > 0 && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
                      <Award size={11} /> Corretores em destaque
                    </div>
                    <ul className="mt-2 space-y-1">
                      {stats.topBrokers.slice(0, 3).map(b => (
                        <li key={b.id} className="flex items-center justify-between text-xs">
                          <span className="truncate text-gray-300">{b.name ?? 'Corretor'}</span>
                          <span className="ml-2 flex-shrink-0 text-gray-400">
                            {b.done} <span className="text-gray-600">realizadas</span>
                            {b.avgRating != null && (
                              <span className="ml-1.5 text-amber-300">{b.avgRating.toFixed(1)}★</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-1">
          {[['', 'Todas'], ['pending', 'Pendentes'], ['confirmed', 'Confirmadas'], ['done', 'Realizadas'], ['cancelled', 'Canceladas']]
            .map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`rounded-full px-3 py-1 text-xs ${filter === v ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : visits.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">Nenhuma visita.</p>
        ) : (
          <div className="space-y-2">
            {visits.map(v => {
              const s = STATUS[v.status] ?? STATUS.pending
              const busyThis = busy === v.id
              const phoneClean = v.visitorPhone.replace(/\D/g, '')
              return (
                <div key={v.id} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{v.visitorName}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>{s.label}</span>
                        <span className="text-[10px] text-gray-500">{v.mode === 'video' ? 'Por vídeo' : 'Presencial'}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(v.scheduledAt)} ·{' '}
                        {v.property ? (
                          <Link href={`/imoveis/${v.property.slug ?? v.property.id}`} className="hover:text-amber-400">
                            {v.property.title}
                          </Link>
                        ) : 'Imóvel removido'}
                        {v.property?.neighborhood && <span className="text-gray-600"> · {v.property.neighborhood}</span>}
                      </p>
                      {v.notes && <p className="mt-1 text-xs text-gray-500 italic">"{v.notes}"</p>}
                      {v.feedback && (
                        <div className="mt-1 text-xs text-emerald-300">
                          <span className="font-semibold">Feedback: </span>
                          {v.rating && <span>{'★'.repeat(v.rating)}{'☆'.repeat(5 - v.rating)} </span>}
                          {v.feedback}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={`https://wa.me/55${phoneClean}`} target="_blank" rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300" title="WhatsApp">
                        <MessageCircle size={16} />
                      </a>
                      <a href={`tel:${phoneClean}`} className="text-gray-400 hover:text-white" title="Ligar">
                        <Phone size={16} />
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  {v.status === 'pending' || v.status === 'confirmed' ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {v.status === 'pending' && (
                        <button onClick={() => patch(v.id, { status: 'confirmed' })} disabled={busyThis}
                          className="flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300 hover:bg-blue-500/20 disabled:opacity-50">
                          <Check size={12} /> Confirmar
                        </button>
                      )}
                      <button onClick={() => { setFeedbackFor(v.id); setRating(5); setFbText('') }}
                        disabled={busyThis}
                        className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50">
                        <Star size={12} /> Marcar realizada
                      </button>
                      <button onClick={() => patch(v.id, { status: 'cancelled' })} disabled={busyThis}
                        className="flex items-center gap-1 rounded-md border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-800 disabled:opacity-50">
                        <X size={12} /> Cancelar
                      </button>
                    </div>
                  ) : null}

                  {/* Feedback form */}
                  {feedbackFor === v.id && (
                    <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-200">Avaliação:</span>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setRating(n)}
                            className={`text-lg ${n <= rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea value={fbText} onChange={(e) => setFbText(e.target.value)}
                        placeholder="Feedback do cliente (gostou? fez proposta? quer ver opções parecidas?)"
                        rows={2}
                        className="w-full rounded-md border border-gray-700 bg-gray-950 px-2 py-1.5 text-xs text-white" />
                      <div className="flex gap-2">
                        <button onClick={submitFeedback}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500">
                          Salvar
                        </button>
                        <button onClick={() => setFeedbackFor(null)}
                          className="rounded-md border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:bg-gray-800">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
