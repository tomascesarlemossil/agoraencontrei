import type { MetadataRoute } from 'next'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ─── Landing pages de alta prioridade SEO (páginas físicas existentes) ───────
const LANDING_PAGES_HIGH = [
  '/casas-a-venda-franca-sp',
  '/casas-para-alugar-franca-sp',
  '/apartamentos-a-venda-franca-sp',
  '/apartamentos-para-alugar-franca-sp',
  '/terrenos-a-venda-franca-sp',
  '/terrenos-franca-sp',
  '/imoveis-comerciais-franca-sp',
  '/chacaras-franca-sp',
  '/chacaras-e-sitios-franca-sp',
  '/condominio-fechado-franca-sp',
  '/avaliacao-imoveis-franca-sp',
  '/financiamento-imovel-franca-sp',
  '/leilao-imoveis-franca-sp',
  '/investimento-imobiliario-franca-sp',
  '/reforma-de-imoveis-franca-sp',
  '/engenharia-civil-franca-sp',
  '/construcao-civil-franca-sp',
  '/arquitetura-franca-sp',
  '/decoracao-de-interiores-franca-sp',
  '/direito-imobiliario-franca-sp',
  '/vistoria-de-imoveis-franca-sp',
]

// ─── Páginas de serviços ──────────────────────────────────────────────────────
const SERVICOS_PAGES = [
  '/servicos',
  '/servicos/2via-boleto',
  '/servicos/extrato-proprietario',
  '/servicos/fichas-cadastrais',
  '/servicos/fotos-imoveis',
  '/servicos/edicao-fotos',
  '/servicos/video-imoveis',
  '/servicos/avaliacao-imoveis',
  '/servicos/leilao-imoveis',
  '/servicos/investimento-imobiliario',
  '/servicos/reforma-imoveis',
  '/servicos/engenharia-construcao',
]

// ─── Cidades atendidas ────────────────────────────────────────────────────────
const CIDADES = [
  'franca', 'rifaina', 'cristais-paulista', 'patrocinio-paulista',
  'ribeirao-preto', 'pedregulho', 'itirapua', 'delfinopolis',
  'capitolio', 'cassia', 'ibiraci', 'capetinga', 'sacramento', 'restinga',
]

// ─── Todos os bairros de Franca/SP (páginas físicas existentes) ───────────────
const BAIRROS_FRANCA = [
  'aeroporo-i','aeroporto','aeroporto-ii','aerorporto-i',
  'alto-da-vila-aparecida','alto-vila-aparecida',
  'ana-dorothea','ana-dorotheia','angela-rosa','bairro-sao-jose',
  'belvedere-bandeirante','belvederes-bandeirantes','belvederes-dos-bandeirantes',
  'boa-esperanca','boa-vista','bom-jardim','capim-mimoso','castelo-soberano',
  'centro','chacara-espraiado','chacara-santa-cruz','chacara-santo-antonio',
  'chacaras-residenciais-ana-dorothea','chacaras-sao-paulo','champagnat',
  'cidade-nova','city-petropolis','colina-do-espraiado','colina-espraiado',
  'condominio-morada-do-verde','condominio-olivito','condominio-parque-do-mirante',
  'condominio-portal-de-minas','condominio-quinta-do-imperador',
  'condominio-residencial-gaia','condominio-santa-georgina',
  'condominio-veredas-de-franca','condominio-vila-monte-verde',
  'condominio-vila-piemonte-l','condominio-vila-toscana',
  'condominio-vilage-san-rafaello','condominio-villa-di-capri',
  'condominio-villa-sao-vicente','condominio-villaggio-di-firenze',
  'condominio-villaggio-di-firenzi','condominio-villagi-di-firenzi',
  'condominio-villagio-di-firenzi','consolacao','consolacaos-vicente',
  'cyti-petropolis','espraiado','estancia-das-palmeiras','estancia-sao-jorge',
  'estancia-sao-pedro','estancia-sao-sebastiao','fazenda-santa-barbara',
  'fazenda-santa-lucia','fazenda-santa-maria','fazenda-santa-rosa',
  'fazenda-sao-bento','fazenda-sao-geraldo','fazenda-sao-jose',
  'fazenda-sao-pedro','fazenda-sao-sebastiao','fazenda-sao-vicente',
  'jardim-aeroporto','jardim-alvorada','jardim-america','jardim-aurora',
  'jardim-bela-vista','jardim-boa-esperanca','jardim-boa-vista','jardim-botanico',
  'jardim-brasil','jardim-california','jardim-campestre','jardim-canaa',
  'jardim-carvalho','jardim-castelo','jardim-caxambu','jardim-cerejeiras',
  'jardim-coleginho','jardim-consolacao','jardim-copacabana','jardim-das-acaias',
  'jardim-das-flores','jardim-das-oliveiras','jardim-das-rosas','jardim-das-violetas',
  'jardim-diamante','jardim-dos-ipes','jardim-dos-pinheiros','jardim-eldorado',
  'jardim-esplanada','jardim-europa','jardim-floresta','jardim-formosa',
  'jardim-fortaleza','jardim-girassol','jardim-gloria','jardim-guanabara',
  'jardim-imperial','jardim-independencia','jardim-ipanema','jardim-ipiranga',
  'jardim-italia','jardim-jaragua','jardim-jequitiba','jardim-lagoa',
  'jardim-leblon','jardim-leonor','jardim-liberdade','jardim-lourdes',
  'jardim-maravilha','jardim-marcia','jardim-maristela','jardim-marrocos',
  'jardim-minas-gerais','jardim-modelo','jardim-monte-alto','jardim-monte-belo',
  'jardim-monte-verde','jardim-morumbi','jardim-nossa-senhora-aparecida',
  'jardim-nova-esperanca','jardim-nova-franca','jardim-novo-horizonte',
  'jardim-olimpia','jardim-oriente','jardim-panorama','jardim-paraiso',
  'jardim-paris','jardim-parque','jardim-paulista','jardim-paulistano',
  'jardim-paz','jardim-pedras','jardim-pereira','jardim-piemonte',
  'jardim-planalto','jardim-primavera','jardim-progresso','jardim-providencia',
  'jardim-real','jardim-recanto','jardim-recreio','jardim-redentor',
  'jardim-residencial','jardim-rio-branco','jardim-riviera','jardim-rosario',
  'jardim-sao-bento','jardim-sao-carlos','jardim-sao-cristovao','jardim-sao-domingos',
  'jardim-sao-francisco','jardim-sao-geraldo','jardim-sao-joao','jardim-sao-jorge',
  'jardim-sao-jose','jardim-sao-lucas','jardim-sao-luiz','jardim-sao-marcos',
  'jardim-sao-mateus','jardim-sao-miguel','jardim-sao-paulo','jardim-sao-pedro',
  'jardim-sao-rafael','jardim-sao-roque','jardim-sao-sebastiao','jardim-sao-vicente',
  'jardim-santa-alice','jardim-santa-ana','jardim-santa-angela','jardim-santa-barbara',
  'jardim-santa-clara','jardim-santa-helena','jardim-santa-lucia','jardim-santa-maria',
  'jardim-santa-rita','jardim-santa-rosa','jardim-saude','jardim-serrano',
  'jardim-sete-de-setembro','jardim-sol-nascente','jardim-sumare','jardim-taquaral',
  'jardim-tiradentes','jardim-tropical','jardim-tupi','jardim-universitario',
  'jardim-urano','jardim-vale-verde','jardim-verde','jardim-vila-nova',
  'jardim-vista-alegre','jardim-vitoria','jardim-vivaldi','jardim-zanetti',
  'loteamento-alto-da-boa-vista','loteamento-das-flores','loteamento-das-palmeiras',
  'loteamento-do-lago','loteamento-esplanada','loteamento-monte-verde',
  'loteamento-parque-das-arvores','loteamento-portal-do-sol','loteamento-primavera',
  'loteamento-recanto-verde','loteamento-solar-das-acaias','loteamento-vale-verde',
  'parque-das-arvores','parque-das-nacoes','parque-industrial','parque-sao-joao',
  'polo-club','polo-club-franca','polo-club-i','polo-club-ii','polo-club-iii',
  'residencial-america','residencial-bela-vista','residencial-brasil',
  'residencial-das-flores','residencial-dos-pinheiros','residencial-esplanada',
  'residencial-europa','residencial-ipanema','residencial-itamaraty',
  'residencial-monte-verde','residencial-nova-franca','residencial-paraiso',
  'residencial-paris','residencial-primavera','residencial-recanto',
  'residencial-rio-verde','residencial-sao-paulo','residencial-serrano',
  'residencial-solar','residencial-taquaral','residencial-verde','residencial-vitoria',
  'sao-jose','sao-jose-i','sao-jose-ii','sao-jose-iii',
  'vila-aparecida','vila-brasil','vila-carvalho','vila-castelo-branco',
  'vila-conceicao','vila-cristina','vila-dos-lavradores','vila-esperanca',
  'vila-formosa','vila-industrial','vila-ipiranga','vila-jardim',
  'vila-jose-bonifacio','vila-lemos','vila-maria','vila-mariana',
  'vila-nova','vila-operaria','vila-paulista','vila-progresso',
  'vila-real','vila-recreio','vila-santa-cruz','vila-santa-luzia',
  'vila-sao-bento','vila-sao-geraldo','vila-sao-jose','vila-sao-pedro',
  'vila-sao-sebastiao','vila-saude','vila-verde',
]

function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // ─── Páginas estáticas principais ──────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: WEB_URL,                                lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${WEB_URL}/imoveis`,                   lastModified: now, changeFrequency: 'hourly',  priority: 0.95 },
    { url: `${WEB_URL}/bairros/franca`,            lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${WEB_URL}/bairros`,                   lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${WEB_URL}/blog`,                      lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${WEB_URL}/corretores`,                lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${WEB_URL}/sobre`,                     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/avaliacao`,                 lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/anunciar`,                  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/financiamentos`,            lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${WEB_URL}/faq`,                       lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${WEB_URL}/contato`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/depoimentos`,               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/equipe`,                    lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/comparar`,                  lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${WEB_URL}/favoritos`,                 lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${WEB_URL}/politica-privacidade`,      lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${WEB_URL}/termos-uso`,                lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // ─── Landing pages de alta prioridade (priority 0.95) ──────────────────────
  const landingPages: MetadataRoute.Sitemap = LANDING_PAGES_HIGH.map(path => ({
    url: `${WEB_URL}${path}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.95,
  }))

  // ─── Páginas de serviços ────────────────────────────────────────────────────
  const servicosPages: MetadataRoute.Sitemap = SERVICOS_PAGES.map(path => ({
    url: `${WEB_URL}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  // ─── Páginas de cidades ─────────────────────────────────────────────────────
  const cityPages: MetadataRoute.Sitemap = CIDADES.map(cidade => ({
    url: `${WEB_URL}/imoveis/em/${cidade}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  // ─── Páginas de bairros de Franca/SP (todas as 472 páginas físicas) ─────────
  const bairrosPages: MetadataRoute.Sitemap = BAIRROS_FRANCA.map(slug => ({
    url: `${WEB_URL}/bairros/franca/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // ─── Bairros dinâmicos do banco (imóveis por bairro) ───────────────────────
  let neighborhoodPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=1000&city=Franca`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      const neighborhoods = new Set<string>()
      ;(data.data ?? []).forEach((p: any) => {
        if (p.neighborhood) neighborhoods.add(p.neighborhood.trim())
      })
      neighborhoodPages = Array.from(neighborhoods).map(bairro => ({
        url: `${WEB_URL}/imoveis/em/franca/${cityToSlug(bairro)}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.82,
      }))
    }
  } catch { /* ignore */ }

  // ─── Imóveis individuais (até 2000) ────────────────────────────────────────
  let propertyPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=2000&page=1`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      propertyPages = (data.data ?? []).map((p: any) => ({
        url: `${WEB_URL}/imoveis/${p.slug}`,
        lastModified: new Date(p.updatedAt ?? now),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }))
    }
  } catch { /* ignore */ }

  // ─── Blog ───────────────────────────────────────────────────────────────────
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?limit=500`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      blogPages = (data.data ?? []).map((p: any) => ({
        url: `${WEB_URL}/blog/${p.slug}`,
        lastModified: new Date(p.publishedAt ?? p.createdAt ?? now),
        changeFrequency: 'monthly' as const,
        priority: 0.65,
      }))
    }
  } catch { /* ignore */ }

  return [
    ...staticPages,
    ...landingPages,
    ...servicosPages,
    ...cityPages,
    ...bairrosPages,
    ...neighborhoodPages,
    ...propertyPages,
    ...blogPages,
  ]
}
