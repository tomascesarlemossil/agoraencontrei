/**
 * Lemos Inventory Comparables
 * Internal sold/active data from Imobiliária Lemos — used by Tomás for CMA (Comparative Market Analysis)
 */

export interface ComparableProperty {
  id: string
  type: 'apartment' | 'house' | 'commercial' | 'land' | 'rural'
  neighborhood: string
  city: string
  area: number // m² útil
  bedrooms?: number
  bathrooms?: number
  parkingSpots?: number
  askingPrice: number
  soldPrice?: number        // null = ainda anunciado
  soldDate?: string         // YYYY-MM format
  pricePerSqm: number       // R$/m² (usando preço de fechamento se disponível)
  status: 'active' | 'sold' | 'rented'
  notes?: string
}

/**
 * Sample comparables from Lemos active/recent transactions.
 * In production, Tomás calls the buscar_imoveis tool for live data.
 * These are used as baseline when the tool returns no results.
 */
export const LEMOS_COMPARABLES: ComparableProperty[] = [
  // --- Premium ---
  {
    id: 'CMP-001',
    type: 'house',
    neighborhood: 'Jardim Petráglia',
    city: 'Franca',
    area: 280,
    bedrooms: 4,
    bathrooms: 3,
    parkingSpots: 2,
    askingPrice: 1_650_000,
    soldPrice: 1_550_000,
    soldDate: '2025-01',
    pricePerSqm: 5536,
    status: 'sold',
    notes: 'Alto padrão, piscina, churrasqueira',
  },
  {
    id: 'CMP-002',
    type: 'house',
    neighborhood: 'Village Damha I',
    city: 'Franca',
    area: 320,
    bedrooms: 4,
    bathrooms: 4,
    parkingSpots: 3,
    askingPrice: 2_200_000,
    pricePerSqm: 6875,
    status: 'active',
    notes: 'Condomínio fechado, segurança 24h',
  },
  // --- Tradicional ---
  {
    id: 'CMP-003',
    type: 'apartment',
    neighborhood: 'Centro',
    city: 'Franca',
    area: 95,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 1,
    askingPrice: 420_000,
    soldPrice: 395_000,
    soldDate: '2024-11',
    pricePerSqm: 4158,
    status: 'sold',
    notes: 'Andar alto, vista parcial cidade',
  },
  {
    id: 'CMP-004',
    type: 'house',
    neighborhood: 'Jardim Califórnia',
    city: 'Franca',
    area: 180,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 2,
    askingPrice: 850_000,
    pricePerSqm: 4722,
    status: 'active',
  },
  {
    id: 'CMP-005',
    type: 'commercial',
    neighborhood: 'Centro',
    city: 'Franca',
    area: 120,
    askingPrice: 680_000,
    pricePerSqm: 5667,
    status: 'active',
    notes: 'Loja térrea, frente para Rua Major Nicácio',
  },
  // --- Crescimento ---
  {
    id: 'CMP-006',
    type: 'house',
    neighborhood: 'Villa do Bosque',
    city: 'Franca',
    area: 140,
    bedrooms: 3,
    bathrooms: 2,
    parkingSpots: 2,
    askingPrice: 530_000,
    soldPrice: 510_000,
    soldDate: '2025-02',
    pricePerSqm: 3643,
    status: 'sold',
  },
  {
    id: 'CMP-007',
    type: 'land',
    neighborhood: 'Jardim Luíza',
    city: 'Franca',
    area: 250,
    askingPrice: 180_000,
    pricePerSqm: 720,
    status: 'active',
    notes: 'Terreno plano, documentação ok',
  },
  // --- Popular ---
  {
    id: 'CMP-008',
    type: 'house',
    neighborhood: 'Jardim Consolação',
    city: 'Franca',
    area: 90,
    bedrooms: 2,
    bathrooms: 1,
    parkingSpots: 1,
    askingPrice: 210_000,
    soldPrice: 195_000,
    soldDate: '2024-12',
    pricePerSqm: 2167,
    status: 'sold',
    notes: 'Excelente para renda — aluguel ~R$ 1.200/mês',
  },
]

/**
 * Confidence rules for CMA — Tomás must follow these when quoting values.
 */
export const CMA_CONFIDENCE_RULES = {
  minimumComparables: 3,
  maxAgeMonths: 12,
  discountFromAsking: { min: 0.05, max: 0.12 }, // 5-12%
  message: {
    lowConfidence: 'Tenho poucos comparáveis neste submercado. Posso fazer uma análise preliminar, mas recomendo uma avaliação formal para precisão.',
    highConfidence: 'Com base em {n} transações recentes similares neste bairro, minha estimativa é:',
  },
}
