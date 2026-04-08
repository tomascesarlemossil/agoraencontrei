import type { Metadata } from 'next'
import Link from 'next/link'
import { PropertyFiltersForm } from './PropertyFiltersForm'
import { LoadMoreProperties } from './LoadMoreProperties'
import MapSearchClient from './MapSearchWrapper'

export const metadata: Metadata = {
  title: 'Imóveis à Venda e Aluguel em Franca/SP',
  description: 'Encontre casas à venda, apartamentos para alugar, terrenos e imóveis comerciais em Franca/SP e região. AgoraEncontrei — Imobiliária Lemos.. 1.000+ imóveis com busca por IA e mapa interativo.',
  keywords: 'imóveis franca sp, casas à venda franca sp, apartamentos para alugar franca sp, comprar casa franca sp, alugar apartamento franca sp, terrenos à venda franca sp, imóveis comerciais franca sp, casas franca bairros, apartamentos franca bairros, imóvel franca creci, imobiliária franca sp, agoraencontrei imóveis, marketplace imobiliário franca, busca imóvel IA, casas baratas franca sp, apartamentos baratos franca sp, imóveis novos franca sp, casas 3 quartos franca sp, condomínio franca sp, sobrado franca sp, terreno loteamento franca sp, sala comercial franca sp',
  openGraph: {
    title: 'Imóveis à Venda e Aluguel em Franca/SP | AgoraEncontrei',
    description: '1.000+ imóveis em Franca/SP. Casas, apartamentos, terrenos e comerciais. Busca com IA e mapa interativo. Marketplace da Imobiliária Lemos.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
}

export const revalidate = 60

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Map is loaded via MapSearchWrapper (client component) — no dynamic import needed in server component

interface SearchParams {
  page?: string
  search?: string
  type?: string
  purpose?: string
  city?: string
  neighborhood?: string
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  minArea?: string
  maxArea?: string
  bathrooms?: string
  sort?: string
  sortBy?: string
  sortOrder?: string
  view?: string
  closedCondo?: string
}

// Map the user-facing `sort` param to API `sortBy` + `sortOrder`
const SORT_MAP: Record<string, { sortBy: string; sortOrder: string }> = {
  'createdAt_desc': { sortBy: 'createdAt', sortOrder: 'desc' },
  'price_asc':      { sortBy: 'price',     sortOrder: 'asc'  },
  'price_desc':     { sortBy: 'price',     sortOrder: 'desc' },
  'views_desc':     { sortBy: 'views',     sortOrder: 'desc' },
}

function parseSortParam(params: SearchParams): { sortBy: string; sortOrder: string } {
  if (params.sort && SORT_MAP[params.sort]) return SORT_MAP[params.sort]
  // Legacy support: if sortBy was passed directly (old URLs)
  if (params.sortBy === '-price') return { sortBy: 'price', sortOrder: 'desc' }
  if (params.sortBy === 'price')  return { sortBy: 'price', sortOrder: 'asc'  }
  if (params.sortBy === 'views')  return { sortBy: 'views', sortOrder: 'desc' }
  if (params.sortBy)              return { sortBy: params.sortBy, sortOrder: params.sortOrder ?? 'desc' }
  return { sortBy: 'createdAt', sortOrder: 'desc' }
}

function buildQs(params: SearchParams, overrides?: Record<string, string>) {
  const qs = new URLSearchParams()
  if (params.page)     qs.set('page', params.page)
  if (params.search)   qs.set('search', params.search)
  if (params.type)     qs.set('type', params.type)
  if (params.purpose)  qs.set('purpose', params.purpose)
  if (params.city)     qs.set('city', params.city)
  if (params.neighborhood) qs.set('neighborhood', params.neighborhood)
  if (params.minPrice) qs.set('minPrice', params.minPrice)
  if (params.maxPrice) qs.set('maxPrice', params.maxPrice)
  if (params.bedrooms)  qs.set('bedrooms', params.bedrooms)
  if (params.minArea)   qs.set('minArea', params.minArea)
  if (params.maxArea)   qs.set('maxArea', params.maxArea)
  if (params.bathrooms)   qs.set('bathrooms', params.bathrooms)
  if (params.closedCondo) qs.set('closedCondo', params.closedCondo)
  const { sortBy, sortOrder } = parseSortParam(params)
  qs.set('sortBy', sortBy)
  qs.set('sortOrder', sortOrder)
  qs.set('limit', '48')
  if (overrides) Object.entries(overrides).forEach(([k, v]) => v ? qs.set(k, v) : qs.delete(k))
  return qs
}

const EMPTY_RESULT = { data: [], meta: { total: 0, page: 1, totalPages: 1 } }

async function fetchProperties(params: SearchParams) {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?${buildQs(params)}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return EMPTY_RESULT
    const json = await res.json()
    return {
      data: Array.isArray(json?.data) ? json.data : [],
      meta: {
        total: json?.meta?.total ?? 0,
        page: json?.meta?.page ?? 1,
        totalPages: json?.meta?.totalPages ?? 1,
      },
    }
  } catch {
    return EMPTY_RESULT
  }
}

// Tipos residenciais/urbanos — nunca misturar com rurais no fallback
const RESIDENTIAL_TYPES = ['HOUSE', 'APARTMENT', 'STUDIO', 'KITNET', 'PENTHOUSE', 'CONDO']
const RURAL_TYPES = ['FARM', 'RANCH']

// Fetch "closest alternatives" when exact search yields 0 results
async function fetchAlternatives(params: SearchParams) {
  // Determine if the original search was for residential types
  const isResidential = params.type && RESIDENTIAL_TYPES.includes(params.type.toUpperCase())
  const isRural = params.type && RURAL_TYPES.includes(params.type.toUpperCase())

  // Build attempts — never drop to "just purpose" if that would mix rural/residential
  const attempts: Record<string, string>[] = [
    // Relax price
    { maxPrice: '', minPrice: '' },
    // Relax bedrooms
    { bedrooms: '' },
    // Relax neighborhood but keep city + type + purpose
    { neighborhood: '', search: '' },
    // Relax type but keep city + purpose (only if not residential — avoid mixing with farms)
    ...(!isResidential ? [{ type: '', neighborhood: '', search: '' }] : []),
    // Just city + purpose (keep type for residential to avoid showing farms)
    ...(isResidential
      ? [{ neighborhood: '', search: '', maxPrice: '', minPrice: '', bedrooms: '' }]
      : [{ type: '', neighborhood: '', search: '', maxPrice: '', minPrice: '', bedrooms: '' }]
    ),
    // City + purpose + residential types filter (last resort for residential)
    ...(isResidential ? [{ neighborhood: '', search: '', maxPrice: '', minPrice: '', bedrooms: '', city: params.city || 'Franca' }] : []),
  ]

  for (const override of attempts) {
    try {
      const qs = buildQs(params, { ...override, limit: '8', page: '1' })
      const res = await fetch(`${API_URL}/api/v1/public/properties?${qs}`, { next: { revalidate: 60 } })
      if (!res.ok) continue
      const data = await res.json()
      const items: any[] = Array.isArray(data?.data) ? data.data : []
      if (items.length === 0) continue

      // Filter out rural types when searching for residential
      const filtered = isResidential
        ? items.filter((p: any) => !RURAL_TYPES.includes(p.type))
        : isRural
        ? items.filter((p: any) => RURAL_TYPES.includes(p.type))
        : items

      if (filtered.length > 0) return { items: filtered, relaxedBy: override }
    } catch {}
  }
  return { items: [], relaxedBy: {} }
}

function formatPrice(price: number | null, priceRent: number | null, purpose: string) {
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  if (purpose === 'RENT' && priceRent) return `${formatter.format(priceRent)}/mês`
  if (price) return formatter.format(price)
  return 'Consulte'
}

export default async function ImoveisPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const isMapView = resolvedSearchParams.view === 'map'
  const { data: properties, meta } = isMapView ? { data: [], meta: { total: 0, page: 1, totalPages: 1 } } : await fetchProperties(resolvedSearchParams)

  // SSR pre-fetch clusters for Franca/SP BBOX — eliminates map loading delay
  let initialClusters: any[] = []
  if (isMapView) {
    try {
      const clusterParams = new URLSearchParams({
        swLat: '-20.65', swLng: '-47.52', neLat: '-20.40', neLng: '-47.28',
      })
      if (resolvedSearchParams.purpose) clusterParams.set('purpose', resolvedSearchParams.purpose)
      const clusterRes = await fetch(
        `${API_URL}/api/v1/public/map-clusters?${clusterParams}`,
        { next: { revalidate: 120 } }
      )
      if (clusterRes.ok) {
        const clusterData = await clusterRes.json()
        initialClusters = Array.isArray(clusterData) ? clusterData : []
      }
    } catch {}
  }

  // If no results, try to find closest alternatives
  const hasActiveSearch = !!(resolvedSearchParams.search || resolvedSearchParams.type || resolvedSearchParams.city ||
    resolvedSearchParams.neighborhood || resolvedSearchParams.maxPrice || resolvedSearchParams.bedrooms)
  const alternatives = (!isMapView && properties.length === 0 && hasActiveSearch)
    ? await fetchAlternatives(resolvedSearchParams)
    : { items: [], relaxedBy: {} }

  const title = resolvedSearchParams.purpose === 'SALE'
    ? 'Imóveis à Venda'
    : resolvedSearchParams.purpose === 'RENT'
    ? 'Imóveis para Alugar'
    : resolvedSearchParams.purpose === 'SEASON'
    ? 'Temporada'
    : 'Todos os Imóveis'

  // Build URL for switching view
  const viewParams = new URLSearchParams(resolvedSearchParams as Record<string, string>)
  viewParams.delete('view')
  const listViewUrl = `/imoveis?${viewParams}`
  viewParams.set('view', 'map')
  const mapViewUrl = `/imoveis?${viewParams}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            {title}
          </h1>
          {!isMapView && (
            <p className="text-gray-500 text-sm mt-0.5">
              {meta.total > 0
                ? `${meta.total.toLocaleString('pt-BR')} ${meta.total !== 1 ? 'imóveis' : 'imóvel'} encontrado${meta.total !== 1 ? 's' : ''}`
                : 'Nenhum imóvel encontrado'}
            </p>
          )}
        </div>

        {/* List / Map toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isMapView ? (
            <Link
              href={listViewUrl}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ backgroundColor: '#f0ece4', color: '#6b7280' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Ver Lista
            </Link>
          ) : (
            <Link
              href={mapViewUrl}
              className="group relative flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 hover:shadow-2xl shadow-lg overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #e6c96a 50%, #C9A84C 100%)',
                color: '#1B2B5B',
              }}
            >
              {/* Shimmer effect */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                  backgroundSize: '200% 100%',
                }}
              />
              {/* Pulsing dot */}
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#1B2B5B' }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#1B2B5B' }} />
              </span>
              <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="relative z-10">Buscar no Mapa</span>
            </Link>
          )}
        </div>
      </div>

      <PropertyFiltersForm initialValues={resolvedSearchParams as Record<string, string | undefined>} />

      {/* Map CTA banner — only shown in list view */}
      {!isMapView && (
        <Link
          href={mapViewUrl}
          className="group relative flex items-center justify-between gap-4 px-6 py-4 rounded-2xl mb-6 overflow-hidden transition-all hover:shadow-xl hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)' }}
        >
          {/* Background map dots pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          {/* Shimmer on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%)' }} />

          <div className="relative z-10 flex items-center gap-4">
            {/* Map icon with glow */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#C9A84C" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">
                Explore imóveis no Mapa Interativo
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(201,168,76,0.9)' }}>
                Desenhe sua área ideal e encontre imóveis por bairro em Franca/SP
              </p>
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #e6c96a)', color: '#1B2B5B' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            Abrir Mapa
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Link>
      )}

      {isMapView ? (
        <MapSearchClient
          initialPurpose={resolvedSearchParams.purpose}
          initialCity={resolvedSearchParams.city}
          initialMaxPrice={resolvedSearchParams.maxPrice}
          initialBedrooms={resolvedSearchParams.bedrooms}
          initialClusters={initialClusters}
        />
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-700 text-xl font-bold mb-1">Nenhum imóvel encontrado com esses filtros</p>
          <p className="text-gray-500 text-sm mb-6">Tente ajustar ou remover alguns filtros para ampliar a busca.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              href="/imoveis"
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
              style={{ backgroundColor: '#1B2B5B', color: 'white' }}
            >
              Ver todos os imóveis
            </Link>
            <a
              href="https://wa.me/5516981010004?text=Olá! Não encontrei o imóvel que procuro no site. Pode me ajudar?"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:bg-gray-50"
              style={{ borderColor: '#25D366', color: '#25D366' }}
            >
              Falar com corretor
            </a>
          </div>
          {/* Closest alternatives */}
          {alternatives.items.length > 0 && (
            <div className="text-left">
              <p className="text-base font-bold mb-1" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                Imóveis mais próximos da sua busca:
              </p>
              <p className="text-sm text-gray-500 mb-5">
                Não encontramos exatamente o que você procura, mas separamos opções similares:
              </p>
              <LoadMoreProperties
                initialProperties={alternatives.items}
                initialTotal={alternatives.items.length}
                initialTotalPages={1}
                searchParams={{}}
              />
            </div>
          )}
        </div>
      ) : (
        <LoadMoreProperties
          initialProperties={properties}
          initialTotal={meta.total}
          initialTotalPages={meta.totalPages}
          searchParams={resolvedSearchParams as Record<string, string | undefined>}
        />
      )}
    </div>
  )
}
