'use client'

import { useState } from 'react'
import { Scissors, Calculator, Save } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { locacaoFetch, fmtBRL, todayISO } from '@/lib/locacao-api'

export default function AcertoRescisaoPage() {
  const token = useAuthStore(s => s.accessToken)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [result, setResult] = useState<any>(null)
  const [contractId, setContractId] = useState('')
  const [f, setF] = useState({
    monthlyRent: '', exitDate: todayISO(), contractStart: '', contractEnd: '',
    monthlyIptu: '', penaltyBaseValue: '', outstandingValue: '', bonusValue: '', depositHeld: '',
    penaltyProportional: true,
  })

  function body() {
    const num = (v: string) => (v === '' ? undefined : parseFloat(v))
    return {
      monthlyRent: num(f.monthlyRent), exitDate: f.exitDate,
      contractStart: f.contractStart || undefined, contractEnd: f.contractEnd || undefined,
      monthlyIptu: num(f.monthlyIptu), penaltyBaseValue: num(f.penaltyBaseValue),
      penaltyProportional: f.penaltyProportional,
      outstandingValue: num(f.outstandingValue), bonusValue: num(f.bonusValue), depositHeld: num(f.depositHeld),
    }
  }

  async function preview(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    try {
      const r = await locacaoFetch(token, '/api/v1/rescission/preview', { method: 'POST', body: JSON.stringify(body()) })
      setResult(r.data)
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); setResult(null) }
  }

  async function persist() {
    if (!contractId) { setMsg({ type: 'error', text: 'Informe o ID do contrato para salvar.' }); return }
    try {
      await locacaoFetch(token, `/api/v1/rescission/contracts/${contractId}`, { method: 'POST', body: JSON.stringify(body()) })
      setMsg({ type: 'success', text: 'Rescisão calculada e salva no contrato.' })
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-1"><Scissors size={24} /> Acerto de Rescisão</h1>
      <p className="text-sm text-gray-500 mb-6">Calcula o saldo de saída: aluguel e IPTU proporcionais, multa proporcional ao período restante (Lei 8.245/91), débitos, bonificação e caução.</p>

      {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={preview} className="p-4 rounded-xl border bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Aluguel mensal*<input required type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.monthlyRent} onChange={e => setF({ ...f, monthlyRent: e.target.value })} /></label>
            <label className="text-sm">Data de saída*<input required type="date" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.exitDate} onChange={e => setF({ ...f, exitDate: e.target.value })} /></label>
            <label className="text-sm">Início do contrato*<input required type="date" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.contractStart} onChange={e => setF({ ...f, contractStart: e.target.value })} /></label>
            <label className="text-sm">Término previsto*<input required type="date" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.contractEnd} onChange={e => setF({ ...f, contractEnd: e.target.value })} /></label>
            <label className="text-sm">IPTU mensal<input type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.monthlyIptu} onChange={e => setF({ ...f, monthlyIptu: e.target.value })} /></label>
            <label className="text-sm">Multa-base (3x aluguel)<input type="number" step="0.01" placeholder="auto" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.penaltyBaseValue} onChange={e => setF({ ...f, penaltyBaseValue: e.target.value })} /></label>
            <label className="text-sm">Débitos em aberto<input type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.outstandingValue} onChange={e => setF({ ...f, outstandingValue: e.target.value })} /></label>
            <label className="text-sm">Bonificação<input type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.bonusValue} onChange={e => setF({ ...f, bonusValue: e.target.value })} /></label>
            <label className="text-sm">Caução a devolver<input type="number" step="0.01" className="border rounded-lg px-3 py-2 w-full mt-1" value={f.depositHeld} onChange={e => setF({ ...f, depositHeld: e.target.value })} /></label>
          </div>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={f.penaltyProportional} onChange={e => setF({ ...f, penaltyProportional: e.target.checked })} /> Multa proporcional ao período restante</label>
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-1"><Calculator size={16} /> Calcular</button>
        </form>

        <div className="p-4 rounded-xl border bg-white">
          {!result && <p className="text-sm text-gray-400">Preencha e clique em Calcular para ver o acerto.</p>}
          {result && (
            <>
              <h2 className="font-semibold mb-3">Resultado</h2>
              <table className="w-full text-sm mb-4">
                <tbody>
                  {result.items?.map((i: any) => (
                    <tr key={i.key} className="border-t">
                      <td className="py-1.5">{i.label}{i.detail ? <span className="text-gray-400"> ({i.detail})</span> : ''}</td>
                      <td className={`py-1.5 text-right ${i.kind === 'credit' ? 'text-green-600' : 'text-gray-800'}`}>{i.kind === 'credit' ? '− ' : ''}{fmtBRL(i.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between text-sm border-t pt-2"><span>Total débitos</span><span>{fmtBRL(result.totalDebits)}</span></div>
              <div className="flex justify-between text-sm"><span>Total créditos</span><span>− {fmtBRL(result.totalCredits)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t mt-2 pt-2">
                <span>{result.settlement === 'TENANT_REFUND' ? 'A devolver ao inquilino' : 'Inquilino deve'}</span>
                <span>{fmtBRL(Math.abs(result.netResult))}</span>
              </div>
              <div className="mt-4 pt-4 border-t">
                <label className="text-sm block mb-1">Salvar no contrato (ID):</label>
                <div className="flex gap-2">
                  <input placeholder="contractId" className="border rounded-lg px-3 py-2 text-sm flex-1" value={contractId} onChange={e => setContractId(e.target.value)} />
                  <button onClick={persist} className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm flex items-center gap-1"><Save size={16} /> Salvar</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
