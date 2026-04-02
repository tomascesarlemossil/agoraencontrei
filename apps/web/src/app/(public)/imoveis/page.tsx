import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PropertyFiltersForm } from './PropertyFiltersForm'
import { LoadMoreProperties } from './LoadMoreProperties'

export const metadata: Metadata = {
  title: 'Imóveis à Venda e Aluguel em Franca/SP | Imobiliária Lemos',
  description: 'Encontre casas à venda, apartamentos para alugar, terrenos e imóveis comerciais em Franca/SP e região. Imobiliária Lemos — CRECI 279051. Mais de 900 imóveis disponíveis.',
  keywords: 'imóveis franca sp, casas à venda franca sp, apartamentos para alugar franca sp, comprar casa franca sp, alugar apartamento franca sp, terrenos à venda franca sp, imóveis comerciais franca sp, casas franca bairros, apartamentos franca bairros, imóvel franca creci, imobiliária franca sp, casas baratas franca sp, apartamentos baratos franca sp, imóveis novos franca sp, imóveis usados franca sp, casas 2 quartos franca sp, casas 3 quartos franca sp, apartamentos 1 quarto franca sp, condomínio franca sp, sobrado franca sp, terreno loteamento franca sp, sala comercial franca sp, galpão franca sp, imóvel temporada franca sp',
  openGraph: {
    title: 'Imóveis à Venda e Aluguel em Franca/SP | Imobiliária Lemos',
    description: 'Mais de 900 imóveis disponíveis em Franca/SP. Casas, apartamentos, terrenos e comerciais para comprar ou alugar. CRECI 279051.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Imobiliária Lemos',
  },
}

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Dynamically import map to avoid SSR
const MapSearchClient = dynamic(() => import('./MapSearchWrapper'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: 580 }} />
  ),
})

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
  sortBy?: string
  view?: string
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
  if (params.bathrooms) qs.set('bathrooms', params.bathrooms)
  if (params.sortBy)    qs.set('sortBy', params.sortBy)
  qs.set('limit', '48')
  if (overrides) Object.entries(overrides).forEach(([k, v]) => v ? qs.set(k, v) : qs.delete(k))
  return qs
}

async function fetchProperties(params: SearchParams) {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?${buildQs(params)}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { data: [], meta: { total: 0, page: 1, totalPages: 1 } }
    return res.json()
  } catch {
    return { data: [], meta: { total: 0, page: 1, totalPages: 1 } }
  }
}

// Fetch "closest alternatives" when exact search yields 0 results
async function fetchAlternatives(params: SearchParams) {
  const attempts: Record<string, string>[] = [
    // Relax price
    { maxPrice: '', minPrice: '' },
    // Relax bedrooms
    { bedrooms: '' },
    // Relax neighborhood but keep city + type + purpose
    { neighborhood: '', search: '' },
    // Relax type but keep city + purpose
    { type: '', neighborhood: '', search: '' },
    // Just city + purpose
    { type: '', neighborhood: '', search: '', maxPrice: '', minPrice: '', bedrooms: '' },
    // Just purpose
    { type: '', neighborhood: '', search: '', city: '', maxPrice: '', minPrice: '', bedrooms: '' },
  ]

  for (const override of attempts) {
    try {
      const qs = buildQs(params, { ...override, limit: '8', page: '1' })
      const res = await fetch(`${API_URL}/api/v1/public/properties?${qs}`, { next: { revalidate: 60 } })
      if (!res.ok) continue
      const data = await res.json()
      if ((data.data ?? []).length > 0) return { items: data.data, relaxedBy: override }
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

export default async function ImoveisPage({ searchParams }: { searchParams: SearchParams }) {
  const isMapView = searchParams.view === 'map'
  const { data: properties, meta } = isMapView ? { data: [], meta: { total: 0, page: 1, totalPages: 1 } } : await fetchProperties(searchParams)

  // If no results, try to find closest alternatives
  const hasActiveSearch = !!(searchParams.search || searchParams.type || searchParams.city ||
    searchParams.neighborhood || searchParams.maxPrice || searchParams.bedrooms)
  const alternatives = (!isMapView && properties.length === 0 && hasActiveSearch)
    ? await fetchAlternatives(searchParams)
    : { items: [], relaxedBy: {} }

  const title = searchParams.purpose === 'SALE'
    ? 'Imóveis à Venda'
    : searchParams.purpose === 'RENT'
    ? 'Imóveis para Alugar'
    : searchParams.purpose === 'SEASON'
    ? 'Temporada'
    : 'Todos os Imóveis'

  // Build URL for switching view
  const viewParams = new URLSearchParams(searchParams as Record<string, string>)
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
        <div
          className="flex rounded-xl p-0.5 flex-shrink-0"
          style={{ backgroundColor: '#f0ece4' }}
        >
          <Link
            href={listViewUrl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={!isMapView
              ? { backgroundColor: 'white', color: '#1B2B5B', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: '#9ca3af' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Lista
          </Link>
          <Link
            href={mapViewUrl}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={isMapView
              ? { backgroundColor: 'white', color: '#1B2B5B', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: '#9ca3af' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Mapa
          </Link>
        </div>
      </div>

      <PropertyFiltersForm initialValues={searchParams as Record<string, string | undefined>} />

      {isMapView ? (
        <MapSearchClient
          initialPurpose={searchParams.purpose}
          initialCity={searchParams.city}
          initialMaxPrice={searchParams.maxPrice}
          initialBedrooms={searchParams.bedrooms}
        />
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-700 text-xl font-bold mb-1">Nenhum imóvel encontrado com esses filtros</p>
          <p className="text-gray-400 text-sm mb-6">Tente ajustar ou remover alguns filtros para ampliar a busca.</p>
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
              <p className="text-sm text-gray-400 mb-5">
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
          searchParams={searchParams as Record<string, string | undefined>}
        />
      )}
    </div>
  )
}
