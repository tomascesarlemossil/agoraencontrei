'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { reportsApi, type ReportOverview } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Users,
  Award,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS = [
  { value: '', label: 'Ano todo' },
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },   { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },    { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },   { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ComponentType<any>; color: string
}) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
        </div>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { getValidToken, user } = useAuth()
  const [year, setYear] = useState(String(CURRENT_YEAR))
  const [month, setMonth] = useState('')

  const isManager = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCIAL'].includes(user?.role ?? '')

  const { data, isLoading, error } = useQuery<ReportOverview>({
    queryKey: ['reports-overview', year, month],
    queryFn: async () => {
      const token = await getValidToken()
      return reportsApi.overview(token!, {
        year: Number(year),
        month: month ? Number(month) : undefined,
      })
    },
    enabled: isManager,
  })

  if (!isManager) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-white text-lg font-medium">Acesso restrito</h2>
        <p className="text-white/40 text-sm mt-2">Apenas gestores e financeiro têm acesso aos relatórios.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Lemosbank</h1>
          <p className="text-white/50 text-sm mt-1">Relatórios financeiros e de performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-white/40">Carregando relatório...</div>
      ) : error ? (
        <div className="py-20 text-center text-red-400">Erro ao carregar relatório</div>
      ) : data && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Negócios Fechados"
              value={data.deals.closedWon}
              sub={`de ${data.deals.total} no período`}
              icon={CheckCircle}
              color="bg-emerald-500/20 text-emerald-400"
            />
            <KpiCard
              label="Volume Transacionado"
              value={fmt(data.deals.closedValue)}
              sub={`${data.deals.conversionRate}% de conversão`}
              icon={DollarSign}
              color="bg-blue-500/20 text-blue-400"
            />
            <KpiCard
              label="Comissões Pagas"
              value={fmt(data.commissions.paid)}
              sub={`${data.commissions.total} comissões`}
              icon={TrendingUp}
              color="bg-purple-500/20 text-purple-400"
            />
            <KpiCard
              label="Comissões Pendentes"
              value={fmt(data.commissions.pending)}
              sub={`${data.commissions.pendingCount} a receber`}
              icon={Clock}
              color="bg-yellow-500/20 text-yellow-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking de Corretores */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-4 w-4 text-yellow-400" />
                <h2 className="text-sm font-medium text-white">Ranking de Corretores</h2>
              </div>
              {data.brokerRanking.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-8">Nenhum negócio fechado no período</p>
              ) : (
                <div className="space-y-3">
                  {data.brokerRanking.map((entry, i) => (
                    <div key={entry.broker.id} className="flex items-center gap-3">
                      <div className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        i === 0 ? 'bg-yellow-500 text-black'
                          : i === 1 ? 'bg-gray-400 text-black'
                          : i === 2 ? 'bg-amber-700 text-white'
                          : 'bg-white/10 text-white/40'
                      )}>
                        {i + 1}
                      </div>
                      <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {entry.broker.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{entry.broker.name}</p>
                        <p className="text-xs text-white/40">{entry.dealsCount} negócio{entry.dealsCount !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="text-sm font-medium text-emerald-400 flex-shrink-0">{fmt(entry.totalValue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Negócios por mês */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <h2 className="text-sm font-medium text-white">Negócios Fechados por Mês</h2>
              </div>
              {data.dealsByMonth.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-8">Nenhum dado no período</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const max = Math.max(...data.dealsByMonth.map((r) => r.total), 1)
                    return data.dealsByMonth.map((row) => (
                      <div key={row.month} className="flex items-center gap-3">
                        <p className="text-xs text-white/40 w-16 flex-shrink-0">{row.month}</p>
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(row.total / max) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/60 w-20 text-right flex-shrink-0">{fmt(row.total)}</p>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Últimos Negócios Fechados */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-medium text-white">Últimos Negócios Fechados</h2>
            </div>
            {data.recentDeals.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-8">Nenhum negócio fechado</p>
            ) : (
              <div className="space-y-2">
                {data.recentDeals.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{d.title}</p>
                      <p className="text-xs text-white/40">
                        {d.broker?.name ?? ''}
                        {d.closedAt ? ` · ${new Date(d.closedAt).toLocaleDateString('pt-BR')}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {d.value ? <p className="text-sm font-medium text-emerald-400">{fmt(Number(d.value))}</p> : null}
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Fechado</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commission Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Bruto Total</p>
              <p className="text-xl font-bold text-white">{fmt(data.commissions.grossTotal)}</p>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Líquido Total</p>
              <p className="text-xl font-bold text-white">{fmt(data.commissions.netTotal)}</p>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-center">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Negócios em Aberto</p>
              <p className="text-xl font-bold text-white">{data.deals.open}</p>
              <p className="text-xs text-white/40 mt-1">{data.deals.closedLost} perdidos</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
