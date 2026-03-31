'use client'

import { useState, useCallback } from 'react'
import { FileText, Download, RefreshCw, Plus, CheckCircle, Clock, XCircle, AlertTriangle, Send, Inbox } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT:     { label: 'Rascunho',  color: '#6b7280', icon: Clock },
  ISSUED:    { label: 'Emitida',   color: '#2563eb', icon: FileText },
  SENT:      { label: 'Enviada',   color: '#7c3aed', icon: Send },
  RECEIVED:  { label: 'Recebida', color: '#16a34a', icon: Inbox },
  CANCELLED: { label: 'Cancelada', color: '#dc2626', icon: XCircle },
  ERROR:     { label: 'Erro',      color: '#d97706', icon: AlertTriangle },
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function FiscalPage() {
  const accessToken = useAuthStore(s => s.accessToken)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [statusFilter, setStatusFilter] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const apiFetch = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { 'Authorization': `Bearer ${accessToken ?? ''}`, 'Content-Type': 'application/json', ...opts?.headers },
      credentials: 'include',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? 'Erro na requisição')
    }
    return res
  }, [accessToken])

  const load = useCallback(async () => {
    setLoading(true)
    setMsg(null)
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await apiFetch(`/api/v1/fiscal?${params}`)
      setData(await res.json())
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }, [month, year, statusFilter])

  const handleGenerate = async () => {
    if (!confirm(`Gerar notas fiscais para ${MONTHS[month - 1]}/${year}?\n\nIsso criará NFS-e para todos os contratos ativos do mês.`)) return
    setGenerating(true)
    setMsg(null)
    try {
      const res = await apiFetch('/api/v1/fiscal/gerar', {
        method: 'POST',
        body: JSON.stringify({ month, year }),
      })
      const result = await res.json()
      setMsg({ type: 'success', text: result.message })
      load()
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadXml = async (id: string, landlordName: string) => {
    try {
      const res = await apiFetch(`/api/v1/fiscal/${id}/xml`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nfse_${landlordName.replace(/\s+/g, '_')}_${month}_${year}.xml`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      a.remove()
    } catch (e: any) {
      alert('Erro ao baixar XML: ' + e.message)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/v1/fiscal/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      load()
    } catch (e: any) {
      alert('Erro ao atualizar status: ' + e.message)
    }
  }

  const notes: any[] = data?.data ?? []
  const stats = data?.stats

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Notas Fiscais de Serviço
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          NFS-e de administração e intermediação imobiliária · CNPJ 10.962.301/0001-50 · CCM 52525
        </p>
      </div>

      {/* Regra de negócio */}
      <div className="rounded-xl p-4 text-sm flex gap-3" style={{ backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
        <div style={{ color: '#1B2B5B' }}>
          <strong>Regras:</strong> NF emitida apenas para proprietários · Valor = taxa de serviço (100% no 1º mês, 10% nos demais) ·
          Descrição: <em>"Prestação de serviços de administração e intermediação imobiliária"</em> · Município: Franca/SP (3516200)
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total de Notas', value: stats.totalNotes, fmt: (v: number) => v.toString() },
            { label: 'Total Aluguéis', value: stats.totalRentalValue, fmt },
            { label: 'Total Taxas (Receita)', value: stats.totalServiceFee, fmt },
          ].map(card => (
            <div
              key={card.label}
              className="bg-white rounded-xl p-5 shadow-sm"
              style={{ border: '1px solid #f0ede6' }}
            >
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: '#1B2B5B' }}>
                {card.fmt(card.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + ações */}
      <div className="bg-white rounded-xl shadow-sm p-5" style={{ border: '1px solid #f0ede6' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Mês</label>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none"
            >
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ano</label>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none"
            >
              {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none"
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={load}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Buscar
            </button>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
          style={{ backgroundColor: '#1B2B5B', color: '#fff' }}
        >
          <Plus className="w-4 h-4" />
          {generating ? 'Gerando...' : `Gerar NFS-e do mês ${MONTHS[month - 1]}/${year}`}
        </button>
      </div>

      {/* Mensagem */}
      {msg && (
        <div
          className="rounded-xl p-4 text-sm flex items-start gap-3"
          style={{
            backgroundColor: msg.type === 'success' ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
            color: msg.type === 'success' ? '#16a34a' : '#dc2626',
          }}
        >
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
          {msg.text}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #f0ede6' }}>
        {notes.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhuma nota fiscal encontrada. Selecione um período e clique em Buscar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#f8f6f1' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proprietário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Imóvel</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aluguel</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxa</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor NF</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {notes.map((note: any) => {
                  const st = STATUS_MAP[note.status] ?? STATUS_MAP.DRAFT
                  const StatusIcon = st.icon
                  return (
                    <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{note.landlordName}</p>
                        <p className="text-xs text-gray-400">{note.landlordCpf}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                        <p className="truncate text-xs">{note.propertyAddress ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {String(note.rentalMonth).padStart(2, '0')}/{note.rentalYear}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">{fmt(Number(note.rentalValue))}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: Number(note.serviceFeePercentage) === 100 ? 'rgba(201,168,76,0.15)' : 'rgba(27,43,91,0.08)',
                            color: Number(note.serviceFeePercentage) === 100 ? '#C9A84C' : '#1B2B5B',
                          }}
                        >
                          {Number(note.serviceFeePercentage).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: '#1B2B5B' }}>
                        {fmt(Number(note.serviceFeeValue))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <select
                            value={note.status}
                            onChange={e => handleStatusChange(note.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded-lg border focus:outline-none"
                            style={{ borderColor: st.color, color: st.color }}
                          >
                            {Object.entries(STATUS_MAP).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDownloadXml(note.id, note.landlordName)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors hover:opacity-80"
                          style={{ backgroundColor: 'rgba(27,43,91,0.08)', color: '#1B2B5B' }}
                          title="Baixar XML NFS-e"
                        >
                          <Download className="w-3.5 h-3.5" />
                          XML
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
