'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText, Loader2, RefreshCw, Check, X, MessageCircle, ExternalLink,
  TrendingUp, TrendingDown, Clock, Award,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Proposal {
  id: string
  status: string
  offerValue: string
  paymentMethod: string | null
  downPayment: string | null
  financingAmount: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  property: { id: string; title: string; slug: string | null; neighborhood: string | null; city: string | null; price: string | null; coverImage: string | null } | null
  contact: { id: string; name: string; email: string | null; phone: string | null } | null
}

const STATUS: Record<string, { label: string; cls: string }> = {
  sent:      { label: 'Em análise',     cls: 'bg-blue-500/15 text-blue-300' },
  countered: { label: 'Contra-proposta', cls: 'bg-amber-500/15 text-amber-300' },
  accepted:  { label: 'Aceita',          cls: 'bg-emerald-500/15 text-emerald-300' },
  rejected:  { label: 'Recusada',        cls: 'bg-red-500/15 text-red-300' },
  expired:   { label: 'Expirada',        cls: 'bg-gray-500/15 text-gray-400' },
}

function fmtBRL(v: string | null) {
  if (!v) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function diffPct(offer: string, listed: string | null): number | null {
  const o = Number(offer); const l = Number(listed)
  if (!Number.isFinite(o) || !Number.isFinite(l) || l === 0) return null
  return ((o - l) / l) * 100
}

export default function PropostasPage() {
  const { getValidToken } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [counterFor, setCounterFor] = useState<string | null>(null)
  const [counterValue, setCounterValue] = useState('')
  const [counterNote, setCounterNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getValidToken()
      const q = new URLSearchParams()
      if (filter) q.set('status', filter)
      const res = await fetch(`${API_URL}/api/v1/proposals?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await res.json()
      setProposals(j.data ?? [])
    } catch { setProposals([]) }
    finally { setLoading(false) }
  }, [filter, getValidToken])

  useEffect(() => { load() }, [load])

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id)
    try {
      const token = await getValidToken()
      await fetch(`${API_URL}/api/v1/proposals/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      await load()
    } finally { setBusy(null) }
  }

  async function submitCounter() {
    if (!counterFor) return
    const val = Number(counterValue.replace(/\D/g, '')) / 100
    if (!val || val <= 0) return
    await patch(counterFor, { status: 'countered', counterValue: val, note: counterNote || undefined })
    setCounterFor(null); setCounterValue(''); setCounterNote('')
  }

  const total = proposals.length
  const pending = proposals.filter(p => p.status === 'sent' || p.status === 'countered').length
  const accepted = proposals.filter(p => p.status === 'accepted').length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <FileText size={24} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold">Propostas</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400">
              Responda em 1 clique — o cliente é notificado e enxerga o status no link público
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 space-y-4">
        {/* KPIs */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Total</div>
              <p className="mt-1 text-xl font-bold text-white">{total}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Aguardando resposta</div>
              <p className="mt-1 text-xl font-bold text-amber-300">{pending}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Aceitas</div>
              <p className="mt-1 text-xl font-bold text-emerald-300">{accepted}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-1">
          {[['', 'Todas'], ['sent', 'Em análise'], ['countered', 'Contra-prop.'], ['accepted', 'Aceitas'], ['rejected', 'Recusadas']]
            .map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`rounded-full px-3 py-1 text-xs ${filter === v ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {loading && total === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : proposals.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">Nenhuma proposta.</p>
        ) : (
          <div className="space-y-2">
            {proposals.map(p => {
              const s = STATUS[p.status] ?? STATUS.sent
              const busyThis = busy === p.id
              const offer = fmtBRL(p.offerValue)
              const listed = fmtBRL(p.property?.price ?? null)
              const pct = diffPct(p.offerValue, p.property?.price ?? null)
              const phoneClean = p.contact?.phone?.replace(/\D/g, '') ?? ''
              const open = p.status === 'sent' || p.status === 'countered'

              return (
                <div key={p.id} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{p.contact?.name ?? 'Cliente'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>{s.label}</span>
                        <span className="text-[10px] text-gray-500">{fmtDate(p.createdAt)}</span>
                      </div>

                      <p className="mt-0.5 text-xs text-gray-400 truncate">
                        {p.property ? (
                          <Link href={`/imoveis/${p.property.slug ?? p.property.id}`} className="hover:text-amber-400">
                            {p.property.title}
                          </Link>
                        ) : 'Imóvel removido'}
                        {p.property?.neighborhood && <span className="text-gray-600"> · {p.property.neighborhood}</span>}
                      </p>

                      <div className="mt-2 flex items-baseline gap-3 flex-wrap">
                        <span className="text-xl font-bold text-amber-300">{offer ?? '—'}</span>
                        {listed && (
                          <span className="text-[11px] text-gray-500">
                            Anunciado: {listed}
                            {pct != null && (
                              <span className={`ml-1 font-semibold ${pct < -5 ? 'text-red-400' : pct > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {pct < 0 ? <TrendingDown size={10} className="inline" /> : pct > 0 ? <TrendingUp size={10} className="inline" /> : null}
                                {' '}{pct >= 0 ? '+' : ''}{pct.toFixed(0)}%
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {(p.paymentMethod || p.downPayment) && (
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-gray-500">
                          {p.paymentMethod && <span className="rounded bg-gray-800 px-1.5 py-0.5">{p.paymentMethod}</span>}
                          {p.downPayment && <span>Entrada {fmtBRL(p.downPayment)}</span>}
                          {p.financingAmount && <span>Financ. {fmtBRL(p.financingAmount)}</span>}
                        </div>
                      )}

                      {p.notes && (
                        <details className="mt-2">
                          <summary className="text-[11px] text-gray-500 cursor-pointer hover:text-gray-300">Ver detalhes</summary>
                          <pre className="mt-1 whitespace-pre-wrap text-[11px] text-gray-400 font-sans">{p.notes}</pre>
                        </details>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {phoneClean && (
                        <a href={`https://wa.me/55${phoneClean}`} target="_blank" rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300" title="WhatsApp">
                          <MessageCircle size={16} />
                        </a>
                      )}
                      <Link href={`/proposta/${p.id}`} target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white" title="Link público do cliente">
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Actions */}
                  {open && counterFor !== p.id && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button onClick={() => patch(p.id, { status: 'accepted' })} disabled={busyThis}
                        className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50">
                        <Check size={12} /> Aceitar
                      </button>
                      <button onClick={() => { setCounterFor(p.id); setCounterValue(''); setCounterNote('') }}
                        disabled={busyThis}
                        className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-500/20 disabled:opacity-50">
                        <Award size={12} /> Contra-proposta
                      </button>
                      <button onClick={() => patch(p.id, { status: 'rejected' })} disabled={busyThis}
                        className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50">
                        <X size={12} /> Recusar
                      </button>
                      {p.status === 'sent' && (
                        <button onClick={() => patch(p.id, { status: 'expired' })} disabled={busyThis}
                          className="flex items-center gap-1 rounded-md border border-gray-700 px-2.5 py-1 text-xs text-gray-400 hover:bg-gray-800 disabled:opacity-50">
                          <Clock size={12} /> Marcar expirada
                        </button>
                      )}
                    </div>
                  )}

                  {/* Counter-proposal form */}
                  {counterFor === p.id && (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                      <p className="text-xs text-amber-200 font-semibold">Sua contra-proposta</p>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={counterValue}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, '')
                          if (!digits) { setCounterValue(''); return }
                          const n = Number(digits) / 100
                          setCounterValue(n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
                        }}
                        placeholder="R$ 0,00"
                        className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
                        style={{ fontSize: '16px' }}
                      />
                      <textarea
                        value={counterNote}
                        onChange={e => setCounterNote(e.target.value)}
                        placeholder="Mensagem para o cliente (opcional)"
                        rows={2}
                        className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
                        style={{ fontSize: '16px' }}
                      />
                      <div className="flex gap-2">
                        <button onClick={submitCounter} disabled={!counterValue || busyThis}
                          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50">
                          Enviar contra-proposta
                        </button>
                        <button onClick={() => setCounterFor(null)}
                          className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800">
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
