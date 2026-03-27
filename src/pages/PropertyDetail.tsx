import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Bed,
  Bath,
  Car,
  SquareArrowOutUpRight,
  MapPin,
  MessageCircle,
  Calendar,
  FileText,
  Sparkles,
  Star,
  Share2,
  Heart,
  ChevronDown,
  CheckCircle,
  TrendingUp,
  Calculator,
  Phone,
  Home as HomeIcon,
  Building2,
  Trees,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PropertyCard, type Property } from '@/components/property/PropertyCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ─── Mock Property Data ───────────────────────────────────────────────────────

const MOCK_PROPERTY = {
  id: 'prop-001',
  slug: 'casa-jardim-america-franca-4-quartos',
  title: 'Casa de Alto Padrão com Piscina no Jardim América',
  purpose: 'venda' as const,
  price: 1250000,
  priceNegotiable: true,
  address: {
    street: 'Rua das Palmeiras, 445',
    neighborhood: 'Jardim América',
    city: 'Franca',
    state: 'SP',
    cep: '14401-290',
    lat: -20.5386,
    lng: -47.4008,
  },
  bedrooms: 4,
  bathrooms: 3,
  parking: 3,
  area: 320,
  totalArea: 480,
  floor: null,
  builtYear: 2019,
  condominium: null,
  iptu: 320,
  images: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop',
  ],
  featured: true,
  investmentScore: 9.2,
  description: `Espetacular residência de alto padrão localizada no nobre bairro Jardim América, em Franca-SP. Construída em 2019 com acabamento de luxo e atenção a cada detalhe, esta propriedade oferece o equilíbrio perfeito entre elegância e conforto.

A propriedade conta com ampla sala de estar com pé-direito duplo, sala de jantar integrada, cozinha gourmet totalmente equipada e despensa. O espaço de lazer externo é completo, com piscina aquecida, churrasqueira coberta, salão de festas e jardim paisagístico cuidadosamente planejado.

A suíte master é um destaque especial, com closet amplo e banheiro com hidromassagem e ducha de teto. As outras três suítes são espaçosas e possuem armários embutidos. O imóvel também conta com escritório, lavanderia, área de serviço e dependência completa para empregada.

Localização privilegiada, próximo a escolas de alto nível, supermercados, farmácias e a apenas 5 minutos do centro de Franca.`,
  amenities: [
    { key: 'piscina', label: 'Piscina Aquecida' },
    { key: 'churrasqueira', label: 'Churrasqueira' },
    { key: 'jardim', label: 'Jardim Paisagístico' },
    { key: 'ar', label: 'Ar Condicionado' },
    { key: 'portaria', label: 'Sistema de Segurança' },
    { key: 'escritorio', label: 'Escritório' },
    { key: 'salao', label: 'Salão de Festas' },
    { key: 'hidro', label: 'Hidromassagem' },
    { key: 'closet', label: 'Closet' },
    { key: 'lareira', label: 'Lareira' },
    { key: 'automacao', label: 'Automação Residencial' },
    { key: 'energia', label: 'Energia Solar' },
  ],
  corretor: {
    name: 'Carlos Eduardo Lemos',
    creci: 'CRECI-SP 87654',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&face',
    whatsapp: '5516981010004',
    phone: '(16) 3723-0045',
  },
  investmentAnalysis: {
    score: 9.2,
    localizacao: 9.5,
    valorizacao: 9.0,
    liquidez: 8.8,
    roi: 9.0,
    text: 'Este imóvel apresenta excelente potencial de valorização. Localizado em um dos bairros mais valorizados de Franca, com crescimento médio de 12% ao ano nos últimos 5 anos. O padrão construtivo de alto nível e os acabamentos de qualidade contribuem para uma liquidez superior à média do mercado regional. Indicado tanto para moradia quanto como investimento de longo prazo.',
  },
  neighborhood: {
    score: 9.1,
    infrastructure: 9,
    safety: 8,
    services: 9,
    transportation: 8,
    description: 'Jardim América é um dos bairros mais consolidados e valorizados de Franca. Com infraestrutura completa, arborização, ruas pavimentadas e monitoramento por câmeras. Próximo às melhores escolas da cidade e a supermercados de grande porte.',
  },
}

const SIMILAR_PROPERTIES: Property[] = [
  {
    id: 'sim-1', slug: 'casa-jardins-franca', title: 'Casa nos Jardins com 3 Suítes',
    purpose: 'venda', price: 980000,
    address: { neighborhood: 'Jardins', city: 'Franca', state: 'SP' },
    bedrooms: 3, bathrooms: 3, parking: 2, area: 260,
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'],
    investmentScore: 8.7,
  },
  {
    id: 'sim-2', slug: 'casa-condominio-palmeiras', title: 'Casa em Condomínio das Palmeiras',
    purpose: 'venda', price: 1100000,
    address: { neighborhood: 'Residencial das Palmeiras', city: 'Franca', state: 'SP' },
    bedrooms: 4, bathrooms: 3, parking: 3, area: 300,
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop'],
    featured: true, investmentScore: 9.0,
  },
  {
    id: 'sim-3', slug: 'casa-vila-elite-piscina', title: 'Casa Vila Elite com Piscina',
    purpose: 'venda', price: 680000,
    address: { neighborhood: 'Vila Elite', city: 'Franca', state: 'SP' },
    bedrooms: 3, bathrooms: 2, parking: 2, area: 200,
    images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=400&fit=crop'],
    investmentScore: 8.1,
  },
]

// ─── Gallery Component ────────────────────────────────────────────────────────

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (i: number) => { setLightboxIndex(i); setLightboxOpen(true) }

  return (
    <>
      <div className="relative">
        {/* Main Image */}
        <div
          className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden cursor-pointer rounded-2xl bg-navy-900"
          onClick={() => openLightbox(current)}
        >
          <img
            src={images[current]}
            alt={`${title} - foto ${current + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-white text-xs font-sans flex items-center gap-1.5 hover:bg-black/70 transition-colors">
              <Maximize2 className="h-3.5 w-3.5" />
              {current + 1}/{images.length} fotos
            </button>
          </div>
          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length) }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200',
                i === current ? 'border-gold-400 opacity-100' : 'border-transparent opacity-60 hover:opacity-80'
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-sans">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setLightboxIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={images[lightboxIndex]}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setLightboxIndex((i) => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Investment Score ─────────────────────────────────────────────────────────

function InvestmentScoreCard({ analysis }: { analysis: typeof MOCK_PROPERTY.investmentAnalysis }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor = analysis.score >= 8.5 ? 'text-gold-400' : analysis.score >= 7 ? 'text-amber-400' : 'text-foreground/60'

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-gold-400" />
        <span className="font-semibold text-sm text-foreground font-sans">Score de Investimento IA</span>
        <Badge variant="default" className="text-xs ml-auto">IA</Badge>
      </div>

      {/* Main Score */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="28"
              fill="none" stroke="rgb(212,175,55)" strokeWidth="6"
              strokeDasharray={`${(analysis.score / 10) * 175.9} 175.9`}
              strokeLinecap="round"
            />
          </svg>
          <span className={cn('absolute inset-0 flex items-center justify-center font-display font-bold text-lg', scoreColor)}>
            {analysis.score}
          </span>
        </div>
        <div>
          <div className={cn('font-display text-3xl font-bold', scoreColor)}>{analysis.score}<span className="text-base text-foreground/40">/10</span></div>
          <div className="text-xs text-foreground/50 font-sans">Excelente potencial</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5 mb-4">
        {[
          { label: 'Localização', value: analysis.localizacao },
          { label: 'Valorização', value: analysis.valorizacao },
          { label: 'Liquidez', value: analysis.liquidez },
          { label: 'ROI Estimado', value: analysis.roi },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-foreground/50 font-sans w-24 shrink-0">{item.label}</span>
            <div className="flex-1 h-1.5 bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
                style={{ width: `${(item.value / 10) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gold-400 font-sans w-8 text-right">{item.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-foreground/50 hover:text-gold-400 font-sans flex items-center gap-1 transition-colors"
      >
        <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
        {expanded ? 'Ver menos' : 'Ver análise completa'}
      </button>

      {expanded && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-xs text-foreground/60 font-sans leading-relaxed mt-3 pt-3 border-t border-gold-500/10"
        >
          {analysis.text}
        </motion.p>
      )}
    </div>
  )
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({ property, corretor }: { property: typeof MOCK_PROPERTY; corretor: typeof MOCK_PROPERTY.corretor }) {
  const [proposalOpen, setProposalOpen] = useState(false)
  const [proposal, setProposal] = useState('')

  const whatsappMsg = encodeURIComponent(
    `Olá ${corretor.name}! Tenho interesse no imóvel: ${property.title} — ${formatCurrency(property.price)}. Código: ${property.id}`
  )
  const whatsappUrl = `https://wa.me/${corretor.whatsapp}?text=${whatsappMsg}`
  const scheduleMsg = encodeURIComponent(
    `Olá! Gostaria de agendar uma visita ao imóvel: ${property.title}. Código: ${property.id}`
  )
  const scheduleUrl = `https://wa.me/${corretor.whatsapp}?text=${scheduleMsg}`

  return (
    <div className="p-5 rounded-2xl bg-navy-900/80 border border-navy-800/60 space-y-4">
      {/* Corretor */}
      <div className="flex items-center gap-3">
        <img src={corretor.photo} alt={corretor.name} className="w-12 h-12 rounded-full object-cover border-2 border-gold-500/30" />
        <div>
          <div className="font-semibold text-sm text-foreground font-sans">{corretor.name}</div>
          <div className="text-xs text-foreground/50 font-sans">{corretor.creci}</div>
          <div className="flex items-center gap-1 mt-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-gold-400 text-gold-400" />
            ))}
            <span className="text-xs text-foreground/40 font-sans ml-1">5.0</span>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="p-3 rounded-xl bg-gold-500/5 border border-gold-500/15">
        <div className="text-xs text-foreground/50 font-sans mb-1">Valor do imóvel</div>
        <div className="font-display text-2xl font-bold text-gold-400">{formatCurrency(property.price)}</div>
        {property.priceNegotiable && (
          <div className="text-xs text-gold-400/70 font-sans mt-0.5">Preço negociável</div>
        )}
      </div>

      {/* CTAs */}
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-12">
          <MessageCircle className="h-5 w-5" />
          Falar pelo WhatsApp
        </Button>
      </a>

      <a href={scheduleUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Button variant="outline" className="w-full border-gold-500/30 text-gold-400 hover:bg-gold-500/10 gap-2 h-11">
          <Calendar className="h-4 w-4" />
          Agendar Visita
        </Button>
      </a>

      <Button
        variant="outline"
        className="w-full border-navy-700 text-foreground/70 hover:text-foreground gap-2 h-11"
        onClick={() => setProposalOpen(true)}
      >
        <FileText className="h-4 w-4" />
        Fazer Proposta
      </Button>

      <a href={`tel:${corretor.phone}`} className="flex items-center justify-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors font-sans">
        <Phone className="h-3.5 w-3.5" />
        {corretor.phone}
      </a>

      {/* Proposal Modal */}
      <AnimatePresence>
        {proposalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-navy-950 border border-navy-800 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg text-foreground">Fazer Proposta</h3>
                <button onClick={() => setProposalOpen(false)}>
                  <X className="h-5 w-5 text-foreground/50" />
                </button>
              </div>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-foreground/60 font-sans mb-1 block">Valor da proposta</label>
                  <input
                    type="text"
                    placeholder="R$ 0,00"
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-foreground font-sans text-sm outline-none focus:border-gold-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/60 font-sans mb-1 block">Mensagem (opcional)</label>
                  <textarea
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    rows={3}
                    placeholder="Condições de pagamento, observações..."
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 text-foreground font-sans text-sm outline-none focus:border-gold-500/50 resize-none"
                  />
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold" asChild>
                <a
                  href={`https://wa.me/${corretor.whatsapp}?text=${encodeURIComponent(`Proposta para: ${property.title}\n${proposal}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setProposalOpen(false)}
                >
                  Enviar Proposta via WhatsApp
                </a>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const property = MOCK_PROPERTY
  const [descExpanded, setDescExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const descLines = property.description.split('\n\n')
  const shortDesc = descLines.slice(0, 1).join('\n\n')
  const hasMoreDesc = descLines.length > 1

  return (
    <div className="min-h-screen bg-navy-950 text-foreground">
      <Header />

      <div className="pt-20">
        {/* ── BREADCRUMB ── */}
        <div className="bg-navy-950 border-b border-navy-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-xs text-foreground/40 font-sans flex-wrap">
              <Link to="/" className="hover:text-gold-400 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/imoveis" className="hover:text-gold-400 transition-colors">Imóveis</Link>
              <span>/</span>
              <Link to={`/imoveis?tipo=casa`} className="hover:text-gold-400 transition-colors">Casa em Franca</Link>
              <span>/</span>
              <span className="text-foreground/70 truncate">{property.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ── GALLERY ── */}
          <div className="mb-8">
            <Gallery images={property.images} title={property.title} />
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Quick Stats */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="default">Venda</Badge>
                      {property.featured && <Badge variant="featured">Destaque</Badge>}
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                      {property.title}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-2">
                      <MapPin className="h-4 w-4 text-foreground/40" />
                      <span className="text-sm text-foreground/60 font-sans">
                        {property.address.street}, {property.address.neighborhood} — {property.address.city}, {property.address.state}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={cn(
                        'w-10 h-10 rounded-xl border flex items-center justify-center transition-all',
                        isFavorite ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'border-navy-700 text-foreground/50 hover:border-navy-600 hover:text-foreground'
                      )}
                    >
                      <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
                    </button>
                    <button className="w-10 h-10 rounded-xl border border-navy-700 text-foreground/50 hover:border-navy-600 hover:text-foreground flex items-center justify-center transition-all">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="p-4 rounded-2xl bg-gold-500/5 border border-gold-500/15 mb-5">
                  <div className="font-display text-4xl font-bold text-gold-400">
                    {formatCurrency(property.price)}
                  </div>
                  {property.priceNegotiable && (
                    <div className="text-sm text-gold-400/70 font-sans mt-1">Preço negociável</div>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-foreground/50 font-sans">
                    {property.condominium && <span>Condomínio: {formatCurrency(property.condominium)}/mês</span>}
                    <span>IPTU: {formatCurrency(property.iptu)}/mês</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Bed, label: 'Quartos', value: property.bedrooms },
                    { icon: Bath, label: 'Banheiros', value: property.bathrooms },
                    { icon: Car, label: 'Vagas', value: property.parking },
                    { icon: Maximize2, label: 'Área', value: `${property.area} m²` },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center justify-center p-3 rounded-xl bg-navy-900/60 border border-navy-800/60 gap-1.5">
                      <stat.icon className="h-4 w-4 text-gold-400" />
                      <div className="font-display font-bold text-lg text-foreground">{stat.value}</div>
                      <div className="text-xs text-foreground/50 font-sans">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Descrição</h2>
                <div className="text-sm text-foreground/70 font-sans leading-relaxed space-y-3">
                  {descExpanded
                    ? descLines.map((p, i) => <p key={i}>{p}</p>)
                    : <p>{shortDesc}</p>
                  }
                </div>
                {hasMoreDesc && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="mt-3 text-gold-400 hover:text-gold-300 text-sm font-sans flex items-center gap-1 transition-colors"
                  >
                    <ChevronDown className={cn('h-4 w-4 transition-transform', descExpanded && 'rotate-180')} />
                    {descExpanded ? 'Ver menos' : 'Ver descrição completa'}
                  </button>
                )}
              </div>

              {/* Amenities */}
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Características e Comodidades</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div key={amenity.key} className="flex items-center gap-2.5 p-3 rounded-xl bg-navy-900/60 border border-navy-800/60">
                      <CheckCircle className="h-4 w-4 text-gold-400 shrink-0" />
                      <span className="text-sm text-foreground/80 font-sans">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Info Table */}
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Informações do Imóvel</h2>
                <div className="rounded-2xl border border-navy-800/60 overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-navy-800/60">
                    {[
                      { label: 'Código', value: property.id },
                      { label: 'Tipo', value: 'Casa' },
                      { label: 'Área útil', value: `${property.area} m²` },
                      { label: 'Área total', value: `${property.totalArea} m²` },
                      { label: 'Quartos', value: property.bedrooms },
                      { label: 'Banheiros', value: property.bathrooms },
                      { label: 'Vagas de garagem', value: property.parking },
                      { label: 'Ano de construção', value: property.builtYear },
                    ].map((row, i) => (
                      <div
                        key={row.label}
                        className={cn(
                          'flex items-center justify-between p-3.5',
                          i % 2 !== 0 ? 'bg-navy-900/30' : '',
                          i < 6 ? 'border-b border-navy-800/60' : ''
                        )}
                      >
                        <span className="text-xs text-foreground/50 font-sans">{row.label}</span>
                        <span className="text-sm font-semibold text-foreground font-sans">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Map */}
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Localização</h2>
                <div className="rounded-2xl overflow-hidden border border-navy-800/60">
                  <iframe
                    title="Localização do imóvel"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${encodeURIComponent(property.address.street + ', ' + property.address.neighborhood + ', ' + property.address.city + ', ' + property.address.state)}`}
                    width="100%"
                    height="300"
                    style={{ border: 0, display: 'block' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <p className="text-sm text-foreground/50 font-sans mt-2 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gold-400" />
                  {property.address.street}, {property.address.neighborhood} — {property.address.city}, {property.address.state} — CEP {property.address.cep}
                </p>
              </div>

              {/* Neighborhood */}
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Sobre o Bairro</h2>
                <div className="p-5 rounded-2xl bg-navy-900/60 border border-navy-800/60">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {[
                      { label: 'Infraestrutura', value: property.neighborhood.infrastructure },
                      { label: 'Segurança', value: property.neighborhood.safety },
                      { label: 'Serviços', value: property.neighborhood.services },
                      { label: 'Transporte', value: property.neighborhood.transportation },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="font-display text-2xl font-bold text-gold-400">{item.value}<span className="text-sm text-foreground/40">/10</span></div>
                        <div className="text-xs text-foreground/50 font-sans mt-0.5">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-foreground/60 font-sans leading-relaxed">
                    {property.neighborhood.description}
                  </p>
                </div>
              </div>

              {/* Financing Mini-Simulator */}
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-gold-400" />
                  Simulação Rápida de Financiamento
                </h2>
                <div className="p-5 rounded-2xl bg-navy-900/60 border border-navy-800/60">
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    {[
                      { label: 'Entrada (20%)', value: formatCurrency(property.price * 0.2) },
                      { label: 'Financiado', value: formatCurrency(property.price * 0.8) },
                      { label: 'Parcela est. (30 anos, 10.5%)', value: `${formatCurrency((property.price * 0.8 * (0.105 / 12) * Math.pow(1 + 0.105 / 12, 360)) / (Math.pow(1 + 0.105 / 12, 360) - 1))}/mês` },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-xl bg-navy-800/50 border border-navy-700/50 text-center">
                        <div className="text-xs text-foreground/50 font-sans mb-1">{item.label}</div>
                        <div className="font-display font-bold text-gold-400 text-sm">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-foreground/40 font-sans text-center mb-4">* Simulação estimada. Consulte condições reais com nosso especialista.</p>
                  <a
                    href={`https://wa.me/${property.corretor.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de uma simulação de financiamento para o imóvel: ' + property.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-bold">
                      <Calculator className="h-4 w-4" />
                      Simulação Completa com Especialista
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column (sticky) */}
            <div className="space-y-5">
              <div className="lg:sticky lg:top-24 space-y-5">
                <ContactCard property={property} corretor={property.corretor} />
                <InvestmentScoreCard analysis={property.investmentAnalysis} />
              </div>
            </div>
          </div>

          {/* ── SIMILAR PROPERTIES ── */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Imóveis Similares</h2>
                <p className="text-sm text-foreground/50 font-sans mt-1">Outros imóveis que podem te interessar</p>
              </div>
              <Link to="/imoveis" className="text-sm text-gold-400 hover:text-gold-300 font-sans transition-colors">
                Ver todos
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SIMILAR_PROPERTIES.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
