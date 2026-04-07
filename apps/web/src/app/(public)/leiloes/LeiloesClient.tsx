'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, MapPin, Filter, Calculator, Bell, TrendingUp, ChevronDown, X, ArrowRight, Building, Home, Map as MapIcon, Star, Clock, DollarSign, BarChart3, AlertTriangle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-669c.up.railway.app'
const PUBLIC_AUCTIONS_URL = `${API_URL}/api/v1/public/auctions`

// ── Types ───────────────────────────────────────────────────────────────────

interface Auction {
  id: string
  title: string
  slug: string
  source: string
  status: string
  modality: string
  propertyType: string
  city: string | null
  state: string | null
  neighborhood: string | null
  totalArea: number | null
  bedrooms: number
  bathrooms: number
  parkingSpaces: number
  appraisalValue: number | null
  minimumBid: number | null
  discountPercent: number | null
  firstRoundDate: string | null
  secondRoundDate: string | null
  auctionDate: string | null
  coverImage: string | null
  opportunityScore: number | null
  estimatedROI: number | null
  occupation: string | null
  bankName: string | null
  auctioneerName: string | null
  financingAvailable: boolean
  fgtsAllowed: boolean
  views: number
  favorites: number
}

interface CalculatorResult {
  bidValue: number
  costs: { itbi: number; registry: number; lawyer: number; eviction: number; reform: number; totalCosts: number }
  totalInvestment: number
  discount: number
  potentialProfit: number
  roiPercent: number
  monthlyRentEstimate: number
  paybackMonths: number | null
  opportunityScore: number
  riskLevel: string
  maxRecommendedBid: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  if (!value) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    CAIXA: 'Caixa', BANCO_DO_BRASIL: 'BB', BRADESCO: 'Bradesco',
    ITAU: 'Itaú', SANTANDER: 'Santander', LEILOEIRO: 'Leiloeiro',
    JUDICIAL: 'Judicial', EXTRAJUDICIAL: 'Extrajudicial',
  }
  return labels[source] || source
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    UPCOMING: 'Em breve', OPEN: 'Aberto', FIRST_ROUND: '1ª Praça',
    SECOND_ROUND: '2ª Praça', SOLD: 'Arrematado', DESERTED: 'Deserto',
    SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado', CLOSED: 'Encerrado',
  }
  return labels[status] || status
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    UPCOMING: 'bg-blue-100 text-blue-800', OPEN: 'bg-green-100 text-green-800',
    FIRST_ROUND: 'bg-yellow-100 text-yellow-800', SECOND_ROUND: 'bg-orange-100 text-orange-800',
    SOLD: 'bg-gray-100 text-gray-800', DESERTED: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-600'
}

function scoreColor(score: number | null): string {
  if (!score) return 'text-gray-400'
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

function typeIcon(type: string): string {
  const icons: Record<string, string> = {
    HOUSE: '🏠', APARTMENT: '🏢', LAND: '🗺️', FARM: '🌾',
    STORE: '🏪', OFFICE: '🏛️', WAREHOUSE: '🏭',
  }
  return icons[type] || '🏠'
}

function normalizePublicPropertyType(type: string): string {
  const map: Record<string, string> = {
    casa: 'HOUSE',
    apartamento: 'APARTMENT',
    terreno: 'LAND',
    lote: 'LAND',
    sítio: 'FARM',
    sitio: 'FARM',
    fazenda: 'FARM',
    galpão: 'WAREHOUSE',
    galpao: 'WAREHOUSE',
    prédio: 'OFFICE',
    predio: 'OFFICE',
  }

  return map[type.toLowerCase()] || 'HOUSE'
}

function mapPublicAuction(item: any): Auction {
  return {
    id: `public-${item.id}`,
    title: item.description || `${item.propertyType || 'Imóvel'} em ${item.city}`,
    slug: `public-${item.id}`,
    source: 'CAIXA',
    status: 'OPEN',
    modality: item.saleType || 'VENDA_DIRETA',
    propertyType: normalizePublicPropertyType(item.propertyType || ''),
    city: item.city || null,
    state: 'SP',
    neighborhood: item.neighborhood || null,
    totalArea: item.totalArea || item.privateArea || item.landArea || null,
    bedrooms: item.bedrooms || 0,
    bathrooms: 0,
    parkingSpaces: item.parkingSpots || 0,
    appraisalValue: item.appraisalValue || null,
    minimumBid: item.price || null,
    discountPercent: item.discount || null,
    firstRoundDate: null,
    secondRoundDate: null,
    auctionDate: null,
    coverImage: null,
    opportunityScore: item.discount ? Math.min(95, Math.round(item.discount * 1.4)) : null,
    estimatedROI: item.discount || null,
    occupation: null,
    bankName: 'Caixa Econômica Federal',
    auctioneerName: null,
    financingAvailable: Boolean(item.financeable),
    fgtsAllowed: false,
    views: 0,
    favorites: 0,
  }
}

function filterFallbackAuctions(items: Auction[], filters: {
  search: string
  city: string
  state: string
  source: string
  propertyType: string
  minDiscount: string
  maxPrice: string
}) {
  return items.filter((auction) => {
    if (filters.search) {
      const haystack = [auction.title, auction.city, auction.neighborhood, auction.auctioneerName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(filters.search.toLowerCase())) return false
    }

    if (filters.city && (auction.city || '').toLowerCase() !== filters.city.toLowerCase()) return false
    if (filters.state && (auction.state || '').toLowerCase() !== filters.state.toLowerCase()) return false
    if (filters.source && auction.source !== filters.source) return false
    if (filters.propertyType && auction.propertyType !== filters.propertyType) return false
    if (filters.minDiscount && (auction.discountPercent || 0) < Number(filters.minDiscount)) return false
    if (filters.maxPrice && (auction.minimumBid || 0) > Number(filters.maxPrice)) return false

    return true
  })
}

// ── Component ───────────────────────────────────────────────────────────────

export default function LeiloesClient() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [source, setSource] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [minDiscount, setMinDiscount] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('auctionDate')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showFilters, setShowFilters] = useState(false)

  // Calculator
  const [showCalc, setShowCalc] = useState(false)
  const [calcBidValue, setCalcBidValue] = useState('')
  const [calcAppraisal, setCalcAppraisal] = useState('')
  const [calcArea, setCalcArea] = useState('')
  const [calcIsOccupied, setCalcIsOccupied] = useState(false)
  const [calcNeedsReform, setCalcNeedsReform] = useState(false)
  const [calcReformEstimate, setCalcReformEstimate] = useState('')
  const [calcResult, setCalcResult] = useState<CalculatorResult | null>(null)

  // Alert
  const [showAlert, setShowAlert] = useState(false)
  const [alertEmail, setAlertEmail] = useState('')
  const [alertPhone, setAlertPhone] = useState('')
  const [alertCity, setAlertCity] = useState('')
  const [alertMinDiscount, setAlertMinDiscount] = useState('')
  const [alertMaxPrice, setAlertMaxPrice] = useState('')
  const [alertSuccess, setAlertSuccess] = useState(false)

  // Stats
  const [stats, setStats] = useState<any>(null)

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchAuctions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      if (search) params.set('search', search)
      if (city) params.set('city', city)
      if (state) params.set('state', state)
      if (source) params.set('source', source)
      if (propertyType) params.set('propertyType', propertyType)
      if (minDiscount) params.set('minDiscount', minDiscount)
      if (maxPrice) params.set('maxPrice', maxPrice)

      const res = await fetch(`${API_URL}/api/v1/auctions?${params}`)
      if (res.ok) {
        const data = await res.json()
        const internalItems = data.data || []
        const internalTotal = data.pagination?.total || 0

        if (internalItems.length > 0 || internalTotal > 0) {
          setAuctions(internalItems)
          setTotal(internalTotal)
          setTotalPages(data.pagination?.totalPages || 1)
          return
        }
      }

      const fallbackRes = await fetch(PUBLIC_AUCTIONS_URL)
      if (!fallbackRes.ok) throw new Error('Falha ao buscar fallback público de leilões')

      const fallbackData = await fallbackRes.json()
      const mappedItems = (fallbackData.items || []).map(mapPublicAuction)
      const filteredItems = filterFallbackAuctions(mappedItems, {
        search,
        city,
        state,
        source,
        propertyType,
        minDiscount,
        maxPrice,
      })

      const sortedItems = [...filteredItems].sort((a, b) => {
        const orderFactor = sortOrder === 'desc' ? -1 : 1

        const getComparable = (auction: Auction) => {
          switch (sortBy) {
            case 'minimumBid': return auction.minimumBid || 0
            case 'discountPercent': return auction.discountPercent || 0
            case 'opportunityScore': return auction.opportunityScore || 0
            case 'auctionDate': return auction.auctionDate ? new Date(auction.auctionDate).getTime() : Number.MAX_SAFE_INTEGER
            default: return auction.minimumBid || 0
          }
        }

        const av = getComparable(a)
        const bv = getComparable(b)
        if (av < bv) return -1 * orderFactor
        if (av > bv) return 1 * orderFactor
        return 0
      })

      const limit = 20
      const start = (page - 1) * limit
      const paginatedItems = sortedItems.slice(start, start + limit)

      setAuctions(paginatedItems)
      setTotal(sortedItems.length)
      setTotalPages(Math.max(1, Math.ceil(sortedItems.length / limit)))
    } catch (err) {
      console.error('Erro ao buscar leilões:', err)
      setAuctions([])
      setTotal(0)
      setTotalPages(1)
    }
    setLoading(false)
  }, [page, search, city, state, source, propertyType, minDiscount, maxPrice, sortBy, sortOrder])

  useEffect(() => { fetchAuctions() }, [fetchAuctions])

  useEffect(() => {
    fetch(`${API_URL}/api/v1/auctions/stats`)
      .then(async (r) => {
        if (r.ok) return r.json()

        const fallbackRes = await fetch(PUBLIC_AUCTIONS_URL)
        if (!fallbackRes.ok) return null

        const fallbackData = await fallbackRes.json()
        const mappedItems = (fallbackData.items || []).map(mapPublicAuction)
        const bySource = mappedItems.reduce((acc: Record<string, number>, item: Auction) => {
          acc[item.source] = (acc[item.source] || 0) + 1
          return acc
        }, {})

        return {
          total: mappedItems.length,
          bySource: Object.entries(bySource).map(([source, count]) => ({ source, count })),
          byStatus: [{ status: 'OPEN', count: mappedItems.length }],
          averageDiscount: mappedItems.length
            ? Number((mappedItems.reduce((sum: number, item: Auction) => sum + (item.discountPercent || 0), 0) / mappedItems.length).toFixed(1))
            : 0,
          topCities: [],
        }
      })
      .then(setStats)
      .catch(() => {})
  }, [])

  const handleCalculate = async () => {
    if (!calcBidValue) return
    try {
      const res = await fetch(`${API_URL}/api/v1/auctions/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidValue: Number(calcBidValue),
          appraisalValue: calcAppraisal ? Number(calcAppraisal) : undefined,
          totalArea: calcArea ? Number(calcArea) : undefined,
          isOccupied: calcIsOccupied,
          needsReform: calcNeedsReform,
          reformEstimate: calcReformEstimate ? Number(calcReformEstimate) : 0,
          state: state || 'SP',
        }),
      })
      if (res.ok) setCalcResult(await res.json())
    } catch (err) {
      console.error('Erro calculadora:', err)
    }
  }

  const handleCreateAlert = async () => {
    if (!alertEmail && !alertPhone) return
    try {
      const res = await fetch(`${API_URL}/api/v1/auctions/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: alertEmail || undefined,
          phone: alertPhone || undefined,
          city: alertCity || undefined,
          minDiscount: alertMinDiscount ? Number(alertMinDiscount) : undefined,
          maxPrice: alertMaxPrice ? Number(alertMaxPrice) : undefined,
        }),
      })
      if (res.ok) {
        setAlertSuccess(true)
        setTimeout(() => { setShowAlert(false); setAlertSuccess(false) }, 3000)
      }
    } catch (err) {
      console.error('Erro alerta:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-3" style={{ color: '#C9A84C' }}>
              <TrendingUp className="w-3.5 h-3.5" /> Marketplace de Leilões
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              Leilões de Imóveis
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Busca unificada em 800+ leiloeiros e bancos. Descontos de até 70%.
              Calculadora de ROI e alertas inteligentes.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="flex bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="flex-1 flex items-center px-4">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Buscar por cidade, bairro, tipo..."
                  className="w-full py-4 text-gray-800 placeholder-gray-400 outline-none text-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAuctions()}
                />
              </div>
              <button
                onClick={fetchAuctions}
                className="px-8 py-4 text-white font-semibold text-sm"
                style={{ backgroundColor: '#C9A84C' }}
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="max-w-4xl mx-auto mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/10 rounded-lg px-4 py-3 text-center">
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{stats.total?.toLocaleString('pt-BR') || '0'}</div>
                <div className="text-xs text-white/60">Leilões Ativos</div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 text-center">
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{stats.averageDiscount || 0}%</div>
                <div className="text-xs text-white/60">Desconto Médio</div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 text-center">
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{stats.bySource?.length || 0}</div>
                <div className="text-xs text-white/60">Fontes Ativas</div>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 text-center">
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{stats.topCities?.length || 0}</div>
                <div className="text-xs text-white/60">Cidades</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{total.toLocaleString('pt-BR')}</span> leilões encontrados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              <Filter className="w-4 h-4" /> Filtros
            </button>
            <button
              onClick={() => setShowCalc(!showCalc)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              <Calculator className="w-4 h-4" /> Calculadora
            </button>
            <button
              onClick={() => setShowAlert(!showAlert)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white transition"
              style={{ backgroundColor: '#C9A84C' }}
            >
              <Bell className="w-4 h-4" /> Alerta
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm border-0 outline-none"
            >
              <option value="auctionDate">Data do Leilão</option>
              <option value="minimumBid">Menor Lance</option>
              <option value="discountPercent">Maior Desconto</option>
              <option value="opportunityScore">Melhor Score</option>
              <option value="createdAt">Mais Recentes</option>
            </select>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t bg-gray-50 px-4 py-4">
            <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <input type="text" placeholder="Cidade" value={city} onChange={e => setCity(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm" />
              <select value={state} onChange={e => setState(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
                <option value="">Todos os Estados</option>
                {['SP','RJ','MG','BA','PR','RS','PE','CE','GO','SC','DF','PA','MA','AM','MT','MS','ES','RN','PB','AL','PI','SE','AC','AP','RO','RR','TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
              <select value={source} onChange={e => setSource(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
                <option value="">Todas as Fontes</option>
                <option value="CAIXA">Caixa</option>
                <option value="BANCO_DO_BRASIL">Banco do Brasil</option>
                <option value="BRADESCO">Bradesco</option>
                <option value="ITAU">Itaú</option>
                <option value="SANTANDER">Santander</option>
                <option value="JUDICIAL">Judicial</option>
                <option value="EXTRAJUDICIAL">Extrajudicial</option>
              </select>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="px-3 py-2 rounded-lg border text-sm">
                <option value="">Todos os Tipos</option>
                <option value="HOUSE">Casa</option>
                <option value="APARTMENT">Apartamento</option>
                <option value="LAND">Terreno</option>
                <option value="FARM">Fazenda/Sítio</option>
                <option value="STORE">Loja</option>
                <option value="OFFICE">Sala Comercial</option>
                <option value="WAREHOUSE">Galpão</option>
              </select>
              <input type="number" placeholder="Desconto mín. %" value={minDiscount} onChange={e => setMinDiscount(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm" />
              <input type="number" placeholder="Preço máximo R$" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm" />
            </div>
            <div className="max-w-7xl mx-auto mt-3 flex gap-2">
              <button onClick={() => { setPage(1); fetchAuctions() }}
                className="px-4 py-2 text-white rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1B2B5B' }}>
                Aplicar Filtros
              </button>
              <button onClick={() => { setCity(''); setState(''); setSource(''); setPropertyType(''); setMinDiscount(''); setMaxPrice(''); setSearch('') }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Calculator Panel */}
      {showCalc && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calculator className="w-5 h-5" style={{ color: '#C9A84C' }} /> Calculadora de Investimento em Leilão
              </h3>
              <button onClick={() => setShowCalc(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Lance (R$) *</label>
                    <input type="number" value={calcBidValue} onChange={e => setCalcBidValue(e.target.value)}
                      placeholder="Ex: 200000" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Avaliação (R$)</label>
                    <input type="number" value={calcAppraisal} onChange={e => setCalcAppraisal(e.target.value)}
                      placeholder="Ex: 350000" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Área (m²)</label>
                    <input type="number" value={calcArea} onChange={e => setCalcArea(e.target.value)}
                      placeholder="Ex: 120" className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium">Reforma (R$)</label>
                    <input type="number" value={calcReformEstimate} onChange={e => setCalcReformEstimate(e.target.value)}
                      placeholder="Ex: 30000" className="w-full px-3 py-2 border rounded-lg text-sm"
                      disabled={!calcNeedsReform} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={calcIsOccupied} onChange={e => setCalcIsOccupied(e.target.checked)} className="rounded" />
                    Imóvel ocupado
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={calcNeedsReform} onChange={e => setCalcNeedsReform(e.target.checked)} className="rounded" />
                    Precisa reforma
                  </label>
                </div>
                <button onClick={handleCalculate}
                  className="w-full px-4 py-3 text-white rounded-lg text-sm font-semibold" style={{ backgroundColor: '#1B2B5B' }}>
                  Calcular Investimento
                </button>
              </div>

              {/* Results */}
              {calcResult && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Investimento Total</div>
                      <div className="text-lg font-bold text-gray-800">{formatCurrency(calcResult.totalInvestment)}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Lucro Potencial</div>
                      <div className={`text-lg font-bold ${calcResult.potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(calcResult.potentialProfit)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">ROI</div>
                      <div className={`text-sm font-bold ${calcResult.roiPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calcResult.roiPercent}%
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Score</div>
                      <div className={`text-sm font-bold ${scoreColor(calcResult.opportunityScore)}`}>
                        {calcResult.opportunityScore}/100
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Risco</div>
                      <div className={`text-sm font-bold ${calcResult.riskLevel === 'LOW' ? 'text-green-600' : calcResult.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {calcResult.riskLevel === 'LOW' ? 'Baixo' : calcResult.riskLevel === 'HIGH' ? 'Alto' : 'Médio'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between"><span>ITBI:</span> <span>{formatCurrency(calcResult.costs.itbi)}</span></div>
                    <div className="flex justify-between"><span>Registro/Escritura:</span> <span>{formatCurrency(calcResult.costs.registry)}</span></div>
                    <div className="flex justify-between"><span>Advogado:</span> <span>{formatCurrency(calcResult.costs.lawyer)}</span></div>
                    {calcResult.costs.eviction > 0 && <div className="flex justify-between"><span>Desocupação:</span> <span>{formatCurrency(calcResult.costs.eviction)}</span></div>}
                    {calcResult.costs.reform > 0 && <div className="flex justify-between"><span>Reforma:</span> <span>{formatCurrency(calcResult.costs.reform)}</span></div>}
                    <div className="flex justify-between font-semibold border-t pt-1"><span>Total Custos:</span> <span>{formatCurrency(calcResult.costs.totalCosts)}</span></div>
                  </div>
                  {calcResult.paybackMonths && (
                    <div className="text-xs text-gray-500 text-center border-t pt-2">
                      Payback via aluguel: <strong>{calcResult.paybackMonths} meses</strong> ({formatCurrency(calcResult.monthlyRentEstimate)}/mês estimado)
                    </div>
                  )}
                  <div className="text-xs text-center p-2 rounded-lg" style={{ backgroundColor: '#1B2B5B', color: '#C9A84C' }}>
                    Lance máximo recomendado: <strong>{formatCurrency(calcResult.maxRecommendedBid)}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert Panel */}
      {showAlert && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5" style={{ color: '#C9A84C' }} /> Alerta de Oportunidades
              </h3>
              <button onClick={() => setShowAlert(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {alertSuccess ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔔</div>
                <div className="text-lg font-semibold text-green-600">Alerta criado com sucesso!</div>
                <p className="text-sm text-gray-500 mt-1">Você receberá notificações de novas oportunidades.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <input type="email" placeholder="Seu email" value={alertEmail} onChange={e => setAlertEmail(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm" />
                <input type="tel" placeholder="WhatsApp (16) 99999-0000" value={alertPhone} onChange={e => setAlertPhone(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm" />
                <input type="text" placeholder="Cidade" value={alertCity} onChange={e => setAlertCity(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm" />
                <input type="number" placeholder="Desconto mín. %" value={alertMinDiscount} onChange={e => setAlertMinDiscount(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm" />
                <button onClick={handleCreateAlert}
                  className="px-4 py-2 text-white rounded-lg text-sm font-semibold" style={{ backgroundColor: '#C9A84C' }}>
                  Criar Alerta
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auction Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum leilão encontrado</h3>
            <p className="text-gray-500 mb-4">Tente ajustar seus filtros ou criar um alerta para ser notificado.</p>
            <button onClick={() => setShowAlert(true)}
              className="px-6 py-3 text-white rounded-lg font-semibold" style={{ backgroundColor: '#C9A84C' }}>
              <Bell className="w-4 h-4 inline mr-2" /> Criar Alerta
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {auctions.map(auction => (
                <Link key={auction.id} href={`/leiloes/${auction.slug}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 group">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {auction.coverImage ? (
                      <img src={auction.coverImage} alt={auction.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">{typeIcon(auction.propertyType)}</div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(auction.status)}`}>
                        {statusLabel(auction.status)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {sourceLabel(auction.source)}
                      </span>
                    </div>
                    {/* Discount badge */}
                    {auction.discountPercent && auction.discountPercent > 0 && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                        -{auction.discountPercent}%
                      </div>
                    )}
                    {/* Score */}
                    {auction.opportunityScore && (
                      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1">
                        <Star className={`w-3.5 h-3.5 ${scoreColor(auction.opportunityScore)}`} />
                        <span className={`text-xs font-bold ${scoreColor(auction.opportunityScore)}`}>{auction.opportunityScore}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1 group-hover:text-[#1B2B5B] transition">
                      {auction.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <MapPin className="w-3 h-3" />
                      {auction.neighborhood ? `${auction.neighborhood}, ` : ''}{auction.city || ''}{auction.state ? `/${auction.state}` : ''}
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      {auction.appraisalValue && (
                        <div className="text-xs text-gray-400 line-through">
                          Avaliação: {formatCurrency(Number(auction.appraisalValue))}
                        </div>
                      )}
                      <div className="text-lg font-bold" style={{ color: '#1B2B5B' }}>
                        {formatCurrency(Number(auction.minimumBid))}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      {auction.totalArea && <span>{auction.totalArea}m²</span>}
                      {auction.bedrooms > 0 && <span>{auction.bedrooms} quartos</span>}
                      {auction.auctionDate && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {formatDate(auction.auctionDate)}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {auction.financingAvailable && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded">Financiável</span>
                      )}
                      {auction.fgtsAllowed && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">FGTS</span>
                      )}
                      {auction.occupation === 'DESOCUPADO' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded">Desocupado</span>
                      )}
                      {auction.occupation === 'OCUPADO' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 rounded">Ocupado</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-white border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 bg-white border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA Section */}
      <section className="py-12 px-4" style={{ backgroundColor: '#1B2B5B' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Não perca nenhuma oportunidade
          </h2>
          <p className="text-white/70 mb-6">
            Crie um alerta e receba notificações via WhatsApp quando um imóvel no seu perfil aparecer.
          </p>
          <button onClick={() => setShowAlert(true)}
            className="px-8 py-3 rounded-xl font-semibold text-base inline-flex items-center gap-2"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}>
            <Bell className="w-5 h-5" /> Criar Alerta Gratuito
          </button>
        </div>
      </section>
    </div>
  )
}
