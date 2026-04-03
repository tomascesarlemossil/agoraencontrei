'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, useEffect, useRef } from 'react'
import { MapPin, Home, DollarSign, BedDouble, Search, Map, ChevronDown, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { VoiceInputButton } from '@/components/ui/VoiceInputButton'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const PRICE_SALE_OPTIONS = [
  { label: 'Qualquer valor', value: '' },
  { label: 'Até R$ 100.000', value: '100000' },
  { label: 'Até R$ 150.000', value: '150000' },
  { label: 'Até R$ 200.000', value: '200000' },
  { label: 'Até R$ 300.000', value: '300000' },
  { label: 'Até R$ 400.000', value: '400000' },
  { label: 'Até R$ 500.000', value: '500000' },
  { label: 'Até R$ 700.000', value: '700000' },
  { label: 'Até R$ 1.000.000', value: '1000000' },
  { label: 'Até R$ 1.500.000', value: '1500000' },
  { label: 'Até R$ 2.000.000', value: '2000000' },
]

const PRICE_RENT_OPTIONS = [
  { label: 'Qualquer valor', value: '' },
  { label: 'Até R$ 500/mês', value: '500' },
  { label: 'Até R$ 800/mês', value: '800' },
  { label: 'Até R$ 1.000/mês', value: '1000' },
  { label: 'Até R$ 1.500/mês', value: '1500' },
  { label: 'Até R$ 2.000/mês', value: '2000' },
  { label: 'Até R$ 3.000/mês', value: '3000' },
  { label: 'Até R$ 5.000/mês', value: '5000' },
]

const BEDROOM_OPTIONS = [
  { label: 'Qualquer', value: '' },
  { label: '1+ quarto', value: '1' },
  { label: '2+ quartos', value: '2' },
  { label: '3+ quartos', value: '3' },
  { label: '4+ quartos', value: '4' },
  { label: '5+ quartos', value: '5' },
]

// AI quick suggestions
const AI_EXAMPLES = [
  'casa 3 quartos no Centro até R$ 500 mil',
  'apartamento 2 quartos para alugar até R$ 1.500/mês',
  'terreno 500m² em Franca',
  'chácara para comprar até 1 milhão',
]

async function interpretSearch(q: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/search-ai?q=${encodeURIComponent(q)}`)
    if (!res.ok) return {}
    return res.json()
  } catch {
    return {}
  }
}

export function HeroSearchForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [purpose, setPurpose] = useState<'RENT' | 'SALE'>('RENT')
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [suggestions, setSuggestions] = useState<{ neighborhood: string; city: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const neighborhoodRef = useRef<HTMLDivElement>(null)
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMode, setAiMode] = useState(true) // true = AI search mode

  // Fetch neighborhood suggestions
  useEffect(() => {
    if (neighborhood.length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ city: city || 'Franca' })
        if (purpose) params.set('purpose', purpose)
        const res = await fetch(`${API_URL}/api/v1/public/neighborhoods?${params}`)
        if (!res.ok) return
        const data: { neighborhood: string; city: string }[] = await res.json()
        const filtered = data.filter(n =>
          n.neighborhood?.toLowerCase().includes(neighborhood.toLowerCase())
        )
        setSuggestions(filtered.slice(0, 6))
        setShowSuggestions(filtered.length > 0)
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [neighborhood, city, purpose])

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (neighborhoodRef.current && !neighborhoodRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // AI Smart Search — parses query and NAVIGATES DIRECTLY to results
  async function handleAiSearch() {
    const query = aiQuery.trim()
    if (!query || aiLoading) return
    setAiLoading(true)

    try {
      const result = await interpretSearch(query)

      // Build URL params from AI result
      const params = new URLSearchParams()

      if (result.purpose) params.set('purpose', result.purpose)
      else params.set('purpose', purpose) // default to selected purpose

      if (result.type) params.set('type', result.type)
      if (result.city) params.set('city', result.city)
      if (result.neighborhood) params.set('neighborhood', result.neighborhood)
      if (result.maxPrice) params.set('maxPrice', String(result.maxPrice))
      if (result.minPrice) params.set('minPrice', String(result.minPrice))
      if (result.bedrooms) params.set('bedrooms', String(result.bedrooms))
      if (result.search) params.set('search', result.search)

      // If AI extracted nothing meaningful, use the raw query as text search
      const hasAnyFilter = result.type || result.city || result.neighborhood || result.maxPrice || result.bedrooms
      if (!hasAnyFilter) {
        params.set('search', query)
      }

      // Navigate directly to results — no second click needed
      startTransition(() => router.push(`/imoveis?${params}`))
    } catch {
      // Fallback: use raw query as text search
      startTransition(() => router.push(`/imoveis?search=${encodeURIComponent(aiQuery)}&purpose=${purpose}`))
    } finally {
      setAiLoading(false)
    }
  }

  function buildManualParams() {
    const params = new URLSearchParams()
    params.set('purpose', purpose)
    if (city.trim())         params.set('city', city.trim())
    if (neighborhood.trim()) params.set('search', neighborhood.trim())
    if (maxPrice)            params.set('maxPrice', maxPrice)
    if (bedrooms)            params.set('bedrooms', bedrooms)
    return params
  }

  function handleManualSearch(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => router.push(`/imoveis?${buildManualParams()}`))
  }

  function handleMapSearch() {
    startTransition(() => router.push(`/imoveis?${buildManualParams()}&view=map`))
  }

  const priceOptions = purpose === 'RENT' ? PRICE_RENT_OPTIONS : PRICE_SALE_OPTIONS
  const headline = purpose === 'RENT'
    ? 'Alugue um lar\npara chamar de seu'
    : 'Compre um lar\npara chamar de seu'

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Top toggle: Buscar / Anunciar */}
      <div
        className="inline-flex rounded-full p-1 mb-6"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}
      >
        <span
          className="px-5 py-2 rounded-full text-sm font-semibold"
          style={{ backgroundColor: 'white', color: '#1B2B5B' }}
        >
          Buscar Imóveis
        </span>
        <a
          href="/anunciar"
          className="px-5 py-2 rounded-full text-sm font-semibold transition-colors"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          Anunciar Imóveis
        </a>
      </div>

      {/* Headline */}
      <h2
        className="text-white text-3xl sm:text-4xl font-bold mb-6 leading-tight whitespace-pre-line"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {headline}
      </h2>

      {/* Purpose tabs */}
      <div className="flex gap-6 mb-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
        {(['RENT', 'SALE'] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => { setPurpose(p); setMaxPrice('') }}
            className="pb-3 text-sm font-semibold transition-colors relative"
            style={{ color: purpose === p ? 'white' : 'rgba(255,255,255,0.45)' }}
          >
            {p === 'RENT' ? 'Alugar' : 'Comprar'}
            {purpose === p && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: '#C9A84C' }}
              />
            )}
          </button>
        ))}
        {/* Mode toggle */}
        <button
          type="button"
          onClick={() => setAiMode(!aiMode)}
          className="ml-auto pb-3 text-xs font-medium transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {aiMode ? 'Busca manual ↓' : '✨ Busca IA ↑'}
        </button>
      </div>

      {/* Search form card */}
      <div className="rounded-3xl bg-white shadow-2xl overflow-visible">

        {/* ── AI SEARCH (main, prominent) ─────────────────────── */}
        {aiMode && (
          <div className="p-5" style={{ background: 'linear-gradient(135deg, #fffdf8, #fff)', borderRadius: '24px 24px 0 0', borderBottom: '1px solid #f0ece4' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#C9A84C' }}>Busca Inteligente com IA</p>
              <span className="text-xs text-gray-400 ml-auto">Descreva o imóvel que você quer</span>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <input
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                placeholder="Descreva o imóvel ideal..."
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent font-medium border-b-2 pb-1.5 transition-colors"
                style={{ borderColor: aiQuery ? '#1B2B5B' : '#e5e7eb' }}
                autoFocus
              />
              <VoiceInputButton onResult={text => { setAiQuery(text); setTimeout(handleAiSearch, 300) }} />
              <button
                type="button"
                onClick={handleAiSearch}
                disabled={aiLoading || !aiQuery.trim() || isPending}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex-shrink-0"
                style={{ backgroundColor: '#1B2B5B', color: 'white' }}
              >
                {aiLoading || isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Buscando...</>
                ) : (
                  <><Search className="w-4 h-4" /> Buscar</>
                )}
              </button>
            </div>

          </div>
        )}

        {/* ── DIVIDER ─────────────────────────────────────────── */}
        {aiMode && (
          <div className="flex items-center gap-3 px-5 py-2.5" style={{ backgroundColor: '#fafafa' }}>
            <div className="flex-1 h-px" style={{ backgroundColor: '#e5e7eb' }} />
            <span className="text-xs text-gray-400 font-medium">ou filtre manualmente</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#e5e7eb' }} />
          </div>
        )}

        {/* ── MANUAL SEARCH ──────────────────────────────────── */}
        <form onSubmit={handleManualSearch}>
          {/* City */}
          <label className="flex items-start gap-4 px-5 py-4 border-b cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0ece4' }}>
            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#1B2B5B' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Cidade</p>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Franca, Ribeirão Preto..."
                className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent font-medium"
              />
            </div>
          </label>

          {/* Neighborhood */}
          <div className="relative" ref={neighborhoodRef}>
            <label className="flex items-start gap-4 px-5 py-4 border-b cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0ece4' }}>
              <Home className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#1B2B5B' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Bairro</p>
                <input
                  value={neighborhood}
                  onChange={e => { setNeighborhood(e.target.value); setShowSuggestions(true) }}
                  onFocus={() => neighborhood.length >= 2 && setShowSuggestions(true)}
                  placeholder="Nome do bairro"
                  className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent font-medium"
                />
              </div>
            </label>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNeighborhood(s.neighborhood ?? '')
                      if (s.city) setCity(s.city)
                      setShowSuggestions(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-800">{s.neighborhood}</span>
                      {s.city && <span className="text-gray-400 ml-1.5">· {s.city}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price + Bedrooms row */}
          <div className="grid grid-cols-2">
            <label className="flex items-start gap-3 px-5 py-4 border-r cursor-pointer hover:bg-gray-50 transition-colors relative" style={{ borderColor: '#f0ece4' }}>
              <DollarSign className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#1B2B5B' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                  {purpose === 'RENT' ? 'Aluguel até' : 'Valor até'}
                </p>
                <div className="relative">
                  <select
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full text-sm text-gray-800 focus:outline-none bg-transparent font-medium appearance-none pr-4 cursor-pointer"
                  >
                    {priceOptions.map(o => (
                      <option key={o.label} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-0.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors relative">
              <BedDouble className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#1B2B5B' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Quartos</p>
                <div className="relative">
                  <select
                    value={bedrooms}
                    onChange={e => setBedrooms(e.target.value)}
                    className="w-full text-sm text-gray-800 focus:outline-none bg-transparent font-medium appearance-none pr-4 cursor-pointer"
                  >
                    {BEDROOM_OPTIONS.map(o => (
                      <option key={o.label} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-0.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </label>
          </div>

          {/* Search button */}
          <div className="p-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              <Search className="w-4 h-4" />
              Buscar imóveis
            </button>
          </div>
        </form>
      </div>

      {/* Map search option */}
      <button
        type="button"
        onClick={handleMapSearch}
        className="mt-4 flex items-center gap-2 mx-auto text-sm font-medium transition-all hover:opacity-80"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        <Map className="w-4 h-4" />
        <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Desenhar área no mapa
        </span>
      </button>
    </div>
  )
}
