'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { propertiesApi, type PropertySummary } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import {
  Plus,
  Search,
  Building2,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
  commercial: 'Comercial',
  rural: 'Rural',
  studio: 'Studio',
  condo: 'Condomínio',
  office: 'Escritório',
}

const PURPOSE_LABELS: Record<string, string> = {
  sale: 'Venda',
  rent: 'Aluguel',
  both: 'Venda/Aluguel',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  sold: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  rented: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pending: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  sold: 'Vendido',
  rented: 'Alugado',
  inactive: 'Inativo',
  pending: 'Pendente',
}

export default function PropertiesPage() {
  const { accessToken } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  function handleSearch(value: string) {
    setSearch(value)
    clearTimeout((window as any).__searchTimeout)
    ;(window as any).__searchTimeout = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 400)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['properties', page, debouncedSearch],
    queryFn: () =>
      propertiesApi.listProtected(accessToken!, {
        page,
        limit: 12,
        search: debouncedSearch || undefined,
      }),
    enabled: !!accessToken,
  })

  const properties = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imóveis</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {meta ? `${meta.total} imóveis cadastrados` : 'Carregando...'}
          </p>
        </div>
        <Link href="/dashboard/properties/new">
          <Button>
            <Plus className="h-4 w-4" />
            Novo Imóvel
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por título, referência, cidade..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg">Nenhum imóvel encontrado</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {debouncedSearch ? 'Tente outro termo de busca' : 'Cadastre seu primeiro imóvel'}
          </p>
          {!debouncedSearch && (
            <Link href="/dashboard/properties/new" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Cadastrar Imóvel
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Página {meta.page} de {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === meta.totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function PropertyCard({ property: p }: { property: PropertySummary }) {
  const coverImage = p.coverImage ?? p.images?.[0]

  return (
    <Link href={`/dashboard/properties/${p.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
        {/* Image */}
        <div className="relative h-44 bg-muted overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] ?? STATUS_COLORS.inactive}`}>
              {STATUS_LABELS[p.status] ?? p.status}
            </span>
            {p.isFeatured && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                Destaque
              </span>
            )}
          </div>
          {/* Views */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
            <Eye className="h-3 w-3 text-white" />
            <span className="text-xs text-white">{p.views}</span>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Ref + type */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">
              {p.reference && `Ref. ${p.reference} · `}
              {TYPE_LABELS[p.type] ?? p.type} · {PURPOSE_LABELS[p.purpose] ?? p.purpose}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2">{p.title}</h3>

          {/* Location */}
          {(p.neighborhood || p.city) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {[p.neighborhood, p.city, p.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Features */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {p.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3 w-3" /> {p.bedrooms}
              </span>
            )}
            {p.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" /> {p.bathrooms}
              </span>
            )}
            {p.parkingSpaces > 0 && (
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" /> {p.parkingSpaces}
              </span>
            )}
            {p.totalArea && (
              <span>{p.totalArea} m²</span>
            )}
          </div>

          {/* Price */}
          <div className="border-t pt-3">
            {p.price && (
              <p className="font-bold text-primary">
                {formatCurrency(p.price)}
              </p>
            )}
            {p.priceRent && (
              <p className={`text-sm font-semibold ${p.price ? 'text-muted-foreground' : 'text-primary'}`}>
                {formatCurrency(p.priceRent)}/mês
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
