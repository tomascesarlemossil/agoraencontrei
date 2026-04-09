'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Activity, DollarSign, ShieldCheck, TrendingUp, MapPin,
  BarChart3, Calculator, Target, Zap, PieChart, Layers, LineChart,
} from 'lucide-react'
import { DCFProjection } from '@/components/investor/DCFProjection'
import { ScenarioAnalysis } from '@/components/investor/ScenarioAnalysis'
import { MonteCarloChart } from '@/components/investor/MonteCarloChart'
import { StressTestPanel } from '@/components/investor/StressTestPanel'
import { SensitivityMatrix } from '@/components/investor/SensitivityMatrix'
import { PropertyComparator } from '@/components/investor/PropertyComparator'
import { PortfolioDashboard } from '@/components/investor/PortfolioDashboard'
import {
  runDCF, runScenarios, runMonteCarlo, runStressTests, runSensitivityAnalysis,
  formatBRL, formatPercent,
  type InvestmentParams, type DCFParams, type DCFResult, type ScenarioResult,
  type MonteCarloResult, type StressTestResult, type SensitivityPoint, type MacroRates,
} from '@/lib/financial-engine'
import { fetchMacroRates, getCachedRates, formatRate } from '@/lib/bcb-rates'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agoraencontrei.com.br'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Opportunity {
  city: string
  state: string
  price: number
  yieldMensal: number
  spreadVsMarket: number
  estimatedRent: number
  marketPrice: number
  classification: string
  address?: string
  type?: string
}

interface ApiResponse {
  total: number
  showing: number
  updatedAt: string
  items: Opportunity[]
}

type Tab = 'market' | 'calculator' | 'scenarios' | 'montecarlo' | 'stress' | 'sensitivity' | 'comparator' | 'portfolio'

// ─── Helpers ────────────────────────────────────────────────────────────────

function riskLevel(classification: string): { label: string; color: string } {
  switch (classification) {
    case 'ALTA_LIQUIDEZ': return { label: 'BAIXO', color: 'text-green-400' }
    case 'OPORTUNIDADE_OURO': return { label: 'MEDIO', color: 'text-yellow-400' }
    default: return { label: 'ALTO', color: 'text-red-400' }
  }
}

function riskScore(classification: string): number {
  switch (classification) {
    case 'ALTA_LIQUIDEZ': return 2
    case 'OPORTUNIDADE_OURO': return 5
    default: return 8
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function InvestorDashboardClient() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('market')
  const [rates, setRates] = useState<MacroRates>(getCachedRates())

  // Calculator state
  const [calcInput, setCalcInput] = useState({
    bidValue: 200000,
    appraisalValue: 350000,
    monthlyRent: 1800,
    totalAcquisitionCosts: 25000,
    state: 'SP',
    isOccupied: false,
    needsReform: false,
    reformCost: 0,
    projectionYears: 10,
    vacancyRate: 8.33,
  })

  // Computed results
  const [dcfResult, setDcfResult] = useState<DCFResult | null>(null)
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult[] | null>(null)
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null)
  const [stressResult, setStressResult] = useState<StressTestResult[] | null>(null)
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityPoint[] | null>(null)

  // Fetch market data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/v1/public/auction-opportunities`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: ApiResponse = await res.json()
      json.items = json.items.sort((a, b) => b.yieldMensal - a.yieldMensal).slice(0, 10)
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch BCB rates
  useEffect(() => {
    fetchMacroRates().then(r => setRates(r)).catch(() => {})
  }, [])

  // Clock + data
  useEffect(() => {
    fetchData()
    setNow(new Date().toLocaleString('pt-BR'))
    const interval = setInterval(() => setNow(new Date().toLocaleString('pt-BR')), 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Build DCF params
  const dcfParams = useMemo((): DCFParams => ({
    investment: {
      bidValue: calcInput.bidValue,
      appraisalValue: calcInput.appraisalValue,
      monthlyRent: calcInput.monthlyRent,
      totalAcquisitionCosts: calcInput.totalAcquisitionCosts,
      state: calcInput.state,
      isOccupied: calcInput.isOccupied,
      needsReform: calcInput.needsReform,
      reformCost: calcInput.reformCost,
    },
    rates,
    projectionYears: calcInput.projectionYears,
    vacancyRate: calcInput.vacancyRate,
  }), [calcInput, rates])

  // Run all calculations
  function runAllAnalyses() {
    const dcf = runDCF(dcfParams)
    setDcfResult(dcf)
    setScenarioResult(runScenarios(dcfParams))
    setMonteCarloResult(runMonteCarlo(dcfParams, 500))
    setStressResult(runStressTests(dcfParams))
    setSensitivityResult(runSensitivityAnalysis(dcfParams))
  }

  // KPIs
  const topYield = data?.items[0]?.yieldMensal ?? 0
  const avgRisk = data && data.items.length > 0
    ? Math.round(data.items.reduce((sum, i) => sum + riskScore(i.classification), 0) / data.items.length)
    : 0
  const avgPayback = data && data.items.length > 0 && topYield > 0 ? Math.round(100 / topYield) : 0
  const maxSpread = data ? Math.max(...data.items.map(i => Math.abs(i.spreadVsMarket)), 1) : 1

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'market', label: 'MERCADO', icon: <TrendingUp className="h-3 w-3" /> },
    { id: 'calculator', label: 'DCF/NPV', icon: <Calculator className="h-3 w-3" /> },
    { id: 'scenarios', label: 'CENÁRIOS', icon: <Layers className="h-3 w-3" /> },
    { id: 'montecarlo', label: 'MONTE CARLO', icon: <BarChart3 className="h-3 w-3" /> },
    { id: 'stress', label: 'STRESS TEST', icon: <Zap className="h-3 w-3" /> },
    { id: 'sensitivity', label: 'SENSIBILIDADE', icon: <Target className="h-3 w-3" /> },
    { id: 'comparator', label: 'COMPARADOR', icon: <LineChart className="h-3 w-3" /> },
    { id: 'portfolio', label: 'PORTFÓLIO', icon: <PieChart className="h-3 w-3" /> },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-300 font-mono selection:bg-[#C9A84C]/30">
      {/* ── Header ── */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          <h1 className="text-sm md:text-base tracking-widest text-gray-100 font-bold">
            AGORAENCONTREI_TERMINAL
          </h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">
            v2.0 PRO
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{now}</span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-green-400" />
            <span className="text-green-400">ONLINE</span>
          </span>
        </div>
      </header>

      {/* ── Macro Rates Ticker ── */}
      <div className="border-b border-gray-800 px-4 py-1.5 flex items-center gap-4 overflow-x-auto text-[10px]">
        <span className="text-gray-600 whitespace-nowrap">BCB_RATES:</span>
        {Object.entries(rates).map(([key, value]) => {
          const { label, color } = formatRate(value, key)
          return (
            <span key={key} className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-gray-600">{label}:</span>
              <span className={color}>{value.toFixed(2)}%</span>
            </span>
          )
        })}
      </div>

      {/* ── Tab Navigation ── */}
      <nav className="border-b border-gray-800 px-4 flex items-center gap-0.5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] tracking-wider transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? 'border-[#C9A84C] text-[#C9A84C]'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Main Content ── */}
      <main className="p-4 md:p-6">

        {/* ── TAB: MARKET ── */}
        {activeTab === 'market' && (
          <>
            {loading && (
              <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
                <Activity className="h-4 w-4 animate-spin mr-2" /> Carregando dados de mercado...
              </div>
            )}

            {error && (
              <div className="border border-red-900/50 bg-red-950/30 rounded p-4 text-red-400 text-sm">
                ERRO: {error}
              </div>
            )}

            {data && !loading && data.items.length === 0 && (
              <div className="border border-yellow-900/50 bg-yellow-950/10 rounded-lg p-6 text-center">
                <div className="text-yellow-500 text-sm mb-2">DADOS_EM_ATUALIZACAO</div>
                <p className="text-gray-400 text-xs">
                  Os scrapers de mercado estão sendo atualizados. As oportunidades serão exibidas em breve.
                </p>
              </div>
            )}

            {data && !loading && data.items.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: KPIs */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="border border-green-900/50 bg-green-950/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-green-500 mb-2">
                      <TrendingUp className="h-3.5 w-3.5" /> YIELD_BRUTO_MENSAL
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      {topYield > 0 ? `${topYield.toFixed(2)}%` : 'N/D'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {topYield > 0 ? 'Melhor oportunidade do lote' : 'Aguardando dados'}
                    </div>
                  </div>

                  <div className="border border-blue-900/50 bg-blue-950/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
                      <ShieldCheck className="h-3.5 w-3.5" /> RISK_SCORE_MEDIO
                    </div>
                    <div className="text-3xl font-bold text-blue-300">{avgRisk}/10</div>
                    <div className="text-xs text-gray-600 mt-1">Baseado em liquidez e spread</div>
                  </div>

                  <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-[#C9A84C] mb-2">
                      <DollarSign className="h-3.5 w-3.5" /> PAYBACK_ESTIMADO
                    </div>
                    <div className="text-3xl font-bold text-[#C9A84C]">
                      {avgPayback > 0 ? `${avgPayback} meses` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Retorno do capital investido</div>
                  </div>

                  <div className="border border-gray-800 rounded-lg p-4 text-xs text-gray-500">
                    <div className="flex justify-between mb-1">
                      <span>Total oportunidades:</span>
                      <span className="text-gray-300">{data.total}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Exibindo top:</span>
                      <span className="text-gray-300">{data.items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atualizado:</span>
                      <span className="text-gray-300">{new Date(data.updatedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Spread */}
                <div className="lg:col-span-8">
                  <div className="border border-gray-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                      <h2 className="text-xs tracking-wider text-gray-400">MARKET_SPREAD_BY_CITY</h2>
                      <span className="text-[10px] text-gray-600">spread % vs. mercado</span>
                    </div>
                    <div className="divide-y divide-gray-800/50">
                      {data.items.map((item, idx) => {
                        const risk = riskLevel(item.classification)
                        const barWidth = Math.max((Math.abs(item.spreadVsMarket) / maxSpread) * 100, 4)
                        const isPositive = item.spreadVsMarket >= 0

                        return (
                          <div key={`${item.city}-${idx}`} className="px-4 py-3 hover:bg-gray-900/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-gray-600" />
                                <span className="text-sm text-gray-200 font-medium">{item.city}</span>
                                <span className="text-[10px] text-gray-600 uppercase">{item.state}</span>
                              </div>
                              <span className={`text-xs ${risk.color}`}>RISK: {risk.label}</span>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    isPositive ? 'bg-gradient-to-r from-green-600 to-green-400' : 'bg-gradient-to-r from-red-600 to-red-400'
                                  }`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold w-16 text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {isPositive ? '+' : ''}{item.spreadVsMarket.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                              <span>Preço: <span className="text-gray-300">{formatBRL(item.price)}</span></span>
                              <span>Yield: <span className="text-green-400">{item.yieldMensal.toFixed(2)}%</span></span>
                              <span>Aluguel: <span className="text-gray-300">{formatBRL(item.estimatedRent)}</span></span>
                              <span>Mercado: <span className="text-gray-300">{formatBRL(item.marketPrice)}</span></span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: CALCULATOR (DCF/NPV) ── */}
        {activeTab === 'calculator' && (
          <div className="space-y-4">
            {/* Input Form */}
            <div className="border border-gray-800 rounded-lg p-4">
              <div className="text-xs text-gray-400 tracking-wider mb-4">PARAMETROS_INVESTIMENTO</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <CalcInput label="Valor do Lance (R$)" value={calcInput.bidValue} onChange={v => setCalcInput({...calcInput, bidValue: v})} />
                <CalcInput label="Valor Avaliação (R$)" value={calcInput.appraisalValue} onChange={v => setCalcInput({...calcInput, appraisalValue: v})} />
                <CalcInput label="Aluguel Mensal (R$)" value={calcInput.monthlyRent} onChange={v => setCalcInput({...calcInput, monthlyRent: v})} />
                <CalcInput label="Custos Aquisição (R$)" value={calcInput.totalAcquisitionCosts} onChange={v => setCalcInput({...calcInput, totalAcquisitionCosts: v})} />
                <CalcInput label="Projeção (anos)" value={calcInput.projectionYears} onChange={v => setCalcInput({...calcInput, projectionYears: v})} />
                <CalcInput label="Vacância (%)" value={calcInput.vacancyRate} onChange={v => setCalcInput({...calcInput, vacancyRate: v})} />
                <div>
                  <label className="text-[10px] text-gray-500">Estado</label>
                  <select
                    value={calcInput.state}
                    onChange={e => setCalcInput({...calcInput, state: e.target.value})}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200"
                  >
                    {['SP','RJ','MG','PR','RS','SC','BA','PE','CE','GO','DF','PA','AM','MT','MS','ES'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <input type="checkbox" checked={calcInput.isOccupied} onChange={e => setCalcInput({...calcInput, isOccupied: e.target.checked})} className="rounded border-gray-600" />
                    Ocupado
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <input type="checkbox" checked={calcInput.needsReform} onChange={e => setCalcInput({...calcInput, needsReform: e.target.checked})} className="rounded border-gray-600" />
                    Necessita reforma
                  </label>
                </div>
              </div>
              <button
                onClick={runAllAnalyses}
                className="mt-4 px-6 py-2 bg-[#C9A84C] text-black rounded font-bold text-sm hover:bg-[#d4b85c] transition-colors"
              >
                EXECUTAR ANÁLISE COMPLETA
              </button>
            </div>

            {dcfResult && (
              <DCFProjection dcf={dcfResult} totalInvestment={calcInput.bidValue + calcInput.totalAcquisitionCosts} />
            )}

            {!dcfResult && (
              <div className="border border-gray-800 rounded-lg p-8 text-center text-gray-500">
                <Calculator className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Configure os parâmetros e clique em &quot;EXECUTAR ANÁLISE COMPLETA&quot;</p>
                <p className="text-xs text-gray-600 mt-1">Calcula NPV, IRR, DCF, Cap Rate, Cash-on-Cash, Equity Multiple</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SCENARIOS ── */}
        {activeTab === 'scenarios' && (
          scenarioResult ? (
            <ScenarioAnalysis scenarios={scenarioResult} />
          ) : (
            <EmptyState icon={<Layers className="h-8 w-8" />} title="Análise de Cenários" desc="Execute a análise na aba DCF/NPV primeiro" />
          )
        )}

        {/* ── TAB: MONTE CARLO ── */}
        {activeTab === 'montecarlo' && (
          monteCarloResult ? (
            <MonteCarloChart result={monteCarloResult} selicRate={rates.selic} />
          ) : (
            <EmptyState icon={<BarChart3 className="h-8 w-8" />} title="Simulação Monte Carlo" desc="Execute a análise na aba DCF/NPV primeiro" />
          )
        )}

        {/* ── TAB: STRESS TEST ── */}
        {activeTab === 'stress' && (
          stressResult ? (
            <StressTestPanel results={stressResult} />
          ) : (
            <EmptyState icon={<Zap className="h-8 w-8" />} title="Stress Testing" desc="Execute a análise na aba DCF/NPV primeiro" />
          )
        )}

        {/* ── TAB: SENSITIVITY ── */}
        {activeTab === 'sensitivity' && (
          sensitivityResult && dcfResult ? (
            <SensitivityMatrix data={sensitivityResult} baseNPV={dcfResult.npv} />
          ) : (
            <EmptyState icon={<Target className="h-8 w-8" />} title="Análise de Sensibilidade" desc="Execute a análise na aba DCF/NPV primeiro" />
          )
        )}

        {/* ── TAB: COMPARATOR ── */}
        {activeTab === 'comparator' && (
          <PropertyComparator rates={rates} />
        )}

        {/* ── TAB: PORTFOLIO ── */}
        {activeTab === 'portfolio' && (
          <PortfolioDashboard />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 px-4 py-3 flex flex-wrap items-center gap-2 text-[10px] text-gray-600">
        <span className="text-gray-500">FONTES:</span>
        {['Caixa Econômica', 'Santander', 'ZAP Imóveis', 'QuintoAndar', 'BCB'].map(source => (
          <span key={source} className="px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-gray-500">
            {source}
          </span>
        ))}
        <span className="ml-auto text-gray-700">
          v2.0 PRO &middot; AGORAENCONTREI_TERMINAL &middot; NPV &middot; IRR &middot; DCF &middot; Monte Carlo
        </span>
      </footer>
    </div>
  )
}

// ─── Shared Components ──────────────────────────────────────────────────────

function CalcInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500">{label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-gray-800/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 font-mono focus:border-[#C9A84C] outline-none"
      />
    </div>
  )
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="border border-gray-800 rounded-lg p-8 text-center text-gray-500">
      <div className="mx-auto mb-3 text-gray-600 flex justify-center">{icon}</div>
      <p className="text-sm font-medium text-gray-400">{title}</p>
      <p className="text-xs text-gray-600 mt-1">{desc}</p>
    </div>
  )
}
