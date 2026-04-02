'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { propertiesApi, usersApi, type PropertySummary, type User as UserType } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Search, Building2, MapPin, BedDouble, Bath, Car, Eye,
  ChevronLeft, ChevronRight, SlidersHorizontal, X, Filter, Instagram, Loader2, CheckSquare, Square, User,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const FAKE_IMAGE_PATTERNS = [
  'send.png', 'telefone.png', 'logotopo.png', 'foto_vazio.png',
  'foto-corretor.png', 'logo_uso.png', 'logo_rodape.png',
  '/images/logo', '/images/banner', 'whatsapp',
]
function isRealImage(url: string | null | undefined): boolean {
  if (!url) return false
  return !FAKE_IMAGE_PATTERNS.some(pat => url.includes(pat))
}

const TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Apartamento',
  LAND: 'Terreno',
  FARM: 'Chácara/Sítio',
  RANCH: 'Fazenda',
  WAREHOUSE: 'Galpão',
  OFFICE: 'Escritório',
  STORE: 'Loja/Comercial',
  STUDIO: 'Studio',
  PENTHOUSE: 'Cobertura',
  CONDO: 'Condomínio',
  KITNET: 'Kitnet',
}

const PURPOSE_LABELS: Record<string, string> = {
  SALE: 'Venda',
  RENT: 'Aluguel',
  BOTH: 'Venda/Aluguel',
  SEASON: 'Temporada',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  SOLD: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  RENTED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PENDING: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  DRAFT: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  SOLD: 'Vendido',
  RENTED: 'Alugado',
  INACTIVE: 'Inativo',
  PENDING: 'Pendente',
  DRAFT: 'Rascunho',
}

interface Filters {
  search: string
  status: string
  purpose: string
  type: string
  city: string
  neighborhood: string
  minPrice: string
  maxPrice: string
  bedrooms: string
  minArea: string
  maxArea: string
  sortBy: string
  sortOrder: string
  captorName: string
}

const DEFAULT_FILTERS: Filters = {
  search: '', status: '', purpose: '', type: '',
  city: '', neighborhood: '', minPrice: '', maxPrice: '',
  bedrooms: '', minArea: '', maxArea: '',
  sortBy: 'createdAt', sortOrder: 'desc',
  captorName: '',
}

function filtersToApi(f: Filters) {
  return {
    search: f.search || undefined,
    status: f.status || undefined,
    purpose: f.purpose || undefined,
    type: f.type || undefined,
    city: f.city || undefined,
    neighborhood: f.neighborhood || undefined,
    minPrice: f.minPrice ? Number(f.minPrice) : undefined,
    maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
    bedrooms: f.bedrooms ? Number(f.bedrooms) : undefined,
    minArea: f.minArea ? Number(f.minArea) : undefined,
    maxArea: f.maxArea ? Number(f.maxArea) : undefined,
    sortBy: f.sortBy || 'createdAt',
    sortOrder: (f.sortOrder || 'desc') as 'asc' | 'desc',
    captorName: f.captorName || undefined,
  }
}

function activeFilterCount(f: Filters) {
  const check = [
    f.search, f.status, f.purpose, f.type, f.city, f.neighborhood,
    f.minPrice, f.maxPrice, f.bedrooms, f.minArea, f.maxArea, f.captorName,
  ]
  return check.filter(Boolean).length
}

export default function PropertiesPage() {
  const { accessToken } = useAuthStore()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  // Load company users for captador filter
  const { data: usersData } = useQuery({
    queryKey: ['users-list-props'],
    queryFn: () => usersApi.list(accessToken!),
    enabled: !!accessToken,
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  // Debounced filters applied to query
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS)
  // Bulk Instagram post
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPosting, setBulkPosting] = useState(false)
  const [bulkResult, setBulkResult] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState(false)

  function applyFilters(f: Filters) {
    setAppliedFilters(f)
    setPage(1)
  }

  function handleFieldChange(field: keyof Filters, value: string) {
    const next = { ...filters, [field]: value }
    setFilters(next)
    // Auto-apply text search with debounce
    if (field === 'search') {
      clearTimeout((window as any).__searchTimeout)
      ;(window as any).__searchTimeout = setTimeout(() => applyFilters(next), 400)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    applyFilters(filters)
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    applyFilters(DEFAULT_FILTERS)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkPostToInstagram() {
    if (selectedIds.size === 0) return
    setBulkPosting(true)
    setBulkResult(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/social/post/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
        },
        body: JSON.stringify({ propertyIds: Array.from(selectedIds), account: 'lemos', delayMs: 30000 }),
      })
      const data = await res.json()
      setBulkResult(data.message ?? 'Posts agendados!')
      setSelectedIds(new Set())
      setSelectMode(false)
    } catch {
      setBulkResult('Erro ao agendar posts.')
    } finally {
      setBulkPosting(false)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['properties', page, appliedFilters],
    queryFn: () =>
      propertiesApi.listProtected(accessToken!, {
        page,
        limit: 12,
        ...filtersToApi(appliedFilters),
      }),
    enabled: !!accessToken,
  })

  const properties = data?.data ?? []
  const meta = data?.meta
  const activeCount = activeFilterCount(appliedFilters)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imóveis</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {meta ? `${meta.total} imóvel(is) encontrado(s)` : 'Carregando...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk Instagram post toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()); setBulkResult(null) }}
          >
            <Instagram className="h-4 w-4" />
            {selectMode ? 'Cancelar' : 'Publicar no Instagram'}
          </Button>
          <Link href="/dashboard/properties/new">
            <Button>
              <Plus className="h-4 w-4" />
              Novo Imóvel
            </Button>
          </Link>
        </div>
      </div>

      {/* Bulk Instagram action bar */}
      {selectMode && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-pink-500/30 bg-pink-500/5">
          <Instagram className="h-4 w-4 text-pink-400 flex-shrink-0" />
          <p className="text-sm text-pink-300 flex-1">
            {selectedIds.size === 0
              ? 'Clique nos imóveis para selecionar'
              : `${selectedIds.size} imóvel(is) selecionado(s) — serão publicados com 30s de intervalo`}
          </p>
          {bulkResult && <p className="text-xs text-green-400">{bulkResult}</p>}
          <Button
            size="sm"
            disabled={selectedIds.size === 0 || bulkPosting}
            onClick={bulkPostToInstagram}
            style={{ background: 'linear-gradient(135deg, #E1306C, #833AB4)', color: 'white', border: 'none' }}
          >
            {bulkPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
            Publicar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
          </Button>
        </div>
      )}

      {/* Filter Panel */}
      <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-4 space-y-3">
        {/* Row 1: Search + quick filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative lg:col-span-2 sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Ref., título, bairro, cidade..."
              value={filters.search}
              onChange={e => handleFieldChange('search', e.target.value)}
            />
          </div>

          {/* Status */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filters.status}
            onChange={e => handleFieldChange('status', e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="SOLD">Vendido</option>
            <option value="RENTED">Alugado</option>
            <option value="PENDING">Pendente</option>
          </select>

          {/* Purpose */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filters.purpose}
            onChange={e => handleFieldChange('purpose', e.target.value)}
          >
            <option value="">Venda + Aluguel</option>
            <option value="SALE">Venda</option>
            <option value="RENT">Aluguel</option>
            <option value="BOTH">Venda/Aluguel</option>
          </select>

          {/* Type */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filters.type}
            onChange={e => handleFieldChange('type', e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="HOUSE">Casa</option>
            <option value="APARTMENT">Apartamento</option>
            <option value="LAND">Terreno</option>
            <option value="FARM">Chácara/Sítio</option>
            <option value="WAREHOUSE">Galpão</option>
            <option value="OFFICE">Escritório</option>
            <option value="STORE">Loja/Comercial</option>
            <option value="STUDIO">Studio</option>
            <option value="PENTHOUSE">Cobertura</option>
            <option value="KITNET">Kitnet</option>
          </select>

          {/* Corretor / Captador */}
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={filters.captorName}
            onChange={e => { const f = { ...filters, captorName: e.target.value }; setFilters(f); applyFilters(f) }}
          >
            <option value="">Todos os corretores</option>
            {(usersData ?? []).filter((u: UserType) => ['BROKER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(u.role)).map((u: UserType) => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Toggle advanced + actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showAdvanced ? 'Menos filtros' : 'Mais filtros'}
            {activeCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>

          <div className="flex-1" />

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}

          <Button type="submit" size="sm">
            <Filter className="h-3.5 w-3.5" />
            Filtrar
          </Button>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cidade</label>
              <Input
                placeholder="Ex: Franca"
                value={filters.city}
                onChange={e => handleFieldChange('city', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bairro</label>
              <Input
                placeholder="Ex: Centro"
                value={filters.neighborhood}
                onChange={e => handleFieldChange('neighborhood', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Preço mínimo</label>
              <Input
                type="number"
                placeholder="R$ 0"
                value={filters.minPrice}
                onChange={e => handleFieldChange('minPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Preço máximo</label>
              <Input
                type="number"
                placeholder="Sem limite"
                value={filters.maxPrice}
                onChange={e => handleFieldChange('maxPrice', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Quartos (mín.)</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.bedrooms}
                onChange={e => handleFieldChange('bedrooms', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ordenar por</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={e => {
                  const [sb, so] = e.target.value.split('_')
                  setFilters(f => ({ ...f, sortBy: sb, sortOrder: so }))
                }}
              >
                <option value="createdAt_desc">Mais recentes</option>
                <option value="createdAt_asc">Mais antigos</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="views_desc">Mais visitados</option>
                <option value="updatedAt_desc">Última atualização</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Área mín. (m²)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minArea}
                onChange={e => handleFieldChange('minArea', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Área máx. (m²)</label>
              <Input
                type="number"
                placeholder="Sem limite"
                value={filters.maxArea}
                onChange={e => handleFieldChange('maxArea', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {appliedFilters.search && (
              <FilterChip label={`"${appliedFilters.search}"`} onRemove={() => { const f = { ...filters, search: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.status && (
              <FilterChip label={STATUS_LABELS[appliedFilters.status] ?? appliedFilters.status} onRemove={() => { const f = { ...filters, status: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.purpose && (
              <FilterChip label={PURPOSE_LABELS[appliedFilters.purpose] ?? appliedFilters.purpose} onRemove={() => { const f = { ...filters, purpose: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.type && (
              <FilterChip label={TYPE_LABELS[appliedFilters.type] ?? appliedFilters.type} onRemove={() => { const f = { ...filters, type: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.city && (
              <FilterChip label={appliedFilters.city} onRemove={() => { const f = { ...filters, city: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.neighborhood && (
              <FilterChip label={appliedFilters.neighborhood} onRemove={() => { const f = { ...filters, neighborhood: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.minPrice && (
              <FilterChip label={`≥ ${formatCurrency(Number(appliedFilters.minPrice))}`} onRemove={() => { const f = { ...filters, minPrice: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.maxPrice && (
              <FilterChip label={`≤ ${formatCurrency(Number(appliedFilters.maxPrice))}`} onRemove={() => { const f = { ...filters, maxPrice: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.bedrooms && (
              <FilterChip label={`${appliedFilters.bedrooms}+ quartos`} onRemove={() => { const f = { ...filters, bedrooms: '' }; setFilters(f); applyFilters(f) }} />
            )}
            {appliedFilters.captorName && (
              <FilterChip label={`Corretor: ${appliedFilters.captorName}`} onRemove={() => { const f = { ...filters, captorName: '' }; setFilters(f); applyFilters(f) }} />
            )}
          </div>
        )}
      </form>

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
            {activeCount > 0 ? 'Tente ajustar os filtros' : 'Cadastre seu primeiro imóvel'}
          </p>
          {activeCount === 0 && (
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
            <PropertyCard
              key={p.id}
              property={p}
              selectMode={selectMode}
              selected={selectedIds.has(p.id)}
              onSelect={() => toggleSelect(p.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Página {meta.page} de {meta.totalPages} · {meta.total} imóvel(is)
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages}>
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
      {label}
      <button type="button" onClick={onRemove} className="hover:text-destructive transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

function PropertyCard({
  property: p,
  selectMode = false,
  selected = false,
  onSelect,
}: {
  property: PropertySummary
  selectMode?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const rawImage = p.coverImage ?? p.images?.[0]
  const coverImage = isRealImage(rawImage) ? rawImage : null

  if (selectMode) {
    return (
      <div onClick={onSelect} className="cursor-pointer">
        <Card className={`overflow-hidden transition-all group ${selected ? 'ring-2 ring-pink-500' : 'hover:shadow-md'}`}>
          <div className="relative h-44 bg-muted overflow-hidden">
            {coverImage ? (
              <img src={coverImage} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Building2 className="h-12 w-12 text-muted-foreground/30" /></div>
            )}
            <div className="absolute top-2 left-2 flex gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status?.toUpperCase()] ?? STATUS_COLORS.INACTIVE}`}>
                {STATUS_LABELS[p.status?.toUpperCase()] ?? p.status}
              </span>
            </div>
            <div className="absolute top-2 right-2">
              {selected
                ? <CheckSquare className="h-5 w-5 text-pink-400 drop-shadow" />
                : <Square className="h-5 w-5 text-white/60 drop-shadow" />}
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{p.title}</h3>
            {(p.neighborhood || p.city) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{[p.neighborhood, p.city].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Link href={`/dashboard/properties/${p.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
        {/* Image */}
        <div className="relative h-44 bg-muted overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={p.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-2 left-2 flex gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status?.toUpperCase()] ?? STATUS_COLORS.INACTIVE}`}>
              {STATUS_LABELS[p.status?.toUpperCase()] ?? p.status}
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
          {/* Ref + type + purpose */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {p.reference && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                {p.reference}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {TYPE_LABELS[p.type?.toUpperCase()] ?? p.type}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {PURPOSE_LABELS[p.purpose?.toUpperCase()] ?? p.purpose}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2">{p.title}</h3>

          {/* Location */}
          {(p.neighborhood || p.city) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {[p.neighborhood, p.city, p.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Captador */}
          {p.captorName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{p.captorName}</span>
            </div>
          )}

          {/* Features */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {(p.bedrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3 w-3" /> {p.bedrooms}
              </span>
            )}
            {(p.bathrooms ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" /> {p.bathrooms}
              </span>
            )}
            {(p.parkingSpaces ?? 0) > 0 && (
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
                {formatCurrency(Number(p.price))}
              </p>
            )}
            {p.priceRent && (
              <p className={`text-sm font-semibold ${p.price ? 'text-muted-foreground' : 'text-primary'}`}>
                {formatCurrency(Number(p.priceRent))}/mês
              </p>
            )}
            {!p.price && !p.priceRent && (
              <p className="text-sm text-muted-foreground italic">Consulte o valor</p>
            )}
          </div>

          {/* Lemosbank cross-reference: active contract + docs */}
          {(() => {
            const contracts = (p as any).contracts ?? []
            const docsCount = (p as any)._count?.documents ?? 0
            const contractsCount = (p as any)._count?.contracts ?? 0
            const activeContract = contracts[0]
            if (!activeContract && !docsCount && !contractsCount) return null
            return (
              <div className="border-t pt-2 mt-2 space-y-1">
                {activeContract && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-green-700 font-medium truncate">
                      Inquilino: {activeContract.tenant?.name ?? '—'}
                    </span>
                  </div>
                )}
                {activeContract?.rentValue && (
                  <div className="text-xs text-muted-foreground">
                    Aluguel ativo: {formatCurrency(Number(activeContract.rentValue))}/mês
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {contractsCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      <Building2 className="h-3 w-3" />
                      {contractsCount} contrato{contractsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {docsCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      <Eye className="h-3 w-3" />
                      {docsCount} doc{docsCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>
    </Link>
  )
}
