'use client'

import { useState, useEffect, useCallback } from 'react'
import { Landmark, Upload, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { locacaoFetch, fmtDate } from '@/lib/locacao-api'

export default function ConciliacaoPage() {
  const token = useAuthStore(s => s.accessToken)
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [source, setSource] = useState<'CSV' | 'CNAB400'>('CSV')
  const [content, setContent] = useState('')
  const [delimiter, setDelimiter] = useState(';')
  const [autoSettle, setAutoSettle] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await locacaoFetch(token, '/api/v1/reconciliation'); setBatches(r.data ?? []) }
    catch (e: any) { setMsg({ type: 'error', text: e.message }) }
    finally { setLoading(false) }
  }, [token])
  useEffect(() => { if (token) load() }, [token, load])

  async function doImport() {
    setMsg(null)
    if (!content.trim()) { setMsg({ type: 'error', text: 'Cole o conteúdo do extrato/arquivo.' }); return }
    try {
      const r = await locacaoFetch(token, '/api/v1/reconciliation/import', {
        method: 'POST',
        body: JSON.stringify({ source, content, delimiter: source === 'CSV' ? delimiter : undefined, autoSettle }),
      })
      setMsg({ type: 'success', text: `Importado: ${r.data.matchedCount} conciliado(s), ${r.data.settled} baixado(s).` })
      setContent(''); load()
    } catch (e: any) { setMsg({ type: 'error', text: e.message }) }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-1"><Landmark size={24} /> Conciliação Bancária</h1>
      <p className="text-sm text-gray-500 mb-6">Importa extrato (CSV) ou retorno bancário (CNAB400) e concilia com os aluguéis em aberto (por nosso número ou valor+data).</p>

      {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      <div className="p-4 rounded-xl border bg-gray-50 mb-6 space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          <select value={source} onChange={e => setSource(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="CSV">CSV (extrato)</option>
            <option value="CNAB400">CNAB400 (retorno)</option>
          </select>
          {source === 'CSV' && (
            <select value={delimiter} onChange={e => setDelimiter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
              <option value=";">Delimitador ;</option>
              <option value=",">Delimitador ,</option>
            </select>
          )}
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={autoSettle} onChange={e => setAutoSettle(e.target.checked)} /> Dar baixa automática nos conciliados</label>
        </div>
        <textarea
          className="border rounded-lg px-3 py-2 text-sm w-full font-mono h-40"
          placeholder={source === 'CSV' ? 'data;valor;descricao;nossonumero;tipo\n2026-06-10;1.500,00;Aluguel;000123;C' : 'Cole as linhas do arquivo de retorno CNAB400…'}
          value={content} onChange={e => setContent(e.target.value)}
        />
        <button onClick={doImport} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-1"><Upload size={16} /> Importar e conciliar</button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Lotes importados</h2>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1"><RefreshCw size={14} /> Atualizar</button>
      </div>
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Data</th><th className="p-3">Origem</th><th className="p-3">Entradas</th><th className="p-3">Conciliadas</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Carregando…</td></tr>}
            {!loading && batches.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nenhum lote importado.</td></tr>}
            {batches.map(b => (
              <tr key={b.id} className="border-t">
                <td className="p-3">{fmtDate(b.importedAt)}</td>
                <td className="p-3">{b.source}</td>
                <td className="p-3">{b.totalEntries}</td>
                <td className="p-3">{b.matchedCount} / {b.totalEntries}</td>
                <td className="p-3">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
