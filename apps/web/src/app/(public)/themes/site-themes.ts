// ── Definição de Temas do Site Público ───────────────────────────────────────
// Cada tema define cores, tipografia, estilos e textos padrão.
// O tema ativo é selecionado via Configurações Gerais → Site → Tema Visual.

export interface SiteTheme {
  id: string
  name: string
  description: string
  preview: string          // cor principal para preview no painel
  previewGradient: string  // gradiente para card de preview

  // Cores
  colors: {
    primary: string        // cor principal (fundo hero, sidebar, etc.)
    secondary: string      // cor secundária (fundo seções)
    accent: string         // destaque (botões, links, badges)
    accentHover: string
    text: string           // texto principal
    textMuted: string      // texto secundário
    background: string     // fundo geral da página
    cardBg: string         // fundo dos cards
    cardBorder: string     // borda dos cards
    navBg: string          // fundo da navbar
    footerBg: string       // fundo do footer
    footerText: string
    wave: string           // cor da onda separadora
    badge: string          // fundo do badge hero
    badgeText: string
    badgeBorder: string
    statValue: string      // cor dos números de estatísticas
    sectionTitle: string
    buttonBg: string
    buttonText: string
    buttonBorder: string
  }

  // Tipografia
  typography: {
    heroFont: string       // fonte do título hero
    bodyFont: string       // fonte geral
    heroSize: string       // tamanho do h1 hero (tailwind)
    heroWeight: string
    sectionTitleSize: string
    sectionTitleWeight: string
  }

  // Layout
  layout: {
    heroMinHeight: string  // min-h do hero
    heroAlign: string      // 'center' | 'left'
    cardRadius: string     // border-radius dos cards
    cardShadow: string
    sectionPadding: string
    containerMax: string
    showWave: boolean
    showBadge: boolean
    showStats: boolean
    showCategories: boolean
    showTrustBadges: boolean
    heroOverlay: string    // overlay sobre vídeo/imagem
  }

  // Textos padrão (sobrescrevíveis via configurações)
  defaults: {
    heroBadge: string
    heroTitle: string
    heroTitleHighlight: string
    heroSubtitle: string
    featuredTitle: string
    featuredSubtitle: string
    trustTitle: string
    ctaTitle: string
    ctaSubtitle: string
    ctaButton: string
  }
}

// ── TEMA 1: Clássico Azul (padrão atual) ─────────────────────────────────────
export const themeClassicBlue: SiteTheme = {
  id: 'classic-blue',
  name: 'Clássico Azul',
  description: 'Elegante e tradicional. Azul marinho com detalhes dourados. Transmite confiança e solidez.',
  preview: '#1B2B5B',
  previewGradient: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 50%, #C9A84C 100%)',
  colors: {
    primary: '#1B2B5B',
    secondary: '#f8f6f1',
    accent: '#C9A84C',
    accentHover: '#e8c66a',
    text: '#1B2B5B',
    textMuted: '#6b7280',
    background: '#f8f6f1',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    navBg: '#1B2B5B',
    footerBg: '#1B2B5B',
    footerText: 'rgba(255,255,255,0.6)',
    wave: '#f8f6f1',
    badge: 'rgba(201,168,76,0.15)',
    badgeText: '#C9A84C',
    badgeBorder: 'rgba(201,168,76,0.3)',
    statValue: '#C9A84C',
    sectionTitle: '#1B2B5B',
    buttonBg: '#C9A84C',
    buttonText: '#1B2B5B',
    buttonBorder: 'transparent',
  },
  typography: {
    heroFont: 'Georgia, serif',
    bodyFont: 'Inter, sans-serif',
    heroSize: 'text-4xl sm:text-5xl lg:text-6xl',
    heroWeight: 'font-bold',
    sectionTitleSize: 'text-2xl',
    sectionTitleWeight: 'font-bold',
  },
  layout: {
    heroMinHeight: 'min-h-[85vh]',
    heroAlign: 'center',
    cardRadius: 'rounded-2xl',
    cardShadow: 'shadow-sm hover:shadow-md',
    sectionPadding: 'py-16',
    containerMax: 'max-w-7xl',
    showWave: true,
    showBadge: true,
    showStats: true,
    showCategories: true,
    showTrustBadges: true,
    heroOverlay: 'rgba(27,43,91,0.7)',
  },
  defaults: {
    heroBadge: 'Mais de 20 anos de tradição em Franca/SP',
    heroTitle: 'Encontre o imóvel',
    heroTitleHighlight: 'dos seus sonhos',
    heroSubtitle: 'Compra, venda e locação de imóveis em Franca e região',
    featuredTitle: 'Imóveis em Destaque',
    featuredSubtitle: 'Recém cadastrados — os mais novos do portfólio',
    trustTitle: 'Por que escolher a Imobiliária Lemos?',
    ctaTitle: 'Pronto para encontrar seu imóvel?',
    ctaSubtitle: 'Fale com nossos especialistas e encontre a melhor opção para você',
    ctaButton: 'Falar com um corretor',
  },
}

// ── TEMA 2: Luxo Escuro ───────────────────────────────────────────────────────
export const themeLuxuryDark: SiteTheme = {
  id: 'luxury-dark',
  name: 'Luxo Escuro',
  description: 'Sofisticado e premium. Fundo preto com detalhes dourados. Para um posicionamento de alto padrão.',
  preview: '#0a0a0a',
  previewGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #B8860B 100%)',
  colors: {
    primary: '#0a0a0a',
    secondary: '#111111',
    accent: '#D4AF37',
    accentHover: '#F0C040',
    text: '#f5f5f0',
    textMuted: 'rgba(245,245,240,0.5)',
    background: '#0f0f0f',
    cardBg: '#1a1a1a',
    cardBorder: 'rgba(212,175,55,0.2)',
    navBg: 'rgba(10,10,10,0.95)',
    footerBg: '#050505',
    footerText: 'rgba(245,245,240,0.4)',
    wave: '#0f0f0f',
    badge: 'rgba(212,175,55,0.1)',
    badgeText: '#D4AF37',
    badgeBorder: 'rgba(212,175,55,0.3)',
    statValue: '#D4AF37',
    sectionTitle: '#f5f5f0',
    buttonBg: '#D4AF37',
    buttonText: '#0a0a0a',
    buttonBorder: 'transparent',
  },
  typography: {
    heroFont: '"Playfair Display", Georgia, serif',
    bodyFont: 'Inter, sans-serif',
    heroSize: 'text-4xl sm:text-5xl lg:text-7xl',
    heroWeight: 'font-bold',
    sectionTitleSize: 'text-3xl',
    sectionTitleWeight: 'font-bold',
  },
  layout: {
    heroMinHeight: 'min-h-screen',
    heroAlign: 'center',
    cardRadius: 'rounded-xl',
    cardShadow: 'shadow-lg hover:shadow-2xl',
    sectionPadding: 'py-20',
    containerMax: 'max-w-7xl',
    showWave: false,
    showBadge: true,
    showStats: true,
    showCategories: true,
    showTrustBadges: true,
    heroOverlay: 'rgba(0,0,0,0.75)',
  },
  defaults: {
    heroBadge: 'Experiência & Exclusividade',
    heroTitle: 'Imóveis de',
    heroTitleHighlight: 'alto padrão',
    heroSubtitle: 'Curadoria exclusiva dos melhores imóveis de Franca e região',
    featuredTitle: 'Portfólio Exclusivo',
    featuredSubtitle: 'Selecionados com critério para os mais exigentes',
    trustTitle: 'Excelência em cada detalhe',
    ctaTitle: 'Seu próximo imóvel está aqui',
    ctaSubtitle: 'Atendimento personalizado e discreto para clientes especiais',
    ctaButton: 'Agendar consultoria',
  },
}

// ── TEMA 3: Minimalista Branco ────────────────────────────────────────────────
export const themeMinimalWhite: SiteTheme = {
  id: 'minimal-white',
  name: 'Minimalista Branco',
  description: 'Clean e moderno. Fundo branco, tipografia forte, espaçamento generoso. Foco total no conteúdo.',
  preview: '#ffffff',
  previewGradient: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 50%, #2563EB 100%)',
  colors: {
    primary: '#111827',
    secondary: '#f9fafb',
    accent: '#2563EB',
    accentHover: '#1d4ed8',
    text: '#111827',
    textMuted: '#6b7280',
    background: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    navBg: '#ffffff',
    footerBg: '#111827',
    footerText: 'rgba(255,255,255,0.6)',
    wave: '#ffffff',
    badge: 'rgba(37,99,235,0.08)',
    badgeText: '#2563EB',
    badgeBorder: 'rgba(37,99,235,0.2)',
    statValue: '#2563EB',
    sectionTitle: '#111827',
    buttonBg: '#111827',
    buttonText: '#ffffff',
    buttonBorder: 'transparent',
  },
  typography: {
    heroFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    heroSize: 'text-4xl sm:text-6xl lg:text-7xl',
    heroWeight: 'font-black',
    sectionTitleSize: 'text-3xl',
    sectionTitleWeight: 'font-bold',
  },
  layout: {
    heroMinHeight: 'min-h-[90vh]',
    heroAlign: 'left',
    cardRadius: 'rounded-2xl',
    cardShadow: 'shadow-none hover:shadow-lg border',
    sectionPadding: 'py-20',
    containerMax: 'max-w-7xl',
    showWave: false,
    showBadge: true,
    showStats: true,
    showCategories: true,
    showTrustBadges: true,
    heroOverlay: 'rgba(0,0,0,0.45)',
  },
  defaults: {
    heroBadge: 'Imobiliária de confiança desde 2002',
    heroTitle: 'O imóvel certo',
    heroTitleHighlight: 'para você.',
    heroSubtitle: 'Compra, venda e locação. Simples assim.',
    featuredTitle: 'Em destaque',
    featuredSubtitle: 'Os imóveis mais recentes do nosso portfólio',
    trustTitle: 'Por que somos diferentes',
    ctaTitle: 'Vamos conversar?',
    ctaSubtitle: 'Nossos corretores estão prontos para te ajudar',
    ctaButton: 'Entrar em contato',
  },
}

// ── TEMA 4: Verde Natureza ────────────────────────────────────────────────────
export const themeNatureGreen: SiteTheme = {
  id: 'nature-green',
  name: 'Verde Natureza',
  description: 'Tranquilo e acolhedor. Tons de verde e esmeralda. Ideal para imóveis residenciais e de campo.',
  preview: '#064E3B',
  previewGradient: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #6EE7B7 100%)',
  colors: {
    primary: '#064E3B',
    secondary: '#F0FDF4',
    accent: '#10B981',
    accentHover: '#059669',
    text: '#064E3B',
    textMuted: '#6b7280',
    background: '#F0FDF4',
    cardBg: '#ffffff',
    cardBorder: '#D1FAE5',
    navBg: '#064E3B',
    footerBg: '#022c22',
    footerText: 'rgba(255,255,255,0.6)',
    wave: '#F0FDF4',
    badge: 'rgba(16,185,129,0.1)',
    badgeText: '#059669',
    badgeBorder: 'rgba(16,185,129,0.3)',
    statValue: '#10B981',
    sectionTitle: '#064E3B',
    buttonBg: '#10B981',
    buttonText: '#ffffff',
    buttonBorder: 'transparent',
  },
  typography: {
    heroFont: 'Georgia, serif',
    bodyFont: 'Inter, sans-serif',
    heroSize: 'text-4xl sm:text-5xl lg:text-6xl',
    heroWeight: 'font-bold',
    sectionTitleSize: 'text-2xl',
    sectionTitleWeight: 'font-bold',
  },
  layout: {
    heroMinHeight: 'min-h-[85vh]',
    heroAlign: 'center',
    cardRadius: 'rounded-3xl',
    cardShadow: 'shadow-sm hover:shadow-lg',
    sectionPadding: 'py-16',
    containerMax: 'max-w-7xl',
    showWave: true,
    showBadge: true,
    showStats: true,
    showCategories: true,
    showTrustBadges: true,
    heroOverlay: 'rgba(6,78,59,0.65)',
  },
  defaults: {
    heroBadge: 'Seu lar, sua natureza',
    heroTitle: 'Viva bem,',
    heroTitleHighlight: 'viva com qualidade',
    heroSubtitle: 'Imóveis residenciais e de campo em Franca e região',
    featuredTitle: 'Imóveis Selecionados',
    featuredSubtitle: 'Qualidade de vida em cada endereço',
    trustTitle: 'Cuidamos do seu patrimônio',
    ctaTitle: 'Encontre seu espaço ideal',
    ctaSubtitle: 'Fale com nossa equipe e descubra as melhores opções',
    ctaButton: 'Quero conhecer imóveis',
  },
}

// ── TEMA 5: Coral Moderno ─────────────────────────────────────────────────────
export const themeModernCoral: SiteTheme = {
  id: 'modern-coral',
  name: 'Coral Moderno',
  description: 'Vibrante e contemporâneo. Gradientes coral/laranja, jovem e dinâmico. Destaca-se da concorrência.',
  preview: '#E11D48',
  previewGradient: 'linear-gradient(135deg, #E11D48 0%, #F97316 60%, #FBBF24 100%)',
  colors: {
    primary: '#1e1b4b',
    secondary: '#fff7f0',
    accent: '#F97316',
    accentHover: '#ea6c0a',
    text: '#1e1b4b',
    textMuted: '#6b7280',
    background: '#fff7f0',
    cardBg: '#ffffff',
    cardBorder: '#fed7aa',
    navBg: '#1e1b4b',
    footerBg: '#1e1b4b',
    footerText: 'rgba(255,255,255,0.6)',
    wave: '#fff7f0',
    badge: 'rgba(249,115,22,0.1)',
    badgeText: '#F97316',
    badgeBorder: 'rgba(249,115,22,0.3)',
    statValue: '#F97316',
    sectionTitle: '#1e1b4b',
    buttonBg: 'linear-gradient(135deg, #E11D48, #F97316)',
    buttonText: '#ffffff',
    buttonBorder: 'transparent',
  },
  typography: {
    heroFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    heroSize: 'text-4xl sm:text-5xl lg:text-6xl',
    heroWeight: 'font-extrabold',
    sectionTitleSize: 'text-2xl',
    sectionTitleWeight: 'font-extrabold',
  },
  layout: {
    heroMinHeight: 'min-h-[88vh]',
    heroAlign: 'center',
    cardRadius: 'rounded-2xl',
    cardShadow: 'shadow-md hover:shadow-xl',
    sectionPadding: 'py-16',
    containerMax: 'max-w-7xl',
    showWave: true,
    showBadge: true,
    showStats: true,
    showCategories: true,
    showTrustBadges: true,
    heroOverlay: 'rgba(30,27,75,0.6)',
  },
  defaults: {
    heroBadge: '🔥 Novos imóveis toda semana',
    heroTitle: 'Seu próximo lar',
    heroTitleHighlight: 'está aqui',
    heroSubtitle: 'Mais de 900 imóveis disponíveis. Encontre o seu agora!',
    featuredTitle: '🏠 Imóveis em Alta',
    featuredSubtitle: 'Os mais procurados desta semana',
    trustTitle: 'Por que a gente?',
    ctaTitle: '🚀 Pronto para mudar?',
    ctaSubtitle: 'Fale agora com um especialista e saia do aluguel hoje',
    ctaButton: '💬 Falar no WhatsApp',
  },
}

// ── TEMA 6: Grafite Premium ───────────────────────────────────────────────────
export const themeGrafitePremium: SiteTheme = {
  id: 'grafite-premium',
  name: 'Grafite Premium',
  description: 'Tecnológico e sofisticado. Cinza escuro com acentos em ciano/azul elétrico. Moderno e profissional.',
  preview: '#1f2937',
  previewGradient: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #06B6D4 100%)',
  colors: {
    primary: '#111827',
    secondary: '#1f2937',
    accent: '#06B6D4',
    accentHover: '#0891b2',
    text: '#f9fafb',
    textMuted: 'rgba(249,250,251,0.5)',
    background: '#1f2937',
    cardBg: '#374151',
    cardBorder: 'rgba(6,182,212,0.2)',
    navBg: '#111827',
    footerBg: '#030712',
    footerText: 'rgba(249,250,251,0.4)',
    wave: '#1f2937',
    badge: 'rgba(6,182,212,0.1)',
    badgeText: '#06B6D4',
    badgeBorder: 'rgba(6,182,212,0.3)',
    statValue: '#06B6D4',
    sectionTitle: '#f9fafb',
    buttonBg: '#06B6D4',
    buttonText: '#111827',
    buttonBorder: 'transparent',
  },
  typography: {
    heroFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    heroSize: 'text-4xl sm:text-5xl lg:text-6xl',
    heroWeight: 'font-bold',
    sectionTitleSize: 'text-2xl',
    sectionTitleWeight: 'font-bold',
  },
  layout: {
    heroMinHeight: 'min-h-[90vh]',
    heroAlign: 'center',
    cardRadius: 'rounded-xl',
    cardShadow: 'shadow-lg hover:shadow-cyan-500/20 hover:shadow-2xl',
    sectionPadding: 'py-16',
    containerMax: 'max-w-7xl',
    showWave: false,
    showBadge: true,
    showStats: true,
    showCategories: true,
    showTrustBadges: true,
    heroOverlay: 'rgba(17,24,39,0.7)',
  },
  defaults: {
    heroBadge: 'Tecnologia a serviço do seu imóvel',
    heroTitle: 'Encontre o imóvel',
    heroTitleHighlight: 'com inteligência',
    heroSubtitle: 'Busca avançada, avaliação em tempo real e atendimento digital',
    featuredTitle: 'Imóveis em Destaque',
    featuredSubtitle: 'Curadoria inteligente dos melhores do portfólio',
    trustTitle: 'Inovação no mercado imobiliário',
    ctaTitle: 'Tecnologia + Experiência',
    ctaSubtitle: 'A combinação perfeita para encontrar seu imóvel',
    ctaButton: 'Iniciar busca inteligente',
  },
}

// ── Registro de todos os temas ────────────────────────────────────────────────
// NOTA: 12 temas adicionais (Rose Gold, Midnight Purple, Ocean Breeze, etc.)
// serão adicionados em follow-up separado. Por enquanto só os 6 originais.
export const ALL_THEMES: SiteTheme[] = [
  themeClassicBlue,
  themeLuxuryDark,
  themeMinimalWhite,
  themeNatureGreen,
  themeModernCoral,
  themeGrafitePremium,
]

export const DEFAULT_THEME_ID = 'classic-blue'

export function getThemeById(id: string): SiteTheme {
  return ALL_THEMES.find(t => t.id === id) ?? themeClassicBlue
}
