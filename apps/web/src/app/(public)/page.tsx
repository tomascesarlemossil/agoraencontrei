import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Search, BedDouble, Bath, Car, Maximize, ArrowRight, Star, Shield, Clock, TrendingUp } from 'lucide-react'
import { HeroSearchForm } from './HeroSearchForm'
import { HeroBackground } from './HeroBackground'
import { SmartQuiz } from './SmartQuiz'

export const metadata: Metadata = {
  title: 'Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis',
  description: 'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região. Compra, venda, locação e avaliação. CRECI 279051. Casas, apartamentos, terrenos e imóveis comerciais.',
  keywords: ['imobiliária franca', 'imóveis franca sp', 'alugar casa franca', 'comprar apartamento franca', 'imobiliária lemos', 'locação franca', 'venda imóveis franca', 'CRECI 279051'],
  openGraph: {
    title: 'Imobiliária Lemos — Franca/SP',
    description: 'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Imobiliária Lemos',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Imobiliária Lemos — Franca/SP' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Imobiliária Lemos — Franca/SP',
    description: 'Imóveis de qualidade em Franca e região. CRECI 279051.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.agoraencontrei.com.br' },
}

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function fetchFeaturedProperties() {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=8&sortBy=createdAt`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

async function fetchStats() {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=1`, {
      next: { revalidate: 300 },
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
    if (!res.ok) return { heroVideoUrl: null, heroVideoType: 'youtube' }
    return res.json()
  } catch {
    return { heroVideoUrl: null, heroVideoType: 'youtube' }
  }
}

function formatPrice(p: any) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  if (p.purpose === 'RENT' && p.priceRent) return `${fmt(p.priceRent)}/mês`
  if (p.price) return fmt(p.price)
  return 'Consulte'
}

const CATEGORIES = [
  { label: 'Apartamentos', type: 'APARTMENT', icon: '🏢', count: null },
  { label: 'Casas', type: 'HOUSE', icon: '🏡', count: null },
  { label: 'Terrenos', type: 'LAND', icon: '📐', count: null },
  { label: 'Comercial', type: 'STORE', icon: '🏪', count: null },
  { label: 'Chácaras', type: 'FARM', icon: '🌿', count: null },
  { label: 'Coberturas', type: 'PENTHOUSE', icon: '✨', count: null },
  { label: 'Galpões', type: 'WAREHOUSE', icon: '🏭', count: null },
  { label: 'Lançamentos', isFeatured: true, icon: '🚀', count: null },
]

export default async function HomePage() {
  const [featured, stats, siteSettings] = await Promise.all([fetchFeaturedProperties(), fetchStats(), fetchSiteSettings()])

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
        style={{ background: '#0f1c3a' }}
      >
        {/* Video background (configurable via Settings) */}
        <HeroBackground videoUrl={siteSettings.heroVideoUrl} videoType={siteSettings.heroVideoType} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-8 pb-16">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
            style={{ backgroundColor: 'rgba(201, 168, 76, 0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            <Star className="w-3 h-3 fill-current" />
            Mais de 20 anos de tradição em Franca/SP
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Encontre o imóvel
            <br />
            <span style={{ color: '#C9A84C' }}>dos seus sonhos</span>
          </h1>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            {stats.total > 0
              ? `${stats.total.toLocaleString('pt-BR')} imóveis disponíveis para compra e aluguel`
              : 'Compra, venda e locação de imóveis em Franca e região'}
          </p>

          {/* Search */}
          <HeroSearchForm />

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { label: 'Imóveis', value: stats.total > 0 ? stats.total.toLocaleString('pt-BR') + '+' : '900+' },
              { label: 'Anos de mercado', value: '22+' },
              { label: 'Famílias atendidas', value: '5.000+' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>
                  {stat.value}
                </p>
                <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#f8f6f1"/>
          </svg>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            O que você procura?
          </h2>
          <p className="text-gray-500 text-sm mt-1">Selecione o tipo de imóvel e explore as opções</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-3">
          {CATEGORIES.map(cat => {
            const href = cat.type
              ? `/imoveis?type=${cat.type}`
              : `/imoveis?isFeatured=true`
            return (
              <Link
                key={cat.label}
                href={href}
                className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 hover:border-transparent hover:shadow-md transition-all text-center"
                style={{ '--hover-border': '#C9A84C' } as any}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-[#1B2B5B] leading-tight">
                  {cat.label}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                Imóveis em Destaque
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">Recém cadastrados — os mais novos do portfólio</p>
            </div>
            <Link
              href="/imoveis"
              className="flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
              style={{ color: '#C9A84C' }}
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
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {p.coverImage ? (
                    <Image
                      src={p.coverImage}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, #1B2B5B15, #C9A84C15)' }}>
                      🏠
                    </div>
                  )}
                  {/* Purpose badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: p.purpose === 'RENT' ? '#1B2B5B' : '#C9A84C',
                        color: p.purpose === 'RENT' ? 'white' : '#1B2B5B',
                      }}
                    >
                      {p.purpose === 'SALE' ? 'Venda' : p.purpose === 'RENT' ? 'Aluguel' : p.purpose === 'BOTH' ? 'Venda/Alug.' : 'Temporada'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug group-hover:text-[#1B2B5B] transition-colors">
                    {p.title}
                  </p>
                  {(p.city || p.neighborhood) && (
                    <p className="text-xs text-gray-400 mt-1">
                      {[p.neighborhood, p.city].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  {/* Stats */}
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

                  {/* Price */}
                  <p className="text-base font-bold mt-3" style={{ color: '#1B2B5B' }}>
                    {formatPrice(p)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── SOCIAL MEDIA ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Siga-nos nas Redes Sociais</h2>
          <p className="text-gray-500 text-sm mt-1">Acompanhe os melhores imóveis, dicas e novidades</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://www.instagram.com/imobiliarialemos"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 font-semibold transition-all hover:shadow-lg"
            style={{ borderColor: '#E1306C', color: '#E1306C', backgroundColor: '#fff' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @imobiliarialemos
          </a>
          <a
            href="https://www.instagram.com/tomaslemosbr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 font-semibold transition-all hover:shadow-lg"
            style={{ borderColor: '#E1306C', color: '#E1306C', backgroundColor: '#fff' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @tomaslemosbr
          </a>
          <a
            href="https://www.youtube.com/@imobiliarialemos"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 font-semibold transition-all hover:shadow-lg"
            style={{ borderColor: '#FF0000', color: '#FF0000', backgroundColor: '#fff' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Canal no YouTube
          </a>
        </div>
      </section>

      {/* ── SMART QUIZ ──────────────────────────────────────────────── */}
      <SmartQuiz />

      {/* ── WHY LEMOS ───────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#1B2B5B' }} className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Por que escolher a <span style={{ color: '#C9A84C' }}>Imobiliária Lemos?</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Tradição desde 2002',
                desc: 'Mais de 20 anos de experiência e confiança no mercado imobiliário de Franca e região.',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Avaliação precisa',
                desc: 'Avaliação gratuita com base em dados reais de mercado e expertise local.',
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: 'Agilidade',
                desc: 'Processo transparente e rápido do início à escritura, sem burocracia desnecessária.',
              },
              {
                icon: <Star className="w-6 h-6 fill-current" />,
                title: 'Atendimento personalizado',
                desc: 'Corretores especializados dedicados a entender e realizar o seu sonho.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="rounded-2xl p-6 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
                >
                  {item.icon}
                </div>
                <p className="text-white font-semibold text-sm mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {item.title}
                </p>
                <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA AVALIAÇÃO ───────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#f8f6f1' }} className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Quer saber quanto vale seu imóvel?
          </h2>
          <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
            Solicite uma avaliação gratuita com nossa equipe especializada. Resposta em até 24 horas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/avaliacao"
              className="px-8 py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              Solicitar avaliação gratuita
            </Link>
            <a
              href="https://wa.me/5516981010004?text=Olá! Gostaria de uma avaliação gratuita do meu imóvel."
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3 rounded-xl text-sm font-bold border-2 transition-all hover:bg-[#1B2B5B] hover:text-white"
              style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
            >
              Falar pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── NOSSA EQUIPE ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>Imobiliária Lemos</p>
          <h2 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Nossa Equipe de Corretores
          </h2>
          <p className="text-gray-500 text-sm mt-1">Profissionais especializados prontos para te atender</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Noêmia Pires Lemos', role: 'Diretora · Corretora', creci: '279051-F', phone: '5516981010005', color: '#1B2B5B', initial: 'N' },
            { name: 'Naira Cristina Lemos', role: 'Corretora de Imóveis', creci: '279051-F', phone: '5516981010003', color: '#2d4a8a', initial: 'N' },
            { name: 'Nádia Lemos da Silva', role: 'Corretora de Imóveis', creci: '61053-F', phone: '5516992533583', color: '#1B2B5B', initial: 'N' },
            { name: 'Gabriel Lemos', role: 'Corretor de Imóveis', creci: '279051-F', phone: '5516992411378', color: '#2d4a8a', initial: 'G' },
          ].map(broker => (
            <div key={broker.name} className="bg-white rounded-2xl p-5 border text-center hover:shadow-lg transition-all" style={{ borderColor: '#e8e4dc' }}>
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${broker.color}, #4a6fa8)` }}>
                {broker.initial}
              </div>
              <p className="font-bold text-sm leading-snug" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>{broker.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{broker.role}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: '#C9A84C' }}>CRECI {broker.creci}</p>
              <a
                href={`https://wa.me/${broker.phone}?text=Olá, ${broker.name.split(' ')[0]}! Vim pelo site e gostaria de informações.`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link href="/corretores" className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all" style={{ color: '#C9A84C' }}>
            Ver toda a equipe <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
