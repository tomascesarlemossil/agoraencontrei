'use client'

import { useState } from 'react'
import { Split, Plus, Trash2, Save, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { locacaoFetch } from '@/lib/locacao-api'

type Benef = { clientId?: string; name: string; percentage: number; role: string; bankName?: string; pixKey?: string; isActive: boolean }

const ROLES = [
  { v: 'OWNER', l: 'Proprietário' },
  { v: 'SECONDARY', l: 'Locador secundário' },
  { v: 'FAVORED', l: 'Favorecido' },
]

export default function RateioRepassePage() {
  const token = useAuthStore(s => s.accessToken)
  const [contractId, setContractId] = useState('')
  const [rows, setRows] = useState<Benef[]>([])
  const [loaded, setLoaded] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const sum = rows.filter(r => r.isActive).reduce((s, r) => s + (Number(r.percentage) || 0), 0)

  async function load() {
    if (!contractId) return
    setMsg(null)
    try {
      const r = await locacaoFetch(token, `/api/v1/repasse/contracts/${contractId}/beneficiaries`)
      setRows((r.data ?? []).map((b: any) => ({ clientId: b.clientId ?? '', name: b.name, percentage: Number(b.percentage), role: b.role, bankName: b.bankName ?? '', pixKey: b.pixKey ?? '', isActive: b.isActive })))
      setLoaded(true)
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  function update(i: number, patch: Partial<Benef>) { setRows(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r)) }
  function add() { setRows([...rows, { name: '', percentage: 0, role: 'OWNER', isActive: true }]) }
  function remove(i: number) { setRows(rows.filter((_, idx) => idx !== i)) }

  async function save() {
    setMsg(null)
    if (rows.length > 0 && Math.abs(sum - 100) > 0.01) { setMsg({ type: 'error', text: `A soma dos % ativos é ${sum.toFixed(2)}% (precisa ser 100%).` }); return }
    try {
      await locacaoFetch(token, `/api/v1/repasse/contracts/${contractId}/beneficiaries`, {
        method: 'PUT',
        body: JSON.stringify({ beneficiaries: rows.map(r => ({ ...r, clientId: r.clientId || undefined, percentage: Number(r.percentage) })) }),
      })
      setMsg({ type: 'success', text: 'Rateio salvo.' })
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-1"><Split size={24} /> Rateio de Repasse</h1>
      <p className="text-sm text-gray-500 mb-6">Divide o repasse do contrato entre vários proprietários/favorecidos por percentual. Sem beneficiários, o repasse vai 100% ao locador do contrato.</p>

      {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      <div className="flex gap-2 mb-6">
        <input placeholder="ID do contrato" className="border rounded-lg px-3 py-2 text-sm flex-1" value={contractId} onChange={e => setContractId(e.target.value)} />
        <button onClick={load} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-1"><Search size={16} /> Carregar</button>
      </div>

      {loaded && (
        <>
          <div className="rounded-xl border bg-white overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="p-2">Nome</th><th className="p-2">Papel</th><th className="p-2 w-24">%</th><th className="p-2">Client ID</th><th className="p-2">PIX</th><th className="p-2">Ativo</th><th className="p-2"></th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2"><input className="border rounded px-2 py-1 w-full" value={r.name} onChange={e => update(i, { name: e.target.value })} /></td>
                    <td className="p-2"><select className="border rounded px-2 py-1" value={r.role} onChange={e => update(i, { role: e.target.value })}>{ROLES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select></td>
                    <td className="p-2"><input type="number" step="0.01" className="border rounded px-2 py-1 w-20" value={r.percentage} onChange={e => update(i, { percentage: parseFloat(e.target.value) || 0 })} /></td>
                    <td className="p-2"><input className="border rounded px-2 py-1 w-full" value={r.clientId ?? ''} onChange={e => update(i, { clientId: e.target.value })} /></td>
                    <td className="p-2"><input className="border rounded px-2 py-1 w-full" value={r.pixKey ?? ''} onChange={e => update(i, { pixKey: e.target.value })} /></td>
                    <td className="p-2 text-center"><input type="checkbox" checked={r.isActive} onChange={e => update(i, { isActive: e.target.checked })} /></td>
                    <td className="p-2"><button onClick={() => remove(i)} className="text-red-500"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-gray-400">Sem beneficiários — repasse integral ao locador.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={add} className="px-3 py-2 rounded-lg border text-sm flex items-center gap-1"><Plus size={16} /> Adicionar</button>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${Math.abs(sum - 100) > 0.01 && rows.length > 0 ? 'text-red-600' : 'text-green-600'}`}>Soma ativa: {sum.toFixed(2)}%</span>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm flex items-center gap-1"><Save size={16} /> Salvar rateio</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
