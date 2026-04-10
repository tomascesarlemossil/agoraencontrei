import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Eye,
  Clock,
  ArrowLeft,
  Building,
  ChevronRight,
  Tag,
  User,
  Share2,
} from 'lucide-react'
import { PostCard } from '../BlogFeed'
import type { BlogPost } from '../BlogFeed'
import { BlogPostFaqAccordion, BlogShareButtons } from './PostClientComponents'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const post = await fetchPost(params.slug)
  if (!post) return { title: 'Artigo nao encontrado' }

  const canonical = `${WEB_URL}/blog/${post.slug}`
  const images = post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }] : []

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    keywords: post.seoKeywords ?? undefined,
    authors: [{ name: post.authorName ?? 'AgoraEncontrei' }],
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      images,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      siteName: 'AgoraEncontrei — Imobiliaria Lemos',
      url: canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
    alternates: { canonical },
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatDate(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\s?#]+)/)
  return match ? match[1] : null
}

function estimateReadTime(content?: string): number {
  if (!content) return 3
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const post = await fetchPost(params.slug)
  if (!post) notFound()

  const date = formatDate(post.publishedAt)
  const readTime = post.readTime ?? estimateReadTime(post.content)
  const shareUrl = `${WEB_URL}/blog/${post.slug}`
  const videoId = post.videoUrl ? extractYouTubeId(post.videoUrl) : null

  // Category / cluster info
  const category = post.category ?? null
  const cluster = post.cluster ?? null
  const relatedByCategory: BlogPost[] = post.relatedByCategory ?? []
  const satellitePosts: BlogPost[] = cluster?.posts ?? cluster?.satellitePosts ?? []
  const pillarPost = cluster?.pillarPost ?? null
  const faq: { question: string; answer: string }[] = post.faq ?? []

  // ---- Structured Data ----
  const blogPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription ?? post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.authorName ?? 'AgoraEncontrei',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AgoraEncontrei — Imobiliaria Lemos',
      logo: { '@type': 'ImageObject', url: `${WEB_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': shareUrl },
    wordCount: post.content ? post.content.replace(/<[^>]*>/g, '').split(/\s+/).length : undefined,
  }

  const breadcrumbItems = [
    { '@type': 'ListItem' as const, position: 1, name: 'Home', item: WEB_URL },
    { '@type': 'ListItem' as const, position: 2, name: 'Blog', item: `${WEB_URL}/blog` },
  ]
  if (category) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: category.name,
      item: `${WEB_URL}/blog/categoria/${category.slug}`,
    })
    breadcrumbItems.push({ '@type': 'ListItem', position: 4, name: post.title, item: shareUrl })
  } else {
    breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: post.title, item: shareUrl })
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  }

  const faqLd =
    faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map(f => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <div style={{ backgroundColor: '#f8f7f4' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-8 flex-wrap" style={{ color: '#9ca3af' }}>
            <Link href="/" className="hover:underline" style={{ color: '#6b7280' }}>Home</Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link href="/blog" className="hover:underline" style={{ color: '#6b7280' }}>Blog</Link>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                <Link href={`/blog/categoria/${category.slug}`} className="hover:underline" style={{ color: '#6b7280' }}>
                  {category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1" style={{ color: '#374151' }}>{post.title}</span>
          </nav>

          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium mb-8 hover:opacity-80 transition-opacity"
            style={{ color: '#1B2B5B' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Blog
          </Link>

          {/* Title */}
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-4"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {post.title}
          </h1>

          {/* Subtitle */}
          {post.subtitle && (
            <p className="text-lg sm:text-xl leading-relaxed mb-6" style={{ color: '#6b7280' }}>
              {post.subtitle}
            </p>
          )}

          {/* Meta bar */}
          <div className="flex flex-wrap items-center gap-3 mb-8 text-sm" style={{ color: '#9ca3af' }}>
            {category && (
              <Link
                href={`/blog/categoria/${category.slug}`}
                className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: '#1B2B5B' }}
              >
                {category.name}
              </Link>
            )}
            {cluster && (
              <Link
                href={`/blog/cluster/${cluster.slug}`}
                className="text-xs font-semibold px-3 py-1 rounded-full border"
                style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
              >
                {cluster.name}
              </Link>
            )}
            {date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {date}
              </span>
            )}
            {post.views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {post.views.toLocaleString('pt-BR')} leituras
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {readTime} min de leitura
            </span>
          </div>

          {/* Author bar */}
          <div className="flex items-center gap-3 pb-8 mb-8 border-b" style={{ borderColor: '#e8e4dc' }}>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ backgroundColor: '#1B2B5B' }}
            >
              {(post.authorName ?? 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#1f2937' }}>
                {post.authorName ?? 'AgoraEncontrei'}
              </p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>Imobiliaria Lemos</p>
            </div>
          </div>

          {/* Cover Image / Video */}
          {videoId ? (
            <div className="w-full rounded-2xl overflow-hidden mb-10 shadow-md" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={post.title}
                loading="lazy"
              />
            </div>
          ) : post.coverImage ? (
            <div className="w-full rounded-2xl overflow-hidden mb-10 shadow-md">
              <img
                src={post.coverImage}
                alt={post.title}
                loading="eager"
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          ) : null}

          {/* Article Content */}
          <article
            className="mb-12"
            style={{
              color: '#374151',
              lineHeight: '1.85',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '1.0625rem',
            }}
          >
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, '<br />') ?? '' }}
            />
            {/* Scoped styles for article content */}
            <style dangerouslySetInnerHTML={{ __html: `
              .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 {
                font-family: Georgia, "Times New Roman", serif;
                color: #1f2937;
                margin-top: 2em;
                margin-bottom: 0.75em;
                line-height: 1.3;
                font-weight: 700;
              }
              .blog-content h2 { font-size: 1.5em; padding-bottom: 0.4em; border-bottom: 1px solid #e8e4dc; }
              .blog-content h3 { font-size: 1.25em; }
              .blog-content h4 { font-size: 1.1em; }
              .blog-content p { margin-bottom: 1.25em; }
              .blog-content a { color: #1B2B5B; text-decoration: underline; text-underline-offset: 2px; }
              .blog-content a:hover { color: #C9A84C; }
              .blog-content ul, .blog-content ol { padding-left: 1.5em; margin-bottom: 1.25em; }
              .blog-content li { margin-bottom: 0.5em; }
              .blog-content ul li { list-style-type: disc; }
              .blog-content ol li { list-style-type: decimal; }
              .blog-content blockquote {
                border-left: 4px solid #C9A84C;
                padding: 1em 1.5em;
                margin: 1.5em 0;
                background: #fdfcf9;
                color: #4b5563;
                font-style: italic;
                border-radius: 0 0.5rem 0.5rem 0;
              }
              .blog-content img {
                max-width: 100%;
                height: auto;
                border-radius: 0.75rem;
                margin: 1.5em 0;
              }
              .blog-content table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
              .blog-content th, .blog-content td {
                border: 1px solid #e8e4dc;
                padding: 0.75em 1em;
                text-align: left;
              }
              .blog-content th { background: #f8f7f4; font-weight: 600; color: #1f2937; }
              .blog-content pre, .blog-content code {
                background: #f3f0ea;
                border-radius: 0.375rem;
                font-size: 0.9em;
              }
              .blog-content pre { padding: 1em; overflow-x: auto; margin: 1.5em 0; }
              .blog-content code { padding: 0.15em 0.4em; }
              .blog-content hr { border: none; border-top: 1px solid #e8e4dc; margin: 2em 0; }
              .blog-content strong { color: #1f2937; }
            `}} />
          </article>

          {/* Tags */}
          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-10">
              {post.tags.split(',').map((tag: string) => (
                <Link
                  key={tag.trim()}
                  href={`/blog/busca?q=${encodeURIComponent(tag.trim())}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border hover:shadow-sm transition-all"
                  style={{ borderColor: '#e8e4dc', color: '#6b7280', backgroundColor: 'white' }}
                >
                  <Tag className="w-3 h-3" />
                  {tag.trim()}
                </Link>
              ))}
            </div>
          )}

          {/* FAQ Section */}
          {faq.length > 0 && (
            <section className="mb-12">
              <h2
                className="text-xl sm:text-2xl font-bold mb-6"
                style={{ color: '#1B2B5B', fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Perguntas Frequentes
              </h2>
              <BlogPostFaqAccordion items={faq} />
            </section>
          )}

          {/* CTA Section */}
          {post.ctaFinal ? (
            <div className="rounded-2xl p-8 sm:p-10 text-center mb-12" style={{ backgroundColor: '#1B2B5B' }}>
              <div dangerouslySetInnerHTML={{ __html: post.ctaFinal }} className="text-white" />
            </div>
          ) : (
            <div className="rounded-2xl p-8 sm:p-10 text-center mb-12" style={{ backgroundColor: '#1B2B5B' }}>
              <h3
                className="text-xl sm:text-2xl font-bold text-white mb-3"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Procurando um imovel em Franca?
              </h3>
              <p className="text-white/70 text-sm sm:text-base mb-6 max-w-lg mx-auto">
                Veja nosso portfolio completo de imoveis a venda e para alugar em Franca e regiao.
              </p>
              <Link
                href="/imoveis"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-all hover:brightness-110"
                style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
              >
                Ver Imoveis <Building className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Share */}
          <div className="mb-12 pb-8 border-b" style={{ borderColor: '#e8e4dc' }}>
            <p className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: '#1f2937' }}>
              <Share2 className="w-4 h-4" /> Compartilhar este artigo
            </p>
            <BlogShareButtons url={shareUrl} title={post.title} />
          </div>

          {/* Pillar post link */}
          {pillarPost && pillarPost.slug !== post.slug && (
            <div className="mb-12 p-6 rounded-2xl border bg-white" style={{ borderColor: '#e8e4dc' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#C9A84C' }}>
                Guia Completo
              </p>
              <Link href={`/blog/${pillarPost.slug}`} className="group">
                <h3
                  className="text-lg font-bold group-hover:opacity-80 transition-opacity"
                  style={{ color: '#1B2B5B', fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {pillarPost.title}
                </h3>
                {pillarPost.excerpt && (
                  <p className="text-sm mt-2 line-clamp-2" style={{ color: '#6b7280' }}>{pillarPost.excerpt}</p>
                )}
              </Link>
            </div>
          )}

          {/* Cluster satellite posts: "Leia tambem" */}
          {satellitePosts.length > 0 && (
            <section className="mb-12">
              <h2
                className="text-xl sm:text-2xl font-bold mb-6"
                style={{ color: '#1B2B5B', fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Leia tambem
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {satellitePosts.filter((p: BlogPost) => p.slug !== post.slug).slice(0, 6).map((p: BlogPost) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {/* Related by category */}
          {relatedByCategory.length > 0 && (
            <section className="mb-12">
              <h2
                className="text-xl sm:text-2xl font-bold mb-6"
                style={{ color: '#1B2B5B', fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Posts relacionados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedByCategory.filter((p: BlogPost) => p.slug !== post.slug).slice(0, 6).map((p: BlogPost) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {/* Back to blog */}
          <div className="text-center pt-4">
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
    </>
  )
}
