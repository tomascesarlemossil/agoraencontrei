'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, ArrowRight, Shield, Clock, TrendingUp, Award, Phone, MessageCircle, Home, Building2, TreePine, Warehouse, Landmark, MapPin, Bed, Bath, Car, Maximize } from 'lucide-react'
import type { SiteTheme } from './site-themes'
import { HeroBackground } from '../HeroBackground'
import { HeroSearchForm } from '../HeroSearchForm'

interface ThemedHomePageProps {
  theme: SiteTheme
  siteSettings: any
  featured: any[]
  stats: { total: number }
  config?: any  // systemConfig para textos personalizados
}

const CATEGORIES = [
  { label: 'Casas',       icon: '🏠', type: 'HOUSE' },
  { label: 'Apartamentos',icon: '🏢', type: 'APARTMENT' },
  { label: 'Terrenos',    icon: '🌿', type: 'LAND' },
  { label: 'Comercial',   icon: '🏪', type: 'COMMERCIAL' },
  { label: 'Galpões',     icon: '🏭', type: 'WAREHOUSE' },
  { label: 'Sítios',      icon: '🌾', type: 'FARM' },
  { label: 'Salas',       icon: '💼', type: 'OFFICE' },
  { label: 'Destaque',    icon: '⭐', type: null },
]

function formatPrice(p: any) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  if (p.purpose === 'RENT' && p.priceRent) return `${fmt(p.priceRent)}/mês`
  if (p.price) return fmt(p.price)
  return 'Consulte'
}

export function ThemedHomePage({ theme, siteSettings, featured, stats, config }: ThemedHomePageProps) {
  const c = theme.colors
  const t = theme.typography
  const l = theme.layout
  const d = theme.defaults

  // Textos personalizáveis (config sobrescreve defaults do tema)
  const texts = {
    heroBadge:          config?.site?.heroBadge          || d.heroBadge,
    heroTitle:          config?.site?.heroTitle          || d.heroTitle,
    heroTitleHighlight: config?.site?.heroTitleHighlight || d.heroTitleHighlight,
    heroSubtitle:       config?.site?.heroSubtitle       || d.heroSubtitle,
    featuredTitle:      config?.site?.featuredTitle      || d.featuredTitle,
    featuredSubtitle:   config?.site?.featuredSubtitle   || d.featuredSubtitle,
    trustTitle:         config?.site?.trustTitle         || d.trustTitle,
    ctaTitle:           config?.site?.ctaTitle           || d.ctaTitle,
    ctaSubtitle:        config?.site?.ctaSubtitle        || d.ctaSubtitle,
    ctaButton:          config?.site?.ctaButton          || d.ctaButton,
  }

  const whatsappNumber = config?.site?.whatsappNumber || siteSettings?.whatsappNumber || '5516981010004'

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        className={`relative ${l.heroMinHeight} flex items-center justify-center overflow-hidden`}
        style={{ background: c.primary }}
      >
        <HeroBackground videoUrl={siteSettings?.heroVideoUrl} videoType={siteSettings?.heroVideoType} />

        {/* Overlay */}
        <div className="absolute inset-0 z-[1]" style={{ background: l.heroOverlay }} />

        <div className={`relative z-10 ${l.containerMax} mx-auto px-4 sm:px-6 pt-8 pb-16 ${l.heroAlign === 'left' ? 'text-left' : 'text-center'}`}>
          {/* Badge */}
          {l.showBadge && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
              style={{ backgroundColor: c.badge, color: c.badgeText, border: `1px solid ${c.badgeBorder}` }}
            >
              <Star className="w-3 h-3 fill-current" />
              {texts.heroBadge}
            </div>
          )}

          {/* Título */}
          <h1
            className={`${t.heroSize} ${t.heroWeight} text-white mb-4 leading-tight`}
            style={{ fontFamily: t.heroFont }}
          >
            {texts.heroTitle}
            <br />
            <span style={{ color: c.accent }}>{texts.heroTitleHighlight}</span>
          </h1>

          {/* Subtítulo */}
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            {stats.total > 0
              ? `${stats.total.toLocaleString('pt-BR')} imóveis disponíveis para compra e aluguel`
              : texts.heroSubtitle}
          </p>

          {/* Busca */}
          <HeroSearchForm />

          {/* Estatísticas */}
          {l.showStats && (
            <div className={`flex flex-wrap gap-8 mt-12 ${l.heroAlign === 'left' ? '' : 'justify-center'}`}>
              {[
                { label: 'Imóveis', value: stats.total > 0 ? stats.total.toLocaleString('pt-BR') + '+' : '900+' },
                { label: 'Anos de mercado', value: '22+' },
                { label: 'Famílias atendidas', value: '5.000+' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold" style={{ color: c.statValue, fontFamily: t.heroFont }}>
                    {stat.value}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wave separadora */}
        {l.showWave && (
          <div className="absolute bottom-0 left-0 right-0 z-[2]">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path
                d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z"
                fill={c.wave}
              />
            </svg>
          </div>
        )}
      </section>

      {/* ── CATEGORIAS ────────────────────────────────────────────────────── */}
      {l.showCategories && (
        <section
          className={`${l.containerMax} mx-auto px-4 sm:px-6 ${l.showWave ? 'py-16' : 'py-20'}`}
          style={{ background: c.background }}
        >
          <div className="text-center mb-10">
            <h2
              className={`${t.sectionTitleSize} ${t.sectionTitleWeight}`}
              style={{ color: c.sectionTitle, fontFamily: t.heroFont }}
            >
              O que você procura?
            </h2>
            <p style={{ color: c.textMuted }} className="text-sm mt-1">
              Selecione o tipo de imóvel e explore as opções
            </p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.label}
                href={cat.type ? `/imoveis?type=${cat.type}` : `/imoveis?isFeatured=true`}
                className={`group flex flex-col items-center gap-2 p-3 ${l.cardRadius} transition-all text-center border`}
                style={{
                  backgroundColor: c.cardBg,
                  borderColor: c.cardBorder,
                }}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-medium leading-tight" style={{ color: c.text }}>
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── IMÓVEIS EM DESTAQUE ────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section
          className={`${l.containerMax} mx-auto px-4 sm:px-6 pb-16`}
          style={{ background: c.background }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className={`${t.sectionTitleSize} ${t.sectionTitleWeight}`}
                style={{ color: c.sectionTitle, fontFamily: t.heroFont }}
              >
                {texts.featuredTitle}
              </h2>
              <p style={{ color: c.textMuted }} className="text-sm mt-0.5">
                {texts.featuredSubtitle}
              </p>
            </div>
            <Link
              href="/imoveis"
              className="flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
              style={{ color: c.accent }}
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.slice(0, 8).map((p: any) => (
              <Link
                key={p.id}
                href={`/imoveis/${p.slug}`}
                className={`group ${l.cardRadius} overflow-hidden ${l.cardShadow} transition-all`}
                style={{ backgroundColor: c.cardBg, borderColor: c.cardBorder, border: `1px solid ${c.cardBorder}` }}
              >
                {/* Imagem */}
                <div className="relative h-48 overflow-hidden">
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: c.secondary }}>
                      <Home className="w-10 h-10" style={{ color: c.textMuted }} />
                    </div>
                  )}
                  {/* Badge finalidade */}
                  <div
                    className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: c.accent, color: c.buttonText }}
                  >
                    {p.purpose === 'RENT' ? 'Alugar' : 'Venda'}
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <p className="text-xs font-medium mb-1" style={{ color: c.textMuted }}>
                    {p.neighborhood || p.city || 'Franca/SP'}
                  </p>
                  <h3 className="text-sm font-semibold mb-2 line-clamp-2" style={{ color: c.text }}>
                    {p.title}
                  </h3>
                  <p className="text-base font-bold mb-3" style={{ color: c.accent }}>
                    {formatPrice(p)}
                  </p>
                  {/* Atributos */}
                  <div className="flex items-center gap-3 text-xs" style={{ color: c.textMuted }}>
                    {p.bedrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" /> {p.bedrooms}
                      </span>
                    )}
                    {p.bathrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" /> {p.bathrooms}
                      </span>
                    )}
                    {p.garages > 0 && (
                      <span className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" /> {p.garages}
                      </span>
                    )}
                    {(p.totalArea || p.builtArea) && (
                      <span className="flex items-center gap-1">
                        <Maximize className="w-3.5 h-3.5" /> {p.totalArea || p.builtArea}m²
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── DIFERENCIAIS ──────────────────────────────────────────────────── */}
      {l.showTrustBadges && (
        <section
          className={`${l.sectionPadding}`}
          style={{ background: c.secondary }}
        >
          <div className={`${l.containerMax} mx-auto px-4 sm:px-6`}>
            <div className="text-center mb-12">
              <h2
                className={`${t.sectionTitleSize} ${t.sectionTitleWeight}`}
                style={{ color: c.sectionTitle, fontFamily: t.heroFont }}
              >
                {texts.trustTitle}
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Award,      title: 'Tradição desde 2002', desc: 'Mais de 20 anos de experiência no mercado imobiliário de Franca e região.' },
                { icon: TrendingUp, title: 'Avaliação precisa',   desc: 'Tecnologia de ponta para avaliar seu imóvel com dados reais do mercado.' },
                { icon: Clock,      title: 'Agilidade',           desc: 'Processos ágeis e digitais para você fechar negócio sem burocracia.' },
                { icon: Shield,     title: 'Segurança total',     desc: 'Toda a documentação verificada e contratos com respaldo jurídico.' },
              ].map(item => (
                <div
                  key={item.title}
                  className={`p-6 ${l.cardRadius} text-center`}
                  style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${c.accent}20` }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: c.accent }} />
                  </div>
                  <h3 className="font-bold text-sm mb-2" style={{ color: c.text }}>{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: c.textMuted }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section
        className={`${l.sectionPadding}`}
        style={{ background: c.primary }}
      >
        <div className={`${l.containerMax} mx-auto px-4 sm:px-6 text-center`}>
          <h2
            className={`${t.sectionTitleSize} ${t.sectionTitleWeight} text-white mb-4`}
            style={{ fontFamily: t.heroFont }}
          >
            {texts.ctaTitle}
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            {texts.ctaSubtitle}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 px-8 py-3 ${l.cardRadius} font-bold text-sm transition-all hover:opacity-90 hover:scale-105`}
              style={{ background: c.buttonBg, color: c.buttonText }}
            >
              <MessageCircle className="w-4 h-4" />
              {texts.ctaButton}
            </a>
            <Link
              href="/imoveis"
              className={`inline-flex items-center gap-2 px-8 py-3 ${l.cardRadius} font-bold text-sm border transition-all hover:opacity-90`}
              style={{ borderColor: c.accent, color: c.accent }}
            >
              <Home className="w-4 h-4" />
              Ver todos os imóveis
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
