'use client'

import { useEffect, useState, type FormEvent, use } from 'react'
import { Loader2, MapPin, CheckCircle2, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Lote {
  id: string
  quadra: string | null
  numero: string
  area: number | null
  frente: number | null
  fundo: number | null
  price: number | null
  status: 'AVAILABLE' | 'RESERVED' | 'NEGOTIATING' | 'SOLD' | 'BLOCKED'
  mapColumn: number | null
  mapRow: number | null
  description: string | null
  sunPosition: string | null
}
interface Loteamento {
  id: string; name: string; description: string | null
  city: string | null; state: string | null; coverImage: string | null
  status: string; infrastructure: string[]
  lotes: Lote[]
  stats: { count: Record<string, number>; vgvTotal: number; vgvSold: number }
}

const STATUS: Record<Lote['status'], { label: string; cell: string; dot: string }> = {
  AVAILABLE:   { label: 'Disponível',     cell: 'bg-emerald-500 hover:bg-emerald-400 text-white', dot: 'bg-emerald-500' },
  RESERVED:    { label: 'Reservado',      cell: 'bg-amber-400 text-amber-950',                    dot: 'bg-amber-400' },
  NEGOTIATING: { label: 'Em negociação',  cell: 'bg-orange-500 text-white',                       dot: 'bg-orange-500' },
  SOLD:        { label: 'Vendido',        cell: 'bg-gray-400 text-white',                         dot: 'bg-gray-400' },
  BLOCKED:     { label: 'Bloqueado',      cell: 'bg-gray-700 text-white',                         dot: 'bg-gray-700' },
}

const brl = (n: number | null) =>
  n != null && n > 0 ? `R$ ${Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : 'Consulte'

export default function LoteamentoMapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [data, setData] = useState<Loteamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Lote | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [reserving, setReserving] = useState(false)
  const [reserved, setReserved] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetch(`${API_URL}/api/v1/loteadora/public/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(j => setData(j.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }
  useEffect(load, [slug])

  async function reservar(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setReserving(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/v1/loteadora/public/lotes/${selected.id}/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.message ?? 'Erro ao reservar')
      setReserved(true)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setReserving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
      Loteamento não encontrado.</div>
  }

  const mapped = data.lotes.filter(l => l.mapColumn != null && l.mapRow != null)
  const unmapped = data.lotes.filter(l => l.mapColumn == null || l.mapRow == null)
  const maxCol = Math.max(1, ...mapped.map(l => (l.mapColumn ?? 0) + 1))
  const maxRow = Math.max(1, ...mapped.map(l => (l.mapRow ?? 0) + 1))

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1B2B5B' }}>{data.name}</h1>
        {(data.city || data.state) && (
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin size={14} /> {[data.city, data.state].filter(Boolean).join(' - ')}
          </p>
        )}
        {data.description && <p className="mt-2 text-sm text-gray-600 max-w-2xl">{data.description}</p>}

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-3">
          {(['AVAILABLE', 'RESERVED', 'NEGOTIATING', 'SOLD'] as const).map(s => (
            <div key={s} className="rounded-xl border border-gray-200 bg-white px-3 py-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS[s].dot} mr-1.5`} />
              <span className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>
                {data.stats.count[s] ?? 0}
              </span>
              <span className="text-xs text-gray-400 ml-1">{STATUS[s].label}</span>
            </div>
          ))}
        </div>

        {data.infrastructure.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.infrastructure.map(i => (
              <span key={i} className="rounded-full bg-blue-50 text-blue-700 text-xs px-2.5 py-1">{i}</span>
            ))}
          </div>
        )}

        {/* Interactive map */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 overflow-x-auto">
          <h2 className="font-semibold mb-3" style={{ color: '#1B2B5B' }}>Mapa de lotes</h2>
          {mapped.length === 0 ? (
            <p className="text-sm text-gray-400">Mapa em preparação.</p>
          ) : (
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${maxCol}, minmax(48px, 1fr))`,
                gridTemplateRows: `repeat(${maxRow}, 48px)`,
              }}
            >
              {mapped.map(l => (
                <button
                  key={l.id}
                  onClick={() => { setSelected(l); setReserved(false); setError('') }}
                  title={`${l.quadra ? `Q${l.quadra} ` : ''}Lote ${l.numero} — ${STATUS[l.status].label}`}
                  style={{ gridColumn: (l.mapColumn ?? 0) + 1, gridRow: (l.mapRow ?? 0) + 1 }}
                  className={`rounded-md text-[10px] font-semibold transition-colors ${STATUS[l.status].cell}`}
                >
                  {l.numero}
                </button>
              ))}
            </div>
          )}
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(STATUS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`h-3 w-3 rounded ${v.dot}`} /> {v.label}
              </span>
            ))}
          </div>
        </div>

        {/* Unmapped lots list */}
        {unmapped.length > 0 && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="font-semibold mb-2" style={{ color: '#1B2B5B' }}>Outros lotes</h2>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {unmapped.map(l => (
                <button key={l.id} onClick={() => { setSelected(l); setReserved(false); setError('') }}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-blue-300">
                  <span className="text-sm" style={{ color: '#1B2B5B' }}>
                    {l.quadra ? `Q${l.quadra} ` : ''}Lote {l.numero}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS[l.status].dot}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lot detail / reserve panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold" style={{ color: '#1B2B5B' }}>
                {selected.quadra ? `Quadra ${selected.quadra} · ` : ''}Lote {selected.numero}
              </h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[selected.status].cell}`}>
              {STATUS[selected.status].label}
            </span>

            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
              {selected.area != null && <><dt className="text-gray-400">Área</dt><dd className="text-right" style={{ color: '#1B2B5B' }}>{selected.area} m²</dd></>}
              {selected.frente != null && <><dt className="text-gray-400">Frente</dt><dd className="text-right" style={{ color: '#1B2B5B' }}>{selected.frente} m</dd></>}
              {selected.fundo != null && <><dt className="text-gray-400">Fundo</dt><dd className="text-right" style={{ color: '#1B2B5B' }}>{selected.fundo} m</dd></>}
              {selected.sunPosition && <><dt className="text-gray-400">Posição do sol</dt><dd className="text-right" style={{ color: '#1B2B5B' }}>{selected.sunPosition}</dd></>}
              <dt className="text-gray-400">Valor</dt><dd className="text-right font-bold" style={{ color: '#C9A84C' }}>{brl(selected.price)}</dd>
            </dl>
            {selected.description && <p className="mt-3 text-sm text-gray-600">{selected.description}</p>}

            {reserved ? (
              <div className="mt-5 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                <p className="mt-2 text-sm font-medium" style={{ color: '#1B2B5B' }}>
                  Lote reservado! A equipe entrará em contato.
                </p>
              </div>
            ) : selected.status === 'AVAILABLE' ? (
              <form onSubmit={reservar} className="mt-5 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Reservar este lote</p>
                <input required placeholder="Seu nome" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <input required type="email" placeholder="E-mail" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <input placeholder="Telefone / WhatsApp" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button type="submit" disabled={reserving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: '#1B2B5B' }}>
                  {reserving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Tenho interesse — reservar
                </button>
                <p className="text-[11px] text-gray-400 text-center">A reserva fica bloqueada por 24h.</p>
              </form>
            ) : (
              <p className="mt-5 text-sm text-gray-500 text-center">Este lote não está disponível para reserva.</p>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
