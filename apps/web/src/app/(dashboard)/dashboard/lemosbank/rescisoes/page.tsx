'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ArrowLeft, Scissors, ChevronRight, AlertTriangle, Phone,
  Download, Calendar, User, Building2, DollarSign, FileText,
  Clock, CheckCircle,
} from 'lucide-react'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'
import { financeApi } from '@/lib/api'

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'

function exportToCSV(contracts: any[]) {
  const headers = ['Legado', 'Endereço', 'Inquilino', 'Proprietário', 'Valor Aluguel', 'Início', 'Rescisão', 'Duração (meses)', 'Motivo', 'Multa', 'Status']
  const rows = contracts.map(c => [
    c.legacyId ?? '',
    c.propertyAddress ?? '',
    c.tenant?.name ?? c.tenantName ?? '',
    c.landlord?.name ?? c.landlordName ?? '',
    Number(c.rentValue ?? 0).toFixed(2),
    c.startDate ? new Date(c.startDate).toLocaleDateString('pt-BR') : '',
    c.rescissionDate ? new Date(c.rescissionDate).toLocaleDateString('pt-BR') : '',
    c.duration ?? '',
    c.rescissionReason ?? '',
    Number(c.rescissionFine ?? c.multaRescisao ?? 0).toFixed(2),
    c.status === 'CANCELED' ? 'Cancelado' : 'Encerrado',
  ])
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rescisoes-${new Date().toISOString().slice(0, 7)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RescisoesPage() {
  const token = useAuthStore(s => s.accessToken)
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [status, setStatus] = useState('FINISHED')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const params: Record<string, string> = { page: String(page), limit: '20', status }
  if (search) params.search = search

  const { data, isLoading } = useQuery({
    queryKey: ['rescisoes-contracts', page, status, search],
    queryFn:  () => financeApi.contracts(token!, params),
    enabled:  !!token,
  })

  const contracts = data?.data ?? []
  const meta      = data?.meta

  const totalMultas = contracts.reduce((s: number, c: any) => s + Number(c.multaRescisao ?? 0), 0)
  const totalAluguel = contracts.reduce((s: number, c: any) => s + Number(c.rentValue ?? 0), 0)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/lemosbank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-red-50">
          <Scissors className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Rescisões e Estornos</h1>
          <p className="text-sm text-gray-500">Contratos encerrados e cancelados</p>
        </div>
        <button
          onClick={() => exportToCSV(contracts)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Resumo */}
      {meta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500 uppercase font-medium">Total de Rescisões</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{meta.total}</p>
            <p className="text-xs text-gray-400">contratos {status === 'CANCELED' ? 'cancelados' : 'encerrados'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-red-400" />
              <p className="text-xs text-gray-500 uppercase font-medium">Total Multas</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{fmt(totalMultas)}</p>
            <p className="text-xs text-gray-400">nesta página</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500 uppercase font-medium">Valor Total Aluguéis</p>
            </div>
            <p className="text-2xl font-bold text-gray-700">{fmt(totalAluguel)}</p>
            <p className="text-xs text-gray-400">soma dos contratos</p>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2">
        <button onClick={() => { setStatus('FINISHED'); setPage(1) }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${status === 'FINISHED' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
          Encerrados
        </button>
        <button onClick={() => { setStatus('CANCELED'); setPage(1) }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${status === 'CANCELED' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
          Cancelados
        </button>
      </div>

      {/* Search */}
      <SearchInputWithVoice
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1) }}
        onVoiceResult={(t) => { setSearch(t); setPage(1) }}
        placeholder="Buscar por inquilino, proprietário, endereço..."
        className="w-full py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      />

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Scissors className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhuma rescisão encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c: any) => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Linha principal */}
              <button
                className="w-full text-left p-4"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {status === 'CANCELED' ? 'Cancelado' : 'Encerrado'}
                      </span>
                      {c.legacyId && <span className="text-xs text-gray-400 font-mono">#{c.legacyId}</span>}
                      {(c.rescissionFine ?? c.multaRescisao) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                          Multa: {fmt(c.rescissionFine ?? c.multaRescisao)}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 truncate flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {c.propertyAddress ?? '—'}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {c.tenant?.name ?? c.tenantName ?? '—'}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {c.landlord?.name ?? c.landlordName ?? '—'}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400 mt-1">
                      {c.startDate && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Início: {fmtDate(c.startDate)}</span>
                      )}
                      {c.rescissionDate && (
                        <span className="flex items-center gap-1 text-red-500 font-medium">
                          <Scissors className="w-3 h-3" /> Rescisão: {fmtDate(c.rescissionDate)}
                        </span>
                      )}
                      {c.duration && <span>Duração: {c.duration} meses</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-gray-500">{fmt(c.rentValue)}</p>
                    <p className="text-xs text-gray-400">/ mês</p>
                    <ChevronRight className={`w-4 h-4 text-gray-300 mt-1 ml-auto transition-transform ${expandedId === c.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </button>

              {/* Detalhes expandidos */}
              {expandedId === c.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Índice de Reajuste</p>
                      <p className="font-medium text-gray-700">{c.adjustmentIndex ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Valor Aluguel</p>
                      <p className="font-medium text-gray-700">{fmt(c.rentValue)}</p>
                    </div>
                    {(c.rescissionFine ?? c.multaRescisao) > 0 && (
                      <div>
                        <p className="text-xs text-gray-400">Multa Rescisória</p>
                        <p className="font-medium text-red-600">{fmt(c.rescissionFine ?? c.multaRescisao)}</p>
                      </div>
                    )}
                    {c.rescissionReason && (
                      <div className="col-span-2 sm:col-span-3">
                        <p className="text-xs text-gray-400">Motivo da Rescisão</p>
                        <p className="font-medium text-gray-700">{c.rescissionReason}</p>
                      </div>
                    )}
                    {c.tenant?.phone && (
                      <div>
                        <p className="text-xs text-gray-400">Telefone Inquilino</p>
                        <p className="font-medium text-gray-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{c.tenant.phone}
                        </p>
                      </div>
                    )}
                    {c.landlord?.phone && (
                      <div>
                        <p className="text-xs text-gray-400">Telefone Proprietário</p>
                        <p className="font-medium text-gray-700 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{c.landlord.phone}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={`/dashboard/contratos/${c.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white text-sm rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Contrato Completo
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Página {meta.page} de {meta.totalPages} · {meta.total} registros</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima</button>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-orange-800">Como Registrar uma Rescisão</p>
          <p className="text-orange-700 mt-0.5">Abra o contrato desejado, clique em <strong>"Registrar Rescisão"</strong> no topo da página e preencha a data, tipo e motivo. A multa rescisória é opcional.</p>
        </div>
      </div>
    </div>
  )
}
