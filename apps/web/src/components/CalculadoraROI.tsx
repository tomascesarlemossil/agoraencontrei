'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, AlertTriangle, MessageCircle, BarChart3, ShieldCheck, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agoraencontrei.com.br'

interface Props {
  valorAvaliado: number
  valorLance: number
  bairro?: string
  cidade?: string
  estado?: string
  ocupado?: boolean
  reforma?: boolean
  estimativaReforma?: number
  areaTotal?: number
  aluguelEstimado?: number
}

interface DCFData {
  npv: number
  irr: number
  capRate: number
  cashOnCash: number
  grossYield: number
  netYield: number
  paybackYears: number
  breakEvenMonth: number
}

interface ApiResult {
  bidValue: number
  appraisalValue: number | null
  marketValueEstimate: number
  costs: {
    itbi: number; itbiRate: string; registry: number; notary: number
    lawyer: number; eviction: number; reform: number; totalCosts: number; stateNotes: string
  }
  totalInvestment: number
  discount: number
  potentialProfit: number
  roiPercent: number
  monthlyRentEstimate: number
  paybackMonths: number | null
  opportunityScore: number
  riskLevel: string
  maxRecommendedBid: number
  dcf: DCFData
  scenarios: {
    optimistic: { npv: number; irr: number; totalReturn: number }
    base: { npv: number; irr: number; totalReturn: number }
    pessimistic: { npv: number; irr: number; totalReturn: number }
  }
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function CalculadoraROI({
  valorAvaliado, valorLance, bairro, cidade = 'Franca', estado = 'SP',
  ocupado = false, reforma = false, estimativaReforma = 0, areaTotal, aluguelEstimado,
}: Props) {
  const [showDetalhes, setShowDetalhes] = useState(false)
  const [showDCF, setShowDCF] = useState(false)
  const [apiData, setApiData] = useState<ApiResult | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch from API for state-specific costs and DCF
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auctions/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bidValue: valorLance,
            appraisalValue: valorAvaliado > 0 ? valorAvaliado : undefined,
            state: estado,
            isOccupied: ocupado,
            needsReform: reforma,
            reformEstimate: estimativaReforma,
            totalArea: areaTotal,
            monthlyRentEstimate: aluguelEstimado,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setApiData(data)
        }
      } catch {
        // Fallback to local calculation
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [valorLance, valorAvaliado, estado, ocupado, reforma, estimativaReforma, areaTotal, aluguelEstimado])

  // Local fallback values
  const SELIC_ANUAL = 14.25
  const desconto = valorAvaliado > 0 ? ((valorAvaliado - valorLance) / valorAvaliado) * 100 : 0
  const custoEstimado = valorLance * 0.18 // ~18% taxas padrão
  const custoTotal = apiData?.totalInvestment || (valorLance + custoEstimado)
  const lucro = apiData?.potentialProfit || ((valorAvaliado * 0.95) - custoTotal)
  const roi = apiData?.roiPercent || (custoTotal > 0 ? (lucro / custoTotal) * 100 : 0)
  const score = apiData?.opportunityScore || 50

  const roiColor = roi >= 30 ? 'text-green-700' : roi >= 15 ? 'text-yellow-600' : 'text-red-600'
  const roiBg = roi >= 30 ? 'bg-green-700' : roi >= 15 ? 'bg-yellow-600' : 'bg-red-600'
  const riskLabel = roi >= 30 ? 'Excelente' : roi >= 15 ? 'Moderado' : 'Baixo'
  const riskColor = apiData?.riskLevel === 'LOW' ? 'text-green-700' : apiData?.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'

  const whatsappMsg = encodeURIComponent(
    `Olá! Vi no AgoraEncontrei um imóvel${bairro ? ` no ${bairro}` : ''} em ${cidade}/${estado} com ROI estimado de ${roi.toFixed(1)}% e desconto de ${desconto.toFixed(0)}%. Quero saber mais sobre como arrematar com segurança.`
  )

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200 my-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-green-700" />
          <h3 className="text-green-800 font-bold text-lg">Análise de Viabilidade</h3>
        </div>
        {loading && <Loader2 className="w-4 h-4 text-green-600 animate-spin" />}
        {apiData && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
            CUSTAS {estado}
          </span>
        )}
      </div>

      {/* Score Badge */}
      {apiData && (
        <div className="flex items-center gap-3 mb-4 bg-white rounded-xl p-3 border border-green-200">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.91" fill="none" stroke={score >= 70 ? '#15803d' : score >= 50 ? '#ca8a04' : '#dc2626'} strokeWidth="3"
                strokeDasharray={`${score}, 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: '#1B2B5B' }}>{score}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#1B2B5B' }}>Score de Oportunidade</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Risco: <strong className={riskColor}>{apiData.riskLevel === 'LOW' ? 'Baixo' : apiData.riskLevel === 'HIGH' ? 'Alto' : 'Médio'}</strong></span>
              <span>•</span>
              <span>Lance máx recomendado: <strong>{formatBRL(apiData.maxRecommendedBid)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Comparativo SELIC */}
      {roi > SELIC_ANUAL && (
        <div className="bg-white rounded-xl p-3 mb-4 border border-green-200 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            <span className="font-bold text-green-700">{roi.toFixed(0)}% ROI</span> deste leilão vs.
            <span className="font-bold text-gray-500"> {SELIC_ANUAL}% SELIC</span> (renda fixa)
          </div>
          <div className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
            +{(roi - SELIC_ANUAL).toFixed(0)}% acima
          </div>
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center border">
          <p className="text-xs text-gray-500 mb-1">Desconto</p>
          <p className="text-xl font-bold text-red-600">-{desconto.toFixed(0)}%</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border">
          <p className="text-xs text-gray-500 mb-1">Economia</p>
          <p className="text-lg font-bold text-green-700">
            {formatBRL(valorAvaliado - valorLance)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border">
          <p className="text-xs text-gray-500 mb-1">ROI Estimado</p>
          <p className={`text-xl font-bold ${roiColor}`}>{roi.toFixed(1)}%</p>
        </div>
      </div>

      {/* DCF Metrics (when API data available) */}
      {apiData?.dcf && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'VPL', value: formatBRL(apiData.dcf.npv), positive: apiData.dcf.npv > 0 },
            { label: 'TIR', value: `${apiData.dcf.irr.toFixed(1)}%`, positive: apiData.dcf.irr > SELIC_ANUAL },
            { label: 'Cap Rate', value: `${apiData.dcf.capRate.toFixed(1)}%`, positive: apiData.dcf.capRate > 6 },
            { label: 'Payback', value: `${apiData.dcf.paybackYears.toFixed(1)}a`, positive: apiData.dcf.paybackYears < 8 },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-lg p-2 text-center border">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{m.label}</p>
              <p className={`text-sm font-bold ${m.positive ? 'text-green-700' : 'text-red-600'}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Barra de ROI */}
      <div className={`${roiBg} text-white text-center py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-3`}>
        <TrendingUp className="w-4 h-4" />
        ROI ESTIMADO: {roi.toFixed(1)}% — Oportunidade {riskLabel}
      </div>

      {/* Detalhes expandíveis — Custos */}
      <button
        onClick={() => setShowDetalhes(!showDetalhes)}
        className="flex items-center gap-1 text-xs text-green-700 underline mb-3"
      >
        {showDetalhes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showDetalhes ? 'Ocultar custos' : `Ver custos detalhados${apiData ? ` (${estado})` : ''}`}
      </button>

      {showDetalhes && apiData && (
        <div className="bg-white rounded-xl p-4 border text-sm space-y-2 mb-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Valor de avaliação</span>
            <span className="font-semibold">{formatBRL(valorAvaliado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lance mínimo</span>
            <span className="font-semibold text-green-700">{formatBRL(valorLance)}</span>
          </div>
          <hr />
          <div className="flex justify-between">
            <span className="text-gray-600">ITBI ({apiData.costs.itbiRate})</span>
            <span className="text-red-600">+ {formatBRL(apiData.costs.itbi)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Registro</span>
            <span className="text-red-600">+ {formatBRL(apiData.costs.registry)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cartório / Escritura</span>
            <span className="text-red-600">+ {formatBRL(apiData.costs.notary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Advogado</span>
            <span className="text-red-600">+ {formatBRL(apiData.costs.lawyer)}</span>
          </div>
          {apiData.costs.eviction > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Desocupação (estimada)</span>
              <span className="text-red-600">+ {formatBRL(apiData.costs.eviction)}</span>
            </div>
          )}
          {apiData.costs.reform > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Reforma</span>
              <span className="text-red-600">+ {formatBRL(apiData.costs.reform)}</span>
            </div>
          )}
          <hr />
          <div className="flex justify-between font-bold">
            <span>Custo total de aquisição</span>
            <span>{formatBRL(apiData.totalInvestment)}</span>
          </div>
          <div className="flex justify-between font-bold text-green-700">
            <span>Lucro bruto estimado</span>
            <span>{formatBRL(apiData.potentialProfit)}</span>
          </div>
          {apiData.costs.stateNotes && (
            <p className="text-[10px] text-gray-400 mt-1">{apiData.costs.stateNotes}</p>
          )}
        </div>
      )}

      {/* Fallback local details when no API */}
      {showDetalhes && !apiData && (
        <div className="bg-white rounded-xl p-4 border text-sm space-y-2 mb-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Valor de avaliação</span>
            <span className="font-semibold">{formatBRL(valorAvaliado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lance mínimo</span>
            <span className="font-semibold text-green-700">{formatBRL(valorLance)}</span>
          </div>
          <hr />
          <div className="flex justify-between">
            <span className="text-gray-600">Comissão leiloeiro (5%)</span>
            <span className="text-red-600">+ {formatBRL(valorLance * 0.05)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ITBI (~2%)</span>
            <span className="text-red-600">+ {formatBRL(valorLance * 0.02)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Registro e escritura (~1%)</span>
            <span className="text-red-600">+ {formatBRL(valorLance * 0.01)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Provisão reformas (~10%)</span>
            <span className="text-red-600">+ {formatBRL(valorLance * 0.10)}</span>
          </div>
          <hr />
          <div className="flex justify-between font-bold">
            <span>Custo total estimado</span>
            <span>{formatBRL(custoTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-green-700">
            <span>Lucro bruto estimado</span>
            <span>{formatBRL(lucro)}</span>
          </div>
        </div>
      )}

      {/* DCF Details expandível */}
      {apiData?.dcf && (
        <>
          <button
            onClick={() => setShowDCF(!showDCF)}
            className="flex items-center gap-1 text-xs text-green-700 underline mb-3"
          >
            {showDCF ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showDCF ? 'Ocultar projeção' : 'Ver projeção DCF (10 anos)'}
          </button>

          {showDCF && (
            <div className="bg-white rounded-xl p-4 border text-sm space-y-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-green-700" />
                <span className="font-bold text-sm" style={{ color: '#1B2B5B' }}>Cenários de Retorno (10 anos)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { label: 'Otimista', data: apiData.scenarios.optimistic, color: 'green' },
                  { label: 'Base', data: apiData.scenarios.base, color: 'blue' },
                  { label: 'Pessimista', data: apiData.scenarios.pessimistic, color: 'red' },
                ] as const).map(s => (
                  <div key={s.label} className={`rounded-lg p-2 border ${
                    s.color === 'green' ? 'bg-green-50 border-green-200' :
                    s.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{s.label}</p>
                    <p className={`text-sm font-bold ${
                      s.color === 'green' ? 'text-green-700' :
                      s.color === 'blue' ? 'text-blue-700' :
                      'text-red-600'
                    }`}>{s.data.irr.toFixed(1)}% TIR</p>
                    <p className="text-[10px] text-gray-500">VPL: {formatBRL(s.data.npv)}</p>
                    <p className="text-[10px] text-gray-500">Retorno: {s.data.totalReturn.toFixed(0)}%</p>
                  </div>
                ))}
              </div>

              <div className="mt-2">
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Projeção baseada em SELIC 14.25%, IPCA 4.5%, IGP-M 5.0%. Cenário otimista: IPCA+2%, vacância -3%. Pessimista: IPCA-2%, vacância +5%.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* CTA WhatsApp */}
      <a
        href={`https://wa.me/5516981010004?text=${whatsappMsg}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white bg-[#25D366] hover:bg-[#1da851] transition-all"
      >
        <MessageCircle className="w-4 h-4" />
        Quero assessoria para arrematar com segurança
      </a>

      <p className="text-[10px] text-gray-400 mt-2 text-center">
        {apiData
          ? `*Custas calculadas com taxas reais do estado ${estado}. Valores podem variar conforme município e cartório.`
          : '*Cálculo baseado em taxas estimadas. Valores reais podem variar conforme estado e município.'
        }
      </p>
    </div>
  )
}
