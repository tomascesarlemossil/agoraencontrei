'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BedDouble, Bath, Car, Maximize, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda', RENT: 'Aluguel', BOTH: 'Venda/Aluguel', SEASON: 'Temporada',
}

function formatPrice(price: number | null, priceRent: number | null, purpose: string) {
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  if (purpose === 'RENT' && priceRent) return `${formatter.format(priceRent)}/mês`
  if (price) return formatter.format(price)
  return 'Consulte'
}

function PropertyCard({ p }: { p: any }) {
  return (
    <Link
      href={`/imoveis/${p.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border hover:shadow-xl hover:border-transparent transition-all duration-300"
      style={{ borderColor: '#e8e4dc' }}
    >
      <div className="relative h-52 overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
        {p.coverImage ? (
          <Image
            src={p.coverImage}
            alt={p.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">🏠</div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: p.purpose === 'RENT' ? '#1B2B5B' : '#C9A84C',
              color: p.purpose === 'RENT' ? 'white' : '#1B2B5B',
            }}
          >
            {PURPOSE_LABEL[p.purpose] ?? p.purpose}
          </span>
          {p.isFeatured && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: '#1B2B5B' }}>
              ★ Destaque
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug group-hover:text-[#1B2B5B] transition-colors">
          {p.title}
        </p>
        <p className="text-xs text-gray-400 mt-1 truncate">
          {[p.neighborhood, p.city].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
          {p.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {p.bedrooms}</span>}
          {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms}</span>}
          {p.parkingSpaces > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {p.parkingSpaces}</span>}
          {p.totalArea > 0 && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {p.totalArea}m²</span>}
        </div>
        <p className="text-base font-bold mt-3" style={{ color: '#1B2B5B' }}>
          {formatPrice(p.price, p.priceRent, p.purpose)}
        </p>
      </div>
    </Link>
  )
}

interface Props {
  initialProperties: any[]
  initialTotal: number
  initialTotalPages: number
  searchParams: Record<string, string | undefined>
}

export function LoadMoreProperties({ initialProperties, initialTotal, initialTotalPages, searchParams }: Props) {
  const [properties, setProperties] = useState(initialProperties)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialTotalPages > 1)

  const loadMore = useCallback(async () => {
    setLoading(true)
    const nextPage = page + 1
    const qs = new URLSearchParams()
    qs.set('limit', '48')
    qs.set('page', String(nextPage))
    if (searchParams.search) qs.set('search', searchParams.search)
    if (searchParams.type) qs.set('type', searchParams.type)
    if (searchParams.purpose) qs.set('purpose', searchParams.purpose)
    if (searchParams.city) qs.set('city', searchParams.city)
    if (searchParams.minPrice) qs.set('minPrice', searchParams.minPrice)
    if (searchParams.maxPrice) qs.set('maxPrice', searchParams.maxPrice)
    if (searchParams.bedrooms) qs.set('bedrooms', searchParams.bedrooms)
    if (searchParams.sortBy) qs.set('sortBy', searchParams.sortBy)

    try {
      const res = await fetch(`${API_URL}/api/v1/public/properties?${qs}`)
      const data = await res.json()
      setProperties(prev => [...prev, ...(data.data ?? [])])
      setPage(nextPage)
      setHasMore(nextPage < data.meta.totalPages)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, searchParams])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {properties.map((p: any) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>

      {properties.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-400">
          Mostrando {properties.length} de {initialTotal.toLocaleString('pt-BR')} imóveis
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: '#1B2B5B', color: 'white' }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</>
            ) : (
              'Carregar mais imóveis'
            )}
          </button>
        </div>
      )}
    </>
  )
}
