'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, Users, FileText, AlertTriangle,
  Calendar, ArrowUpRight, ArrowDownRight, Banknote, ChevronRight,
  CheckCircle, XCircle, Clock, AlertCircle, BarChart3, ClipboardList,
} from 'lucide-react'
import { financeApi, type FinanceSummary, type CashflowPoint } from '@/lib/api'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, color, href,
}: {
  title: string
  value: string
  sub?: string
  icon: typeof DollarSign
  color: string
  href?: string
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── Stat Row (UnilocWeb style) ───────────────────────────────────────────────
function StatRow({
  label, value, variant = 'blue', href,
}: {
  label: string
  value: number
  variant?: 'blue' | 'red' | 'yellow' | 'green' | 'gray'
  href?: string
}) {
  const colors = {
    blue:   'bg-blue-100 text-blue-700',
    red:    'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green:  'bg-green-100 text-green-700',
    gray:   'bg-gray-100 text-gray-600',
  }
  const inner = (
    <div className="flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 rounded-lg transition-colors">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[28px] text-center ${colors[variant]}`}>
        {value}
      </span>
    </div>
  )
  return href ? (
    <Link href={href} className="block">{inner}</Link>
  ) : inner
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function LemosbankPage() {
  const token = useAuthStore(s => s.accessToken)

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeApi.summary(token!),
    enabled: !!token,
    refetchInterval: 60_000,
  })

  const { data: cashflow, isLoading: cashLoading } = useQuery({
    queryKey: ['finance-cashflow'],
    queryFn: () => financeApi.cashflow(token!),
    enabled: !!token,
  })

  const s = summary as FinanceSummary | undefined
  const cf = cashflow?.data as CashflowPoint[] | undefined

  // Contract status breakdown for bar chart
  const contractBreakdown = s ? [
    { name: 'Ativos',     value: s.activeContracts,   color: '#3b82f6' },
    { name: 'Encerrados', value: s.finishedContracts ?? 0, color: '#6b7280' },
    { name: 'Cancelados', value: s.canceledContracts ?? 0, color: '#ef4444' },
  ] : []

  const skeleton = (h = 'h-24') => <div className={`${h} bg-gray-100 rounded-2xl animate-pulse`} />

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <Banknote className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lemosbank</h1>
            <p className="text-sm text-gray-500">Dashboard Financeiro</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/clientes" className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 text-gray-600">
            Clientes
          </Link>
          <Link href="/dashboard/contratos" className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 text-gray-600">
            Contratos
          </Link>
          <Link href="/dashboard/lemosbank/cobrancas" className="px-3 py-1.5 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 text-sm hover:bg-yellow-100">
            Cobranças
          </Link>
          <Link href="/dashboard/lemosbank/relatorios" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            Relatórios
          </Link>
        </div>
      </div>

      {/* Financial Stats Grid */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : s ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Receita do Mês"
            value={fmt(s.income)}
            sub={`Previsto: ${fmt(s.expectedIncome)}`}
            icon={ArrowUpRight}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            title="Despesas do Mês"
            value={fmt(s.expenses)}
            icon={ArrowDownRight}
            color="bg-red-50 text-red-600"
          />
          <StatCard
            title="Saldo"
            value={fmt(s.balance)}
            sub={s.balance >= 0 ? 'Positivo' : 'Negativo'}
            icon={s.balance >= 0 ? TrendingUp : TrendingDown}
            color={s.balance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}
          />
          <StatCard
            title="Inadimplência"
            value={`${s.inadimplencia}%`}
            sub={`${s.lateRentals} de ${s.totalRentals} alug.`}
            icon={AlertTriangle}
            color={s.inadimplencia > 10 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}
          />
          <StatCard
            title="Contratos Ativos"
            value={String(s.activeContracts)}
            sub={`de ${s.totalContracts ?? s.activeContracts} cadastrados`}
            icon={FileText}
            color="bg-purple-50 text-purple-600"
            href="/dashboard/contratos?status=ACTIVE"
          />
          <StatCard
            title="Total de Clientes"
            value={String(s.totalClients)}
            icon={Users}
            color="bg-indigo-50 text-indigo-600"
            href="/dashboard/clientes"
          />
          <StatCard
            title="Vencimentos (30 dias)"
            value={String(s.upcomingRentals.length)}
            icon={Calendar}
            color="bg-cyan-50 text-cyan-600"
          />
          <StatCard
            title="Em Atraso"
            value={String(s.lateRentals)}
            icon={AlertTriangle}
            color={s.lateRentals > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}
          />
        </div>
      ) : null}

      {/* UnilocWeb-style: Estatísticas + Contratos Ativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Estatísticas Gerais */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              Estatísticas Gerais
            </h2>
            <Link href="/dashboard/contratos" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {summaryLoading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-9 bg-gray-50 rounded-lg animate-pulse" />)}</div>
          ) : s ? (
            <div className="divide-y divide-gray-50">
              <StatRow
                label="Contratos Novos no Mês"
                value={s.newContractsThisMonth ?? 0}
                variant="blue"
                href="/dashboard/contratos"
              />
              <StatRow
                label="Contratos com Repasse no Mês"
                value={s.contractsWithRepasse ?? 0}
                variant="blue"
                href="/dashboard/contratos?status=ACTIVE"
              />
              <StatRow
                label="Contratos Vencidos no Mês"
                value={s.contractsFinishedThisMonth ?? 0}
                variant="red"
                href="/dashboard/contratos?status=FINISHED"
              />
              <StatRow
                label="Contratos a vencer nos próximos 30 dias"
                value={s.contractsExpiringSoon ?? 0}
                variant="yellow"
                href="/dashboard/contratos?status=ACTIVE"
              />
              <StatRow
                label="Contratos Ativos com Seguro Vencido"
                value={0}
                variant="red"
              />
              <StatRow
                label="Contratos Ativos com Código do Imóvel"
                value={s.contractsWithIptu ?? 0}
                variant="blue"
                href="/dashboard/contratos?status=ACTIVE"
              />
            </div>
          ) : null}
        </div>

        {/* Contratos Ativos breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Contratos Ativos
            </h2>
            <Link href="/dashboard/contratos" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {s && (
            <p className="text-xs text-gray-400 mb-4">
              {s.activeContracts} contratos ativos de {s.totalContracts ?? s.activeContracts} contratos cadastrados
            </p>
          )}
          {summaryLoading ? (
            <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
          ) : contractBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={contractBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: any) => [v, 'Contratos']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {contractBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 justify-center">
                {contractBreakdown.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                    {item.name}: <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Evolução da Carteira */}
      {s && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Evolução da Carteira
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Cobranças a Receber',
                value: fmt(s.cobrancasAReceber ?? 0),
                sub: 'aluguéis pendentes',
                color: 'border-l-4 border-blue-400 pl-3',
                textColor: 'text-blue-700',
              },
              {
                label: 'Cobranças Recebidas',
                value: fmt(s.cobrancasRecebidas ?? 0),
                sub: 'pagas este mês',
                color: 'border-l-4 border-green-400 pl-3',
                textColor: 'text-green-700',
              },
              {
                label: 'TX ADM a Receber',
                value: fmt(Math.round((s.cobrancasAReceber ?? 0) * ((s.expectedIncome > 0 ? 0.1 : 0)))),
                sub: 'comissão pendente',
                color: 'border-l-4 border-orange-400 pl-3',
                textColor: 'text-orange-700',
              },
              {
                label: 'TX ADM Recebida',
                value: fmt(s.income),
                sub: 'receita do mês',
                color: 'border-l-4 border-purple-400 pl-3',
                textColor: 'text-purple-700',
              },
            ].map(item => (
              <div key={item.label} className={item.color}>
                <p className={`text-xl font-bold ${item.textColor}`}>{item.value}</p>
                <p className="text-xs font-medium text-gray-700 mt-0.5">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Fluxo de Caixa — 12 meses</h2>
            {cashflow && (
              <span className="text-xs text-gray-400">
                Previsão mensal: {fmt(cashflow.monthlyForecast)}
              </span>
            )}
          </div>
          {cashLoading ? (
            <div className="h-60 bg-gray-50 rounded-xl animate-pulse" />
          ) : cf && cf.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={cf} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="income"   name="Receita"  stroke="#3b82f6" fill="url(#gIncome)"  strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#ef4444" fill="url(#gExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              Nenhuma transação registrada ainda
            </div>
          )}
        </div>

        {/* Tarefas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            Tarefas
          </h2>
          {summaryLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : s ? (
            <div className="space-y-2 text-xs">
              {/* Late rentals */}
              {(s.lateRentalsList ?? []).slice(0, 5).map((r: any) => (
                <Link
                  key={r.id}
                  href="/dashboard/contratos"
                  className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-red-800 truncate">{r.contract?.tenantName ?? 'Inquilino'}</p>
                    <p className="text-red-600">Aluguel em atraso — {r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt-BR') : '—'}</p>
                  </div>
                </Link>
              ))}
              {/* Upcoming rentals (next 7 days) */}
              {s.upcomingRentals.slice(0, 3).map((r: any) => {
                const due = r.dueDate ? new Date(r.dueDate) : null
                const today = new Date()
                const diffDays = due ? Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 99
                if (diffDays > 7) return null
                return (
                  <div key={r.id} className="flex items-start gap-2 p-2.5 bg-yellow-50 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-yellow-800 truncate">{r.contract?.tenantName ?? 'Inquilino'}</p>
                      <p className="text-yellow-700">Vence em {diffDays === 0 ? 'hoje' : `${diffDays} dia(s)`}</p>
                    </div>
                  </div>
                )
              })}
              {/* Expiring contracts */}
              {(s.contractsExpiringSoon ?? 0) > 0 && (
                <Link href="/dashboard/contratos?status=ACTIVE" className="flex items-start gap-2 p-2.5 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-orange-800">Contratos a vencer</p>
                    <p className="text-orange-700">{s.contractsExpiringSoon} contrato(s) nos próximos 30 dias</p>
                  </div>
                </Link>
              )}
              {(s.lateRentals === 0 && s.upcomingRentals.filter(r => {
                const d = r.dueDate ? new Date(r.dueDate) : null
                return d && Math.ceil((d.getTime() - new Date().getTime()) / 86400000) <= 7
              }).length === 0 && (s.contractsExpiringSoon ?? 0) === 0) && (
                <p className="text-center text-gray-400 py-6">Nenhuma tarefa pendente</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Próximos Vencimentos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Próximos Vencimentos (30 dias)</h2>
        {summaryLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : !s?.upcomingRentals.length ? (
          <p className="text-sm text-gray-400 py-6 text-center">Nenhum vencimento nos próximos 30 dias</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {s.upcomingRentals.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    {r.contract?.tenantName ?? 'Inquilino'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-600 ml-2 shrink-0">
                  {fmt(r.totalAmount ?? r.rentAmount ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/clientes" className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-indigo-50">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Clientes</p>
            <p className="text-sm text-gray-500">Inquilinos, proprietários e fiadores</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>
        <Link href="/dashboard/contratos" className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-purple-50">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Contratos</p>
            <p className="text-sm text-gray-500">Ativos, encerrados e cancelados</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>
        <Link href="/dashboard/lemosbank/cobrancas" className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-yellow-50">
            <CheckCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Cobranças</p>
            <p className="text-sm text-gray-500">Dar baixa, email, WhatsApp, avulsa</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>
        <Link href="/dashboard/lemosbank/relatorios" className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-blue-50">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Relatórios</p>
            <p className="text-sm text-gray-500">Operacionais, gerenciais e proprietários</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>
      </div>
    </div>
  )
}
