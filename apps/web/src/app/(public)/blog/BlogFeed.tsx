'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Calendar, Eye, Heart, Share2, ExternalLink, Play } from 'lucide-react'

interface Post {
  id: string
  slug: string
  title: string
  excerpt?: string
  coverImage?: string
  category?: string
  tags?: string
  authorName?: string
  publishedAt?: string
  views?: number
  featured?: boolean
  source?: string
  videoUrl?: string
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  mercado:       { label: 'Mercado',       color: '#C9A84C' },
  imoveis:       { label: 'Imóveis',       color: '#2563eb' },
  financiamento: { label: 'Financiamento', color: '#16a34a' },
  leiloes:       { label: 'Leilões',       color: '#dc2626' },
  legislacao:    { label: 'Legislação',    color: '#7c3aed' },
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\s?#]+)/)
  return m ? m[1] : null
}

// A single video card that autopays when in view using IntersectionObserver
function VideoCard({ post }: { post: Post }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const videoId = post.videoUrl ? extractYouTubeId(post.videoUrl) : null
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  useEffect(() => {
    const el = containerRef.current
    if (!el || !videoId) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        if (entry.isIntersecting) setHasPlayed(true)
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [videoId])

  const thumbUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : post.coverImage

  const cat = post.category ? CATEGORIES[post.category] : null

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300"
      style={{ borderColor: '#e8e4dc' }}
    >
      {/* Video / Thumbnail */}
      <div className="relative w-full" style={{ aspectRatio: '16/9', background: '#000' }}>
        {videoId ? (
          isVisible || hasPlayed ? (
            <iframe
              key={isVisible ? 'playing' : 'paused'}
              src={`https://www.youtube.com/embed/${videoId}?autoplay=${isVisible ? 1 : 0}&mute=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&playsinline=1`}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={post.title}
            />
          ) : (
            // Thumbnail placeholder before first intersection
            <div className="absolute inset-0 cursor-pointer group" onClick={() => setHasPlayed(true)}>
              {thumbUrl && (
                <img
                  src={thumbUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 text-white ml-1" fill="white" />
                </div>
              </div>
            </div>
          )
        ) : thumbUrl ? (
          <img src={thumbUrl} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Play className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Category badge overlay */}
        {cat && (
          <div className="absolute top-3 left-3">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white shadow"
              style={{ backgroundColor: cat.color }}
            >
              {cat.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/blog/${post.slug}`}>
          <h2
            className="font-bold text-gray-900 leading-snug line-clamp-2 hover:underline mb-2 text-sm sm:text-base"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {date}
              </span>
            )}
            {(post.views ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.views}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/blog/${post.slug}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-semibold hover:brightness-110 transition"
              style={{ backgroundColor: '#1B2B5B' }}
            >
              Ver mais <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Source */}
        {post.source && (
          <p className="text-xs text-gray-300 mt-2 truncate">{post.source}</p>
        )}
      </div>
    </div>
  )
}

// Main feed component
export function BlogFeed({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">📰</p>
        <p className="text-gray-500 text-lg">Nenhum artigo publicado ainda.</p>
        <p className="text-gray-500 text-sm mt-1">Volte em breve!</p>
      </div>
    )
  }

  // Split: first featured/video post gets a hero slot, rest in grid
  const [hero, ...rest] = posts

  return (
    <div className="space-y-6">
      {/* Hero — first post full width */}
      <div className="max-w-2xl mx-auto">
        <VideoCard post={hero} />
      </div>

      {/* Feed grid — 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rest.map(post => (
          <VideoCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
