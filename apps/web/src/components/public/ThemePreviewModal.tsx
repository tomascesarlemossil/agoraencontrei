'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  X, Search, Bot, MapPin, BedDouble, Bath, Maximize, Check,
  ChevronLeft, ChevronRight, Monitor, Tablet, Smartphone,
  TrendingUp, Clock, Sparkles,
} from 'lucide-react'
import type { ThemeConfig, ThemeKey } from '@/lib/site-factory/theme-registry'

/**
 * Prévia fiel e interativa de temas de site. Renderiza com as MESMAS classes do
 * THEME_REGISTRY que o site real usa (header, hero, cards de imóvel, Tomás,
 * footer) e permite:
 *  - navegar entre temas (setas + dots) sem fechar o modal;
 *  - alternar entre os modos Desktop, Tablet e Mobile;
 *  - ver estatísticas simuladas de conversão e o "mood" de cada tema;
 *  - visualizar cards de imóveis reais (quando disponíveis na API pública),
 *    com selos de Destaque e Super Destaque.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Fallback usado quando a API pública não retorna imóveis (ex.: offline/dev).
const SAMPLE: PreviewProperty[] = [
  { id: 's1', title: 'Apartamento 3 quartos', neighborhood: 'Jardim Botânico', city: null, price: 620000, priceRent: null, purpose: 'SALE', bedrooms: 3, bathrooms: 2, totalArea: 98, coverImage: null, images: null, isFeatured: true, isPremium: false },
  { id: 's2', title: 'Casa com piscina', neighborhood: 'Cidade Nova', city: null, price: 890000, priceRent: null, purpose: 'SALE', bedrooms: 4, bathrooms: 3, totalArea: 210, coverImage: null, images: null, isFeatured: false, isPremium: true },
  { id: 's3', title: 'Cobertura vista parque', neighborhood: 'Centro', city: null, price: 1250000, priceRent: null, purpose: 'SALE', bedrooms: 3, bathrooms: 4, totalArea: 180, coverImage: null, images: null, isFeatured: false, isPremium: false },
]

interface PreviewProperty {
  id: string
  title: string
  neighborhood: string | null
  city: string | null
  price: number | null
  priceRent: number | null
  purpose: string
  bedrooms: number | null
  bathrooms: number | null
  totalArea: number | null
  coverImage: string | null
  images: string[] | null
  isFeatured: boolean
  isPremium: boolean
}

interface ThemeStats {
  mood: string
  moodEmoji: string
  conversion: string
  avgTime: string
  highlight: string
}

// Estatísticas curadas por tema (simuladas, mas estáveis — sem random para não
// quebrar a hidratação). Servem para dar "personalidade" a cada visual.
const THEME_STATS: Record<ThemeKey, ThemeStats> = {
  luxury_gold:      { mood: 'Sofisticado & Exclusivo', moodEmoji: '👑', conversion: '+38%', avgTime: '3m 12s', highlight: 'Ticket médio alto' },
  urban_tech:       { mood: 'Ágil & Tecnológico',     moodEmoji: '⚡', conversion: '+52%', avgTime: '1m 48s', highlight: 'Volume de leads' },
  landscape_living: { mood: 'Natural & Acolhedor',    moodEmoji: '🌿', conversion: '+41%', avgTime: '2m 36s', highlight: 'Rural & loteamentos' },
  classic_trust:    { mood: 'Tradicional & Confiável', moodEmoji: '🏛️', conversion: '+34%', avgTime: '2m 55s', highlight: 'Autoridade institucional' },
  fast_sales_pro:   { mood: 'Direto & Persuasivo',    moodEmoji: '🔥', conversion: '+58%', avgTime: '1m 22s', highlight: 'Conversão rápida' },
  signature_estate: { mood: 'Elegante & Pessoal',     moodEmoji: '✒️', conversion: '+44%', avgTime: '3m 05s', highlight: 'Marca pessoal premium' },
  minimal_studio:   { mood: 'Limpo & Profissional',   moodEmoji: '◻️', conversion: '+36%', avgTime: '2m 10s', highlight: 'Foco no essencial' },
  bold_agency:      { mood: 'Vibrante & Impactante',  moodEmoji: '💥', conversion: '+49%', avgTime: '1m 58s', highlight: 'Lançamentos & marketing' },
  editorial_journal:{ mood: 'Editorial & Autoral',    moodEmoji: '📰', conversion: '+39%', avgTime: '3m 28s', highlight: 'Conteúdo & SEO' },
}

const DEFAULT_STATS: ThemeStats = { mood: 'Moderno & Versátil', moodEmoji: '✨', conversion: '+40%', avgTime: '2m 20s', highlight: 'Equilíbrio visual' }

type Viewport = 'desktop' | 'tablet' | 'mobile'
const VIEWPORT_WIDTH: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
}

function formatPrice(p: PreviewProperty): string {
  const isRent = p.purpose === 'RENT'
  const value = isRent ? p.priceRent ?? p.price : p.price ?? p.priceRent
  if (!value) return 'Sob consulta'
  const formatted = `R$ ${value.toLocaleString('pt-BR')}`
  return isRent ? `${formatted}/mês` : formatted
}

export function ThemePreviewModal({
  themes,
  index,
  onIndexChange,
  selectedKey,
  onChoose,
  onClose,
}: {
  themes: ThemeConfig[]
  index: number
  onIndexChange: (i: number) => void
  selectedKey: string | null
  onChoose: (theme: ThemeConfig) => void
  onClose: () => void
}) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [properties, setProperties] = useState<PreviewProperty[]>(SAMPLE)

  const safeIndex = Math.min(Math.max(index, 0), themes.length - 1)
  const theme = themes[safeIndex]
  const selected = selectedKey === theme.key
  const stats = THEME_STATS[theme.key as ThemeKey] ?? DEFAULT_STATS

  const goPrev = useCallback(() => {
    onIndexChange((safeIndex - 1 + themes.length) % themes.length)
  }, [safeIndex, themes.length, onIndexChange])

  const goNext = useCallback(() => {
    onIndexChange((safeIndex + 1) % themes.length)
  }, [safeIndex, themes.length, onIndexChange])

  // Busca imóveis reais em destaque da API pública (uma vez). Mantém o SAMPLE
  // como fallback se a API estiver indisponível ou sem resultados.
  useEffect(() => {
    let active = true
    fetch(`${API_URL}/api/v1/public/properties?isFeatured=true&limit=3`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (!active || !json?.data?.length) return
        setProperties(json.data.slice(0, 3))
      })
      .catch(() => { /* mantém SAMPLE */ })
    return () => { active = false }
  }, [])

  // Navegação por teclado: ← → trocam o tema, Esc fecha.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext, onClose])

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Prévia do tema ${theme.name}`}
    >
      {/* Barra de controle (fora do site previsto) */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0b0f1a] text-white">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={goPrev}
            aria-label="Tema anterior"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 flex-shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">Prévia: {theme.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{theme.tagline} · ideal p/ {theme.idealFor}</p>
          </div>
          <button
            onClick={goNext}
            aria-label="Próximo tema"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 flex-shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Seletor de viewport */}
          <div className="hidden sm:flex items-center gap-0.5 rounded-lg bg-white/10 p-0.5">
            {([
              { id: 'desktop', icon: Monitor, label: 'Desktop' },
              { id: 'tablet', icon: Tablet, label: 'Tablet' },
              { id: 'mobile', icon: Smartphone, label: 'Mobile' },
            ] as const).map(v => (
              <button
                key={v.id}
                onClick={() => setViewport(v.id)}
                aria-label={v.label}
                title={v.label}
                className={`rounded-md p-1.5 transition-colors ${viewport === v.id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
              >
                <v.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <button
            onClick={() => onChoose(theme)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-black"
            style={{ backgroundColor: theme.accentHex }}
          >
            <Check className="h-3.5 w-3.5" /> {selected ? 'Selecionado' : 'Escolher este visual'}
          </button>
          <button onClick={onClose} aria-label="Fechar prévia" className="rounded-lg p-2 text-white/70 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Faixa de stats simuladas + mood */}
      <div className="flex items-center gap-3 overflow-x-auto bg-[#11162a] px-4 py-2 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap">
          {stats.moodEmoji} {stats.mood}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 whitespace-nowrap">
          <TrendingUp className="h-3.5 w-3.5" /> Conversão {stats.conversion}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-300 whitespace-nowrap">
          <Clock className="h-3.5 w-3.5" /> Tempo médio {stats.avgTime}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 whitespace-nowrap">
          <Sparkles className="h-3.5 w-3.5" /> {stats.highlight}
        </span>
      </div>

      {/* Site previsto — rola dentro do modal, com as classes reais do tema */}
      <div className="flex-1 overflow-y-auto overscroll-contain bg-[#070a14] p-3 sm:p-6">
        <div
          className="mx-auto h-full overflow-hidden rounded-xl border border-white/10 shadow-2xl transition-all duration-300"
          style={{ width: VIEWPORT_WIDTH[viewport], maxWidth: '100%' }}
        >
          {/* Chrome de navegador para dar contexto de "site" */}
          <div className="flex items-center gap-1.5 bg-[#1c2333] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-3 flex-1 truncate rounded-md bg-black/30 px-3 py-1 text-[10px] text-gray-400">
              suaimobiliaria.agoraencontrei.com.br
            </span>
          </div>

          <div className={`${theme.bg} ${theme.text} ${theme.fontBody}`}>
            {/* Header */}
            <header className={`${theme.headerBg} flex items-center justify-between px-4 py-3`}>
              <span className={`${theme.fontHeading} text-lg font-bold`}>Sua Imobiliária</span>
              <nav className="hidden sm:flex items-center gap-4 text-sm">
                <span className={theme.textMuted}>Comprar</span>
                <span className={theme.textMuted}>Alugar</span>
                <span className={theme.textMuted}>Leilões</span>
              </nav>
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${theme.buttonPrimary}`}>
                <Bot className="h-3.5 w-3.5" /> Tomás
              </span>
            </header>

            {/* Hero */}
            <section className={`${theme.hero} px-4 py-12 text-center`}>
              <h1 className={`${theme.fontHeading} mx-auto max-w-2xl text-2xl font-bold sm:text-4xl`}>
                Encontre o imóvel certo, sem complicação
              </h1>
              <p className={`mx-auto mt-3 max-w-xl text-sm ${theme.textMuted}`}>
                Busca inteligente, atendimento 24/7 com o Tomás e os melhores imóveis da região.
              </p>
              <div className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-xl bg-white/90 p-1.5 shadow-lg">
                <Search className="ml-2 h-4 w-4 text-gray-500" />
                <span className="flex-1 text-left text-sm text-gray-500">Bairro, cidade ou tipo…</span>
                <span className={`rounded-lg px-4 py-2 text-xs font-bold ${theme.buttonPrimary}`}>Buscar</span>
              </div>
            </section>

            {/* Grade de imóveis reais (ou SAMPLE como fallback) */}
            <section className="px-4 py-8">
              <h2 className={`${theme.fontHeading} mb-4 text-lg font-bold`}>Destaques</h2>
              <div className={`grid grid-cols-1 gap-4 ${viewport === 'mobile' ? '' : 'sm:grid-cols-3'}`}>
                {properties.map((p) => {
                  const image = p.coverImage || p.images?.[0] || null
                  return (
                    <div key={p.id} className={`${theme.card} ${theme.cardHover} overflow-hidden rounded-xl border transition-all`}>
                      <div className="relative h-28 w-full" style={{ background: `linear-gradient(135deg, ${theme.accentHex}33, ${theme.accentHex}11)` }}>
                        {image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt={p.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                        )}
                        {p.isPremium ? (
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-gray-950">
                            Super Destaque
                          </span>
                        ) : p.isFeatured ? (
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            Destaque
                          </span>
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold line-clamp-1">{p.title}</p>
                        <p className={`mb-2 inline-flex items-center gap-1 text-xs ${theme.textMuted}`}>
                          <MapPin className="h-3 w-3" /> {[p.neighborhood, p.city].filter(Boolean).join(', ') || '—'}
                        </p>
                        <p className={`text-lg font-extrabold ${theme.accent}`}>{formatPrice(p)}</p>
                        <div className={`mt-2 flex items-center gap-3 text-[11px] ${theme.textMuted}`}>
                          {p.bedrooms != null && <span className="inline-flex items-center gap-1"><BedDouble className="h-3 w-3" />{p.bedrooms}</span>}
                          {p.bathrooms != null && <span className="inline-flex items-center gap-1"><Bath className="h-3 w-3" />{p.bathrooms}</span>}
                          {p.totalArea != null && <span className="inline-flex items-center gap-1"><Maximize className="h-3 w-3" />{p.totalArea}m²</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Tomás — saudação do tema */}
            <section className="px-4 pb-10">
              <div className={`${theme.card} mx-auto flex max-w-xl items-start gap-3 rounded-2xl border p-4`}>
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: theme.accentHex }}>
                  <Bot className="h-5 w-5 text-black" />
                </span>
                <div>
                  <p className="text-xs font-bold">Tomás · seu vendedor com IA</p>
                  <p className={`mt-1 text-sm ${theme.textMuted}`}>“{theme.tomasGreeting}”</p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className={`${theme.footerBg} px-4 py-6 text-center text-xs ${theme.textMuted}`}>
              Sua Imobiliária · Tema “{theme.name}” · powered by AgoraEncontrei
            </footer>
          </div>
        </div>
      </div>

      {/* Dots de navegação entre temas */}
      <div className="flex items-center justify-center gap-1.5 bg-[#0b0f1a] px-4 py-3">
        {themes.map((t, i) => (
          <button
            key={t.key}
            onClick={() => onIndexChange(i)}
            aria-label={`Ver tema ${t.name}`}
            className="rounded-full transition-all"
            style={{
              width: i === safeIndex ? 22 : 8,
              height: 8,
              backgroundColor: i === safeIndex ? theme.accentHex : 'rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
