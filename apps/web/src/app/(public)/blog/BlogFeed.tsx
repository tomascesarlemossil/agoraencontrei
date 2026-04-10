'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, User, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface BlogPost {
  id: string
  slug: string
  title: string
  subtitle?: string
  excerpt?: string
  coverImage?: string
  category?: { id: string; slug: string; name: string } | null
  cluster?: { id: string; slug: string; name: string } | null
  tags?: string
  authorName?: string
  publishedAt?: string
  views?: number
  featured?: boolean
  source?: string
  videoUrl?: string
  readTime?: number
}

export interface BlogCategory {
  id: string
  slug: string
  name: string
  description?: string
  _count?: { posts: number }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatDate(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function estimateReadTime(excerpt?: string): string {
  return '3 min'
}

/* ------------------------------------------------------------------ */
/*  Post Card                                                          */
/* ------------------------------------------------------------------ */
export function PostCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  const date = formatDate(post.publishedAt)
  const catName = typeof post.category === 'object' && post.category?.name
    ? post.category.name
    : ''
  const catSlug = typeof post.category === 'object' && post.category?.slug
    ? post.category.slug
    : ''

  return (
    <article className="group bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300" style={{ borderColor: '#e8e4dc' }}>
      {/* Image */}
      <Link href={`/blog/${post.slug}`} className="block relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            loading={priority ? 'eager' : 'lazy'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f0ede6' }}>
            <span className="text-4xl text-gray-300">&#9998;</span>
          </div>
        )}
        {/* Category badge overlay */}
        {catName && (
          <span
            className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full text-white shadow-sm"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            {catName}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-5">
        <Link href={`/blog/${post.slug}`}>
          <h2
            className="font-semibold leading-snug line-clamp-2 mb-2 group-hover:opacity-80 transition-opacity"
            style={{ color: '#1f2937', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '1.05rem' }}
          >
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: '#6b7280' }}>
            {post.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs" style={{ color: '#9ca3af' }}>
          <div className="flex items-center gap-3">
            {date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {date}
              </span>
            )}
            {post.readTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime} min
              </span>
            )}
          </div>
          {post.authorName && (
            <span className="flex items-center gap-1 truncate max-w-[120px]">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              {post.authorName}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Featured Carousel                                                  */
/* ------------------------------------------------------------------ */
export function FeaturedCarousel({ posts }: { posts: BlogPost[] }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % posts.length)
    }, 6000)
  }, [posts.length])

  useEffect(() => {
    if (posts.length <= 1) return
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [posts.length, resetTimer])

  if (posts.length === 0) return null

  const post = posts[current]
  const catName = typeof post.category === 'object' && post.category?.name ? post.category.name : ''
  const date = formatDate(post.publishedAt)

  function go(dir: number) {
    setCurrent(c => (c + dir + posts.length) % posts.length)
    resetTimer()
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '21/9', minHeight: '320px' }}>
      {/* Background image */}
      {post.coverImage ? (
        <img
          src={post.coverImage}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: '#1B2B5B' }} />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 sm:p-10">
        {catName && (
          <span
            className="self-start text-xs font-semibold px-3 py-1 rounded-full mb-3"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            {catName}
          </span>
        )}
        <Link href={`/blog/${post.slug}`}>
          <h2
            className="text-white text-xl sm:text-2xl lg:text-3xl font-bold leading-tight line-clamp-2 mb-2 hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {post.title}
          </h2>
        </Link>
        {post.excerpt && (
          <p className="text-white/70 text-sm sm:text-base line-clamp-2 max-w-2xl mb-3">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-white/60">
          {date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {date}</span>}
          {post.authorName && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {post.authorName}</span>}
        </div>
      </div>

      {/* Navigation arrows */}
      {posts.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
            aria-label="Post anterior"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors"
            aria-label="Proximo post"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); resetTimer() }}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: i === current ? '#C9A84C' : 'rgba(255,255,255,0.4)' }}
                aria-label={`Ir para post ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Category Pills                                                     */
/* ------------------------------------------------------------------ */
export function CategoryPills({
  categories,
  active,
  onChange,
}: {
  categories: BlogCategory[]
  active: string
  onChange: (slug: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center" role="tablist" aria-label="Categorias do blog">
      <button
        onClick={() => onChange('')}
        role="tab"
        aria-selected={active === ''}
        className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
        style={
          active === ''
            ? { backgroundColor: '#1B2B5B', color: 'white', borderColor: '#1B2B5B' }
            : { borderColor: '#e8e4dc', color: '#374151', backgroundColor: 'white' }
        }
      >
        Todos
      </button>
      {categories.map(cat => (
        <button
          key={cat.slug}
          onClick={() => onChange(cat.slug)}
          role="tab"
          aria-selected={active === cat.slug}
          className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
          style={
            active === cat.slug
              ? { backgroundColor: '#1B2B5B', color: 'white', borderColor: '#1B2B5B' }
              : { borderColor: '#e8e4dc', color: '#374151', backgroundColor: 'white' }
          }
        >
          {cat.name}
          {cat._count?.posts != null && (
            <span className="ml-1.5 text-xs opacity-60">({cat._count.posts})</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Search Bar                                                         */
/* ------------------------------------------------------------------ */
export function BlogSearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit() }}
      className="relative max-w-xl mx-auto"
    >
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Buscar artigos..."
        className="w-full pl-12 pr-4 py-3 rounded-full border bg-white text-sm focus:outline-none focus:ring-2 transition-all"
        style={{ borderColor: '#e8e4dc', color: '#374151' }}
        aria-label="Buscar artigos no blog"
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: '#9ca3af' }} />
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Feed (with category filter, search, pagination)               */
/* ------------------------------------------------------------------ */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''

export function BlogFeed({
  initialPosts,
  initialTotal,
  categories,
  featuredPosts,
}: {
  initialPosts: BlogPost[]
  initialTotal: number
  categories: BlogCategory[]
  featuredPosts: BlogPost[]
}) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [categorySlug, setCategorySlug] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const limit = 24

  const fetchPosts = useCallback(async (p: number, cat: string, search: string, append = false) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        limit: String(limit),
        page: String(p),
        ...(COMPANY_ID && { companyId: COMPANY_ID }),
        ...(cat && { categorySlug: cat }),
        ...(search && { search }),
      })
      const res = await fetch(`${API_URL}/api/v1/blog?${qs}`)
      if (!res.ok) return
      const json = await res.json()
      const newPosts = json.data ?? json.posts ?? []
      const newTotal = json.meta?.total ?? json.total ?? 0
      if (append) {
        setPosts(prev => [...prev, ...newPosts])
      } else {
        setPosts(newPosts)
      }
      setTotal(newTotal)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  function handleCategoryChange(slug: string) {
    setCategorySlug(slug)
    setPage(1)
    fetchPosts(1, slug, searchTerm)
  }

  function handleSearch() {
    setSearchTerm(searchInput)
    setCategorySlug('')
    setPage(1)
    fetchPosts(1, '', searchInput)
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    fetchPosts(next, categorySlug, searchTerm, true)
  }

  const hasMore = posts.length < total

  return (
    <div className="space-y-10">
      {/* Featured Carousel */}
      {featuredPosts.length > 0 && !categorySlug && !searchTerm && (
        <FeaturedCarousel posts={featuredPosts} />
      )}

      {/* Search */}
      <BlogSearchBar value={searchInput} onChange={setSearchInput} onSubmit={handleSearch} />

      {/* Category pills */}
      {categories.length > 0 && (
        <CategoryPills categories={categories} active={categorySlug} onChange={handleCategoryChange} />
      )}

      {/* Grid */}
      {posts.length === 0 && !loading ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 opacity-30">&#128240;</div>
          <p className="text-lg font-medium" style={{ color: '#374151' }}>Nenhum artigo encontrado.</p>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Tente outra categoria ou termo de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} priority={i < 3} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3 rounded-full text-sm font-semibold border-2 transition-all hover:shadow-md disabled:opacity-50"
            style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
          >
            {loading ? 'Carregando...' : 'Carregar mais artigos'}
          </button>
        </div>
      )}
    </div>
  )
}
