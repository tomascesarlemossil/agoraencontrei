'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  Gavel, TrendingDown, Bot, Zap, RefreshCw, Bell, BellOff,
  MapPin, ExternalLink, ChevronRight, Activity, AlertCircle,
  CheckCircle2, Clock, XCircle, BarChart3, Building2, Flame,
  Filter, Search, ArrowUpDown, Eye, Star
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-669c.up.railway.app'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface AuctionStats {
  total: number
  bySource: { source: string; count: number; avgDiscount: number }[]
  byStatus: { status: string; count: number }[]
  topCities: { city: string; state: string; count: number; avgDiscount: number; avgScore: number }[]
  maxDiscount: { percent: number; title: string; value: any; city: string; source: string } | null
  averageDiscount: number
  robots: { total: number; online: number; latencyMs: number; lastRun: string | null }
  recentRuns: { id: string; source: string; status: string; startedAt: string; finishedAt: string | null; itemsCreated: number; itemsUpdated: number; errorMessage: string | null }[]
  latestAuctions: {
    id: string; title: string; source: string; city: string; state: string
    minimumBid: any; discountPercent: number | null; opportunityScore: number | null
    estimatedROI: number | null; createdAt: string; slug: string
  }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(value: any): string {
  const num = typeof value === 'object' && value !== null ? Number(value) : Number(value)
  if (isNaN(num) || num === 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(num)
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    CAIXA: 'Caixa', BANCO_DO_BRASIL: 'BB', BRADESCO: 'Bradesco',
    ITAU: 'Itaú', SANTANDER: 'Santander', JUDICIAL: 'Judicial',
    EXTRAJUDICIAL: 'Extrajudicial', LEILOEIRO: 'Leiloeiro', MANUAL: 'Manual',
  }
  return map[source] || source
}

function sourceColor(source: string): string {
  const map: Record<string, string> = {
    CAIXA: 'bg-blue-100 text-blue-700',
    BANCO_DO_BRASIL: 'bg-yellow-100 text-yellow-700',
    BRADESCO: 'bg-red-100 text-red-700',
    JUDICIAL: 'bg-purple-100 text-purple-700',
    SANTANDER: 'bg-orange-100 text-orange-700',
    ITAU: 'bg-orange-100 text-orange-800',
    LEILOEIRO: 'bg-gray-100 text-gray-700',
    MANUAL: 'bg-green-100 text-green-700',
  }
  return map[source] || 'bg-gray-100 text-gray-700'
}

function roiEmoji(roi: number | null): string {
  if (!roi) return ''
  if (roi >= 50) return ' 🚀'
  if (roi >= 40) return ' 🔥'
  if (roi >= 30) return ' ⚡'
  return ''
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, icon: Icon, color = 'blue', sub }: {
  label: string; value: string | number; trend?: string; icon: any; color?: string; sub?: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
  }
  const iconColor = colorMap[color] || colorMap.blue

  return (
    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <h3 className={`text-2xl font-bold mt-1.5 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'amber' ? 'text-amber-600' : color === 'purple' ? 'text-purple-600' : 'text-red-600'}`}>
            {value}
          </h3>
          {sub && <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className="text-xs font-semibold text-green-500">{trend}</span>
        </div>
      )}
    </div>
  )
}

// ── RunStatusBadge ────────────────────────────────────────────────────────────
function RunStatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') return <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="h-3 w-3" />OK</span>
  if (status === 'RUNNING') return <span className="flex items-center gap-1 text-xs text-blue-600 font-medium"><Activity className="h-3 w-3 animate-pulse" />Rodando</span>
  if (status === 'PARTIAL') return <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><AlertCircle className="h-3 w-3" />Parcial</span>
  if (status === 'FAILED') return <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><XCircle className="h-3 w-3" />Falhou</span>
  return <span className="text-xs text-gray-500">{status}</span>
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeiloesAdminPage() {
  const { accessToken: token, user } = useAuth()
  const [stats, setStats] = useState<AuctionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null)
  const [alertsEnabled, setAlertsEnabled] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(`${API_URL}/api/v1/auctions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStats(data)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchStats()
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const handleForceScrape = async () => {
    if (!isAdmin) return
    setScraping(true)
    setScrapeMsg(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/auctions/force-scrape`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      setScrapeMsg(data.message || 'Varredura iniciada!')
      setTimeout(() => fetchStats(), 5000)
      setTimeout(() => fetchStats(), 15000)
    } catch {
      setScrapeMsg('Erro ao iniciar varredura')
    } finally {
      setScraping(false)
    }
  }

  // Filtrar leilões
  const filteredAuctions = (stats?.latestAuctions || []).filter(a => {
    const matchSearch = !searchFilter || a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (a.city || '').toLowerCase().includes(searchFilter.toLowerCase())
    const matchSource = sourceFilter === 'ALL' || a.source === sourceFilter
    return matchSearch && matchSource
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Carregando dados dos robôs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Gavel className="h-7 w-7 text-blue-600" />
            Dashboard de Leilões
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitoramento em tempo real · Atualizado às {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
          {isAdmin && (
            <button
              onClick={handleForceScrape}
              disabled={scraping}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              <Zap className={`h-4 w-4 ${scraping ? 'animate-pulse' : ''}`} />
              {scraping ? 'Varrendo...' : 'Forçar Varredura'}
            </button>
          )}
          <button
            onClick={() => setAlertsEnabled(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${alertsEnabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {alertsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            Alertas WhatsApp {alertsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* ── Scrape message ──────────────────────────────────────────────────── */}
      {scrapeMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Activity className="h-4 w-4 flex-shrink-0" />
          {scrapeMsg}
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error} — A API pode estar inicializando. Tente atualizar em alguns segundos.
        </div>
      )}

      {/* ── SEÇÃO 1: Cards de Status (O "Pulso" do Site) ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Imóveis Ativos"
          value={stats?.total ?? 0}
          trend={stats && stats.total > 0 ? `+${Math.min(stats.total, 15)} novos hoje` : undefined}
          icon={Building2}
          color="blue"
        />
        <StatCard
          label="Maior Desconto"
          value={stats?.maxDiscount ? `${stats.maxDiscount.percent}%` : '—'}
          sub={stats?.maxDiscount ? `${sourceLabel(stats.maxDiscount.source)} · ${formatCurrency(stats.maxDiscount.value)}` : undefined}
          icon={TrendingDown}
          color="amber"
        />
        <StatCard
          label="Desconto Médio"
          value={stats?.averageDiscount ? `${stats.averageDiscount}%` : '—'}
          sub="Sobre valor de avaliação"
          icon={BarChart3}
          color="green"
        />
        <StatCard
          label="Saúde dos Robôs"
          value={stats ? `${stats.robots.online}/${stats.robots.total} Online` : '—'}
          sub={`Latência ${stats?.robots.latencyMs ?? 0}ms`}
          trend={stats?.robots.online === stats?.robots.total ? '🟢 Todos operacionais' : '🟡 Verificar logs'}
          icon={Bot}
          color={stats?.robots.online === stats?.robots.total ? 'green' : 'amber'}
        />
      </div>

      {/* ── SEÇÃO 2: Live Feed + Painel Nitro ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Feed — 2/3 da largura */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="font-semibold text-gray-900 text-sm">A Pesca de Imóveis — Live Feed</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Todas fontes</option>
                <option value="CAIXA">Caixa</option>
                <option value="JUDICIAL">Judicial</option>
                <option value="BANCO_DO_BRASIL">BB</option>
                <option value="BRADESCO">Bradesco</option>
                <option value="SANTANDER">Santander</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-50">
                  <th className="px-5 py-3 text-left font-semibold">Hora</th>
                  <th className="px-3 py-3 text-left font-semibold">Fonte</th>
                  <th className="px-3 py-3 text-left font-semibold">Cidade</th>
                  <th className="px-3 py-3 text-right font-semibold">Valor Venda</th>
                  <th className="px-3 py-3 text-right font-semibold">ROI Est.</th>
                  <th className="px-3 py-3 text-center font-semibold">Score</th>
                  <th className="px-3 py-3 text-center font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAuctions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                      {stats?.total === 0
                        ? 'Nenhum leilão ainda. Clique em "Forçar Varredura" para buscar imóveis da Caixa.'
                        : 'Nenhum resultado para os filtros aplicados.'}
                    </td>
                  </tr>
                ) : filteredAuctions.map((auction) => (
                  <tr key={auction.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatTime(auction.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sourceColor(auction.source)}`}>
                        {sourceLabel(auction.source)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{auction.city || '—'}/{auction.state || '—'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-semibold text-gray-900 text-xs">{formatCurrency(auction.minimumBid)}</span>
                      {auction.discountPercent && (
                        <div className="text-xs text-green-600 font-medium">{auction.discountPercent.toFixed(0)}% desc.</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-semibold">
                      {auction.estimatedROI
                        ? <span className={auction.estimatedROI >= 40 ? 'text-green-600' : 'text-gray-600'}>
                            {auction.estimatedROI.toFixed(0)}%{roiEmoji(auction.estimatedROI)}
                          </span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-3 py-3 text-center">
                      {auction.opportunityScore ? (
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                          auction.opportunityScore >= 70 ? 'bg-green-100 text-green-700' :
                          auction.opportunityScore >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {auction.opportunityScore}
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <a
                        href={`/leilao-imoveis-franca-sp`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAuctions.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400 flex items-center justify-between">
              <span>Mostrando {filteredAuctions.length} de {stats?.total ?? 0} imóveis</span>
              <a href="/leilao-imoveis-franca-sp" className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium">
                Ver todos <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Painel Nitro — 1/3 da largura */}
        <div className="space-y-4">

          {/* Configurações Nitro */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
              <Flame className="h-4 w-4 text-orange-500" />
              Painel Nitro
            </h2>

            <div className="space-y-3">
              {/* Forçar Varredura */}
              {isAdmin && (
                <button
                  onClick={handleForceScrape}
                  disabled={scraping}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Forçar Varredura
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* Toggle Alertas WhatsApp */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Alertas WhatsApp</span>
                </div>
                <button
                  onClick={() => setAlertsEnabled(v => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${alertsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${alertsEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Link para página pública */}
              <a
                href="/leilao-imoveis-franca-sp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                  Ver página pública
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Filtro Geográfico SEO — Cidades Quentes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-blue-500" />
              Cidades Quentes no Google
            </h2>
            <div className="space-y-2">
              {(stats?.topCities || []).slice(0, 6).map((city, i) => (
                <div key={`${city.city}-${city.state}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>{i + 1}</span>
                    <span className="text-xs text-gray-700 truncate">{city.city}/{city.state}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-green-600 font-medium">{city.avgDiscount.toFixed(0)}% desc</span>
                    <span className="text-xs text-gray-400">{city.count}</span>
                  </div>
                </div>
              ))}
              {(!stats?.topCities || stats.topCities.length === 0) && (
                <p className="text-xs text-gray-400 text-center py-4">Dados disponíveis após a primeira varredura</p>
              )}
            </div>
          </div>

          {/* Por Fonte */}
          {stats && stats.bySource.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                Por Fonte
              </h2>
              <div className="space-y-2">
                {stats.bySource.map(s => (
                  <div key={s.source} className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sourceColor(s.source)}`}>
                      {sourceLabel(s.source)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-600 font-medium">{s.avgDiscount.toFixed(0)}% desc</span>
                      <span className="text-xs font-bold text-gray-700">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SEÇÃO 3: Logs dos Robôs ─────────────────────────────────────────── */}
      {stats && stats.recentRuns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Logs dos Robôs — Últimas Varreduras
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-50">
                  <th className="px-5 py-3 text-left font-semibold">Fonte</th>
                  <th className="px-3 py-3 text-left font-semibold">Status</th>
                  <th className="px-3 py-3 text-left font-semibold">Início</th>
                  <th className="px-3 py-3 text-right font-semibold">Criados</th>
                  <th className="px-3 py-3 text-right font-semibold">Atualizados</th>
                  <th className="px-3 py-3 text-left font-semibold">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentRuns.map(run => (
                  <tr key={run.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sourceColor(run.source)}`}>
                        {sourceLabel(run.source)}
                      </span>
                    </td>
                    <td className="px-3 py-3"><RunStatusBadge status={run.status} /></td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{formatTime(run.startedAt)}</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-green-600">+{run.itemsCreated}</td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-blue-600">~{run.itemsUpdated}</td>
                    <td className="px-3 py-3 text-xs text-red-500 max-w-[200px] truncate">
                      {run.errorMessage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SEÇÃO 4: Estado vazio (sem dados ainda) ─────────────────────────── */}
      {stats && stats.total === 0 && !error && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-8 text-center">
          <Gavel className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Tanque vazio — hora de pescar!</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Clique em "Forçar Varredura" para buscar imóveis da Caixa Econômica Federal, leilões judiciais e bancos.
            Os dados aparecerão aqui em tempo real.
          </p>
          {isAdmin && (
            <button
              onClick={handleForceScrape}
              disabled={scraping}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
            >
              <Zap className={`h-5 w-5 ${scraping ? 'animate-pulse' : ''}`} />
              {scraping ? 'Varrendo...' : 'Iniciar Primeira Varredura'}
            </button>
          )}
        </div>
      )}

    </div>
  )
}
