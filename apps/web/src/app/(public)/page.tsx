import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Search, BedDouble, Bath, Car, Maximize, ArrowRight, Star, Shield, Clock, TrendingUp } from 'lucide-react'
import { HeroSearchForm } from './HeroSearchForm'
import { HeroBackground } from './HeroBackground'

export const metadata: Metadata = {
  title: 'Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis',
  description: 'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região. Compra, venda, locação e avaliação. CRECI 279051.',
}

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function fetchFeaturedProperties() {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=8&sortBy=views`, {
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
              <p className="text-gray-500 text-sm mt-0.5">Selecionados pela nossa equipe</p>
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
    </>
  )
}
