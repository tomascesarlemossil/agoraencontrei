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
  /** Grupo de prioridade: A (money), B (apoio), C (supply), D (guias), E (produtos modernos) */
  group: 'A' | 'B' | 'C' | 'D' | 'E'
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

// ── GRUPO E — Produtos & Serviços Modernos (SaaS, IA, Mídia, Locação) ────────
// Cobre tudo o que a plataforma oferece além de listagem de imóveis: avaliação por
// IA, imagens/mídia, anúncio inteligente, CRM/automação, gestão de locação e planos.
// Renderizam pela rota /{estado}/{cidade}/servicos/{slug} (schema Service/Offer/SoftwareApplication).
export const CLUSTERS_GROUP_E: SEOCluster[] = [
  // Avaliação & inteligência de preço
  { slug: 'avaliacao-online-de-imovel', keyword: 'Avaliação Online de Imóvel', titleTemplate: 'Avaliação Online de Imóvel em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Avaliação online e gratuita de imóveis em {CIDADE}/{UF} com IA e dados reais de mercado. Saiba o valor em minutos.', h1Template: 'Avaliação Online de Imóvel em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['quanto-vale-meu-imovel', 'preco-do-metro-quadrado'] },
  { slug: 'quanto-vale-meu-imovel', keyword: 'Quanto Vale Meu Imóvel', titleTemplate: 'Quanto Vale Meu Imóvel em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Descubra quanto vale seu imóvel em {CIDADE}/{UF} com avaliação por IA baseada em preços reais da região.', h1Template: 'Quanto Vale Meu Imóvel em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['avaliacao-online-de-imovel', 'preco-do-metro-quadrado'] },
  { slug: 'preco-do-metro-quadrado', keyword: 'Preço do Metro Quadrado', titleTemplate: 'Preço do Metro Quadrado em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Preço do m² em {CIDADE}/{UF} atualizado, por bairro e tipo de imóvel. PIB per capita R$ {PIB}.', h1Template: 'Preço do Metro Quadrado em {CIDADE}/{UF}', group: 'E', schemaType: 'WebPage', relatedClusters: ['avaliacao-online-de-imovel', 'investimento-imobiliario'] },
  // Imagens, mídia & IA visual
  { slug: 'fotos-de-imovel-com-ia', keyword: 'Fotos de Imóvel com IA', titleTemplate: 'Fotos de Imóvel com IA em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Fotos profissionais de imóveis em {CIDADE}/{UF} aprimoradas por inteligência artificial. Anúncios que vendem mais rápido.', h1Template: 'Fotos de Imóvel com IA em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['tour-virtual-360', 'home-staging-virtual'] },
  { slug: 'tour-virtual-360', keyword: 'Tour Virtual 360°', titleTemplate: 'Tour Virtual 360° de Imóveis em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Tour virtual 360° de imóveis em {CIDADE}/{UF}. Visita imersiva online a qualquer hora, de qualquer lugar.', h1Template: 'Tour Virtual 360° em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['fotos-de-imovel-com-ia', 'video-com-drone'] },
  { slug: 'home-staging-virtual', keyword: 'Home Staging Virtual', titleTemplate: 'Home Staging Virtual em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Home staging virtual em {CIDADE}/{UF}: ambientes mobiliados digitalmente por IA para valorizar o anúncio.', h1Template: 'Home Staging Virtual em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['fotos-de-imovel-com-ia', 'planta-humanizada'] },
  { slug: 'video-com-drone', keyword: 'Vídeo com Drone', titleTemplate: 'Vídeo com Drone para Imóveis em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Vídeo e fotografia aérea com drone para imóveis, terrenos e obras em {CIDADE}/{UF}.', h1Template: 'Vídeo com Drone em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['tour-virtual-360', 'fotos-de-imovel-com-ia'] },
  { slug: 'planta-humanizada', keyword: 'Planta Humanizada', titleTemplate: 'Planta Humanizada e Render 3D em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Plantas humanizadas e renders 3D de imóveis em {CIDADE}/{UF} para venda na planta.', h1Template: 'Planta Humanizada em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['home-staging-virtual', 'fotos-de-imovel-com-ia'] },
  // Anúncio, portais & captação
  { slug: 'anuncio-de-imovel-com-ia', keyword: 'Anúncio de Imóvel com IA', titleTemplate: 'Anúncio de Imóvel com IA em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Crie anúncios de imóveis em {CIDADE}/{UF} com textos otimizados por IA para vender mais e ranquear melhor.', h1Template: 'Anúncio de Imóvel com IA em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['divulgar-imovel-nos-portais', 'anunciar-imovel-gratis'] },
  { slug: 'divulgar-imovel-nos-portais', keyword: 'Divulgar Imóvel nos Portais', titleTemplate: 'Divulgar Imóvel em Todos os Portais em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Divulgue seu imóvel em {CIDADE}/{UF} no ZAP, VivaReal, OLX e Facebook com um clique.', h1Template: 'Divulgar Imóvel nos Portais em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['anuncio-de-imovel-com-ia', 'anunciar-imovel-gratis'] },
  { slug: 'anunciar-imovel-gratis', keyword: 'Anunciar Imóvel Grátis', titleTemplate: 'Anunciar Imóvel Grátis em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Anuncie seu imóvel em {CIDADE}/{UF} gratuitamente e alcance milhares de compradores.', h1Template: 'Anunciar Imóvel Grátis em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['divulgar-imovel-nos-portais', 'captacao-de-imoveis'] },
  { slug: 'captacao-de-imoveis', keyword: 'Captação de Imóveis', titleTemplate: 'Captação de Imóveis em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Captação de imóveis para venda e locação em {CIDADE}/{UF}. Ferramentas e parceria para corretores.', h1Template: 'Captação de Imóveis em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['plano-para-corretor', 'crm-imobiliario'] },
  // CRM, automação & IA de atendimento
  { slug: 'crm-imobiliario', keyword: 'CRM Imobiliário', titleTemplate: 'CRM Imobiliário em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'CRM imobiliário completo para corretores e imobiliárias em {CIDADE}/{UF}. Leads, funil e automações em um só lugar.', h1Template: 'CRM Imobiliário em {CIDADE}/{UF}', group: 'E', schemaType: 'SoftwareApplication', relatedClusters: ['automacao-de-leads', 'software-para-imobiliaria'] },
  { slug: 'automacao-de-leads', keyword: 'Automação de Leads', titleTemplate: 'Automação de Leads Imobiliários em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Automação de leads imobiliários em {CIDADE}/{UF}: captura, distribuição e follow-up automático 24h.', h1Template: 'Automação de Leads em {CIDADE}/{UF}', group: 'E', schemaType: 'SoftwareApplication', relatedClusters: ['crm-imobiliario', 'whatsapp-imobiliario'] },
  { slug: 'atendimento-com-ia', keyword: 'Atendimento com IA', titleTemplate: 'Atendimento Imobiliário com IA em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Atendimento com IA para imobiliárias em {CIDADE}/{UF}. Responde e qualifica leads 24 horas no WhatsApp.', h1Template: 'Atendimento com IA em {CIDADE}/{UF}', group: 'E', schemaType: 'SoftwareApplication', relatedClusters: ['whatsapp-imobiliario', 'automacao-de-leads'] },
  { slug: 'whatsapp-imobiliario', keyword: 'WhatsApp Imobiliário', titleTemplate: 'WhatsApp Imobiliário Automático em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'WhatsApp imobiliário automático em {CIDADE}/{UF}: respostas, agendamentos e disparos para sua carteira.', h1Template: 'WhatsApp Imobiliário em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['atendimento-com-ia', 'automacao-de-leads'] },
  { slug: 'funil-de-vendas-imobiliario', keyword: 'Funil de Vendas Imobiliário', titleTemplate: 'Funil de Vendas Imobiliário em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Funil de vendas imobiliário em {CIDADE}/{UF} com etapas, automações e IA para converter mais leads.', h1Template: 'Funil de Vendas Imobiliário em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['crm-imobiliario', 'lead-scoring'] },
  { slug: 'lead-scoring', keyword: 'Lead Scoring com IA', titleTemplate: 'Lead Scoring Imobiliário com IA em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Lead scoring com IA em {CIDADE}/{UF}: a inteligência artificial prioriza os leads mais quentes da sua carteira.', h1Template: 'Lead Scoring com IA em {CIDADE}/{UF}', group: 'E', schemaType: 'SoftwareApplication', relatedClusters: ['funil-de-vendas-imobiliario', 'crm-imobiliario'] },
  // Gestão de locação & financeiro (LemosBank)
  { slug: 'software-para-imobiliaria', keyword: 'Software para Imobiliária', titleTemplate: 'Software para Imobiliária em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Software completo para imobiliárias em {CIDADE}/{UF}: CRM, financeiro, locação, contratos e portais integrados.', h1Template: 'Software para Imobiliária em {CIDADE}/{UF}', group: 'E', schemaType: 'SoftwareApplication', relatedClusters: ['crm-imobiliario', 'gestao-de-aluguel'] },
  { slug: 'gestao-de-aluguel', keyword: 'Gestão de Aluguel', titleTemplate: 'Sistema de Gestão de Aluguel em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Sistema de gestão de aluguel em {CIDADE}/{UF}: contratos, boletos, repasses e reajustes automáticos.', h1Template: 'Gestão de Aluguel em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['gestao-de-locacao', 'cobranca-de-aluguel'] },
  { slug: 'gestao-de-locacao', keyword: 'Gestão de Carteira de Locação', titleTemplate: 'Gestão de Carteira de Locação em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Gestão de carteira de locação em {CIDADE}/{UF}: proprietários, inquilinos, IPTU, seguros e rescisões.', h1Template: 'Gestão de Carteira de Locação em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['gestao-de-aluguel', 'administracao-de-imoveis'] },
  { slug: 'repasse-ao-proprietario', keyword: 'Repasse ao Proprietário', titleTemplate: 'Repasse Automático ao Proprietário em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Repasse automático ao proprietário em {CIDADE}/{UF}: cálculo de comissão, descontos e extrato mensal.', h1Template: 'Repasse ao Proprietário em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['gestao-de-aluguel', 'cobranca-de-aluguel'] },
  { slug: 'cobranca-de-aluguel', keyword: 'Cobrança de Aluguel', titleTemplate: 'Cobrança de Aluguel por Boleto em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Cobrança de aluguel por boleto em {CIDADE}/{UF}: emissão automática, régua de cobrança e baixa automática.', h1Template: 'Cobrança de Aluguel por Boleto em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['gestao-de-aluguel', 'repasse-ao-proprietario'] },
  { slug: 'contrato-digital', keyword: 'Contrato Digital', titleTemplate: 'Contrato Digital com Assinatura Eletrônica em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Contrato digital com assinatura eletrônica em {CIDADE}/{UF}. Validade jurídica, sem cartório.', h1Template: 'Contrato Digital em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['gestao-de-locacao', 'administracao-de-imoveis'] },
  { slug: 'administracao-de-imoveis', keyword: 'Administração de Imóveis', titleTemplate: 'Administração de Imóveis em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Administração de imóveis em {CIDADE}/{UF} para proprietários: locação, manutenção, cobrança e repasse.', h1Template: 'Administração de Imóveis em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['gestao-de-locacao', 'gestao-de-aluguel'] },
  // Planos, assinaturas & parceiros
  { slug: 'plano-para-corretor', keyword: 'Plano para Corretor', titleTemplate: 'Plano para Corretor de Imóveis em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Planos para corretores de imóveis em {CIDADE}/{UF}: anúncios, CRM, IA e divulgação nos portais.', h1Template: 'Plano para Corretor em {CIDADE}/{UF}', group: 'E', schemaType: 'Offer', relatedClusters: ['assinatura-corretor', 'site-para-corretor'] },
  { slug: 'assinatura-corretor', keyword: 'Assinatura Corretor Autônomo', titleTemplate: 'Assinatura para Corretor Autônomo em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Assinatura para o corretor autônomo em {CIDADE}/{UF}: tudo para vender mais sem depender de imobiliária.', h1Template: 'Assinatura Corretor Autônomo em {CIDADE}/{UF}', group: 'E', schemaType: 'Offer', relatedClusters: ['plano-para-corretor', 'site-para-corretor'] },
  { slug: 'plano-para-imobiliaria', keyword: 'Plano para Imobiliária', titleTemplate: 'Plano para Imobiliária em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Planos para imobiliárias em {CIDADE}/{UF}: equipe, carteira de locação, financeiro e portais integrados.', h1Template: 'Plano para Imobiliária em {CIDADE}/{UF}', group: 'E', schemaType: 'Offer', relatedClusters: ['software-para-imobiliaria', 'plano-para-corretor'] },
  { slug: 'site-para-corretor', keyword: 'Site para Corretor', titleTemplate: 'Site para Corretor de Imóveis em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Site profissional para corretor de imóveis em {CIDADE}/{UF} com domínio próprio, vitrine e IA.', h1Template: 'Site para Corretor em {CIDADE}/{UF}', group: 'E', schemaType: 'Service', relatedClusters: ['plano-para-corretor', 'assinatura-corretor'] },
  { slug: 'programa-de-afiliados', keyword: 'Programa de Afiliados', titleTemplate: 'Programa de Afiliados Imobiliário em {CIDADE}/{UF} | AgoraEncontrei', descriptionTemplate: 'Programa de afiliados imobiliário em {CIDADE}/{UF}: indique e ganhe comissão recorrente.', h1Template: 'Programa de Afiliados em {CIDADE}/{UF}', group: 'E', schemaType: 'Offer', relatedClusters: ['seja-um-parceiro', 'plano-para-corretor'] },
  { slug: 'seja-um-parceiro', keyword: 'Seja um Parceiro', titleTemplate: 'Seja um Parceiro AgoraEncontrei em {CIDADE}/{UF}', descriptionTemplate: 'Seja um parceiro AgoraEncontrei em {CIDADE}/{UF}: tecnologia, leads e suporte para crescer suas vendas.', h1Template: 'Seja um Parceiro em {CIDADE}/{UF}', group: 'E', schemaType: 'Offer', relatedClusters: ['programa-de-afiliados', 'plano-para-imobiliaria'] },
]

// ── Exportação consolidada ──────────────────────────────────────────────────
export const ALL_CLUSTERS = [
  ...CLUSTERS_GROUP_A,
  ...CLUSTERS_GROUP_B,
  ...CLUSTERS_GROUP_C,
  ...CLUSTERS_GROUP_D,
  ...CLUSTERS_GROUP_E,
]

export const CLUSTERS_MAP: Record<string, SEOCluster> = Object.fromEntries(
  ALL_CLUSTERS.map(c => [c.slug, c])
)
