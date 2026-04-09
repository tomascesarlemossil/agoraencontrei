/**
 * SEO Internal Linking Engine
 *
 * Generates contextual internal links for 1M+ pages.
 * Strategy: circular linking between nearby cities, related neighborhoods,
 * and cross-type pages (leilão → aluguel → comparação → bairro).
 *
 * Google needs internal links to discover and rank pages.
 * Each page links to 8-12 related pages for maximum crawl efficiency.
 */

// ── Slugify ────────────────────────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ── Link Types ────────────────────────────────────────────────
export interface SEOLink {
  label: string
  url: string
  type: 'cidade' | 'bairro' | 'comparacao' | 'leilao' | 'cluster' | 'oportunidade'
  priority: number // 0 = highest
}

// ── Nearby Cities Map (IBGE adjacency) ──────────────────────────
const NEARBY_CITIES: Record<string, string[]> = {
  'franca': ['batatais', 'cristais-paulista', 'patrocinio-paulista', 'itirapua', 'restinga', 'jeriquara', 'pedregulho', 'altinopolis', 'brodowski', 'nuporanga'],
  'ribeirao-preto': ['cravinhos', 'serrana', 'sertaozinho', 'brodowski', 'jardinopolis', 'dumont', 'guatapara', 'pontal', 'barrinha', 'pradopolis'],
  'campinas': ['valinhos', 'vinhedo', 'sumare', 'hortolandia', 'indaiatuba', 'paulinia', 'americana', 'jundiai', 'itatiba', 'monte-mor'],
  'sao-paulo': ['guarulhos', 'osasco', 'santo-andre', 'sao-bernardo-do-campo', 'diadema', 'maua', 'carapicuiba', 'barueri', 'cotia', 'taboao-da-serra'],
  'goiania': ['aparecida-de-goiania', 'trindade', 'senador-canedo', 'goianira', 'neropolios', 'anapolis', 'inhumas', 'bela-vista-de-goias'],
  'curitiba': ['sao-jose-dos-pinhais', 'colombo', 'araucaria', 'pinhais', 'campo-largo', 'almirante-tamandare', 'fazenda-rio-grande', 'piraquara'],
  'belo-horizonte': ['contagem', 'betim', 'nova-lima', 'santa-luzia', 'ribeiro-das-neves', 'sabara', 'ibirite', 'vespasiano'],
  'salvador': ['lauro-de-freitas', 'camacari', 'simoes-filho', 'candeias', 'dias-davila', 'vera-cruz', 'itaparica'],
  'santos': ['guaruja', 'sao-vicente', 'praia-grande', 'cubatao', 'bertioga', 'mongagua', 'itanhaem', 'peruibe'],
  'sao-jose-dos-campos': ['jacarei', 'taubate', 'cacapava', 'pindamonhangaba', 'caraguatatuba', 'campos-do-jordao', 'atibaia'],
}

// ── Franca neighborhoods ────────────────────────────────────────
const BAIRROS_FRANCA = [
  'centro', 'jardim-petraglia', 'residencial-zanetti', 'city-petropolis',
  'jardim-luiza', 'parque-dos-lima', 'vila-santa-cruz', 'jardim-francano',
  'sao-jose', 'santa-rita', 'vila-aparecida', 'aeroporto',
  'prolongamento-jardim-petraglia', 'leporace', 'brasilandia',
]

// ── Ribeirão Preto neighborhoods ────────────────────────────────
const BAIRROS_RIBEIRAO = [
  'jardim-botanico', 'alto-da-boa-vista', 'ribeirania', 'nova-alianca',
  'santa-cruz-do-jose-jacques', 'centro', 'campos-eliseos', 'lagoinha',
  'vila-virginia', 'ipiranga', 'jardim-independencia', 'vila-seixas',
]

// ── SEO Clusters (high-value keywords) ──────────────────────────
const CLUSTERS = [
  { slug: 'leilao-caixa', label: 'Leilão Caixa' },
  { slug: 'leilao-santander', label: 'Leilão Santander' },
  { slug: 'imoveis-abaixo-avaliacao', label: 'Imóveis Abaixo da Avaliação' },
  { slug: 'investimento-imobiliario', label: 'Investimento Imobiliário' },
  { slug: 'leilao-apartamento', label: 'Leilão de Apartamentos' },
  { slug: 'leilao-casa', label: 'Leilão de Casas' },
  { slug: 'leilao-terreno', label: 'Leilão de Terrenos' },
  { slug: 'como-comprar-imovel-leilao', label: 'Como Comprar em Leilão' },
]

/**
 * Get nearby city links for a given city.
 */
export function getNearbyCityLinks(citySlug: string, estado: string, limit = 8): SEOLink[] {
  const nearby = NEARBY_CITIES[citySlug] || []
  return nearby.slice(0, limit).map((slug, i) => ({
    label: `Leilões em ${slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
    url: `/${estado.toLowerCase()}/${slug}/leiloes`,
    type: 'cidade' as const,
    priority: i,
  }))
}

/**
 * Get neighborhood links for a city.
 */
export function getBairroLinks(citySlug: string, estado: string, limit = 6): SEOLink[] {
  let bairros: string[] = []
  if (citySlug === 'franca') bairros = BAIRROS_FRANCA
  else if (citySlug === 'ribeirao-preto') bairros = BAIRROS_RIBEIRAO

  return bairros.slice(0, limit).map((bairro, i) => ({
    label: `Imóveis no ${bairro.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
    url: `/${estado.toLowerCase()}/${citySlug}/bairro/${bairro}`,
    type: 'bairro' as const,
    priority: i,
  }))
}

/**
 * Get comparison links (city vs city).
 */
export function getComparisonLinks(citySlug: string, estado: string, limit = 4): SEOLink[] {
  const nearby = NEARBY_CITIES[citySlug] || []
  const cityName = citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return nearby.slice(0, limit).map((slug, i) => {
    const otherName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    return {
      label: `${cityName} vs ${otherName}`,
      url: `/comparar/${citySlug}-vs-${slug}`,
      type: 'comparacao' as const,
      priority: i + 10,
    }
  })
}

/**
 * Get cluster/category links.
 */
export function getClusterLinks(limit = 4): SEOLink[] {
  return CLUSTERS.slice(0, limit).map((cluster, i) => ({
    label: cluster.label,
    url: `/s/${cluster.slug}`,
    type: 'cluster' as const,
    priority: i + 20,
  }))
}

/**
 * Generate complete footer links for a page.
 * Returns 8-12 links covering all link types for maximum SEO impact.
 */
export function generateFooterLinks(citySlug: string, estado: string): SEOLink[] {
  const links: SEOLink[] = [
    ...getNearbyCityLinks(citySlug, estado, 4),
    ...getBairroLinks(citySlug, estado, 3),
    ...getComparisonLinks(citySlug, estado, 2),
    ...getClusterLinks(3),
  ]

  // Add opportunity page link
  links.push({
    label: 'Melhores Cidades para Investir',
    url: '/oportunidades/melhores-alugueis-brasil',
    type: 'oportunidade',
    priority: 30,
  })

  return links.sort((a, b) => a.priority - b.priority).slice(0, 12)
}
