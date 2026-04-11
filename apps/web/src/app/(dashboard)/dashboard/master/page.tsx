'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { masterApi } from '@/lib/api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Brain, TrendingUp, DollarSign, Users, Zap, Target,
  ArrowUpRight, Building2, Crown, RefreshCw, AlertTriangle,
  Shield, Crosshair, Globe, MessageCircle, ChevronDown, ChevronUp,
  Clock, Phone, Lightbulb, BarChart3, MapPin, Send, Rocket,
} from 'lucide-react'

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
}

const RISK_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtCompact(v: number): string {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`
  return fmt(v)
}

function pct(v: number): string {
  return `${v.toFixed(1)}%`
}

export default function MasterPage() {
  const token = useAuthStore(s => s.accessToken)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const { data: res, isLoading, refetch } = useQuery({
    queryKey: ['master-intelligence'],
    queryFn: () => masterApi.intelligence(token!),
    enabled: !!token,
    refetchInterval: 60000,
  })

  const intel = res?.data

  if (isLoading || !intel) {
    return (
      <div className="p-4 sm:p-6 flex justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Carregando intelig&ecirc;ncia master...</p>
        </div>
      </div>
    )
  }

  const { revenue, sales, channels, retention, forecast, unitEconomics, affiliates, geo, advisor, growthEngine } = intel

  // Chart data
  const planChartData = (revenue?.receitaPorPlano || []).map((p: any) => ({
    name: p.plan, clientes: p.count, receita: p.revenue,
  }))

  const channelChartData = (channels?.channels || []).filter((c: any) => c.leads > 0).map((c: any) => ({
    name: c.name, leads: c.leads, vendas: c.vendas, conversao: c.conversao,
  }))

  const tenantStatusData = Object.entries(retention || {})
    .filter(([k]) => ['clientesAtivos', 'clientesTrial', 'clientesPastDue', 'clientesSuspensos'].includes(k))
    .map(([k, v]) => ({
      name: k === 'clientesAtivos' ? 'Ativos' : k === 'clientesTrial' ? 'Trial' : k === 'clientesPastDue' ? 'Inadimplente' : 'Suspensos',
      value: v as number,
    }))
    .filter(d => d.value > 0)

  function toggleSection(id: string) {
    setExpandedSection(prev => prev === id ? null : id)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0" />
            Master Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 truncate">Centro de comando executivo — atualizado em tempo real</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* ═══ F. TOM\u00c1S ADVISOR ═══ */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center shrink-0">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-purple-900">Tom&aacute;s Advisor</p>
            <p className="text-sm text-purple-800 mt-1">{advisor?.advisorHeadline || 'Analisando dados...'}</p>
          </div>
        </div>
        {advisor?.advisorRecommendations?.length > 0 && (
          <div className="mt-3 space-y-2">
            {advisor.advisorRecommendations.slice(0, 3).map((rec: any, i: number) => (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${PRIORITY_COLORS[rec.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low}`}>
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{rec.title}</p>
                  <p className="text-xs opacity-80">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ A. RESUMO EXECUTIVO ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Receita Hoje', value: fmt(revenue?.receitaHoje ?? 0), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Receita M\u00eas', value: fmtCompact(revenue?.receitaMes ?? 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'MRR', value: fmtCompact(revenue?.mrr ?? 0), icon: ArrowUpRight, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Lucro L\u00edquido', value: fmtCompact(revenue?.receitaLiquida ?? 0), icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-gray-200 p-3 ${s.bg}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] sm:text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-sm sm:text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Secondary Revenue */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'ARR', value: fmtCompact(revenue?.mrr ? revenue.mrr * 12 : 0) },
          { label: 'Ticket M\u00e9dio', value: fmt(revenue?.ticketMedio ?? 0) },
          { label: 'Inadimpl\u00eancia', value: pct(revenue?.inadimplenciaPercentual ?? 0) },
          { label: 'Forecast M\u00eas', value: fmtCompact(forecast?.forecastFechamentoMes ?? 0) },
          { label: 'M\u00e9dia 7d', value: fmt(forecast?.mediaUltimos7Dias ?? 0) },
          { label: 'Tend\u00eancia', value: forecast?.tendencia === 'crescimento' ? '\u2191 Crescimento' : forecast?.tendencia === 'queda' ? '\u2193 Queda' : '\u2192 Est\u00e1vel' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-100 p-2 text-center">
            <p className="text-[10px] text-gray-400">{s.label}</p>
            <p className="text-xs sm:text-sm font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ═══ B. VENDAS ═══ */}
      <CollapsibleSection
        id="vendas" title="Vendas" icon={<Target className="h-4 w-4 text-blue-600" />}
        expanded={expandedSection === 'vendas'} onToggle={() => toggleSection('vendas')}
        summary={`${sales?.leadsHoje ?? 0} leads hoje | ${sales?.vendasMes ?? 0} vendas m\u00eas | ${pct(sales?.conversaoGeral ?? 0)} conv.`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Leads Hoje', value: sales?.leadsHoje ?? 0 },
            { label: 'Leads Semana', value: sales?.leadsSemana ?? 0 },
            { label: 'Leads M\u00eas', value: sales?.leadsMes ?? 0 },
            { label: 'Vendas Hoje', value: sales?.vendasHoje ?? 0 },
            { label: 'Vendas M\u00eas', value: sales?.vendasMes ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ═══ C. CANAIS ═══ */}
      <CollapsibleSection
        id="canais" title="Canais" icon={<Globe className="h-4 w-4 text-teal-600" />}
        expanded={expandedSection === 'canais'} onToggle={() => toggleSection('canais')}
        summary={`${channels?.channels?.length ?? 0} canais ativos`}
      >
        {channelChartData.length > 0 && (
          <div className="h-48 sm:h-56 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Leads" />
                <Bar dataKey="vendas" fill="#10b981" radius={[3, 3, 0, 0]} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="space-y-1.5">
          {(channels?.channels || []).map((ch: any, i: number) => (
            <div key={ch.slug} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="font-medium text-gray-700 truncate">{ch.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-gray-500">
                <span>{ch.leads} leads</span>
                <span>{ch.vendas} vendas</span>
                <span className="font-semibold text-gray-700">{pct(ch.conversao)}</span>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ═══ Charts Row ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Plan */}
        {planChartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">Receita por Plano</h3>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any, name: any) => [name === 'receita' ? fmt(Number(v)) : v, name === 'receita' ? 'Receita' : 'Clientes']} />
                  <Bar dataKey="clientes" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Clientes" />
                  <Bar dataKey="receita" fill="#10b981" radius={[4, 4, 0, 0]} name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tenant Status Pie */}
        {tenantStatusData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">Tenants por Status</h3>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tenantStatusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {tenantStatusData.map((_: any, i: number) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ═══ D. RETEN\u00c7\u00c3O / CHURN RADAR ═══ */}
      <CollapsibleSection
        id="retencao" title="Reten\u00e7\u00e3o / Churn Radar" icon={<Shield className="h-4 w-4 text-red-600" />}
        expanded={expandedSection === 'retencao'} onToggle={() => toggleSection('retencao')}
        summary={`${retention?.churnRiskCount ?? 0} em risco | ${retention?.clientesAtivos ?? 0} ativos`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Ativos', value: retention?.clientesAtivos ?? 0, color: 'text-green-600' },
            { label: 'Trial', value: retention?.clientesTrial ?? 0, color: 'text-blue-600' },
            { label: 'Inadimplentes', value: retention?.clientesPastDue ?? 0, color: 'text-orange-600' },
            { label: 'Sem acesso 30d', value: retention?.tenantsSemAcesso30d ?? 0, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Churn Risk Tenants */}
        {(retention?.churnRiskTenants || []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-600">Tenants em Risco</p>
            {retention.churnRiskTenants.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${RISK_COLORS[t.riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.low}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-700 truncate">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.subdomain} &middot; {t.plan}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-red-600">{t.daysSinceLastActivity}d inativo</p>
                  <p className="text-xs text-gray-400">{t.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Retention Suggestions */}
        {(retention?.retentionSuggestions || []).length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-600">Sugest&otilde;es de Reten&ccedil;&atilde;o</p>
            {retention.retentionSuggestions.map((s: any, i: number) => (
              <div key={i} className={`p-2 rounded-lg border text-xs ${PRIORITY_COLORS[s.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low}`}>
                <p className="font-semibold">{s.title}</p>
                <p className="opacity-80">{s.description}</p>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ E. PROJE\u00c7\u00c3O ═══ */}
      <CollapsibleSection
        id="projecao" title="Proje\u00e7\u00e3o" icon={<Target className="h-4 w-4 text-indigo-600" />}
        expanded={expandedSection === 'projecao'} onToggle={() => toggleSection('projecao')}
        summary={`Forecast: ${fmtCompact(forecast?.forecastFechamentoMes ?? 0)} | ${forecast?.tendencia ?? 'estavel'}`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Forecast M\u00eas', value: fmtCompact(forecast?.forecastFechamentoMes ?? 0) },
            { label: 'MRR Pr\u00f3ximo', value: fmtCompact(forecast?.forecastMrrProximoMes ?? 0) },
            { label: 'Ritmo Atual', value: `${fmt(forecast?.ritmoAtual ?? 0)}/dia` },
            { label: 'Dias Restantes', value: forecast?.diasRestantesMes ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className="text-sm font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            forecast?.tendencia === 'crescimento' ? 'bg-green-100 text-green-700' :
            forecast?.tendencia === 'queda' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {forecast?.tendencia === 'crescimento' ? '\u2191 Crescimento' : forecast?.tendencia === 'queda' ? '\u2193 Queda' : '\u2192 Est\u00e1vel'}
          </span>
          <span className="text-gray-400">Confian&ccedil;a: {forecast?.confianca ?? '—'}</span>
        </div>
      </CollapsibleSection>

      {/* ═══ AFILIADOS ═══ */}
      <CollapsibleSection
        id="afiliados" title="Afiliados" icon={<Users className="h-4 w-4 text-orange-600" />}
        expanded={expandedSection === 'afiliados'} onToggle={() => toggleSection('afiliados')}
        summary={`${affiliates?.activeAffiliates ?? 0} ativos | ${fmtCompact(affiliates?.totalAffiliateCommission ?? 0)} comiss&otilde;es`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Ativos', value: affiliates?.activeAffiliates ?? 0 },
            { label: 'Comiss&otilde;es Total', value: fmtCompact(affiliates?.totalAffiliateCommission ?? 0) },
            { label: 'Receita Afiliados', value: fmtCompact(affiliates?.totalAffiliateRevenue ?? 0) },
            { label: 'MRR Afiliados', value: fmtCompact(affiliates?.affiliateMrr ?? 0) },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className="text-sm font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
        {(affiliates?.topAffiliates || []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-600">Top Afiliados</p>
            {affiliates.topAffiliates.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-700 truncate">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.code} &middot; {a.level}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-600">{fmt(a.totalEarnings)}</p>
                  <p className="text-xs text-gray-400">{a.activeClients} clientes</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ GROWTH ENGINE ═══ */}
      <CollapsibleSection
        id="growth" title="Growth Engine" icon={<Rocket className="h-4 w-4 text-pink-600" />}
        expanded={expandedSection === 'growth'} onToggle={() => toggleSection('growth')}
        summary={`${growthEngine?.outbound?.sentToday ?? 0} disparos hoje | ${growthEngine?.outbound?.replyRate ?? 0}% reply | ${growthEngine?.followUp?.pending ?? 0} follow-ups`}
      >
        {/* Outbound Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Enviados Hoje', value: growthEngine?.outbound?.sentToday ?? 0, color: 'text-blue-600' },
            { label: 'Enviados Mês', value: growthEngine?.outbound?.sentMonth ?? 0, color: 'text-blue-600' },
            { label: 'Taxa Resposta', value: `${growthEngine?.outbound?.replyRate ?? 0}%`, color: 'text-green-600' },
            { label: 'Taxa Entrega', value: `${growthEngine?.outbound?.deliveryRate ?? 0}%`, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* A/B Template Performance */}
        {(growthEngine?.outbound?.templatePerformance || []).length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-1.5">A/B Performance</p>
            <div className="grid grid-cols-3 gap-2">
              {growthEngine.outbound.templatePerformance.map((t: any) => (
                <div key={t.version} className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs font-bold text-gray-700">Template {t.version}</p>
                  <p className="text-sm font-bold text-blue-600">{t.replyRate}%</p>
                  <p className="text-[10px] text-gray-400">{t.sent} enviados · {t.replied} respostas</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Funnel Stages */}
        {(growthEngine?.funnel || []).length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Funil de Conversão</p>
            <div className="space-y-1">
              {growthEngine.funnel.map((s: any, i: number) => {
                const maxCount = Math.max(...growthEngine.funnel.map((f: any) => f.count), 1)
                const width = Math.max((s.count / maxCount) * 100, 5)
                const stageLabels: Record<string, string> = {
                  captured: 'Capturado', engaged: 'Engajado', preview_sent: 'Preview Enviado',
                  preview_clicked: 'Preview Clicado', checkout_sent: 'Checkout Enviado',
                  converted: 'Convertido', lost: 'Perdido',
                }
                return (
                  <div key={s.stage} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-24 shrink-0 text-right">{stageLabels[s.stage] || s.stage}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${width}%`,
                          backgroundColor: s.stage === 'converted' ? '#10b981' : s.stage === 'lost' ? '#ef4444' : CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-10 text-right">{s.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Channel Performance */}
        {(growthEngine?.channelPerformance || []).length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Performance por Canal</p>
            <div className="space-y-1.5">
              {growthEngine.channelPerformance.map((ch: any) => (
                <div key={ch.source} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
                  <span className="font-medium text-gray-700">{ch.source}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{ch.total} leads</span>
                    <span className="text-green-600 font-semibold">{ch.converted} conv.</span>
                    <span className="font-bold text-gray-700">{ch.conversionRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Trend Chart */}
        {(growthEngine?.dailyTrend || []).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Tendência 7 Dias</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthEngine.dailyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="captured" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Capturados" />
                  <Line type="monotone" dataKey="converted" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Convertidos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Follow-up Stats */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Follow-ups Pendentes', value: growthEngine?.followUp?.pending ?? 0 },
            { label: 'Enviados Mês', value: growthEngine?.followUp?.sentMonth ?? 0 },
            { label: 'Pulados', value: growthEngine?.followUp?.skippedMonth ?? 0 },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-400">{s.label}</p>
              <p className="text-sm font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ═══ CAC/LTV (aguardando integra\u00e7\u00e3o) ═══ */}
      {unitEconomics?.integracaoMidiaStatus === 'aguardando_integracao' && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-500">CAC / LTV / ROAS</h3>
            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Aguardando integra&ccedil;&atilde;o de m&iacute;dia</span>
          </div>
          <p className="text-xs text-gray-400">M&eacute;tricas de CAC e ROAS ser&atilde;o exibidas ap&oacute;s integra&ccedil;&atilde;o com Meta Ads / Google Ads.</p>
          {(unitEconomics?.ltvPorPlano || []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {unitEconomics.ltvPorPlano.map((p: any) => (
                <span key={p.plan} className="text-xs bg-white px-2 py-1 rounded border border-gray-100">
                  LTV {p.plan}: {fmtCompact(p.ltv)} ({p.avgMonths}m)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ GEO ═══ */}
      {(geo?.vendasPorCidade || []).length > 0 && (
        <CollapsibleSection
          id="geo" title="Distribui\u00e7\u00e3o Geogr\u00e1fica" icon={<MapPin className="h-4 w-4 text-teal-600" />}
          expanded={expandedSection === 'geo'} onToggle={() => toggleSection('geo')}
          summary={`${geo.vendasPorCidade.length} cidades | ${geo.vendasPorUF?.length ?? 0} UFs`}
        >
          <div className="space-y-1.5">
            {geo.vendasPorCidade.slice(0, 8).map((c: any) => (
              <div key={`${c.city}-${c.state}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
                <span className="text-gray-700">{c.city}{c.state ? ` - ${c.state}` : ''}</span>
                <span className="text-gray-500 text-xs">{c.leads} leads</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* System Status */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-xs font-bold text-emerald-800">SISTEMA CAPTANDO, COBRANDO E ESCALANDO AUTOMATICAMENTE</h3>
        </div>
        <p className="text-[10px] text-emerald-600">
          MRR: {fmtCompact(revenue?.mrr ?? 0)} &middot; {retention?.clientesAtivos ?? 0} tenants ativos &middot; {affiliates?.activeAffiliates ?? 0} afiliados &middot; Forecast: {fmtCompact(forecast?.forecastFechamentoMes ?? 0)}
        </p>
      </div>
    </div>
  )
}

// ── Collapsible Section Component ───────────────────────────────────────────

function CollapsibleSection({ id, title, icon, expanded, onToggle, summary, children }: {
  id: string; title: string; icon: React.ReactNode; expanded: boolean;
  onToggle: () => void; summary: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 sm:p-4 flex items-center justify-between text-left">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <span className="text-xs text-gray-400 truncate hidden sm:block">&mdash; {summary}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>
      {!expanded && (
        <div className="px-3 sm:px-4 pb-2 sm:hidden">
          <p className="text-xs text-gray-400">{summary}</p>
        </div>
      )}
      {expanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          {children}
        </div>
      )}
    </div>
  )
}
