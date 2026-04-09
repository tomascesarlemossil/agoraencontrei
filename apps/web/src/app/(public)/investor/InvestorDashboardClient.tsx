'use client'

import { useEffect, useState, useCallback } from 'react'
import { Activity, DollarSign, ShieldCheck, TrendingUp, MapPin } from 'lucide-react'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agoraencontrei.com.br'

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

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function riskLevel(classification: string): { label: string; color: string } {
  switch (classification) {
    case 'ALTA_LIQUIDEZ':
      return { label: 'BAIXO', color: 'text-green-400' }
    case 'OPORTUNIDADE_OURO':
      return { label: 'MEDIO', color: 'text-yellow-400' }
    default:
      return { label: 'ALTO', color: 'text-red-400' }
  }
}

function riskScore(classification: string): number {
  switch (classification) {
    case 'ALTA_LIQUIDEZ':
      return 2
    case 'OPORTUNIDADE_OURO':
      return 5
    default:
      return 8
  }
}

export function InvestorDashboardClient() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/v1/public/auction-opportunities`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: ApiResponse = await res.json()
      // Sort by yield descending, take top 10
      json.items = json.items
        .sort((a, b) => b.yieldMensal - a.yieldMensal)
        .slice(0, 10)
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    setNow(new Date().toLocaleString('pt-BR'))
    const interval = setInterval(() => {
      setNow(new Date().toLocaleString('pt-BR'))
    }, 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const topYield = data?.items[0]?.yieldMensal ?? 0
  const avgRisk =
    data && data.items.length > 0
      ? Math.round(
          data.items.reduce((sum, i) => sum + riskScore(i.classification), 0) /
            data.items.length
        )
      : 0
  const avgPayback =
    data && data.items.length > 0 && topYield > 0
      ? Math.round(100 / topYield)
      : 0

  const maxSpread = data
    ? Math.max(...data.items.map((i) => Math.abs(i.spreadVsMarket)), 1)
    : 1

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
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{now}</span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-green-400" />
            <span className="text-green-400">API_STATUS: ONLINE</span>
          </span>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <main className="p-4 md:p-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
            <Activity className="h-4 w-4 animate-spin mr-2" />
            Carregando dados de mercado...
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
              Os scrapers de mercado (QuintoAndar, ZAP) estão sendo atualizados.
              As oportunidades serão exibidas assim que os dados estiverem disponíveis.
            </p>
            <p className="text-gray-600 text-[10px] mt-3">
              Última tentativa: {new Date(data.updatedAt).toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        {data && !loading && data.items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* ── Left Column: KPI Cards ── */}
            <div className="lg:col-span-4 space-y-4">
              {/* Yield Bruto */}
              <div className="border border-green-900/50 bg-green-950/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-green-500 mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  YIELD_BRUTO_MENSAL
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {topYield > 0 ? `${topYield.toFixed(2)}%` : 'N/D'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {topYield > 0 ? 'Melhor oportunidade do lote' : 'Aguardando dados de aluguel'}
                </div>
              </div>

              {/* Risk Score */}
              <div className="border border-blue-900/50 bg-blue-950/10 rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  RISK_SCORE_MEDIO
                </div>
                <div className="text-3xl font-bold text-blue-300">
                  {avgRisk}/10
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Baseado em liquidez e spread
                </div>
              </div>

              {/* Payback */}
              <div className="border border-gray-800 bg-gray-900/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-[#C9A84C] mb-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  PAYBACK_ESTIMADO
                </div>
                <div className="text-3xl font-bold text-[#C9A84C]">
                  {avgPayback > 0 ? `${avgPayback} meses` : 'N/A'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Retorno do capital investido
                </div>
              </div>

              {/* Summary */}
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
                  <span className="text-gray-300">
                    {new Date(data.updatedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Right Column: Market Spread Visualization ── */}
            <div className="lg:col-span-8">
              <div className="border border-gray-800 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-xs tracking-wider text-gray-400">
                    MARKET_SPREAD_BY_CITY
                  </h2>
                  <span className="text-[10px] text-gray-600">
                    spread % vs. mercado
                  </span>
                </div>

                <div className="divide-y divide-gray-800/50">
                  {data.items.map((item, idx) => {
                    const risk = riskLevel(item.classification)
                    const barWidth =
                      Math.max(
                        (Math.abs(item.spreadVsMarket) / maxSpread) * 100,
                        4
                      )
                    const isPositive = item.spreadVsMarket >= 0

                    return (
                      <div
                        key={`${item.city}-${idx}`}
                        className="px-4 py-3 hover:bg-gray-900/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-600" />
                            <span className="text-sm text-gray-200 font-medium">
                              {item.city}
                            </span>
                            <span className="text-[10px] text-gray-600 uppercase">
                              {item.state}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className={risk.color}>
                              RISK: {risk.label}
                            </span>
                          </div>
                        </div>

                        {/* Spread bar */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isPositive
                                  ? 'bg-gradient-to-r from-green-600 to-green-400'
                                  : 'bg-gradient-to-r from-red-600 to-red-400'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-bold w-16 text-right ${
                              isPositive ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {item.spreadVsMarket.toFixed(1)}%
                          </span>
                        </div>

                        {/* Details row */}
                        <div className="flex items-center gap-4 text-[11px] text-gray-500">
                          <span>
                            Preço:{' '}
                            <span className="text-gray-300">
                              {formatBRL(item.price)}
                            </span>
                          </span>
                          <span>
                            Yield:{' '}
                            <span className="text-green-400">
                              {item.yieldMensal.toFixed(2)}%
                            </span>
                          </span>
                          <span>
                            Aluguel est.:{' '}
                            <span className="text-gray-300">
                              {formatBRL(item.estimatedRent)}
                            </span>
                          </span>
                          <span>
                            Mercado:{' '}
                            <span className="text-gray-300">
                              {formatBRL(item.marketPrice)}
                            </span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer: Sources ── */}
      <footer className="border-t border-gray-800 px-4 py-3 flex flex-wrap items-center gap-2 text-[10px] text-gray-600">
        <span className="text-gray-500">FONTES:</span>
        {['Caixa Econômica', 'Santander', 'ZAP Imóveis', 'QuintoAndar', 'BCB'].map(
          (source) => (
            <span
              key={source}
              className="px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-gray-500"
            >
              {source}
            </span>
          )
        )}
        <span className="ml-auto text-gray-700">
          v1.0 &middot; AGORAENCONTREI_TERMINAL
        </span>
      </footer>
    </div>
  )
}
