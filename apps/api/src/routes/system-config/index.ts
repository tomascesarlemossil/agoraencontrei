import type { FastifyInstance } from 'fastify'
import { createAuditLog } from '../../services/audit.service.js'

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
    heroDesktopImageUrl: '',
    heroMobileImageUrl:  '',
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

    // Vídeo de Apresentação (exibido antes das Redes Sociais na página inicial)
    presentationMediaType:     'video',
    presentationVideoUrl:      'https://files.manuscdn.com/user_upload_by_module/session_file/310519663481419273/MbhJNDOYKAGxseOh.mp4',
    presentationBannerUrl:     '',
    presentationBannerLink:    '',
    presentationTitle:         '',
    presentationSubtitle:      '',

    // Textos do footer
    footerTagline:     'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região.',
    footerFoundedYear: '2002',
    footerCopyright:   'Imobiliária Lemos. Todos os direitos reservados.',
    footerAddress:     'Franca — SP',

    // Cidade Master (prioridade nas buscas)
    masterCity:         'Franca',
    masterState:        'SP',

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
    // Cores do site público
    primaryColor:        '#1B2B5B',
    accentColor:         '#C9A84C',
    backgroundColor:     '#f9f7f4',
    textColor:           '#1a1a1a',
    buttonPrimaryColor:  '#1B2B5B',
    buttonTextColor:     '#ffffff',
    buttonBorderRadius:  12,
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

  // ── Permissões granulares por módulo por usuário ────────────────────────────
  modulePermissions: {
    lemosbank:       [] as string[],
    juridico:        [] as string[],
    fiscal:          [] as string[],
    financiamentos:  [] as string[],
    relatorios:      [] as string[],
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
    lateFeePercent:         10.0,
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
    // MapTiler / Maps
    maptilerApiKey:               '',
    // SendGrid / Resend
    sendgridApiKey:               '',
    resendApiKey:                 '',
  },

  // ── Planos & Preços (SaaS) ─────────────────────────────────────────────────
  pricing: {
    // Cidade prioritária nas buscas
    masterCity:      'Franca',
    masterState:     'SP',
    scrapingRadius:  50,

    // Planos
    plans: [
      {
        id:          'FREE',
        name:        'Free',
        price:       0,
        maxListings: 1,
        features:    ['1 anúncio grátis', 'Acesso básico ao mapa', 'Perfil público'],
        aiQuota:     0,
        active:      true,
      },
      {
        id:          'LITE',
        name:        'Lite',
        price:       79.90,
        maxListings: 10,
        features:    ['Até 10 anúncios', 'Filtros avançados', 'Selo Verificado', 'WhatsApp direto'],
        aiQuota:     0,
        active:      true,
      },
      {
        id:          'MODERADO',
        name:        'Moderado',
        price:       279,
        maxListings: 30,
        features:    ['Até 30 anúncios', 'I.A. de ROI (10/mês)', 'Alertas', 'Analytics completo'],
        aiQuota:     10,
        active:      true,
      },
      {
        id:          'PRO',
        name:        'Pro',
        price:       499,
        maxListings: 100,
        features:    ['Até 100 anúncios', 'I.A. Ilimitada', 'Edição de fotos I.A.', 'Relatórios mensais', 'Banner exclusivo'],
        aiQuota:     -1,
        active:      true,
      },
      {
        id:          'BUSINESS',
        name:        'Business',
        price:       0,
        maxListings: -1,
        features:    ['Anúncios ilimitados', 'Gestão de Carteira', 'Loteamentos', 'API completa', 'Site próprio'],
        aiQuota:     -1,
        active:      true,
        customPrice: true,
      },
    ],

    // Add-ons avulsos
    addons: [
      { id: 'AI_PHOTOS',  name: 'I.A. de Fotos (30 dias)',       price: 49.90 },
      { id: 'DOSSIE',     name: 'Dossiê de Leilão (unidade)',    price: 29.90 },
      { id: 'LOTEAMENTO', name: 'Gestão de Loteamento (mensal)', price: 199 },
    ],
  },

  // ── Empresa ────────────────────────────────────────────────────────────────────
  company: {
    name:              'Imobiliária Lemos',
    tradeName:         'Imobiliária Lemos',
    cnpj:              '',
    creci:             '279051',
    creciType:         'J',
    address:           'Rua Maranhão, 1234',
    neighborhood:      'Centro',
    city:              'Franca',
    state:             'SP',
    zipCode:           '14400-000',
    phone:             '(16) 3723-0045',
    phoneMobile:       '(16) 98101-0004',
    email:             'contato@imobiliarialemos.com.br',
    emailFinanceiro:   'financeiro@imobiliarialemos.com.br',
    emailJuridico:     'juridico@imobiliarialemos.com.br',
    website:           'https://www.agoraencontrei.com.br',
    logoUrl:           '',
    logoWhiteUrl:      '',
    foundedYear:       2003,
    description:       'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região.',
    openingHours:      'Seg-Sex: 8h-18h | Sáb: 8h-12h',
    bankName:          'Bradesco',
    bankAgency:        '',
    bankAccount:       '',
    bankAccountType:   'corrente',
    bankPix:           '',
    bankPixType:       'cnpj',
  },

  // ── Cores & Botões (Dashboard) ───────────────────────────────────────────────
  colors: {
    primaryColor:        '#C9A84C',
    primaryColorHover:   '#b8943d',
    secondaryColor:      '#1B2B5B',
    accentColor:         '#3B82F6',
    dangerColor:         '#EF4444',
    successColor:        '#22C55E',
    warningColor:        '#F59E0B',
    btnPrimaryBg:        '#C9A84C',
    btnPrimaryText:      '#ffffff',
    btnSecondaryBg:      'rgba(255,255,255,0.1)',
    btnSecondaryText:    '#ffffff',
    btnDangerBg:         '#EF4444',
    btnDangerText:       '#ffffff',
    sidebarBg:           '#0f0f0f',
    sidebarText:         '#ffffff',
    sidebarActiveColor:  '#C9A84C',
    cardBg:              'rgba(255,255,255,0.05)',
    cardBorder:          'rgba(255,255,255,0.1)',
    statusActiveBg:      'rgba(34,197,94,0.2)',
    statusActiveText:    '#22C55E',
    statusPendingBg:     'rgba(245,158,11,0.2)',
    statusPendingText:   '#F59E0B',
    statusLateBg:        'rgba(239,68,68,0.2)',
    statusLateText:      '#EF4444',
    statusFinishedBg:    'rgba(255,255,255,0.1)',
    statusFinishedText:  'rgba(255,255,255,0.5)',
  },

  // ── Configuração de Campos de Cadastro ─────────────────────────────────────────
  cadastroConfig: {
    imovel: {
      requiredFields: ['title', 'type', 'purpose', 'price'],
      visibleFields:  ['title', 'type', 'purpose', 'status', 'price', 'priceRent', 'priceSeason', 'condoFee', 'iptu', 'address', 'neighborhood', 'city', 'state', 'zipCode', 'bedrooms', 'suites', 'bathrooms', 'parkingSpaces', 'totalArea', 'builtArea', 'usefulArea', 'privateArea', 'description', 'features', 'images', 'captorName', 'yearBuilt', 'standard', 'constructionCompany', 'condoName', 'condoUnits', 'condoFloors', 'iptuRegistration', 'cartorioMatricula'],
      fieldLabels: {
        title: 'Título', type: 'Tipo', purpose: 'Finalidade', status: 'Situação',
        price: 'Valor de Venda', priceRent: 'Valor de Locação', priceSeason: 'Valor Temporada',
        condoFee: 'Condomínio', iptu: 'IPTU', address: 'Endereço', neighborhood: 'Bairro',
        city: 'Cidade', state: 'Estado', zipCode: 'CEP', bedrooms: 'Dormitórios',
        suites: 'Suítes', bathrooms: 'Banheiros', parkingSpaces: 'Vagas', totalArea: 'Área Total',
        builtArea: 'Área Construída', usefulArea: 'Área Útil', privateArea: 'Área Privativa',
        description: 'Descrição', features: 'Características', images: 'Fotos',
        captorName: 'Captador', yearBuilt: 'Ano de Construção', standard: 'Padrão',
        constructionCompany: 'Construtora', condoName: 'Edifício/Condomínio',
        condoUnits: 'Nº de Unidades', condoFloors: 'Nº de Andares',
        iptuRegistration: 'Cad. Prefeitura (IPTU)', cartorioMatricula: 'Matrícula Cartório',
      },
    },
    cliente: {
      requiredFields: ['name'],
      visibleFields: ['name', 'cpf', 'rg', 'rgIssuer', 'rgIssueDate', 'birthDate', 'nationality', 'naturalness', 'maritalStatus', 'spouseName', 'spouseCpf', 'spouseProfession', 'spouseIncome', 'gender', 'education', 'profession', 'company', 'companyRole', 'income', 'phone', 'phoneMobile', 'phoneWork', 'email', 'address', 'addressNumber', 'complement', 'neighborhood', 'city', 'state', 'zipCode', 'bankName', 'bankAgency', 'bankAccount', 'bankAccountType', 'bankPix', 'notes', 'category', 'negotiationThermometer', 'captorName'],
      fieldLabels: {
        name: 'Nome Completo', cpf: 'CPF', rg: 'RG', rgIssuer: 'Órgão Emissor', rgIssueDate: 'Data Emissão RG',
        birthDate: 'Data de Nascimento', nationality: 'Nacionalidade', naturalness: 'Naturalidade',
        maritalStatus: 'Estado Civil', spouseName: 'Nome do Cônjuge', spouseCpf: 'CPF do Cônjuge',
        gender: 'Sexo', education: 'Escolaridade', profession: 'Profissão',
        company: 'Empresa', companyRole: 'Cargo', income: 'Renda Mensal',
        phone: 'Telefone Residencial', phoneMobile: 'Celular', phoneWork: 'Telefone Comercial',
        email: 'E-mail', address: 'Endereço', addressNumber: 'Número', complement: 'Complemento',
        neighborhood: 'Bairro', city: 'Cidade', state: 'Estado', zipCode: 'CEP',
        bankName: 'Banco', bankAgency: 'Agência', bankAccount: 'Conta', bankAccountType: 'Tipo de Conta',
        bankPix: 'Chave PIX', notes: 'Observações', category: 'Categoria',
        negotiationThermometer: 'Termômetro de Negociação', captorName: 'Captador',
      },
    },
    contrato: {
      requiredFields: ['tenantName', 'propertyAddress', 'rentValue', 'startDate'],
      visibleFields: ['tenantName', 'landlordName', 'guarantorName', 'propertyAddress', 'rentValue', 'condoFee', 'iptu', 'waterBill', 'gasBill', 'electricBill', 'adminFee', 'insuranceFee', 'fireInsurance', 'tenantDueDay', 'landlordDueDay', 'commission', 'penalty', 'startDate', 'duration', 'endDate', 'adjustmentIndex', 'adjustmentPercent', 'guaranteeType', 'caucaoValue', 'caucaoMonths', 'observations', 'internalNotes', 'iptuCode'],
      fieldLabels: {
        tenantName: 'Inquilino', landlordName: 'Proprietário', guarantorName: 'Fiador',
        propertyAddress: 'Endereço do Imóvel', rentValue: 'Valor do Aluguel',
        condoFee: 'Condomínio', iptu: 'IPTU', waterBill: 'Água', gasBill: 'Gás',
        electricBill: 'Energia Elétrica', adminFee: 'Taxa Administrativa', insuranceFee: 'Seguro',
        fireInsurance: 'Seguro Incêndio', tenantDueDay: 'Vencimento Inquilino',
        landlordDueDay: 'Vencimento Proprietário', commission: 'Comissão (%)',
        penalty: 'Multa (%)', startDate: 'Início', duration: 'Duração (meses)',
        endDate: 'Término', adjustmentIndex: 'Índice de Reajuste',
        adjustmentPercent: '% Reajuste', guaranteeType: 'Tipo de Garantia',
        caucaoValue: 'Valor da Caução', caucaoMonths: 'Meses de Caução',
        observations: 'Observações', internalNotes: 'Notas Internas', iptuCode: 'Cód. IPTU',
      },
    },
    cobranca: {
      requiredFields: ['rentAmount', 'dueDate'],
      visibleFields: ['rentAmount', 'condoFee', 'iptu', 'waterBill', 'gasBill', 'electricBill', 'adminFee', 'insuranceFee', 'lateFee', 'interest', 'discount', 'totalAmount', 'dueDate', 'paymentDate', 'paidAmount', 'paymentMethod', 'paymentBank', 'paymentDocNum', 'paymentObs', 'status'],
      fieldLabels: {
        rentAmount: 'Aluguel', condoFee: 'Condomínio', iptu: 'IPTU', waterBill: 'Água',
        gasBill: 'Gás', electricBill: 'Energia', adminFee: 'Taxa Adm.', insuranceFee: 'Seguro',
        lateFee: 'Multa', interest: 'Juros', discount: 'Desconto', totalAmount: 'Total',
        dueDate: 'Vencimento', paymentDate: 'Data Pagamento', paidAmount: 'Valor Pago',
        paymentMethod: 'Forma de Pagamento', paymentBank: 'Banco', paymentDocNum: 'Nº Documento',
        paymentObs: 'Observações', status: 'Status',
      },
      paymentMethods: ['Dinheiro', 'PIX', 'Boleto', 'Transferência', 'Cheque', 'Cartão de Débito', 'Cartão de Crédito', 'Depósito'],
    },
  },

  // ── Portais de Imóveis ────────────────────────────────────────────────────────
  portals: {
    zapImoveis: { enabled: false, token: '', autoPublish: false, publishVenda: true, publishLocacao: true, feedUrl: '' },
    vivaReal:   { enabled: false, token: '', autoPublish: false, publishVenda: true, publishLocacao: true, feedUrl: '' },
    olx:        { enabled: false, token: '', autoPublish: false, publishVenda: true, publishLocacao: false, feedUrl: '' },
    chavesMao:  { enabled: false, token: '', autoPublish: false, publishVenda: true, publishLocacao: true, feedUrl: '' },
    imovelWeb:  { enabled: false, token: '', autoPublish: false, publishVenda: true, publishLocacao: true, feedUrl: '' },
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

    await createAuditLog({
      prisma: app.prisma as any,
      req,
      action: 'config.update',
      resource: 'system-config',
      resourceId: req.user.cid,
      before: currentConfig,
      after: newConfig,
    })

    const finalConfig = deepMerge(DEFAULT_SYSTEM_CONFIG, newConfig)

    // Audit log — registrar alteração de configuração
    const sections = Object.keys(updates)
    await createAuditLog({
      prisma: app.prisma,
      req,
      action: 'config.update',
      resource: 'system-config',
      resourceId: req.user.cid,
      before: currentConfig,
      after: newConfig,
      meta: { sections, updatedAt: new Date().toISOString() },
    })

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

    await createAuditLog({
      prisma: app.prisma as any,
      req,
      action: 'config.update',
      resource: 'permissions',
      resourceId: req.user.cid,
      before: currentConfig.internalModuleAccess ?? {},
      after: newConfig.internalModuleAccess ?? {},
    })

    const finalConfig = deepMerge(DEFAULT_SYSTEM_CONFIG, newConfig)

    // Audit log — registrar alteração de permissões
    await createAuditLog({
      prisma: app.prisma,
      req,
      action: 'config.permissions_update',
      resource: 'system-config',
      resourceId: req.user.cid,
      before: { internalModuleAccess: currentConfig.internalModuleAccess },
      after: { internalModuleAccess: finalConfig.internalModuleAccess },
      meta: { updatedAt: new Date().toISOString() },
    })

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
