'use client'

import { useState, useEffect, useCallback } from 'react'
import { Handshake, Plus, Eye, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { locacaoFetch, fmtBRL, fmtDate, todayISO } from '@/lib/locacao-api'

const STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Ativo', color: '#2563eb' },
  FULFILLED: { label: 'Cumprido', color: '#16a34a' },
  BROKEN: { label: 'Quebrado', color: '#dc2626' },
  CANCELLED: { label: 'Cancelado', color: '#6b7280' },
}

export default function AcordosPage() {
  const token = useAuthStore(s => s.accessToken)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [f, setF] = useState({ contractId: '', tenantName: '', originalDebt: '', discountValue: '0', agreedValue: '', installments: '1', firstDueDate: todayISO(), intervalMonths: '1' })

  const load = useCallback(async () => {
    setLoading(true); setMsg(null)
    try { const r = await locacaoFetch(token, '/api/v1/agreements'); setItems(r.data ?? []) }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { if (token) load() }, [token, load])

  function payload() {
    return {
      contractId: f.contractId || undefined, tenantName: f.tenantName || undefined,
      originalDebt: parseFloat(f.originalDebt), discountValue: parseFloat(f.discountValue || '0'),
      agreedValue: parseFloat(f.agreedValue), installments: parseInt(f.installments),
      firstDueDate: f.firstDueDate, intervalMonths: parseInt(f.intervalMonths || '1'),
    }
  }

  async function doPreview() {
    setMsg(null)
    try {
      const r = await locacaoFetch(token, '/api/v1/agreements/preview', {
        method: 'POST',
        body: JSON.stringify({ agreedValue: parseFloat(f.agreedValue || '0'), installments: parseInt(f.installments || '1'), firstDueDate: f.firstDueDate, intervalMonths: parseInt(f.intervalMonths || '1') }),
      })
      setPreview(r.data)
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    try {
      await locacaoFetch(token, '/api/v1/agreements', { method: 'POST', body: JSON.stringify(payload()) })
      setMsg({ type: 'success', text: 'Acordo criado.' }); setShowForm(false); setPreview(null); load()
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  async function payInstallment(agreementId: string, number: number) {
    try { await locacaoFetch(token, `/api/v1/agreements/${agreementId}/installments/${number}/pay`, { method: 'POST', body: '{}' }); load() }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Handshake size={24} /> Acordos / Renegociação</h1>
          <p className="text-sm text-gray-500">Reparcela débitos em atraso num novo cronograma.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"><RefreshCw size={16} /> Atualizar</button>
          <button onClick={() => setShowForm(v => !v)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-1"><Plus size={16} /> Novo acordo</button>
        </div>
      </div>

      {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      {showForm && (
        <form onSubmit={create} className="mb-6 p-4 rounded-xl border bg-gray-50 grid md:grid-cols-3 gap-3">
          <label className="text-sm">Contrato (ID, opcional)<input className="border rounded-lg px-3 py-2 w-full mt-1" value={f.contractId} onChange={e => setF({ ...f, contractId: e.target.value })} /></label>
          <label className="text-sm">Inquilino<input className="border rounded-lg px-3 py-2 w-full mt-1" value={f.tenantName} onChange={e => setF({ ...f, tenantName: e.target.value })} /></label>
          <label className="text-sm">Dívida original*<input required type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.originalDebt} onChange={e => setF({ ...f, originalDebt: e.target.value })} /></label>
          <label className="text-sm">Desconto<input type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.discountValue} onChange={e => setF({ ...f, discountValue: e.target.value })} /></label>
          <label className="text-sm">Valor acordado*<input required type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.agreedValue} onChange={e => setF({ ...f, agreedValue: e.target.value })} /></label>
          <label className="text-sm">Nº parcelas*<input required type="number" min="1" max="120" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.installments} onChange={e => setF({ ...f, installments: e.target.value })} /></label>
          <label className="text-sm">1º vencimento*<input required type="date" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.firstDueDate} onChange={e => setF({ ...f, firstDueDate: e.target.value })} /></label>
          <label className="text-sm">Intervalo (meses)<input type="number" min="1" max="12" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.intervalMonths} onChange={e => setF({ ...f, intervalMonths: e.target.value })} /></label>
          <div className="flex items-end gap-2">
            <button type="button" onClick={doPreview} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"><Eye size={16} /> Prever parcelas</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Salvar</button>
          </div>
          {preview && (
            <div className="md:col-span-3 bg-white rounded-lg border p-3">
              <div className="text-xs text-gray-500 mb-2">Cronograma previsto:</div>
              <div className="flex flex-wrap gap-2">
                {preview.map(p => <span key={p.number} className="text-xs bg-gray-100 rounded px-2 py-1">{p.number}) {fmtDate(p.dueDate)} — {fmtBRL(p.amount)}</span>)}
              </div>
            </div>
          )}
        </form>
      )}

      <div className="space-y-3">
        {loading && <div className="p-6 text-center text-gray-400">Carregando…</div>}
        {!loading && items.length === 0 && <div className="p-6 text-center text-gray-400 border rounded-xl">Nenhum acordo.</div>}
        {items.map(a => (
          <div key={a.id} className="rounded-xl border bg-white">
            <div className="p-4 flex items-center justify-between flex-wrap gap-2 cursor-pointer" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
              <div>
                <div className="font-medium">{a.tenantName || 'Acordo'} · {fmtBRL(a.agreedValue)} em {a.installments}x</div>
                <div className="text-xs text-gray-500">Dívida original {fmtBRL(a.originalDebt)} · desconto {fmtBRL(a.discountValue)}</div>
              </div>
              <span style={{ color: STATUS[a.status]?.color }} className="font-medium text-sm">{STATUS[a.status]?.label ?? a.status}</span>
            </div>
            {expanded === a.id && (
              <div className="border-t p-4">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500"><tr><th className="py-1">Parcela</th><th>Vencimento</th><th className="text-right">Valor</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {a.schedule?.map((p: any) => (
                      <tr key={p.id} className="border-t">
                        <td className="py-2">{p.number}</td>
                        <td>{fmtDate(p.dueDate)}</td>
                        <td className="text-right">{fmtBRL(p.amount)}</td>
                        <td>{p.status === 'PAID' ? <span className="text-green-600">Paga</span> : 'Pendente'}</td>
                        <td className="text-right">{p.status !== 'PAID' && a.status === 'ACTIVE' && <button onClick={() => payInstallment(a.id, p.number)} className="text-green-600" title="Dar baixa"><CheckCircle size={18} /></button>}</td>
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
