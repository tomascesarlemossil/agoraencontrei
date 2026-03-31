'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { FileText, Search, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { financeApi, type LegacyContract } from '@/lib/api'

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  ACTIVE:   { label: 'Ativo',     icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  FINISHED: { label: 'Encerrado', icon: XCircle,     color: 'text-gray-500 bg-gray-50'  },
  CANCELED: { label: 'Cancelado', icon: Clock,       color: 'text-red-600 bg-red-50'    },
}

const fmt = (v: number | null) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function ContratosPage() {
  const token = useAuthStore(s => s.accessToken)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [page, setPage]       = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState(searchParams.get('status') ?? 'ACTIVE')

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, status])

  // Sync status from URL param
  useEffect(() => {
    const s = searchParams.get('status')
    if (s) setStatus(s)
  }, [searchParams])

  const params: Record<string, string> = { page: String(page), limit: '20' }
  if (search) params.search = search
  if (status) params.status = status

  const { data, isLoading } = useQuery({
    queryKey: ['finance-contracts', page, search, status],
    queryFn: () => financeApi.contracts(token!, params),
    enabled: !!token,
  })

  const contracts = data?.data ?? []
  const meta      = data?.meta

  // Active vs inactive tab groups
  const TABS = [
    { id: 'ACTIVE',   label: 'Ativos',     active: true  },
    { id: 'FINISHED', label: 'Encerrados', active: false },
    { id: 'CANCELED', label: 'Cancelados', active: false },
  ]

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function clearSearch() {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const isInactive = status === 'FINISHED' || status === 'CANCELED'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-50">
          <FileText className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contratos de Locação</h1>
          <p className="text-sm text-gray-500">
            {isInactive ? 'Contratos inativos (encerrados e cancelados)' : 'Contratos ativos em vigor'}
          </p>
        </div>
        {meta && (
          <span className="ml-auto text-sm text-gray-400">{meta.total.toLocaleString('pt-BR')} contratos</span>
        )}
      </div>

      {/* Active / Inactive top tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setStatus('ACTIVE'); setPage(1) }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            status === 'ACTIVE'
              ? 'bg-green-600 text-white border-green-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => { setStatus('FINISHED'); setPage(1) }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            status === 'FINISHED'
              ? 'bg-gray-600 text-white border-gray-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Encerrados
        </button>
        <button
          onClick={() => { setStatus('CANCELED'); setPage(1) }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            status === 'CANCELED'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Cancelados
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por inquilino, proprietário, endereço ou código..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700">
          Buscar
        </button>
        {search && (
          <button type="button" onClick={clearSearch} className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 text-gray-600">
            Limpar
          </button>
        )}
      </form>

      {/* Status summary pill */}
      {search && (
        <p className="text-sm text-gray-500">
          Mostrando resultados para <strong>"{search}"</strong> em contratos{' '}
          <span className="font-medium">{STATUS_CONFIG[status]?.label ?? status}</span>
        </p>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum contrato encontrado</p>
          {search && (
            <button onClick={clearSearch} className="mt-3 text-sm text-purple-600 hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c: LegacyContract) => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.FINISHED
            const Icon = cfg.icon
            return (
              <div
                key={c.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push(`/dashboard/contratos/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                      {c.legacyId && (
                        <span className="text-xs text-gray-400 font-mono">#{c.legacyId}</span>
                      )}
                      {c.iptuCode && (
                        <span className="text-xs text-gray-400">IPTU: {c.iptuCode}</span>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs">Inquilino</span>
                        <p className="font-medium text-gray-800 truncate">
                          {c.tenant?.name ?? c.tenantName ?? '—'}
                        </p>
                        {c.tenant?.phone && <p className="text-xs text-gray-400">{c.tenant.phone}</p>}
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Proprietário</span>
                        <p className="font-medium text-gray-800 truncate">
                          {c.landlord?.name ?? c.landlordName ?? '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Endereço</span>
                        <p className="font-medium text-gray-700 truncate">{c.propertyAddress ?? '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-blue-600 group-hover:text-purple-600 transition-colors">{fmt(c.rentValue)}</p>
                    <p className="text-xs text-gray-400">por mês</p>
                    {c.startDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        Início: {new Date(c.startDate).toLocaleDateString('pt-BR')}
                      </p>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
          </p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 px-2">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
