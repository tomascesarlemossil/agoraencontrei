'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ArrowLeft, Scissors, ChevronRight, AlertTriangle, Phone,
} from 'lucide-react'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'
import { financeApi } from '@/lib/api'

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))

export default function RescisoesPage() {
  const token = useAuthStore(s => s.accessToken)
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [status, setStatus] = useState('FINISHED')

  const params: Record<string, string> = { page: String(page), limit: '20', status }
  if (search) params.search = search

  const { data, isLoading } = useQuery({
    queryKey: ['rescisoes-contracts', page, status, search],
    queryFn:  () => financeApi.contracts(token!, params),
    enabled:  !!token,
  })

  const contracts = data?.data ?? []
  const meta      = data?.meta

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rescisões e Estornos</h1>
          <p className="text-sm text-gray-500">Contratos encerrados e cancelados</p>
        </div>
        {meta && <span className="ml-auto text-sm text-gray-400">{meta.total} contratos</span>}
      </div>

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
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Scissors className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhuma rescisão encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c: any) => (
            <Link
              key={c.id}
              href={`/dashboard/contratos/${c.id}`}
              className="block bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {status === 'CANCELED' ? 'Cancelado' : 'Encerrado'}
                    </span>
                    {c.legacyId && <span className="text-xs text-gray-400 font-mono">#{c.legacyId}</span>}
                  </div>
                  <p className="font-medium text-gray-800 truncate">{c.propertyAddress ?? '—'}</p>
                  <div className="grid grid-cols-2 gap-x-4 mt-1 text-xs text-gray-500">
                    <span>Inquilino: {c.tenant?.name ?? c.tenantName ?? '—'}</span>
                    <span>Proprietário: {c.landlord?.name ?? c.landlordName ?? '—'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                    {c.startDate && (
                      <span>Início: {new Date(c.startDate).toLocaleDateString('pt-BR')}</span>
                    )}
                    {c.rescissionDate && (
                      <span className="text-red-500 font-medium">
                        Rescisão: {new Date(c.rescissionDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {c.duration && <span>Duração: {c.duration} meses</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-gray-500">{fmt(c.rentValue)}</p>
                  <p className="text-xs text-gray-400">/ mês</p>
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-1 ml-auto" />
                </div>
              </div>
            </Link>
          ))}
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

      {/* Info box */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-orange-800">Registrar Rescisão</p>
          <p className="text-orange-700 mt-0.5">Para registrar uma rescisão, abra o contrato e clique em "Registrar Rescisão" no topo da página.</p>
        </div>
      </div>
    </div>
  )
}
