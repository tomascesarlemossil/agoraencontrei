import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Eye, Tag, ArrowLeft, Share2, Building, ExternalLink } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

async function fetchPost(slug: string) {
  try {
    const qs = new URLSearchParams({ ...(COMPANY_ID && { companyId: COMPANY_ID }) })
    const res = await fetch(`${API_URL}/api/v1/blog/${slug}?${qs}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPost(params.slug)
  if (!post) return { title: 'Artigo não encontrado' }
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    keywords: post.seoKeywords ?? undefined,
    authors: [{ name: post.authorName }],
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
      publishedTime: post.publishedAt,
      siteName: 'Imobiliária Lemos',
    },
    alternates: { canonical: `${WEB_URL}/blog/${post.slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug)
  if (!post) notFound()

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  // Structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? post.seoDescription,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.authorName },
    publisher: {
      '@type': 'Organization',
      name: 'Imobiliária Lemos',
      logo: { '@type': 'ImageObject', url: `${WEB_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${WEB_URL}/blog/${post.slug}` },
  }

  const shareUrl = `${WEB_URL}/blog/${post.slug}`
  const shareText = encodeURIComponent(post.title)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-800">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-gray-800">Blog</Link>
          <span>/</span>
          <span className="line-clamp-1">{post.title}</span>
        </nav>

        {/* Back button */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-80 transition-opacity" style={{ color: '#1B2B5B' }}>
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Blog
        </Link>

        {/* Cover image */}
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="w-full h-64 sm:h-96 object-cover rounded-2xl mb-8" />
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
          {date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {date}</span>}
          {post.views > 0 && <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {post.views} leituras</span>}
          {post.source && (
            <span className="flex items-center gap-1">
              Fonte: {post.sourceUrl
                ? <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 flex items-center gap-0.5">{post.source} <ExternalLink className="w-3 h-3" /></a>
                : post.source}
            </span>
          )}
        </div>

        {/* Tags */}
        {post.tags && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.split(',').map((tag: string) => (
              <Link key={tag} href={`/blog?tag=${tag.trim()}`} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border hover:shadow-sm transition-all" style={{ borderColor: '#e8e4dc', color: '#374151' }}>
                <Tag className="w-3 h-3" />
                {tag.trim()}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 leading-snug" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          {post.title}
        </h1>

        {/* Author */}
        <div className="flex items-center gap-3 pb-6 mb-8 border-b" style={{ borderColor: '#e8e4dc' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: '#1B2B5B' }}>
            {post.authorName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">{post.authorName}</p>
            <p className="text-xs text-gray-500">Imobiliária Lemos — CRECI 279051</p>
          </div>
        </div>

        {/* Content */}
        <article
          className="prose prose-lg max-w-none"
          style={{ color: '#374151', lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
        />

        {/* Share */}
        <div className="mt-12 pt-6 border-t" style={{ borderColor: '#e8e4dc' }}>
          <p className="text-sm font-semibold text-gray-600 mb-3">Compartilhar:</p>
          <div className="flex gap-3">
            <a
              href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#1877F2' }}
            >
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#1DA1F2' }}
            >
              Twitter
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 p-6 rounded-2xl text-white text-center" style={{ backgroundColor: '#1B2B5B' }}>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>Procurando um imóvel em Franca?</h3>
          <p className="text-white/80 text-sm mb-4">Veja nosso portfólio completo de imóveis à venda e para alugar.</p>
          <Link
            href="/imoveis"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            Ver Imóveis <Building className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  )
}
