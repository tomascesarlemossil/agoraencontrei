import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogFeed } from './BlogFeed'
import type { BlogPost, BlogCategory } from './BlogFeed'

export const metadata: Metadata = {
  title: 'Blog Imobiliario | AgoraEncontrei — Dicas, Noticias e Mercado Imobiliario',
  description:
    'Fique por dentro do mercado imobiliario de Franca e regiao. Dicas para comprar e alugar imoveis, financiamento imobiliario, guias de bairros, legislacao e muito mais. AgoraEncontrei — Imobiliaria Lemos.',
  keywords:
    'blog imobiliario, imoveis franca sp, comprar imovel franca sp, alugar imovel franca sp, financiamento imobiliario franca, mercado imobiliario franca, guia bairros franca, administracao imoveis franca, investimento imobiliario franca, ITBI franca sp, IPTU franca sp, escritura imovel franca, contrato locacao franca, lei do inquilinato, dicas compra imovel, como financiar imovel caixa, FGTS compra imovel, minha casa minha vida franca, agoraencontrei blog',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Blog Imobiliario | AgoraEncontrei — Imobiliaria Lemos',
    description:
      'Tudo sobre o mercado imobiliario de Franca: compra, venda, aluguel, financiamento, investimento e guias de bairros.',
    siteName: 'AgoraEncontrei — Imobiliaria Lemos',
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'}/blog`,
  },
}

export const revalidate = 60

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

async function fetchPosts() {
  try {
    const qs = new URLSearchParams({
      limit: '24',
      page: '1',
      ...(COMPANY_ID && { companyId: COMPANY_ID }),
    })
    const res = await fetch(`${API_URL}/api/v1/blog?${qs}`, { next: { revalidate: 60 } })
    if (!res.ok) return { data: [], meta: { total: 0 } }
    return res.json()
  } catch {
    return { data: [], meta: { total: 0 } }
  }
}

async function fetchFeatured() {
  try {
    const qs = new URLSearchParams({
      limit: '5',
      featured: 'true',
      ...(COMPANY_ID && { companyId: COMPANY_ID }),
    })
    const res = await fetch(`${API_URL}/api/v1/blog?${qs}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? json.posts ?? []
  } catch {
    return []
  }
}

async function fetchCategories() {
  try {
    const qs = new URLSearchParams({
      ...(COMPANY_ID && { companyId: COMPANY_ID }),
    })
    const res = await fetch(`${API_URL}/api/v1/blog/categories?${qs}`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json) ? json : json.data ?? []
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const [postsData, featured, categories] = await Promise.all([
    fetchPosts(),
    fetchFeatured(),
    fetchCategories(),
  ])

  const posts: BlogPost[] = postsData.data ?? postsData.posts ?? []
  const total = postsData.meta?.total ?? postsData.total ?? 0

  // JSON-LD for blog listing
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Imobiliario AgoraEncontrei',
    description: 'Noticias, dicas e guias sobre o mercado imobiliario de Franca e regiao.',
    url: `${WEB_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'AgoraEncontrei — Imobiliaria Lemos',
      logo: { '@type': 'ImageObject', url: `${WEB_URL}/logo.png` },
    },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: WEB_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${WEB_URL}/blog` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div style={{ backgroundColor: '#f8f7f4' }}>
        {/* Hero */}
        <section className="relative overflow-hidden" style={{ backgroundColor: '#1B2B5B' }}>
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center relative">
            <div
              className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
            >
              Conhecimento Imobiliario
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Blog Imobiliario
            </h1>
            <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Noticias, analises e guias para quem quer comprar, vender, alugar ou investir em imoveis em Franca e regiao.
            </p>
          </div>
        </section>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <BlogFeed
            initialPosts={posts}
            initialTotal={total}
            categories={categories}
            featuredPosts={featured}
          />
        </div>
      </div>
    </>
  )
}
