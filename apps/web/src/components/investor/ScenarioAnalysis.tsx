'use client'

import { useMemo } from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import type { ScenarioResult } from '@/lib/financial-engine'
import { formatBRL, formatPercent } from '@/lib/financial-engine'

interface Props {
  scenarios: ScenarioResult[]
}

export function ScenarioAnalysis({ scenarios }: Props) {
  const base = scenarios.find(s => s.name === 'base')
  const optimistic = scenarios.find(s => s.name === 'optimistic')
  const pessimistic = scenarios.find(s => s.name === 'pessimistic')

  const maxEquity = useMemo(() => {
    let max = 0
    for (const s of scenarios) {
      for (const cf of s.cashFlows) {
        if (cf.equityValue > max) max = cf.equityValue
      }
    }
    return max || 1
  }, [scenarios])

  return (
    <div className="space-y-4">
      {/* Scenario Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[optimistic, base, pessimistic].filter(Boolean).map(s => {
          const isPositive = s!.npv >= 0
          const icon = s!.name === 'optimistic'
            ? <ArrowUpRight className="h-3.5 w-3.5" />
            : s!.name === 'pessimistic'
              ? <ArrowDownRight className="h-3.5 w-3.5" />
              : <Minus className="h-3.5 w-3.5" />

          const borderColor = s!.name === 'optimistic'
            ? 'border-green-900/50'
            : s!.name === 'pessimistic'
              ? 'border-red-900/50'
              : 'border-blue-900/50'

          const bgColor = s!.name === 'optimistic'
            ? 'bg-green-950/15'
            : s!.name === 'pessimistic'
              ? 'bg-red-950/15'
              : 'bg-blue-950/15'

          return (
            <div key={s!.name} className={`border ${borderColor} ${bgColor} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: s!.color }}>{icon}</span>
                <span className="text-xs tracking-wider uppercase" style={{ color: s!.color }}>
                  {s!.label}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-[10px] text-gray-500">VPL</div>
                  <div className={`text-lg font-bold font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {formatBRL(s!.npv)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-gray-500">TIR</div>
                    <div className="text-sm font-mono text-gray-200">{formatPercent(s!.irr)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500">Payback</div>
                    <div className="text-sm font-mono text-gray-200">{s!.paybackYears.toFixed(1)}a</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Retorno Total</div>
                  <div className={`text-sm font-mono ${s!.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(s!.totalReturn)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scenario Comparison Chart */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800">
          <span className="text-xs text-gray-400 tracking-wider">EQUITY_TRAJECTORY_COMPARISON</span>
        </div>
        <div className="p-4 space-y-3">
          {base?.cashFlows.map((_, idx) => {
            const year = idx + 1
            return (
              <div key={year} className="space-y-1">
                <div className="text-[10px] text-gray-600 font-mono">Ano {year}</div>
                {scenarios.map(s => {
                  const cf = s.cashFlows[idx]
                  if (!cf) return null
                  const width = (cf.equityValue / maxEquity) * 100
                  return (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <div className="flex-1 h-3 bg-gray-800/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.max(width, 1)}%`, backgroundColor: s.color }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono w-20 text-right">
                        {formatBRL(cf.equityValue)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-gray-800 flex gap-4">
          {scenarios.map(s => (
            <span key={s.name} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-gray-500">{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Scenario Assumptions */}
      <div className="border border-gray-800 rounded-lg p-4">
        <div className="text-xs text-gray-400 tracking-wider mb-3">PREMISSAS_POR_CENARIO</div>
        <div className="grid grid-cols-3 gap-4 text-[11px]">
          <div>
            <div className="text-green-500 font-medium mb-2">Otimista</div>
            <ul className="space-y-1 text-gray-500">
              <li>Valorização: IPCA + 2pp</li>
              <li>Reajuste: IGP-M + 1pp</li>
              <li>Vacância: Base - 3pp</li>
            </ul>
          </div>
          <div>
            <div className="text-blue-400 font-medium mb-2">Base</div>
            <ul className="space-y-1 text-gray-500">
              <li>Valorização: IPCA</li>
              <li>Reajuste: IGP-M</li>
              <li>Vacância: 8.3% (~1 mês)</li>
            </ul>
          </div>
          <div>
            <div className="text-red-400 font-medium mb-2">Pessimista</div>
            <ul className="space-y-1 text-gray-500">
              <li>Valorização: IPCA - 2pp</li>
              <li>Reajuste: IGP-M - 1pp</li>
              <li>Vacância: Base + 5pp</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
