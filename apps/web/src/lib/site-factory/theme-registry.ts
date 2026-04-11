/**
 * Site Factory — Theme Registry
 *
 * Defines all available themes for tenant sites.
 * Each theme includes visual config, Tailwind classes, Tomás tone, and metadata.
 */

export type ThemeKey = 'luxury_gold' | 'urban_tech' | 'landscape_living' | 'classic_trust' | 'fast_sales_pro'

export interface ThemeConfig {
  key: ThemeKey
  name: string
  tagline: string
  description: string
  idealFor: string
  // Visual
  bg: string
  text: string
  textMuted: string
  accent: string
  accentHex: string
  card: string
  cardHover: string
  hero: string
  headerBg: string
  footerBg: string
  buttonPrimary: string
  buttonSecondary: string
  fontHeading: string
  fontBody: string
  // Tomás tone
  tomasTone: 'formal' | 'agil' | 'acolhedor' | 'consultivo' | 'direto'
  tomasGreeting: string
  tomasFocus: string
}

export const THEME_REGISTRY: Record<ThemeKey, ThemeConfig> = {
  luxury_gold: {
    key: 'luxury_gold',
    name: 'Luxury Gold',
    tagline: 'Exclusividade & Patrimônio',
    description: 'Visual dark premium com tipografia elegante. Foco em alto padrão, patrimônio e leilões exclusivos.',
    idealFor: 'Imobiliárias de alto padrão, leilões VIP, condomínios fechados',
    bg: 'bg-gray-950',
    text: 'text-white',
    textMuted: 'text-gray-400',
    accent: 'text-amber-400',
    accentHex: '#fbbf24',
    card: 'bg-gray-900/80 border-amber-500/20 backdrop-blur-sm',
    cardHover: 'hover:border-amber-400/40 hover:shadow-amber-500/10',
    hero: 'bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/20',
    headerBg: 'bg-gray-950/95 backdrop-blur-xl border-b border-amber-500/10',
    footerBg: 'bg-gray-950 border-t border-amber-500/10',
    buttonPrimary: 'bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-semibold hover:from-amber-400 hover:to-amber-500',
    buttonSecondary: 'border border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
    fontHeading: 'font-serif',
    fontBody: 'font-sans',
    tomasTone: 'formal',
    tomasGreeting: 'Boa tarde. Sou Tomás, consultor sênior de investimentos imobiliários. Em que posso auxiliá-lo hoje?',
    tomasFocus: 'Investimento, patrimônio, rentabilidade, leilões exclusivos, oportunidades com alto desconto',
  },

  urban_tech: {
    key: 'urban_tech',
    name: 'Urban Tech',
    tagline: 'Tecnologia & Agilidade',
    description: 'Visual clean e moderno. Busca inteligente, UX fluida, foco em performance e conversão.',
    idealFor: 'Corretores autônomos, imobiliárias dinâmicas, volume de leads',
    bg: 'bg-white',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    accent: 'text-blue-600',
    accentHex: '#2563eb',
    card: 'bg-white border-gray-200 shadow-sm rounded-xl',
    cardHover: 'hover:shadow-md hover:border-blue-200',
    hero: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
    headerBg: 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm',
    footerBg: 'bg-gray-50 border-t border-gray-100',
    buttonPrimary: 'bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl',
    buttonSecondary: 'border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl',
    fontHeading: 'font-sans',
    fontBody: 'font-sans',
    tomasTone: 'agil',
    tomasGreeting: 'Oi! Sou o Tomás. Me diz o que você está buscando que eu localizo em segundos.',
    tomasFocus: 'Rapidez, opções, filtros inteligentes, oportunidades de mercado, financiamento facilitado',
  },

  landscape_living: {
    key: 'landscape_living',
    name: 'Landscape & Living',
    tagline: 'Natureza & Estilo de Vida',
    description: 'Cores orgânicas e imagens amplas. Foco em loteamentos, áreas rurais, lazer e expansão urbana.',
    idealFor: 'Loteadoras, corretores rurais, chácaras e sítios',
    bg: 'bg-stone-50',
    text: 'text-stone-900',
    textMuted: 'text-stone-500',
    accent: 'text-emerald-700',
    accentHex: '#047857',
    card: 'bg-white border-stone-200 shadow-sm rounded-2xl',
    cardHover: 'hover:shadow-lg hover:border-emerald-200',
    hero: 'bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50',
    headerBg: 'bg-stone-50/95 backdrop-blur-xl border-b border-stone-200',
    footerBg: 'bg-stone-100 border-t border-stone-200',
    buttonPrimary: 'bg-emerald-700 text-white font-medium hover:bg-emerald-800 rounded-xl',
    buttonSecondary: 'border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl',
    fontHeading: 'font-sans',
    fontBody: 'font-sans',
    tomasTone: 'acolhedor',
    tomasGreeting: 'Olá! Sou o Tomás. Está buscando um lugar especial para viver ou investir? Me conta o que você imagina.',
    tomasFocus: 'Qualidade de vida, natureza, valorização territorial, loteamentos, investimento rural',
  },

  classic_trust: {
    key: 'classic_trust',
    name: 'Classic Trust',
    tagline: 'Tradição & Confiança',
    description: 'Visual institucional e sóbrio. Transmite credibilidade, experiência e solidez.',
    idealFor: 'Imobiliárias tradicionais, empresas com CRECI, foco institucional',
    bg: 'bg-white',
    text: 'text-gray-800',
    textMuted: 'text-gray-500',
    accent: 'text-indigo-700',
    accentHex: '#4338ca',
    card: 'bg-white border-gray-200 shadow-sm',
    cardHover: 'hover:shadow-md hover:border-indigo-200',
    hero: 'bg-gradient-to-br from-indigo-50 via-slate-50 to-gray-50',
    headerBg: 'bg-white border-b border-gray-200',
    footerBg: 'bg-gray-900 text-white',
    buttonPrimary: 'bg-indigo-700 text-white font-medium hover:bg-indigo-800',
    buttonSecondary: 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50',
    fontHeading: 'font-sans',
    fontBody: 'font-sans',
    tomasTone: 'consultivo',
    tomasGreeting: 'Olá, sou o Tomás da equipe. Posso ajudar com a busca de imóveis, documentação ou esclarecer qualquer dúvida sobre o mercado.',
    tomasFocus: 'Consultoria, documentação, financiamento, segurança jurídica, histórico do mercado',
  },

  fast_sales_pro: {
    key: 'fast_sales_pro',
    name: 'Fast Sales Pro',
    tagline: 'Conversão Máxima',
    description: 'Visual arrojado e orientado à conversão. CTAs destacados, urgência visual, gatilhos de venda.',
    idealFor: 'Corretores de alta performance, lançamentos, promoções',
    bg: 'bg-gray-50',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    accent: 'text-rose-600',
    accentHex: '#e11d48',
    card: 'bg-white border-gray-200 shadow-md rounded-xl',
    cardHover: 'hover:shadow-xl hover:border-rose-200 hover:-translate-y-0.5 transition-all',
    hero: 'bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50',
    headerBg: 'bg-white/95 backdrop-blur-xl border-b border-gray-100',
    footerBg: 'bg-gray-900 text-white',
    buttonPrimary: 'bg-gradient-to-r from-rose-600 to-orange-500 text-white font-bold hover:from-rose-500 hover:to-orange-400 rounded-xl shadow-lg shadow-rose-500/20',
    buttonSecondary: 'border-2 border-rose-500 text-rose-600 font-semibold hover:bg-rose-50 rounded-xl',
    fontHeading: 'font-sans',
    fontBody: 'font-sans',
    tomasTone: 'direto',
    tomasGreeting: 'E aí! Sou o Tomás. Temos oportunidades saindo agora — me diz o que você procura que eu já separo.',
    tomasFocus: 'Oportunidades, urgência, desconto, lançamento, condição especial, tempo limitado',
  },
}

// Map old layout types to new theme keys
export const LAYOUT_TO_THEME: Record<string, ThemeKey> = {
  luxury: 'luxury_gold',
  clean: 'urban_tech',
  social: 'fast_sales_pro',
  marketplace: 'landscape_living',
  // Direct matches
  luxury_gold: 'luxury_gold',
  urban_tech: 'urban_tech',
  landscape_living: 'landscape_living',
  classic_trust: 'classic_trust',
  fast_sales_pro: 'fast_sales_pro',
}

export function resolveTheme(layoutType: string): ThemeConfig {
  const key = LAYOUT_TO_THEME[layoutType] || 'urban_tech'
  return THEME_REGISTRY[key]
}

export const ALL_THEMES = Object.values(THEME_REGISTRY)
