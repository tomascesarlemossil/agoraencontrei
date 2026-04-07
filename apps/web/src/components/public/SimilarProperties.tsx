'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BedDouble, Bath, Car, Maximize, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { CompareButton } from '@/components/CompareButton'

interface Property {
  id: string
  slug: string
  title: string
  type: string
  purpose: string
  price?: number | null
  priceRent?: number | null
  priceNegotiable?: boolean
  city?: string | null
  neighborhood?: string | null
  coverImage?: string | null
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number
  totalArea?: number | null
  reference?: string | null
  description?: string | null
}

const TYPE_LABEL: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Chácara/Sítio',
  RANCH: 'Rancho', WAREHOUSE: 'Galpão', OFFICE: 'Escritório', STORE: 'Loja',
  STUDIO: 'Studio', PENTHOUSE: 'Cobertura', CONDO: 'Condomínio', KITNET: 'Kitnet',
}

const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda', RENT: 'Aluguel', BOTH: 'Venda/Aluguel', SEASON: 'Temporada',
}

function fmtPrice(p: Property) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  if (p.purpose === 'RENT' && p.priceRent) return `${fmt(p.priceRent)}/mês`
  if (p.price) return fmt(p.price)
  return 'Consulte-nos'
}

interface Props {
  slug: string
  apiUrl: string
}

export function SimilarProperties({ slug, apiUrl }: Props) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/public/properties/${slug}/similar`)
      .then(r => r.json())
      .then(d => setProperties(Array.isArray(d) ? d : []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [slug, apiUrl])

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = 320
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="min-w-[290px] h-72 bg-gray-100 rounded-2xl animate-pulse flex-shrink-0" />
        ))}
      </div>
    )
  }

  if (properties.length === 0) return null

  return (
    <div className="relative">
      {/* Scroll buttons */}
      {properties.length > 2 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 border border-gray-100"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-gray-50 border border-gray-100"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {properties.map(p => (
          <Link
            key={p.id}
            href={`/imoveis/${p.slug}`}
            className="min-w-[290px] max-w-[290px] bg-white rounded-2xl border overflow-hidden flex-shrink-0 group hover:shadow-lg transition-shadow"
            style={{ borderColor: '#e8e4dc' }}
          >
            {/* Image */}
            <div className="relative h-44 bg-gray-100 overflow-hidden">
              {p.reference && (
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-white text-xs font-bold"
                  style={{ backgroundColor: '#e07742' }}>
                  Cód. {p.reference}
                </div>
              )}
              {/* Favorite & Compare buttons */}
              <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
                <FavoriteButton propertyId={p.id} />
                <CompareButton propertyId={p.id} />
              </div>
              {p.coverImage ? (
                <Image
                  src={p.coverImage}
                  alt={p.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="290px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="font-bold text-sm mb-0.5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                {fmtPrice(p)}
              </p>

              <p className="text-xs font-semibold text-gray-700 truncate">
                {TYPE_LABEL[p.type] ?? p.type}
              </p>

              {(p.neighborhood || p.city) && (
                <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  {[p.neighborhood, p.city].filter(Boolean).join(' - ')}
                </p>
              )}

              {p.description && (
                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t" style={{ borderColor: '#f0ece4' }}>
                {(p.bedrooms ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <BedDouble className="w-3.5 h-3.5" />
                    {p.bedrooms}
                  </span>
                )}
                {(p.bathrooms ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Bath className="w-3.5 h-3.5" />
                    {p.bathrooms}
                  </span>
                )}
                {(p.parkingSpaces ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Car className="w-3.5 h-3.5" />
                    {p.parkingSpaces}
                  </span>
                )}
                {p.totalArea && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Maximize className="w-3.5 h-3.5" />
                    {p.totalArea}m²
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
