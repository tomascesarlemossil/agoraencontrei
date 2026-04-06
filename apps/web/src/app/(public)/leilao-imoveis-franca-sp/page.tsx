'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search,
  Building2, TreePine, Warehouse, Tag, BadgePercent, CheckCircle,
  XCircle, Filter, ChevronDown, ExternalLink, RefreshCw, AlertCircle,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuctionItem {
  id: string
  city: string
  neighborhood: string
  address: string
  price: number
  appraisalValue: number
  discount: number
  financeable: boolean
  description: string
  saleType: string
  link: string
  propertyType: string
  bedrooms: number
  totalArea: number
  privateArea: number
  landArea: number
  parkingSpots: number
}

interface AuctionsResponse {
  total: number
  updatedAt: string
  items: AuctionItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function getSaleTypeLabel(saleType: string): string {
  if (saleType.includes('Licitação Aberta')) return 'Licitação Aberta'
  if (saleType.includes('Leilão SFI')) return 'Leilão SFI'
  if (saleType.includes('Venda Direta')) return 'Venda Direta'
  if (saleType.includes('Venda Online')) return 'Venda Online'
  return saleType
}

function getSaleTypeBadgeColor(saleType: string): string {
  if (saleType.includes('Licitação')) return 'bg-blue-100 text-blue-800'
  if (saleType.includes('Leilão SFI')) return 'bg-orange-100 text-orange-800'
  if (saleType.includes('Venda Direta')) return 'bg-green-100 text-green-800'
  if (saleType.includes('Venda Online')) return 'bg-purple-100 text-purple-800'
  return 'bg-gray-100 text-gray-700'
}

function getPropertyIcon(type: string) {
  switch (type) {
    case 'Apartamento': return <Building2 className="w-5 h-5" />
    case 'Casa': return <Home className="w-5 h-5" />
    case 'Terreno': return <MapPin className="w-5 h-5" />
    case 'Galpão': return <Warehouse className="w-5 h-5" />
    case 'Chácara':
    case 'Sítio':
    case 'Fazenda': return <TreePine className="w-5 h-5" />
    default: return <Home className="w-5 h-5" />
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agoraencontrei.com.br'

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeilaoPage() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([])
  const [filtered, setFiltered] = useState<AuctionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  // Filters
  const [filterType, setFilterType] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterSaleType, setFilterSaleType] = useState('')
  const [filterFinanceable, setFilterFinanceable] = useState(false)
  const [sortBy, setSortBy] = useState<'discount' | 'price'>('discount')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchAuctions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [auctions, filterType, filterCity, filterSaleType, filterFinanceable, sortBy])

  async function fetchAuctions() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/public/auctions`, { next: { revalidate: 21600 } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: AuctionsResponse = await res.json()
      setAuctions(data.items)
      setUpdatedAt(data.updatedAt)
    } catch (err) {
      setError('Não foi possível carregar os imóveis da Caixa. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let result = [...auctions]
    if (filterType) result = result.filter(a => a.propertyType === filterType)
    if (filterCity) result = result.filter(a => a.city.toUpperCase().includes(filterCity.toUpperCase()))
    if (filterSaleType) result = result.filter(a => a.saleType.includes(filterSaleType))
    if (filterFinanceable) result = result.filter(a => a.financeable)
    result.sort((a, b) => sortBy === 'discount' ? b.discount - a.discount : a.price - b.price)
    setFiltered(result)
  }

  const uniqueTypes = Array.from(new Set(auctions.map(a => a.propertyType))).sort()
  const uniqueCities = Array.from(new Set(auctions.map(a => a.city))).sort()

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> Franca/SP e Região · Imobiliária Lemos
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Leilão de Imóveis<br />em Franca/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            Imóveis da Caixa Econômica Federal com até 40% de desconto. Casas, apartamentos e terrenos abaixo do valor de mercado em Franca e região.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <a href="#listagem"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Imóveis Disponíveis
            </a>
            <a href="https://wa.me/5516981010004?text=Olá! Preciso de ajuda com leilão de imóveis em Franca/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Falar com Especialista
            </a>
          </div>

          {/* Stats rápidos */}
          {!loading && auctions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{auctions.length}</div>
                <div className="text-white/60">imóveis disponíveis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>
                  {Math.round(Math.max(...auctions.map(a => a.discount)))}%
                </div>
                <div className="text-white/60">maior desconto</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>
                  {auctions.filter(a => a.financeable).length}
                </div>
                <div className="text-white/60">financiáveis</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AVISO IMPORTANTE */}
      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Assessoria especializada recomendada</p>
            <p className="text-xs text-amber-700 mt-1">
              Imóveis em leilão exigem análise jurídica prévia. A Imobiliária Lemos oferece consultoria completa para arremates seguros em Franca/SP.
              {' '}<a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer" className="underline font-semibold">Fale conosco antes de arrematar.</a>
            </p>
          </div>
        </div>
      </section>

      {/* LISTAGEM */}
      <section id="listagem" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              Imóveis da Caixa Econômica Federal
            </h2>
            {updatedAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                Atualizado em {new Date(updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchAuctions}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo de Imóvel</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]/20"
              >
                <option value="">Todos os tipos</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Cidade</label>
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]/20"
              >
                <option value="">Todas as cidades</option>
                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Modalidade</label>
              <select
                value={filterSaleType}
                onChange={e => setFilterSaleType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]/20"
              >
                <option value="">Todas as modalidades</option>
                <option value="Licitação">Licitação Aberta</option>
                <option value="Leilão SFI">Leilão SFI</option>
                <option value="Venda Direta">Venda Direta</option>
                <option value="Venda Online">Venda Online</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Ordenar por</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'discount' | 'price')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]/20"
              >
                <option value="discount">Maior desconto</option>
                <option value="price">Menor preço</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="financeable"
                checked={filterFinanceable}
                onChange={e => setFilterFinanceable(e.target.checked)}
                className="rounded border-gray-300 text-[#1B2B5B]"
              />
              <label htmlFor="financeable" className="text-sm text-gray-700">Somente financiáveis pela Caixa</label>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-[#1B2B5B]/20 border-t-[#1B2B5B] rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Carregando imóveis da Caixa Econômica Federal...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <button onClick={fetchAuctions} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B2B5B] text-white text-sm font-medium">
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </button>
          </div>
        )}

        {/* Results count */}
        {!loading && !error && (
          <p className="text-sm text-gray-500 mb-4">
            <span className="font-semibold text-gray-800">{filtered.length}</span> imóveis encontrados
            {(filterType || filterCity || filterSaleType || filterFinanceable) && (
              <button
                onClick={() => { setFilterType(''); setFilterCity(''); setFilterSaleType(''); setFilterFinanceable(false) }}
                className="ml-2 text-xs text-[#1B2B5B] underline"
              >
                limpar filtros
              </button>
            )}
          </p>
        )}

        {/* Grid de imóveis */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 hover:border-[#C9A84C]/40 hover:shadow-md transition-all overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 pb-3 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: '#1B2B5B' }}>
                        {getPropertyIcon(item.propertyType)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500">{item.propertyType}</p>
                        <p className="text-xs text-gray-400">{item.city}</p>
                      </div>
                    </div>
                    {item.discount > 0 && (
                      <div className="flex items-center gap-1 bg-red-50 text-red-700 rounded-full px-2.5 py-1 text-xs font-bold flex-shrink-0">
                        <BadgePercent className="w-3.5 h-3.5" />
                        -{Math.round(item.discount)}%
                      </div>
                    )}
                  </div>

                  {/* Neighborhood & Address */}
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">{item.neighborhood}</p>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.address}</p>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="text-lg font-bold" style={{ color: '#1B2B5B' }}>
                      {formatCurrency(item.price)}
                    </div>
                    {item.appraisalValue > 0 && item.appraisalValue !== item.price && (
                      <div className="text-xs text-gray-400 line-through">
                        Avaliado em {formatCurrency(item.appraisalValue)}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.bedrooms > 0 && (
                      <span className="text-xs bg-gray-50 text-gray-600 rounded-lg px-2 py-1">
                        {item.bedrooms} {item.bedrooms === 1 ? 'quarto' : 'quartos'}
                      </span>
                    )}
                    {(item.totalArea > 0 || item.privateArea > 0) && (
                      <span className="text-xs bg-gray-50 text-gray-600 rounded-lg px-2 py-1">
                        {(item.totalArea || item.privateArea).toFixed(0)}m²
                      </span>
                    )}
                    {item.parkingSpots > 0 && (
                      <span className="text-xs bg-gray-50 text-gray-600 rounded-lg px-2 py-1">
                        {item.parkingSpots} {item.parkingSpots === 1 ? 'vaga' : 'vagas'}
                      </span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${getSaleTypeBadgeColor(item.saleType)}`}>
                      {getSaleTypeLabel(item.saleType)}
                    </span>
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium flex items-center gap-1 ${item.financeable ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      {item.financeable ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {item.financeable ? 'Financiável' : 'Sem financ.'}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-3 pt-0 flex gap-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110"
                    style={{ background: '#1B2B5B' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver na Caixa
                  </a>
                  <a
                    href={`https://wa.me/5516981010004?text=Olá! Tenho interesse no imóvel da Caixa: ${item.address}, ${item.city}. Código: ${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#25D366] transition-all hover:brightness-110"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Assessoria
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && auctions.length > 0 && (
          <div className="text-center py-16">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum imóvel encontrado com esses filtros.</p>
            <button
              onClick={() => { setFilterType(''); setFilterCity(''); setFilterSaleType(''); setFilterFinanceable(false) }}
              className="mt-3 text-sm text-[#1B2B5B] underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>

      {/* CONTEÚDO SEO */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl p-8 border space-y-6">
          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Tudo sobre Leilão de Imóveis em Franca/SP
          </h2>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">O que é leilão de imóveis?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">O leilão de imóveis é uma modalidade de venda onde propriedades são comercializadas por valores abaixo do mercado, geralmente por determinação judicial ou extrajudicial. Em Franca/SP, é possível encontrar excelentes oportunidades de casas, apartamentos e terrenos em leilão com descontos de até 40%.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Como participar de leilão de imóveis em Franca/SP?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Para participar de leilões em Franca/SP, você precisa de assessoria jurídica especializada para analisar a documentação, verificar débitos e garantir a regularidade do imóvel. A Imobiliária Lemos oferece consultoria completa para quem deseja arrematar imóveis com segurança.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Vantagens de comprar imóvel em leilão</h3>
            <p className="text-gray-600 text-sm leading-relaxed">Imóveis em leilão podem ser adquiridos por 30% a 50% abaixo do valor de mercado. No entanto, é fundamental verificar a situação jurídica, débitos de IPTU, condomínio e possíveis ocupações. Nossa equipe orienta você em cada etapa do processo.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Imobiliária Lemos e leilões em Franca</h3>
            <p className="text-gray-600 text-sm leading-relaxed">A Imobiliária Lemos, com mais de 22 anos de tradição em Franca/SP, acompanha o mercado de leilões e pode indicar as melhores oportunidades. Entre em contato para saber sobre imóveis disponíveis e receber assessoria especializada.</p>
          </div>
        </div>
      </section>

      {/* LINKS INTERNOS */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Explore Nosso Portfólio de Imóveis em Franca/SP
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/imoveis?city=Franca&type=HOUSE&purpose=SALE', label: 'Casas à Venda em Franca', icon: '🏠' },
            { href: '/imoveis?city=Franca&type=HOUSE&purpose=RENT', label: 'Casas para Alugar em Franca', icon: '🔑' },
            { href: '/imoveis?city=Franca&type=APARTMENT', label: 'Apartamentos em Franca', icon: '🏢' },
            { href: '/imoveis?city=Franca&type=LAND', label: 'Terrenos em Franca', icon: '📐' },
            { href: '/imoveis?city=Franca&type=WAREHOUSE', label: 'Galpões e Comerciais', icon: '🏭' },
            { href: '/imoveis?city=Franca&type=FARM', label: 'Chácaras e Sítios', icon: '🌳' },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-sm text-gray-800">{item.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Imobiliária Lemos — Franca/SP
          </h2>
          <p className="text-white/70 mb-5">22 anos de tradição · Assessoria completa em leilões</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href="tel:+551637230045"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
              <Phone className="w-4 h-4" /> (16) 3723-0045
            </a>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1B2B5B]"
              style={{ background: '#C9A84C' }}>
              <Home className="w-4 h-4" /> Página Inicial
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
