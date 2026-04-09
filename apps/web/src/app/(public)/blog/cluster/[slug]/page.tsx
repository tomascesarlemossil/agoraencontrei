import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft, Star } from 'lucide-react'
import { PostCard } from '../../BlogFeed'
import type { BlogPost } from '../../BlogFeed'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

export const revalidate = 60

/* ------------------------------------------------------------------ */
/*  Data Fetching                                                      */
/* ------------------------------------------------------------------ */
async function fetchCluster(slug: string) {
  try {
    const qs = new URLSearchParams({ ...(COMPANY_ID && { companyId: COMPANY_ID }) })
    const res = await fetch(`${API_URL}/api/v1/blog/clusters/${slug}?${qs}`, { next: { revalidate: 60 } })
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
  const data = await fetchCluster(params.slug)
  if (!data) return { title: 'Cluster nao encontrado' }

  const cluster = data.cluster ?? data
  const name = cluster.name ?? params.slug
  const description = cluster.description ?? `Guia completo sobre ${name} — artigos e dicas no blog AgoraEncontrei.`
  const canonical = `${WEB_URL}/blog/cluster/${params.slug}`

  return {
    title: `${name} | Guia Completo — Blog AgoraEncontrei`,
    description,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      title: `${name} — Guia Completo`,
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
export default async function ClusterPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const data = await fetchCluster(params.slug)
  if (!data) notFound()

  const cluster = data.cluster ?? data
  const name = cluster.name ?? params.slug
  const description = cluster.description ?? ''
  const pillarPost: BlogPost | null = cluster.pillarPost ?? null
  const satellitePosts: BlogPost[] = cluster.posts ?? cluster.satellitePosts ?? []
  const category = cluster.category ?? null

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: WEB_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${WEB_URL}/blog` },
      { '@type': 'ListItem', position: 3, name, item: `${WEB_URL}/blog/cluster/${params.slug}` },
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

            <div className="flex items-center gap-3 mb-5">
              <div
                className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
              >
                Guia Completo
              </div>
              {category && (
                <Link
                  href={`/blog/categoria/${category.slug}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full text-white/70 hover:text-white border border-white/20 transition-colors"
                >
                  {category.name}
                </Link>
              )}
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
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Pillar Post — highlighted */}
          {pillarPost && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5" style={{ color: '#C9A84C' }} />
                <h2
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: '#1B2B5B', fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  Artigo Principal
                </h2>
              </div>

              <Link
                href={`/blog/${pillarPost.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all"
                style={{ borderColor: '#C9A84C' }}
              >
                <div className="flex flex-col md:flex-row">
                  {pillarPost.coverImage && (
                    <div className="md:w-2/5 flex-shrink-0 overflow-hidden" style={{ aspectRatio: '16/10' }}>
                      <img
                        src={pillarPost.coverImage}
                        alt={pillarPost.title}
                        loading="eager"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 sm:p-8 flex flex-col justify-center">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: '#C9A84C' }}
                    >
                      Guia Completo
                    </span>
                    <h3
                      className="text-xl sm:text-2xl font-bold leading-tight mb-3 group-hover:opacity-80 transition-opacity"
                      style={{ color: '#1B2B5B', fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {pillarPost.title}
                    </h3>
                    {pillarPost.excerpt && (
                      <p className="text-sm leading-relaxed line-clamp-3 mb-4" style={{ color: '#6b7280' }}>
                        {pillarPost.excerpt}
                      </p>
                    )}
                    <span
                      className="inline-flex items-center gap-1 text-sm font-semibold"
                      style={{ color: '#1B2B5B' }}
                    >
                      Ler artigo completo
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Satellite Posts */}
          {satellitePosts.length > 0 && (
            <section className="mb-12">
              <h2
                className="text-lg sm:text-xl font-bold mb-6"
                style={{ color: '#1B2B5B', fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Artigos do Guia
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {satellitePosts.map((post: BlogPost, i: number) => (
                  <PostCard key={post.id} post={post} priority={i < 3} />
                ))}
              </div>
            </section>
          )}

          {satellitePosts.length === 0 && !pillarPost && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4 opacity-30">&#128218;</div>
              <p className="text-lg font-medium" style={{ color: '#374151' }}>Nenhum artigo neste guia ainda.</p>
            </div>
          )}

          {/* Back link */}
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
