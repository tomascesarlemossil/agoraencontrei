'use client'

import { useMemo } from 'react'
import type { SensitivityPoint } from '@/lib/financial-engine'
import { formatBRL } from '@/lib/financial-engine'

interface Props {
  data: SensitivityPoint[]
  baseNPV: number
}

export function SensitivityMatrix({ data, baseNPV }: Props) {
  const variables = useMemo(() => {
    const unique = Array.from(new Set(data.map(d => d.variable)))
    return unique
  }, [data])

  const variations = useMemo(() => {
    return Array.from(new Set(data.map(d => d.variation))).sort((a, b) => a - b)
  }, [data])

  // Calculate tornado chart data (impact at ±30%)
  const tornadoData = useMemo(() => {
    return variables.map(v => {
      const low = data.find(d => d.variable === v && d.variation === -30)
      const high = data.find(d => d.variable === v && d.variation === 30)
      const impact = Math.abs((high?.npv || 0) - (low?.npv || 0))
      return {
        variable: v,
        lowNPV: low?.npv || 0,
        highNPV: high?.npv || 0,
        impact,
      }
    }).sort((a, b) => b.impact - a.impact)
  }, [data, variables])

  const maxTornadoImpact = Math.max(...tornadoData.map(d => d.impact), 1)

  // Heatmap color
  function heatColor(npv: number): string {
    const diff = npv - baseNPV
    const ratio = diff / Math.max(Math.abs(baseNPV), 100000)
    if (ratio > 0.3) return 'bg-green-700/60'
    if (ratio > 0.1) return 'bg-green-800/40'
    if (ratio > 0) return 'bg-green-900/30'
    if (ratio > -0.1) return 'bg-red-900/20'
    if (ratio > -0.3) return 'bg-red-800/40'
    return 'bg-red-700/50'
  }

  return (
    <div className="space-y-4">
      {/* Tornado Chart */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800 flex justify-between">
          <span className="text-xs text-gray-400 tracking-wider">TORNADO_CHART</span>
          <span className="text-[10px] text-gray-600">Impacto no VPL por variável (±30%)</span>
        </div>
        <div className="p-4 space-y-2">
          {tornadoData.map(d => {
            const barWidth = (d.impact / maxTornadoImpact) * 100
            const centerX = 50 // percent
            const lowSide = d.lowNPV < d.highNPV ? 'left' : 'right'

            return (
              <div key={d.variable} className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400 w-32 text-right truncate">
                  {d.variable}
                </span>
                <div className="flex-1 h-6 relative">
                  {/* Center line */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-600" />

                  {/* Low side (red) */}
                  <div
                    className="absolute top-0.5 bottom-0.5 bg-red-600/70 rounded-l"
                    style={{
                      right: `${centerX}%`,
                      width: `${barWidth / 2}%`,
                    }}
                  />

                  {/* High side (green) */}
                  <div
                    className="absolute top-0.5 bottom-0.5 bg-green-600/70 rounded-r"
                    style={{
                      left: `${centerX}%`,
                      width: `${barWidth / 2}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-mono w-28 text-right">
                  Δ {formatBRL(d.impact)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-gray-800 flex justify-between text-[10px] text-gray-600">
          <span className="text-red-400">← Reduz VPL (-30%)</span>
          <span>Base</span>
          <span className="text-green-400">Aumenta VPL (+30%) →</span>
        </div>
      </div>

      {/* Heat Map */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-800 flex justify-between">
          <span className="text-xs text-gray-400 tracking-wider">SENSITIVITY_HEATMAP</span>
          <span className="text-[10px] text-gray-600">VPL por variação de cada parâmetro</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-3 py-2 text-left text-gray-500">Variável</th>
                {variations.map(v => (
                  <th key={v} className="px-2 py-2 text-center text-gray-500 font-mono">
                    {v > 0 ? '+' : ''}{v}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {variables.map(variable => (
                <tr key={variable} className="hover:bg-gray-900/20">
                  <td className="px-3 py-1.5 text-gray-300">{variable}</td>
                  {variations.map(variation => {
                    const point = data.find(d => d.variable === variable && d.variation === variation)
                    if (!point) return <td key={variation} className="px-2 py-1.5" />

                    const isBase = variation === 0
                    return (
                      <td
                        key={variation}
                        className={`px-2 py-1.5 text-center font-mono ${heatColor(point.npv)} ${
                          isBase ? 'ring-1 ring-inset ring-yellow-500/30' : ''
                        }`}
                      >
                        <div className={`${point.npv >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatBRL(point.npv)}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-800 flex justify-between text-[10px]">
          <span className="text-red-400">■ VPL negativo</span>
          <span className="text-yellow-500">■ Base (variação 0%)</span>
          <span className="text-green-400">■ VPL positivo</span>
        </div>
      </div>

      {/* Key Insights */}
      <div className="border border-gray-800 rounded-lg p-4">
        <div className="text-xs text-gray-400 tracking-wider mb-3">INSIGHTS</div>
        <div className="space-y-2 text-[11px] text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 mt-0.5">▸</span>
            <span>
              Variável mais sensível: <strong className="text-gray-200">{tornadoData[0]?.variable}</strong>
              {' '}(impacto de {formatBRL(tornadoData[0]?.impact || 0)} no VPL)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500 mt-0.5">▸</span>
            <span>
              Variável menos sensível: <strong className="text-gray-200">{tornadoData[tornadoData.length - 1]?.variable}</strong>
              {' '}(impacto de {formatBRL(tornadoData[tornadoData.length - 1]?.impact || 0)})
            </span>
          </div>
          {tornadoData[0]?.variable === 'Aluguel' && (
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">▸</span>
              <span>O investimento é mais sensível ao <strong className="text-gray-200">aluguel</strong> — garantir inquilino é prioridade</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
