import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, X } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import type { PropertyPurpose, PropertyType } from '@/types'

// ============================================================
// CONSTANTS
// ============================================================

const PURPOSE_TABS: { label: string; value: PropertyPurpose }[] = [
  { label: 'Comprar', value: 'sale' },
  { label: 'Alugar', value: 'rent' },
  { label: 'Temporada', value: 'season_rent' },
]

const TYPE_PILLS: { label: string; emoji: string; value: PropertyType }[] = [
  { label: 'Casa', emoji: '🏠', value: 'house' },
  { label: 'Apartamento', emoji: '🏢', value: 'apartment' },
  { label: 'Chácara', emoji: '🌿', value: 'farm' },
  { label: 'Terreno', emoji: '🏗️', value: 'land' },
  { label: 'Comercial', emoji: '🏪', value: 'commercial_room' },
]

const BEDROOM_OPTIONS = [1, 2, 3, 4]

const CITY_CHIPS = ['Franca', 'Rifaina', 'Ibiraci', 'Patrocínio Paulista', 'Restinga']

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: 'Até R$200k', max: 200_000 },
  { label: 'R$200k–500k', min: 200_000, max: 500_000 },
  { label: 'R$500k–1M', min: 500_000, max: 1_000_000 },
  { label: 'Acima R$1M', min: 1_000_000 },
]

// ============================================================
// TYPES
// ============================================================

interface HeroSearchProps {
  /** Optional className applied to the root wrapper */
  className?: string
}

// ============================================================
// COMPONENT
// ============================================================

export function HeroSearch({ className }: HeroSearchProps) {
  const navigate = useNavigate()

  // Local UI state
  const [inputValue, setInputValue] = useState('')
  const [selectedPurpose, setSelectedPurpose] = useState<PropertyPurpose>('sale')
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null)
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedPriceRange, setSelectedPriceRange] = useState<
    (typeof PRICE_RANGES)[number] | null
  >(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Suggestion fetching as the user types
  const { suggestions, correctedQuery, isLoading, hasSearched, results } = useSearch()

  // ── Handlers ──────────────────────────────────────────────

  function buildSearchParams(): URLSearchParams {
    const params = new URLSearchParams()

    if (inputValue.trim()) params.set('q', inputValue.trim())
    params.set('finalidade', selectedPurpose)
    if (selectedType) params.set('tipo', selectedType)
    if (selectedBedrooms) params.set('quartos_min', String(selectedBedrooms))
    if (selectedCity) params.set('cidade', selectedCity)
    if (selectedPriceRange?.min) params.set('preco_min', String(selectedPriceRange.min))
    if (selectedPriceRange?.max) params.set('preco_max', String(selectedPriceRange.max))

    return params
  }

  function handleSearch() {
    const params = buildSearchParams()
    navigate(`/imoveis?${params.toString()}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch()
  }

  function handleSuggestionClick(suggestion: string) {
    setInputValue(suggestion)
    navigate(`/imoveis?q=${encodeURIComponent(suggestion)}&finalidade=${selectedPurpose}`)
  }

  function toggleType(type: PropertyType) {
    setSelectedType((prev) => (prev === type ? null : type))
  }

  function toggleBedrooms(n: number) {
    setSelectedBedrooms((prev) => (prev === n ? null : n))
  }

  function toggleCity(city: string) {
    setSelectedCity((prev) => (prev === city ? null : city))
  }

  function togglePriceRange(range: (typeof PRICE_RANGES)[number]) {
    setSelectedPriceRange((prev) => (prev === range ? null : range))
  }

  function handleClear() {
    setInputValue('')
    inputRef.current?.focus()
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Purpose tabs */}
      <div className="flex gap-1 mb-4">
        {PURPOSE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedPurpose(tab.value)}
            className={`px-5 py-2 rounded-t-lg text-sm font-semibold transition-colors ${
              selectedPurpose === tab.value
                ? 'bg-white text-navy-950'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main search box */}
      <div className="bg-white rounded-xl shadow-2xl p-4 md:p-5">
        {/* Input row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={20}
            />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar imóveis... ex: 'casa 3 quartos piscina no centro'"
              className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 text-navy-950 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition"
              aria-label="Buscar imóveis"
            />
            <AnimatePresence>
              {inputValue && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Limpar busca"
                >
                  <X size={16} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-navy-950 font-semibold px-6 py-3 rounded-lg transition-colors text-sm shrink-0"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            Buscar
          </button>
        </div>

        {/* AI Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-4 overflow-hidden"
            >
              <span className="text-xs text-slate-500 w-full">Sugestões:</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-3 py-1 text-xs bg-gold-50 text-gold-700 border border-gold-200 rounded-full hover:bg-gold-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No-results notice */}
        <AnimatePresence>
          {hasSearched && results.length === 0 && correctedQuery && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-slate-500 mb-3"
            >
              Mostrando imóveis similares para{' '}
              <span className="font-medium text-gold-600">"{correctedQuery}"</span>
            </motion.p>
          )}
        </AnimatePresence>

        {/* Quick filters */}
        <div className="space-y-3">
          {/* Property type pills */}
          <div className="flex flex-wrap gap-2">
            {TYPE_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => toggleType(pill.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedType === pill.value
                    ? 'bg-navy-950 text-white border-navy-950'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300 hover:text-navy-800'
                }`}
              >
                <span>{pill.emoji}</span>
                {pill.label}
              </button>
            ))}
          </div>

          {/* Bedrooms + City + Price — row on md+ */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {/* Bedrooms */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 shrink-0">Quartos:</span>
              {BEDROOM_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => toggleBedrooms(n)}
                  className={`w-8 h-8 rounded-full text-xs font-semibold border transition-colors ${
                    selectedBedrooms === n
                      ? 'bg-navy-950 text-white border-navy-950'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300'
                  }`}
                >
                  {n}+
                </button>
              ))}
            </div>

            {/* City chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 shrink-0">Cidade:</span>
              {CITY_CHIPS.map((city) => (
                <button
                  key={city}
                  onClick={() => toggleCity(city)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedCity === city
                      ? 'bg-navy-950 text-white border-navy-950'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Price range chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 self-center shrink-0">Preço:</span>
            {PRICE_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => togglePriceRange(range)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedPriceRange === range
                    ? 'bg-navy-950 text-white border-navy-950'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-navy-300'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
