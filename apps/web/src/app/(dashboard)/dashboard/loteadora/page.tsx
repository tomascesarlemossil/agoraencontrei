'use client'

import { useState, useEffect, useCallback } from 'react'
import { LandPlot, Loader2, Plus, RefreshCw, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const LOTE_STATUS = ['AVAILABLE', 'RESERVED', 'NEGOTIATING', 'SOLD', 'BLOCKED'] as const
const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponível', RESERVED: 'Reservado', NEGOTIATING: 'Em negociação',
  SOLD: 'Vendido', BLOCKED: 'Bloqueado',
}

interface Stats { count: Record<string, number>; vgvTotal: number; vgvSold: number }
interface Lote {
  id: string; quadra: string | null; numero: string; area: number | null
  price: number | null; status: string; mapColumn: number | null; mapRow: number | null
}
interface Loteamento {
  id: string; name: string; slug: string; city: string | null; state: string | null
  status: string; infrastructure: string[]; stats: Stats; lotes?: Lote[]
}

const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`

export default function LoteadoraPage() {
  const { getValidToken } = useAuth()
  const [list, setList] = useState<Loteamento[]>([])
  const [selected, setSelected] = useState<Loteamento | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCity, setNewCity] = useState('')
  // Lot generator
  const [gen, setGen] = useState({ quadra: '', mapRow: '0', from: '1', to: '10', area: '', price: '' })

  const notify = useCallback((msg: string, ok: boolean) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 4000)
  }, [])

  const token = useCallback(async () => {
    const t = await getValidToken()
    if (!t) throw new Error('Sessão expirada.')
    return t
  }, [getValidToken])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/loteadora/loteamentos`, {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      const j = await res.json()
      setList(j.data ?? [])
    } catch (e) { notify((e as Error).message, false) }
    finally { setLoading(false) }
  }, [token, notify])

  const loadDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/loteadora/loteamentos/${id}`, {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      const j = await res.json()
      setSelected(j.data)
    } catch (e) { notify((e as Error).message, false) }
  }, [token, notify])

  useEffect(() => { loadList() }, [loadList])

  async function createLoteamento() {
    if (newName.trim().length < 2) return
    setBusy(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/loteadora/loteamentos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, city: newCity || undefined }),
      })
      if (!res.ok) throw new Error('Falha ao criar')
      notify('Loteamento criado.', true)
      setShowCreate(false); setNewName(''); setNewCity('')
      await loadList()
    } catch (e) { notify((e as Error).message, false) }
    finally { setBusy(false) }
  }

  async function generateLotes() {
    if (!selected) return
    const from = parseInt(gen.from, 10), to = parseInt(gen.to, 10)
    const row = parseInt(gen.mapRow, 10) || 0
    if (!(from >= 1 && to >= from && to - from < 200)) {
      notify('Intervalo de números inválido.', false); return
    }
    const lotes = []
    for (let n = from; n <= to; n++) {
      lotes.push({
        quadra: gen.quadra || undefined,
        numero: String(n),
        area: gen.area ? Number(gen.area) : undefined,
        price: gen.price ? Number(gen.price) : undefined,
        mapRow: row,
        mapColumn: n - from,
      })
    }
    setBusy(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/loteadora/loteamentos/${selected.id}/lotes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotes }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.message || 'Falha ao gerar lotes')
      notify(`${j.created} lote(s) criado(s).`, true)
      await loadDetail(selected.id)
    } catch (e) { notify((e as Error).message, false) }
    finally { setBusy(false) }
  }

  async function updateLote(loteId: string, data: Record<string, unknown>) {
    setBusy(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/loteadora/lotes/${loteId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Falha ao atualizar lote')
      if (selected) await loadDetail(selected.id)
    } catch (e) { notify((e as Error).message, false) }
    finally { setBusy(false) }
  }

  const input = 'rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${
          toast.ok ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100'
                   : 'bg-red-900/90 border-red-500/40 text-red-100'}`}>
          {toast.msg}
        </div>
      )}

      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <LandPlot size={26} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">Loteadora</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400 line-clamp-1">
              Gerencie loteamentos, lotes, o mapa interativo e as reservas
            </p>
          </div>
          <button onClick={() => { loadList(); selected && loadDetail(selected.id) }}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-500">
            <Plus size={14} /> Novo loteamento
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 space-y-5">
        {showCreate && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 flex flex-wrap items-end gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Nome *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className={input} placeholder="Ex.: Residencial Jardim Sul" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Cidade</label>
              <input value={newCity} onChange={e => setNewCity(e.target.value)} className={input} placeholder="Franca" /></div>
            <button onClick={createLoteamento} disabled={busy}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50">
              Criar
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Loteamentos list */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Loteamentos</h2>
              {list.length === 0 && <p className="text-sm text-gray-600">Nenhum loteamento ainda.</p>}
              {list.map(l => (
                <button key={l.id} onClick={() => loadDetail(l.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selected?.id === l.id ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-800 hover:border-gray-700'}`}>
                  <p className="font-medium text-white">{l.name}</p>
                  <p className="text-xs text-gray-500">{[l.city, l.state].filter(Boolean).join(' - ') || '—'}</p>
                  <div className="mt-1.5 flex gap-3 text-[11px] text-gray-400">
                    <span>{l.stats.count.total ?? 0} lotes</span>
                    <span className="text-emerald-400">{l.stats.count.AVAILABLE ?? 0} disp.</span>
                    <span className="text-gray-400">{l.stats.count.SOLD ?? 0} vend.</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected detail */}
            <div className="lg:col-span-2">
              {!selected ? (
                <p className="text-sm text-gray-600 py-10 text-center">Selecione um loteamento.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                    <a href={`/loteamentos/${selected.slug}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-amber-400 hover:underline">
                      Ver mapa público <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Launch dashboard */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['AVAILABLE', 'RESERVED', 'NEGOTIATING', 'SOLD'] as const).map(s => (
                      <div key={s} className="rounded-lg border border-gray-800 bg-gray-900/50 p-2.5">
                        <p className="text-lg font-bold text-white">{selected.stats.count[s] ?? 0}</p>
                        <p className="text-[11px] text-gray-500">{STATUS_LABEL[s]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-2.5">
                      <p className="text-sm font-bold text-amber-400">{brl(selected.stats.vgvTotal)}</p>
                      <p className="text-[11px] text-gray-500">VGV total</p>
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-2.5">
                      <p className="text-sm font-bold text-emerald-400">{brl(selected.stats.vgvSold)}</p>
                      <p className="text-[11px] text-gray-500">VGV vendido</p>
                    </div>
                  </div>

                  {/* Lot generator */}
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
                    <p className="text-xs font-semibold text-gray-400 mb-2">Gerar lotes em massa</p>
                    <div className="flex flex-wrap items-end gap-2">
                      <div><label className="block text-[10px] text-gray-500">Quadra</label>
                        <input value={gen.quadra} onChange={e => setGen({ ...gen, quadra: e.target.value })} className={`${input} w-16`} /></div>
                      <div><label className="block text-[10px] text-gray-500">Linha mapa</label>
                        <input value={gen.mapRow} onChange={e => setGen({ ...gen, mapRow: e.target.value })} className={`${input} w-16`} /></div>
                      <div><label className="block text-[10px] text-gray-500">Nº de</label>
                        <input value={gen.from} onChange={e => setGen({ ...gen, from: e.target.value })} className={`${input} w-14`} /></div>
                      <div><label className="block text-[10px] text-gray-500">até</label>
                        <input value={gen.to} onChange={e => setGen({ ...gen, to: e.target.value })} className={`${input} w-14`} /></div>
                      <div><label className="block text-[10px] text-gray-500">Área m²</label>
                        <input value={gen.area} onChange={e => setGen({ ...gen, area: e.target.value })} className={`${input} w-20`} /></div>
                      <div><label className="block text-[10px] text-gray-500">Preço R$</label>
                        <input value={gen.price} onChange={e => setGen({ ...gen, price: e.target.value })} className={`${input} w-24`} /></div>
                      <button onClick={generateLotes} disabled={busy}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50">
                        Gerar
                      </button>
                    </div>
                  </div>

                  {/* Lots table */}
                  <div className="rounded-xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-900/60 text-left text-xs uppercase text-gray-500">
                        <tr><th className="px-3 py-2">Lote</th><th className="px-3 py-2">Área</th>
                          <th className="px-3 py-2">Preço</th><th className="px-3 py-2">Status</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {(selected.lotes ?? []).length === 0 && (
                          <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-600">Sem lotes — gere acima.</td></tr>
                        )}
                        {(selected.lotes ?? []).map(lote => (
                          <tr key={lote.id} className="hover:bg-gray-900/40">
                            <td className="px-3 py-2 text-white">{lote.quadra ? `Q${lote.quadra} ` : ''}{lote.numero}</td>
                            <td className="px-3 py-2 text-gray-400">{lote.area ? `${lote.area} m²` : '—'}</td>
                            <td className="px-3 py-2 text-gray-400">{lote.price ? brl(Number(lote.price)) : '—'}</td>
                            <td className="px-3 py-2">
                              <select value={lote.status} disabled={busy}
                                onChange={e => updateLote(lote.id, { status: e.target.value })}
                                className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-white focus:border-amber-500 focus:outline-none">
                                {LOTE_STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
