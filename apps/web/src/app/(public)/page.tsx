import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BedDouble, Bath, Maximize, ArrowRight, Star, Sparkles } from 'lucide-react'
import { HeroSearchForm } from './HeroSearchForm'
import { HeroBackground } from './HeroBackground'
import { SmartQuizButton, SmartQuizModal } from './SmartQuiz'
import { PresentationSection } from './PresentationSection'

export const metadata: Metadata = {
  title: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP | Imobiliária Lemos',
  description: 'Encontre seu imóvel ideal em Franca e região. 1.000+ imóveis com busca por IA e mapa interativo. Casas, apartamentos, terrenos e imóveis comerciais. Marketplace criado pela Imobiliária Lemos — 22+ anos de tradição.',
  keywords: [
    'agoraencontrei', 'marketplace imobiliário', 'imobiliária franca', 'imóveis franca sp',
    'alugar casa franca', 'comprar apartamento franca', 'imobiliária lemos', 'locação franca',
    'venda imóveis franca', 'busca imóvel IA', 'mapa imóveis franca',
    'anunciar imóvel grátis', 'casas para alugar franca sp', 'apartamentos para alugar franca sp',
    'casas à venda franca sp', 'apartamentos à venda franca sp', 'terrenos franca sp',
    'imóveis comerciais franca sp', 'chácaras franca sp', 'loteamentos franca sp',
    'imóveis jardim california franca', 'imóveis jardim europa franca', 'imóveis centro franca',
    'imóveis vila lemos franca', 'imóveis jardim paulista franca', 'imóveis jardim america franca',
    'aluguel casa franca sp', 'aluguel apartamento franca sp', 'comprar casa franca sp',
    'imobiliária franca sp creci', 'corretor de imóveis franca sp', 'avaliação imóvel franca',
    'financiamento imóvel franca', 'imóvel franca são paulo', 'melhor imobiliária franca',
  ],
  openGraph: {
    title: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP',
    description: 'Há mais de 22 anos conectando pessoas aos melhores imóveis de Franca e região. Marketplace criado pela Imobiliária Lemos.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP',
    description: 'Imóveis de qualidade em Franca e região. Imobiliária Lemos, referência desde 2002.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.agoraencontrei.com.br' },
}

export const revalidate = 60

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function fetchFeaturedProperties() {
  try {
    const resFeatured = await fetch(`${API_URL}/api/v1/public/featured`, {
      next: { revalidate: 60 },
    })
    if (resFeatured.ok) {
      const featured = await resFeatured.json()
      if (Array.isArray(featured) && featured.length > 0) return featured
    }
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=8&sortBy=createdAt`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.data) ? data.data : []
  } catch {
    return []
  }
}

async function fetchStats() {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=1`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { total: 0 }
    const data = await res.json()
    return { total: data.meta?.total ?? 0 }
  } catch {
    return { total: 0 }
  }
}

async function fetchSiteSettings() {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/site-settings`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { heroVideoUrl: null, heroVideoType: 'image' }
    const data = await res.json()
    if (!data.heroVideoUrl) {
      return { ...data, heroVideoType: 'image' }
    }
    return data
  } catch {
    return { heroVideoUrl: null, heroVideoType: 'image' }
  }
}

function formatPrice(p: any) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  if (p.purpose === 'RENT' && p.priceRent) return `${fmt(p.priceRent)}/mês`
  if (p.price) return fmt(p.price)
  return 'Consulte'
}

// ── Ícones SVG profissionais para cada categoria ──────────────────────────────
const CategoryIcons: Record<string, React.ReactNode> = {
  APARTMENT: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <rect x="14" y="12" width="6" height="6" rx="1" fill="currentColor" opacity="0.7"/>
      <rect x="28" y="12" width="6" height="6" rx="1" fill="currentColor" opacity="0.7"/>
      <rect x="14" y="24" width="6" height="6" rx="1" fill="currentColor" opacity="0.7"/>
      <rect x="28" y="24" width="6" height="6" rx="1" fill="currentColor" opacity="0.7"/>
      <rect x="19" y="34" width="10" height="8" rx="1" fill="currentColor" opacity="0.5"/>
      <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
    </svg>
  ),
  HOUSE: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M6 22L24 6L42 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 18V40C10 41.1 10.9 42 12 42H20V32H28V42H36C37.1 42 38 41.1 38 40V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="20" y="26" width="8" height="6" rx="1" fill="currentColor" opacity="0.5"/>
      <rect x="14" y="24" width="5" height="5" rx="1" fill="currentColor" opacity="0.4"/>
      <rect x="29" y="24" width="5" height="5" rx="1" fill="currentColor" opacity="0.4"/>
    </svg>
  ),
  LAND: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect x="6" y="10" width="36" height="28" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5"/>
      <line x1="24" y1="10" x2="24" y2="38" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5"/>
      <circle cx="6" cy="10" r="2.5" fill="currentColor"/>
      <circle cx="42" cy="10" r="2.5" fill="currentColor"/>
      <circle cx="6" cy="38" r="2.5" fill="currentColor"/>
      <circle cx="42" cy="38" r="2.5" fill="currentColor"/>
      <path d="M14 32L20 22L26 28L32 20L38 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  ),
  STORE: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M6 18H42L38 8H10L6 18Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      <path d="M6 18V40H42V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M6 18C6 21.3 8.7 24 12 24C15.3 24 18 21.3 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 18C18 21.3 20.7 24 24 24C27.3 24 30 21.3 30 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M30 18C30 21.3 32.7 24 36 24C39.3 24 42 21.3 42 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="18" y="30" width="12" height="10" rx="1" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
  FARM: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M4 38C8 38 12 34 16 34C20 34 22 38 26 38C30 38 32 34 36 34C40 34 42 38 44 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 8C24 8 14 16 14 24C14 28.4 18.7 32 24 32C29.3 32 34 28.4 34 24C34 16 24 8 24 8Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <line x1="24" y1="8" x2="24" y2="32" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <path d="M14 20C17 18 21 19 24 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M34 20C31 18 27 19 24 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  PENTHOUSE: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <rect x="8" y="14" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M14 14V8L24 4L34 8V14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <rect x="14" y="20" width="8" height="7" rx="1" fill="currentColor" opacity="0.5"/>
      <rect x="26" y="20" width="8" height="7" rx="1" fill="currentColor" opacity="0.5"/>
      <rect x="19" y="33" width="10" height="9" rx="1" fill="currentColor" opacity="0.4"/>
      <path d="M20 4L24 2L28 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  WAREHOUSE: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M4 20L24 8L44 20V42H4V20Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      <line x1="4" y1="20" x2="44" y2="20" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <rect x="16" y="28" width="16" height="14" rx="1" fill="currentColor" opacity="0.4"/>
      <line x1="24" y1="28" x2="24" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <rect x="8" y="24" width="7" height="7" rx="1" fill="currentColor" opacity="0.35"/>
      <rect x="33" y="24" width="7" height="7" rx="1" fill="currentColor" opacity="0.35"/>
    </svg>
  ),
  LAUNCH: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M24 4C24 4 34 10 34 22C34 28.6 29.5 34 24 36C18.5 34 14 28.6 14 22C14 10 24 4 24 4Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <path d="M16 30L10 38L18 36L20 44L24 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      <path d="M32 30L38 38L30 36L28 44L24 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      <circle cx="24" cy="22" r="4" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
}

const CATEGORIES = [
  { label: 'Apartamentos', type: 'APARTMENT', iconKey: 'APARTMENT' },
  { label: 'Casas', type: 'HOUSE', iconKey: 'HOUSE' },
  { label: 'Terrenos', type: 'LAND', iconKey: 'LAND' },
  { label: 'Comercial', type: 'STORE', iconKey: 'STORE' },
  { label: 'Chácaras', type: 'FARM', iconKey: 'FARM' },
  { label: 'Coberturas', type: 'PENTHOUSE', iconKey: 'PENTHOUSE' },
  { label: 'Galpões', type: 'WAREHOUSE', iconKey: 'WAREHOUSE' },
  { label: 'Lançamentos', isFeatured: true, iconKey: 'LAUNCH' },
]

// Schema.org WebSite com SearchAction
const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://www.agoraencontrei.com.br/#website',
  name: 'AgoraEncontrei — Imobiliária Lemos',
  url: 'https://www.agoraencontrei.com.br',
  description: 'Encontre imóveis à venda e para alugar em Franca/SP e região. Imobiliária Lemos.',
  inLanguage: 'pt-BR',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.agoraencontrei.com.br/imoveis?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    '@id': 'https://www.agoraencontrei.com.br/#organization',
    name: 'Imobiliária Lemos',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.agoraencontrei.com.br/logo-lemos-v2.png',
      width: 200,
      height: 200,
    },
  },
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Como comprar um imóvel em Franca SP?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Para comprar um imóvel em Franca/SP, entre em contato com a Imobiliária Lemos. Temos mais de 1.000 imóveis disponíveis — casas, apartamentos, terrenos e imóveis comerciais. Oferecemos financiamento facilitado pela Caixa Econômica Federal e outros bancos. Ligue (16) 3722-0000 ou acesse agoraencontrei.com.br.',
      },
    },
    {
      '@type': 'Question',
      name: 'Qual o preço médio de casas à venda em Franca SP?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O preço médio de casas à venda em Franca/SP varia de R$ 150.000 (casas populares em bairros periféricos) a R$ 2.000.000 (casas de alto padrão em condomínios fechados como Polo Club e Jardim Europa). Consulte nosso portfólio completo em agoraencontrei.com.br/casas-a-venda-franca-sp.',
      },
    },
    {
      '@type': 'Question',
      name: 'Quais são os melhores bairros para morar em Franca SP?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Os bairros mais valorizados de Franca/SP são: Jardim Europa, Jardim Califórnia, Polo Club, Jardim América, Jardim Paulista, Centro, Jardim Redentor e Jardim Universitário. Para famílias, os condomínios fechados como Villaggio di Firenze e Portal de Minas são muito procurados.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como alugar um imóvel em Franca SP?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Para alugar um imóvel em Franca/SP com a Imobiliária Lemos, basta acessar agoraencontrei.com.br/casas-para-alugar-franca-sp ou ligar (16) 3722-0000. Exigimos fiador, seguro-fiança ou depósito caução. O processo é rápido e seguro, com contrato digital.',
      },
    },
    {
      '@type': 'Question',
      name: 'A Imobiliária Lemos faz avaliação de imóveis em Franca SP?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim! A Imobiliária Lemos realiza avaliações de imóveis em Franca/SP e região gratuitamente para venda ou locação. Acesse agoraencontrei.com.br/avaliacao ou ligue (16) 3722-0000.',
      },
    },
    {
      '@type': 'Question',
      name: 'Como anunciar meu imóvel em Franca SP?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Para anunciar seu imóvel em Franca/SP com a Imobiliária Lemos, acesse agoraencontrei.com.br/anunciar e preencha o formulário. Nossa equipe entrará em contato em até 24 horas. O serviço é gratuito para proprietários.',
      },
    },
  ],
}

const LOCAL_BUSINESS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'RealEstateAgent'],
  '@id': 'https://www.agoraencontrei.com.br/#organization',
  name: 'Imobiliária Lemos — AgoraEncontrei',
  alternateName: ['Imobiliária Lemos', 'AgoraEncontrei', 'Lemos Imóveis Franca'],
  description: 'Imobiliária com mais de 22 anos de tradição em Franca/SP. Especializada em compra, venda e locação de imóveis residenciais e comerciais.',
  url: 'https://www.agoraencontrei.com.br',
  telephone: '+55-16-99311-6199',
  email: 'contato@imobiliarialemos.com.br',
  foundingDate: '2002',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rua Prudente de Moraes, 1266',
    addressLocality: 'Franca',
    addressRegion: 'SP',
    postalCode: '14400-340',
    addressCountry: 'BR',
  },
  geo: { '@type': 'GeoCoordinates', latitude: -20.5386, longitude: -47.4008 },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:00', closes: '12:00' },
  ],
  priceRange: 'R$ 150.000 - R$ 5.000.000',
  areaServed: [
    { '@type': 'City', name: 'Franca', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Ribeirão Preto', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Batatais', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Restinga', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Cristais Paulista', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Itirapuã', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
  ],
  hasMap: 'https://maps.google.com/?q=Imobiliária+Lemos+Franca+SP',
  logo: 'https://www.agoraencontrei.com.br/logo-lemos-v2.png',
  image: 'https://www.agoraencontrei.com.br/og-image.jpg',
  sameAs: [
    'https://www.instagram.com/imobiliarialemos',
    'https://www.instagram.com/tomaslemosbr',
    'https://www.youtube.com/@imobiliarialemos',
    'http://www.imobiliarialemos.com.br',
  ],
}

export default async function HomePage() {
  const [featured, stats, siteSettings] = await Promise.all([
    fetchFeaturedProperties(),
    fetchStats(),
    fetchSiteSettings(),
  ])

  return (
    <>
      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }} />

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ background: '#0f1c3a', minHeight: 'max(85vh, 600px)' }}
      >
        <HeroBackground videoUrl={siteSettings.heroVideoUrl} videoType={siteSettings.heroVideoType} />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center pt-8 pb-24 sm:pt-10 sm:pb-16">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-4 sm:mb-6"
            style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: 'var(--site-accent-color, #C9A84C)', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            <Star className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">Mais de 20 anos de tradição em Franca/SP</span>
            <span className="sm:hidden">20+ anos em Franca/SP</span>
          </div>

          {/* Título — responsivo */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-[1.15]"
            style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            Encontre o imóvel
            <br />
            <span style={{ color: 'var(--site-accent-color, #C9A84C)' }}>dos seus sonhos</span>
          </h1>

          {/* Subtítulo — menor no mobile */}
          <p className="text-white/70 text-sm sm:text-lg mb-5 sm:mb-10 max-w-xl mx-auto font-medium">
            {stats.total > 0
              ? `${stats.total.toLocaleString('pt-BR')} imóveis disponíveis para compra e aluguel`
              : 'Compra, venda e locação de imóveis em Franca e região'}
          </p>

          <HeroSearchForm />
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="var(--site-background-color, #f8f6f1)"/>
          </svg>
        </div>
      </section>

      {/* ── 2. MARKETPLACE (logo após o hero/busca) ──────────────────────── */}
      <section style={{ backgroundColor: 'var(--site-primary-color, #1B2B5B)' }} className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
              style={{ color: 'var(--site-accent-color, #C9A84C)' }}
            >
              Criado pela Imobiliária Lemos, referência desde 2002
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white leading-snug"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              O Marketplace Imobiliário de{' '}
              <span style={{ color: 'var(--site-accent-color, #C9A84C)' }}>Franca e Região</span>
            </h2>
            <p className="text-white/50 text-sm mt-4 max-w-2xl mx-auto leading-relaxed">
              O AgoraEncontrei é a plataforma mais avançada para compra, venda e locação de imóveis
              em Franca/SP e região. Aberto para corretores, proprietários e investidores
              anunciarem com tecnologia de ponta.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              {
                label: 'Busca com IA',
                desc: 'Encontre imóveis por conversa inteligente',
                icon: (
                  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" stroke="#C9A84C" strokeWidth="2"/>
                    <path d="M10 16C10 12.7 12.7 10 16 10C19.3 10 22 12.7 22 16" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="16" cy="16" r="3" fill="#C9A84C" opacity="0.7"/>
                    <path d="M16 6V4M16 28V26M6 16H4M28 16H26" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                ),
              },
              {
                label: 'Mapa Interativo',
                desc: 'Navegue por bairros e regiões no mapa',
                icon: (
                  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 4C11.6 4 8 7.6 8 12C8 18 16 28 16 28C16 28 24 18 24 12C24 7.6 20.4 4 16 4Z" stroke="#C9A84C" strokeWidth="2" fill="none"/>
                    <circle cx="16" cy="12" r="3" fill="#C9A84C" opacity="0.7"/>
                  </svg>
                ),
              },
              {
                label: '1000+ Imóveis',
                desc: 'O maior acervo imobiliário da região',
                icon: (
                  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="14" width="10" height="14" rx="1" stroke="#C9A84C" strokeWidth="2" fill="none"/>
                    <rect x="11" y="8" width="10" height="20" rx="1" stroke="#C9A84C" strokeWidth="2" fill="none"/>
                    <rect x="18" y="11" width="10" height="17" rx="1" stroke="#C9A84C" strokeWidth="2" fill="none"/>
                    <line x1="7" y1="20" x2="11" y2="20" stroke="#C9A84C" strokeWidth="1.5" opacity="0.5"/>
                    <line x1="14" y1="14" x2="18" y2="14" stroke="#C9A84C" strokeWidth="1.5" opacity="0.5"/>
                  </svg>
                ),
              },
              {
                label: 'Anúncio Gratuito',
                desc: 'Cadastre seu imóvel sem custo inicial',
                icon: (
                  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" stroke="#C9A84C" strokeWidth="2"/>
                    <path d="M11 16L14.5 19.5L21 12.5" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
            ].map(feat => (
              <div
                key={feat.label}
                className="rounded-2xl p-5 text-center transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
              >
                {feat.icon}
                <p className="text-white font-semibold text-sm mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                  {feat.label}
                </p>
                <p className="text-white/40 text-xs leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/anunciar"
              className="px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 text-center"
              style={{ backgroundColor: 'var(--site-accent-color, #C9A84C)', color: 'var(--site-primary-color, #1B2B5B)' }}
            >
              Anuncie seu Imóvel
            </Link>
            <Link
              href="/contato"
              className="px-8 py-3.5 rounded-xl text-sm font-bold text-center transition-all hover:bg-white/10"
              style={{ border: '1px solid rgba(201,168,76,0.4)', color: 'var(--site-accent-color, #C9A84C)' }}
            >
              Seja um Corretor Parceiro
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. PARCEIROS OFICIAIS ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--site-accent-color, #C9A84C)' }}>
            Marketplace Imobiliário
          </p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--site-primary-color, #1B2B5B)', fontFamily: 'Georgia, serif' }}>
            Nossas Imobiliárias Parceiras
          </h2>
          <p className="text-gray-500 text-sm mt-1">Imobiliárias e profissionais parceiros anunciando no marketplace</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {/* Card Imobiliária Lemos */}
          <Link
            href="/parceiros/imobiliaria-lemos"
            className="group bg-white rounded-2xl p-8 border hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center w-full max-w-xs cursor-pointer hover:-translate-y-1"
            style={{ borderColor: '#C9A84C', borderWidth: 2 }}
          >
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
              1º Parceiro Oficial
            </span>
            <div className="w-32 h-32 mb-4">
              <Image
                src="/logo-lemos-v2.png"
                alt="Imobiliária Lemos"
                width={128}
                height={128}
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--site-primary-color, #1B2B5B)', fontFamily: 'Georgia, serif' }}>Imobiliária Lemos</h3>
            <p className="text-xs text-gray-500 mb-1">Franca — SP</p>
            <p className="text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>Desde 2002 · +22 anos de tradição</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              Referência no mercado imobiliário de Franca e região. Especializada em compra, venda e locação de imóveis residenciais e comerciais.
            </p>
            <span
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all group-hover:brightness-110"
              style={{ backgroundColor: 'var(--site-primary-color, #1B2B5B)', color: 'white' }}
            >
              Ver equipe e imóveis <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card Seja um Parceiro */}
          <a
            href="https://wa.me/5516981010004?text=Olá! Gostaria de ser um parceiro do AgoraEncontrei e anunciar meus imóveis."
            target="_blank"
            rel="noreferrer"
            className="group bg-white rounded-2xl p-8 border border-dashed flex flex-col items-center text-center w-full max-w-xs cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            style={{ borderColor: '#C9A84C' }}
          >
            <div className="w-28 h-28 rounded-full flex items-center justify-center mb-4 border-4 border-dashed" style={{ borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.08)' }}>
              <span className="text-5xl font-bold" style={{ color: '#C9A84C' }}>+</span>
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--site-primary-color, #1B2B5B)', fontFamily: 'Georgia, serif' }}>Seja um Parceiro</h3>
            <p className="text-xs text-gray-500 mb-4">Sua imobiliária aqui</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              Anuncie seus imóveis no maior marketplace imobiliário de Franca. Tecnologia de ponta, sem custo inicial.
            </p>
            <span
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all group-hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              Entrar em contato <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </a>
        </div>

        <div className="text-center mt-6">
          <Link href="/parceiros" className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all" style={{ color: 'var(--site-accent-color, #C9A84C)' }}>
            Ver todos os parceiros <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── 4. CATEGORIAS (tipos de imóvel com ícones SVG profissionais) ──── */}
      <section style={{ backgroundColor: 'var(--site-background-color, #f8f6f1)' }} className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--site-primary-color, #1B2B5B)', fontFamily: 'Georgia, serif' }}>
              O que você procura?
            </h2>
            <p className="text-gray-500 text-sm mt-1">Selecione o tipo de imóvel e explore as opções</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map(cat => {
              const href = cat.type ? `/imoveis?type=${cat.type}` : `/imoveis?isFeatured=true`
              return (
                <Link
                  key={cat.label}
                  href={href}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#C9A84C] hover:shadow-lg transition-all duration-200 text-center"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(27,43,91,0.06)', color: '#1B2B5B' }}
                  >
                    <div className="group-hover:text-[#C9A84C] transition-colors duration-200" style={{ color: 'var(--site-primary-color, #1B2B5B)' }}>
                      {CategoryIcons[cat.iconKey]}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-[#1B2B5B] leading-tight transition-colors">
                    {cat.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 5. IMÓVEIS EM DESTAQUE (somente admin pode selecionar) ────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--site-primary-color, #1B2B5B)', fontFamily: 'Georgia, serif' }}>
                Imóveis em Destaque
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">Imóveis selecionados pela nossa equipe para você</p>
            </div>
            <Link
              href="/imoveis"
              className="flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
              style={{ color: 'var(--site-accent-color, #C9A84C)' }}
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.slice(0, 8).map((p: any) => (
              <Link
                key={p.id}
                href={`/imoveis/${p.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-transparent transition-all duration-300"
              >
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {p.coverImage && !p.coverImage.includes('telefone.png') && !p.coverImage.includes('whatsapp') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span className="text-white/30 text-xs">Foto em breve</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: p.purpose === 'RENT' ? 'var(--site-primary-color, #1B2B5B)' : 'var(--site-accent-color, #C9A84C)',
                        color: p.purpose === 'RENT' ? 'white' : 'var(--site-primary-color, #1B2B5B)',
                      }}
                    >
                      {p.purpose === 'SALE' ? 'Venda' : p.purpose === 'RENT' ? 'Aluguel' : p.purpose === 'BOTH' ? 'Venda/Alug.' : 'Temporada'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug group-hover:text-[#1B2B5B] transition-colors">
                    {p.title}
                  </p>
                  {(p.city || p.neighborhood) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {[p.neighborhood, p.city].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500">
                    {p.bedrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5" /> {p.bedrooms}
                      </span>
                    )}
                    {p.bathrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" /> {p.bathrooms}
                      </span>
                    )}
                    {p.totalArea > 0 && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-3.5 h-3.5" /> {p.totalArea}m²
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold mt-3" style={{ color: 'var(--site-primary-color, #1B2B5B)' }}>
                    {formatPrice(p)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 6 & 7. SMART QUIZ + CTA AVALIAÇÃO (lado a lado) ────────────── */}
      <SmartQuizModal>
      <section style={{ backgroundColor: '#f0ede6' }} className="py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl border border-gray-200/60">

            {/* Coluna esquerda — Smart Quiz */}
            <div className="bg-[#f0ede6] px-8 py-10 flex flex-col justify-center">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-5 w-fit"
                style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Busca Inteligente com IA
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                Não sabe por onde começar?
              </h2>
              <p className="text-gray-500 text-sm mb-8 max-w-sm leading-relaxed">
                Responda 5 perguntas rápidas e nossa IA encontra os imóveis perfeitos para o seu perfil — em menos de 2 minutos.
              </p>
              <SmartQuizButton />
              <p className="text-gray-400 text-xs mt-3">Gratuito · 2 minutos · Sem compromisso</p>
            </div>

            {/* Divisor vertical */}
            <div className="hidden lg:block absolute" style={{ display: 'none' }} />

            {/* Coluna direita — CTA Avaliação */}
            <div className="bg-white px-8 py-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-200">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: 'var(--site-primary-color, #1B2B5B)', fontFamily: 'Georgia, serif' }}>
                Quer saber quanto vale seu imóvel?
              </h2>
              <p className="text-gray-500 text-sm mb-8 max-w-sm leading-relaxed">
                Avaliação profissional com dados em tempo real. 3 métodos, laudo instantâneo. 1ª avaliação gratuita por CPF.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/avaliacao"
                  className="px-7 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 text-center"
                  style={{ backgroundColor: 'var(--site-accent-color, #C9A84C)', color: 'var(--site-primary-color, #1B2B5B)' }}
                >
                  Avaliação imediata
                </Link>
                <a
                  href="https://wa.me/5516981010004?text=Olá! Gostaria de uma avaliação imediata do meu imóvel."
                  target="_blank"
                  rel="noreferrer"
                  className="px-7 py-3 rounded-xl text-sm font-bold border-2 transition-all hover:bg-[#1B2B5B] hover:text-white text-center"
                  style={{ borderColor: 'var(--site-primary-color, #1B2B5B)', color: 'var(--site-primary-color, #1B2B5B)' }}
                >
                  Falar pelo WhatsApp
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
      </SmartQuizModal>



      {/* ── 8.5. LEILÕES — CTA + RANKING ──────────────────────────────── */}
      <section className="py-12" style={{ backgroundColor: '#1B2B5B' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Leilões de Imóveis com até 70% de Desconto
          </h2>
          <p className="text-white/60 text-lg mb-6 max-w-2xl mx-auto">
            Dados reais cruzados de Caixa, Santander, ZAP e QuintoAndar.
            Calculadora de ROI, score jurídico e alertas inteligentes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Link
              href="/leiloes"
              className="px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              Ver Leilões Ativos
            </Link>
            <Link
              href="/oportunidades/melhores-alugueis-brasil"
              className="px-8 py-4 rounded-xl font-bold text-lg border-2 text-white transition-all hover:bg-white/10"
              style={{ borderColor: '#C9A84C' }}
            >
              Ranking de Yield Nacional
            </Link>
            <Link
              href="/investor"
              className="px-8 py-4 rounded-xl font-bold text-lg border-2 text-white transition-all hover:bg-white/10"
              style={{ borderColor: '#4ade80' }}
            >
              Terminal Investidor
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Leilões Monitorados', value: '500+' },
              { label: 'Desconto Médio', value: '38%' },
              { label: 'Cidades Cobertas', value: '5.570' },
              { label: 'Fontes de Dados', value: '12' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl px-4 py-3 text-center">
                <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>{s.value}</div>
                <div className="text-[11px] text-white/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. REDES SOCIAIS + QUICK STATS ──────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-10 py-5 px-8 rounded-2xl bg-white shadow-lg border border-gray-100 mb-10">
          {[
            { label: 'Imóveis', value: stats.total > 0 ? stats.total.toLocaleString('pt-BR') + '+' : '1.011+' },
            { label: 'Anos de mercado', value: '22+' },
            { label: 'Famílias atendidas', value: '5.000+' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold" style={{ color: 'var(--site-accent-color, #C9A84C)', fontFamily: 'Georgia, serif' }}>
                {stat.value}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--site-primary-color, #1B2B5B)', fontFamily: 'Georgia, serif' }}>Siga-nos nas Redes Sociais</h2>
          <p className="text-gray-500 text-sm mt-1">Acompanhe os melhores imóveis, dicas e novidades</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://www.instagram.com/imobiliarialemos"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram da Imobiliária Lemos (@imobiliarialemos)"
            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 font-semibold transition-all hover:shadow-lg"
            style={{ borderColor: '#E1306C', color: '#E1306C', backgroundColor: '#fff' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @imobiliarialemos
          </a>
          <a
            href="https://www.instagram.com/tomaslemosbr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Tomás Lemos (@tomaslemosbr)"
            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 font-semibold transition-all hover:shadow-lg"
            style={{ borderColor: '#E1306C', color: '#E1306C', backgroundColor: '#fff' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @tomaslemosbr
          </a>
          <a
            href="https://www.youtube.com/@imobiliarialemos"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Canal YouTube da Imobiliária Lemos"
            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 font-semibold transition-all hover:shadow-lg"
            style={{ borderColor: '#FF0000', color: '#FF0000', backgroundColor: '#fff' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Canal no YouTube
          </a>
        </div>
      </section>

      {/* ── VÍDEO DE APRESENTAÇÃO (último antes do rodapé) ──────────────── */}
      {(siteSettings.presentationVideoUrl || siteSettings.presentationBannerUrl) && (
        <PresentationSection
          videoUrl={siteSettings.presentationVideoUrl ?? null}
          bannerUrl={siteSettings.presentationBannerUrl ?? null}
          bannerLink={siteSettings.presentationBannerLink ?? null}
          title={siteSettings.presentationTitle ?? null}
          subtitle={siteSettings.presentationSubtitle ?? null}
        />
      )}
      {!siteSettings.presentationVideoUrl && !siteSettings.presentationBannerUrl && (
        <PresentationSection
          videoUrl="https://files.manuscdn.com/user_upload_by_module/session_file/310519663481419273/MbhJNDOYKAGxseOh.mp4"
          bannerUrl={null}
          bannerLink={null}
          title={null}
          subtitle={null}
        />
      )}
    </>
  )
}
