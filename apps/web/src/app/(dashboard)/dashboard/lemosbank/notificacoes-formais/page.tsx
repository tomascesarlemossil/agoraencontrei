'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileWarning, Plus, Send, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { locacaoFetch, fmtDate } from '@/lib/locacao-api'

const TYPES = [
  { v: 'AVISO_COBRANCA', l: 'Aviso de cobrança' },
  { v: 'EXTRAJUDICIAL', l: 'Notificação extrajudicial' },
  { v: 'DESPEJO', l: 'Despejo' },
  { v: 'REAJUSTE', l: 'Reajuste' },
  { v: 'RENOVACAO', l: 'Renovação' },
  { v: 'OUTRO', l: 'Outro' },
]
const STATUS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Aberta', color: '#d97706' },
  SENT: { label: 'Enviada', color: '#2563eb' },
  ACKNOWLEDGED: { label: 'Ciente', color: '#7c3aed' },
  RESOLVED: { label: 'Resolvida', color: '#16a34a' },
  CANCELLED: { label: 'Cancelada', color: '#6b7280' },
}

export default function NotificacoesFormaisPage() {
  const token = useAuthStore(s => s.accessToken)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [f, setF] = useState({ contractId: '', recipient: 'TENANT', recipientName: '', type: 'AVISO_COBRANCA', subject: '', body: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await locacaoFetch(token, '/api/v1/notices'); setItems(r.data ?? []) }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { if (token) load() }, [token, load])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    try {
      await locacaoFetch(token, '/api/v1/notices', {
        method: 'POST',
        body: JSON.stringify({ contractId: f.contractId || undefined, recipient: f.recipient, recipientName: f.recipientName || undefined, type: f.type, subject: f.subject, body: f.body || undefined }),
      })
      setMsg({ type: 'success', text: 'Notificação criada.' }); setShowForm(false)
      setF({ contractId: '', recipient: 'TENANT', recipientName: '', type: 'AVISO_COBRANCA', subject: '', body: '' }); load()
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }
  async function act(id: string, action: 'send' | 'resolve') {
    try { await locacaoFetch(token, `/api/v1/notices/${id}/${action}`, { method: 'POST', body: '{}' }); load() }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileWarning size={24} /> Notificações Formais</h1>
          <p className="text-sm text-gray-500">Avisos e notificações extrajudiciais (cobrança → jurídico).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"><RefreshCw size={16} /> Atualizar</button>
          <button onClick={() => setShowForm(v => !v)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-1"><Plus size={16} /> Nova</button>
        </div>
      </div>

      {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      {showForm && (
        <form onSubmit={create} className="mb-6 p-4 rounded-xl border bg-gray-50 grid md:grid-cols-2 gap-3">
          <label className="text-sm">Contrato (ID, opcional)<input className="border rounded-lg px-3 py-2 w-full mt-1" value={f.contractId} onChange={e => setF({ ...f, contractId: e.target.value })} /></label>
          <label className="text-sm">Destinatário<select className="border rounded-lg px-3 py-2 w-full mt-1" value={f.recipient} onChange={e => setF({ ...f, recipient: e.target.value })}><option value="TENANT">Inquilino</option><option value="LANDLORD">Proprietário</option><option value="OTHER">Outro</option></select></label>
          <label className="text-sm">Nome do destinatário<input className="border rounded-lg px-3 py-2 w-full mt-1" value={f.recipientName} onChange={e => setF({ ...f, recipientName: e.target.value })} /></label>
          <label className="text-sm">Tipo<select className="border rounded-lg px-3 py-2 w-full mt-1" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}</select></label>
          <label className="text-sm md:col-span-2">Assunto*<input required className="border rounded-lg px-3 py-2 w-full mt-1" value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /></label>
          <label className="text-sm md:col-span-2">Conteúdo<textarea className="border rounded-lg px-3 py-2 w-full mt-1 h-24" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></label>
          <div className="flex gap-2"><button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Salvar</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-sm">Cancelar</button></div>
        </form>
      )}

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Data</th><th className="p-3">Tipo</th><th className="p-3">Destinatário</th><th className="p-3">Assunto</th><th className="p-3">Status</th><th className="p-3 text-right">Ações</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-6 text-center text-gray-400">Carregando…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-400">Nenhuma notificação.</td></tr>}
            {items.map(n => (
              <tr key={n.id} className="border-t">
                <td className="p-3">{fmtDate(n.noticeDate)}</td>
                <td className="p-3">{TYPES.find(t => t.v === n.type)?.l ?? n.type}</td>
                <td className="p-3">{n.recipientName || n.recipient}</td>
                <td className="p-3">{n.subject}</td>
                <td className="p-3"><span style={{ color: STATUS[n.status]?.color }} className="font-medium">{STATUS[n.status]?.label ?? n.status}</span></td>
                <td className="p-3 text-right">
                  <span className="inline-flex gap-2">
                    {n.status === 'OPEN' && <button onClick={() => act(n.id, 'send')} title="Marcar enviada" className="text-blue-600"><Send size={16} /></button>}
                    {n.status !== 'RESOLVED' && n.status !== 'CANCELLED' && <button onClick={() => act(n.id, 'resolve')} title="Resolver" className="text-green-600"><CheckCircle size={16} /></button>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
