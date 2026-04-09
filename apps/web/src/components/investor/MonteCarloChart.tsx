'use client'

import type { MonteCarloResult } from '@/lib/financial-engine'
import { formatBRL, formatPercent } from '@/lib/financial-engine'

interface Props {
  result: MonteCarloResult
  selicRate: number
}

export function MonteCarloChart({ result, selicRate }: Props) {
  const maxCount = Math.max(...result.distribution.map(d => d.count), 1)

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Prob. VPL > 0" value={formatPercent(result.probabilityPositiveNPV, 0)} color={result.probabilityPositiveNPV >= 70 ? 'green' : result.probabilityPositiveNPV >= 50 ? 'yellow' : 'red'} />
        <StatCard label={`Prob. > SELIC (${selicRate}%)`} value={formatPercent(result.probabilityAboveSelic, 0)} color={result.probabilityAboveSelic >= 60 ? 'green' : result.probabilityAboveSelic >= 40 ? 'yellow' : 'red'} />
        <StatCard label="VPL Mediano" value={formatBRL(result.median.npv)} color={result.median.npv >= 0 ? 'green' : 'red'} />
        <StatCard label="TIR Média" value={formatPercent(result.mean.irr)} color={result.mean.irr >= 10 ? 'green' : result.mean.irr >= 5 ? 'yellow' : 'red'} />
      </div>

      {/* Distribution Histogram */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800 flex justify-between">
          <span className="text-xs text-gray-400 tracking-wider">MONTE_CARLO_DISTRIBUTION</span>
          <span className="text-[10px] text-gray-600">{result.simulations} simulações</span>
        </div>
        <div className="p-4">
          <div className="flex items-end gap-px h-36">
            {result.distribution.map((d, i) => {
              const height = (d.count / maxCount) * 100
              const isPositive = d.bucket >= 0
              return (
                <div
                  key={i}
                  className="flex-1 group relative"
                >
                  <div
                    className={`rounded-t transition-all ${
                      isPositive
                        ? 'bg-gradient-to-t from-green-800 to-green-500'
                        : 'bg-gradient-to-t from-red-800 to-red-500'
                    } hover:opacity-80`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300 whitespace-nowrap z-10">
                    VPL: {formatBRL(d.bucket)} ({d.count} sim.)
                  </div>
                </div>
              )
            })}
          </div>
          {/* Zero line indicator */}
          <div className="flex items-center gap-1 mt-2">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-[9px] text-gray-500">VPL = 0</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>
        </div>
      </div>

      {/* Percentile Table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800">
          <span className="text-xs text-gray-400 tracking-wider">PERCENTIS_DE_RETORNO</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="px-3 py-2 text-left">Percentil</th>
                <th className="px-3 py-2 text-left">Interpretação</th>
                <th className="px-3 py-2 text-right">VPL</th>
                <th className="px-3 py-2 text-right">TIR</th>
                <th className="px-3 py-2 text-right">Retorno Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              <PercentileRow label="P5" desc="Pior cenário (5%)" data={result.percentile5} />
              <PercentileRow label="P25" desc="Cenário ruim (25%)" data={result.percentile25} />
              <PercentileRow label="P50" desc="Cenário mediano" data={result.median} highlight />
              <PercentileRow label="P75" desc="Cenário bom (75%)" data={result.percentile75} />
              <PercentileRow label="P95" desc="Melhor cenário (95%)" data={result.percentile95} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Gauge */}
      <div className="border border-gray-800 rounded-lg p-4">
        <div className="text-xs text-gray-400 tracking-wider mb-3">RISK_ASSESSMENT</div>
        <div className="flex items-center gap-4">
          {/* Visual gauge */}
          <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 rounded-full"
              style={{ width: `${result.probabilityPositiveNPV}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white"
              style={{ left: `${result.probabilityPositiveNPV}%` }}
            />
          </div>
          <span className="text-sm font-mono font-bold text-gray-200">
            {result.probabilityPositiveNPV >= 70 ? '🟢' : result.probabilityPositiveNPV >= 50 ? '🟡' : '🔴'}
            {' '}{formatPercent(result.probabilityPositiveNPV, 0)} seguro
          </span>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-600">
          <span>Alto Risco</span>
          <span>Médio</span>
          <span>Baixo Risco</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: 'border-green-900/50 bg-green-950/20 text-green-400',
    yellow: 'border-yellow-900/50 bg-yellow-950/20 text-yellow-400',
    red: 'border-red-900/50 bg-red-950/20 text-red-400',
  }
  return (
    <div className={`border rounded-lg p-3 ${colors[color]}`}>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold font-mono mt-1">{value}</div>
    </div>
  )
}

function PercentileRow({
  label, desc, data, highlight,
}: {
  label: string
  desc: string
  data: { npv: number; irr: number; totalReturn: number }
  highlight?: boolean
}) {
  return (
    <tr className={highlight ? 'bg-blue-950/10' : 'hover:bg-gray-900/30'}>
      <td className="px-3 py-1.5 font-mono text-gray-300 font-bold">{label}</td>
      <td className="px-3 py-1.5 text-gray-500">{desc}</td>
      <td className={`px-3 py-1.5 text-right font-mono ${data.npv >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {formatBRL(data.npv)}
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-gray-300">{formatPercent(data.irr)}</td>
      <td className={`px-3 py-1.5 text-right font-mono ${data.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {formatPercent(data.totalReturn)}
      </td>
    </tr>
  )
}
