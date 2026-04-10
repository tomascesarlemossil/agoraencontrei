import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Bed,
  Bath,
  Car,
  Maximize2,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface Property {
  id: string
  referenceCode: string
  slug: string
  title: string
  purpose: 'venda' | 'aluguel' | 'temporada'
  price: number
  priceNegotiable?: boolean
  address: {
    neighborhood: string
    city: string
    state: string
  }
  bedrooms: number
  bathrooms: number
  parking: number
  area: number
  images: string[]
  featured?: boolean
  isNew?: boolean
  isPriceReduced?: boolean
  investmentScore?: number // 0-10, from AI
  description?: string
}

interface PropertyCardProps {
  property: Property
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void
  initialFavorite?: boolean
  className?: string
  href?: string
}

const WHATSAPP_BASE = 'https://wa.me/5516981010004'

function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const count = images.length

  const prev = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setCurrent((c) => (c - 1 + count) % count)
    },
    [count]
  )

  const next = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setCurrent((c) => (c + 1) % count)
    },
    [count]
  )

  return (
    <div className="relative overflow-hidden rounded-t-xl aspect-[4/3] bg-navy-900 group/carousel">
      {/* Images */}
      {images.map((src, i) => (
        <div
          key={i}
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            i === current ? 'opacity-100' : 'opacity-0'
          )}
        >
          {!loaded[i] && (
            <div className="absolute inset-0 bg-navy-800 animate-pulse" />
          )}
          <img
            src={src}
            alt={`${title} - foto ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              loaded[i] ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-black/70 z-10"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 hover:bg-black/70 z-10"
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCurrent(i)
                }}
                className={cn(
                  'rounded-full transition-all duration-200',
                  i === current ? 'w-4 h-1.5 bg-gold-400' : 'w-1.5 h-1.5 bg-white/50'
                )}
                aria-label={`Ir para foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Image count badge */}
      {count > 1 && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-sans z-10">
          {current + 1}/{count}
        </div>
      )}
    </div>
  )
}

export function PropertyCard({
  property,
  onFavoriteToggle,
  initialFavorite = false,
  className,
  href,
}: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [favoriteAnimating, setFavoriteAnimating] = useState(false)

  const cardHref = href || `/imovel/${property.slug}`

  const toggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const next = !isFavorite
      setIsFavorite(next)
      setFavoriteAnimating(true)
      setTimeout(() => setFavoriteAnimating(false), 300)
      onFavoriteToggle?.(property.id, next)
    },
    [isFavorite, property.id, onFavoriteToggle]
  )

  const whatsappMessage = encodeURIComponent(
    `Olá! Tenho interesse no imóvel: ${property.title} - ${formatCurrency(property.price)}${property.purpose === 'aluguel' ? '/mês' : ''}. Ref: ${property.referenceCode}`
  )
  const whatsappUrl = `${WHATSAPP_BASE}?text=${whatsappMessage}`

  const images =
    property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop']

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-navy-800/60 bg-navy-900/80 backdrop-blur-sm',
        'transition-all duration-300 ease-out overflow-hidden',
        'hover:-translate-y-1 hover:border-gold-500/30 hover:shadow-2xl hover:shadow-gold-500/10',
        className
      )}
    >
      {/* Image Carousel */}
      <Link to={cardHref} className="block">
        <ImageCarousel images={images} title={property.title} />
      </Link>

      {/* Status Badges */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-20">
        <Badge variant={property.purpose === 'venda' ? 'default' : 'secondary'} className="text-xs shadow-md">
          {property.purpose === 'venda' ? 'Venda' : property.purpose === 'aluguel' ? 'Aluguel' : 'Temporada'}
        </Badge>
        {property.featured && (
          <Badge variant="featured" className="text-xs shadow-md">
            Destaque
          </Badge>
        )}
        {property.isNew && (
          <Badge variant="new" className="text-xs shadow-md">
            Novo
          </Badge>
        )}
        {property.isPriceReduced && (
          <Badge variant="reduced" className="text-xs shadow-md">
            Reduzido
          </Badge>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={toggleFavorite}
        className={cn(
          'absolute top-3 right-3 z-20 w-9 h-9 rounded-full backdrop-blur-sm border border-white/20',
          'flex items-center justify-center transition-all duration-200',
          'bg-black/40 hover:bg-black/60',
          favoriteAnimating && 'scale-125'
        )}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart
          className={cn(
            'h-4 w-4 transition-colors duration-200',
            isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
          )}
        />
      </button>

      {/* Card Body */}
      <Link to={cardHref} className="block p-4">
        {/* Price */}
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div>
            <span className="font-display text-xl font-bold text-gold-400">
              {formatCurrency(property.price)}
            </span>
            {property.purpose === 'aluguel' && (
              <span className="text-sm text-foreground/50 font-sans ml-1">/mês</span>
            )}
          </div>
          {property.priceNegotiable && (
            <span className="text-xs text-gold-500/70 font-sans bg-gold-500/10 px-2 py-0.5 rounded-full border border-gold-500/20">
              Negociável
            </span>
          )}
        </div>

        {/* Reference Code & Title */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono font-semibold text-gold-400 bg-gold-500/10 border border-gold-500/20 px-1.5 py-0.5 rounded shrink-0">
            {property.referenceCode}
          </span>
          <h3 className="text-sm font-semibold text-foreground line-clamp-1 font-sans">
            {property.title}
          </h3>
        </div>

        {/* Address */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
          <span className="text-xs text-foreground/50 font-sans truncate">
            {property.address.neighborhood}, {property.address.city}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 pb-3 border-b border-navy-800">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1.5" title="Quartos">
              <Bed className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
              <span className="text-xs text-foreground/60 font-sans">{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1.5" title="Banheiros">
              <Bath className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
              <span className="text-xs text-foreground/60 font-sans">{property.bathrooms}</span>
            </div>
          )}
          {property.parking > 0 && (
            <div className="flex items-center gap-1.5" title="Vagas">
              <Car className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
              <span className="text-xs text-foreground/60 font-sans">{property.parking}</span>
            </div>
          )}
          {property.area > 0 && (
            <div className="flex items-center gap-1.5 ml-auto" title="Área">
              <Maximize2 className="h-3.5 w-3.5 text-foreground/40 shrink-0" />
              <span className="text-xs text-foreground/60 font-sans">{property.area} m²</span>
            </div>
          )}
        </div>

        {/* AI Investment Score */}
        {property.investmentScore !== undefined && (
          <div className="flex items-center gap-2 pt-3 pb-1">
            <Sparkles className="h-3.5 w-3.5 text-gold-400 shrink-0" />
            <span className="text-xs text-foreground/50 font-sans">Score de investimento</span>
            <div className="flex-1 h-1.5 bg-navy-800 rounded-full overflow-hidden ml-1">
              <div
                className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-500"
                style={{ width: `${(property.investmentScore / 10) * 100}%` }}
              />
            </div>
            <span className={cn(
              'text-xs font-bold font-sans min-w-[2.5rem] text-right',
              property.investmentScore >= 8 ? 'text-gold-400' :
              property.investmentScore >= 6 ? 'text-amber-400' : 'text-foreground/50'
            )}>
              {property.investmentScore.toFixed(1)}/10
            </span>
          </div>
        )}
      </Link>

      {/* Card Footer - CTA */}
      <div className="px-4 pb-4">
        <Button
          size="sm"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
          asChild
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="h-4 w-4" />
            Falar sobre este imóvel
          </a>
        </Button>
      </div>
    </div>
  )
}
