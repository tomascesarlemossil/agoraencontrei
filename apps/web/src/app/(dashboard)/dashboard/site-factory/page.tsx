'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ALL_THEMES, type ThemeConfig, type ThemeKey } from '@/lib/site-factory/theme-registry'
import { ALL_PLANS, canUseTema, type PlanKey } from '@/lib/site-factory/plan-registry'
import { Check, Lock, Eye, Palette, Zap, Building2, TreePine, Shield, Rocket } from 'lucide-react'

// ── Theme Icons ─────────────────────────────────────────────────────────────

function ThemeIcon({ themeKey }: { themeKey: ThemeKey }) {
  switch (themeKey) {
    case 'luxury_gold':    return <Palette className="h-5 w-5" />
    case 'urban_tech':     return <Zap className="h-5 w-5" />
    case 'landscape_living': return <TreePine className="h-5 w-5" />
    case 'classic_trust':  return <Building2 className="h-5 w-5" />
    case 'fast_sales_pro': return <Rocket className="h-5 w-5" />
  }
}

// ── Theme Preview Mockup ────────────────────────────────────────────────────

function ThemePreview({ theme, selected }: { theme: ThemeConfig; selected: boolean }) {
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all ${selected ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-gray-700 hover:border-gray-500'}`}>
      {/* Mini browser mockup */}
      <div className="bg-gray-800 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 bg-gray-700 rounded-md px-3 py-0.5 text-[10px] text-gray-400 truncate">
          parceiro.agoraencontrei.com.br
        </div>
      </div>

      {/* Site preview */}
      <div className={`${theme.bg} ${theme.text} p-0 h-[240px] relative overflow-hidden`}>
        {/* Header */}
        <div className={`${theme.headerBg} px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md" style={{ backgroundColor: theme.accentHex }} />
            <span className={`text-xs font-bold ${theme.text}`}>Imobiliária Demo</span>
          </div>
          <div className="flex gap-3">
            <span className={`text-[10px] ${theme.textMuted}`}>Imóveis</span>
            <span className={`text-[10px] ${theme.textMuted}`}>Sobre</span>
            <span className={`text-[10px] ${theme.textMuted}`}>Contato</span>
          </div>
        </div>

        {/* Hero */}
        <div className={`${theme.hero} px-4 py-6 text-center`}>
          <p className={`text-sm ${theme.fontHeading} font-bold ${theme.text}`}>
            Encontre o imóvel ideal
          </p>
          <p className={`text-[10px] ${theme.textMuted} mt-1`}>
            Casas, apartamentos e terrenos
          </p>
          <div className="mt-3 flex gap-2 justify-center">
            <div className={`${theme.buttonPrimary} px-3 py-1 rounded-md text-[10px]`}>
              Buscar
            </div>
            <div className={`${theme.buttonSecondary} px-3 py-1 rounded-md text-[10px]`}>
              Falar com Tomás
            </div>
          </div>
        </div>

        {/* Cards row */}
        <div className="px-4 py-3 flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`${theme.card} border rounded-lg p-2 flex-1 min-w-0`}>
              <div className="h-10 rounded bg-gray-300/20 mb-1.5" />
              <div className={`h-1.5 rounded ${theme.textMuted} bg-current/20 w-3/4 mb-1`} />
              <div className={`h-1.5 rounded bg-current/10 w-1/2`} style={{ color: theme.accentHex }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function SiteFactoryPage() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('urban_tech')
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('PRO')
  const [previewTheme, setPreviewTheme] = useState<ThemeKey | null>(null)

  const activeTheme = ALL_THEMES.find(t => t.key === (previewTheme || selectedTheme))!

  return (
    <div className="px-4 sm:px-6 py-6 space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Site Factory</h1>
        <p className="text-gray-400 mt-1">
          Escolha o tema, personalize a marca e publique o site do parceiro em um clique.
        </p>
      </div>

      {/* ── Plans ─────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">1. Escolha o Plano</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ALL_PLANS.map(plan => (
            <button
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key)}
              className={`relative text-left rounded-xl border p-5 transition-all ${
                selectedPlan === plan.key
                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-500'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-2.5 left-4 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Mais popular
                </span>
              )}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold">{plan.name}</h3>
                <span className="text-blue-400 font-semibold text-sm">{plan.price}</span>
              </div>
              <p className="text-gray-400 text-xs mb-3">{plan.tagline}</p>
              <ul className="space-y-1.5">
                {plan.features.slice(0, 5).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-xs text-gray-500">
                    +{plan.features.length - 5} funcionalidades
                  </li>
                )}
              </ul>
            </button>
          ))}
        </div>
      </section>

      {/* ── Themes ────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">2. Escolha o Tema</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_THEMES.map(theme => {
            const available = canUseTema(selectedPlan, theme.key)
            return (
              <div key={theme.key} className="relative">
                {!available && (
                  <div className="absolute inset-0 z-10 bg-gray-950/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400">
                      <Lock className="h-3.5 w-3.5" />
                      Disponível no plano Superior
                    </div>
                  </div>
                )}
                <button
                  onClick={() => available && setSelectedTheme(theme.key)}
                  onMouseEnter={() => available && setPreviewTheme(theme.key)}
                  onMouseLeave={() => setPreviewTheme(null)}
                  disabled={!available}
                  className="w-full text-left"
                >
                  <ThemePreview theme={theme} selected={selectedTheme === theme.key} />

                  <div className="mt-3 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: theme.accentHex + '20', color: theme.accentHex }}>
                      <ThemeIcon themeKey={theme.key} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{theme.name}</p>
                      <p className="text-xs text-gray-400 truncate">{theme.tagline}</p>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Preview Detail ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.section
          key={activeTheme.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-xl border border-gray-700 bg-gray-900 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: activeTheme.accentHex }} />
                <h3 className="text-lg font-bold text-white">{activeTheme.name}</h3>
              </div>
              <p className="text-sm text-gray-400">{activeTheme.description}</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
              <Eye className="h-4 w-4" />
              Aplicar tema
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-gray-800 p-4">
              <p className="font-medium text-gray-300 mb-2">Ideal para</p>
              <p className="text-gray-400 text-xs">{activeTheme.idealFor}</p>
            </div>
            <div className="rounded-lg bg-gray-800 p-4">
              <p className="font-medium text-gray-300 mb-2">Tom do Tomás</p>
              <p className="text-gray-400 text-xs capitalize">{activeTheme.tomasTone}</p>
              <p className="text-gray-500 text-[11px] mt-1 italic">"{activeTheme.tomasGreeting.slice(0, 80)}..."</p>
            </div>
            <div className="rounded-lg bg-gray-800 p-4">
              <p className="font-medium text-gray-300 mb-2">Paleta</p>
              <div className="flex gap-2 mt-1">
                <div className="h-6 w-6 rounded-md" style={{ backgroundColor: activeTheme.accentHex }} title="Accent" />
                <div className={`h-6 w-6 rounded-md border border-gray-600 ${activeTheme.bg}`} title="Background" />
                <div className={`h-6 w-6 rounded-md border border-gray-600 ${activeTheme.hero.includes('blue') ? 'bg-blue-50' : activeTheme.hero.includes('amber') ? 'bg-amber-950' : activeTheme.hero.includes('emerald') ? 'bg-emerald-50' : activeTheme.hero.includes('rose') ? 'bg-rose-50' : 'bg-indigo-50'}`} title="Hero" />
              </div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      {/* ── Tomás Integration Info ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-gray-700 bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          Integração com Tomás
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          O Tomás adapta automaticamente seu tom de voz conforme o tema escolhido pelo parceiro.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ALL_THEMES.map(theme => (
            <div key={theme.key} className="rounded-lg bg-gray-800 p-3 border border-gray-700">
              <p className="text-xs font-semibold text-white mb-1">{theme.name}</p>
              <p className="text-[11px] text-gray-500 capitalize">Tom: {theme.tomasTone}</p>
              <p className="text-[11px] text-gray-500 mt-1">Foco: {theme.tomasFocus.split(',')[0]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
