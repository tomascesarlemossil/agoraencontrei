/**
 * AgoraEncontrei — Unified Data Lake Types
 *
 * Tipagem forte para todo o pipeline de dados:
 * Apify Scrapers → API → Frontend → SEO Pages
 */

// ── Fontes de dados ────────────────────────────────────────────
export type DataSource = 'CAIXA' | 'SANTANDER' | 'BANCO_DO_BRASIL' | 'BRADESCO' | 'ITAU' | 'ZAP' | 'QUINTOANDAR' | 'IMOVELWEB' | 'LEILOEIRO'

export type RiskStatus = 'Verde' | 'Amarelo' | 'Vermelho'
export type YieldClass = 'EXCELENTE' | 'BOM' | 'MODERADO' | 'BAIXO'
export type OpportunityClass = 'ALTA_LIQUIDEZ' | 'OPORTUNIDADE_OURO' | 'VALORIZACAO'

// ── Imóvel de Leilão (unificado) ────────────────────────────────
export interface AuctionProperty {
  id: string
  source: DataSource
  bankName: string
  city: string
  state: string
  neighborhood: string
  address: string
  price: number
  appraisalValue: number
  discount: number
  financeable: boolean
  fgtsAllowed: boolean
  description: string
  saleType: string
  link: string
  propertyType: string
  bedrooms: number
  totalArea: number
  privateArea: number
  landArea: number
  parkingSpots: number
  coverImageUrl: string | null
  auctionDate: string | null
  leiloeiro: string | null
  edital: string | null
  propertyNumber: string | null
  fotos: string[]
}

// ── Oportunidade com cruzamento de dados ─────────────────────────
export interface AuctionOpportunity extends AuctionProperty {
  yieldMensal: number
  yieldAnual: number
  spreadVsMarket: number
  estimatedRent: number
  marketPrice: number
  classification: OpportunityClass
  statusRisco: RiskStatus
  paybackAnos: number
  autossustentavel: boolean
}

// ── Referência de preço de mercado ───────────────────────────────
export interface MarketPriceRef {
  city: string
  neighborhood: string | null
  avgPricePerSqm: number
  avgPrice: number
  medianPrice: number
  sampleSize: number
  source: 'ZAP' | 'QUINTOANDAR' | 'IMOVELWEB'
  listingType: 'sale' | 'rent' | 'all'
}

// ── Referência de aluguel ────────────────────────────────────────
export interface RentalPriceRef {
  city: string
  neighborhood: string | null
  avgRentPerSqm: number
  avgRent: number
  sampleSize: number
  source: 'QUINTOANDAR' | 'ZAP'
}

// ── Cidade com dados IBGE + yield ────────────────────────────────
export interface CityYieldProfile {
  cidade: string
  estado: string
  slug: string
  populacao: number
  pib: number
  idhm: number
  precoMedioLeilao: number
  aluguelMedio: number
  yieldAnual: number
  paybackAnos: number
  spreadVsMercado: number
  totalImoveisLeilao: number
  precoM2Leilao: number
  precoM2Mercado: number
  classificacao: YieldClass
}

// ── Bloco de conteúdo dinâmico para SEO ──────────────────────────
export interface DynamicContentBlock {
  type: 'mercado' | 'oportunidade' | 'infraestrutura' | 'comparacao' | 'risco'
  title: string
  content: string
  source: string
  dataPoints: Record<string, string | number>
}

// ── Página SEO programática ──────────────────────────────────────
export interface SEOPageData {
  slug: string
  title: string
  description: string
  h1: string
  cidade: string
  estado: string
  bairro?: string
  blocks: DynamicContentBlock[]
  auctions: AuctionProperty[]
  marketRef: MarketPriceRef | null
  rentalRef: RentalPriceRef | null
  schema: Record<string, unknown> // JSON-LD
}

// ── Stats da API /auctions ──────────────────────────────────────
export interface AuctionStats {
  total: number
  updatedAt: string
  source: string
  sources: string[]
  bySource: Array<{ source: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
  averageDiscount: number
  topCities: Array<{ city: string; count: number }>
}

// ── Response shapes ─────────────────────────────────────────────
export interface AuctionsResponse {
  total: number
  updatedAt: string
  source: string
  items: AuctionProperty[]
}

export interface OpportunitiesResponse {
  total: number
  showing: number
  updatedAt: string
  items: AuctionOpportunity[]
}
