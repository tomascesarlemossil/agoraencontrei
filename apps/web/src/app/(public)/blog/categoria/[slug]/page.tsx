import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { PostCard } from '../../BlogFeed'
import type { BlogPost } from '../../BlogFeed'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

export const revalidate = 60

/* ------------------------------------------------------------------ */
/*  Data Fetching                                                      */
/* ------------------------------------------------------------------ */
async function fetchCategory(slug: string) {
  try {
    const qs = new URLSearchParams({ ...(COMPANY_ID && { companyId: COMPANY_ID }) })
    const res = await fetch(`${API_URL}/api/v1/blog/categories/${slug}?${qs}`, { next: { revalidate: 60 } })
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
  const data = await fetchCategory(params.slug)
  if (!data) return { title: 'Categoria nao encontrada' }

  const category = data.category ?? data
  const name = category.name ?? params.slug
  const description = category.description ?? `Artigos sobre ${name} no blog imobiliario AgoraEncontrei.`
  const canonical = `${WEB_URL}/blog/categoria/${params.slug}`

  return {
    title: `${name} | Blog Imobiliario AgoraEncontrei`,
    description,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      title: `${name} — Blog Imobiliario`,
      description,
      siteName: 'AgoraEncontrei — Imobiliaria Lemos',
      url: canonical,
    },
    alternates: { canonical },
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const data = await fetchCategory(params.slug)
  if (!data) notFound()

  const category = data.category ?? data
  const posts: BlogPost[] = data.posts ?? category.posts ?? []
  const name = category.name ?? params.slug
  const description = category.description ?? ''

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: WEB_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${WEB_URL}/blog` },
      { '@type': 'ListItem', position: 3, name, item: `${WEB_URL}/blog/categoria/${params.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ backgroundColor: '#f8f7f4' }}>
        {/* Hero */}
        <section style={{ backgroundColor: '#1B2B5B' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-8 flex-wrap text-white/40">
              <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/blog" className="hover:text-white/70 transition-colors">Blog</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white/80">{name}</span>
            </nav>

            <div
              className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
            >
              Categoria
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {name}
            </h1>
            {description && (
              <p className="text-white/60 text-base sm:text-lg max-w-2xl leading-relaxed">{description}</p>
            )}
            <p className="text-white/40 text-sm mt-4">
              {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}
            </p>
          </div>
        </section>

        {/* Posts */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4 opacity-30">&#128240;</div>
              <p className="text-lg font-medium" style={{ color: '#374151' }}>Nenhum artigo nesta categoria ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: BlogPost, i: number) => (
                <PostCard key={post.id} post={post} priority={i < 3} />
              ))}
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
    </>
  )
}
