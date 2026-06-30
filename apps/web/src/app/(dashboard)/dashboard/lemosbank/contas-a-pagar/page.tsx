'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckCircle, XCircle, Clock, Banknote, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { locacaoFetch, fmtBRL, fmtDate, todayISO } from '@/lib/locacao-api'

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: '#d97706' },
  PAID: { label: 'Paga', color: '#16a34a' },
  CANCELLED: { label: 'Cancelada', color: '#6b7280' },
}

export default function ContasAPagarPage() {
  const token = useAuthStore(s => s.accessToken)
  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', payeeName: '', category: '', amount: '', dueDate: todayISO() })

  const load = useCallback(async () => {
    setLoading(true); setMsg(null)
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : ''
      const [list, sum] = await Promise.all([
        locacaoFetch(token, `/api/v1/payables${qs}`),
        locacaoFetch(token, '/api/v1/payables/summary'),
      ])
      setItems(list.data?.items ?? [])
      setSummary(sum.data)
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
    finally { setLoading(false) }
  }, [token, statusFilter])

  useEffect(() => { if (token) load() }, [token, load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    try {
      await locacaoFetch(token, '/api/v1/payables', {
        method: 'POST',
        body: JSON.stringify({
          description: form.description,
          payeeName: form.payeeName,
          category: form.category || undefined,
          amount: parseFloat(form.amount),
          dueDate: form.dueDate,
        }),
      })
      setMsg({ type: 'success', text: 'Conta criada.' })
      setShowForm(false)
      setForm({ description: '', payeeName: '', category: '', amount: '', dueDate: todayISO() })
      load()
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  async function pay(id: string) {
    try { await locacaoFetch(token, `/api/v1/payables/${id}/pay`, { method: 'POST', body: '{}' }); load() }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }
  async function cancel(id: string) {
    if (!confirm('Cancelar esta conta?')) return
    try { await locacaoFetch(token, `/api/v1/payables/${id}`, { method: 'DELETE' }); load() }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote size={24} /> Contas a Pagar</h1>
          <p className="text-sm text-gray-500">Despesas da imobiliária e de terceiros (favorecido, vencimento, baixa).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"><RefreshCw size={16} /> Atualizar</button>
          <button onClick={() => setShowForm(v => !v)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-1"><Plus size={16} /> Nova conta</button>
        </div>
      </div>

      {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {summary.byStatus?.map((s: any) => (
            <div key={s.status} className="p-4 rounded-xl border bg-white">
              <div className="text-xs text-gray-500">{STATUS[s.status]?.label ?? s.status}</div>
              <div className="text-lg font-bold">{fmtBRL(s.total)}</div>
              <div className="text-xs text-gray-400">{s.count} conta(s)</div>
            </div>
          ))}
          <div className="p-4 rounded-xl border bg-amber-50">
            <div className="text-xs text-amber-700">Vencidas</div>
            <div className="text-lg font-bold text-amber-800">{fmtBRL(summary.overdue?.total ?? 0)}</div>
            <div className="text-xs text-amber-600">{summary.overdue?.count ?? 0} conta(s)</div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={create} className="mb-6 p-4 rounded-xl border bg-gray-50 grid md:grid-cols-2 gap-3">
          <input required placeholder="Descrição" className="border rounded-lg px-3 py-2 text-sm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input required placeholder="Favorecido" className="border rounded-lg px-3 py-2 text-sm" value={form.payeeName} onChange={e => setForm({ ...form, payeeName: e.target.value })} />
          <input placeholder="Categoria (opcional)" className="border rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <input required type="number" step="0.01" min="0" placeholder="Valor" className="border rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <input required type="date" className="border rounded-lg px-3 py-2 text-sm" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Descrição</th><th className="p-3">Favorecido</th><th className="p-3">Vencimento</th>
              <th className="p-3 text-right">Valor</th><th className="p-3">Status</th><th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-6 text-center text-gray-400">Carregando…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400">Nenhuma conta a pagar.</td></tr>}
            {items.map(it => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{it.description}</td>
                <td className="p-3">{it.payeeName}</td>
                <td className="p-3">{fmtDate(it.dueDate)}</td>
                <td className="p-3 text-right font-medium">{fmtBRL(it.amount)}</td>
                <td className="p-3"><span style={{ color: STATUS[it.status]?.color }} className="font-medium">{STATUS[it.status]?.label ?? it.status}</span></td>
                <td className="p-3 text-right">
                  {it.status === 'PENDING' && (
                    <span className="inline-flex gap-2">
                      <button onClick={() => pay(it.id)} title="Marcar como paga" className="text-green-600"><CheckCircle size={18} /></button>
                      <button onClick={() => cancel(it.id)} title="Cancelar" className="text-gray-400"><XCircle size={18} /></button>
                    </span>
                  )}
                  {it.status === 'PAID' && <span className="text-xs text-gray-400 flex items-center gap-1 justify-end"><Clock size={14} /> {fmtDate(it.paidAt)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
