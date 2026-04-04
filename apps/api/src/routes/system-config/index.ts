import type { FastifyInstance } from 'fastify'

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SYSTEM CONFIG — todas as configurações padrão do sistema
// Armazenado em Company.settings.systemConfig (JSON)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_SYSTEM_CONFIG = {

  // ── SEO & Google ────────────────────────────────────────────────────────────
  seo: {
    title:             'Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis',
    titleTemplate:     '%s | Imobiliária Lemos',
    description:       'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região. Compra, venda, locação e avaliação. CRECI 279051.',
    keywords:          ['imobiliária franca', 'imóveis franca sp', 'alugar casa franca', 'comprar apartamento franca', 'imobiliária lemos', 'locação franca', 'venda imóveis franca', 'CRECI 279051'],
    ogTitle:           'Imobiliária Lemos — Franca/SP',
    ogDescription:     'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região.',
    ogImage:           '/og-image.jpg',
    ogImageWidth:      1200,
    ogImageHeight:     630,
    twitterCard:       'summary_large_image',
    twitterTitle:      'Imobiliária Lemos — Franca/SP',
    twitterDescription:'Imóveis de qualidade em Franca e região. CRECI 279051.',
    canonical:         'https://www.agoraencontrei.com.br',
    robots:            'index, follow',
    schemaOrg:         true,
    googleAnalytics:   '',
    googleTagManager:  '',
    googleSiteVerify:  '',
    facebookPixel:     '',
    bingVerify:        '',
    hotjarId:          '',
    clarityId:         '',
    author:            'Imobiliária Lemos',
    publisher:         'Imobiliária Lemos',
    locale:            'pt_BR',
    siteName:          'Imobiliária Lemos',
    twitterSite:       '@imobiliarialemos',
    twitterCreator:    '@imobiliarialemos',
  },

  // ── Site Público ─────────────────────────────────────────────────────────────
  site: {
    // Tema visual
    siteTheme:         'classic-blue',

    // Hero
    heroVideoUrl:      '',
    heroVideoType:     'youtube',
    heroImageUrl:      '',
    heroBadge:         'Mais de 20 anos de tradição em Franca/SP',
    heroTitle:         'Encontre o imóvel',
    heroTitleHighlight:'dos seus sonhos',
    heroSubtitle:      'Compra, venda e locação de imóveis em Franca e região',

    // Seções de texto
    featuredTitle:     'Imóveis em Destaque',
    featuredSubtitle:  'Recém cadastrados — os mais novos do portfólio',
    trustTitle:        'Por que escolher a Imobiliária Lemos?',
    ctaTitle:          'Pronto para encontrar seu imóvel?',
    ctaSubtitle:       'Fale com nossos especialistas e encontre a melhor opção para você',
    ctaButton:         'Falar com um corretor',

    // Estatísticas do hero
    statYears:         '22+',
    statFamilies:      '5.000+',
    statYearsLabel:    'Anos de mercado',
    statFamiliesLabel: 'Famílias atendidas',

    // Contato
    whatsappNumber:    '5516981010004',
    whatsappMessage:   'Olá! Gostaria de saber mais sobre os imóveis.',
    phoneFixed:        '(16) 3723-0045',
    phoneMobile:       '(16) 98101-0004',
    phoneLabel:        'Vendas / Locação',

    // Redes sociais
    instagramUrl:      'https://www.instagram.com/imobiliarialemos',
    instagramUrlTomas: 'https://www.instagram.com/tomaslemosbr',
    facebookUrl:       'https://facebook.com/imobiliarialemos',
    youtubeUrl:        'https://www.youtube.com/@imobiliarialemos',
    linkedinUrl:       '',
    tiktokUrl:         '',
    pinterestUrl:      '',
    twitterUrl:        '',

    // Seções visíveis
    showHeroVideo:          true,
    showSearchBar:          true,
    showFeaturedProperties: true,
    showServicesSection:    true,
    showBlogSection:        true,
    showCorretoresSection:  true,
    showFinanciamentos:     true,
    showWhatsappButton:     true,
    showChatWidget:         true,
    showTrustBadges:        true,
    showStatsBar:           true,
    showSmartQuiz:          true,
    showAvaliacao:          true,
    showAnunciarSection:    true,
    showCookieBanner:       true,

    // Textos do footer
    footerTagline:     'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região.',
    footerFoundedYear: '2002',
    footerCopyright:   'Imobiliária Lemos. Todos os direitos reservados.',
    footerAddress:     'Franca — SP',

    // Manutenção
    maintenanceMode:    false,
    maintenanceMessage: 'Site em manutenção. Voltamos em breve.',

    // Customização avançada
    customCss:          '',
    customJs:           '',
    faviconUrl:         '',
    ogImageUrl:         '',
    cookieBannerText:   'Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa política de privacidade.',

    // Imóveis — configurações da listagem pública
    defaultSortBy:       'createdAt',
    defaultSortOrder:    'desc',
    propertiesPerPage:   12,
    showPriceOnCard:     true,
    showAreaOnCard:      true,
    showBedroomsOnCard:  true,
    showNeighborhoodOnCard: true,
    mapDefaultLat:       -20.5386,
    mapDefaultLng:       -47.4009,
    mapDefaultZoom:      13,
  },

  // ── Design / Tema do Dashboard ───────────────────────────────────────────────
  design: {
    dashboardTheme:    'dark',
    primaryColor:      '#1B2B5B',
    accentColor:       '#C9A84C',
    sidebarStyle:      'dark',
    fontFamily:        'Inter',
    borderRadius:      'rounded',
    compactMode:       false,
    showLogoInSidebar: true,
    showCompanyName:   true,
    animationsEnabled: true,
    tableStriped:      true,
    cardStyle:         'elevated',
  },

  // ── Módulos habilitados ──────────────────────────────────────────────────────
  modules: {
    lemosbank:       true,
    juridico:        true,
    fiscal:          true,
    financiamentos:  true,
    aiVisual:        true,
    blog:            true,
    marketing:       true,
    automations:     true,
    portals:         true,
    reports:         true,
    corretor:        true,
    documentos:      true,
    crm:             true,
    inbox:           true,
    renovacoes:      true,
    historico:       true,
  },

  // ── Permissões de módulos internos ───────────────────────────────────────────
  internalModuleAccess: {
    restrictedModules: ['lemosbank', 'juridico', 'fiscal', 'financiamentos'],
    allowedUsers:      ['tomas', 'nadia', 'naira', 'geraldo', 'noemia'],
  },

  // ── Sidebar — itens visíveis ─────────────────────────────────────────────────
  sidebar: {
    showImoveis:        true,
    showAIVisual:       true,
    showLeads:          true,
    showContatos:       true,
    showNegocios:       true,
    showChat:           true,
    showFinanciamentos: true,
    showPortais:        true,
    showAutomacoes:     true,
    showCampanhas:      true,
    showFiscal:         true,
    showRenovacoes:     true,
    showBlog:           true,
    showCorretor:       true,
    showDocumentos:     true,
    showLemosbank:      true,
    showJuridico:       true,
    showHistorico:      true,
    showRelatorios:     true,
  },

  // ── Dashboard — widgets visíveis ─────────────────────────────────────────────
  dashboard: {
    showRevenueCard:       true,
    showContractsCard:     true,
    showClientsCard:       true,
    showDefaultCard:       true,
    showUpcomingRentals:   true,
    showLateRentals:       true,
    showRecentActivity:    true,
    showQuickActions:      true,
    showAIAssistant:       true,
    showCalendarWidget:    true,
    showNotifications:     true,
    showLegalAlerts:       true,
    showFinancialSummary:  true,
    showPropertiesStats:   true,
    showLeadsStats:        true,
    cardsPerRow:           4,
    defaultDateRange:      '30d',
  },

  // ── Formulários — campos ─────────────────────────────────────────────────────
  forms: {
    client: {
      requiredFields: ['name'],
      showFields:     ['name', 'email', 'phone', 'cpf', 'rg', 'address', 'birthDate', 'nationality', 'maritalStatus', 'profession', 'income', 'notes'],
    },
    property: {
      requiredFields: ['title', 'type', 'purpose'],
      showFields:     ['title', 'type', 'purpose', 'price', 'priceRent', 'address', 'bedrooms', 'bathrooms', 'garages', 'totalArea', 'builtArea', 'description', 'features', 'images'],
    },
    contract: {
      requiredFields: ['tenantName', 'propertyAddress', 'rentValue'],
      showFields:     ['tenantName', 'propertyAddress', 'rentValue', 'dueDay', 'landlordDueDay', 'observations', 'guaranteeType', 'startDate', 'endDate', 'indexType'],
    },
    legalCase: {
      requiredFields: ['title', 'type'],
      showFields:     ['title', 'type', 'status', 'caseNumber', 'plaintiffName', 'defendantName', 'lawyerName', 'lawyerOab', 'lawyerPhone', 'lawyerEmail', 'court', 'courtSection', 'courtCity', 'openedAt', 'nextHearingAt', 'claimedValue', 'settledValue', 'courtCosts', 'observations', 'internalNotes', 'priority', 'tags'],
    },
    lead: {
      requiredFields: ['name', 'phone'],
      showFields:     ['name', 'email', 'phone', 'interest', 'budget', 'message', 'source', 'utmSource', 'utmMedium', 'utmCampaign'],
    },
  },

  // ── Financeiro ───────────────────────────────────────────────────────────────
  financial: {
    defaultDueDay:          5,
    landlordDefaultDueDay:  10,
    lateFeePercent:         2.0,
    interestPercentMonth:   1.0,
    currency:               'BRL',
    fiscalServicePercent:   8.0,
    showBalanceOnDashboard: true,
    autoGenerateBoletos:    false,
    indexType:              'IGPM',
    readjustmentMonth:      12,
    bankName:               '',
    bankAgency:             '',
    bankAccount:            '',
    bankPix:                '',
    asaasApiKey:            '',
    asaasMode:              'sandbox',
  },

  // ── Jurídico ─────────────────────────────────────────────────────────────────
  legal: {
    defaultCourt:              'TJSP',
    defaultCourtCity:          'Franca',
    defaultCourtSection:       '1ª Vara Cível',
    alertDaysBeforeHearing:    7,
    alertDaysBeforeDeadline:   3,
    showLegalOnDashboard:      true,
    autoLinkContractToCase:    true,
    defaultLawyerName:         '',
    defaultLawyerOab:          '',
    defaultLawyerPhone:        '',
    defaultLawyerEmail:        '',
    caseTypes:                 ['DESPEJO', 'COBRANCA', 'REVISIONAL', 'RESCISAO', 'DANO_MORAL', 'OUTROS'],
    caseStatuses:              ['ATIVO', 'SUSPENSO', 'ENCERRADO', 'ACORDO', 'GANHO', 'PERDIDO'],
  },

  // ── Notificações ─────────────────────────────────────────────────────────────
  notifications: {
    emailOnNewLead:         true,
    emailOnNewContract:     true,
    emailOnLateRental:      true,
    emailOnNewMessage:      true,
    emailOnLegalHearing:    true,
    emailOnContractExpiry:  true,
    pushNotifications:      true,
    dailySummaryEmail:      false,
    weeklyReportEmail:      false,
    notificationEmail:      '',
    smtpHost:               '',
    smtpPort:               587,
    smtpUser:               '',
    smtpPass:               '',
    smtpFrom:               '',
    smtpFromName:           'Imobiliária Lemos',
  },

  // ── Integrações ──────────────────────────────────────────────────────────────
  integrations: {
    // Instagram
    instagramTokenTomas:          '',
    instagramTokenLemos:          '',
    instagramBusinessAccountId:   '',
    instagramPageAccessToken:     '',
    // YouTube
    youtubeApiKey:                '',
    // Asaas (boletos)
    asaasApiKey:                  '',
    asaasMode:                    'sandbox',
    // Google
    googleMapsApiKey:             '',
    googleAnalyticsId:            '',
    googleTagManagerId:           '',
    googleSearchConsoleKey:       '',
    // Facebook
    facebookPixelId:              '',
    facebookAppId:                '',
    // OpenAI
    openaiApiKey:                 '',
    openaiModel:                  'gpt-4o-mini',
    // Supabase (documentos)
    supabaseUrl:                  '',
    supabaseAnonKey:              '',
    supabaseStorageBucket:        'documentos',
    // Portais de imóveis
    zapimovelToken:               '',
    vivaRealToken:                '',
    olxToken:                     '',
    chavesMaoToken:               '',
    // WhatsApp
    whatsappApiToken:             '',
    whatsappPhoneNumberId:        '',
    whatsappWebhookVerifyToken:   '',
    // SMTP
    smtpHost:                     '',
    smtpPort:                     587,
    smtpUser:                     '',
    smtpPass:                     '',
    smtpFrom:                     '',
    smtpFromName:                 'Imobiliária Lemos',
    // Hotjar / Clarity
    hotjarId:                     '',
    clarityId:                    '',
  },

  // ── Locação ──────────────────────────────────────────────────────────────────
  rental: {
    defaultIndexType:         'IGPM',
    defaultReadjustmentMonth: 12,
    defaultGuaranteeType:     'fiador',
    defaultContractDuration:  30,
    defaultDueDay:            5,
    defaultLandlordDueDay:    10,
    lateFeePercent:           2.0,
    interestPercentMonth:     1.0,
    generateBoletoAuto:       false,
    sendReminderDaysBefore:   5,
    showRentalOnDashboard:    true,
    contractTemplateHtml:     '',
    rescissionNoticedays:     30,
  },
}

export type SystemConfig = typeof DEFAULT_SYSTEM_CONFIG

// ─────────────────────────────────────────────────────────────────────────────
// ROTAS
// ─────────────────────────────────────────────────────────────────────────────
export default async function systemConfigRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/system-config — retorna configurações completas da empresa
  app.get('/', async (req, reply) => {
    const company = await app.prisma.company.findUnique({
      where:  { id: req.user.cid },
      select: { settings: true },
    })
    if (!company) return reply.status(404).send({ error: 'NOT_FOUND' })

    const stored = (company.settings as any)?.systemConfig ?? {}
    const config = deepMerge(DEFAULT_SYSTEM_CONFIG, stored)
    return reply.send({ config })
  })

  // PATCH /api/v1/system-config — atualiza qualquer seção (admin/manager)
  app.patch('/', async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Apenas administradores podem alterar configurações do sistema' })
    }

    const updates = req.body as Partial<SystemConfig>
    const company = await app.prisma.company.findUnique({
      where:  { id: req.user.cid },
      select: { settings: true },
    })
    if (!company) return reply.status(404).send({ error: 'NOT_FOUND' })

    const currentSettings = (company.settings as any) ?? {}
    const currentConfig   = currentSettings.systemConfig ?? {}
    const newConfig       = deepMerge(currentConfig, updates)

    await app.prisma.company.update({
      where: { id: req.user.cid },
      data:  { settings: { ...currentSettings, systemConfig: newConfig } },
    })

    const finalConfig = deepMerge(DEFAULT_SYSTEM_CONFIG, newConfig)
    return reply.send({ success: true, config: finalConfig })
  })

  // PATCH /api/v1/system-config/permissions — gerenciar usuários com acesso interno
  app.patch('/permissions', async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Apenas administradores podem gerenciar permissões' })
    }

    const { allowedUsers, restrictedModules } = req.body as {
      allowedUsers?: string[]
      restrictedModules?: string[]
    }

    const company = await app.prisma.company.findUnique({
      where:  { id: req.user.cid },
      select: { settings: true },
    })
    if (!company) return reply.status(404).send({ error: 'NOT_FOUND' })

    const currentSettings = (company.settings as any) ?? {}
    const currentConfig   = currentSettings.systemConfig ?? {}
    const updates: any    = { internalModuleAccess: {} }

    if (Array.isArray(allowedUsers)) {
      updates.internalModuleAccess.allowedUsers = allowedUsers.map((u: string) => u.toLowerCase().trim())
    }
    if (Array.isArray(restrictedModules)) {
      updates.internalModuleAccess.restrictedModules = restrictedModules
    }

    const newConfig = deepMerge(currentConfig, updates)
    await app.prisma.company.update({
      where: { id: req.user.cid },
      data:  { settings: { ...currentSettings, systemConfig: newConfig } },
    })

    const finalConfig = deepMerge(DEFAULT_SYSTEM_CONFIG, newConfig)
    return reply.send({ success: true, internalModuleAccess: finalConfig.internalModuleAccess })
  })

  // GET /api/v1/system-config/check-access — verifica acesso do usuário atual aos módulos internos
  app.get('/check-access', async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where:  { id: req.user.sub },
      select: { name: true, role: true },
    })
    if (!user) return reply.status(404).send({ error: 'NOT_FOUND' })

    const company = await app.prisma.company.findUnique({
      where:  { id: req.user.cid },
      select: { settings: true },
    })

    const stored  = (company?.settings as any)?.systemConfig ?? {}
    const config  = deepMerge(DEFAULT_SYSTEM_CONFIG, stored)
    const allowed = config.internalModuleAccess.allowedUsers as string[]
    const firstName = user.name.toLowerCase().trim().split(' ')[0]

    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user.role)
    const hasInternalAccess = isAdmin || allowed.some((a: string) =>
      firstName.includes(a.toLowerCase()) || a.toLowerCase().includes(firstName)
    )

    return reply.send({
      hasInternalAccess,
      allowedModules:  hasInternalAccess ? config.internalModuleAccess.restrictedModules : [],
      allowedUsers:    allowed,
      userName:        user.name,
      role:            user.role,
    })
  })

  // GET /api/v1/system-config/themes — lista os temas disponíveis (metadados)
  app.get('/themes', async (_req, reply) => {
    return reply.send({
      themes: [
        { id: 'classic-blue',    name: 'Clássico Azul',     description: 'Elegante e tradicional. Azul marinho com detalhes dourados.',     preview: '#1B2B5B', gradient: 'linear-gradient(135deg,#1B2B5B,#2d4a8a,#C9A84C)' },
        { id: 'luxury-dark',     name: 'Luxo Escuro',       description: 'Sofisticado e premium. Fundo preto com detalhes dourados.',        preview: '#0a0a0a', gradient: 'linear-gradient(135deg,#0a0a0a,#1a1a1a,#D4AF37)' },
        { id: 'minimal-white',   name: 'Minimalista Branco',description: 'Clean e moderno. Fundo branco, tipografia forte.',                preview: '#ffffff', gradient: 'linear-gradient(135deg,#ffffff,#f0f0f0,#2563EB)' },
        { id: 'nature-green',    name: 'Verde Natureza',    description: 'Tranquilo e acolhedor. Tons de verde e esmeralda.',               preview: '#064E3B', gradient: 'linear-gradient(135deg,#064E3B,#065F46,#6EE7B7)' },
        { id: 'modern-coral',    name: 'Coral Moderno',     description: 'Vibrante e contemporâneo. Gradientes coral/laranja.',             preview: '#E11D48', gradient: 'linear-gradient(135deg,#E11D48,#F97316,#FBBF24)' },
        { id: 'grafite-premium', name: 'Grafite Premium',   description: 'Tecnológico e sofisticado. Cinza escuro com acentos em ciano.',   preview: '#1f2937', gradient: 'linear-gradient(135deg,#1f2937,#374151,#06B6D4)' },
      ],
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Deep merge helper
// ─────────────────────────────────────────────────────────────────────────────
function deepMerge(target: any, source: any): any {
  if (!source || typeof source !== 'object') return target
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] ?? {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}
