export const PARTNER_CATEGORY_SEO = [
  {
    value: 'ARQUITETO',
    slug: 'arquitetos',
    singular: 'arquiteto',
    label: 'Arquitetos',
    service: 'arquitetura',
    intent: 'projetar, construir, reformar e valorizar imoveis',
    description: 'Arquitetos parceiros para projetos residenciais, interiores, reformas, fachadas e valorizacao imobiliaria.',
  },
  {
    value: 'ENGENHEIRO',
    slug: 'engenheiros',
    singular: 'engenheiro civil',
    label: 'Engenheiros',
    service: 'engenharia civil',
    intent: 'laudos, obras, regularizacao, calculos e execucao tecnica',
    description: 'Engenheiros parceiros para obra, regularizacao, laudos, reformas, vistoria e construcao.',
  },
  {
    value: 'DESIGNER_INTERIORES',
    slug: 'designers-de-interiores',
    singular: 'designer de interiores',
    label: 'Designers de Interiores',
    service: 'design de interiores',
    intent: 'decorar, mobiliar, reformar ambientes e melhorar o uso dos espacos',
    description: 'Designers de interiores para apartamentos, casas, areas gourmet, lojas e ambientes comerciais.',
  },
  {
    value: 'AVALIADOR',
    slug: 'avaliadores-de-imoveis',
    singular: 'avaliador de imoveis',
    label: 'Avaliadores de Imoveis',
    service: 'avaliacao imobiliaria',
    intent: 'precificar, vender, comprar, financiar ou negociar com seguranca',
    description: 'Avaliadores para estimar valor de mercado, venda, locacao, inventario, financiamento e negociacao.',
  },
  {
    value: 'ADVOGADO_IMOBILIARIO',
    slug: 'advogados-imobiliarios',
    singular: 'advogado imobiliario',
    label: 'Advogados Imobiliarios',
    service: 'direito imobiliario',
    intent: 'contratos, regularizacao, compra, venda, locacao e seguranca juridica',
    description: 'Advogados imobiliarios para contratos, due diligence, locacao, compra e venda, usucapiao e regularizacao.',
  },
  {
    value: 'DESPACHANTE',
    slug: 'despachantes-imobiliarios',
    singular: 'despachante imobiliario',
    label: 'Despachantes Imobiliarios',
    service: 'documentacao imobiliaria',
    intent: 'resolver documentos, certidoes, registros e regularizacoes',
    description: 'Despachantes para documentacao, cartorio, certidoes, prefeitura, registro e regularizacao de imoveis.',
  },
  {
    value: 'FOTOGRAFO',
    slug: 'fotografos-imobiliarios',
    singular: 'fotografo imobiliario',
    label: 'Fotografos Imobiliarios',
    service: 'fotografia imobiliaria',
    intent: 'fotografar, anunciar e vender imoveis com mais impacto',
    description: 'Fotografos para ensaios imobiliarios, fotos profissionais, tour visual e material para anuncios.',
  },
  {
    value: 'VIDEOMAKER',
    slug: 'videomakers-imobiliarios',
    singular: 'videomaker imobiliario',
    label: 'Videomakers Imobiliarios',
    service: 'video imobiliario',
    intent: 'criar videos, reels, tours e campanhas para imoveis',
    description: 'Videomakers para videos de imoveis, reels, drone, tours, lancamentos e campanhas imobiliarias.',
  },
  {
    value: 'IMOBILIARIA',
    slug: 'imobiliarias',
    singular: 'imobiliaria',
    label: 'Imobiliarias',
    service: 'intermediacao imobiliaria',
    intent: 'comprar, vender, alugar, administrar ou anunciar imoveis',
    description: 'Imobiliarias parceiras para compra, venda, locacao, administracao e captacao de imoveis.',
  },
  {
    value: 'LOTEADORA',
    slug: 'loteadoras',
    singular: 'loteadora',
    label: 'Loteadoras',
    service: 'loteamentos e terrenos',
    intent: 'encontrar terrenos, loteamentos, areas e oportunidades de desenvolvimento',
    description: 'Loteadoras e empresas de terrenos para quem busca areas, lotes, lancamentos e oportunidades.',
  },
  {
    value: 'OUTRO',
    slug: 'servicos-para-imoveis',
    singular: 'profissional para imoveis',
    label: 'Servicos para Imoveis',
    service: 'servicos imobiliarios',
    intent: 'resolver necessidades do imovel com empresas parceiras',
    description: 'Profissionais e empresas para obras, reformas, manutencao, regularizacao e servicos ligados ao imovel.',
  },
] as const

export const PARTNER_CITY_SEO = [
  { slug: 'franca-sp', city: 'Franca', state: 'SP', region: 'Franca e regiao' },
  { slug: 'ribeirao-preto-sp', city: 'Ribeirao Preto', state: 'SP', region: 'Ribeirao Preto e regiao' },
  { slug: 'batatais-sp', city: 'Batatais', state: 'SP', region: 'Batatais e regiao' },
  { slug: 'cristais-paulista-sp', city: 'Cristais Paulista', state: 'SP', region: 'Cristais Paulista e regiao' },
  { slug: 'restinga-sp', city: 'Restinga', state: 'SP', region: 'Restinga e regiao' },
  { slug: 'itirapua-sp', city: 'Itirapua', state: 'SP', region: 'Itirapua e regiao' },
  { slug: 'sao-paulo-sp', city: 'Sao Paulo', state: 'SP', region: 'Sao Paulo' },
  { slug: 'campinas-sp', city: 'Campinas', state: 'SP', region: 'Campinas e regiao' },
  { slug: 'belo-horizonte-mg', city: 'Belo Horizonte', state: 'MG', region: 'Belo Horizonte e regiao' },
  { slug: 'curitiba-pr', city: 'Curitiba', state: 'PR', region: 'Curitiba e regiao' },
] as const

export type PartnerCategorySeo = (typeof PARTNER_CATEGORY_SEO)[number]
export type PartnerCitySeo = (typeof PARTNER_CITY_SEO)[number]

export const NIU_OFFICIAL_PARTNER = {
  id: 'seed_niu_arquitetura',
  slug: 'niu-arquitetura',
  name: 'NIU Arquitetura',
  category: 'ARQUITETO',
  categoryLabel: 'Arquitetura e Design',
  city: 'Franca',
  state: 'SP',
  bio: 'Escritorio de Arquitetura e Design fundado em 2018 por Yuri Miranda e Douglas Costa. Projetos residenciais, interiores, reformas, arquitetura comercial e estudos de alto padrao para Franca, regiao e atendimento online no Brasil.',
  photoUrl: '/partners/niu/niu-logo.jpg',
  logoUrl: '/partners/niu/niu-logo.jpg',
  whatsapp: '+55 16 99264-6070',
  phone: '+55 16 99460-8222',
  plan: 'VIP',
  adPlan: 'PREMIUM',
  isFeatured: true,
  featuredWeight: 1000,
  tags: [
    'Arquitetura residencial',
    'Arquitetura comercial',
    'Projeto arquitetonico',
    'Projetos de casas',
    'Design de interiores',
    'Reformas',
    'Construcao',
    'Franca SP',
    'Brasil',
  ],
  landingPage: { segmentLabel: 'Arquitetura e Design' },
  profilePath: '/parceiros/niu-arquitetura',
} as const

export const NIU_RELATED_CATEGORY_SLUGS = new Set([
  'arquitetos',
  'designers-de-interiores',
  'servicos-para-imoveis',
])

export function shouldShowNiuForPartnerSeo(categorySlug: string) {
  return NIU_RELATED_CATEGORY_SLUGS.has(categorySlug)
}

export const NIU_SEARCH_INTENT_LINKS = [
  {
    href: '/empresas-parceiras/franca-sp/arquitetos',
    title: 'Arquitetos em Franca/SP',
    description: 'Pagina local para quem busca arquiteto, projeto arquitetonico, interiores, reforma e construcao em Franca.',
  },
  {
    href: '/empresas-parceiras/ribeirao-preto-sp/arquitetos',
    title: 'Arquitetos em Ribeirao Preto/SP',
    description: 'Vitrine regional para demanda de arquitetura residencial, comercial e atendimento online.',
  },
  {
    href: '/empresas-parceiras/sao-paulo-sp/arquitetos',
    title: 'Arquitetos em Sao Paulo/SP',
    description: 'Presenca em busca nacional para pessoas comparando escritorios e projetos de alto padrao.',
  },
  {
    href: '/empresas-parceiras/campinas-sp/arquitetos',
    title: 'Arquitetos em Campinas/SP',
    description: 'Pagina de descoberta para projetos, reformas, interiores e construcao em cidades estrategicas.',
  },
  {
    href: '/empresas-parceiras/franca-sp/designers-de-interiores',
    title: 'Design de interiores em Franca/SP',
    description: 'Intencao complementar para ambientes, materiais, marcenaria, iluminacao e valorizacao do imovel.',
  },
  {
    href: '/parceiros/niu-arquitetura',
    title: 'Landing oficial da NIU',
    description: 'Pagina completa com historia, projetos, briefing inteligente, contatos e prova visual.',
  },
] as const

export function getPartnerCategoryBySlug(slug: string) {
  return PARTNER_CATEGORY_SEO.find(c => c.slug === slug)
}

export function getPartnerCityBySlug(slug: string) {
  return PARTNER_CITY_SEO.find(c => c.slug === slug)
}

export function partnerSeoPath(citySlug: string, categorySlug: string) {
  return `/empresas-parceiras/${citySlug}/${categorySlug}`
}

export function partnerCategoryQuery(category: PartnerCategorySeo) {
  return `/empresas-parceiras?category=${category.value}`
}

export function partnerCityQuery(city: PartnerCitySeo) {
  return `/empresas-parceiras?city=${encodeURIComponent(city.city)}`
}

export const PARTNER_INTENT_PAGES = [
  {
    href: '/empresas-parceiras/franca-sp/arquitetos',
    title: 'Arquitetos em Franca/SP',
    description: 'Projetos, interiores, reformas e valorizacao imobiliaria.',
  },
  {
    href: '/empresas-parceiras/franca-sp/engenheiros',
    title: 'Engenheiros em Franca/SP',
    description: 'Obras, regularizacao, laudos e execucao tecnica.',
  },
  {
    href: '/empresas-parceiras/franca-sp/designers-de-interiores',
    title: 'Design de interiores em Franca/SP',
    description: 'Ambientes mais bonitos, funcionais e valorizados.',
  },
  {
    href: '/empresas-parceiras/franca-sp/avaliadores-de-imoveis',
    title: 'Avaliadores de imoveis',
    description: 'Preco real para vender, comprar, financiar ou negociar.',
  },
  {
    href: '/empresas-parceiras/franca-sp/fotografos-imobiliarios',
    title: 'Fotografia imobiliaria',
    description: 'Imagens profissionais para vender e alugar melhor.',
  },
  {
    href: '/empresas-parceiras/ribeirao-preto-sp/arquitetos',
    title: 'Arquitetura em Ribeirao Preto/SP',
    description: 'Busca regional por projeto arquitetonico, interiores e reformas.',
  },
  {
    href: '/empresas-parceiras/sao-paulo-sp/arquitetos',
    title: 'Arquitetos para projetos no Brasil',
    description: 'Vitrine nacional para quem procura escritorio de arquitetura online.',
  },
  {
    href: '/parceiros/niu-arquitetura',
    title: 'NIU Arquitetura em destaque',
    description: 'Primeiro parceiro oficial de arquitetura no AgoraEncontrei.',
  },
] as const
