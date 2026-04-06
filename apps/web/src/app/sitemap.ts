import type { MetadataRoute } from 'next'

// CORRIGIDO: domínio padrão é agoraencontrei.com.br
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Cidades atendidas
const CIDADES = [
  'franca', 'rifaina', 'cristais-paulista', 'patrocinio-paulista',
  'ribeirao-preto', 'pedregulho', 'itirapua', 'delfinopolis',
  'capitolio', 'cassia', 'ibiraci', 'capetinga', 'sacramento', 'restinga',
]

// Landing pages de tipo + finalidade (alta prioridade)
const LANDING_PAGES = [
  '/casas-para-alugar-franca-sp',
  '/casas-a-venda-franca-sp',
  '/apartamentos-para-alugar-franca-sp',
  '/apartamentos-a-venda-franca-sp',
  '/terrenos-a-venda-franca-sp',
  '/imoveis-comerciais-franca-sp',
  '/chacaras-franca-sp',
  '/galpoes-franca-sp',
  '/imoveis-franca-sp',
  '/aluguel-imoveis-franca-sp',
  '/venda-imoveis-franca-sp',
  '/leilao-imoveis-franca-sp',
  '/reforma-imoveis-franca-sp',
  '/engenharia-franca-sp',
  '/arquitetura-franca-sp',
  '/financiamento-imovel-franca-sp',
  '/avaliacao-imovel-franca-sp',
]

// Bairros de Franca/SP (gerados estaticamente)
const BAIRROS_FRANCA = [
  'jardim-america','jardim-paulista','centro','jardim-botanico','jardim-california',
  'jardim-redentor','jardim-floresta','jardim-universitario','jardim-nova-franca',
  'jardim-sao-jose','jardim-sao-paulo','jardim-sao-pedro','jardim-sao-sebastiao',
  'jardim-sao-francisco','jardim-sao-joao','jardim-santa-rita','jardim-santa-rosa',
  'jardim-santa-lucia','jardim-santa-maria','jardim-santa-helena','jardim-santa-clara',
  'jardim-santa-barbara','jardim-santa-ana','jardim-santa-alice','jardim-santa-angela',
  'jardim-consolacao','jardim-eldorado','jardim-ipiranga','jardim-italia',
  'jardim-aeroporto','jardim-alvorada','jardim-aurora','jardim-bela-vista',
  'jardim-boa-esperanca','jardim-boa-vista','jardim-brasil','jardim-campestre',
  'jardim-canaa','jardim-carvalho','jardim-castelo','jardim-caxambu',
  'jardim-cerejeiras','jardim-coleginho','jardim-copacabana','jardim-das-acaias',
  'jardim-das-flores','jardim-das-oliveiras','jardim-das-rosas','jardim-das-violetas',
  'jardim-diamante','jardim-dos-pinheiros','jardim-dos-ipes','jardim-esplanada',
  'jardim-europa','jardim-formosa','jardim-fortaleza','jardim-girassol',
  'jardim-gloria','jardim-guanabara','jardim-imperial','jardim-independencia',
  'jardim-ipanema','jardim-jaragua','jardim-jequitiba','jardim-lagoa',
  'jardim-leblon','jardim-leonor','jardim-liberdade','jardim-lourdes',
  'jardim-maravilha','jardim-marcia','jardim-maristela','jardim-marrocos',
  'jardim-minas-gerais','jardim-modelo','jardim-monte-alto','jardim-monte-belo',
  'jardim-monte-verde','jardim-morumbi','jardim-nossa-senhora-aparecida',
  'jardim-nova-esperanca','jardim-novo-horizonte','jardim-olimpia','jardim-oriente',
  'jardim-panorama','jardim-paraiso','jardim-paris','jardim-parque',
  'jardim-paulistano','jardim-paz','jardim-pedras','jardim-pereira',
  'jardim-petrópolis','jardim-piemonte','jardim-planalto','jardim-primavera',
  'jardim-progresso','jardim-providencia','jardim-real','jardim-recanto',
  'jardim-recreio','jardim-residencial','jardim-rio-branco','jardim-riviera',
  'jardim-rosario','jardim-sao-bento','jardim-sao-carlos','jardim-sao-cristovao',
  'jardim-sao-domingos','jardim-sao-geraldo','jardim-sao-jorge','jardim-sao-lucas',
  'jardim-sao-luiz','jardim-sao-marcos','jardim-sao-mateus','jardim-sao-miguel',
  'jardim-sao-rafael','jardim-sao-roque','jardim-sao-vicente','jardim-saude',
  'jardim-serrano','jardim-sete-de-setembro','jardim-sol-nascente','jardim-sumare',
  'jardim-taquaral','jardim-tiradentes','jardim-tropical','jardim-tupi',
  'jardim-urano','jardim-vale-verde','jardim-verde','jardim-vila-nova',
  'jardim-vista-alegre','jardim-vitoria','jardim-vivaldi','jardim-zanetti',
  'vila-aparecida','vila-brasil','vila-carvalho','vila-castelo-branco',
  'vila-conceicao','vila-cristina','vila-dos-lavradores','vila-esperanca',
  'vila-formosa','vila-industrial','vila-ipiranga','vila-jardim',
  'vila-jose-bonifacio','vila-lemos','vila-maria','vila-mariana',
  'vila-nova','vila-operaria','vila-paulista','vila-progresso',
  'vila-real','vila-recreio','vila-santa-cruz','vila-santa-luzia',
  'vila-sao-bento','vila-sao-geraldo','vila-sao-jose','vila-sao-pedro',
  'vila-sao-sebastiao','vila-saude','vila-verde','parque-das-arvores',
  'parque-das-nacoes','parque-industrial','parque-sao-joao','residencial-america',
  'residencial-bela-vista','residencial-brasil','residencial-das-flores',
  'residencial-dos-pinheiros','residencial-esplanada','residencial-europa',
  'residencial-ipanema','residencial-itamaraty','residencial-monte-verde',
  'residencial-nova-franca','residencial-paraiso','residencial-paris',
  'residencial-primavera','residencial-recanto','residencial-rio-verde',
  'residencial-sao-paulo','residencial-serrano','residencial-solar',
  'residencial-taquaral','residencial-verde','residencial-vitoria',
  'condominio-alto-da-boa-vista','condominio-das-flores','condominio-das-palmeiras',
  'condominio-do-lago','condominio-esplanada','condominio-monte-verde',
  'condominio-parque-das-arvores','condominio-portal-do-sol','condominio-primavera',
  'condominio-recanto-verde','condominio-residencial-das-flores',
  'condominio-solar-das-acaias','condominio-vale-verde','condominio-verde-vale',
  'bairro-alto','bairro-brasil','bairro-industrial','bairro-novo',
  'bairro-paulista','bairro-sao-jose','bairro-sao-pedro','bairro-sao-sebastiao',
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

  // Páginas estáticas principais
  const staticPages: MetadataRoute.Sitemap = [
    { url: WEB_URL,                                         lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${WEB_URL}/imoveis`,                           lastModified: now, changeFrequency: 'hourly',  priority: 0.95 },
    { url: `${WEB_URL}/blog`,                              lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${WEB_URL}/bairros`,                           lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${WEB_URL}/corretores`,                        lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/sobre`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/avaliacao`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/anunciar`,                          lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${WEB_URL}/financiamentos`,                    lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${WEB_URL}/contato`,                           lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/faq`,                               lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/depoimentos`,                       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/favoritos`,                         lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${WEB_URL}/comparar`,                          lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${WEB_URL}/servicos`,                          lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${WEB_URL}/servicos/2via-boleto`,              lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${WEB_URL}/servicos/extrato-proprietario`,     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${WEB_URL}/servicos/fichas-cadastrais`,        lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    // Novas páginas de serviços SEO
    { url: `${WEB_URL}/servicos/fotos-imoveis`,            lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${WEB_URL}/servicos/edicao-fotos`,             lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${WEB_URL}/servicos/video-imoveis`,            lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${WEB_URL}/servicos/avaliacao-imoveis`,        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${WEB_URL}/servicos/leilao-imoveis`,           lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${WEB_URL}/servicos/investimento-imobiliario`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${WEB_URL}/servicos/reforma-imoveis`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/servicos/engenharia-construcao`,    lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    // Página índice de bairros
    { url: `${WEB_URL}/bairros/franca`,                    lastModified: now, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${WEB_URL}/politica-privacidade`,              lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${WEB_URL}/termos-uso`,                        lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Landing pages de tipo + finalidade (alta prioridade SEO)
  const landingPages: MetadataRoute.Sitemap = LANDING_PAGES.map(path => ({
    url: `${WEB_URL}${path}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // Páginas de cidades
  const cityPages: MetadataRoute.Sitemap = CIDADES.map(cidade => ({
    url: `${WEB_URL}/imoveis/em/${cidade}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  // Páginas de bairros estáticos de Franca/SP
  const bairrosPages: MetadataRoute.Sitemap = BAIRROS_FRANCA.map(slug => ({
    url: `${WEB_URL}/bairros/franca/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Páginas de imóveis individuais
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

  // Páginas de bairros dinâmicos (busca bairros únicos do banco)
  let neighborhoodPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=500&city=Franca&status=ACTIVE`, {
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
        priority: 0.8,
      }))
    }
  } catch { /* ignore */ }

  // Blog
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
    ...cityPages,
    ...bairrosPages,
    ...neighborhoodPages,
    ...propertyPages,
    ...blogPages,
  ]
}
