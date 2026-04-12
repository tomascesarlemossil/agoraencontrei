/**
 * Comparáveis ativos da carteira Lemos — snapshot inicial.
 * Fonte-de-verdade como TS para bundling simples em ambos ambientes.
 */

export interface LemosComparable {
  reference: string
  city: string
  neighborhood: string
  property_type: string
  segment: string
  building?: string
  price_asking: number
  area_private_m2?: number
  bedrooms?: number
  suites?: number
  garage_spaces?: number
  source: string
  status: string
}

export const LEMOS_INVENTORY_COMPARABLES: { comparables: LemosComparable[] } = {
  comparables: [
    {
      reference: 'AP00916',
      city: 'Franca',
      neighborhood: 'Centro',
      property_type: 'apartamento',
      segment: 'economic_old',
      building: 'Banco Sao Paulo',
      price_asking: 260000,
      area_private_m2: 111.11,
      bedrooms: 2,
      suites: 0,
      garage_spaces: 0,
      source: 'inventario_ativo',
      status: 'ativo',
    },
    {
      reference: 'AP00576',
      city: 'Franca',
      neighborhood: 'Centro',
      property_type: 'apartamento',
      segment: 'mid_consolidated',
      building: 'Boulevard',
      price_asking: 473000,
      area_private_m2: 157.19,
      bedrooms: 3,
      suites: 1,
      garage_spaces: 1,
      source: 'inventario_ativo',
      status: 'ativo',
    },
    {
      reference: 'AP00843',
      city: 'Franca',
      neighborhood: 'Centro',
      property_type: 'apartamento',
      segment: 'mid_high_new',
      building: 'Floriano 1680',
      price_asking: 650000,
      area_private_m2: 72.0,
      bedrooms: 2,
      suites: 1,
      garage_spaces: 1,
      source: 'inventario_ativo',
      status: 'ativo',
    },
    {
      reference: 'AP00781',
      city: 'Franca',
      neighborhood: 'Centro',
      property_type: 'apartamento',
      segment: 'high_end',
      building: 'Ibiza',
      price_asking: 1400000,
      area_private_m2: 353.48,
      bedrooms: 4,
      suites: 1,
      garage_spaces: 3,
      source: 'inventario_ativo',
      status: 'ativo',
    },
  ],
}
