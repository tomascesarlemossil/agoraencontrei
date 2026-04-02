import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Tag, Eye, ArrowRight, TrendingUp, Home, DollarSign, Gavel, BookOpen, Building } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog Imobiliário | Imobiliária Lemos — Dicas, Notícias e Mercado',
  description: 'Fique por dentro do mercado imobiliário de Franca e região. Dicas para comprar e alugar imóveis, financiamento imobiliário, leilões, legislação e muito mais.',
  keywords: 'imóveis franca, comprar imóvel franca, alugar imóvel franca, financiamento imobiliário, mercado imobiliário, leilão imóvel, administração imóveis, investimento imobiliário, ITBI, IPTU, escritura imóvel, vistoria imóvel, contrato locação, lei do inquilinato',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Blog Imobiliário | Imobiliária Lemos',
    description: 'Tudo sobre o mercado imobiliário de Franca: compra, venda, aluguel, financiamento, investimento e legislação.',
    siteName: 'Imobiliária Lemos',
  },
}

export const revalidate = 300

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

function CategoryBadge({ category }: { category: string | null }) {
  const cat = CATEGORIES.find(c => c.key === category)
  if (!cat || !cat.key) return null
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: cat.color }}>
      {cat.label}
    </span>
  )
}

function PostCard({ post }: { post: any }) {
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  return (
    <Link href={`/blog/${post.slug}`} className="group bg-white rounded-2xl overflow-hidden border hover:shadow-xl hover:border-transparent transition-all duration-300" style={{ borderColor: '#e8e4dc' }}>
      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-48 flex items-center justify-center" style={{ backgroundColor: '#f0ece4' }}>
          <Building className="w-12 h-12 opacity-20" style={{ color: '#1B2B5B' }} />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <CategoryBadge category={post.category} />
          {post.source && <span className="text-xs text-gray-400">{post.source}</span>}
        </div>
        <h2 className="font-bold text-gray-900 line-clamp-2 group-hover:text-[#1B2B5B] transition-colors leading-snug mb-2">
          {post.title}
        </h2>
        {post.excerpt && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</span>}
          {post.views > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views}</span>}
        </div>
      </div>
    </Link>
  )
}

export default async function BlogPage({ searchParams }: { searchParams: { category?: string } }) {
  const { data: posts } = await fetchPosts(searchParams.category)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Blog Imobiliário
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Notícias, dicas e tudo sobre o mercado imobiliário de Franca e região.
          Compra, venda, aluguel, financiamento, leilões e legislação.
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

      {/* SEO Keywords section */}
      <div className="hidden">
        {/* Hidden keyword cloud for SEO */}
        imóveis franca sp, casas para vender franca, apartamentos aluguel franca,
        imobiliária franca creci, financiamento caixa econômica, financiamento imobiliário,
        simulação financiamento, fgts imóvel, minha casa minha vida, leilão judicial imóvel,
        leilão extrajudicial, ITBI franca, IPTU franca, prefeitura franca imóveis,
        administração de imóveis franca, vistoria imóvel, contrato locação, lei do inquilinato,
        investimento imóvel, renda passiva imóvel, imóvel comercial franca
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📰</p>
          <p className="text-gray-500 text-lg">Nenhum artigo publicado ainda.</p>
          <p className="text-gray-400 text-sm mt-1">Volte em breve!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
