'use client'

import { useState } from 'react'
import { Trophy, Star, AlertTriangle } from 'lucide-react'
import type { ComparisonMetrics, DCFParams } from '@/lib/financial-engine'
import { compareProperties, formatBRL, formatPercent, type MacroRates } from '@/lib/financial-engine'

interface PropertyInput {
  id: string
  name: string
  bidValue: number
  appraisalValue: number
  monthlyRent: number
  totalAcquisitionCosts: number
  state: string
  isOccupied: boolean
  needsReform: boolean
  reformCost: number
}

interface Props {
  rates: MacroRates
}

export function PropertyComparator({ rates }: Props) {
  const [properties, setProperties] = useState<PropertyInput[]>([
    { id: '1', name: 'Imóvel A', bidValue: 200000, appraisalValue: 350000, monthlyRent: 1800, totalAcquisitionCosts: 25000, state: 'SP', isOccupied: false, needsReform: false, reformCost: 0 },
    { id: '2', name: 'Imóvel B', bidValue: 300000, appraisalValue: 450000, monthlyRent: 2500, totalAcquisitionCosts: 35000, state: 'SP', isOccupied: true, needsReform: true, reformCost: 30000 },
  ])

  const [results, setResults] = useState<ComparisonMetrics[] | null>(null)

  function addProperty() {
    if (properties.length >= 4) return
    const id = String(properties.length + 1)
    setProperties([...properties, {
      id, name: `Imóvel ${String.fromCharCode(64 + properties.length + 1)}`,
      bidValue: 0, appraisalValue: 0, monthlyRent: 0, totalAcquisitionCosts: 0,
      state: 'SP', isOccupied: false, needsReform: false, reformCost: 0,
    }])
  }

  function removeProperty(id: string) {
    if (properties.length <= 2) return
    setProperties(properties.filter(p => p.id !== id))
  }

  function updateProperty(id: string, field: keyof PropertyInput, value: any) {
    setProperties(properties.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  function runComparison() {
    const propsForComparison = properties
      .filter(p => p.bidValue > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        params: {
          investment: {
            bidValue: p.bidValue,
            appraisalValue: p.appraisalValue,
            monthlyRent: p.monthlyRent,
            totalAcquisitionCosts: p.totalAcquisitionCosts,
            state: p.state,
            isOccupied: p.isOccupied,
            needsReform: p.needsReform,
            reformCost: p.reformCost,
          },
          rates,
          projectionYears: 10,
        } as DCFParams,
      }))

    const compared = compareProperties(propsForComparison)
    setResults(compared)
  }

  const winner = results ? results.reduce((best, r) => r.overallScore > best.overallScore ? r : best, results[0]) : null

  return (
    <div className="space-y-4">
      {/* Property Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {properties.map(p => (
          <div key={p.id} className="border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <input
                className="bg-transparent text-sm font-bold text-gray-200 border-b border-gray-700 focus:border-blue-500 outline-none pb-0.5 w-40"
                value={p.name}
                onChange={e => updateProperty(p.id, 'name', e.target.value)}
              />
              {properties.length > 2 && (
                <button
                  onClick={() => removeProperty(p.id)}
                  className="text-[10px] text-red-500 hover:text-red-400"
                >
                  Remover
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumInput label="Valor Lance" value={p.bidValue} onChange={v => updateProperty(p.id, 'bidValue', v)} />
              <NumInput label="Avaliação" value={p.appraisalValue} onChange={v => updateProperty(p.id, 'appraisalValue', v)} />
              <NumInput label="Aluguel/mês" value={p.monthlyRent} onChange={v => updateProperty(p.id, 'monthlyRent', v)} />
              <NumInput label="Custos Aquisição" value={p.totalAcquisitionCosts} onChange={v => updateProperty(p.id, 'totalAcquisitionCosts', v)} />
              <div className="col-span-2 flex items-center gap-4 mt-1">
                <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <input
                    type="checkbox"
                    checked={p.isOccupied}
                    onChange={e => updateProperty(p.id, 'isOccupied', e.target.checked)}
                    className="rounded border-gray-600"
                  />
                  Ocupado
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <input
                    type="checkbox"
                    checked={p.needsReform}
                    onChange={e => updateProperty(p.id, 'needsReform', e.target.checked)}
                    className="rounded border-gray-600"
                  />
                  Reforma
                </label>
                <select
                  value={p.state}
                  onChange={e => updateProperty(p.id, 'state', e.target.value)}
                  className="bg-gray-800 text-[11px] text-gray-300 rounded px-2 py-1 border border-gray-700"
                >
                  {['SP','RJ','MG','PR','RS','SC','BA','PE','CE','GO','DF','PA','AM','MT','MS','ES'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {properties.length < 4 && (
          <button
            onClick={addProperty}
            className="text-xs text-blue-400 border border-blue-900/50 rounded px-3 py-1.5 hover:bg-blue-950/20"
          >
            + Adicionar imóvel
          </button>
        )}
        <button
          onClick={runComparison}
          className="text-xs text-gray-200 bg-blue-600 rounded px-4 py-1.5 hover:bg-blue-500 font-medium"
        >
          Comparar
        </button>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Winner Banner */}
          {winner && (
            <div className="border border-yellow-800/50 bg-yellow-950/10 rounded-lg p-4 flex items-center gap-3">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <div>
                <div className="text-sm font-bold text-yellow-400">{winner.name} — Melhor Investimento</div>
                <div className="text-[11px] text-gray-400">
                  Score: {winner.overallScore}/100 | IRR: {formatPercent(winner.irr)} | NPV: {formatBRL(winner.npv)}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-800">
              <span className="text-xs text-gray-400 tracking-wider">COMPARISON_MATRIX</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500">
                    <th className="px-3 py-2 text-left">Métrica</th>
                    {results.map(r => (
                      <th key={r.id} className="px-3 py-2 text-center">
                        <span className="text-gray-300">{r.name}</span>
                        {r.id === winner?.id && <Star className="h-3 w-3 text-yellow-500 inline ml-1" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  <MetricRow label="Score Geral" values={results.map(r => ({ value: `${r.overallScore}/100`, best: r.id === winner?.id }))} />
                  <MetricRow label="VPL (NPV)" values={results.map(r => ({ value: formatBRL(r.npv), positive: r.npv >= 0 }))} />
                  <MetricRow label="TIR (IRR)" values={results.map(r => ({ value: formatPercent(r.irr) }))} highest={results} metric="irr" />
                  <MetricRow label="Cap Rate" values={results.map(r => ({ value: formatPercent(r.capRate) }))} highest={results} metric="capRate" />
                  <MetricRow label="Cash-on-Cash" values={results.map(r => ({ value: formatPercent(r.cashOnCash) }))} highest={results} metric="cashOnCash" />
                  <MetricRow label="Payback" values={results.map(r => ({ value: `${r.paybackYears.toFixed(1)} anos` }))} lowest={results} metric="paybackYears" />
                  <MetricRow label="Yield Bruto" values={results.map(r => ({ value: formatPercent(r.grossYield) }))} highest={results} metric="grossYield" />
                  <MetricRow label="Yield Líquido" values={results.map(r => ({ value: formatPercent(r.netYield) }))} highest={results} metric="netYield" />
                  <MetricRow label="Retorno Total" values={results.map(r => ({ value: formatPercent(r.totalReturn), positive: r.totalReturn >= 0 }))} />
                  <MetricRow label="Risco" values={results.map(r => ({ value: `${r.riskScore}/10`, isRisk: true }))} />
                  <MetricRow label="Liquidez" values={results.map(r => ({ value: `${r.liquidityScore}/10` }))} />
                </tbody>
              </table>
            </div>
          </div>

          {/* Radar-like Score Breakdown */}
          <div className="border border-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-400 tracking-wider mb-3">SCORE_BREAKDOWN</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map(r => (
                <div key={r.id} className="space-y-2">
                  <div className="text-sm text-gray-200 font-medium">{r.name}</div>
                  <ScoreBar label="Retorno" value={Math.min(r.irr / 20, 1) * 100} />
                  <ScoreBar label="VPL" value={r.npv > 0 ? 100 : r.npv > -50000 ? 50 : 10} />
                  <ScoreBar label="Segurança" value={((10 - r.riskScore) / 10) * 100} />
                  <ScoreBar label="Liquidez" value={(r.liquidityScore / 10) * 100} />
                  <ScoreBar label="Payback" value={r.paybackYears < 8 ? 100 : r.paybackYears < 15 ? 50 : 10} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500">{label}</label>
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

function MetricRow({ label, values, highest, lowest, metric }: {
  label: string
  values: { value: string; best?: boolean; positive?: boolean; isRisk?: boolean }[]
  highest?: ComparisonMetrics[]
  lowest?: ComparisonMetrics[]
  metric?: keyof ComparisonMetrics
}) {
  let bestIdx = -1
  if (highest && metric) {
    const max = Math.max(...highest.map(r => r[metric] as number))
    bestIdx = highest.findIndex(r => r[metric] === max)
  }
  if (lowest && metric) {
    const min = Math.min(...lowest.map(r => r[metric] as number))
    bestIdx = lowest.findIndex(r => r[metric] === min)
  }

  return (
    <tr className="hover:bg-gray-900/20">
      <td className="px-3 py-1.5 text-gray-400">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`px-3 py-1.5 text-center font-mono ${
            v.best ? 'text-yellow-400 font-bold' :
            i === bestIdx ? 'text-green-400 font-bold' :
            v.positive === false ? 'text-red-400' :
            v.positive === true ? 'text-green-400' :
            v.isRisk ? 'text-orange-400' :
            'text-gray-300'
          }`}
        >
          {v.value}
        </td>
      ))}
    </tr>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-16">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(value, 3)}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 font-mono w-8 text-right">{Math.round(value)}</span>
    </div>
  )
}
