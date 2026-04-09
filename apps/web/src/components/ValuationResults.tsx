'use client'

import { CheckCircle, AlertTriangle, TrendingUp, Building2, DollarSign, ShieldCheck, BarChart3, Clock } from 'lucide-react'
import type { ValuationResult } from '@/lib/valuation-engine'
import { formatBRL } from '@/lib/valuation-engine'

interface Props {
  result: ValuationResult
  propertyArea: number
}

export function ValuationResults({ result, propertyArea }: Props) {
  const confidenceColor = result.confidence >= 80 ? 'green' : result.confidence >= 60 ? 'yellow' : 'red'
  const confidenceLabel = result.confidence >= 80 ? 'MUITO ALTA' : result.confidence >= 60 ? 'ALTA' : result.confidence >= 40 ? 'MODERADA' : 'BAIXA'

  return (
    <div className="space-y-6">
      {/* ── 3 Core Values ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ValueCard
          type="market"
          label="Valor de Mercado"
          sublabel="Máximo teórico"
          value={result.marketValue}
          perM2={result.marketPerM2}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <ValueCard
          type="bank"
          label="Valor Bancário"
          sublabel="Financiamento / empréstimo"
          value={result.bankValue}
          perM2={result.bankPerM2}
          discount={result.marketValue > 0 ? Math.round(((result.marketValue - result.bankValue) / result.marketValue) * 100) : 0}
          icon={<Building2 className="w-5 h-5" />}
        />
        <ValueCard
          type="realistic"
          label="Venda Rápida"
          sublabel="Vender em 30 dias"
          value={result.realisticValue}
          perM2={result.realisticPerM2}
          discount={result.marketValue > 0 ? Math.round(((result.marketValue - result.realisticValue) / result.marketValue) * 100) : 0}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Negotiation Range */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>Faixa de Negociação</span>
        </div>
        <div className="relative h-8 bg-gradient-to-r from-red-100 via-yellow-100 to-green-100 rounded-full overflow-hidden">
          {/* Min marker */}
          <div className="absolute left-[5%] top-0 bottom-0 flex items-center">
            <div className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              {formatBRL(result.negotiationRange.min)}
            </div>
          </div>
          {/* Max marker */}
          <div className="absolute right-[5%] top-0 bottom-0 flex items-center">
            <div className="bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
              {formatBRL(result.negotiationRange.max)}
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>Venda urgente</span>
          <span>Spread: {result.negotiationRange.spread}%</span>
          <span>Preço cheio</span>
        </div>
      </div>

      {/* Anomaly Detection */}
      {result.anomaly && (result.anomaly.isOverpriced || result.anomaly.isUnderpriced) && (
        <div className={`rounded-xl p-4 border-l-4 ${
          result.anomaly.isOverpriced
            ? 'bg-red-50 border-red-500'
            : 'bg-green-50 border-green-500'
        }`}>
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-4 h-4 mt-0.5 ${result.anomaly.isOverpriced ? 'text-red-500' : 'text-green-600'}`} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#1B2B5B' }}>
                {result.anomaly.isOverpriced ? 'Imóvel Super-Avaliado' : 'Oportunidade Detectada!'}
              </p>
              <p className="text-xs text-gray-600 mt-1">{result.anomaly.recommendation}</p>
              <p className="text-xs font-mono mt-1">
                Diferença: <span className={result.anomaly.priceDifference > 0 ? 'text-red-600' : 'text-green-600'}>
                  {result.anomaly.priceDifference > 0 ? '+' : ''}{formatBRL(result.anomaly.priceDifference)} ({result.anomaly.percentDifference > 0 ? '+' : ''}{result.anomaly.percentDifference.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Methods Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>Metodologias de Avaliação</span>
        </div>
        <div className="space-y-3">
          {result.methods.map(m => {
            const maxValue = Math.max(...result.methods.map(x => x.value))
            const barWidth = maxValue > 0 ? (m.value / maxValue) * 100 : 0
            return (
              <div key={m.name}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-medium" style={{ color: '#1B2B5B' }}>{m.name} ({(m.weight * 100).toFixed(0)}%)</span>
                  <span className="font-mono font-bold">{formatBRL(m.value)}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: m.name === 'Comparativa' ? '#1B2B5B' : m.name === 'Renda' ? '#C9A84C' : '#6B7280',
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.details}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Comparables */}
      {result.comparables.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>Comparáveis Encontrados</span>
            <span className="text-[10px] text-gray-400">{result.comparablesCount} imóveis similares</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b text-gray-400">
                  <th className="pb-2 text-left">#</th>
                  <th className="pb-2 text-left">Imóvel</th>
                  <th className="pb-2 text-right">Preço</th>
                  <th className="pb-2 text-right">R$/m²</th>
                  <th className="pb-2 text-right">Similaridade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.comparables.map((c, i) => (
                  <tr key={c.id}>
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2">
                      <div className="font-medium text-gray-700">{c.title || `${c.city}, ${c.neighborhood}`}</div>
                      <div className="text-[10px] text-gray-400">{c.area}m² | {c.bedrooms}d | {c.status === 'SOLD' ? 'Vendido' : c.status === 'RENTED' ? 'Alugado' : 'Ativo'}</div>
                    </td>
                    <td className="py-2 text-right font-mono">{formatBRL(c.price)}</td>
                    <td className="py-2 text-right font-mono text-gray-500">R$ {c.pricePerM2.toLocaleString('pt-BR')}</td>
                    <td className="py-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        c.similarity >= 90 ? 'bg-green-100 text-green-700' :
                        c.similarity >= 70 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {c.similarity}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustments */}
      {result.adjustments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>Ajustes Aplicados</span>
          <div className="mt-3 space-y-2">
            {result.adjustments.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-medium text-gray-700">{a.factor}</span>
                  <span className="text-gray-400 ml-2">{a.description}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className={a.percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {a.percent > 0 ? '+' : ''}{a.percent}%
                  </span>
                  <span className={a.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {a.amount > 0 ? '+' : ''}{formatBRL(a.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Strategy */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>Estratégia de Preço</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b text-gray-400">
                <th className="pb-2 text-left">Cenário</th>
                <th className="pb-2 text-right">Preço Sugerido</th>
                <th className="pb-2 text-right">Desconto</th>
                <th className="pb-2 text-right">Prazo Esperado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.pricingStrategy.map(s => (
                <tr key={s.scenario}>
                  <td className="py-2 font-medium text-gray-700">{s.scenario}</td>
                  <td className="py-2 text-right font-mono font-bold" style={{ color: '#1B2B5B' }}>{formatBRL(s.price)}</td>
                  <td className="py-2 text-right text-red-500 font-mono">{s.discount > 0 ? `-${s.discount}%` : '—'}</td>
                  <td className="py-2 text-right text-gray-500">{s.timeframeDays} dias</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confidence Score */}
      <div className={`rounded-xl p-4 border ${
        confidenceColor === 'green' ? 'border-green-200 bg-green-50' :
        confidenceColor === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
        'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${
              confidenceColor === 'green' ? 'text-green-600' :
              confidenceColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
            }`} />
            <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>
              Confiabilidade: {result.confidence}/100 — {confidenceLabel}
            </span>
          </div>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${
              confidenceColor === 'green' ? 'bg-green-500' :
              confidenceColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${result.confidence}%` }}
          />
        </div>
        <div className="space-y-1.5">
          {result.confidenceFactors.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              {f.impact === 'positive'
                ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                : <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              }
              <span className="text-gray-600">
                <strong>{f.factor}</strong> — {f.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Value Card ─────────────────────────────────────────────────────────────

function ValueCard({ type, label, sublabel, value, perM2, discount, icon }: {
  type: 'market' | 'bank' | 'realistic'
  label: string
  sublabel: string
  value: number
  perM2: number
  discount?: number
  icon: React.ReactNode
}) {
  const colorMap = {
    market: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
    bank: { bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
    realistic: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  }
  const c = colorMap[type]

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
        <span className={`text-xs font-semibold ${c.text}`}>{label}</span>
        {discount !== undefined && discount > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.badge}`}>-{discount}%</span>
        )}
      </div>
      <div className={`text-2xl font-bold ${c.text}`} style={{ fontFamily: 'Georgia, serif' }}>
        {formatBRL(value)}
      </div>
      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
        <span>R$ {perM2.toLocaleString('pt-BR')}/m²</span>
        <span className="text-gray-300">|</span>
        <span>{sublabel}</span>
      </div>
    </div>
  )
}
