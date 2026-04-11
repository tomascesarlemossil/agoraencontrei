/**
 * Site Factory — Plan Registry
 *
 * Defines available plans and which modules each plan unlocks.
 */

export type PlanKey = 'LITE' | 'PRO' | 'ENTERPRISE'

export type ModuleKey =
  | 'site_basico'
  | 'tomas_concierge'
  | 'tour_virtual'
  | 'proposta_online'
  | 'visita_video'
  | 'seo_programatico'
  | 'mapa_interativo'
  | 'whatsapp_inteligente'
  | 'roi_calculator'
  | 'blog'
  | 'crm_basico'
  | 'analytics'
  | 'dominio_customizado'
  | 'white_label'

export interface PlanConfig {
  key: PlanKey
  name: string
  tagline: string
  price: string
  priceValue: number
  features: string[]
  modules: ModuleKey[]
  themes: string[] // 'all' or specific theme keys
  highlighted: boolean
}

export const PLAN_REGISTRY: Record<PlanKey, PlanConfig> = {
  LITE: {
    key: 'LITE',
    name: 'Simples',
    tagline: 'Presença digital profissional',
    price: 'R$ 97/mês',
    priceValue: 97,
    features: [
      'Site profissional no ar em 24h',
      'Até 50 imóveis publicados',
      'Subdomínio .agoraencontrei.com.br',
      'WhatsApp direto',
      'SSL e segurança básica',
    ],
    modules: ['site_basico', 'whatsapp_inteligente'],
    themes: ['urban_tech', 'classic_trust'],
    highlighted: false,
  },

  PRO: {
    key: 'PRO',
    name: 'Premium',
    tagline: 'IA + Leads + SEO integrado',
    price: 'R$ 297/mês',
    priceValue: 297,
    features: [
      'Tudo do Simples +',
      'Tomás Concierge (IA)',
      'Tour virtual',
      'Proposta online',
      'SEO programático',
      'Mapa interativo',
      'Blog integrado',
      'CRM básico',
      'Analytics',
      'Até 500 imóveis',
    ],
    modules: [
      'site_basico', 'tomas_concierge', 'tour_virtual',
      'proposta_online', 'seo_programatico', 'mapa_interativo',
      'whatsapp_inteligente', 'blog', 'crm_basico', 'analytics',
    ],
    themes: ['urban_tech', 'classic_trust', 'fast_sales_pro', 'luxury_gold'],
    highlighted: true,
  },

  ENTERPRISE: {
    key: 'ENTERPRISE',
    name: 'Super Premium',
    tagline: 'Plataforma completa para dominar sua região',
    price: 'R$ 597/mês',
    priceValue: 597,
    features: [
      'Tudo do Premium +',
      'Domínio próprio',
      'White-label (remove "Powered by")',
      'Visita por vídeo',
      'ROI Calculator',
      'Imóveis ilimitados',
      'Todos os 5 temas',
      'Suporte prioritário',
    ],
    modules: [
      'site_basico', 'tomas_concierge', 'tour_virtual',
      'proposta_online', 'visita_video', 'seo_programatico',
      'mapa_interativo', 'whatsapp_inteligente', 'roi_calculator',
      'blog', 'crm_basico', 'analytics', 'dominio_customizado', 'white_label',
    ],
    themes: ['all'],
    highlighted: false,
  },
}

export const ALL_PLANS = Object.values(PLAN_REGISTRY)

export function canUseTema(plan: PlanKey, theme: string): boolean {
  const config = PLAN_REGISTRY[plan]
  if (!config) return false
  return config.themes.includes('all') || config.themes.includes(theme)
}

export function hasModule(plan: PlanKey, module: ModuleKey): boolean {
  const config = PLAN_REGISTRY[plan]
  if (!config) return false
  return config.modules.includes(module)
}
