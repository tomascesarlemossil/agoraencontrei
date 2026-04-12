/**
 * Conhecimento local de Franca/SP — fonte-de-verdade do Tomás.
 * Originalmente um JSON, agora exportado como const TS para bundling
 * robusto em ambos Fastify (Node ESM) e Next.js (webpack).
 */

export interface FrancaLocalKnowledge {
  metadata: {
    system_name: string
    version: string
    city_focus: string
    last_update: string
    data_policy: {
      active_listing_is_not_closed_price: boolean
      construction_cost_is_not_final_market_value: boolean
      single_citywide_m2_forbidden: boolean
    }
  }
  identity: {
    agent_name: string
    persona: string
    human_origin: string
    legacy: {
      company: string
      founder: string
      foundation_year: number
      city: string
    }
    mission: string
    voice: { style: string; avoid: string[] }
  }
  market_snapshot: {
    city: string
    reference_period: string
    sales_trend_pct: number
    rent_trend_pct: number
    same_asking_price_sales_pct: number
    dominant_type: string
    notes: string[]
  }
  market_behavior: {
    crecisp_franca: Array<{
      period: string
      sales_variation_pct: number
      rent_variation_pct: number
      houses_sales_pct: number
      apartments_sales_pct: number
      same_asking_price_sales_pct?: number
      urban_outer_regions_sales_pct?: number
      notes: string[]
    }>
  }
  submarkets: {
    Centro: {
      heterogeneous: boolean
      description: string
      segments: {
        apartments: Record<string, { observed_price_range_brl: [number, number] }>
      }
    }
    condominios_premium: string[]
    loteamentos_entrada: string[]
  }
  terrain_submarkets: Record<
    string,
    { type: string; observed_examples: Array<{ area_m2: number; price_brl: number }> }
  >
  technical_costs: {
    sinapi_jan_2026_brl_m2: number
    itbi_franca_rate: number
    rule: string
  }
  evaluation_rules: {
    never_use_single_citywide_m2: boolean
    always_classify_type_and_submarket: boolean
    confidence_levels: { high: string; medium: string; low: string }
    response_requirements: string[]
  }
}

export const FRANCA_LOCAL_KNOWLEDGE: FrancaLocalKnowledge = {
  metadata: {
    system_name: 'Tomas',
    version: '1.0.0',
    city_focus: 'Franca/SP e região',
    last_update: '2026-04-12',
    data_policy: {
      active_listing_is_not_closed_price: true,
      construction_cost_is_not_final_market_value: true,
      single_citywide_m2_forbidden: true,
    },
  },
  identity: {
    agent_name: 'Tomás',
    persona: 'Inteligência imobiliária local da AgoraEncontrei',
    human_origin: 'Baseado na experiência de Tomas Lemos',
    legacy: {
      company: 'Imobiliária Lemos',
      founder: 'Noemia Lemos',
      foundation_year: 2002,
      city: 'Franca/SP',
    },
    mission: 'Proteger o patrimônio do cliente através de dados reais de Franca e região.',
    voice: {
      style: 'local, humano, técnico, confiável',
      avoid: ['respostas genéricas', 'falsa precisão', 'arrogância', 'chute de valor'],
    },
  },
  market_snapshot: {
    city: 'Franca/SP',
    reference_period: '2026-02',
    sales_trend_pct: -16.59,
    rent_trend_pct: 13.33,
    same_asking_price_sales_pct: 55.6,
    dominant_type: 'Casas (58%)',
    notes: [
      'Mercado comprador mais cauteloso',
      'Locações em alta',
      '57,9% das vendas nas demais regiões urbanas',
    ],
  },
  market_behavior: {
    crecisp_franca: [
      {
        period: '2025-10',
        sales_variation_pct: -15.34,
        rent_variation_pct: -57.26,
        houses_sales_pct: 40,
        apartments_sales_pct: 60,
        notes: [
          'Forte peso de imóveis até R$ 200 mil',
          '91,3% das vendas em periferia',
          '72% das vendas via Caixa',
        ],
      },
      {
        period: '2025-02',
        sales_variation_pct: 46.67,
        rent_variation_pct: -16.27,
        houses_sales_pct: 77,
        apartments_sales_pct: 23,
        notes: ['Predominância de casas', 'Faixa de venda até R$ 200 mil'],
      },
      {
        period: '2026-02',
        sales_variation_pct: -16.59,
        rent_variation_pct: 13.33,
        houses_sales_pct: 58,
        apartments_sales_pct: 42,
        same_asking_price_sales_pct: 55.6,
        urban_outer_regions_sales_pct: 57.9,
        notes: ['Mercado mais cauteloso nas vendas', 'Locações em recuperação'],
      },
    ],
  },
  submarkets: {
    Centro: {
      heterogeneous: true,
      description:
        'Centro de Franca deve ser dividido por edifício, metragem, padrão e idade do produto.',
      segments: {
        apartments: {
          economic_old: { observed_price_range_brl: [260000, 350000] },
          mid_consolidated: { observed_price_range_brl: [473000, 600000] },
          mid_high_new: { observed_price_range_brl: [650000, 1000000] },
          high_end: { observed_price_range_brl: [1400000, 1600000] },
        },
      },
    },
    condominios_premium: [
      'Gaia',
      'Veredas de Franca',
      'Residencial Olivito',
      'Villa Piemonte',
      'Villa Di Capri',
    ],
    loteamentos_entrada: ['Reserva Abaeté', 'Atlanta Park', 'Parque das Esmeraldas'],
  },
  terrain_submarkets: {
    Gaia: {
      type: 'condominio_premium',
      observed_examples: [
        { area_m2: 399.7, price_brl: 600000 },
        { area_m2: 413.82, price_brl: 580000 },
        { area_m2: 593.94, price_brl: 653334 },
        { area_m2: 683.88, price_brl: 752268 },
        { area_m2: 849.3, price_brl: 934230 },
      ],
    },
    Veredas_de_Franca: {
      type: 'condominio_alto_padrao',
      observed_examples: [{ area_m2: 324.32, price_brl: 570000 }],
    },
    Residencial_Tellini: {
      type: 'bairro_custo_beneficio',
      observed_examples: [
        { area_m2: 292.14, price_brl: 280000 },
        { area_m2: 353.81, price_brl: 360000 },
      ],
    },
    Reserva_Abaete: {
      type: 'entrada_loteamento',
      observed_examples: [
        { area_m2: 160.0, price_brl: 145000 },
        { area_m2: 189.74, price_brl: 165000 },
        { area_m2: 198.97, price_brl: 205000 },
        { area_m2: 234.68, price_brl: 240000 },
      ],
    },
    Villaggio_San_Rafaello: {
      type: 'lote_ampliado_chacara',
      observed_examples: [
        { area_m2: 2500.0, price_brl: 500000 },
        { area_m2: 2500.0, price_brl: 550000 },
      ],
    },
    Parque_Universitario_Villa_Di_Capri: {
      type: 'condominio_urbano_premium',
      observed_examples: [
        { area_m2: 377.83, price_brl: 680000 },
        { area_m2: 379.0, price_brl: 600000 },
      ],
    },
  },
  technical_costs: {
    sinapi_jan_2026_brl_m2: 1920.74,
    itbi_franca_rate: 0.02,
    rule: 'Custos técnicos servem como apoio de plausibilidade e reposição, nunca como valor final absoluto de mercado.',
  },
  evaluation_rules: {
    never_use_single_citywide_m2: true,
    always_classify_type_and_submarket: true,
    confidence_levels: {
      high: '5+ comparáveis muito similares na mesma micro-região',
      medium: '2-4 comparáveis próximos ou similares',
      low: 'Produto raro, poucos comparáveis ou base insuficiente',
    },
    response_requirements: [
      'faixa de anúncio compatível',
      'faixa de fechamento provável',
      'grau de confiança',
      'justificativa',
      'aviso de que a base pode ser anúncio ativo e não fechamento',
    ],
  },
}
