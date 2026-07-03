// ── Site Settings (site público principal) ───────────────────────────────────
// Helper compartilhado para consumir /api/v1/public/site-settings — a mesma
// configuração que o admin salva em Configurações Gerais. Antes o logo e as
// cores do site principal eram hardcoded e ignoravam esta config; este módulo
// centraliza o consumo com fallback seguro para os valores atuais.

import { getThemeById } from '@/app/(public)/themes/site-themes'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Valores hardcoded ATUAIS do site principal — usados como fallback final para
// nunca deixar o site sem logo/cor caso a config venha vazia.
export const DEFAULT_LOGO_URL = '/brand/ae-icon-round.png'
export const DEFAULT_FOOTER_LOGO_URL = '/brand/ae-icon-round.png'
export const DEFAULT_WORDMARK_URL = '/brand/ae-wordmark.png'
export const DEFAULT_PRIMARY_COLOR = '#143A1F'
export const DEFAULT_ACCENT_COLOR = '#C9A84C'

// A API devolve `primaryColor`/`designPrimaryColor` com um default legado navy
// (#1B2B5B) que antecede o rebrand verde. Como não existe input de admin que
// grave esse campo (o admin edita `design.primaryColor`), tratamos esse valor
// como "não configurado" e caímos no tema/fallback verde — evitando regressão.
const STALE_PRIMARY_DEFAULT = '#1b2b5b'

export interface SiteSettings {
  logoUrl?: string | null
  logoIconUrl?: string | null
  logoWordmarkUrl?: string | null
  logoVisible?: boolean | null
  logoShowText?: boolean | null
  logoPosition?: string | null
  companyName?: string | null
  companyPhone?: string | null
  companyEmail?: string | null
  companyAddress?: string | null
  companyCity?: string | null
  companyState?: string | null
  companyCnpj?: string | null
  companyWebsite?: string | null
  // Tema + cores
  siteTheme?: string | null
  primaryColor?: string | null
  accentColor?: string | null
  designPrimaryColor?: string | null
  designAccentColor?: string | null
  // Contato
  whatsappNumber?: string | null
  whatsappMessage?: string | null
  phoneFixed?: string | null
  phoneMobile?: string | null
  // Redes sociais
  instagramUrl?: string | null
  instagramUrlTomas?: string | null
  facebookUrl?: string | null
  youtubeUrl?: string | null
  // Textos
  heroTitle?: string | null
  heroTitleHighlight?: string | null
  footerTagline?: string | null
  // Demais campos passam direto
  [key: string]: unknown
}

/**
 * Busca a configuração pública do site (server-side, ISR 60s). Nunca lança:
 * em qualquer erro devolve {} para que os fallbacks hardcoded entrem em ação.
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/site-settings`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return {}
    const data = await res.json()
    return (data && typeof data === 'object') ? data : {}
  } catch {
    return {}
  }
}

function isMeaningfulColor(v?: string | null): v is string {
  return !!v && typeof v === 'string' && v.trim() !== '' && v.trim().toLowerCase() !== STALE_PRIMARY_DEFAULT
}

/**
 * Resolve as cores do site a partir da config, com prioridade:
 *   1. cor de design editada pelo admin (design.primaryColor / accentColor)
 *   2. cor do siteConfig (legado)
 *   3. cor do tema visual selecionado (siteTheme)
 *   4. fallback hardcoded atual (verde/dourado)
 */
export function resolveSiteColors(s: SiteSettings | null | undefined): { primary: string; accent: string } {
  const settings = s ?? {}
  const theme = getThemeById((settings.siteTheme as string) || 'classic-blue')

  const primaryCandidate =
    [settings.designPrimaryColor, settings.primaryColor].find(isMeaningfulColor)
  const accentCandidate =
    [settings.designAccentColor, settings.accentColor].find(isMeaningfulColor)

  return {
    primary: primaryCandidate || theme.colors.primary || DEFAULT_PRIMARY_COLOR,
    accent: accentCandidate || theme.colors.accent || DEFAULT_ACCENT_COLOR,
  }
}

/**
 * Resolve logo (ícone + marca escrita) + nome da empresa com fallback para
 * os valores atuais do site. Cobre a configurabilidade completa do logo no
 * admin: ícone customizado, imagem da marca escrita (wordmark), ocultar o
 * logo inteiro, ocultar só a marca escrita, e posição no cabeçalho.
 */
export function resolveSiteBrand(
  s: SiteSettings | null | undefined,
  fallbackLogo: string = DEFAULT_LOGO_URL,
): {
  logoUrl: string
  wordmarkUrl: string | null
  companyName: string | null
  hasCustomLogo: boolean
  hasCustomWordmark: boolean
  visible: boolean
  showText: boolean
  position: 'left' | 'center'
} {
  const settings = s ?? {}
  // Prioridade do ícone: logoIconUrl (campo dedicado) > logoUrl (legado) > fallback.
  const iconCandidate =
    [settings.logoIconUrl, settings.logoUrl].find(v => typeof v === 'string' && v.trim() !== '')
  const custom = typeof iconCandidate === 'string'
  const wordmarkCandidate = typeof settings.logoWordmarkUrl === 'string' && settings.logoWordmarkUrl.trim() !== ''
    ? settings.logoWordmarkUrl.trim()
    : null
  const name = typeof settings.companyName === 'string' && settings.companyName.trim() !== ''
    ? settings.companyName.trim()
    : null
  return {
    logoUrl: custom ? (iconCandidate as string).trim() : fallbackLogo,
    wordmarkUrl: wordmarkCandidate,
    companyName: name,
    hasCustomLogo: custom,
    hasCustomWordmark: !!wordmarkCandidate,
    visible: settings.logoVisible !== false,
    showText: settings.logoShowText !== false,
    position: settings.logoPosition === 'center' ? 'center' : 'left',
  }
}
