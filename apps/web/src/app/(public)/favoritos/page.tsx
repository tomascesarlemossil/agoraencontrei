'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, BedDouble, Bath, Car, Maximize, Building2, Loader2, Trash2 } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { FavoriteButton } from '@/components/FavoriteButton'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const fmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda',
  RENT: 'Aluguel',
  BOTH: 'Venda/Aluguel',
  SEASON: 'Temporada',
}

function PriceDisplay({ price, priceRent, purpose }: { price: number | null; priceRent: number | null; purpose: string }) {
  const hasSale = (purpose === 'SALE' || purpose === 'BOTH') && price
  const hasRent = (purpose === 'RENT' || purpose === 'BOTH' || purpose === 'SEASON') && priceRent

  if (purpose === 'BOTH' && hasSale && hasRent) {
    return (
      <div className="mt-3 space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Venda</span>
          <span className="text-sm font-bold" style={{ color: '#C9A84C' }}>{fmt.format(Number(price))}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Locacao</span>
          <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>{fmt.format(Number(priceRent))}/mes</span>
        </div>
      </div>
    )
  }
  if (hasRent) return <p className="text-base font-bold mt-3" style={{ color: '#1B2B5B' }}>{fmt.format(Number(priceRent))}/mes</p>
  if (hasSale) return <p className="text-base font-bold mt-3" style={{ color: '#1B2B5B' }}>{fmt.format(Number(price))}</p>
  return <p className="text-sm font-medium mt-3 text-gray-500">Consulte</p>
}

export default function FavoritosPage() {
  const { favorites, hydrated, clearFavorites } = useFavorites()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!hydrated) return

    if (favorites.length === 0) {
      setProperties([])
      setLoading(false)
      return
    }

    async function fetchFavorites() {
      setLoading(true)
      setError(false)
      try {
        const ids = favorites.join(',')
        const res = await fetch(`${API_URL}/api/v1/public/properties?ids=${ids}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setProperties(data.data ?? [])
      } catch {
        setError(true)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [hydrated, favorites])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-3"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            Meus Favoritos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {hydrated && !loading
              ? properties.length > 0
                ? `${properties.length} ${properties.length !== 1 ? 'imoveis favoritados' : 'imovel favoritado'}`
                : 'Nenhum imovel favoritado'
              : 'Carregando...'}
          </p>
        </div>

        {properties.length > 0 && (
          <button
            onClick={clearFavorites}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-red-200"
          >
            <Trash2 className="w-4 h-4" />
            Limpar tudo
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B2B5B' }} />
          <p className="text-gray-500 text-sm mt-3">Carregando favoritos...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">😔</p>
          <p className="text-gray-700 text-lg font-bold mb-2">Erro ao carregar favoritos</p>
          <p className="text-gray-500 text-sm mb-6">
            Nao foi possivel carregar seus imoveis favoritos. Tente novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && hydrated && properties.length === 0 && (
        <div className="text-center py-16">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(27, 43, 91, 0.08)' }}
          >
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-700 text-xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Nenhum imovel favoritado
          </p>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Explore nossos imoveis e clique no coracao para salvar seus favoritos. Eles aparecerdo aqui!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/imoveis"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
              style={{ backgroundColor: '#1B2B5B', color: 'white' }}
            >
              Explorar imoveis
            </Link>
            <Link
              href="/imoveis?purpose=SALE"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              Imoveis a venda
            </Link>
          </div>
        </div>
      )}

      {/* Properties grid */}
      {!loading && !error && properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p: any) => (
            <div key={p.id} className="relative group">
              <Link
                href={`/imoveis/${p.slug}`}
                className="block bg-white rounded-2xl overflow-hidden border hover:shadow-xl hover:border-transparent transition-all duration-300"
                style={{ borderColor: '#e8e4dc' }}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden" style={{ backgroundColor: '#f0ece4' }}>
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-20">
                      <Building2 className="w-10 h-10" style={{ color: '#1B2B5B' }} />
                      <span className="text-xs font-medium text-gray-500">Foto em breve</span>
                    </div>
                  )}

                  {/* Purpose badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: p.purpose === 'RENT' ? '#1B2B5B' : '#C9A84C',
                        color: p.purpose === 'RENT' ? 'white' : '#1B2B5B',
                      }}
                    >
                      {PURPOSE_LABEL[p.purpose] ?? p.purpose}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug group-hover:text-[#1B2B5B] transition-colors">
                    {p.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {[p.neighborhood, p.city].filter(Boolean).join(' · ')}
                  </p>
                  <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
                    {p.bedrooms > 0 && (
                      <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {p.bedrooms}</span>
                    )}
                    {p.bathrooms > 0 && (
                      <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms}</span>
                    )}
                    {p.parkingSpaces > 0 && (
                      <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {p.parkingSpaces}</span>
                    )}
                    {p.totalArea > 0 && (
                      <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {p.totalArea}m2</span>
                    )}
                  </div>
                  <PriceDisplay price={p.price} priceRent={p.priceRent} purpose={p.purpose} />
                </div>
              </Link>

              {/* Favorite button overlay */}
              <div className="absolute top-3 right-3 z-10">
                <FavoriteButton propertyId={p.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
