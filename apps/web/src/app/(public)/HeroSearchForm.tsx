'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, Sparkles, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const TAB_OPTIONS = [
  { value: 'SALE', label: 'Comprar' },
  { value: 'RENT', label: 'Alugar' },
]

async function interpretSearch(q: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/search-ai?q=${encodeURIComponent(q)}`)
    if (!res.ok) return { search: q }
    return res.json()
  } catch {
    return { search: q }
  }
}

export function HeroSearchForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [purpose, setPurpose] = useState('SALE')
  const [search, setSearch] = useState('')
  const [isAiSearching, setIsAiSearching] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) {
      startTransition(() => router.push(`/imoveis?purpose=${purpose}`))
      return
    }

    // Use AI to interpret the search if it looks like a natural language query (>3 words)
    const wordCount = search.trim().split(/\s+/).length
    const params = new URLSearchParams()

    if (wordCount >= 3) {
      setIsAiSearching(true)
      try {
        const filters = await interpretSearch(search.trim())
        // Merge AI filters with selected purpose (purpose tab takes priority)
        if (filters.type) params.set('type', filters.type)
        params.set('purpose', filters.purpose ?? purpose)
        if (filters.bedrooms) params.set('bedrooms', String(filters.bedrooms))
        if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
        if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
        if (filters.city) params.set('city', filters.city)
        if (filters.neighborhood) params.set('search', filters.neighborhood)
        else if (filters.search) params.set('search', filters.search)
      } catch {
        params.set('purpose', purpose)
        params.set('search', search.trim())
      } finally {
        setIsAiSearching(false)
      }
    } else {
      params.set('purpose', purpose)
      params.set('search', search.trim())
    }

    startTransition(() => router.push(`/imoveis?${params}`))
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div
        className="inline-flex rounded-xl p-1 mb-3"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        {TAB_OPTIONS.map(tab => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setPurpose(tab.value)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: purpose === tab.value ? '#C9A84C' : 'transparent',
              color: purpose === tab.value ? '#1B2B5B' : 'rgba(255,255,255,0.6)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl">
        <div className="flex-1 flex items-center">
          {isAiSearching ? (
            <Loader2 className="w-4 h-4 text-gray-400 mx-4 animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-gray-400 mx-4 flex-shrink-0" />
          )}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ex: apartamento 2 quartos para alugar no centro..."
            className="flex-1 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-transparent pr-2"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || isAiSearching}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60"
          style={{ backgroundColor: '#1B2B5B', color: 'white' }}
        >
          {isAiSearching ? (
            <><Sparkles className="w-4 h-4 animate-pulse" /> IA</>
          ) : (
            <><Search className="w-4 h-4" /> Buscar</>
          )}
        </button>
      </div>

      {/* AI hint */}
      <p className="text-white/30 text-xs mt-2 flex items-center justify-center gap-1">
        <Sparkles className="w-3 h-3" />
        Busca inteligente com IA — descreva o imóvel que você procura
      </p>
    </form>
  )
}
