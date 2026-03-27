import React, { useState, useCallback } from 'react'
import { Search, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export type PropertyPurpose = 'comprar' | 'alugar'
export type PropertyType = 'casa' | 'apartamento' | 'terreno' | 'chacara' | 'comercial'
export type SortOption = 'relevancia' | 'menor-preco' | 'maior-preco' | 'mais-recente'

export interface FilterState {
  search: string
  purpose: PropertyPurpose
  types: PropertyType[]
  priceRange: [number, number]
  bedrooms: number[]
  cities: string[]
  areaRange: [number, number]
  amenities: string[]
  sortBy: SortOption
}

const defaultFilters: FilterState = {
  search: '',
  purpose: 'comprar',
  types: [],
  priceRange: [0, 5000000],
  bedrooms: [],
  cities: [],
  areaRange: [0, 1000],
  amenities: [],
  sortBy: 'relevancia',
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'chacara', label: 'Chácara' },
  { value: 'comercial', label: 'Comercial' },
]

const cities = [
  'Franca',
  'Rifaina',
  'Ibiraci',
  'Patrocínio Paulista',
  'Restinga',
  'São José da Bela Vista',
]

const amenitiesList = [
  { value: 'piscina', label: 'Piscina' },
  { value: 'churrasqueira', label: 'Churrasqueira' },
  { value: 'jardim', label: 'Jardim' },
  { value: 'garagem', label: 'Garagem' },
  { value: 'portaria', label: 'Portaria 24h' },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'mais-recente', label: 'Mais recente' },
]

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="space-y-3">
      <button
        className="flex items-center justify-between w-full text-left group"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider font-sans group-hover:text-foreground/80 transition-colors">
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-foreground/40" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-foreground/40" />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

interface PropertyFiltersProps {
  filters?: FilterState
  onChange?: (filters: FilterState) => void
  activeCount?: number
  className?: string
  variant?: 'sidebar' | 'topbar'
}

export function PropertyFilters({
  filters: externalFilters,
  onChange,
  className,
  variant = 'sidebar',
}: PropertyFiltersProps) {
  const [internalFilters, setInternalFilters] = useState<FilterState>(defaultFilters)
  const filters = externalFilters ?? internalFilters

  const update = useCallback(
    (patch: Partial<FilterState>) => {
      const next = { ...filters, ...patch }
      if (externalFilters === undefined) setInternalFilters(next)
      onChange?.(next)
    },
    [filters, externalFilters, onChange]
  )

  const resetFilters = () => {
    if (externalFilters === undefined) setInternalFilters(defaultFilters)
    onChange?.(defaultFilters)
  }

  const toggleArrayValue = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]

  const activeFilterCount =
    filters.types.length +
    filters.cities.length +
    filters.amenities.length +
    filters.bedrooms.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000 ? 1 : 0) +
    (filters.areaRange[0] > 0 || filters.areaRange[1] < 1000 ? 1 : 0)

  const content = (
    <div className="space-y-5">
      {/* Search */}
      <Input
        placeholder="Buscar por bairro, cidade..."
        leftIcon={<Search className="h-4 w-4" />}
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="bg-navy-900 border-navy-700"
      />

      <Separator />

      {/* Purpose Tabs */}
      <CollapsibleSection title="Finalidade">
        <div className="flex gap-1 p-1 bg-navy-900 rounded-lg border border-navy-800">
          {(['comprar', 'alugar'] as PropertyPurpose[]).map((p) => (
            <button
              key={p}
              onClick={() => update({ purpose: p })}
              className={cn(
                'flex-1 py-1.5 rounded-md text-sm font-medium font-sans capitalize transition-all duration-200',
                filters.purpose === p
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/25'
                  : 'text-foreground/50 hover:text-foreground hover:bg-navy-800'
              )}
            >
              {p === 'comprar' ? 'Comprar' : 'Alugar'}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Property Types */}
      <CollapsibleSection title="Tipo de Imóvel">
        <div className="flex flex-wrap gap-2">
          {propertyTypes.map((type) => {
            const isSelected = filters.types.includes(type.value)
            return (
              <button
                key={type.value}
                onClick={() => update({ types: toggleArrayValue(filters.types, type.value) })}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium font-sans border transition-all duration-200',
                  isSelected
                    ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                    : 'bg-navy-900 text-foreground/60 border-navy-700 hover:text-foreground hover:border-navy-600'
                )}
              >
                {type.label}
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Price Range */}
      <CollapsibleSection title="Faixa de Preço">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-foreground/50 font-sans">
            <span>{formatCurrency(filters.priceRange[0])}</span>
            <span>{formatCurrency(filters.priceRange[1])}</span>
          </div>
          <Slider
            min={0}
            max={5000000}
            step={50000}
            value={filters.priceRange}
            onValueChange={(val) => update({ priceRange: val as [number, number] })}
          />
          <div className="flex gap-2">
            <div className="flex-1 text-center p-2 bg-navy-900 rounded-lg border border-navy-800 text-xs text-foreground/60 font-sans">
              Min: {formatCurrency(filters.priceRange[0])}
            </div>
            <div className="flex-1 text-center p-2 bg-navy-900 rounded-lg border border-navy-800 text-xs text-foreground/60 font-sans">
              Máx: {formatCurrency(filters.priceRange[1])}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Bedrooms */}
      <CollapsibleSection title="Quartos">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => {
            const val = n === 4 ? 4 : n
            const isSelected = filters.bedrooms.includes(val)
            return (
              <button
                key={n}
                onClick={() => update({ bedrooms: toggleArrayValue(filters.bedrooms, val) })}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium font-sans border transition-all duration-200',
                  isSelected
                    ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                    : 'bg-navy-900 text-foreground/60 border-navy-700 hover:text-foreground hover:border-navy-600'
                )}
              >
                {n === 4 ? '4+' : n}
              </button>
            )
          })}
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Cities */}
      <CollapsibleSection title="Cidades">
        <div className="space-y-2">
          {cities.map((city) => {
            const val = city.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            const isSelected = filters.cities.includes(val)
            return (
              <label
                key={city}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  onClick={() => update({ cities: toggleArrayValue(filters.cities, val) })}
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 cursor-pointer',
                    isSelected
                      ? 'bg-gold-500 border-gold-500'
                      : 'border-navy-600 bg-navy-900 group-hover:border-gold-500/50'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-navy-950" />}
                </div>
                <span
                  onClick={() => update({ cities: toggleArrayValue(filters.cities, val) })}
                  className={cn(
                    'text-sm font-sans transition-colors cursor-pointer',
                    isSelected ? 'text-foreground' : 'text-foreground/60 group-hover:text-foreground/80'
                  )}
                >
                  {city}
                </span>
              </label>
            )
          })}
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Area Range */}
      <CollapsibleSection title="Área (m²)">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-foreground/50 font-sans">
            <span>{filters.areaRange[0]} m²</span>
            <span>{filters.areaRange[1] >= 1000 ? '1000+' : filters.areaRange[1]} m²</span>
          </div>
          <Slider
            min={0}
            max={1000}
            step={10}
            value={filters.areaRange}
            onValueChange={(val) => update({ areaRange: val as [number, number] })}
          />
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Amenities */}
      <CollapsibleSection title="Comodidades">
        <div className="space-y-2">
          {amenitiesList.map(({ value, label }) => {
            const isSelected = filters.amenities.includes(value)
            return (
              <label
                key={value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  onClick={() => update({ amenities: toggleArrayValue(filters.amenities, value) })}
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0',
                    isSelected
                      ? 'bg-gold-500 border-gold-500'
                      : 'border-navy-600 bg-navy-900 group-hover:border-gold-500/50'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-navy-950" />}
                </div>
                <span
                  onClick={() => update({ amenities: toggleArrayValue(filters.amenities, value) })}
                  className={cn(
                    'text-sm font-sans transition-colors cursor-pointer',
                    isSelected ? 'text-foreground' : 'text-foreground/60 group-hover:text-foreground/80'
                  )}
                >
                  {label}
                </span>
              </label>
            )
          })}
        </div>
      </CollapsibleSection>

      <Separator />

      {/* Sort By */}
      <CollapsibleSection title="Ordenar por">
        <div className="space-y-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ sortBy: opt.value })}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-sans transition-all duration-150',
                filters.sortBy === opt.value
                  ? 'bg-gold-500/10 text-gold-400'
                  : 'text-foreground/60 hover:text-foreground hover:bg-navy-800'
              )}
            >
              <span>{opt.label}</span>
              {filters.sortBy === opt.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
              )}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-foreground/50 hover:text-foreground"
            onClick={resetFilters}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
          </Button>
        </>
      )}
    </div>
  )

  if (variant === 'topbar') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-foreground/60">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-sans">Filtros</span>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {/* Condensed topbar filters could go here */}
          {content}
        </div>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'w-full bg-navy-950/50 border border-navy-800/60 rounded-xl p-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gold-400" />
          <span className="font-semibold text-foreground text-sm font-sans">Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs text-foreground/40 hover:text-gold-400 transition-colors font-sans flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>
      {content}
    </aside>
  )
}
