'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { saasFinanceApi } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Brain, TrendingUp, DollarSign, Users, Zap, Target,
  ArrowUpRight, Building2, Crown, RefreshCw,
} from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function formatCurrency(v: number) {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatCurrencyFull(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function MasterPage() {
  const token = useAuthStore(s => s.accessToken)

  const { data: intel, isLoading, refetch } = useQuery({
    queryKey: ['master-intelligence'],
    queryFn: () => saasFinanceApi.intelligence(token!),
    enabled: !!token,
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Carregando intelig\u00eancia...</p>
        </div>
      </div>
    )
  }

  const revenue = intel?.revenue
  const tenants = intel?.tenants
  const affiliates = intel?.affiliates
  const transactions = intel?.transactions

  // Chart data: tenants by plan
  const planChartData = (tenants?.byPlan || []).map((p: any) => ({
    name: p.plan || 'Sem plano',
    clientes: p.count,
    receita: p.revenue,
  }))

  // Chart data: transactions by type
  const txChartData = (transactions?.byType || []).map((t: any, i: number) => ({
    name: t.type === 'subscription' ? 'Assinatura' :
          t.type === 'module' ? 'M\u00f3dulo' :
          t.type === 'service' ? 'Servi\u00e7o' :
          t.type === 'commission' ? 'Comiss\u00e3o' : t.type,
    value: t.total,
    count: t.count,
  }))

  // Tenant status chart
  const statusChartData = Object.entries(tenants?.byStatus || {}).map(([k, v]) => ({
    name: k === 'ACTIVE' ? 'Ativo' : k === 'TRIAL' ? 'Trial' :
          k === 'PAST_DUE' ? 'Inadimplente' : k === 'SUSPENDED' ? 'Suspenso' : k,
    value: v as number,
  }))

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0" />
            Master Intelligence
          </h1>
          <p className="text-sm text-gray-500 truncate">Vis\u00e3o consolidada — receita, tenants, afiliados, forecast</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: 'MRR', value: revenue?.mrr ?? 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'ARR', value: revenue?.arr ?? 0, icon: ArrowUpRight, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Receita M\u00eas', value: revenue?.month ?? 0, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Hoje', value: revenue?.today ?? 0, icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Forecast', value: revenue?.forecast ?? 0, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'M\u00e9dia/dia', value: revenue?.dailyAvg ?? 0, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-gray-200 p-3 ${s.bg}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] sm:text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-sm sm:text-lg font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Tenants + Affiliates Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-gray-500">Tenants Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{tenants?.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-xs text-gray-500">Tenants Ativos</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{tenants?.active ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-gray-500">Afiliados Ativos</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">{affiliates?.active ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-4 w-4 text-orange-600" />
            <span className="text-xs text-gray-500">Comiss\u00f5es M\u00eas</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-orange-600">{formatCurrencyFull(affiliates?.monthCommissions ?? 0)}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Plan */}
        {planChartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Receita por Plano</h3>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'receita' ? formatCurrencyFull(value) : value,
                      name === 'receita' ? 'Receita' : 'Clientes',
                    ]}
                  />
                  <Bar dataKey="clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Clientes" />
                  <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tenant Status Pie */}
        {statusChartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tenants por Status</h3>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {statusChartData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Transactions by Type */}
      {txChartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Transa\u00e7\u00f5es por Tipo (m\u00eas)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {txChartData.map((t: any, i: number) => (
              <div key={t.name} className="p-3 rounded-lg border border-gray-100">
                <div className="h-2 w-full rounded-full mb-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <p className="text-xs text-gray-500">{t.name}</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrencyFull(t.value)}</p>
                <p className="text-xs text-gray-400">{t.count} transa\u00e7\u00f5es</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-sm font-bold text-emerald-800">SISTEMA CAPTANDO, COBRANDO E ESCALANDO AUTOMATICAMENTE</h3>
        </div>
        <p className="text-xs text-emerald-600">
          Hunter Mode ativo &middot; Asaas webhook sincronizado &middot; Afiliados com gamifica&ccedil;&atilde;o &middot; Preview gerando demos &middot; MRR: {formatCurrencyFull(revenue?.mrr ?? 0)}
        </p>
      </div>
    </div>
  )
}
