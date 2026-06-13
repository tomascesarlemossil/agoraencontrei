'use client'

import { X, Search, Bot, MapPin, BedDouble, Bath, Maximize, Check } from 'lucide-react'
import type { ThemeConfig } from '@/lib/site-factory/theme-registry'

/**
 * Prévia fiel de um tema de site, renderizada com as MESMAS classes do
 * THEME_REGISTRY que o site real usa (header, hero, cards de imóvel, Tomás,
 * footer). Serve para o parceiro ver 100% do visual antes de contratar.
 */

const SAMPLE = [
  { t: 'Apartamento 3 quartos', loc: 'Jardim Botânico', price: 'R$ 620.000', b: 3, ba: 2, a: 98 },
  { t: 'Casa com piscina', loc: 'Cidade Nova', price: 'R$ 890.000', b: 4, ba: 3, a: 210 },
  { t: 'Cobertura vista parque', loc: 'Centro', price: 'R$ 1.250.000', b: 3, ba: 4, a: 180 },
]

export function ThemePreviewModal({
  theme,
  selected,
  onChoose,
  onClose,
}: {
  theme: ThemeConfig
  selected: boolean
  onChoose: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Prévia do tema ${theme.name}`}
    >
      {/* Barra de controle (fora do site previsto) */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0b0f1a] text-white">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">Prévia: {theme.name}</p>
          <p className="text-[11px] text-gray-400 truncate">{theme.tagline} · ideal p/ {theme.idealFor}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onChoose}
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

      {/* Site previsto — rola dentro do modal, com as classes reais do tema */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className={`${theme.bg} ${theme.text} ${theme.fontBody} min-h-full`}>
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

          {/* Grade de imóveis */}
          <section className="px-4 py-8">
            <h2 className={`${theme.fontHeading} mb-4 text-lg font-bold`}>Destaques</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SAMPLE.map((p) => (
                <div key={p.t} className={`${theme.card} ${theme.cardHover} overflow-hidden rounded-xl border transition-all`}>
                  <div className="h-28 w-full" style={{ background: `linear-gradient(135deg, ${theme.accentHex}33, ${theme.accentHex}11)` }} />
                  <div className="p-3">
                    <p className="text-sm font-bold">{p.t}</p>
                    <p className={`mb-2 inline-flex items-center gap-1 text-xs ${theme.textMuted}`}>
                      <MapPin className="h-3 w-3" /> {p.loc}
                    </p>
                    <p className={`text-lg font-extrabold ${theme.accent}`}>{p.price}</p>
                    <div className={`mt-2 flex items-center gap-3 text-[11px] ${theme.textMuted}`}>
                      <span className="inline-flex items-center gap-1"><BedDouble className="h-3 w-3" />{p.b}</span>
                      <span className="inline-flex items-center gap-1"><Bath className="h-3 w-3" />{p.ba}</span>
                      <span className="inline-flex items-center gap-1"><Maximize className="h-3 w-3" />{p.a}m²</span>
                    </div>
                  </div>
                </div>
              ))}
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
  )
}
