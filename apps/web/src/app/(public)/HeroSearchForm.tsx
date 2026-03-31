'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, useEffect, useRef } from 'react'
import { MapPin, Home, DollarSign, BedDouble, Search, Map, ChevronDown, Sparkles } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const PRICE_SALE_OPTIONS = [
  { label: 'Escolha o valor', value: '' },
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
  { label: 'Acima de R$ 2.000.000', value: '' },
]

const PRICE_RENT_OPTIONS = [
  { label: 'Escolha o valor', value: '' },
  { label: 'Até R$ 500/mês', value: '500' },
  { label: 'Até R$ 800/mês', value: '800' },
  { label: 'Até R$ 1.000/mês', value: '1000' },
  { label: 'Até R$ 1.500/mês', value: '1500' },
  { label: 'Até R$ 2.000/mês', value: '2000' },
  { label: 'Até R$ 3.000/mês', value: '3000' },
  { label: 'Até R$ 5.000/mês', value: '5000' },
  { label: 'Acima de R$ 5.000/mês', value: '' },
]

const BEDROOM_OPTIONS = [
  { label: 'Nº de quartos', value: '' },
  { label: '1+ quarto', value: '1' },
  { label: '2+ quartos', value: '2' },
  { label: '3+ quartos', value: '3' },
  { label: '4+ quartos', value: '4' },
  { label: '5+ quartos', value: '5' },
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

  function buildParams() {
    const params = new URLSearchParams()
    params.set('purpose', purpose)
    if (city.trim())         params.set('city', city.trim())
    if (neighborhood.trim()) params.set('search', neighborhood.trim())
    if (maxPrice)            params.set('maxPrice', maxPrice)
    if (bedrooms)            params.set('bedrooms', bedrooms)
    return params
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => router.push(`/imoveis?${buildParams()}`))
  }

  function handleMapSearch() {
    startTransition(() => router.push(`/imoveis?${buildParams()}&view=map`))
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
      </div>

      {/* Search form card */}
      <form onSubmit={handleSearch} className="rounded-3xl bg-white shadow-2xl overflow-visible">
        {/* City */}
        <label className="flex items-start gap-4 px-5 py-4 border-b cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#f0ece4' }}>
          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#1B2B5B' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Cidade</p>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Busque por cidade"
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
                placeholder="Busque por bairro"
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
          {/* Price */}
          <label className="flex items-start gap-3 px-5 py-4 border-r cursor-pointer hover:bg-gray-50 transition-colors relative" style={{ borderColor: '#f0ece4' }}>
            <DollarSign className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#1B2B5B' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                {purpose === 'RENT' ? 'Valor total até' : 'Imóvel até'}
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

          {/* Bedrooms */}
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
            style={{ backgroundColor: '#1B2B5B', color: 'white' }}
          >
            <Search className="w-4 h-4" />
            Buscar imóveis
          </button>
        </div>
      </form>

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

      {/* AI hint */}
      <p className="text-white/20 text-xs mt-3 flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3" />
        Busca inteligente com IA também disponível
      </p>
    </div>
  )
}
