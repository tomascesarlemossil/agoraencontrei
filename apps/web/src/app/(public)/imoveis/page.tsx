import type { Metadata } from 'next'
import Link from 'next/link'
import { PropertyFiltersForm } from './PropertyFiltersForm'
import { LoadMoreProperties } from './LoadMoreProperties'

export const metadata: Metadata = {
  title: 'Imóveis à Venda e Aluguel | Franca e Região',
  description: 'Encontre casas, apartamentos, terrenos e imóveis comerciais para comprar ou alugar em Franca e região. Imobiliária Lemos — CRECI 279051.',
}

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface SearchParams {
  page?: string
  search?: string
  type?: string
  purpose?: string
  city?: string
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  sortBy?: string
}

async function fetchProperties(params: SearchParams) {
  const qs = new URLSearchParams()
  if (params.page)     qs.set('page', params.page)
  if (params.search)   qs.set('search', params.search)
  if (params.type)     qs.set('type', params.type)
  if (params.purpose)  qs.set('purpose', params.purpose)
  if (params.city)     qs.set('city', params.city)
  if (params.minPrice) qs.set('minPrice', params.minPrice)
  if (params.maxPrice) qs.set('maxPrice', params.maxPrice)
  if (params.bedrooms) qs.set('bedrooms', params.bedrooms)
  if (params.sortBy)   qs.set('sortBy', params.sortBy)
  qs.set('limit', '48')

  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?${qs}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { data: [], meta: { total: 0, page: 1, totalPages: 1 } }
    return res.json()
  } catch {
    return { data: [], meta: { total: 0, page: 1, totalPages: 1 } }
  }
}

function formatPrice(price: number | null, priceRent: number | null, purpose: string) {
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  if (purpose === 'RENT' && priceRent) return `${formatter.format(priceRent)}/mês`
  if (price) return formatter.format(price)
  return 'Consulte'
}

export default async function ImoveisPage({ searchParams }: { searchParams: SearchParams }) {
  const { data: properties, meta } = await fetchProperties(searchParams)

  const title = searchParams.purpose === 'SALE'
    ? 'Imóveis à Venda'
    : searchParams.purpose === 'RENT'
    ? 'Imóveis para Alugar'
    : searchParams.purpose === 'SEASON'
    ? 'Temporada'
    : 'Todos os Imóveis'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          {title}
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {meta.total > 0
            ? `${meta.total.toLocaleString('pt-BR')} ${meta.total !== 1 ? 'imóveis' : 'imóvel'} encontrado${meta.total !== 1 ? 's' : ''}`
            : 'Nenhum imóvel encontrado'}
        </p>
      </div>

      <PropertyFiltersForm initialValues={searchParams as Record<string, string | undefined>} />

      {properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏠</p>
          <p className="text-gray-500 text-lg font-medium">Nenhum imóvel encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros ou ampliar a busca.</p>
          <Link
            href="/imoveis"
            className="inline-block mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: '#1B2B5B', color: 'white' }}
          >
            Ver todos os imóveis
          </Link>
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
