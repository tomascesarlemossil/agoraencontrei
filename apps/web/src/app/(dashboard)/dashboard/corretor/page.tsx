'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  UserCheck, TrendingUp, Calendar, Star,
  Phone, Mail, Building2, Clock,
  CheckCircle, XCircle, AlertCircle, Loader2,
  Trophy, Target, BarChart3, ChevronRight,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const LEAD_STATUS_LABEL: Record<string, string> = {
  NEW: 'Novo', CONTACTED: 'Contatado', QUALIFIED: 'Qualificado',
  VISITING: 'Visita', PROPOSAL: 'Proposta', NEGOTIATING: 'Negociando',
  WON: 'Fechado', LOST: 'Perdido', ARCHIVED: 'Arquivado',
}
const LEAD_STATUS_COLOR: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700', CONTACTED: 'bg-indigo-50 text-indigo-700',
  QUALIFIED: 'bg-purple-50 text-purple-700', VISITING: 'bg-yellow-50 text-yellow-700',
  PROPOSAL: 'bg-orange-50 text-orange-700', NEGOTIATING: 'bg-amber-50 text-amber-700',
  WON: 'bg-green-50 text-green-700', LOST: 'bg-red-50 text-red-700',
  ARCHIVED: 'bg-gray-50 text-gray-600',
}
const DEAL_STATUS_LABEL: Record<string, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em andamento', PROPOSAL: 'Proposta',
  NEGOTIATION: 'Negociação', WON: 'Fechado', LOST: 'Perdido',
}

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export default function CorretorPage() {
  const { user, accessToken: token } = useAuthStore()
  const [tab, setTab] = useState<'leads' | 'deals' | 'tasks'>('leads')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['corretor-stats'],
    queryFn: () => apiFetch('/api/v1/corretor/stats', token!),
    enabled: !!token,
    refetchInterval: 30_000,
  })

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['corretor-leads'],
    queryFn: () => apiFetch('/api/v1/corretor/leads?limit=20', token!),
    enabled: !!token && tab === 'leads',
    refetchInterval: 30_000,
  })

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['corretor-deals'],
    queryFn: () => apiFetch('/api/v1/corretor/deals?limit=20', token!),
    enabled: !!token && tab === 'deals',
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['corretor-tasks'],
    queryFn: () => apiFetch('/api/v1/corretor/activities?pending=true&limit=20', token!),
    enabled: !!token && tab === 'tasks',
  })

  const { data: ranking } = useQuery({
    queryKey: ['corretor-ranking'],
    queryFn: () => apiFetch('/api/v1/corretor/ranking', token!),
    enabled: !!token,
  })

  const leads = leadsData?.data ?? []
  const deals = dealsData?.data ?? []
  const tasks = tasksData?.data ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Meu Painel
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bem-vindo, {user?.name?.split(' ')[0] ?? 'Corretor'} · Seus resultados e tarefas
        </p>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={UserCheck}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            label="Meus Leads"
            value={stats.leads.total}
            sub={`${stats.leads.new} novos · ${stats.leads.active} ativos`}
          />
          <KpiCard
            icon={TrendingUp}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            label="Negócios"
            value={stats.deals.total}
            sub={`${stats.deals.active} em andamento`}
          />
          <KpiCard
            icon={Target}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            label="Conversão"
            value={`${stats.conversionRate}%`}
            sub={`${stats.leads.won} leads fechados`}
          />
          <KpiCard
            icon={Calendar}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
            label="Tarefas Pendentes"
            value={stats.activities.pending}
            sub={`${stats.activities.thisMonth} esse mês`}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {(['leads', 'deals', 'tasks'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'leads' ? 'Leads' : t === 'deals' ? 'Negócios' : 'Tarefas'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'leads' && (
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {leadsLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
              ) : leads.length === 0 ? (
                <EmptyState icon={UserCheck} message="Nenhum lead atribuído a você ainda" />
              ) : leads.map((lead: any) => (
                <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{lead.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${LEAD_STATUS_COLOR[lead.status] ?? 'bg-gray-50 text-gray-600'}`}>
                        {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {lead.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                      {lead.property && <span className="text-xs text-gray-400 flex items-center gap-1"><Building2 className="w-3 h-3" />{lead.property.title}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-2" />
                </Link>
              ))}
            </div>
          )}

          {tab === 'deals' && (
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {dealsLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
              ) : deals.length === 0 ? (
                <EmptyState icon={TrendingUp} message="Nenhum negócio em andamento" />
              ) : deals.map((deal: any) => (
                <Link key={deal.id} href={`/dashboard/deals/${deal.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{deal.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 flex-shrink-0">
                        {DEAL_STATUS_LABEL[deal.status] ?? deal.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {deal.lead && <span className="text-xs text-gray-400">{deal.lead.name}</span>}
                      {deal.value && <span className="text-xs text-gray-500 font-medium">R$ {Number(deal.value).toLocaleString('pt-BR')}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}

          {tab === 'tasks' && (
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {tasksLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
              ) : tasks.length === 0 ? (
                <EmptyState icon={Calendar} message="Nenhuma tarefa pendente" />
              ) : tasks.map((task: any) => (
                <div key={task.id} className="flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                    {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>}
                    {task.scheduledAt && (
                      <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.scheduledAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ranking Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Ranking do Mês</h3>
            </div>
            {!ranking ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : (ranking as any[]).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sem corretores cadastrados</p>
            ) : (
              <div className="space-y-2">
                {(ranking as any[]).slice(0, 5).map((b, idx) => {
                  const isMe = b.id === user?.id
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div
                      key={b.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg ${isMe ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}
                    >
                      <span className="text-base w-6 text-center">{medals[idx] ?? `#${idx + 1}`}</span>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isMe ? 'text-blue-700' : 'text-gray-800'}`}>
                          {b.name.split(' ')[0]}{isMe ? ' (você)' : ''}
                        </p>
                        <p className="text-xs text-gray-400">{b.wonDeals} fechados · {b.monthLeads} leads</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Performance Summary */}
          {stats && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Resumo</h3>
              </div>
              <div className="space-y-3">
                <ProgressRow label="Leads ganhos" value={stats.leads.won} total={stats.leads.total} color="bg-green-400" />
                <ProgressRow label="Leads perdidos" value={stats.leads.lost} total={stats.leads.total} color="bg-red-400" />
                <ProgressRow label="Negócios ganhos" value={stats.deals.won} total={stats.deals.total} color="bg-purple-400" />
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Ações Rápidas</h3>
            <div className="space-y-1">
              {[
                { href: '/dashboard/leads', label: 'Ver todos os leads', icon: UserCheck },
                { href: '/dashboard/deals', label: 'Pipeline de negócios', icon: TrendingUp },
                { href: '/dashboard/inbox', label: 'Lemos.chat', icon: Mail },
                { href: '/dashboard/properties', label: 'Imóveis', icon: Building2 },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  {label}
                  <ChevronRight className="w-3 h-3 text-gray-300 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon, iconBg, iconColor, label, value, sub,
}: {
  icon: any; iconBg: string; iconColor: string; label: string; value: string | number; sub: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-700">{value} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="py-12 text-center">
      <Icon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}
