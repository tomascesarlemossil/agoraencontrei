/**
 * Clusters SEO para geração programática de URLs
 *
 * Cada cluster define um tipo de página com seus termos, meta templates
 * e schema type. A combinação cluster × cidade gera URLs únicas.
 *
 * Hierarquia de prioridade:
 *   Grupo A (money pages) → publicar primeiro em todas as cidades
 *   Grupo B (apoio comercial) → expandir gradualmente
 *   Grupo C (supply chain) → serviços da construção civil
 *   Grupo D (guias) → conteúdo comparativo e informacional
 */

export interface SEOCluster {
  slug: string
  keyword: string
  titleTemplate: string
  descriptionTemplate: string
  h1Template: string
  /** Grupo de prioridade: A (money), B (apoio), C (supply), D (guias) */
  group: 'A' | 'B' | 'C' | 'D'
  schemaType: string
  relatedClusters: string[]
}

// ── GRUPO A — Páginas Money ─────────────────────────────────────────────────
export const CLUSTERS_GROUP_A: SEOCluster[] = [
  {
    slug: 'imoveis-a-venda',
    keyword: 'Imóveis à Venda',
    titleTemplate: 'Imóveis à Venda em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Encontre imóveis à venda em {CIDADE}/{UF}. Casas, apartamentos, terrenos e lotes com preços atualizados. {POPULACAO} habitantes. Marketplace AgoraEncontrei.',
    h1Template: 'Imóveis à Venda em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['casas-a-venda', 'apartamentos-a-venda', 'terrenos-a-venda', 'leilao-de-imoveis'],
  },
  {
    slug: 'imoveis-para-alugar',
    keyword: 'Imóveis para Alugar',
    titleTemplate: 'Imóveis para Alugar em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Aluguel de imóveis em {CIDADE}/{UF}. Casas e apartamentos para locação com fotos e preços. Marketplace AgoraEncontrei.',
    h1Template: 'Imóveis para Alugar em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['casas-para-alugar', 'apartamentos-para-alugar'],
  },
  {
    slug: 'casas-a-venda',
    keyword: 'Casas à Venda',
    titleTemplate: 'Casas à Venda em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Casas à venda em {CIDADE}/{UF}. Sobrados, térreas e em condomínio fechado. Financiamento facilitado. Marketplace AgoraEncontrei.',
    h1Template: 'Casas à Venda em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['imoveis-a-venda', 'condominio-fechado', 'terrenos-a-venda'],
  },
  {
    slug: 'apartamentos-a-venda',
    keyword: 'Apartamentos à Venda',
    titleTemplate: 'Apartamentos à Venda em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Apartamentos à venda em {CIDADE}/{UF}. Studios, 2 e 3 quartos, coberturas. Marketplace AgoraEncontrei.',
    h1Template: 'Apartamentos à Venda em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['imoveis-a-venda', 'lancamentos-imobiliarios'],
  },
  {
    slug: 'terrenos-a-venda',
    keyword: 'Terrenos à Venda',
    titleTemplate: 'Terrenos à Venda em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Terrenos e lotes à venda em {CIDADE}/{UF}. Em condomínio fechado e loteamentos. Marketplace AgoraEncontrei.',
    h1Template: 'Terrenos à Venda em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['loteamentos', 'condominio-fechado', 'imoveis-a-venda'],
  },
  {
    slug: 'leilao-de-imoveis',
    keyword: 'Leilão de Imóveis',
    titleTemplate: 'Leilão de Imóveis em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Imóveis em leilão em {CIDADE}/{UF}. Casas, apartamentos e terrenos com até 40% de desconto. Leilão Caixa, judicial e extrajudicial.',
    h1Template: 'Leilão de Imóveis em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['imoveis-a-venda', 'investimento-imobiliario'],
  },
  {
    slug: 'imobiliaria',
    keyword: 'Imobiliária',
    titleTemplate: 'Imobiliária em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Encontre a melhor imobiliária em {CIDADE}/{UF}. Compra, venda, aluguel e avaliação de imóveis. Marketplace AgoraEncontrei.',
    h1Template: 'Imobiliária em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'RealEstateAgent',
    relatedClusters: ['corretor-de-imoveis', 'imoveis-a-venda', 'imoveis-para-alugar'],
  },
  {
    slug: 'investimento-imobiliario',
    keyword: 'Investimento Imobiliário',
    titleTemplate: 'Investimento Imobiliário em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Oportunidades de investimento imobiliário em {CIDADE}/{UF}. Imóveis para renda, Airbnb e valorização. PIB per capita R$ {PIB}.',
    h1Template: 'Investimento Imobiliário em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'WebPage',
    relatedClusters: ['leilao-de-imoveis', 'imoveis-a-venda', 'terrenos-a-venda'],
  },
  {
    slug: 'condominio-fechado',
    keyword: 'Condomínio Fechado',
    titleTemplate: 'Condomínio Fechado em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Imóveis em condomínio fechado em {CIDADE}/{UF}. Casas, terrenos e lotes com segurança e lazer completo.',
    h1Template: 'Condomínio Fechado em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['casas-a-venda', 'terrenos-a-venda', 'loteamentos'],
  },
  {
    slug: 'chacaras-e-sitios',
    keyword: 'Chácaras e Sítios',
    titleTemplate: 'Chácaras e Sítios em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Chácaras, sítios e fazendas à venda em {CIDADE}/{UF}. Área total de {AREA}km². Imóveis rurais com preços atualizados.',
    h1Template: 'Chácaras e Sítios em {CIDADE}/{UF}',
    group: 'A',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['terrenos-a-venda', 'investimento-imobiliario'],
  },
]

// ── GRUPO B — Apoio Comercial ───────────────────────────────────────────────
export const CLUSTERS_GROUP_B: SEOCluster[] = [
  {
    slug: 'avaliacao-de-imoveis',
    keyword: 'Avaliação de Imóveis',
    titleTemplate: 'Avaliação de Imóveis em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Avaliação gratuita de imóveis em {CIDADE}/{UF}. Saiba o valor real do seu imóvel com profissionais especializados.',
    h1Template: 'Avaliação de Imóveis em {CIDADE}/{UF}',
    group: 'B',
    schemaType: 'Service',
    relatedClusters: ['imobiliaria', 'imoveis-a-venda'],
  },
  {
    slug: 'financiamento-imobiliario',
    keyword: 'Financiamento Imobiliário',
    titleTemplate: 'Financiamento Imobiliário em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Simulação de financiamento imobiliário em {CIDADE}/{UF}. Caixa, Banco do Brasil, Bradesco. Assessoria completa.',
    h1Template: 'Financiamento Imobiliário em {CIDADE}/{UF}',
    group: 'B',
    schemaType: 'FinancialProduct',
    relatedClusters: ['casas-a-venda', 'apartamentos-a-venda'],
  },
  {
    slug: 'casas-para-alugar',
    keyword: 'Casas para Alugar',
    titleTemplate: 'Casas para Alugar em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Casas para alugar em {CIDADE}/{UF}. Opções em todos os bairros com preços atualizados. Marketplace AgoraEncontrei.',
    h1Template: 'Casas para Alugar em {CIDADE}/{UF}',
    group: 'B',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['imoveis-para-alugar', 'apartamentos-para-alugar'],
  },
  {
    slug: 'apartamentos-para-alugar',
    keyword: 'Apartamentos para Alugar',
    titleTemplate: 'Apartamentos para Alugar em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Apartamentos para alugar em {CIDADE}/{UF}. Studios, kitinets e apartamentos com 1 a 3 quartos.',
    h1Template: 'Apartamentos para Alugar em {CIDADE}/{UF}',
    group: 'B',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['imoveis-para-alugar', 'casas-para-alugar'],
  },
  {
    slug: 'loteamentos',
    keyword: 'Loteamentos',
    titleTemplate: 'Loteamentos em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Loteamentos novos e lotes à venda em {CIDADE}/{UF}. Loteamentos abertos e fechados com infraestrutura completa.',
    h1Template: 'Loteamentos em {CIDADE}/{UF}',
    group: 'B',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['terrenos-a-venda', 'condominio-fechado'],
  },
  {
    slug: 'imoveis-comerciais',
    keyword: 'Imóveis Comerciais',
    titleTemplate: 'Imóveis Comerciais em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Salas comerciais, galpões, lojas e barracões em {CIDADE}/{UF}. Aluguel e venda. {PESSOAL_OCUPADO} postos de trabalho formal.',
    h1Template: 'Imóveis Comerciais em {CIDADE}/{UF}',
    group: 'B',
    schemaType: 'SearchResultsPage',
    relatedClusters: ['imoveis-a-venda', 'investimento-imobiliario'],
  },
]

// ── GRUPO C — Supply Chain (Construção Civil) ───────────────────────────────
export const CLUSTERS_GROUP_C: SEOCluster[] = [
  {
    slug: 'construtora',
    keyword: 'Construtora',
    titleTemplate: 'Construtoras em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Encontre construtoras em {CIDADE}/{UF}. Construção residencial, comercial e industrial. Orçamentos e projetos.',
    h1Template: 'Construtoras em {CIDADE}/{UF}',
    group: 'C',
    schemaType: 'LocalBusiness',
    relatedClusters: ['engenheiro-civil', 'arquiteto', 'reforma-de-imoveis'],
  },
  {
    slug: 'arquiteto',
    keyword: 'Arquiteto',
    titleTemplate: 'Arquitetos em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Arquitetos e escritórios de arquitetura em {CIDADE}/{UF}. Projetos residenciais, comerciais, interiores e paisagismo.',
    h1Template: 'Arquitetos em {CIDADE}/{UF}',
    group: 'C',
    schemaType: 'ProfessionalService',
    relatedClusters: ['engenheiro-civil', 'construtora', 'decoracao-de-interiores'],
  },
  {
    slug: 'engenheiro-civil',
    keyword: 'Engenheiro Civil',
    titleTemplate: 'Engenheiros Civis em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Engenheiros civis em {CIDADE}/{UF}. Projetos estruturais, laudos técnicos, regularização e acompanhamento de obras.',
    h1Template: 'Engenheiros Civis em {CIDADE}/{UF}',
    group: 'C',
    schemaType: 'ProfessionalService',
    relatedClusters: ['construtora', 'arquiteto', 'reforma-de-imoveis'],
  },
  {
    slug: 'reforma-de-imoveis',
    keyword: 'Reforma de Imóveis',
    titleTemplate: 'Reforma de Imóveis em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Serviços de reforma de casas e apartamentos em {CIDADE}/{UF}. Reforma completa, pintura, elétrica, hidráulica e acabamento.',
    h1Template: 'Reforma de Imóveis em {CIDADE}/{UF}',
    group: 'C',
    schemaType: 'Service',
    relatedClusters: ['construtora', 'engenheiro-civil', 'material-de-construcao'],
  },
  {
    slug: 'material-de-construcao',
    keyword: 'Material de Construção',
    titleTemplate: 'Material de Construção em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Lojas de material de construção em {CIDADE}/{UF}. Pisos, revestimentos, tintas, esquadrias e acabamentos.',
    h1Template: 'Material de Construção em {CIDADE}/{UF}',
    group: 'C',
    schemaType: 'LocalBusiness',
    relatedClusters: ['reforma-de-imoveis', 'construtora'],
  },
  {
    slug: 'decoracao-de-interiores',
    keyword: 'Decoração de Interiores',
    titleTemplate: 'Decoração de Interiores em {CIDADE}/{UF} | AgoraEncontrei',
    descriptionTemplate: 'Profissionais de decoração e design de interiores em {CIDADE}/{UF}. Móveis planejados, paisagismo e ambientação.',
    h1Template: 'Decoração de Interiores em {CIDADE}/{UF}',
    group: 'C',
    schemaType: 'ProfessionalService',
    relatedClusters: ['arquiteto', 'reforma-de-imoveis'],
  },
]

// ── GRUPO D — Guias e Comparativos ──────────────────────────────────────────
export const CLUSTERS_GROUP_D: SEOCluster[] = [
  {
    slug: 'melhores-bairros',
    keyword: 'Melhores Bairros',
    titleTemplate: 'Melhores Bairros para Morar em {CIDADE}/{UF} | Guia AgoraEncontrei',
    descriptionTemplate: 'Guia completo dos melhores bairros para morar em {CIDADE}/{UF}. Infraestrutura, segurança, valorização e qualidade de vida.',
    h1Template: 'Melhores Bairros para Morar em {CIDADE}/{UF}',
    group: 'D',
    schemaType: 'Article',
    relatedClusters: ['imoveis-a-venda', 'casas-a-venda', 'investimento-imobiliario'],
  },
  {
    slug: 'custo-metro-quadrado',
    keyword: 'Custo do Metro Quadrado',
    titleTemplate: 'Preço do m² em {CIDADE}/{UF} em 2026 | AgoraEncontrei',
    descriptionTemplate: 'Valor do metro quadrado em {CIDADE}/{UF} atualizado em 2026. Comparativo por bairro e tipo de imóvel. PIB per capita R$ {PIB}.',
    h1Template: 'Preço do Metro Quadrado em {CIDADE}/{UF}',
    group: 'D',
    schemaType: 'Article',
    relatedClusters: ['investimento-imobiliario', 'melhores-bairros'],
  },
  {
    slug: 'como-comprar-imovel-em-leilao',
    keyword: 'Como Comprar Imóvel em Leilão',
    titleTemplate: 'Como Comprar Imóvel em Leilão em {CIDADE}/{UF} | Guia AgoraEncontrei',
    descriptionTemplate: 'Guia passo a passo para comprar imóvel em leilão em {CIDADE}/{UF}. Riscos, documentação e dicas de especialistas.',
    h1Template: 'Como Comprar Imóvel em Leilão em {CIDADE}/{UF}',
    group: 'D',
    schemaType: 'HowTo',
    relatedClusters: ['leilao-de-imoveis', 'investimento-imobiliario'],
  },
]

// ── Exportação consolidada ──────────────────────────────────────────────────
export const ALL_CLUSTERS = [
  ...CLUSTERS_GROUP_A,
  ...CLUSTERS_GROUP_B,
  ...CLUSTERS_GROUP_C,
  ...CLUSTERS_GROUP_D,
]

export const CLUSTERS_MAP: Record<string, SEOCluster> = Object.fromEntries(
  ALL_CLUSTERS.map(c => [c.slug, c])
)
