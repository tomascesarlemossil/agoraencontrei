'use client'

import { useState, useEffect, useCallback } from 'react'
import { Home, Plus, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { locacaoFetch, fmtBRL, fmtDate, todayISO } from '@/lib/locacao-api'

const STATUS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Aberto', color: '#2563eb' },
  SETTLED: { label: 'Quitado', color: '#16a34a' },
  CANCELLED: { label: 'Cancelado', color: '#6b7280' },
}

export default function IptuPage() {
  const token = useAuthStore(s => s.accessToken)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [f, setF] = useState({ propertyId: '', contractId: '', year: String(new Date().getFullYear()), iptuCode: '', totalAmount: '', installments: '10', firstDueDate: todayISO(), chargeToTenant: true })

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await locacaoFetch(token, '/api/v1/iptu'); setItems(r.data ?? []) }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { if (token) load() }, [token, load])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    try {
      await locacaoFetch(token, '/api/v1/iptu', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: f.propertyId || undefined, contractId: f.contractId || undefined,
          year: parseInt(f.year), iptuCode: f.iptuCode || undefined,
          totalAmount: parseFloat(f.totalAmount), installments: parseInt(f.installments),
          firstDueDate: f.firstDueDate, chargeToTenant: f.chargeToTenant,
        }),
      })
      setMsg({ type: 'success', text: 'Carnê de IPTU criado.' }); setShowForm(false); load()
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }
  async function pay(carneId: string, number: number) {
    try { await locacaoFetch(token, `/api/v1/iptu/${carneId}/installments/${number}/pay`, { method: 'POST', body: '{}' }); load() }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Home size={24} /> Carnê de IPTU</h1>
          <p className="text-sm text-gray-500">IPTU anual por imóvel, parcelado e (opcionalmente) rateado ao inquilino.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"><RefreshCw size={16} /> Atualizar</button>
          <button onClick={() => setShowForm(v => !v)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-1"><Plus size={16} /> Novo carnê</button>
        </div>
      </div>

      {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      {showForm && (
        <form onSubmit={create} className="mb-6 p-4 rounded-xl border bg-gray-50 grid md:grid-cols-3 gap-3">
          <label className="text-sm">Imóvel (ID, opcional)<input className="border rounded-lg px-3 py-2 w-full mt-1" value={f.propertyId} onChange={e => setF({ ...f, propertyId: e.target.value })} /></label>
          <label className="text-sm">Contrato (ID, opcional)<input className="border rounded-lg px-3 py-2 w-full mt-1" value={f.contractId} onChange={e => setF({ ...f, contractId: e.target.value })} /></label>
          <label className="text-sm">Ano*<input required type="number" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.year} onChange={e => setF({ ...f, year: e.target.value })} /></label>
          <label className="text-sm">Inscrição/Carnê<input className="border rounded-lg px-3 py-2 w-full mt-1" value={f.iptuCode} onChange={e => setF({ ...f, iptuCode: e.target.value })} /></label>
          <label className="text-sm">Valor total*<input required type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.totalAmount} onChange={e => setF({ ...f, totalAmount: e.target.value })} /></label>
          <label className="text-sm">Nº parcelas*<input required type="number" min="1" max="24" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.installments} onChange={e => setF({ ...f, installments: e.target.value })} /></label>
          <label className="text-sm">1º vencimento*<input required type="date" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.firstDueDate} onChange={e => setF({ ...f, firstDueDate: e.target.value })} /></label>
          <label className="text-sm flex items-center gap-2 mt-6"><input type="checkbox" checked={f.chargeToTenant} onChange={e => setF({ ...f, chargeToTenant: e.target.checked })} /> Ratear ao inquilino</label>
          <div className="flex items-end gap-2"><button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Salvar</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-sm">Cancelar</button></div>
        </form>
      )}

      <div className="space-y-3">
        {loading && <div className="p-6 text-center text-gray-400">Carregando…</div>}
        {!loading && items.length === 0 && <div className="p-6 text-center text-gray-400 border rounded-xl">Nenhum carnê de IPTU.</div>}
        {items.map(c => (
          <div key={c.id} className="rounded-xl border bg-white">
            <div className="p-4 flex items-center justify-between flex-wrap gap-2 cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div>
                <div className="font-medium">IPTU {c.year} · {fmtBRL(c.totalAmount)} em {c.installments}x {c.iptuCode ? `· ${c.iptuCode}` : ''}</div>
                <div className="text-xs text-gray-500">{c.chargeToTenant ? 'Rateado ao inquilino' : 'Não rateado'}</div>
              </div>
              <span style={{ color: STATUS[c.status]?.color }} className="font-medium text-sm">{STATUS[c.status]?.label ?? c.status}</span>
            </div>
            {expanded === c.id && (
              <div className="border-t p-4">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500"><tr><th className="py-1">Parcela</th><th>Vencimento</th><th className="text-right">Valor</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {c.schedule?.map((p: any) => (
                      <tr key={p.id} className="border-t">
                        <td className="py-2">{p.number}/{c.installments}</td>
                        <td>{fmtDate(p.dueDate)}</td>
                        <td className="text-right">{fmtBRL(p.amount)}</td>
                        <td>{p.status === 'PAID' ? <span className="text-green-600">Paga</span> : 'Pendente'}</td>
                        <td className="text-right">{p.status !== 'PAID' && c.status === 'OPEN' && <button onClick={() => pay(c.id, p.number)} className="text-green-600" title="Dar baixa"><CheckCircle size={18} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
