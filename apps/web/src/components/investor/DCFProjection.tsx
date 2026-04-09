'use client'

import { useMemo } from 'react'
import { TrendingUp, DollarSign, Clock, BarChart3 } from 'lucide-react'
import type { DCFResult } from '@/lib/financial-engine'
import { formatBRL, formatPercent } from '@/lib/financial-engine'

interface Props {
  dcf: DCFResult
  totalInvestment: number
}

export function DCFProjection({ dcf, totalInvestment }: Props) {
  const maxEquity = useMemo(
    () => Math.max(...dcf.cashFlows.map(cf => cf.equityValue), totalInvestment),
    [dcf.cashFlows, totalInvestment],
  )

  const maxNOI = useMemo(
    () => Math.max(...dcf.cashFlows.map(cf => cf.netOperatingIncome), 1),
    [dcf.cashFlows],
  )

  return (
    <div className="space-y-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<DollarSign className="h-4 w-4" />}
          label="VPL (NPV)"
          value={formatBRL(dcf.npv)}
          color={dcf.npv >= 0 ? 'green' : 'red'}
          subtitle={dcf.npv >= 0 ? 'Investimento viável' : 'Retorno abaixo do desconto'}
        />
        <KPICard
          icon={<TrendingUp className="h-4 w-4" />}
          label="TIR (IRR)"
          value={formatPercent(dcf.irr)}
          color={dcf.irr >= 10 ? 'green' : dcf.irr >= 5 ? 'yellow' : 'red'}
          subtitle={`Retorno anualizado: ${formatPercent(dcf.annualizedReturn)}`}
        />
        <KPICard
          icon={<Clock className="h-4 w-4" />}
          label="Payback"
          value={`${dcf.paybackYears.toFixed(1)} anos`}
          color={dcf.paybackYears <= 8 ? 'green' : dcf.paybackYears <= 15 ? 'yellow' : 'red'}
          subtitle={`${dcf.breakEvenMonth} meses para break-even`}
        />
        <KPICard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Cap Rate"
          value={formatPercent(dcf.capRate)}
          color={dcf.capRate >= 7 ? 'green' : dcf.capRate >= 4 ? 'yellow' : 'red'}
          subtitle={`Yield líquido: ${formatPercent(dcf.netYield)}`}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Yield Bruto</div>
          <div className="text-lg font-bold text-gray-200">{formatPercent(dcf.grossYield)}</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Cash-on-Cash</div>
          <div className="text-lg font-bold text-gray-200">{formatPercent(dcf.cashOnCash)}</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Equity Multiple</div>
          <div className="text-lg font-bold text-gray-200">{dcf.equityMultiple.toFixed(2)}x</div>
        </div>
      </div>

      {/* Equity Growth Chart (ASCII-style terminal bars) */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-400 tracking-wider">EQUITY_GROWTH_PROJECTION</span>
          <span className="text-[10px] text-gray-600">Valor patrimonial ao longo do tempo</span>
        </div>
        <div className="p-4 space-y-1.5">
          {dcf.cashFlows.map(cf => {
            const barWidth = (cf.equityValue / maxEquity) * 100
            const isAboveInvestment = cf.equityValue >= totalInvestment

            return (
              <div key={cf.year} className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500 w-8 text-right font-mono">
                  Y{cf.year}
                </span>
                <div className="flex-1 h-5 bg-gray-800/50 rounded overflow-hidden relative">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      isAboveInvestment
                        ? 'bg-gradient-to-r from-green-700 to-green-500'
                        : 'bg-gradient-to-r from-blue-800 to-blue-600'
                    }`}
                    style={{ width: `${Math.max(barWidth, 2)}%` }}
                  />
                  {/* Investment line marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-yellow-500/50"
                    style={{ left: `${(totalInvestment / maxEquity) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-gray-400 w-20 text-right font-mono">
                  {formatBRL(cf.equityValue)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-gray-800 flex justify-between text-[10px] text-gray-600">
          <span>Investimento: {formatBRL(totalInvestment)}</span>
          <span className="text-yellow-500/70">— linha amarela = break-even</span>
        </div>
      </div>

      {/* Cash Flow Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800">
          <span className="text-xs text-gray-400 tracking-wider">CASH_FLOW_DETAIL</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="px-3 py-2 text-left">Ano</th>
                <th className="px-3 py-2 text-right">Aluguel Bruto</th>
                <th className="px-3 py-2 text-right">Vacância</th>
                <th className="px-3 py-2 text-right">Despesas</th>
                <th className="px-3 py-2 text-right">NOI</th>
                <th className="px-3 py-2 text-right">Acumulado</th>
                <th className="px-3 py-2 text-right">Retorno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {dcf.cashFlows.map(cf => (
                <tr key={cf.year} className="hover:bg-gray-900/30">
                  <td className="px-3 py-1.5 text-gray-300 font-mono">Ano {cf.year}</td>
                  <td className="px-3 py-1.5 text-right text-green-400 font-mono">{formatBRL(cf.grossRent)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400 font-mono">-{formatBRL(cf.vacancy)}</td>
                  <td className="px-3 py-1.5 text-right text-red-400 font-mono">
                    -{formatBRL(cf.maintenance + cf.propertyTax + cf.insurance + cf.management)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-blue-400 font-mono font-bold">{formatBRL(cf.netOperatingIncome)}</td>
                  <td className={`px-3 py-1.5 text-right font-mono ${cf.cumulativeCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatBRL(cf.cumulativeCashFlow)}
                  </td>
                  <td className={`px-3 py-1.5 text-right font-mono ${cf.cumulativeReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(cf.cumulativeReturn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NOI Bar Chart */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800">
          <span className="text-xs text-gray-400 tracking-wider">NOI_ANUAL</span>
        </div>
        <div className="p-4 flex items-end gap-1.5 h-32">
          {dcf.cashFlows.map(cf => {
            const height = (cf.netOperatingIncome / maxNOI) * 100
            return (
              <div
                key={cf.year}
                className="flex-1 group relative"
              >
                <div
                  className="bg-gradient-to-t from-cyan-700 to-cyan-400 rounded-t transition-all duration-300 hover:from-cyan-600 hover:to-cyan-300 mx-auto"
                  style={{ height: `${Math.max(height, 3)}%`, maxWidth: '32px' }}
                />
                <div className="text-[9px] text-gray-600 text-center mt-1">Y{cf.year}</div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300 whitespace-nowrap z-10">
                  NOI: {formatBRL(cf.netOperatingIncome)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function KPICard({ icon, label, value, color, subtitle }: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'green' | 'yellow' | 'red'
  subtitle: string
}) {
  const borderColor = {
    green: 'border-green-900/50',
    yellow: 'border-yellow-900/50',
    red: 'border-red-900/50',
  }[color]

  const bgColor = {
    green: 'bg-green-950/20',
    yellow: 'bg-yellow-950/20',
    red: 'bg-red-950/20',
  }[color]

  const textColor = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  }[color]

  const labelColor = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
  }[color]

  return (
    <div className={`border ${borderColor} ${bgColor} rounded-lg p-3`}>
      <div className={`flex items-center gap-1.5 text-[10px] ${labelColor} mb-1`}>
        {icon}
        <span className="tracking-wider uppercase">{label}</span>
      </div>
      <div className={`text-xl font-bold ${textColor} font-mono`}>{value}</div>
      <div className="text-[10px] text-gray-600 mt-0.5">{subtitle}</div>
    </div>
  )
}
