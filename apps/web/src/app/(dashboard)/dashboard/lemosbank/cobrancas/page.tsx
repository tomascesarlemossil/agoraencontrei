'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ArrowLeft, Receipt, Search, CheckCircle, Clock, AlertCircle,
  DollarSign, ChevronRight, RefreshCw,
} from 'lucide-react'
import { financeApi } from '@/lib/api'

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  PAID:    { label: 'Pago',      icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50' },
  PENDING: { label: 'Pendente',  icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
  LATE:    { label: 'Atrasado',  icon: AlertCircle, color: 'text-red-600',    bg: 'bg-red-50' },
}

export default function CobrancasPage() {
  const token = useAuthStore(s => s.accessToken)
  const qc = useQueryClient()

  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('LATE')
  const [page, setPage]       = useState(1)
  const [paying, setPaying]   = useState<string | null>(null)
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])

  const params: Record<string, string> = { page: String(page), limit: '30' }
  if (status) params.status = status
  if (search) params.search = search

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['finance-rentals', page, status, search],
    queryFn:  () => financeApi.rentals(token!, params),
    enabled:  !!token,
  })

  const payMutation = useMutation({
    mutationFn: (rentalId: string) =>
      financeApi.pagarAluguel(token!, rentalId, { paymentDate: payDate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-rentals'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      setPaying(null)
    },
  })

  const rentals = data?.data ?? []
  const meta    = data?.meta

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/lemosbank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-yellow-50">
          <Receipt className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emissão de Cobranças</h1>
          <p className="text-sm text-gray-500">Aluguéis pendentes, atrasados e pagos</p>
        </div>
        {meta && (
          <span className="ml-auto text-sm text-gray-400">{meta.total} registros</span>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'LATE',    label: 'Em Atraso',  color: 'bg-red-600 text-white',    inactive: 'bg-red-50 text-red-700 hover:bg-red-100' },
          { id: 'PENDING', label: 'Pendentes',   color: 'bg-yellow-500 text-white', inactive: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
          { id: 'PAID',    label: 'Pagos',       color: 'bg-green-600 text-white',  inactive: 'bg-green-50 text-green-700 hover:bg-green-100' },
          { id: '',        label: 'Todos',       color: 'bg-gray-700 text-white',   inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setStatus(tab.id); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${status === tab.id ? tab.color : tab.inactive}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar inquilino, proprietário, endereço..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum aluguel encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rentals.map((r: any) => {
            const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDING
            const Icon = cfg.icon
            const isPayingThis = paying === r.id
            return (
              <div key={r.id} className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${r.status === 'LATE' ? 'border-red-100' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {r.contract?.legacyId && (
                        <span className="text-xs text-gray-400 font-mono">#{r.contract.legacyId}</span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 truncate">
                      {r.contract?.tenant?.name ?? r.contract?.tenantName ?? 'Inquilino'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{r.contract?.propertyAddress ?? '—'}</p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>Venc.: {r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt-BR') : '—'}</span>
                      {r.paymentDate && <span>Pago: {new Date(r.paymentDate).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${cfg.color}`}>{fmt(r.totalAmount ?? r.rentAmount)}</p>
                    {r.contract?.id && (
                      <Link href={`/dashboard/contratos/${r.contract.id}`} className="text-xs text-blue-500 hover:underline block mt-0.5">
                        Ver contrato
                      </Link>
                    )}
                    {(r.status === 'PENDING' || r.status === 'LATE') && (
                      isPayingThis ? (
                        <div className="mt-2 flex flex-col gap-1 items-end">
                          <input
                            type="date"
                            value={payDate}
                            onChange={e => setPayDate(e.target.value)}
                            className="text-xs border border-gray-200 rounded px-1 py-0.5 w-32"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => payMutation.mutate(r.id)}
                              disabled={payMutation.isPending}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {payMutation.isPending ? '...' : 'Confirmar'}
                            </button>
                            <button onClick={() => setPaying(null)} className="text-xs border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPaying(r.id)}
                          className="mt-1 text-xs bg-green-50 text-green-700 px-3 py-1 rounded-lg hover:bg-green-100 font-medium"
                        >
                          Registrar Pgto
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima</button>
          </div>
        </div>
      )}
    </div>
  )
}
