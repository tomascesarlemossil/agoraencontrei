'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  X, Search, Bot, MapPin, BedDouble, Bath, Maximize, Check,
  ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet,
  Star, Sparkles, ArrowRight, Phone, Mail, Instagram, Home,
} from 'lucide-react'
import type { ThemeConfig } from '@/lib/site-factory/theme-registry'
import { ALL_THEMES } from '@/lib/site-factory/theme-registry'

/**
 * ThemePreviewModal v2 — Preview interativo e sofisticado
 * - Navegação entre temas com setas/dots (sem fechar o modal)
 * - Alternância Desktop / Tablet / Mobile
 * - Animação de transição suave entre temas
 * - Mini-stats de conversão por tema
 * - Cards de imóvel com badges de destaque/super destaque
 * - Tomás IA com balão de chat animado
 * - Footer completo
 * - Galeria de temas na barra inferior
 * - Atalhos de teclado (← → Esc Enter)
 */

type ViewMode = 'desktop' | 'tablet' | 'mobile'

const SAMPLE = [
  { t: 'Apartamento 3 quartos', loc: 'Jardim Botânico', price: 'R$ 620.000', b: 3, ba: 2, a: 98, badge: 'Destaque', tag: 'Venda' },
  { t: 'Casa com piscina', loc: 'Cidade Nova', price: 'R$ 890.000', b: 4, ba: 3, a: 210, badge: 'Super Destaque', tag: 'Venda' },
  { t: 'Cobertura vista parque', loc: 'Centro', price: 'R$ 1.250.000', b: 3, ba: 4, a: 180, badge: null, tag: 'Lançamento' },
]

const VIEW_WIDTHS: Record<ViewMode, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px] mx-auto',
  mobile: 'w-[390px] mx-auto',
}

const THEME_STATS: Record<string, { conv: string; ideal: string; mood: string }> = {
  luxury_gold:      { conv: '8.2%', ideal: 'Alto padrão', mood: '🏆 Premium' },
  urban_tech:       { conv: '12.4%', ideal: 'Volume & leads', mood: '⚡ Dinâmico' },
  landscape_living: { conv: '9.1%', ideal: 'Terrenos & rural', mood: '🌿 Natural' },
  classic_trust:    { conv: '7.8%', ideal: 'Tradição & família', mood: '🤝 Confiável' },
  fast_sales_pro:   { conv: '14.6%', ideal: 'Alta performance', mood: '🔥 Urgência' },
  signature_estate: { conv: '6.9%', ideal: 'Sofisticação', mood: '✨ Elegante' },
  minimal_studio:   { conv: '10.3%', ideal: 'Qualquer nicho', mood: '🎯 Focado' },
  bold_agency:      { conv: '13.1%', ideal: 'Impacto visual', mood: '💥 Arrojado' },
  editorial_journal:{ conv: '5.4%', ideal: 'Conteúdo & blog', mood: '📰 Editorial' },
}

const BADGE_COLORS: Record<string, string> = {
  'Destaque': '#C9A84C',
  'Super Destaque': '#e11d48',
  'Lançamento': '#7c3aed',
}

export function ThemePreviewModal({
  theme: initialTheme,
  selected,
  onChoose,
  onClose,
}: {
  theme: ThemeConfig
  selected: boolean
  onChoose: () => void
  onClose: () => void
}) {
  const [currentTheme, setCurrentTheme] = useState(initialTheme)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [isAnimating, setIsAnimating] = useState(false)

  const currentIndex = ALL_THEMES.findIndex(t => t.key === currentTheme.key)
  const isCurrentSelected = selected && initialTheme.key === currentTheme.key

  const switchTheme = useCallback((newTheme: ThemeConfig) => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentTheme(newTheme)
      setIsAnimating(false)
    }, 180)
  }, [])

  const goNext = useCallback(() => {
    switchTheme(ALL_THEMES[(currentIndex + 1) % ALL_THEMES.length])
  }, [currentIndex, switchTheme])

  const goPrev = useCallback(() => {
    switchTheme(ALL_THEMES[(currentIndex - 1 + ALL_THEMES.length) % ALL_THEMES.length])
  }, [currentIndex, switchTheme])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, onClose])

  const theme = currentTheme
  const dark = ['luxury_gold', 'bold_agency'].includes(theme.key)
  const stats = THEME_STATS[theme.key] ?? { conv: '9%', ideal: theme.idealFor, mood: '✅ Profissional' }

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Prévia do tema ${theme.name}`}
    >
      {/* ── Barra superior ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
        style={{ backgroundColor: '#0b0f1a', borderColor: '#1e293b' }}
      >
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accentHex }} />
            <p className="text-sm font-bold text-white truncate">{theme.name}</p>
            <span className="text-[10px] text-gray-500 hidden sm:inline">· {theme.tagline}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] mt-0.5">
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">{stats.mood}</span>
            <span className="text-white/50">Conv. <strong className="text-green-400">{stats.conv}</strong></span>
            <span className="text-white/40 hidden sm:inline">Ideal: {stats.ideal}</span>
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center gap-1">
          <button onClick={goPrev} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors" title="Anterior (←)">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 px-1">
            {ALL_THEMES.map((t, i) => (
              <button
                key={t.key}
                onClick={() => switchTheme(t)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentIndex ? 16 : 6,
                  height: 6,
                  backgroundColor: i === currentIndex ? theme.accentHex : '#374151',
                }}
                title={t.name}
              />
            ))}
          </div>
          <button onClick={goNext} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors" title="Próximo (→)">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Viewport */}
        <div className="hidden sm:flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: '#1e293b' }}>
          {(['desktop', 'tablet', 'mobile'] as ViewMode[]).map((mode) => {
            const icons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone }
            const Icon = icons[mode]
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="rounded-md p-1.5 transition-all"
                style={{ backgroundColor: viewMode === mode ? '#334155' : 'transparent', color: viewMode === mode ? '#f1f5f9' : '#64748b' }}
                title={mode}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <button
          onClick={onChoose}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:brightness-110 flex-shrink-0"
          style={{ backgroundColor: isCurrentSelected ? '#22c55e' : theme.accentHex, color: dark ? '#fff' : '#000' }}
        >
          <Check className="h-3.5 w-3.5" />
          {isCurrentSelected ? 'Selecionado' : `Escolher ${theme.name}`}
        </button>
        <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Preview area ───────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ backgroundColor: viewMode === 'desktop' ? '#0b0f1a' : '#111827' }}
      >
        {viewMode !== 'desktop' && (
          <div className="text-center py-2 text-[10px] text-gray-500">
            {viewMode === 'tablet' ? '768px — iPad' : '390px — iPhone 15'}
          </div>
        )}

        <div
          className={`transition-all duration-300 ${VIEW_WIDTHS[viewMode]} ${isAnimating ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}
          style={viewMode !== 'desktop' ? {
            border: '2px solid #374151',
            borderRadius: 12,
            overflow: 'hidden',
            margin: '0 auto 24px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          } : {}}
        >
          <div className={`${theme.bg} ${theme.text} ${theme.fontBody}`}>

            {/* Header */}
            <header className={`${theme.headerBg} sticky top-0 z-10`}>
              <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: theme.accentHex, color: dark ? '#000' : '#fff' }}>
                    S
                  </div>
                  <span className={`${theme.fontHeading} text-base font-bold`}>Sua Imobiliária</span>
                </div>
                <nav className="hidden md:flex items-center gap-5 text-sm">
                  {['Comprar', 'Alugar', 'Leilões', 'Blog'].map(item => (
                    <span key={item} className={`${theme.textMuted} cursor-pointer hover:opacity-100 transition-opacity`}>{item}</span>
                  ))}
                </nav>
                <div className="flex items-center gap-2">
                  <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${theme.buttonSecondary}`}>Entrar</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${theme.buttonPrimary}`}>
                    <Bot className="h-3.5 w-3.5" /> Tomás IA
                  </span>
                </div>
              </div>
            </header>

            {/* Hero */}
            <section className={`${theme.hero} px-4 py-14 sm:py-20`}>
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-4"
                  style={{ backgroundColor: `${theme.accentHex}22`, color: theme.accentHex }}>
                  <Sparkles className="h-3 w-3" />
                  Imóveis verificados e exclusivos
                </div>
                <h1 className={`${theme.fontHeading} text-3xl sm:text-5xl font-bold mb-4 leading-tight`}>
                  Encontre o imóvel{' '}
                  <span style={{ color: theme.accentHex }}>certo</span>{' '}
                  para você
                </h1>
                <p className={`text-base sm:text-lg ${theme.textMuted} mb-8 max-w-2xl mx-auto`}>
                  Busca inteligente com IA, atendimento 24/7 com Tomás e os melhores imóveis da região.
                </p>
                <div className="mx-auto max-w-lg">
                  <div className="flex items-center gap-2 rounded-2xl bg-white/95 p-2 shadow-xl">
                    <Search className="ml-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-left text-sm text-gray-400">Bairro, cidade ou tipo de imóvel…</span>
                    <span className={`rounded-xl px-4 py-2 text-xs font-bold flex-shrink-0 ${theme.buttonPrimary}`}>Buscar</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {['Casas', 'Apartamentos', 'Leilões', 'Terrenos'].map(chip => (
                      <span key={chip} className="rounded-full px-3 py-1 text-xs cursor-pointer transition-all"
                        style={{ backgroundColor: `${theme.accentHex}18`, color: theme.accentHex, border: `1px solid ${theme.accentHex}33` }}>
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 mt-8 text-xs">
                  {[{ n: '1.200+', l: 'Imóveis' }, { n: '98%', l: 'Satisfação' }, { n: '24/7', l: 'Atendimento' }].map(s => (
                    <div key={s.l} className="text-center">
                      <p className={`text-lg font-bold ${theme.accent}`}>{s.n}</p>
                      <p className={`text-[10px] ${theme.textMuted}`}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Imóveis */}
            <section className="px-4 py-10 max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className={`${theme.fontHeading} text-xl font-bold`}>
                    {theme.key === 'luxury_gold' ? 'Oportunidades Selecionadas' :
                     theme.key === 'fast_sales_pro' ? '🔥 Destaques da Semana' :
                     theme.key === 'landscape_living' ? 'Terrenos & Loteamentos' :
                     'Imóveis em Destaque'}
                  </h2>
                  <p className={`text-xs ${theme.textMuted} mt-0.5`}>Imóveis verificados com os melhores preços</p>
                </div>
                <button className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold ${theme.accent}`}>
                  Ver todos <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {SAMPLE.map((p) => (
                  <div key={p.t} className={`${theme.card} ${theme.cardHover} overflow-hidden rounded-xl border transition-all duration-300`}>
                    <div className="relative h-36 w-full overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${theme.accentHex}40 0%, ${theme.accentHex}15 50%, ${theme.accentHex}08 100%)` }}>
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: `repeating-linear-gradient(45deg, ${theme.accentHex} 0, ${theme.accentHex} 1px, transparent 0, transparent 50%)`, backgroundSize: '12px 12px' }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Home className="h-10 w-10 opacity-20" />
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        {p.badge && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                            style={{ backgroundColor: BADGE_COLORS[p.badge] ?? theme.accentHex }}>
                            {p.badge === 'Super Destaque' ? '🌟 ' : p.badge === 'Destaque' ? '⭐ ' : ''}{p.badge}
                          </span>
                        )}
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: `${theme.accentHex}22`, color: theme.accentHex }}>
                          {p.tag}
                        </span>
                      </div>
                      <button className="absolute top-2 right-2 rounded-full bg-white/20 p-1 backdrop-blur-sm">
                        <Star className="h-3 w-3 text-white" />
                      </button>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold leading-tight">{p.t}</p>
                      <p className={`mt-0.5 mb-2 inline-flex items-center gap-1 text-xs ${theme.textMuted}`}>
                        <MapPin className="h-3 w-3" /> {p.loc}
                      </p>
                      <p className={`text-lg font-extrabold ${theme.accent}`}>{p.price}</p>
                      <div className={`mt-2 flex items-center gap-3 text-[11px] ${theme.textMuted}`}>
                        <span className="inline-flex items-center gap-1"><BedDouble className="h-3 w-3" />{p.b} qts</span>
                        <span className="inline-flex items-center gap-1"><Bath className="h-3 w-3" />{p.ba} bnh</span>
                        <span className="inline-flex items-center gap-1"><Maximize className="h-3 w-3" />{p.a}m²</span>
                      </div>
                      <button className={`mt-3 w-full rounded-lg py-1.5 text-xs font-bold transition-all ${theme.buttonPrimary}`}>
                        Ver imóvel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tomás IA */}
            <section className="px-4 pb-10 max-w-7xl mx-auto">
              <div className={`${theme.card} rounded-2xl border p-5 relative overflow-hidden`}
                style={{ borderColor: `${theme.accentHex}33` }}>
                <div className="absolute inset-0 opacity-5"
                  style={{ background: `radial-gradient(circle at 80% 50%, ${theme.accentHex}, transparent 70%)` }} />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg"
                    style={{ backgroundColor: theme.accentHex }}>
                    <Bot className="h-6 w-6" style={{ color: dark ? '#000' : '#fff' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold">Tomás · Assistente IA</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" style={{ animation: 'pulse 2s infinite' }} />
                        Online
                      </span>
                    </div>
                    <p className={`text-sm ${theme.textMuted} mb-3`}>"{theme.tomasGreeting}"</p>
                    <div className="flex flex-wrap gap-2">
                      {['Quero comprar', 'Quero alugar', 'Ver leilões'].map(q => (
                        <button key={q} className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                          style={{ backgroundColor: `${theme.accentHex}18`, color: theme.accentHex, border: `1px solid ${theme.accentHex}33` }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA contato */}
            <section className="px-4 py-10 border-t" style={{ borderColor: `${theme.accentHex}15` }}>
              <div className="max-w-2xl mx-auto text-center">
                <h3 className={`${theme.fontHeading} text-xl font-bold mb-2`}>Fale com um especialista</h3>
                <p className={`text-sm ${theme.textMuted} mb-6`}>Atendimento personalizado para encontrar o imóvel ideal.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold ${theme.buttonPrimary}`}>
                    <Phone className="h-4 w-4" /> WhatsApp
                  </button>
                  <button className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${theme.buttonSecondary}`}>
                    <Mail className="h-4 w-4" /> E-mail
                  </button>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className={`${theme.footerBg} px-4 py-8`}>
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className={`text-xs font-bold mb-2 ${theme.textMuted}`}>Imóveis</p>
                    {['Comprar', 'Alugar', 'Leilões', 'Lançamentos'].map(i => (
                      <p key={i} className={`text-xs ${theme.textMuted} mb-1 opacity-60`}>{i}</p>
                    ))}
                  </div>
                  <div>
                    <p className={`text-xs font-bold mb-2 ${theme.textMuted}`}>Empresa</p>
                    {['Sobre nós', 'Equipe', 'Blog', 'Contato'].map(i => (
                      <p key={i} className={`text-xs ${theme.textMuted} mb-1 opacity-60`}>{i}</p>
                    ))}
                  </div>
                  <div className="col-span-2">
                    <p className={`text-xs font-bold mb-2 ${theme.textMuted}`}>Sobre</p>
                    <p className={`text-xs ${theme.textMuted} opacity-60 leading-relaxed`}>
                      Sua imobiliária com tecnologia de ponta. Encontre o imóvel perfeito com a ajuda do Tomás IA.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${theme.accentHex}22` }}>
                        <Instagram className="h-3.5 w-3.5" style={{ color: theme.accentHex }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`border-t pt-4 flex items-center justify-between text-[10px] ${theme.textMuted} opacity-50`}
                  style={{ borderColor: `${theme.accentHex}15` }}>
                  <span>© 2025 Sua Imobiliária. Todos os direitos reservados.</span>
                  <span>Powered by <strong>AgoraEncontrei</strong></span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* ── Galeria inferior de temas ──────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2 overflow-x-auto border-t flex-shrink-0"
        style={{ backgroundColor: '#0b0f1a', borderColor: '#1e293b' }}
      >
        <span className="text-[10px] text-gray-500 flex-shrink-0 hidden sm:inline">Temas:</span>
        {ALL_THEMES.map((t) => {
          const isActive = t.key === theme.key
          const isDark = ['luxury_gold', 'bold_agency'].includes(t.key)
          return (
            <button
              key={t.key}
              onClick={() => switchTheme(t)}
              className="flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200"
              style={{
                border: `2px solid ${isActive ? t.accentHex : '#1e293b'}`,
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
                boxShadow: isActive ? `0 0 12px ${t.accentHex}44` : 'none',
              }}
              title={t.name}
            >
              <div className="w-14 h-9 flex flex-col justify-between p-1.5"
                style={{ backgroundColor: isDark ? '#0b0f1a' : '#ffffff' }}>
                <div className="flex items-center gap-0.5">
                  <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: t.accentHex }} />
                  <div className="h-1 w-2 rounded-full" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }} />
                </div>
                <div className="h-0.5 w-3/4 rounded-full" style={{ backgroundColor: isDark ? '#4b5563' : '#d1d5db' }} />
                <div className="h-2 w-8 rounded-sm" style={{ backgroundColor: t.accentHex }} />
              </div>
              <div className="px-1.5 py-0.5" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
                <p className="text-[8px] font-semibold truncate" style={{ color: isDark ? '#e5e7eb' : '#111827' }}>
                  {t.name}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
