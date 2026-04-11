/**
 * Preview Branding Service — Geração de branding temporário para previews
 *
 * Gera: nome, slogan, tema, cores para demonstração comercial.
 * Segmento-aware: corretor, imobiliária, loteadora, construtora.
 */

export interface PreviewBranding {
  companyName: string
  slogan: string
  theme: PreviewTheme
  segment: string
  tone: string
}

export interface PreviewTheme {
  key: string
  name: string
  primaryColor: string
  secondaryColor: string
  style: string
}

const THEMES: Record<string, PreviewTheme> = {
  urban_tech: {
    key: 'urban_tech',
    name: 'Urban Tech',
    primaryColor: '#d4a853',
    secondaryColor: '#1a1a2e',
    style: 'Moderno e tecnológico',
  },
  luxury_gold: {
    key: 'luxury_gold',
    name: 'Luxury Gold',
    primaryColor: '#c9a84c',
    secondaryColor: '#0d0d0d',
    style: 'Luxuoso e elegante',
  },
  clean: {
    key: 'clean',
    name: 'Clean',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e3a5f',
    style: 'Limpo e profissional',
  },
  social: {
    key: 'social',
    name: 'Social',
    primaryColor: '#8b5cf6',
    secondaryColor: '#312e81',
    style: 'Social e conectado',
  },
  marketplace: {
    key: 'marketplace',
    name: 'Marketplace',
    primaryColor: '#10b981',
    secondaryColor: '#064e3b',
    style: 'Portal de imóveis',
  },
}

const SLOGANS: Record<string, string[]> = {
  corretor: [
    '{name} — Seu portal imobiliário inteligente',
    '{name} — Tecnologia que vende por você',
    '{name} — Seu escritório digital 24h',
    '{name} — Imóveis com inteligência artificial',
  ],
  imobiliaria: [
    '{name} — Tecnologia que gera clientes todos os dias',
    '{name} — Referência digital em imóveis',
    '{name} ��� O futuro da sua imobiliária é agora',
    '{name} — Plataforma imobiliária de alta performance',
  ],
  loteadora: [
    '{name} — Apresente seu empreendimento com padrão de gigante',
    '{name} — Lotes vendidos com tecnologia de ponta',
    '{name} — Seu empreendimento merece essa vitrine',
    '{name} — A tecnologia que acelera suas vendas',
  ],
  construtora: [
    '{name} — Seu ativo digital vendendo 24h por dia',
    '{name} — Cada empreendimento, uma experiência premium',
    '{name} — Venda imóveis enquanto constrói o futuro',
    '{name} — Tecnologia para construir resultados',
  ],
}

const SEGMENT_DEFAULTS: Record<string, { theme: string; tone: string }> = {
  corretor: { theme: 'urban_tech', tone: 'profissional' },
  imobiliaria: { theme: 'clean', tone: 'institucional' },
  loteadora: { theme: 'luxury_gold', tone: 'premium' },
  construtora: { theme: 'luxury_gold', tone: 'sofisticado' },
}

/**
 * Generate preview branding based on input parameters.
 */
export function generateBranding(input: {
  companyName: string
  theme?: string
  segment?: string
  tone?: string
}): PreviewBranding {
  const segment = input.segment || 'corretor'
  const defaults = SEGMENT_DEFAULTS[segment] || SEGMENT_DEFAULTS.corretor
  const themeKey = input.theme && THEMES[input.theme] ? input.theme : defaults.theme
  const theme = THEMES[themeKey]
  const tone = input.tone || defaults.tone

  const segmentSlogans = SLOGANS[segment] || SLOGANS.corretor
  const sloganTemplate = segmentSlogans[Math.floor(Math.random() * segmentSlogans.length)]
  const slogan = sloganTemplate.replace('{name}', input.companyName)

  return {
    companyName: input.companyName,
    slogan,
    theme,
    segment,
    tone,
  }
}

export function getAvailableThemes(): PreviewTheme[] {
  return Object.values(THEMES)
}

export function resolveTheme(key?: string): PreviewTheme {
  return (key && THEMES[key]) ? THEMES[key] : THEMES.urban_tech
}
