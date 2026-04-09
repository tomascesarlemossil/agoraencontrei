'use client'

import { ShieldAlert, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'
import type { StressTestResult } from '@/lib/financial-engine'
import { formatBRL, formatPercent } from '@/lib/financial-engine'

interface Props {
  results: StressTestResult[]
}

export function StressTestPanel({ results }: Props) {
  const survived = results.filter(r => r.survives).length
  const total = results.length
  const resilienceScore = Math.round((survived / total) * 100)

  return (
    <div className="space-y-4">
      {/* Resilience Score */}
      <div className={`border rounded-lg p-4 ${
        resilienceScore >= 70 ? 'border-green-900/50 bg-green-950/15' :
        resilienceScore >= 40 ? 'border-yellow-900/50 bg-yellow-950/15' :
        'border-red-900/50 bg-red-950/15'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 tracking-wider">RESILIENCE_SCORE</div>
            <div className={`text-3xl font-bold font-mono mt-1 ${
              resilienceScore >= 70 ? 'text-green-400' :
              resilienceScore >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {resilienceScore}/100
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              Sobrevive a {survived} de {total} cenários de estresse
            </div>
          </div>
          <div className={`${
            resilienceScore >= 70 ? 'text-green-500' :
            resilienceScore >= 40 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {resilienceScore >= 70
              ? <ShieldCheck className="h-10 w-10" />
              : resilienceScore >= 40
                ? <AlertTriangle className="h-10 w-10" />
                : <XCircle className="h-10 w-10" />
            }
          </div>
        </div>
      </div>

      {/* Stress Test Results */}
      <div className="space-y-2">
        {results.map((r, i) => {
          const severityColors = {
            LOW: 'border-l-blue-500',
            MEDIUM: 'border-l-yellow-500',
            HIGH: 'border-l-orange-500',
            EXTREME: 'border-l-red-500',
          }

          const severityBg = {
            LOW: 'bg-blue-950/10',
            MEDIUM: 'bg-yellow-950/10',
            HIGH: 'bg-orange-950/10',
            EXTREME: 'bg-red-950/10',
          }

          return (
            <div
              key={i}
              className={`border border-gray-800 ${severityBg[r.severity]} border-l-4 ${severityColors[r.severity]} rounded-lg p-4`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">{r.scenario}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      r.severity === 'LOW' ? 'bg-blue-900/30 text-blue-400' :
                      r.severity === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-400' :
                      r.severity === 'HIGH' ? 'bg-orange-900/30 text-orange-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {r.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">{r.description}</div>
                </div>
                <div className={`text-sm font-bold font-mono ${r.survives ? 'text-green-400' : 'text-red-400'}`}>
                  {r.survives ? '✅ SOBREVIVE' : '❌ QUEBRA'}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mt-3">
                <div>
                  <div className="text-[10px] text-gray-500">VPL</div>
                  <div className={`text-sm font-mono ${r.npv >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatBRL(r.npv)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">TIR</div>
                  <div className="text-sm font-mono text-gray-300">{formatPercent(r.irr)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Retorno</div>
                  <div className={`text-sm font-mono ${r.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(r.totalReturn)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Impacto</div>
                  <div className={`text-sm font-mono ${r.impactPercent <= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {r.impactPercent > 0 ? '+' : ''}{formatPercent(r.impactPercent)}
                  </div>
                </div>
              </div>

              {/* Impact bar */}
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    r.impactPercent >= 0 ? 'bg-green-500' :
                    r.impactPercent >= -30 ? 'bg-yellow-500' :
                    r.impactPercent >= -60 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(100 + r.impactPercent, 5)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
