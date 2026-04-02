'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { FileText, Search, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { financeApi, type LegacyContract } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Edit Contract Modal ───────────────────────────────────────────────────────
function EditContratoModal({ contract, token, onClose }: { contract: LegacyContract; token: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    rentValue:      String(contract.rentValue ?? ''),
    dueDay:         String((contract as any).dueDay ?? ''),
    landlordDueDay: String((contract as any).landlordDueDay ?? ''),
    observations:   String((contract as any).observations ?? ''),
  })
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/finance/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...(form.rentValue      && { rentValue:      Number(form.rentValue) }),
          ...(form.dueDay         && { dueDay:         Number(form.dueDay) }),
          ...(form.landlordDueDay && { landlordDueDay: Number(form.landlordDueDay) }),
          observations: form.observations,
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro ao salvar') }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-contracts'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      setMsg({ type: 'success', text: 'Contrato atualizado com sucesso!' })
      setTimeout(onClose, 1200)
    },
    onError: (e: any) => setMsg({ type: 'error', text: e.message }),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Editar Contrato</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              #{(contract as any).legacyId} — {(contract as any).tenant?.name ?? (contract as any).tenantName ?? '—'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); mutation.mutate() }}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Valor do Aluguel (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rentValue}
                onChange={e => setForm(f => ({ ...f, rentValue: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Dia de Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.dueDay}
                onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
                placeholder="Ex: 5"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Dia de Repasse ao Proprietário</label>
            <input
              type="number"
              min="1"
              max="31"
              value={form.landlordDueDay}
              onChange={e => setForm(f => ({ ...f, landlordDueDay: e.target.value }))}
              placeholder="Ex: 15"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Observações</label>
            <textarea
              rows={3}
              value={form.observations}
              onChange={e => setForm(f => ({ ...f, observations: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>

          {msg && (
            <div className={`text-sm p-3 rounded-lg ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {msg.text}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
  const [editContract, setEditContract] = useState<LegacyContract | null>(null)

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
                    <button
                      onClick={e => { e.stopPropagation(); setEditContract(c) }}
                      className="mt-2 flex items-center gap-1 text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors ml-auto"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
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

      {/* Edit Modal */}
      {editContract && token && (
        <EditContratoModal
          contract={editContract}
          token={token}
          onClose={() => setEditContract(null)}
        />
      )}
    </div>
  )
}
