'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'next/navigation'
import { Users, Phone, Mail, MapPin, BadgeCheck } from 'lucide-react'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'
import { financeApi, type LegacyClient } from '@/lib/api'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  TENANT:      { label: 'Inquilino',   color: 'bg-blue-100 text-blue-700' },
  LANDLORD:    { label: 'Proprietário', color: 'bg-green-100 text-green-700' },
  GUARANTOR:   { label: 'Fiador',      color: 'bg-purple-100 text-purple-700' },
  BENEFICIARY: { label: 'Favorecido',  color: 'bg-yellow-100 text-yellow-700' },
  SECONDARY:   { label: 'Secundário',  color: 'bg-gray-100 text-gray-600' },
}

const ROLE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'TENANT',      label: 'Inquilinos' },
  { value: 'LANDLORD',    label: 'Proprietários' },
  { value: 'GUARANTOR',   label: 'Fiadores' },
  { value: 'BENEFICIARY', label: 'Favorecidos' },
]

export default function ClientesPage() {
  const token = useAuthStore(s => s.accessToken)
  const router = useRouter()

  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [role, setRole]           = useState('')

  const params: Record<string, string> = { page: String(page), limit: '20' }
  if (search) params.search = search
  if (role)   params.role   = role

  const { data, isLoading } = useQuery({
    queryKey: ['finance-clients', page, search, role],
    queryFn: () => financeApi.clients(token!, params),
    enabled: !!token,
  })

  const clients  = data?.data ?? []
  const meta     = data?.meta

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-indigo-50">
          <Users className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes Legados</h1>
          <p className="text-sm text-gray-500">Inquilinos, proprietários e fiadores do sistema anterior</p>
        </div>
        {meta && (
          <span className="ml-auto text-sm text-gray-400">{meta.total.toLocaleString('pt-BR')} registros</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-60">
          <SearchInputWithVoice
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onVoiceResult={(t) => { setSearchInput(t); setSearch(t); setPage(1) }}
            placeholder="Buscar por nome, CPF, e-mail..."
            containerClassName="flex-1"
            className="w-full py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            Buscar
          </button>
        </form>
        <select
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">CPF/CNPJ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Contato</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Cidade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Papel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((c: LegacyClient) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/clientes/${c.id}`)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 truncate max-w-48">{c.name}</div>
                    {c.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <Mail className="w-3 h-3" />{c.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {c.document ? (
                      <div className="flex items-center gap-1 text-gray-600">
                        <BadgeCheck className="w-3.5 h-3.5 text-gray-400" />
                        {c.document.length === 11
                          ? c.document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                          : c.document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {(c.phone || c.phoneMobile) && (
                      <div className="flex items-center gap-1 text-gray-600 text-xs">
                        <Phone className="w-3 h-3" />
                        {c.phoneMobile ?? c.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {c.city && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin className="w-3 h-3" />
                        {c.city}{c.state ? `/${c.state}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.roles.map((r: string) => {
                        const cfg = ROLE_LABELS[r] ?? { label: r, color: 'bg-gray-100 text-gray-600' }
                        return (
                          <span key={r} className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {meta.page} de {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
