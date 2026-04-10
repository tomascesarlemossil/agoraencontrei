import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PropertyCard, type Property } from '@/components/property/PropertyCard'
import { PropertyFilters, type FilterState } from '@/components/property/PropertyFilters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const ALL_PROPERTIES: Property[] = [
  {
    id: 'p01', referenceCode: 'AE-0001', slug: 'casa-jardim-america-4-quartos', title: 'Casa de Alto Padrão no Jardim América',
    purpose: 'venda', price: 1250000, priceNegotiable: true,
    address: { neighborhood: 'Jardim América', city: 'Franca', state: 'SP' },
    bedrooms: 4, bathrooms: 3, parking: 3, area: 320,
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop'],
    featured: true, investmentScore: 9.2,
  },
  {
    id: 'p02', referenceCode: 'AE-0002', slug: 'apartamento-centro-3-quartos', title: 'Apartamento Moderno no Centro',
    purpose: 'venda', price: 480000,
    address: { neighborhood: 'Centro', city: 'Franca', state: 'SP' },
    bedrooms: 3, bathrooms: 2, parking: 2, area: 125,
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop'],
    isNew: true, investmentScore: 8.5,
  },
  {
    id: 'p03', referenceCode: 'AE-0003', slug: 'chacara-rifaina-lazer', title: 'Chácara com Lazer Completo em Rifaina',
    purpose: 'venda', price: 890000,
    address: { neighborhood: 'Zona Rural', city: 'Rifaina', state: 'SP' },
    bedrooms: 5, bathrooms: 4, parking: 6, area: 5000,
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop'],
    featured: true, investmentScore: 8.8,
  },
  {
    id: 'p04', referenceCode: 'AE-0004', slug: 'casa-vila-elite-piscina', title: 'Casa Vila Elite com Piscina',
    purpose: 'venda', price: 680000,
    address: { neighborhood: 'Vila Elite', city: 'Franca', state: 'SP' },
    bedrooms: 3, bathrooms: 2, parking: 2, area: 200,
    images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop'],
    investmentScore: 8.1,
  },
  {
    id: 'p05', referenceCode: 'AE-0005', slug: 'apartamento-jardim-paulista-aluguel', title: 'Apartamento para Locação Jardim Paulista',
    purpose: 'aluguel', price: 2800,
    address: { neighborhood: 'Jardim Paulista', city: 'Franca', state: 'SP' },
    bedrooms: 2, bathrooms: 1, parking: 1, area: 75,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop'],
    investmentScore: 7.8,
  },
  {
    id: 'p06', referenceCode: 'AE-0006', slug: 'terreno-patrocinio-comercial', title: 'Terreno Comercial em Patrocínio Paulista',
    purpose: 'venda', price: 320000, priceNegotiable: true,
    address: { neighborhood: 'Centro', city: 'Patrocínio Paulista', state: 'SP' },
    bedrooms: 0, bathrooms: 0, parking: 0, area: 800,
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop'],
    isPriceReduced: true, investmentScore: 7.5,
  },
  {
    id: 'p07', referenceCode: 'AE-0007', slug: 'casa-nova-franca-2-quartos', title: 'Casa Nova de 2 Quartos no Parque das Flores',
    purpose: 'venda', price: 310000,
    address: { neighborhood: 'Parque das Flores', city: 'Franca', state: 'SP' },
    bedrooms: 2, bathrooms: 1, parking: 1, area: 90,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop'],
    isNew: true, investmentScore: 7.9,
  },
  {
    id: 'p08', referenceCode: 'AE-0008', slug: 'sala-comercial-centro-franca', title: 'Sala Comercial no Centro de Franca',
    purpose: 'aluguel', price: 3500,
    address: { neighborhood: 'Centro', city: 'Franca', state: 'SP' },
    bedrooms: 0, bathrooms: 1, parking: 2, area: 60,
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop'],
    investmentScore: 8.0,
  },
  {
    id: 'p09', referenceCode: 'AE-0009', slug: 'casa-condominio-franca-alto-padrao', title: 'Casa em Condomínio Fechado de Alto Padrão',
    purpose: 'venda', price: 980000,
    address: { neighborhood: 'Residencial das Palmeiras', city: 'Franca', state: 'SP' },
    bedrooms: 4, bathrooms: 3, parking: 3, area: 280,
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'],
    featured: true, investmentScore: 9.0,
  },
  {
    id: 'p10', referenceCode: 'AE-0010', slug: 'apartamento-ibiraci-2-quartos', title: 'Apartamento 2 Quartos em Ibiraci',
    purpose: 'venda', price: 230000,
    address: { neighborhood: 'Centro', city: 'Ibiraci', state: 'SP' },
    bedrooms: 2, bathrooms: 1, parking: 1, area: 70,
    images: ['https://images.unsplash.com/photo-1460317442991-0ec209397118?w=600&h=400&fit=crop'],
    investmentScore: 7.2,
  },
  {
    id: 'p11', referenceCode: 'AE-0011', slug: 'chacara-restinga-temporada', title: 'Chácara para Temporada em Restinga',
    purpose: 'temporada', price: 850,
    address: { neighborhood: 'Zona Rural', city: 'Restinga', state: 'SP' },
    bedrooms: 3, bathrooms: 2, parking: 4, area: 2000,
    images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop'],
    investmentScore: 8.3,
  },
  {
    id: 'p12', referenceCode: 'AE-0012', slug: 'terreno-residencial-franca-jardins', title: 'Terreno Residencial nos Jardins',
    purpose: 'venda', price: 185000,
    address: { neighborhood: 'Jardins', city: 'Franca', state: 'SP' },
    bedrooms: 0, bathrooms: 0, parking: 0, area: 360,
    images: ['https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=600&h=400&fit=crop'],
    isPriceReduced: true, investmentScore: 7.6,
  },
]

const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'mais-recente', label: 'Mais recente' },
]

const SIMILAR_SUGGESTIONS: Property[] = ALL_PROPERTIES.slice(0, 3)

const ITEMS_PER_PAGE = 9

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-navy-800/60 bg-navy-900/80 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-navy-800" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-navy-800 rounded w-2/3" />
        <div className="h-4 bg-navy-800 rounded w-full" />
        <div className="h-4 bg-navy-800 rounded w-1/2" />
        <div className="h-9 bg-navy-800 rounded-lg mt-4" />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('relevancia')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('q') || '',
    purpose: (searchParams.get('purpose') as 'comprar' | 'alugar') || 'comprar',
    types: searchParams.get('tipo') ? [searchParams.get('tipo') as any] : [],
    priceRange: [0, 5000000],
    bedrooms: [],
    cities: searchParams.get('cidade') ? [searchParams.get('cidade')!] : [],
    areaRange: [0, 1000],
    amenities: [],
    sortBy: 'relevancia',
  })

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('q', filters.search)
    if (filters.purpose) params.set('purpose', filters.purpose)
    if (filters.types.length) params.set('tipo', filters.types[0])
    if (filters.cities.length) params.set('cidade', filters.cities[0])
    setSearchParams(params, { replace: true })
    setPage(1)
  }, [filters])

  // Simulate loading
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [filters, sortBy])

  const filteredProperties = useMemo(() => {
    let results = [...ALL_PROPERTIES]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.address.neighborhood.toLowerCase().includes(q) ||
          p.address.city.toLowerCase().includes(q) ||
          p.referenceCode.toLowerCase().includes(q)
      )
    }

    if (filters.types.length > 0) {
      // type filter by title keywords
      results = results.filter((p) =>
        filters.types.some((t) => p.title.toLowerCase().includes(t) || p.slug.includes(t))
      )
    }

    if (filters.cities.length > 0) {
      results = results.filter((p) =>
        filters.cities.some((c) =>
          p.address.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').includes(c)
        )
      )
    }

    if (filters.bedrooms.length > 0) {
      results = results.filter((p) => filters.bedrooms.includes(p.bedrooms) || (filters.bedrooms.includes(4) && p.bedrooms >= 4))
    }

    results = results.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    )

    if (sortBy === 'menor-preco') results.sort((a, b) => a.price - b.price)
    else if (sortBy === 'maior-preco') results.sort((a, b) => b.price - a.price)
    else if (sortBy === 'mais-recente') results.reverse()
    else results.sort((a, b) => (b.investmentScore || 0) - (a.investmentScore || 0))

    return results
  }, [filters, sortBy])

  const totalCount = filteredProperties.length
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const paginatedProperties = filteredProperties.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const isEmpty = !loading && totalCount === 0

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: query }))
  }

  const searchTitle = filters.search
    ? `Resultados para "${filters.search}"`
    : filters.types.length
    ? `${filters.types[0].charAt(0).toUpperCase() + filters.types[0].slice(1)}s à venda`
    : 'Todos os Imóveis'

  return (
    <div className="min-h-screen bg-navy-950 text-foreground">
      <Header />

      {/* ── TOP SEARCH BAR ── */}
      <div className="pt-20 bg-navy-950 border-b border-navy-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-3 max-w-3xl">
            <div className="relative flex-1 flex gap-2 bg-navy-900 border border-navy-700 rounded-xl p-1.5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar por cidade, bairro, código de referência..."
                className="flex-1 bg-transparent pl-10 pr-4 py-2.5 text-foreground placeholder-foreground/40 text-sm outline-none font-sans"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-bold rounded-xl text-sm font-sans flex items-center gap-2 whitespace-nowrap transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar com IA</span>
              <span className="sm:hidden">Buscar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* ── SIDEBAR FILTERS (desktop) ── */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <PropertyFilters filters={filters} onChange={setFilters} />
            </div>
          </div>

          {/* ── RESULTS ── */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">{searchTitle}</h1>
                <p className="text-sm text-foreground/50 font-sans mt-0.5">
                  {loading ? 'Buscando...' : `${totalCount} imóveis encontrados`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden gap-2 border-navy-700 text-foreground/70"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </Button>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-navy-900 border border-navy-700 text-foreground/80 text-sm rounded-lg px-3 py-2 outline-none font-sans cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {/* View Toggle */}
                <div className="flex border border-navy-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setView('grid')}
                    className={cn(
                      'p-2 transition-colors',
                      view === 'grid' ? 'bg-gold-500/15 text-gold-400' : 'bg-navy-900 text-foreground/50 hover:text-foreground'
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={cn(
                      'p-2 transition-colors',
                      view === 'list' ? 'bg-gold-500/15 text-gold-400' : 'bg-navy-900 text-foreground/50 hover:text-foreground'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter badges */}
            {(filters.types.length > 0 || filters.cities.length > 0 || filters.bedrooms.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {filters.types.map((t) => (
                  <Badge key={t} variant="default" className="gap-1.5 pr-1.5">
                    {t}
                    <button onClick={() => setFilters((f) => ({ ...f, types: f.types.filter((x) => x !== t) }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.cities.map((c) => (
                  <Badge key={c} variant="default" className="gap-1.5 pr-1.5">
                    {c}
                    <button onClick={() => setFilters((f) => ({ ...f, cities: f.cities.filter((x) => x !== c) }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.bedrooms.map((b) => (
                  <Badge key={b} variant="default" className="gap-1.5 pr-1.5">
                    {b === 4 ? '4+' : b} quartos
                    <button onClick={() => setFilters((f) => ({ ...f, bedrooms: f.bedrooms.filter((x) => x !== b) }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className={cn(
                'grid gap-5',
                view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
              )}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Empty State */}
            {isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-navy-700 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-foreground/30" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-foreground/50 font-sans mb-2">
                  Não encontramos resultados para "{filters.search || 'sua busca'}".
                </p>
                <p className="text-foreground/40 font-sans text-sm mb-8">
                  Tente ajustar os filtros ou confira imóveis similares abaixo.
                </p>
                <Button
                  variant="outline"
                  className="border-gold-500/30 text-gold-400 hover:bg-gold-500/10"
                  onClick={() => setFilters((f) => ({ ...f, search: '', types: [], cities: [], bedrooms: [] }))}
                >
                  Limpar filtros
                </Button>

                <div className="mt-12">
                  <div className="flex items-center gap-2 mb-6 justify-center">
                    <Sparkles className="h-4 w-4 text-gold-400" />
                    <h4 className="font-display font-bold text-foreground">Sugestões similares</h4>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-5">
                    {SIMILAR_SUGGESTIONS.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Grid */}
            {!loading && !isEmpty && (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${view}-${page}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'grid gap-5',
                      view === 'grid'
                        ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1'
                    )}
                  >
                    {paginatedProperties.map((property, i) => (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                      >
                        <PropertyCard
                          property={property}
                          className={view === 'list' ? 'flex flex-row' : ''}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-navy-700 text-foreground/60 hover:text-foreground hover:border-navy-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={cn(
                          'w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-sans transition-all duration-200',
                          page === i + 1
                            ? 'bg-gold-500/15 border-gold-500/30 text-gold-400 font-semibold'
                            : 'border-navy-700 text-foreground/60 hover:text-foreground hover:border-navy-600'
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-navy-700 text-foreground/60 hover:text-foreground hover:border-navy-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE FILTERS DRAWER ── */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 bg-navy-950 border-r border-navy-800 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-navy-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-gold-400" />
                  <span className="font-semibold text-foreground font-sans">Filtros</span>
                </div>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-navy-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <PropertyFilters filters={filters} onChange={setFilters} />
              </div>
              <div className="p-5 border-t border-navy-800">
                <Button
                  className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Ver {totalCount} imóveis
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}
