import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Newspaper,
  Clock,
  ChevronRight,
  Search,
  Tag,
  TrendingUp,
  Bell,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const NEWS_ARTICLES = [
  {
    id: 'n01',
    slug: 'franca-alta-vendas-2026',
    category: 'Mercado',
    title: 'Franca registra alta histórica de 18% nas vendas de imóveis no primeiro trimestre de 2026',
    excerpt: 'Dados do CRECI-SP e Secovi apontam crescimento significativo impulsionado por novos lançamentos residenciais e queda gradual na taxa Selic, que estimulou o crédito imobiliário na região.',
    content: '',
    date: '22 Mar 2026',
    readTime: '4 min',
    author: 'Redação Lemos',
    image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=900&h=600&fit=crop',
    featured: true,
    trending: true,
    aiGenerated: true,
    tags: ['mercado', 'franca', 'vendas'],
  },
  {
    id: 'n02',
    slug: 'caixa-financiamento-2026',
    category: 'Financiamento',
    title: 'Caixa Econômica anuncia novas taxas para financiamento habitacional em 2026',
    excerpt: 'Taxas a partir de 9,2% ao ano e prazo de até 35 anos para imóveis residenciais em todo o Brasil. Saiba como aproveitar.',
    date: '18 Mar 2026',
    readTime: '3 min',
    author: 'Carlos Lemos',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&h=600&fit=crop',
    featured: true,
    trending: false,
    aiGenerated: true,
    tags: ['financiamento', 'caixa', 'taxas'],
  },
  {
    id: 'n03',
    slug: '5-erros-primeiro-imovel',
    category: 'Dicas',
    title: '5 erros que você deve evitar ao comprar seu primeiro imóvel',
    excerpt: 'Especialistas listam os principais equívocos de compradores de primeira viagem e como evitá-los para garantir um negócio seguro.',
    date: '15 Mar 2026',
    readTime: '6 min',
    author: 'Ana Paula Souza',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&h=600&fit=crop',
    featured: false,
    trending: true,
    aiGenerated: false,
    tags: ['dicas', 'comprar', 'primeiro-imovel'],
  },
  {
    id: 'n04',
    slug: 'lancamento-residencial-jardins-franca',
    category: 'Lançamentos',
    title: 'Novo residencial de luxo no bairro Jardins promete transformar o mercado de Franca',
    excerpt: 'Empreendimento com 120 unidades, clube completo e tecnologia de automação residencial tem pré-lançamento previsto para abril de 2026.',
    date: '12 Mar 2026',
    readTime: '5 min',
    author: 'Redação Lemos',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&h=600&fit=crop',
    featured: false,
    trending: false,
    aiGenerated: true,
    tags: ['lancamentos', 'franca', 'luxo'],
  },
  {
    id: 'n05',
    slug: 'leilao-imoveis-franca-abril',
    category: 'Leilões',
    title: 'Leilão de imóveis em Franca tem 43 propriedades com desconto de até 40% em abril',
    excerpt: 'Banco do Brasil e Caixa realizam leilões de imóveis residenciais e comerciais na região de Franca neste mês. Confira como participar.',
    date: '10 Mar 2026',
    readTime: '4 min',
    author: 'Roberto Ferreira',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&h=600&fit=crop',
    featured: false,
    trending: false,
    aiGenerated: false,
    tags: ['leiloes', 'franca', 'oportunidades'],
  },
  {
    id: 'n06',
    slug: 'valorizacao-rifaina-2026',
    category: 'Franca SP',
    title: 'Rifaina lidera valorização de imóveis de veraneio em 2026 no interior paulista',
    excerpt: 'Com aumento de 23% no preço médio dos imóveis, Rifaina se consolida como destino premium para segundo imóvel na região de Franca.',
    date: '08 Mar 2026',
    readTime: '4 min',
    author: 'Redação Lemos',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&h=600&fit=crop',
    featured: false,
    trending: true,
    aiGenerated: true,
    tags: ['rifaina', 'valorizacao', 'veraneio'],
  },
  {
    id: 'n07',
    slug: 'mcmv-novas-regras-2026',
    category: 'Financiamento',
    title: 'Minha Casa Minha Vida: novas regras ampliam acesso para famílias de classe média',
    excerpt: 'Mudanças no programa habitacional elevam limite de renda e valor dos imóveis, beneficiando mais de 50 mil famílias no interior de SP.',
    date: '05 Mar 2026',
    readTime: '5 min',
    author: 'Ana Paula Souza',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&h=600&fit=crop',
    featured: false,
    trending: false,
    aiGenerated: false,
    tags: ['mcmv', 'financiamento', 'governo'],
  },
  {
    id: 'n08',
    slug: 'ia-mercado-imobiliario-tendencias',
    category: 'Mercado',
    title: 'Como a inteligência artificial está revolucionando o mercado imobiliário brasileiro',
    excerpt: 'Ferramentas de IA para avaliação automática, qualificação de leads e análise de risco transformam a forma como imóveis são comprados e vendidos.',
    date: '02 Mar 2026',
    readTime: '7 min',
    author: 'Carlos Lemos',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=900&h=600&fit=crop',
    featured: false,
    trending: true,
    aiGenerated: false,
    tags: ['tecnologia', 'ia', 'mercado'],
  },
  {
    id: 'n09',
    slug: 'checklist-documentacao-compra-imovel',
    category: 'Dicas',
    title: 'Checklist completo: documentação necessária para comprar um imóvel em 2026',
    excerpt: 'Tudo o que você precisa reunir para garantir uma transação imobiliária segura, rápida e sem surpresas desagradáveis.',
    date: '28 Feb 2026',
    readTime: '8 min',
    author: 'Redação Lemos',
    image: 'https://images.unsplash.com/photo-1568010434570-74e9ba7126bc?w=900&h=600&fit=crop',
    featured: false,
    trending: false,
    aiGenerated: true,
    tags: ['dicas', 'documentacao', 'compra'],
  },
  {
    id: 'n10',
    slug: 'imovel-comercial-franca-oportunidades',
    category: 'Franca SP',
    title: 'Centro de Franca tem oportunidades únicas para investimento em imóvel comercial',
    excerpt: 'Com o crescimento do setor de serviços e a expansão do polo calçadista, imóveis comerciais no centro de Franca apresentam ROI acima de 8% ao ano.',
    date: '25 Feb 2026',
    readTime: '5 min',
    author: 'Roberto Ferreira',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=600&fit=crop',
    featured: false,
    trending: false,
    aiGenerated: false,
    tags: ['comercial', 'franca', 'investimento'],
  },
  {
    id: 'n11',
    slug: 'decoracao-tendencias-2026',
    category: 'Dicas',
    title: 'Decoração e reforma: tendências que valorizam o imóvel antes da venda em 2026',
    excerpt: 'Pequenas reformas estratégicas podem aumentar o valor de venda de um imóvel em até 15%. Veja quais são as mais recomendadas por especialistas.',
    date: '22 Feb 2026',
    readTime: '6 min',
    author: 'Ana Paula Souza',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&h=600&fit=crop',
    featured: false,
    trending: false,
    aiGenerated: true,
    tags: ['decoracao', 'reforma', 'venda'],
  },
  {
    id: 'n12',
    slug: 'leilao-banco-brasil-franca',
    category: 'Leilões',
    title: 'Banco do Brasil tem imóvel em Franca por R$ 180.000 em leilão online',
    excerpt: 'Casa de 3 quartos no bairro Parque das Flores está disponível em leilão extrajudicial com pagamento parcelado e transferência rápida.',
    date: '18 Feb 2026',
    readTime: '3 min',
    author: 'Redação Lemos',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&h=600&fit=crop',
    featured: false,
    trending: false,
    aiGenerated: false,
    tags: ['leiloes', 'oportunidades', 'franca'],
  },
]

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'Mercado', label: 'Mercado' },
  { value: 'Financiamento', label: 'Financiamento' },
  { value: 'Dicas', label: 'Dicas' },
  { value: 'Lançamentos', label: 'Lançamentos' },
  { value: 'Leilões', label: 'Leilões' },
  { value: 'Franca SP', label: 'Franca SP' },
]

const TRENDING_TOPICS = [
  'Taxa Selic 2026',
  'Minha Casa Minha Vida',
  'Rifaina imóveis',
  'Financiamento Caixa',
  'Leilão imóveis',
  'IA imobiliária',
  'Franca SP mercado',
]

const ITEMS_PER_PAGE = 9

const categoryColors: Record<string, string> = {
  Mercado: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  Financiamento: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  Dicas: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  Lançamentos: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  Leilões: 'bg-red-500/15 text-red-300 border-red-500/20',
  'Franca SP': 'bg-gold-500/15 text-gold-300 border-gold-500/20',
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function NewsCard({ article, featured = false }: { article: typeof NEWS_ARTICLES[0]; featured?: boolean }) {
  return (
    <Link to={`/noticias`} className="group block">
      <article
        className={cn(
          'rounded-2xl overflow-hidden border border-navy-800/60 bg-navy-900/50 transition-all duration-300',
          'hover:border-gold-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold-500/5',
          featured && 'flex flex-col sm:flex-row gap-0'
        )}
      >
        <div className={cn('overflow-hidden', featured ? 'sm:w-1/2 aspect-video sm:aspect-auto' : 'aspect-video')}>
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className={cn('p-5', featured && 'sm:flex-1 sm:flex sm:flex-col sm:justify-center')}>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={cn('text-xs px-2.5 py-1 rounded-full border font-sans font-semibold', categoryColors[article.category] || 'bg-navy-800 text-foreground/60 border-navy-700')}>
              {article.category}
            </span>
            {article.aiGenerated && (
              <span className="text-xs text-foreground/40 font-sans flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-gold-400/60" />
                Gerado por IA
              </span>
            )}
            {article.trending && (
              <span className="text-xs text-red-400 font-sans flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Trending
              </span>
            )}
          </div>
          <h3 className={cn(
            'font-display font-bold text-foreground mb-2 group-hover:text-gold-400 transition-colors line-clamp-2',
            featured ? 'text-xl' : 'text-base'
          )}>
            {article.title}
          </h3>
          <p className="text-sm text-foreground/60 font-sans line-clamp-2 mb-4">{article.excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-foreground/40 font-sans">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{article.date}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readTime} leitura</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{article.author}</span>
          </div>
          {featured && (
            <div className="mt-4 flex items-center gap-1.5 text-gold-400 text-sm font-semibold font-sans group-hover:gap-2.5 transition-all">
              Ler artigo completo <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function News() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const featuredArticles = NEWS_ARTICLES.filter((a) => a.featured)
  const mainFeatured = featuredArticles[0]
  const secondaryFeatured = featuredArticles.slice(1, 3)

  const filteredArticles = NEWS_ARTICLES.filter((a) => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q))
    }
    return true
  })

  const regularArticles = filteredArticles.filter((a) => !a.featured || selectedCategory !== 'all' || searchQuery)
  const paginatedArticles = (selectedCategory !== 'all' || searchQuery ? filteredArticles : regularArticles).slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const totalPages = Math.ceil((selectedCategory !== 'all' || searchQuery ? filteredArticles : regularArticles).length / ITEMS_PER_PAGE)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubscribed(true)
  }

  return (
    <div className="min-h-screen bg-navy-950 text-foreground">
      <Header />

      {/* ── HERO ── */}
      <div className="pt-20 bg-gradient-to-b from-navy-950 to-navy-900 border-b border-navy-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <Badge variant="default" className="mb-4 gap-1.5">
              <Newspaper className="h-3 w-3" />
              Mercado Imobiliário
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Notícias do{' '}
              <span className="text-gold-400">Mercado Imobiliário</span>
            </h1>
            <p className="text-foreground/60 font-sans text-lg leading-relaxed mb-6">
              Acompanhe as últimas tendências, lançamentos e oportunidades do mercado imobiliário de Franca e região.
            </p>

            {/* Search */}
            <div className="relative max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder="Buscar notícias..."
                className="w-full bg-navy-900 border border-navy-700 rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-foreground/40 text-sm outline-none focus:border-gold-500/50 font-sans"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── CATEGORY FILTERS ── */}
      <div className="border-b border-navy-800/60 bg-navy-950/80 backdrop-blur-sm sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setSelectedCategory(cat.value); setPage(1) }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold font-sans whitespace-nowrap transition-all duration-200',
                  selectedCategory === cat.value
                    ? 'bg-gold-500/15 text-gold-400 border border-gold-500/25'
                    : 'text-foreground/60 hover:text-foreground hover:bg-navy-800'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* ── MAIN CONTENT ── */}
          <div className="lg:col-span-3">
            {/* Featured Section */}
            {selectedCategory === 'all' && !searchQuery && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <Star className="h-4 w-4 text-gold-400" />
                  <span className="text-sm font-semibold text-foreground/70 font-sans uppercase tracking-wider">Destaque</span>
                </div>
                <div className="grid gap-5">
                  {/* Main Featured */}
                  {mainFeatured && <NewsCard article={mainFeatured} featured />}
                  {/* Secondary Featured */}
                  {secondaryFeatured.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-5">
                      {secondaryFeatured.map((a) => <NewsCard key={a.id} article={a} />)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-foreground">
                {searchQuery ? `Resultados para "${searchQuery}"` : selectedCategory === 'all' ? 'Todas as notícias' : selectedCategory}
              </h2>
              <span className="text-sm text-foreground/40 font-sans">
                {selectedCategory !== 'all' || searchQuery ? filteredArticles.length : regularArticles.length} artigos
              </span>
            </div>

            {/* Articles Grid */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {paginatedArticles.map((article) => (
                <motion.div key={article.id} variants={fadeUp}>
                  <NewsCard article={article} />
                </motion.div>
              ))}
            </motion.div>

            {paginatedArticles.length === 0 && (
              <div className="text-center py-16">
                <Newspaper className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Nenhuma notícia encontrada</h3>
                <p className="text-foreground/50 font-sans">Tente outro termo ou categoria.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      'w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-sans transition-all',
                      page === i + 1
                        ? 'bg-gold-500/15 border-gold-500/30 text-gold-400 font-semibold'
                        : 'border-navy-700 text-foreground/60 hover:text-foreground hover:border-navy-600'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="p-5 rounded-2xl bg-navy-900/60 border border-navy-800/60">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-gold-400" />
                <span className="font-semibold text-sm text-foreground font-sans">Tópicos em Alta</span>
              </div>
              <div className="space-y-2">
                {TRENDING_TOPICS.map((topic, i) => (
                  <button
                    key={topic}
                    onClick={() => { setSearchQuery(topic); setSelectedCategory('all'); setPage(1) }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-navy-800/60 transition-colors group"
                  >
                    <span className="text-xs font-bold text-foreground/30 font-sans w-5">#{i + 1}</span>
                    <Tag className="h-3.5 w-3.5 text-foreground/30 group-hover:text-gold-400 transition-colors" />
                    <span className="text-sm text-foreground/70 font-sans group-hover:text-foreground transition-colors">{topic}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-gold-400" />
                <span className="font-semibold text-sm text-foreground font-sans">Newsletter</span>
              </div>
              <p className="text-xs text-foreground/60 font-sans mb-4 leading-relaxed">
                Receba as principais notícias do mercado imobiliário de Franca direto no seu e-mail toda semana.
              </p>
              {subscribed ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-sm text-emerald-400 font-sans font-semibold">Inscrito com sucesso!</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-foreground placeholder-foreground/40 text-sm outline-none focus:border-gold-500/50 font-sans"
                  />
                  <Button type="submit" className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold text-sm h-9">
                    Inscrever-me
                  </Button>
                </form>
              )}
              <p className="text-xs text-foreground/30 font-sans mt-2 text-center">Sem spam. Cancele quando quiser.</p>
            </div>

            {/* AI Badge */}
            <div className="p-4 rounded-2xl bg-navy-900/60 border border-navy-800/60">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-gold-400" />
                <span className="text-xs font-semibold text-foreground/60 font-sans uppercase tracking-wider">Sobre o conteúdo</span>
              </div>
              <p className="text-xs text-foreground/50 font-sans leading-relaxed">
                Alguns artigos são gerados e curados por nossa IA com base em dados do mercado imobiliário brasileiro. Identificados com o selo{' '}
                <span className="text-gold-400 inline-flex items-center gap-0.5"><Sparkles className="h-3 w-3" /> Gerado por IA</span>.
              </p>
            </div>

            {/* CTA Property */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-950 border border-navy-800/60">
              <p className="text-sm font-semibold text-foreground font-sans mb-2">Quer vender seu imóvel?</p>
              <p className="text-xs text-foreground/50 font-sans mb-4">Nossa IA avalia gratuitamente em minutos.</p>
              <Link to="/avaliacao">
                <Button className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold text-sm h-9 gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Avaliar meu imóvel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

// Local Star import for use in this file
function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}
