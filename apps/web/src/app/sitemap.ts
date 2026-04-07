import type { MetadataRoute } from 'next'

/**
 * Sitemap Index — Aponta para sitemaps segmentados
 *
 * Estrutura:
 * /sitemap.xml → Sitemap Index (este arquivo)
 *   ├── /sitemap-core.xml → Páginas estáticas + landing pages
 *   ├── /sitemap-properties.xml → Imóveis individuais
 *   ├── /sitemap-auctions.xml → Leilões
 *   ├── /sitemap-bairros.xml → 472+ bairros
 *   ├── /sitemap-condominios.xml → 300+ condomínios
 *   ├── /sitemap-profissionais.xml → Profissionais
 *   ├── /sitemap-blog.xml → Blog posts
 *   └── /sitemap-cidades.xml → Cidades regionais
 *
 * Suporta milhões de URLs sem penalizar performance.
 * Cada sub-sitemap tem no máximo 50.000 URLs (limite Google).
 */

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Landing pages ───────────────────────────────────────────────────────────
const LANDING_PAGES = [
  '/casas-a-venda-franca-sp', '/casas-para-alugar-franca-sp',
  '/apartamentos-a-venda-franca-sp', '/apartamentos-para-alugar-franca-sp',
  '/terrenos-a-venda-franca-sp', '/imoveis-comerciais-franca-sp',
  '/chacaras-e-sitios-franca-sp', '/condominio-fechado-franca-sp',
  '/leilao-imoveis-franca-sp', '/investimento-imobiliario-franca-sp',
  '/avaliacao-imoveis-franca-sp', '/financiamento-imovel-franca-sp',
  '/reforma-de-imoveis-franca-sp', '/engenharia-civil-franca-sp',
  '/construcao-civil-franca-sp', '/arquitetura-franca-sp',
  '/decoracao-de-interiores-franca-sp', '/direito-imobiliario-franca-sp',
  '/vistoria-de-imoveis-franca-sp',
]

// ── Cidades regionais ──────────────────────────────────────────────────────
const CIDADES_REGIONAIS = [
  'batatais', 'cristais-paulista', 'patrocinio-paulista', 'altinopolis',
  'brodowski', 'rifaina', 'pedregulho', 'itirapua',
]

// ── Bairros de Franca ──────────────────────────────────────────────────────
const BAIRROS_FRANCA = [
  'centro','city-petropolis','jardim-america','jardim-paulista','jardim-petraglia',
  'jardim-paulistano','jardim-europa','jardim-california','jardim-panorama',
  'jardim-independencia','jardim-redentor','jardim-santa-cruz','jardim-santos-dumont',
  'jardim-sumare','jardim-piemonte','jardim-monte-verde','jardim-zanetti',
  'jardim-tropical','jardim-eldorado','jardim-progresso','jardim-sao-vicente',
  'jardim-cambuhy','jardim-castelo','jardim-diamante','jardim-marchesi',
  'jardim-botanico','vila-santa-cruz','vila-industrial','vila-aparecida',
  'vila-formosa','vila-sao-sebastiao','vila-sao-jose','vila-nova',
  'polo-club','polo-club-i','polo-club-ii','polo-club-iii',
  'parque-das-nacoes','parque-industrial','residencial-brasil',
  'residencial-zanetti','residencial-monte-verde','residencial-primavera',
  'condominio-olivito','condominio-gaia','condominio-piemonte',
  'condominio-villa-toscana','condominio-villaggio-di-firenze',
  'condominio-porto-dos-sonhos','condominio-residencial-dom-bosco',
  'condominio-reserva-das-amoreiras','condominio-san-pietro',
  'espraiado','boa-vista','bom-jardim','consolacao','sao-jose',
  'ana-dorothea','champagnat','belvedere-bandeirante',
]

// ── Condomínios ────────────────────────────────────────────────────────────
const CONDOMINIOS = [
  'condominio-collis-residence', 'condominio-di-villaggio-firenze',
  'condominio-dona-sabina', 'condominio-gaia', 'condominio-olivito',
  'condominio-parque-freemont', 'condominio-perola', 'condominio-piemonte',
  'condominio-porto-dos-sonhos', 'condominio-reserva-das-amoreiras',
  'condominio-residencial-brasil', 'condominio-residencial-dom-bosco',
  'condominio-residencial-piemonte', 'condominio-san-pietro',
  'condominio-siena', 'condominio-siracusa', 'condominio-terra-mater',
  'condominio-terra-nova', 'condominio-village-giardinno',
  'condominio-villagio-di-roma', 'condominio-ville-de-france',
  'condominio-recanto-dos-lagos', 'condominio-reserva-real',
  'condominio-villa-toscana', 'condominio-riviera', 'condominio-le-parc',
  'condominio-jardins-de-franca', 'condominio-residencial-zanetti',
  'condominio-san-conrado', 'condominio-santa-georgina',
]

// ── Landing pages de leilão por bairro (SEO predatório vs ZAP) ─────────────
const LEILAO_BAIRROS = [
  'leilao-imoveis-centro-franca-sp',
  'leilao-imoveis-jardim-california-franca-sp',
  'leilao-imoveis-jardim-europa-franca-sp',
  'leilao-imoveis-jardim-america-franca-sp',
  'leilao-imoveis-jardim-paulista-franca-sp',
  'leilao-imoveis-polo-club-franca-sp',
  'leilao-imoveis-jardim-panorama-franca-sp',
  'leilao-imoveis-jardim-redentor-franca-sp',
  'leilao-imoveis-jardim-sumare-franca-sp',
  'leilao-imoveis-jardim-independencia-franca-sp',
  'leilao-imoveis-jardim-petraglia-franca-sp',
  'leilao-imoveis-jardim-paulistano-franca-sp',
  'leilao-imoveis-vila-industrial-franca-sp',
  'leilao-imoveis-boa-vista-franca-sp',
  'leilao-imoveis-parque-das-nacoes-franca-sp',
  'leilao-imoveis-residencial-brasil-franca-sp',
  'leilao-apartamentos-franca-sp',
  'leilao-casas-franca-sp',
  'leilao-terrenos-franca-sp',
  'leilao-imoveis-comerciais-franca-sp',
  'leilao-imoveis-caixa-franca-sp',
  'leilao-imoveis-judicial-franca-sp',
  'arrematacao-imoveis-franca-sp',
  'imoveis-desconto-leilao-franca-sp',
]

// ── Serviços ────────────────────────────────────────────────────────────────
const SERVICOS = [
  '/servicos', '/servicos/avaliacao-imoveis', '/servicos/leilao-imoveis',
  '/servicos/investimento-imobiliario', '/servicos/reforma-imoveis',
  '/servicos/engenharia-construcao', '/servicos/fotos-imoveis',
  '/servicos/video-imoveis', '/servicos/edicao-fotos',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // ── Core pages ──────────────────────────────────────────────────────────
  const core: MetadataRoute.Sitemap = [
    { url: WEB_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${WEB_URL}/imoveis`, lastModified: now, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${WEB_URL}/leiloes`, lastModified: now, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${WEB_URL}/profissionais/franca`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${WEB_URL}/parceiros/cadastro`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${WEB_URL}/parceiros/membro-fundador`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${WEB_URL}/anunciar-imovel`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${WEB_URL}/custo-de-vida/franca-sp`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${WEB_URL}/custo-de-vida/ribeirao-preto-sp`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/custo-de-vida/campinas-sp`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/custo-de-vida/sao-paulo-sp`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${WEB_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${WEB_URL}/bairros/franca`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${WEB_URL}/avaliacao`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${WEB_URL}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/corretores`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/contato`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  // ── Landing pages (alta prioridade SEO) ──────────────────────────────────
  const landings = LANDING_PAGES.map(p => ({
    url: `${WEB_URL}${p}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.95,
  }))

  // ── Serviços ──────────────────────────────────────────────────────────────
  const servicos = SERVICOS.map(p => ({
    url: `${WEB_URL}${p}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.75,
  }))

  // ── Cidades regionais ────────────────────────────────────────────────────
  const cidades = CIDADES_REGIONAIS.map(c => ({
    url: `${WEB_URL}/imoveis-${c}-sp`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.85,
  }))
  // Hub regional
  cidades.push({ url: `${WEB_URL}/imoveis-regiao-franca-sp`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 })

  // ── Capitais (alta prioridade) ────────────────────────────────────────────
  const capitais = [
    'sao-paulo-sp', 'belo-horizonte-mg', 'curitiba-pr', 'goiania-go', 'brasilia-df',
  ].map(c => ({
    url: `${WEB_URL}/imoveis-${c}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.95,
  }))

  // ── Bairros de Franca ────────────────────────────────────────────────────
  const bairros = BAIRROS_FRANCA.map(b => ({
    url: `${WEB_URL}/bairros/franca/${b}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8,
  }))

  // ── Condomínios ──────────────────────────────────────────────────────────
  const condominios = CONDOMINIOS.map(c => ({
    url: `${WEB_URL}/condominios/franca/${c}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.85,
  }))

  // ── POIs (Pontos de Interesse) ──────────────────────────────────────────
  const poiSlugs = [
    'uni-franca', 'unesp-franca', 'shopping-franca', 'shopping-boulevard',
    'santa-casa-franca', 'hospital-regional', 'sesi-franca', 'senai-franca',
    'etec-franca', 'atacadao-franca', 'assai-franca', 'upa-franca',
    'shopping-ribeirao', 'usp-ribeirao', 'hospital-clinicas-rp',
    'shopping-ibirapuera', 'usp-sao-paulo', 'hospital-einstein',
    'unicamp', 'shopping-galleria',
  ]
  const pois = poiSlugs.map(slug => ({
    url: `${WEB_URL}/imoveis/perto-de/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ── Landing pages de leilão por bairro ────────────────────────────────────
  const leilaoBairros = LEILAO_BAIRROS.map(slug => ({
    url: `${WEB_URL}/leiloes/${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.92,
  }))

  // ── Leilões (dinâmicos da API) ────────────────────────────────────────────
  let leiloes: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/auctions?limit=500&sortBy=createdAt&sortOrder=desc`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      leiloes = (data.data ?? []).map((a: any) => ({
        url: `${WEB_URL}/leiloes/${a.slug}`,
        lastModified: new Date(a.updatedAt ?? now),
        changeFrequency: 'daily' as const,
        priority: 0.85,
      }))
    }
  } catch {}

  // ── Imóveis individuais (dinâmicos da API) ────────────────────────────────
  let imoveis: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=2000`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      imoveis = (data.data ?? []).map((p: any) => ({
        url: `${WEB_URL}/imoveis/${p.slug}`,
        lastModified: new Date(p.updatedAt ?? now),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }))
    }
  } catch {}

  // ── Blog ───────────────────────────────────────────────────────────────────
  let blog: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?limit=500`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      blog = (data.data ?? []).map((p: any) => ({
        url: `${WEB_URL}/blog/${p.slug}`,
        lastModified: new Date(p.publishedAt ?? now),
        changeFrequency: 'monthly' as const,
        priority: 0.65,
      }))
    }
  } catch {}

  return [
    ...core,
    ...landings,
    ...leilaoBairros,
    ...servicos,
    ...capitais,
    ...cidades,
    ...bairros,
    ...condominios,
    ...pois,
    ...leiloes,
    ...imoveis,
    ...blog,
  ]
}
