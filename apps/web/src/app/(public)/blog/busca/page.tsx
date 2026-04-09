'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, ArrowLeft, Loader2 } from 'lucide-react'
import { PostCard } from '../BlogFeed'
import type { BlogPost } from '../BlogFeed'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''

export default function BlogSearchPage() {
  const [query, setQuery] = useState('')
  const [searchedQuery, setSearchedQuery] = useState('')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Get initial query from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q') ?? ''
    if (q) {
      setQuery(q)
      doSearch(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) return
    setLoading(true)
    setHasSearched(true)
    setSearchedQuery(term.trim())
    try {
      const qs = new URLSearchParams({
        limit: '24',
        page: '1',
        search: term.trim(),
        ...(COMPANY_ID && { companyId: COMPANY_ID }),
      })
      const res = await fetch(`${API_URL}/api/v1/blog?${qs}`)
      if (!res.ok) { setPosts([]); setTotal(0); return }
      const json = await res.json()
      setPosts(json.data ?? json.posts ?? [])
      setTotal(json.meta?.total ?? json.total ?? 0)
    } catch {
      setPosts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSearch(query)
    // Update URL without reload
    const url = new URL(window.location.href)
    if (query.trim()) {
      url.searchParams.set('q', query.trim())
    } else {
      url.searchParams.delete('q')
    }
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div style={{ backgroundColor: '#f8f7f4' }}>
      {/* Hero */}
      <section style={{ backgroundColor: '#1B2B5B' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Buscar no Blog
          </h1>

          <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="O que voce procura? Ex: financiamento, FGTS, bairros..."
              className="w-full pl-12 pr-28 py-4 rounded-full text-sm focus:outline-none focus:ring-2 transition-all shadow-lg"
              style={{ color: '#374151', borderColor: 'transparent' }}
              aria-label="Buscar artigos"
              autoFocus
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9ca3af' }} />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>
      </section>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B2B5B' }} />
          </div>
        )}

        {!loading && hasSearched && (
          <>
            <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
              {total > 0
                ? `${total} ${total === 1 ? 'resultado' : 'resultados'} para "${searchedQuery}"`
                : `Nenhum resultado encontrado para "${searchedQuery}"`}
            </p>

            {posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, i) => (
                  <PostCard key={post.id} post={post} priority={i < 3} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 opacity-30">&#128269;</div>
                <p className="text-lg font-medium mb-2" style={{ color: '#374151' }}>
                  Nenhum artigo encontrado
                </p>
                <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
                  Tente buscar com outros termos ou navegue pelas categorias.
                </p>
              </div>
            )}
          </>
        )}

        {!loading && !hasSearched && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 opacity-30">&#128270;</div>
            <p className="text-lg font-medium mb-2" style={{ color: '#374151' }}>
              Digite algo para buscar
            </p>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Encontre artigos sobre mercado imobiliario, financiamento, bairros e muito mais.
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="text-center pt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border-2 transition-all hover:shadow-md"
            style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Blog
          </Link>
        </div>
      </div>
    </div>
  )
}
