import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Home, DollarSign, Gavel, BookOpen, Building } from 'lucide-react'
import { BlogFeed } from './BlogFeed'

export const metadata: Metadata = {
  title: 'Blog Imobiliário | AgoraEncontrei — Dicas, Notícias e Mercado',
  description: 'Fique por dentro do mercado imobiliário de Franca e região. Dicas para comprar e alugar imóveis, financiamento imobiliário, guias de bairros, legislação e muito mais. AgoraEncontrei — Imobiliária Lemos.',
  keywords: 'blog imobiliário, imóveis franca sp, comprar imóvel franca sp, alugar imóvel franca sp, financiamento imobiliário franca, mercado imobiliário franca, guia bairros franca, administração imóveis franca, investimento imobiliário franca, ITBI franca sp, IPTU franca sp, escritura imóvel franca, contrato locação franca, lei do inquilinato, dicas compra imóvel, como financiar imóvel caixa, FGTS compra imóvel, minha casa minha vida franca, agoraencontrei blog, casas à venda franca sp dicas, apartamentos para alugar franca dicas',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Blog Imobiliário | AgoraEncontrei — Imobiliária Lemos',
    description: 'Tudo sobre o mercado imobiliário de Franca: compra, venda, aluguel, financiamento, investimento e guias de bairros.',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
}

export const revalidate = 60

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''

const CATEGORIES = [
  { key: '', label: 'Todos', icon: BookOpen, color: '#1B2B5B' },
  { key: 'mercado', label: 'Mercado', icon: TrendingUp, color: '#C9A84C' },
  { key: 'imoveis', label: 'Imóveis', icon: Home, color: '#2563eb' },
  { key: 'financiamento', label: 'Financiamento', icon: DollarSign, color: '#16a34a' },
  { key: 'leiloes', label: 'Leilões', icon: Gavel, color: '#dc2626' },
  { key: 'legislacao', label: 'Legislação', icon: Building, color: '#7c3aed' },
]

async function fetchPosts(category?: string) {
  try {
    const qs = new URLSearchParams({ limit: '24', ...(COMPANY_ID && { companyId: COMPANY_ID }), ...(category && { category }) })
    const res = await fetch(`${API_URL}/api/v1/blog?${qs}`, { next: { revalidate: 300 } })
    if (!res.ok) return { data: [], meta: { total: 0 } }
    return res.json()
  } catch {
    return { data: [], meta: { total: 0 } }
  }
}

export default async function BlogPage(props: { searchParams: Promise<{ category?: string }> }) {
  const searchParams = await props.searchParams
  const { data: posts } = await fetchPosts(searchParams.category)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Blog Imobiliário
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Notícias, dicas e vídeos sobre o mercado imobiliário de Franca e região.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {CATEGORIES.map(cat => {
          const active = (searchParams.category ?? '') === cat.key
          return (
            <Link
              key={cat.key}
              href={cat.key ? `/blog?category=${cat.key}` : '/blog'}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all"
              style={active
                ? { backgroundColor: cat.color, color: 'white', borderColor: cat.color }
                : { borderColor: '#e8e4dc', color: '#374151', backgroundColor: 'white' }}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </Link>
          )
        })}
      </div>

      {/* Feed with autoplay */}
      <BlogFeed posts={posts ?? []} />
    </div>
  )
}
