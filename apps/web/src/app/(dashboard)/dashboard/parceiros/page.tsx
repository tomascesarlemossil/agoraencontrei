'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { Crown, Star, Zap, Users, TrendingUp, CheckCircle, Clock, XCircle, ExternalLink, Mail, Phone, Calendar, Award } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const PLAN_CONFIG = {
  START: {
    label: 'Start',
    color: '#6B7280',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    icon: Zap,
    price: 'Gratuito',
  },
  PRIME: {
    label: 'Prime',
    color: '#C9A84C',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    icon: Star,
    price: 'R$ 197/mês',
  },
  VIP: {
    label: 'VIP',
    color: '#1B2B5B',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    icon: Crown,
    price: 'R$ 497/mês',
  },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendente', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  APPROVED: { label: 'Aprovado', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  REJECTED: { label: 'Rejeitado', color: 'text-red-600 bg-red-50', icon: XCircle },
}

interface SpecialistStats {
  total: number
  byPlan: { START: number; PRIME: number; VIP: number }
  byStatus: { PENDING: number; APPROVED: number; REJECTED: number }
  recentLeads: number
  conversionRate: number
}

interface Specialist {
  id: string
  name: string
  email: string
  phone?: string
  category: string
  plan: 'START' | 'PRIME' | 'VIP'
  planStatus?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  city: string
  createdAt: string
  planActivatedAt?: string
  planExpiresAt?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  ARQUITETO: 'Arquiteto(a)',
  ENGENHEIRO: 'Engenheiro(a)',
  CORRETOR: 'Corretor(a)',
  AVALIADOR: 'Avaliador(a)',
  DESIGNER_INTERIORES: 'Designer de Interiores',
  FOTOGRAFO: 'Fotógrafo(a)',
  VIDEOMAKER: 'Videomaker',
  ADVOGADO_IMOBILIARIO: 'Advogado(a) Imobiliário',
  DESPACHANTE: 'Despachante',
  OUTRO: 'Outro',
}

export default function ParceirosPage() {
  const { accessToken } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'all' | 'START' | 'PRIME' | 'VIP'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED'>('all')

  const { data: specialists, isLoading } = useQuery<Specialist[]>({
    queryKey: ['specialists-admin'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/specialists?limit=200`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Erro ao carregar especialistas')
      const json = await res.json()
      return json.data ?? json ?? []
    },
    enabled: !!accessToken,
    staleTime: 60_000,
  })

  const list = specialists ?? []

  // Calcular estatísticas
  const stats: SpecialistStats = {
    total: list.length,
    byPlan: {
      START: list.filter(s => s.plan === 'START').length,
      PRIME: list.filter(s => s.plan === 'PRIME').length,
      VIP: list.filter(s => s.plan === 'VIP').length,
    },
    byStatus: {
      PENDING: list.filter(s => s.status === 'PENDING').length,
      APPROVED: list.filter(s => s.status === 'APPROVED').length,
      REJECTED: list.filter(s => s.status === 'REJECTED').length,
    },
    recentLeads: list.filter(s => {
      const d = new Date(s.createdAt)
      const now = new Date()
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      return diff <= 30
    }).length,
    conversionRate: list.length > 0
      ? Math.round(((list.filter(s => s.plan !== 'START').length) / list.length) * 100)
      : 0,
  }

  // MRR estimado
  const mrr = (stats.byPlan.PRIME * 197) + (stats.byPlan.VIP * 497)

  // Filtrar lista
  const filtered = list.filter(s => {
    if (activeTab !== 'all' && s.plan !== activeTab) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    return true
  })

  const handleApprove = async (id: string) => {
    await fetch(`${API_URL}/api/v1/specialists/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1B2B5B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando parceiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Parceiros</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie especialistas e planos Start / Prime / VIP</p>
        </div>
        <Link
          href="/seja-parceiro"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: '#1B2B5B' }}
        >
          <ExternalLink className="w-4 h-4" />
          Ver landing page
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.recentLeads} nos últimos 30 dias</p>
        </div>

        {/* MRR */}
        <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">MRR</span>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {mrr.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">Receita mensal recorrente</p>
        </div>

        {/* Pendentes */}
        <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Pendentes</span>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{stats.byStatus.PENDING}</p>
          <p className="text-xs text-gray-400 mt-1">Aguardando aprovação</p>
        </div>

        {/* Conversão */}
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Conversão</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">{stats.conversionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Start → Prime/VIP</p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['START', 'PRIME', 'VIP'] as const).map(plan => {
          const cfg = PLAN_CONFIG[plan]
          const Icon = cfg.icon
          const count = stats.byPlan[plan]
          const revenue = plan === 'PRIME' ? count * 197 : plan === 'VIP' ? count * 497 : 0
          return (
            <button
              key={plan}
              onClick={() => setActiveTab(activeTab === plan ? 'all' : plan)}
              className={`text-left rounded-xl border-2 p-5 transition-all ${cfg.bg} ${activeTab === plan ? cfg.border + ' shadow-md' : 'border-transparent hover:' + cfg.border}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  <span className="font-bold text-gray-900">Plano {cfg.label}</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.badge}`}>{cfg.price}</span>
              </div>
              <p className="text-4xl font-bold mb-1" style={{ color: cfg.color }}>{count}</p>
              <p className="text-sm text-gray-500">parceiros ativos</p>
              {revenue > 0 && (
                <p className="text-sm font-semibold text-green-600 mt-2">
                  {revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}/mês
                </p>
              )}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(['all', 'START', 'PRIME', 'VIP'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-[#1B2B5B] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'all' ? 'Todos' : `Plano ${PLAN_CONFIG[tab].label}`}
              <span className="ml-1.5 text-xs opacity-70">
                {tab === 'all' ? stats.total : stats.byPlan[tab]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {(['all', 'PENDING', 'APPROVED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Todos status' : s === 'PENDING' ? 'Pendentes' : 'Aprovados'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum parceiro encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Ajuste os filtros ou aguarde novos cadastros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Parceiro</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Plano</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cadastro</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => {
                  const planCfg = PLAN_CONFIG[s.plan]
                  const statusCfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING
                  const StatusIcon = statusCfg.icon
                  const PlanIcon = planCfg.icon
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{s.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Mail className="w-3 h-3" />{s.email}
                            </span>
                            {s.phone && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Phone className="w-3 h-3" />{s.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {CATEGORY_LABELS[s.category] ?? s.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${planCfg.badge}`}>
                          <PlanIcon className="w-3 h-3" />
                          {planCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {s.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(s.id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                            >
                              Aprovar
                            </button>
                          )}
                          <Link
                            href={`/especialistas/${s.id}`}
                            target="_blank"
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver perfil
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2d4a8a] rounded-xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="font-bold text-lg">Quer mais parceiros Prime/VIP?</p>
          <p className="text-white/70 text-sm mt-1">Compartilhe a landing page e aumente o MRR</p>
        </div>
        <Link
          href="/seja-parceiro"
          target="_blank"
          className="px-5 py-2.5 rounded-xl font-bold text-sm"
          style={{ background: '#C9A84C', color: '#1B2B5B' }}
        >
          Ver landing page →
        </Link>
      </div>
    </div>
  )
}
