/**
 * Franca/SP Local Market Knowledge
 * Source: AgoraEncontrei internal market research — Imobiliária Lemos
 * Updated: 2025-Q4
 */

export interface BairroData {
  name: string
  tier: 'premium' | 'tradicional' | 'crescimento' | 'popular'
  priceRangeMin: number // R$/m²
  priceRangeMax: number // R$/m²
  characteristics: string[]
  references?: string[]
}

export interface SubmarketData {
  id: string
  label: string
  bairros: BairroData[]
  avgRentYield: { residential: string; commercial: string }
  notes: string[]
}

export const FRANCA_SUBMARKETS: SubmarketData[] = [
  {
    id: 'premium',
    label: 'Premium / Alto Padrão',
    bairros: [
      {
        name: 'Jardim Petráglia',
        tier: 'premium',
        priceRangeMin: 5000,
        priceRangeMax: 8000,
        characteristics: ['casas grandes', 'lotes amplos', 'perfil familia alto padrão'],
      },
      {
        name: 'City Petrópolis',
        tier: 'premium',
        priceRangeMin: 5500,
        priceRangeMax: 8500,
        characteristics: ['residencial exclusivo', 'proximidade ao polo industrial'],
      },
      {
        name: 'Vila Santos Dumont',
        tier: 'premium',
        priceRangeMin: 5000,
        priceRangeMax: 7500,
        characteristics: ['bairro consolidado', 'perfil sênior e famílias tradicionais'],
      },
      {
        name: 'Residencial Amazonas',
        tier: 'premium',
        priceRangeMin: 5500,
        priceRangeMax: 7800,
        characteristics: ['condomínios fechados', 'alto adensamento de lançamentos'],
      },
    ],
    avgRentYield: { residential: '0.45% a.m.', commercial: '0.85% a.m.' },
    notes: [
      'Condominios Village Damha I/II/III lideram em valor de revenda',
      'Portal dos Bandeirantes, Quinta dos Ventos, Reserva Bonsucesso são referências',
      'Ticket médio de venda: R$ 1.2M–2.5M',
    ],
  },
  {
    id: 'tradicional',
    label: 'Tradicional / Bem Estabelecido',
    bairros: [
      {
        name: 'Centro',
        tier: 'tradicional',
        priceRangeMin: 3500,
        priceRangeMax: 5500,
        characteristics: ['alta liquidez', 'comercio consolidado', 'perfil misto residencial-comercial'],
        references: ['Rua Major Nicácio', 'Praça Tonico Saudade', 'calçadão'],
      },
      {
        name: 'Vila Chico Júlio',
        tier: 'tradicional',
        priceRangeMin: 3800,
        priceRangeMax: 5200,
        characteristics: ['perfil familiar', 'próximo hospitais (HB, Santa Casa)'],
      },
      {
        name: 'Jardim Paulistano',
        tier: 'tradicional',
        priceRangeMin: 3500,
        priceRangeMax: 5000,
        characteristics: ['boa infraestrutura', 'escolas particulares'],
      },
      {
        name: 'Jardim Califórnia',
        tier: 'tradicional',
        priceRangeMin: 4000,
        priceRangeMax: 5800,
        characteristics: ['valorizado', 'perfil investidor', 'próximo Franca Shopping'],
        references: ['Franca Shopping', 'Av. Dr. Hélio Palermo'],
      },
      {
        name: 'Vila Aparecida',
        tier: 'tradicional',
        priceRangeMin: 3500,
        priceRangeMax: 4800,
        characteristics: ['bairro tradicional', 'boa liquidez para aluguel'],
      },
    ],
    avgRentYield: { residential: '0.50% a.m.', commercial: '0.90% a.m.' },
    notes: [
      'Centro: salas comerciais com alta demanda de locação (0.8-1.0% a.m.)',
      'Prazo médio de venda: 60–90 dias quando bem precificado',
    ],
  },
  {
    id: 'crescimento',
    label: 'Crescimento Acelerado',
    bairros: [
      {
        name: 'Jardim Palma',
        tier: 'crescimento',
        priceRangeMin: 2500,
        priceRangeMax: 4000,
        characteristics: ['novos lançamentos', 'infraestrutura em expansão'],
      },
      {
        name: 'Villa do Bosque',
        tier: 'crescimento',
        priceRangeMin: 3000,
        priceRangeMax: 4500,
        characteristics: ['condomínios horizontais', 'perfil jovem família'],
      },
      {
        name: 'Recanto Elíseos',
        tier: 'crescimento',
        priceRangeMin: 2800,
        priceRangeMax: 4200,
        characteristics: ['bairro planejado', 'potencial valorização'],
      },
      {
        name: 'Jardim Luíza',
        tier: 'crescimento',
        priceRangeMin: 2600,
        priceRangeMax: 3800,
        characteristics: ['crescimento acelerado', 'próximo ao Gaia/UNIFRAN'],
      },
      {
        name: 'Jardim Francano',
        tier: 'crescimento',
        priceRangeMin: 2500,
        priceRangeMax: 3800,
        characteristics: ['boa acessibilidade', 'demanda por lotes'],
      },
    ],
    avgRentYield: { residential: '0.55% a.m.', commercial: '0.75% a.m.' },
    notes: [
      'Alto potencial de valorização 3-5 anos',
      'Terrenos com demanda crescente para construtoras',
      'Região do Gaia (UNIFRAN): alta demanda estudantil',
    ],
  },
  {
    id: 'popular',
    label: 'Popular / Alta Liquidez de Aluguel',
    bairros: [
      {
        name: 'Jardim Consolação',
        tier: 'popular',
        priceRangeMin: 1800,
        priceRangeMax: 3000,
        characteristics: ['alta demanda por aluguel', 'rentabilidade acima da média'],
      },
      {
        name: 'Vila Nova',
        tier: 'popular',
        priceRangeMin: 2000,
        priceRangeMax: 3200,
        characteristics: ['localização central', 'alta rotatividade de locação'],
      },
      {
        name: 'Jardim Independência',
        tier: 'popular',
        priceRangeMin: 1900,
        priceRangeMax: 3000,
        characteristics: ['boa infraestrutura de transporte público'],
      },
      {
        name: 'Cidade Nova',
        tier: 'popular',
        priceRangeMin: 1800,
        priceRangeMax: 2800,
        characteristics: ['programa MCMV', 'investidor buy-to-rent'],
      },
    ],
    avgRentYield: { residential: '0.60% a.m.', commercial: '0.70% a.m.' },
    notes: [
      'Ideal para investidores buscando yield com menor capital inicial',
      'Rentabilidade residencial supera a média da cidade neste segmento',
    ],
  },
]

export const FRANCA_MARKET_FACTS = {
  city: 'Franca/SP',
  population: 360000,
  economicBase: 'calçados, couro, agronegócio, saúde',
  itbiRate: '2% sobre valor venal ou transação (o maior)',
  avgSaleDays: {
    wellPriced: '60–120 dias',
    overpriced: '180+ dias',
  },
  financingInstitutions: ['CEF (Casa Verde/Amarela)', 'BB', 'Bradesco', 'Itaú', 'Santander', 'SICOOB', 'Bext'],
  cartoriosRGI: ['1º Ofício de Registro de Imóveis de Franca', '2º Ofício de Registro de Imóveis de Franca'],
  localReferences: {
    shoppings: ['Franca Shopping', 'Franca Outlet'],
    hospitals: ['Hospital de Base (HB)', 'Santa Casa de Franca'],
    universities: ['UNIFRAN (campus Gaia)', 'USP-Franca (Direito)'],
    avenues: ['Av. Major Nicácio', 'Av. Dr. Hélio Palermo', 'Av. Frederico Moura'],
  },
}

/** Franca-specific anti-hallucination rules for Tomás */
export const FRANCA_VALUATION_RULES = [
  'NUNCA use um único m² isolado para estimar valor — sempre cruze pelo menos 3 comparáveis do mesmo bairro e tipologia',
  'NUNCA trate preço pedido (anúncio) como preço de fechamento — desconto médio em Franca é 5-12%',
  'NUNCA confunda número de CRECISP com preço ou código de imóvel',
  'Ao avaliar terreno, sempre informe se é esquina, testada, topografia e zoneamento municipal',
  'Para leilões: desconto judicial típico é 30-50% sobre avaliação, mas exige análise de débitos, ônus e prazo de desocupação',
  'Região do Gaia (UNIFRAN) = mercado estudantil distinto — kitnets e repúblicas têm dinâmica própria',
]
