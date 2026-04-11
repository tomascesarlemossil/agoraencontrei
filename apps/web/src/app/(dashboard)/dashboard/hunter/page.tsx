'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { hunterApi } from '@/lib/api'
import {
  Crosshair, Search, CheckCircle2, Clock, XCircle, Phone,
  Mail, MapPin, Home, DollarSign, Filter, RefreshCw,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Crosshair }> = {
  active:    { label: 'Ativo',      color: 'bg-orange-100 text-orange-700', icon: Crosshair },
  contacted: { label: 'Contactado', color: 'bg-blue-100 text-blue-700',     icon: Phone },
  fulfilled: { label: 'Atendido',   color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
  expired:   { label: 'Expirado',   color: 'bg-gray-100 text-gray-500',     icon: XCircle },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(v: number | undefined) {
  if (!v) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function HunterPage() {
  const token = useAuthStore(s => s.accessToken)
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: statsData } = useQuery({
    queryKey: ['hunter-stats'],
    queryFn: () => hunterApi.stats(token!),
    enabled: !!token,
  })

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['hunter-leads', statusFilter],
    queryFn: () => hunterApi.list(token!, { status: statusFilter !== 'all' ? statusFilter : undefined }),
    enabled: !!token,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      hunterApi.update(token!, id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hunter-leads'] })
      queryClient.invalidateQueries({ queryKey: ['hunter-stats'] })
    },
  })

  const stats = statsData
  const leads = leadsData?.data ?? []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crosshair className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 shrink-0" />
            Hunter Mode
          </h1>
          <p className="text-sm text-gray-500 truncate">Leads com busca sem resultado — prioridade m&aacute;xima</p>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['hunter-leads'] })
            queryClient.invalidateQueries({ queryKey: ['hunter-stats'] })
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Total', value: stats?.total ?? 0, icon: Search, color: 'text-gray-600' },
          { label: 'Ativos', value: stats?.active ?? 0, icon: Crosshair, color: 'text-orange-600' },
          { label: 'Atendidos', value: stats?.fulfilled ?? 0, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Contactados', value: stats?.contacted ?? 0, icon: Phone, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 text-gray-400 shrink-0" />
        {['all', 'active', 'contacted', 'fulfilled', 'expired'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              statusFilter === s
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'Todos' : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Leads List — Cards (mobile-first) */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-orange-600 border-t-transparent rounded-full" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Crosshair className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum lead Hunter encontrado</p>
          <p className="text-sm text-gray-400">Tom&aacute;s detectar&aacute; buscas sem resultado automaticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead: any) => {
            const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.active
            const Icon = cfg.icon
            const filters = lead.filters || {}
            const isExpanded = expandedId === lead.id

            return (
              <div
                key={lead.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Card Header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                  className="w-full p-3 sm:p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(lead.createdAt)}</span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">
                        {lead.name || lead.phone || lead.email || 'Lead an\u00f4nimo'}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {filters.city && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" /> {filters.city}
                            {filters.neighborhood && ` - ${filters.neighborhood}`}
                          </span>
                        )}
                        {filters.type && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Home className="h-3 w-3" /> {filters.type}
                          </span>
                        )}
                        {(filters.priceMin || filters.priceMax) && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(filters.priceMin)} — {formatCurrency(filters.priceMax)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-3 sm:p-4 space-y-3 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" /> {lead.phone}
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" /> {lead.email}
                        </div>
                      )}
                      {filters.bedrooms && (
                        <div className="text-gray-600">Quartos: {filters.bedrooms}+</div>
                      )}
                      {filters.intent && (
                        <div className="text-gray-600">Inten\u00e7\u00e3o: {filters.intent}</div>
                      )}
                      <div className="text-gray-400 text-xs">Fonte: {lead.source}</div>
                      <div className="text-gray-400 text-xs">Prioridade: {lead.priority}</div>
                    </div>
                    {lead.notes && (
                      <p className="text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-100">{lead.notes}</p>
                    )}
                    {/* Actions */}
                    {lead.status === 'active' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: lead.id, status: 'contacted' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Phone className="h-3 w-3" /> Marcar Contactado
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: lead.id, status: 'fulfilled' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Marcar Atendido
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: lead.id, status: 'expired' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <XCircle className="h-3 w-3" /> Expirar
                        </button>
                      </div>
                    )}
                    {lead.status === 'contacted' && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: lead.id, status: 'fulfilled' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Marcar Atendido
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
