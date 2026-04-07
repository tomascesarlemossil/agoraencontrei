'use client'

import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, CheckCircle, Clock, Phone, Mail,
  ChevronRight, DollarSign, Download, RotateCcw, Filter,
  Calendar, Building2, User, TrendingUp,
} from 'lucide-react'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'
import { financeApi } from '@/lib/api'

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'

function exportToCSV(repasses: any[]) {
  const headers = ['Proprietário', 'Telefone', 'Inquilino', 'Endereço', 'Aluguel', 'Comissão %', 'Repasse', 'Dia Repasse', 'Status', 'Pago Em']
  const rows = repasses.map(r => [
    r.landlordName ?? '',
    r.landlord?.phone ?? '',
    r.tenantName ?? '',
    r.propertyAddress ?? '',
    Number(r.rentValue).toFixed(2),
    Number(r.commission).toFixed(2),
    Number(r.repasseValue).toFixed(2),
    r.landlordDueDay ?? '',
    r.repassePaid ? 'Pago' : 'Pendente',
    r.thisMonthRental?.repassePaidAt ? new Date(r.thisMonthRental.repassePaidAt).toLocaleDateString('pt-BR') : '',
  ])
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `repasses-${new Date().toISOString().slice(0, 7)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RepassesPage() {
  const token = useAuthStore(s => s.accessToken)
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [marcando, setMarcando] = useState<string | null>(null)
  const [estornando, setEstornando] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'pagos'>('todos')

  const params: Record<string, string> = {}
  if (search) params.search = search

  const { data, isLoading } = useQuery({
    queryKey: ['finance-repasses', search],
    queryFn:  () => financeApi.repasses(token!, params),
    enabled:  !!token,
    refetchInterval: 60_000,
  })

  const repasses    = data?.data ?? []
  const meta        = data?.meta
  const pendentes   = repasses.filter((r: any) => !r.repassePaid)
  const pagos       = repasses.filter((r: any) =>  r.repassePaid)

  const repassesFiltrados = filtroStatus === 'pendentes' ? pendentes
    : filtroStatus === 'pagos' ? pagos
    : repasses

  const handleMarcarPago = async (r: any) => {
    if (!token || !r.thisMonthRental?.id) {
      alert('Este contrato não possui aluguel registrado neste mês para marcar o repasse.')
      return
    }
    if (r.thisMonthRental.status !== 'PAID') {
      alert('O aluguel deste mês ainda não foi pago pelo inquilino. Registre o pagamento antes de marcar o repasse.')
      return
    }
    if (!confirm(`Confirmar repasse de ${fmt(r.repasseValue)} para ${r.landlordName}?`)) return
    setMarcando(r.id)
    try {
      await financeApi.marcarRepassePago(token, r.thisMonthRental.id)
      qc.invalidateQueries({ queryKey: ['finance-repasses'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
    } catch (e: any) {
      alert('Erro: ' + e.message)
    } finally {
      setMarcando(null)
    }
  }

  const handleEstornar = async (r: any) => {
    if (!token || !r.thisMonthRental?.id) return
    if (!confirm(`Estornar repasse de ${fmt(r.repasseValue)} para ${r.landlordName}?`)) return
    setEstornando(r.id)
    try {
      await financeApi.estornarRepasse(token, r.thisMonthRental.id)
      qc.invalidateQueries({ queryKey: ['finance-repasses'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
    } catch (e: any) {
      alert('Erro ao estornar: ' + e.message)
    } finally {
      setEstornando(null)
    }
  }

  const now = new Date()
  const mesAtual = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/lemosbank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-green-50">
          <RefreshCw className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Financeiro e Repasses</h1>
          <p className="text-sm text-gray-500 capitalize">{mesAtual} — Contratos com repasse ao proprietário</p>
        </div>
        <button
          onClick={() => exportToCSV(repassesFiltrados)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Summary cards */}
      {meta && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500 uppercase font-medium">Total de Contratos</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{repasses.length}</p>
            <p className="text-xs text-gray-400">com repasse ativo</p>
          </div>
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-400" />
              <p className="text-xs text-gray-500 uppercase font-medium">A Repassar</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">{fmt(meta.totalRepasseAReceber)}</p>
            <p className="text-xs text-gray-400">{pendentes.length} proprietário(s)</p>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-xs text-gray-500 uppercase font-medium">Repasse Pago</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{fmt(meta.totalRepassePago)}</p>
            <p className="text-xs text-gray-400">{pagos.length} proprietário(s)</p>
          </div>
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-gray-500 uppercase font-medium">Total Geral</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{fmt((meta.totalRepasseAReceber ?? 0) + (meta.totalRepassePago ?? 0))}</p>
            <p className="text-xs text-gray-400">mês de referência</p>
          </div>
        </div>
      )}

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInputWithVoice
          value={search}
          onChange={e => setSearch(e.target.value)}
          onVoiceResult={(t) => setSearch(t)}
          placeholder="Buscar proprietário, inquilino, endereço..."
          className="flex-1 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <div className="flex gap-2">
          {(['todos', 'pendentes', 'pagos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroStatus(f)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
                filtroStatus === f
                  ? f === 'pendentes' ? 'bg-orange-500 text-white border-orange-500'
                  : f === 'pagos' ? 'bg-green-600 text-white border-green-600'
                  : 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'todos' ? `Todos (${repasses.length})` : f === 'pendentes' ? `Pendentes (${pendentes.length})` : `Pagos (${pagos.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : repassesFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum repasse encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {repassesFiltrados.map((r: any) => (
            <div key={r.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md ${r.repassePaid ? 'border-green-100' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Status badge */}
                  <div className="flex items-center gap-2 mb-2">
                    {r.repassePaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3" /> Pago em {fmtDate(r.thisMonthRental?.repassePaidAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                        <Clock className="w-3 h-3" /> A Repassar — Dia {r.landlordDueDay}
                      </span>
                    )}
                    {r.legacyId && <span className="text-xs text-gray-400 font-mono">#{r.legacyId}</span>}
                    {r.thisMonthRental?.status === 'LATE' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        Aluguel em Atraso
                      </span>
                    )}
                  </div>

                  {/* Dados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> Proprietário</span>
                      <p className="font-semibold text-gray-900 truncate">{r.landlordName ?? '—'}</p>
                      {r.landlord?.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{r.landlord.phone}
                        </p>
                      )}
                      {r.landlord?.email && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{r.landlord.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" /> Inquilino</span>
                      <p className="font-medium text-gray-700 truncate">{r.tenantName ?? '—'}</p>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3 shrink-0" />{r.propertyAddress ?? ''}
                      </p>
                    </div>
                  </div>

                  {/* Status do aluguel do mês */}
                  {r.thisMonthRental && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                      <span>Vencimento: {fmtDate(r.thisMonthRental.dueDate)}</span>
                      {r.thisMonthRental.paymentDate && (
                        <span className="text-green-600">Pago em: {fmtDate(r.thisMonthRental.paymentDate)}</span>
                      )}
                      <span>Status aluguel: <strong>{r.thisMonthRental.status}</strong></span>
                    </div>
                  )}
                </div>

                {/* Valores e ações */}
                <div className="text-right shrink-0 space-y-1 min-w-[120px]">
                  <div>
                    <p className="text-xs text-gray-400">Aluguel</p>
                    <p className="text-sm font-semibold text-gray-700">{fmt(r.rentValue)}</p>
                  </div>
                  {r.commission > 0 && (
                    <div>
                      <p className="text-xs text-gray-400">Comissão ({r.commission}%)</p>
                      <p className="text-xs text-red-500">- {fmt(r.rentValue * r.commission / 100)}</p>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-1">
                    <p className="text-xs text-gray-400">Repasse</p>
                    <p className="text-lg font-bold text-green-700">{fmt(r.repasseValue)}</p>
                  </div>
                  <Link href={`/dashboard/contratos/${r.id}`} className="text-xs text-blue-500 hover:underline block">
                    Ver contrato <ChevronRight className="inline w-3 h-3" />
                  </Link>
                  {!r.repassePaid ? (
                    <button
                      onClick={() => handleMarcarPago(r)}
                      disabled={marcando === r.id}
                      className="flex items-center gap-1 mt-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 w-full justify-center"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      {marcando === r.id ? 'Processando...' : 'Marcar Pago'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEstornar(r)}
                      disabled={estornando === r.id}
                      className="flex items-center gap-1 mt-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 font-medium transition-colors disabled:opacity-50 w-full justify-center"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {estornando === r.id ? 'Estornando...' : 'Estornar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rodapé informativo */}
      {!isLoading && repassesFiltrados.length > 0 && (
        <p className="text-xs text-center text-gray-400">
          {repassesFiltrados.length} contrato(s) exibido(s) · Mês de referência: <span className="capitalize">{mesAtual}</span>
        </p>
      )}
    </div>
  )
}
