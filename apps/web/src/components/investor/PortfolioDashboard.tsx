'use client'

import { useState } from 'react'
import { PieChart, BarChart3, ShieldCheck, TrendingUp, Plus, Trash2 } from 'lucide-react'
import type { PortfolioAsset, PortfolioAnalysis } from '@/lib/financial-engine'
import { analyzePortfolio, formatBRL, formatPercent } from '@/lib/financial-engine'

export function PortfolioDashboard() {
  const [assets, setAssets] = useState<PortfolioAsset[]>([
    { id: '1', name: 'Apto Centro Franca', city: 'Franca', state: 'SP', investedAmount: 225000, currentValue: 320000, monthlyRent: 1800, capRate: 7.2, irr: 12.5, weight: 0 },
    { id: '2', name: 'Casa Jd Paulista', city: 'Franca', state: 'SP', investedAmount: 180000, currentValue: 240000, monthlyRent: 1400, capRate: 6.8, irr: 10.2, weight: 0 },
  ])

  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null)

  function addAsset() {
    const id = String(Date.now())
    setAssets([...assets, {
      id, name: `Imóvel ${assets.length + 1}`, city: '', state: 'SP',
      investedAmount: 0, currentValue: 0, monthlyRent: 0,
      capRate: 0, irr: 0, weight: 0,
    }])
  }

  function removeAsset(id: string) {
    setAssets(assets.filter(a => a.id !== id))
  }

  function updateAsset(id: string, field: keyof PortfolioAsset, value: any) {
    setAssets(assets.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  function runAnalysis() {
    const result = analyzePortfolio(assets.filter(a => a.investedAmount > 0))
    setAnalysis(result)
  }

  return (
    <div className="space-y-4">
      {/* Assets Input */}
      <div className="space-y-2">
        {assets.map(a => (
          <div key={a.id} className="border border-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                className="bg-transparent text-sm font-medium text-gray-200 border-b border-gray-700 focus:border-blue-500 outline-none pb-0.5 flex-1"
                value={a.name}
                onChange={e => updateAsset(a.id, 'name', e.target.value)}
                placeholder="Nome do imóvel"
              />
              <button onClick={() => removeAsset(a.id)} className="text-red-500 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <PortfolioInput label="Investido" value={a.investedAmount} onChange={v => updateAsset(a.id, 'investedAmount', v)} />
              <PortfolioInput label="Valor Atual" value={a.currentValue} onChange={v => updateAsset(a.id, 'currentValue', v)} />
              <PortfolioInput label="Aluguel/mês" value={a.monthlyRent} onChange={v => updateAsset(a.id, 'monthlyRent', v)} />
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[9px] text-gray-500">Cidade</label>
                  <input
                    className="w-full bg-gray-800/50 border border-gray-700 rounded px-1.5 py-1 text-[11px] text-gray-200 outline-none"
                    value={a.city}
                    onChange={e => updateAsset(a.id, 'city', e.target.value)}
                    placeholder="Franca"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-500">UF</label>
                  <select
                    value={a.state}
                    onChange={e => updateAsset(a.id, 'state', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded px-1 py-1 text-[11px] text-gray-200"
                  >
                    {['SP','RJ','MG','PR','RS','SC','BA','GO','DF','CE','PE'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={addAsset} className="flex items-center gap-1.5 text-xs text-blue-400 border border-blue-900/50 rounded px-3 py-1.5 hover:bg-blue-950/20">
          <Plus className="h-3 w-3" /> Adicionar imóvel
        </button>
        <button onClick={runAnalysis} className="text-xs text-gray-200 bg-blue-600 rounded px-4 py-1.5 hover:bg-blue-500 font-medium">
          Analisar Portfólio
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-green-900/50 bg-green-950/15 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-green-500">
                <TrendingUp className="h-3 w-3" /> RETORNO TOTAL
              </div>
              <div className={`text-2xl font-bold font-mono mt-1 ${analysis.portfolioReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(analysis.portfolioReturn)}
              </div>
            </div>
            <div className="border border-blue-900/50 bg-blue-950/15 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-blue-400">
                <BarChart3 className="h-3 w-3" /> RENDA MENSAL
              </div>
              <div className="text-2xl font-bold font-mono mt-1 text-blue-300">{formatBRL(analysis.totalMonthlyRent)}</div>
            </div>
            <div className="border border-cyan-900/50 bg-cyan-950/15 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400">
                <PieChart className="h-3 w-3" /> CAP RATE POND.
              </div>
              <div className="text-2xl font-bold font-mono mt-1 text-cyan-300">{formatPercent(analysis.weightedCapRate)}</div>
            </div>
            <div className={`border rounded-lg p-3 ${
              analysis.riskLevel === 'LOW' ? 'border-green-900/50 bg-green-950/15' :
              analysis.riskLevel === 'MEDIUM' ? 'border-yellow-900/50 bg-yellow-950/15' :
              'border-red-900/50 bg-red-950/15'
            }`}>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <ShieldCheck className="h-3 w-3" /> RISCO
              </div>
              <div className={`text-2xl font-bold mt-1 ${
                analysis.riskLevel === 'LOW' ? 'text-green-400' :
                analysis.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {analysis.riskLevel}
              </div>
              <div className="text-[10px] text-gray-500">Diversificação: {analysis.diversificationScore}/100</div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-gray-800 rounded-lg p-3 text-[11px]">
              <div className="text-xs text-gray-400 tracking-wider mb-2">PATRIMÔNIO</div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total investido</span>
                  <span className="text-gray-200 font-mono">{formatBRL(analysis.totalInvested)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor atual</span>
                  <span className="text-green-400 font-mono">{formatBRL(analysis.totalCurrentValue)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-1.5">
                  <span className="text-gray-400 font-medium">Ganho patrimonial</span>
                  <span className={`font-mono font-bold ${analysis.totalCurrentValue - analysis.totalInvested >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatBRL(analysis.totalCurrentValue - analysis.totalInvested)}
                  </span>
                </div>
              </div>
            </div>

            {/* Concentration */}
            <div className="border border-gray-800 rounded-lg p-3 text-[11px]">
              <div className="text-xs text-gray-400 tracking-wider mb-2">CONCENTRAÇÃO</div>
              <div className="space-y-1.5">
                {Object.entries(analysis.cityConcentration).map(([city, pct]) => (
                  <div key={city}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-gray-500">{city}</span>
                      <span className="text-gray-300 font-mono">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct > 50 ? 'bg-red-500' : pct > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Asset Performance Table */}
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-800">
              <span className="text-xs text-gray-400 tracking-wider">PERFORMANCE_POR_ATIVO</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="px-3 py-2 text-left">Ativo</th>
                    <th className="px-3 py-2 text-right">Investido</th>
                    <th className="px-3 py-2 text-right">Valor Atual</th>
                    <th className="px-3 py-2 text-right">Retorno</th>
                    <th className="px-3 py-2 text-right">Aluguel</th>
                    <th className="px-3 py-2 text-right">Peso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {analysis.assets.map(a => {
                    const ret = a.investedAmount > 0
                      ? ((a.currentValue - a.investedAmount) / a.investedAmount) * 100
                      : 0
                    return (
                      <tr key={a.id} className="hover:bg-gray-900/20">
                        <td className="px-3 py-1.5">
                          <div className="text-gray-200">{a.name}</div>
                          <div className="text-[10px] text-gray-600">{a.city}/{a.state}</div>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-300">{formatBRL(a.investedAmount)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-300">{formatBRL(a.currentValue)}</td>
                        <td className={`px-3 py-1.5 text-right font-mono font-bold ${ret >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(ret)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-blue-400">{formatBRL(a.monthlyRent)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-400">{a.weight.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PortfolioInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[9px] text-gray-500">{label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-gray-800/50 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 font-mono focus:border-blue-500 outline-none"
        placeholder="0"
      />
    </div>
  )
}
