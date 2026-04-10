import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Search,
  MapPin,
  Home as HomeIcon,
  Building2,
  Trees,
  Briefcase,
  Umbrella,
  Sparkles,
  Star,
  Shield,
  Zap,
  Heart,
  TrendingUp,
  Users,
  Award,
  Newspaper,
  Clock,
  ArrowRight,
  Play,
  CheckCircle,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PropertyCard, type Property } from '@/components/property/PropertyCard'
import { InvestmentSimulator } from '@/components/home/InvestmentSimulator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const FEATURED_PROPERTIES: Property[] = [
  {
    id: 'prop-001',
    referenceCode: 'AE-0001',
    slug: 'casa-jardim-america-franca-4-quartos',
    title: 'Casa de Alto Padrão no Jardim América',
    purpose: 'venda',
    price: 1250000,
    priceNegotiable: true,
    address: { neighborhood: 'Jardim América', city: 'Franca', state: 'SP' },
    bedrooms: 4,
    bathrooms: 3,
    parking: 3,
    area: 320,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
    ],
    featured: true,
    investmentScore: 9.2,
    description: 'Belíssima residência com piscina, churrasqueira e jardim paisagístico.',
  },
  {
    id: 'prop-002',
    referenceCode: 'AE-0002',
    slug: 'apartamento-centro-franca-3-quartos',
    title: 'Apartamento Moderno no Centro',
    purpose: 'venda',
    price: 480000,
    address: { neighborhood: 'Centro', city: 'Franca', state: 'SP' },
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    area: 125,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop',
    ],
    isNew: true,
    investmentScore: 8.5,
  },
  {
    id: 'prop-003',
    referenceCode: 'AE-0003',
    slug: 'chacara-rifaina-lazer-completo',
    title: 'Chácara com Área de Lazer Completa em Rifaina',
    purpose: 'venda',
    price: 890000,
    address: { neighborhood: 'Zona Rural', city: 'Rifaina', state: 'SP' },
    bedrooms: 5,
    bathrooms: 4,
    parking: 6,
    area: 5000,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop',
    ],
    featured: true,
    investmentScore: 8.8,
  },
  {
    id: 'prop-004',
    referenceCode: 'AE-0004',
    slug: 'casa-vila-elite-franca-3-quartos',
    title: 'Casa Vila Elite com Piscina',
    purpose: 'venda',
    price: 680000,
    address: { neighborhood: 'Vila Elite', city: 'Franca', state: 'SP' },
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    area: 200,
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop',
    ],
    investmentScore: 8.1,
  },
  {
    id: 'prop-005',
    referenceCode: 'AE-0005',
    slug: 'apartamento-aluguel-jardim-paulista-franca',
    title: 'Apartamento para Locação no Jardim Paulista',
    purpose: 'aluguel',
    price: 2800,
    address: { neighborhood: 'Jardim Paulista', city: 'Franca', state: 'SP' },
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    area: 75,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',
    ],
    investmentScore: 7.8,
  },
  {
    id: 'prop-006',
    referenceCode: 'AE-0006',
    slug: 'terreno-patrocinio-paulista-comercial',
    title: 'Terreno Comercial em Patrocínio Paulista',
    purpose: 'venda',
    price: 320000,
    priceNegotiable: true,
    address: { neighborhood: 'Centro', city: 'Patrocínio Paulista', state: 'SP' },
    bedrooms: 0,
    bathrooms: 0,
    parking: 0,
    area: 800,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop',
    ],
    isPriceReduced: true,
    investmentScore: 7.5,
  },
]

const NEWS_TEASERS = [
  {
    id: 'news-1',
    category: 'Mercado',
    title: 'Franca registra alta de 18% nas vendas de imóveis no primeiro trimestre',
    excerpt: 'Dados do CRECI-SP apontam crescimento significativo impulsionado por novos lançamentos e queda na taxa Selic.',
    date: '22 Mar 2026',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&h=400&fit=crop',
  },
  {
    id: 'news-2',
    category: 'Financiamento',
    title: 'Caixa anuncia novas condições para financiamento habitacional em 2026',
    excerpt: 'Taxas a partir de 9,2% ao ano e prazo de até 35 anos para imóveis residenciais em todo o Brasil.',
    date: '18 Mar 2026',
    readTime: '3 min',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
  },
  {
    id: 'news-3',
    category: 'Dicas',
    title: '5 erros que você deve evitar ao comprar seu primeiro imóvel',
    excerpt: 'Especialistas listam os principais equívocos de compradores de primeira viagem e como evitá-los.',
    date: '15 Mar 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop',
  },
]

const PROPERTY_CATEGORIES = [
  { label: 'Casa', icon: HomeIcon, type: 'casa', count: 187 },
  { label: 'Apartamento', icon: Building2, type: 'apartamento', count: 143 },
  { label: 'Terreno', icon: Layers, type: 'terreno', count: 89 },
  { label: 'Chácara', icon: Trees, type: 'chacara', count: 54 },
  { label: 'Comercial', icon: Briefcase, type: 'comercial', count: 38 },
  { label: 'Temporada', icon: Umbrella, type: 'temporada', count: 29 },
]

const BENEFITS = [
  {
    icon: Award,
    title: '22 Anos de Experiência',
    description: 'Duas décadas conectando famílias ao lar ideal em Franca e região, com expertise inigualável no mercado local.',
  },
  {
    icon: Zap,
    title: 'Tecnologia de Ponta',
    description: 'IA que analisa imóveis, simula financiamentos e conecta compradores com as melhores oportunidades.',
  },
  {
    icon: Heart,
    title: 'Atendimento Humanizado',
    description: 'Corretores especializados que entendem seus sonhos e acompanham cada etapa do processo com dedicação.',
  },
  {
    icon: Shield,
    title: 'Processo 100% Digital',
    description: 'Do primeiro contato à assinatura do contrato, tudo acontece de forma digital, segura e transparente.',
  },
]

const STATS = [
  { value: 500, suffix: '+', label: 'Imóveis Disponíveis' },
  { value: 22, suffix: '+', label: 'Anos de Mercado' },
  { value: 3000, suffix: '+', label: 'Clientes Atendidos' },
  { value: 98, suffix: '%', label: 'Índice de Aprovação' },
]

const CITIES = ['Franca', 'Rifaina', 'Ibiraci', 'Patrocínio Paulista', 'Restinga', 'São José da Bela Vista']

const AI_SUGGESTIONS = [
  'casa 3 quartos com piscina no Jardim América',
  'apartamento até R$ 500.000 no centro de Franca',
  'chácara em Rifaina com área de lazer',
  'terreno comercial com até 1.000m² em Franca',
  'imóvel para renda com boa valorização',
]

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!inView) return
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl sm:text-5xl font-bold text-gold-400">
        {count.toLocaleString('pt-BR')}{suffix}
      </div>
      <div className="text-sm text-foreground/60 font-sans mt-2">{label}</div>
    </div>
  )
}

// ─── Hero Search Bar ──────────────────────────────────────────────────────────

function HeroSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'comprar' | 'alugar' | 'temporada'>('comprar')
  const [activeSuggestion, setActiveSuggestion] = useState(0)
  const [showSuggestion, setShowSuggestion] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowSuggestion(false)
      setTimeout(() => {
        setActiveSuggestion((p) => (p + 1) % AI_SUGGESTIONS.length)
        setShowSuggestion(true)
      }, 300)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    params.set('purpose', activeTab === 'comprar' ? 'venda' : activeTab)
    navigate(`/imoveis?${params.toString()}`)
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-black/30 backdrop-blur-sm p-1 rounded-xl w-fit mx-auto border border-white/10">
        {(['comprar', 'alugar', 'temporada'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-semibold font-sans capitalize transition-all duration-200',
              activeTab === tab
                ? 'bg-gold-500 text-navy-950'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Search Input */}
      <div className="relative flex gap-2 bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar imóveis... ex: 'casa 3 quartos com piscina no centro'"
            className="w-full bg-transparent pl-12 pr-4 py-4 text-white placeholder-white/40 text-base outline-none font-sans"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 sm:px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-bold rounded-xl transition-all duration-200 text-sm font-sans whitespace-nowrap shadow-lg shadow-gold-500/30 flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar com IA</span>
          <span className="sm:hidden">Buscar</span>
        </button>
      </div>

      {/* AI Suggestion */}
      <div className="mt-3 flex items-center gap-2 justify-center flex-wrap">
        <Sparkles className="h-3.5 w-3.5 text-gold-400 shrink-0" />
        <span className="text-xs text-white/50 font-sans">Sugestão IA:</span>
        <button
          onClick={() => { setQuery(AI_SUGGESTIONS[activeSuggestion]); }}
          className={cn(
            'text-xs text-gold-400 font-sans hover:text-gold-300 transition-all duration-300 text-left',
            showSuggestion ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          )}
        >
          "{AI_SUGGESTIONS[activeSuggestion]}"
        </button>
      </div>

      {/* Quick city chips */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span className="text-xs text-white/40 font-sans py-1.5 shrink-0">Cidades:</span>
        {CITIES.map((city) => (
          <button
            key={city}
            onClick={() => navigate(`/imoveis?cidade=${city.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-gold-500/20 border border-white/15 hover:border-gold-500/40 text-white/70 hover:text-gold-300 text-xs font-sans transition-all duration-200"
          >
            <MapPin className="h-3 w-3" />
            {city}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-navy-950 text-foreground">
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-950/80 to-navy-900/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent" />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gold-500/5 blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-36">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="text-center mb-12"
          >
            <motion.div variants={fadeIn} className="mb-6">
              <Badge className="gap-2 text-sm px-4 py-1.5 bg-gold-500/10 border-gold-500/30 text-gold-400">
                <Sparkles className="h-3.5 w-3.5" />
                Powered by Inteligência Artificial
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6"
            >
              Encontre o Imóvel dos
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
                Seus Sonhos
              </span>
              <br />
              em Franca e Região
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-white/60 font-sans max-w-2xl mx-auto mb-10">
              22 anos conectando famílias ao lar ideal. Mais de{' '}
              <span className="text-gold-400 font-semibold">500 imóveis</span> disponíveis com análise inteligente de investimento.
            </motion.p>

            <motion.div variants={fadeUp}>
              <HeroSearch />
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-navy-950/80 backdrop-blur-md border-t border-navy-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6"
            >
              {[
                { value: '500+', label: 'Imóveis' },
                { value: '22+', label: 'Anos' },
                { value: '3.000+', label: 'Clientes' },
                { value: '100%', label: 'Digital' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-2xl font-bold text-gold-400">{stat.value}</div>
                  <div className="text-xs text-white/50 font-sans mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <Badge variant="default" className="mb-3 gap-1.5">
                <Star className="h-3 w-3" />
                Selecionados para você
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Imóveis em <span className="text-gold-400">Destaque</span>
              </h2>
              <p className="text-foreground/60 font-sans mt-2">
                Oportunidades selecionadas pela nossa IA com melhor custo-benefício
              </p>
            </div>
            <Link
              to="/imoveis"
              className="hidden sm:flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-sans font-medium transition-colors"
            >
              Ver todos os imóveis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Horizontal scroll */}
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4">
            {FEATURED_PROPERTIES.map((property, i) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="min-w-[300px] sm:min-w-[320px] flex-shrink-0"
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link to="/imoveis">
              <Button variant="outline" className="gap-2 border-gold-500/30 text-gold-400 hover:bg-gold-500/10">
                Ver todos os imóveis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROPERTY CATEGORIES ── */}
      <section className="py-20 px-4 bg-navy-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Explore por <span className="text-gold-400">Categoria</span>
            </h2>
            <p className="text-foreground/60 font-sans">Encontre o tipo de imóvel perfeito para seu estilo de vida</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {PROPERTY_CATEGORIES.map((cat) => (
              <motion.div key={cat.type} variants={fadeUp}>
                <Link
                  to={`/imoveis?tipo=${cat.type}`}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-navy-800/60 bg-navy-900/60 hover:border-gold-500/40 hover:shadow-lg hover:shadow-gold-500/10 transition-all duration-300 hover:-translate-y-1 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center group-hover:border-gold-500/40 group-hover:bg-gold-500/10 transition-all duration-300">
                    <cat.icon className="h-7 w-7 text-gold-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground font-sans group-hover:text-gold-400 transition-colors">
                      {cat.label}
                    </div>
                    <div className="text-xs text-foreground/40 font-sans mt-0.5">{cat.count} imóveis</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── INVESTMENT SIMULATOR ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'linear-gradient(rgba(212,175,55,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>
        <InvestmentSimulator />
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-20 px-4 bg-navy-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="default" className="mb-4">Por que escolher a Lemos?</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
              A Imobiliária que Trabalha
              <span className="text-gold-400"> Por Você</span>
            </h2>
            <p className="text-foreground/60 font-sans max-w-xl mx-auto">
              Combinamos décadas de experiência local com tecnologia de ponta para entregar o melhor resultado.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {BENEFITS.map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={fadeUp}
                className="group p-6 rounded-2xl bg-navy-900/60 border border-navy-800/60 hover:border-gold-500/30 hover:bg-navy-900/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold-500/5"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-5 group-hover:bg-gold-500/15 transition-all duration-300">
                  <benefit.icon className="h-6 w-6 text-gold-400" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-foreground/60 font-sans leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-24 px-4 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border-y border-navy-800/60">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-gold-400/70 font-sans text-sm tracking-widest uppercase">Nossos números falam por si</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
            {STATS.map((stat) => (
              <AnimatedCounter key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST NEWS ── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <Badge variant="default" className="mb-3 gap-1.5">
                <Newspaper className="h-3 w-3" />
                Mercado em Alta
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Últimas do <span className="text-gold-400">Mercado</span>
              </h2>
            </div>
            <Link
              to="/noticias"
              className="hidden sm:flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-sans font-medium transition-colors"
            >
              Ver todas as notícias
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid sm:grid-cols-3 gap-6"
          >
            {NEWS_TEASERS.map((news) => (
              <motion.article
                key={news.id}
                variants={fadeUp}
                className="group rounded-2xl overflow-hidden border border-navy-800/60 bg-navy-900/50 hover:border-gold-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold-500/5"
              >
                <Link to={`/noticias`} className="block">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={news.image}
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="text-xs">{news.category}</Badge>
                      <span className="text-xs text-foreground/40 font-sans flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {news.readTime} leitura
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-foreground mb-2 line-clamp-2 group-hover:text-gold-400 transition-colors">
                      {news.title}
                    </h3>
                    <p className="text-sm text-foreground/60 font-sans line-clamp-2 mb-3">{news.excerpt}</p>
                    <span className="text-xs text-foreground/40 font-sans">{news.date}</span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 border-y border-navy-800/60 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-20 w-60 h-60 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute bottom-10 left-20 w-40 h-40 rounded-full bg-gold-600/10 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <Badge variant="default" className="mb-5 gap-1.5">
            <TrendingUp className="h-3 w-3" />
            Avaliação Gratuita com IA
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Quer vender ou alugar
            <span className="text-gold-400"> seu imóvel?</span>
          </h2>
          <p className="text-lg text-foreground/60 font-sans mb-10 max-w-2xl mx-auto">
            Nossa IA avalia seu imóvel gratuitamente em minutos, com base em dados reais do mercado de Franca e região.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/avaliacao">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-bold px-8 shadow-lg shadow-gold-500/30">
                <Sparkles className="h-5 w-5" />
                Avaliar meu imóvel
              </Button>
            </Link>
            <a
              href="https://wa.me/5516981010004?text=Ol%C3%A1! Gostaria de conversar com um corretor sobre meu im%C3%B3vel."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="gap-2 border-gold-500/40 text-gold-400 hover:bg-gold-500/10 px-8">
                <Users className="h-5 w-5" />
                Falar com um corretor
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── PLATFORM B2B TEASER ── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden border border-navy-800/60 bg-gradient-to-br from-navy-900 to-navy-950 p-8 sm:p-12"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <Badge variant="default" className="mb-4 gap-1.5">
                  <Briefcase className="h-3 w-3" />
                  Para Corretores e Imobiliárias
                </Badge>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Plataforma B2B que
                  <span className="text-gold-400"> Transforma Resultados</span>
                </h2>
                <p className="text-foreground/60 font-sans leading-relaxed mb-6">
                  CRM completo, publicação automática em portais, IA para qualificação de leads e muito mais.
                  Mais de 500 corretores já utilizam a plataforma Lemos.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    'CRM completo e intuitivo',
                    'IA para qualificação de leads',
                    'Publicação automática em portais',
                    'Relatórios e métricas avançadas',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle className="h-4 w-4 text-gold-400 shrink-0" />
                      <span className="text-sm text-foreground/70 font-sans">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Link to="/plataforma">
                    <Button className="gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold">
                      <Play className="h-4 w-4" />
                      Ver demonstração
                    </Button>
                  </Link>
                  <Link to="/plataforma">
                    <Button variant="outline" className="border-gold-500/30 text-gold-400 hover:bg-gold-500/10">
                      Ver planos
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '500+', label: 'Corretores', icon: Users },
                  { value: 'R$50M+', label: 'Em Negócios', icon: TrendingUp },
                  { value: '98%', label: 'Satisfação', icon: Star },
                  { value: '7 dias', label: 'Grátis', icon: Shield },
                ].map((item) => (
                  <div key={item.label} className="p-5 rounded-2xl bg-navy-800/50 border border-navy-700/50 hover:border-gold-500/20 transition-colors text-center">
                    <item.icon className="h-5 w-5 text-gold-400 mx-auto mb-2" />
                    <div className="font-display text-2xl font-bold text-gold-400">{item.value}</div>
                    <div className="text-xs text-foreground/50 font-sans mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
