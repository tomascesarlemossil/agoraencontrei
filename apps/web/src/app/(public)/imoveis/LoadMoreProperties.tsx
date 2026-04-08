'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { BedDouble, Bath, Car, Maximize, Loader2, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { FavoriteButton } from '@/components/FavoriteButton'
import { CompareButton } from '@/components/CompareButton'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda', RENT: 'Aluguel', BOTH: 'Venda/Aluguel', SEASON: 'Temporada',
}

// Known fake/placeholder image patterns from Buscaimo platform
const FAKE_IMAGE_PATTERNS = [
  'send.png', 'telefone.png', 'logotopo.png', 'foto_vazio.png',
  'foto-corretor.png', 'logo_uso.png', 'logo_rodape.png',
  '/images/logo', '/images/banner', 'whatsapp',
]

function isRealImage(url: string | null | undefined): boolean {
  if (!url) return false
  return !FAKE_IMAGE_PATTERNS.some(pat => url.includes(pat))
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

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
          <span className="text-xs font-medium text-gray-500">Locação</span>
          <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>{fmt.format(Number(priceRent))}/mês</span>
        </div>
      </div>
    )
  }
  if (hasRent) return <p className="text-base font-bold mt-3" style={{ color: '#1B2B5B' }}>{fmt.format(Number(priceRent))}/mês</p>
  if (hasSale) return <p className="text-base font-bold mt-3" style={{ color: '#1B2B5B' }}>{fmt.format(Number(price))}</p>
  return <p className="text-sm font-medium mt-3 text-gray-500">Consulte</p>
}

function PropertyCardCarousel({ images, coverImage, title, isFeatured, purpose, propertyId }: {
  images?: string[] | null
  coverImage?: string | null
  title: string
  isFeatured?: boolean
  purpose: string
  propertyId: string
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Build real images list
  const allImages = [
    coverImage,
    ...((images ?? []).filter(url => url !== coverImage)),
  ].filter(url => isRealImage(url)) as string[]

  const hasMultiple = allImages.length > 1

  useEffect(() => {
    if (isHovered && hasMultiple) {
      timerRef.current = setInterval(() => {
        setCurrentIdx(i => (i + 1) % allImages.length)
      }, 1200)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (!isHovered) setCurrentIdx(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isHovered, hasMultiple, allImages.length])

  const currentImage = allImages[currentIdx] ?? null

  function goTo(idx: number, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIdx(idx)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="relative h-52 overflow-hidden"
      style={{ backgroundColor: '#f0ece4' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentImage && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentImage}
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-all duration-500"
          style={{ transform: isHovered && !hasMultiple ? 'scale(1.05)' : 'scale(1)' }}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Fallback profissional — gradiente com ícone e texto */
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{
            background: 'linear-gradient(135deg, #1B2B5B 0%, #243d7a 60%, #1a3366 100%)',
          }}
        >
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" opacity="0.5">
            <path d="M8 36L32 12L56 36" stroke="#C9A84C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 30V52C14 53.1 14.9 54 16 54H26V42H38V54H48C49.1 54 50 53.1 50 52V30" stroke="#C9A84C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="27" y="42" width="10" height="12" rx="1" fill="#C9A84C" opacity="0.3"/>
          </svg>
          <div className="text-center px-4">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Imóvel</p>
            <p className="text-white/40 text-[10px] mt-0.5">Foto em breve</p>
          </div>
        </div>
      )}

      {/* Dot indicators */}
      {hasMultiple && isHovered && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10" role="tablist" aria-label="Fotos do imóvel">
          {allImages.slice(0, 8).map((_, i) => (
            <button
              key={i}
              onClick={(e) => goTo(i, e)}
              className="rounded-full transition-all"
              role="tab"
              aria-selected={i === currentIdx}
              aria-label={`Foto ${i + 1} de ${Math.min(allImages.length, 8)}`}
              style={{
                width: i === currentIdx ? 16 : 6,
                height: 6,
                backgroundColor: i === currentIdx ? 'white' : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </div>
      )}

      {/* Photo count badge */}
      {allImages.length > 1 && !isHovered && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-semibold" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          📷 {allImages.length}
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-3 left-3 flex gap-1.5">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: purpose === 'RENT' ? '#1B2B5B' : '#C9A84C',
            color: purpose === 'RENT' ? 'white' : '#1B2B5B',
          }}
        >
          {PURPOSE_LABEL[purpose] ?? purpose}
        </span>
        {isFeatured && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: '#1B2B5B' }}>
            ★ Destaque
          </span>
        )}
      </div>

      {/* Favorite & Compare buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <FavoriteButton propertyId={propertyId} />
        <CompareButton propertyId={propertyId} />
      </div>
    </div>
  )
}

function PropertyCard({ p }: { p: any }) {
  return (
    <Link
      href={`/imoveis/${p.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border hover:shadow-xl hover:border-transparent transition-all duration-300"
      style={{ borderColor: '#e8e4dc' }}
    >
      <PropertyCardCarousel
        images={p.images}
        coverImage={p.coverImage}
        title={p.title}
        isFeatured={p.isFeatured}
        purpose={p.purpose}
        propertyId={p.id}
      />
      <div className="p-4">
        <p className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug group-hover:text-[#1B2B5B] transition-colors">
          {p.title}
        </p>
        <p className="text-xs text-gray-500 mt-1 truncate">
          {[p.neighborhood, p.city].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
          {p.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {p.bedrooms}</span>}
          {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms}</span>}
          {p.parkingSpaces > 0 && <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {p.parkingSpaces}</span>}
          {p.totalArea > 0 && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {p.totalArea}m²</span>}
        </div>
        <PriceDisplay price={p.price} priceRent={p.priceRent} purpose={p.purpose} />
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
    if (searchParams.neighborhood) qs.set('neighborhood', searchParams.neighborhood)
    if (searchParams.minPrice) qs.set('minPrice', searchParams.minPrice)
    if (searchParams.maxPrice) qs.set('maxPrice', searchParams.maxPrice)
    if (searchParams.bedrooms) qs.set('bedrooms', searchParams.bedrooms)
    if (searchParams.minArea) qs.set('minArea', searchParams.minArea)
    if (searchParams.maxArea) qs.set('maxArea', searchParams.maxArea)
    if (searchParams.bathrooms) qs.set('bathrooms', searchParams.bathrooms)
    if (searchParams.closedCondo) qs.set('closedCondo', searchParams.closedCondo)
    // Sort: decompose the user-facing `sort` param into API `sortBy` + `sortOrder`
    const SORT_MAP: Record<string, { sortBy: string; sortOrder: string }> = {
      'createdAt_desc': { sortBy: 'createdAt', sortOrder: 'desc' },
      'price_asc':      { sortBy: 'price',     sortOrder: 'asc'  },
      'price_desc':     { sortBy: 'price',     sortOrder: 'desc' },
      'views_desc':     { sortBy: 'views',     sortOrder: 'desc' },
    }
    const sortVal = searchParams.sort ?? 'createdAt_desc'
    const sortParsed = SORT_MAP[sortVal] ?? { sortBy: 'createdAt', sortOrder: 'desc' }
    qs.set('sortBy', sortParsed.sortBy)
    qs.set('sortOrder', sortParsed.sortOrder)

    try {
      const res = await fetch(`${API_URL}/api/v1/public/properties?${qs}`)
      if (!res.ok) { setHasMore(false); return }
      const data = await res.json()
      const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
      setProperties(prev => [...prev, ...items])
      setPage(nextPage)
      setHasMore(nextPage < (data?.meta?.totalPages ?? data?.pagination?.totalPages ?? 1))
    } catch {
      setHasMore(false)
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
        <div className="mt-8 text-center text-sm text-gray-500">
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
