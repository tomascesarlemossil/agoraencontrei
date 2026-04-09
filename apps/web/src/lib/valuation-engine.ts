/**
 * Valuation Engine — Motor de Avaliação Inteligente de Imóveis
 *
 * 3 Metodologias: Comparativa, Custo, Capitalização de Renda
 * 3 Valores: Mercado (máximo), Bancário (conservador), Realista (venda rápida)
 * Detecção de anomalias + score de confiança
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PropertyInput {
  type: 'HOUSE' | 'APARTMENT' | 'LAND' | 'STORE' | 'FARM' | 'WAREHOUSE'
  city: string
  neighborhood: string
  state: string
  area: number
  bedrooms: number
  bathrooms: number
  parkingSpaces: number
  yearBuilt: number
  condition: 'EXCELLENT' | 'GOOD' | 'REGULAR' | 'POOR'
  standard: 'LUXURY' | 'HIGH' | 'NORMAL' | 'SIMPLE'
  hasClosedCondo: boolean
  condoFee: number
  monthlyRent: number   // 0 se não alugado / não sabe
  currentPrice: number  // 0 se não definido
}

export interface Comparable {
  id: string
  title: string
  city: string
  neighborhood: string
  price: number
  pricePerM2: number
  area: number
  bedrooms: number
  status: 'ACTIVE' | 'SOLD' | 'RENTED'
  publishedAt: string
  similarity: number // 0-100
}

export interface ValuationAdjustment {
  factor: string
  description: string
  percent: number      // +/- percentage
  amount: number       // R$ impact
}

export interface MethodResult {
  name: string
  value: number
  weight: number
  details: string
}

export interface PriceAnomaly {
  priceDifference: number
  percentDifference: number
  isOverpriced: boolean
  isUnderpriced: boolean
  recommendation: string
}

export interface PricingStrategy {
  scenario: string
  price: number
  timeframeDays: string
  discount: number
}

export interface ValuationResult {
  // 3 Core Values
  marketValue: number       // Valor de mercado (máximo)
  bankValue: number         // Valor bancário (conservador)
  realisticValue: number    // Valor venda rápida (30 dias)

  // Per-m2 values
  marketPerM2: number
  bankPerM2: number
  realisticPerM2: number

  // Spread
  negotiationRange: { min: number; max: number; spread: number }

  // Methods
  methods: MethodResult[]

  // Comparables
  comparables: Comparable[]
  comparablesCount: number

  // Adjustments applied
  adjustments: ValuationAdjustment[]

  // Confidence
  confidence: number // 0-100
  confidenceFactors: { factor: string; impact: 'positive' | 'negative'; detail: string }[]

  // Anomaly detection
  anomaly: PriceAnomaly | null

  // Pricing strategy
  pricingStrategy: PricingStrategy[]

  // Valuation over time estimate (appreciation)
  yearlyAppreciation: number // %
}

// ─── Construction Cost Reference (SINAPI + CUB) ────────────────────────────

const CONSTRUCTION_COST_PER_M2: Record<string, number> = {
  LUXURY: 3200,
  HIGH: 2400,
  NORMAL: 1850,
  SIMPLE: 1400,
}

const LAND_VALUE_PER_M2: Record<string, number> = {
  // Capitais & cidades maiores
  'São Paulo': 800,
  'Rio de Janeiro': 700,
  'Curitiba': 400,
  'Belo Horizonte': 350,
  'Campinas': 350,
  'Goiânia': 300,
  'Salvador': 250,
  // Cidades médias
  'Franca': 200,
  'Ribeirão Preto': 350,
  'São José dos Campos': 400,
  'Santos': 500,
  'Praia Grande': 300,
  DEFAULT: 200,
}

// Location premiums by neighborhood pattern
const LOCATION_FACTORS: Record<string, number> = {
  'Centro': 1.18,
  'Jardim': 1.08,
  'Vila': 1.0,
  'Parque': 1.05,
  'Residencial': 1.10,
  'Condomínio': 1.15,
  DEFAULT: 1.0,
}

// Cap rates by city tier
const CAP_RATES: Record<string, number> = {
  'Franca': 0.0675,
  'Ribeirão Preto': 0.065,
  'São Paulo': 0.055,
  'Campinas': 0.06,
  'Curitiba': 0.06,
  DEFAULT: 0.065,
}

// ─── Core Valuation Functions ───────────────────────────────────────────────

/**
 * Método Comparativo de Mercado
 * Baseia-se em imóveis similares (comparables) para estimar o valor
 */
export function comparativeMethod(
  property: PropertyInput,
  comparables: Comparable[],
): { value: number; adjustments: ValuationAdjustment[] } {
  if (comparables.length === 0) {
    return { value: 0, adjustments: [] }
  }

  // Weight comparables by similarity + recency + transaction type
  let totalWeightedPrice = 0
  let totalWeight = 0

  for (const comp of comparables) {
    const similarityWeight = comp.similarity / 100
    const daysSince = Math.max(1, (Date.now() - new Date(comp.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
    const recencyWeight = Math.max(0.5, 1 - (daysSince / 365))
    const typeWeight = comp.status === 'SOLD' ? 1.0 : comp.status === 'RENTED' ? 0.85 : 0.8

    const weight = similarityWeight * recencyWeight * typeWeight
    totalWeightedPrice += comp.pricePerM2 * property.area * weight
    totalWeight += weight
  }

  const baseValue = totalWeight > 0 ? totalWeightedPrice / totalWeight : 0

  // Apply adjustments
  const adjustments: ValuationAdjustment[] = []

  // Location adjustment
  const locationFactor = getLocationFactor(property.neighborhood)
  if (locationFactor !== 1.0) {
    const pct = (locationFactor - 1) * 100
    adjustments.push({
      factor: 'Localização',
      description: `Bairro ${property.neighborhood} (${pct > 0 ? 'premium' : 'periférico'})`,
      percent: round(pct),
      amount: round(baseValue * (locationFactor - 1)),
    })
  }

  // Condition adjustment
  const conditionFactors: Record<string, number> = {
    EXCELLENT: 0.05, GOOD: 0, REGULAR: -0.05, POOR: -0.12,
  }
  const condPct = (conditionFactors[property.condition] || 0) * 100
  if (condPct !== 0) {
    adjustments.push({
      factor: 'Estado de conservação',
      description: property.condition === 'EXCELLENT' ? 'Excelente — acima da média' : property.condition === 'POOR' ? 'Necessita reforma' : 'Regular',
      percent: round(condPct),
      amount: round(baseValue * conditionFactors[property.condition]),
    })
  }

  // Age adjustment (newer = premium)
  const age = new Date().getFullYear() - (property.yearBuilt || 2000)
  if (age < 3) {
    adjustments.push({ factor: 'Imóvel novo', description: `Construído em ${property.yearBuilt}`, percent: 3, amount: round(baseValue * 0.03) })
  } else if (age > 25) {
    const agePenalty = Math.min(age * 0.3, 8) // max 8%
    adjustments.push({ factor: 'Idade', description: `${age} anos de construção`, percent: round(-agePenalty), amount: round(-baseValue * agePenalty / 100) })
  }

  // Condo premium
  if (property.hasClosedCondo) {
    adjustments.push({ factor: 'Condomínio fechado', description: 'Segurança e infraestrutura', percent: 3, amount: round(baseValue * 0.03) })
  }

  // Parking premium (above 1)
  if (property.parkingSpaces > 1) {
    const parkPct = (property.parkingSpaces - 1) * 2
    adjustments.push({ factor: 'Vagas extras', description: `${property.parkingSpaces} vagas de garagem`, percent: parkPct, amount: round(baseValue * parkPct / 100) })
  }

  // Calculate final
  const totalAdjustment = adjustments.reduce((sum, a) => sum + a.amount, 0)
  const finalValue = baseValue + totalAdjustment

  return { value: round(finalValue), adjustments }
}

/**
 * Método de Custo (Reprodução)
 * Quanto custaria construir o imóvel hoje, menos depreciação
 */
export function costMethod(property: PropertyInput): number {
  const landValuePerM2 = LAND_VALUE_PER_M2[property.city] || LAND_VALUE_PER_M2.DEFAULT
  const constructionCost = CONSTRUCTION_COST_PER_M2[property.standard] || CONSTRUCTION_COST_PER_M2.NORMAL

  // Land
  const landArea = property.type === 'APARTMENT' ? property.area * 0.3 : property.area
  const landValue = landArea * landValuePerM2

  // Construction
  const builtValue = property.area * constructionCost

  // Depreciation by age (Ross-Heidecke simplified)
  const age = Math.max(0, new Date().getFullYear() - (property.yearBuilt || 2000))
  const usefulLife = property.standard === 'LUXURY' ? 70 : property.standard === 'HIGH' ? 60 : 50
  const depreciationRate = Math.min((age / usefulLife) * 0.8, 0.5) // Max 50%

  // Condition multiplier
  const conditionMultiplier: Record<string, number> = {
    EXCELLENT: 0.95, GOOD: 1.0, REGULAR: 1.1, POOR: 1.25,
  }
  const effectiveDepreciation = depreciationRate * (conditionMultiplier[property.condition] || 1.0)
  const depreciation = builtValue * effectiveDepreciation

  // Location premium
  const locationFactor = getLocationFactor(property.neighborhood)

  // Standard adjustment
  const standardAdj: Record<string, number> = {
    LUXURY: 0.15, HIGH: 0.08, NORMAL: 0, SIMPLE: -0.10,
  }

  const rawValue = landValue + builtValue - depreciation
  const adjustedValue = rawValue * locationFactor * (1 + (standardAdj[property.standard] || 0))

  return round(Math.max(adjustedValue, 0))
}

/**
 * Método de Capitalização de Renda
 * Valor = NOI / Cap Rate
 */
export function incomeMethod(property: PropertyInput): number | null {
  if (property.monthlyRent <= 0) return null

  const annualRent = property.monthlyRent * 12
  const vacancyRate = 0.12 // 12% average
  const effectiveRent = annualRent * (1 - vacancyRate)
  const capRate = CAP_RATES[property.city] || CAP_RATES.DEFAULT

  return round(effectiveRent / capRate)
}

/**
 * Reconciliar 3 métodos com pesos ponderados
 */
export function reconcileMethods(
  comparative: number,
  cost: number,
  income: number | null,
): { finalValue: number; methods: MethodResult[]; confidence: number } {
  const methods: MethodResult[] = []
  let totalValue = 0
  let totalWeight = 0

  // Comparative: 50% (most reliable for used properties)
  if (comparative > 0) {
    methods.push({ name: 'Comparativa', value: comparative, weight: 0.5, details: 'Baseado em imóveis similares vendidos/anunciados' })
    totalValue += comparative * 0.5
    totalWeight += 0.5
  }

  // Cost: 20% (less reliable for used properties)
  if (cost > 0) {
    methods.push({ name: 'Custo', value: cost, weight: 0.2, details: 'Custo de reprodução menos depreciação' })
    totalValue += cost * 0.2
    totalWeight += 0.2
  }

  // Income: 30% (only if rent data available)
  if (income && income > 0) {
    methods.push({ name: 'Renda', value: income, weight: 0.3, details: 'Capitalização do aluguel pelo cap rate do mercado' })
    totalValue += income * 0.3
    totalWeight += 0.3
  }

  const finalValue = totalWeight > 0 ? round(totalValue / totalWeight) : 0

  // Confidence: based on convergence of methods
  const values = methods.map(m => m.value).filter(v => v > 0)
  let confidence = 50 // base

  if (values.length >= 2) {
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const coeffVar = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) / mean
    confidence = Math.max(20, Math.round(100 * (1 - Math.min(0.3, coeffVar))))
  }

  // Bonus for 3 methods
  if (values.length >= 3) confidence = Math.min(100, confidence + 10)

  return { finalValue, methods, confidence }
}

/**
 * Valor Bancário (haircut conservador)
 */
export function calculateBankValue(marketValue: number, property: PropertyInput): number {
  let haircut = 0.89 // Base: 11% desconto

  // Additional risk discounts
  if (property.condition === 'POOR') haircut *= 0.95
  if (property.condition === 'REGULAR') haircut *= 0.98
  if (property.type === 'FARM' || property.type === 'WAREHOUSE') haircut *= 0.95 // Menos líquidos

  return round(marketValue * haircut)
}

/**
 * Valor Realista de Venda (venda em 30 dias)
 */
export function calculateRealisticValue(marketValue: number, property: PropertyInput): number {
  let discount = 0.92 // Base: 8% para venda em 30 dias

  // Type adjustment
  if (property.type === 'APARTMENT') discount *= 0.97  // Aptos demoram mais
  if (property.type === 'HOUSE') discount *= 0.99       // Casas vendem mais rápido

  // Condition
  if (property.condition === 'POOR') discount *= 0.95
  if (property.condition === 'REGULAR') discount *= 0.98

  return round(marketValue * discount)
}

/**
 * Detectar anomalia de preço
 */
export function detectAnomaly(currentPrice: number, marketValue: number): PriceAnomaly | null {
  if (currentPrice <= 0 || marketValue <= 0) return null

  const diff = currentPrice - marketValue
  const pctDiff = (diff / marketValue) * 100

  return {
    priceDifference: round(diff),
    percentDifference: round(pctDiff),
    isOverpriced: pctDiff > 10,
    isUnderpriced: pctDiff < -10,
    recommendation: pctDiff > 20
      ? `Super-avaliado em ${Math.round(pctDiff)}%. Negociar para ${formatBRL(marketValue)}.`
      : pctDiff > 10
        ? `Ligeiramente acima do mercado. Valor justo: ${formatBRL(marketValue)}.`
        : pctDiff < -20
          ? `Oportunidade! ${Math.round(Math.abs(pctDiff))}% abaixo do mercado.`
          : pctDiff < -10
            ? `Bom preço — ${Math.round(Math.abs(pctDiff))}% abaixo do mercado.`
            : 'Preço alinhado com o mercado.',
  }
}

/**
 * Estratégia de precificação
 */
export function buildPricingStrategy(marketValue: number): PricingStrategy[] {
  return [
    { scenario: 'Preço cheio (esperar)', price: round(marketValue), timeframeDays: '60-90', discount: 0 },
    { scenario: 'Venda em 30 dias', price: round(marketValue * 0.93), timeframeDays: '30-45', discount: 7 },
    { scenario: 'Venda urgente', price: round(marketValue * 0.85), timeframeDays: '7-15', discount: 15 },
    { scenario: 'Valor para financiamento', price: round(marketValue * 0.89), timeframeDays: 'N/A', discount: 11 },
  ]
}

// ─── Main Valuation Function ────────────────────────────────────────────────

export function runValuation(
  property: PropertyInput,
  comparables: Comparable[],
): ValuationResult {
  // 1. Run 3 methods
  const { value: compValue, adjustments } = comparativeMethod(property, comparables)
  const costValue = costMethod(property)
  const incomeValue = incomeMethod(property)

  // 2. Reconcile
  const { finalValue: marketValue, methods, confidence: baseConfidence } = reconcileMethods(compValue, costValue, incomeValue)

  // 3. Derived values
  const bankValue = calculateBankValue(marketValue, property)
  const realisticValue = calculateRealisticValue(marketValue, property)

  // 4. Confidence factors
  const confidenceFactors: ValuationResult['confidenceFactors'] = []

  if (comparables.length >= 10) {
    confidenceFactors.push({ factor: 'Comparáveis abundantes', impact: 'positive', detail: `${comparables.length} imóveis similares encontrados` })
  } else if (comparables.length >= 5) {
    confidenceFactors.push({ factor: 'Comparáveis adequados', impact: 'positive', detail: `${comparables.length} imóveis similares` })
  } else if (comparables.length > 0) {
    confidenceFactors.push({ factor: 'Poucos comparáveis', impact: 'negative', detail: `Apenas ${comparables.length} imóvel(is) similar(es)` })
  } else {
    confidenceFactors.push({ factor: 'Sem comparáveis', impact: 'negative', detail: 'Avaliação baseada apenas em métodos de custo e renda' })
  }

  if (incomeValue && incomeValue > 0) {
    confidenceFactors.push({ factor: 'Dados de aluguel', impact: 'positive', detail: 'Método de renda confirma avaliação' })
  }

  const methodValues = methods.map(m => m.value).filter(v => v > 0)
  if (methodValues.length >= 2) {
    const mean = methodValues.reduce((s, v) => s + v, 0) / methodValues.length
    const maxDev = Math.max(...methodValues.map(v => Math.abs(v - mean) / mean))
    if (maxDev < 0.15) {
      confidenceFactors.push({ factor: 'Convergência dos métodos', impact: 'positive', detail: `Desvio máximo: ${(maxDev * 100).toFixed(1)}%` })
    } else {
      confidenceFactors.push({ factor: 'Divergência entre métodos', impact: 'negative', detail: `Desvio: ${(maxDev * 100).toFixed(1)}% — verificar dados` })
    }
  }

  // Adjust confidence
  let confidence = baseConfidence
  if (comparables.length < 3) confidence = Math.min(confidence, 60)
  if (comparables.length === 0) confidence = Math.min(confidence, 40)

  // 5. Anomaly
  const anomaly = detectAnomaly(property.currentPrice, marketValue)

  // 6. Pricing strategy
  const pricingStrategy = buildPricingStrategy(marketValue)

  // 7. Estimated appreciation
  const yearlyAppreciation = 5.5 // IPCA + premium regional médio

  return {
    marketValue,
    bankValue,
    realisticValue,
    marketPerM2: property.area > 0 ? round(marketValue / property.area) : 0,
    bankPerM2: property.area > 0 ? round(bankValue / property.area) : 0,
    realisticPerM2: property.area > 0 ? round(realisticValue / property.area) : 0,
    negotiationRange: {
      min: realisticValue,
      max: marketValue,
      spread: marketValue > 0 ? round(((marketValue - realisticValue) / marketValue) * 100) : 0,
    },
    methods,
    comparables: comparables.slice(0, 5), // top 5 for display
    comparablesCount: comparables.length,
    adjustments,
    confidence,
    confidenceFactors,
    anomaly,
    pricingStrategy,
    yearlyAppreciation,
  }
}

// ─── Similarity Calculator ──────────────────────────────────────────────────

export function calculateSimilarity(property: PropertyInput, comparable: {
  area: number; bedrooms: number; neighborhood: string; type: string; city: string
}): number {
  let score = 100

  // Area difference (most important)
  const areaDiff = Math.abs(property.area - comparable.area) / Math.max(property.area, 1)
  score -= Math.min(areaDiff * 100, 40) // Max 40pt penalty

  // Bedroom difference
  const bedroomDiff = Math.abs(property.bedrooms - comparable.bedrooms)
  score -= bedroomDiff * 8 // 8pt per bedroom difference

  // Same neighborhood = bonus
  if (comparable.neighborhood?.toLowerCase() !== property.neighborhood?.toLowerCase()) {
    score -= 10
  }

  // Same type
  if (comparable.type !== property.type) {
    score -= 15
  }

  // Same city (required but check)
  if (comparable.city?.toLowerCase() !== property.city?.toLowerCase()) {
    score -= 25
  }

  return Math.max(0, Math.round(score))
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getLocationFactor(neighborhood: string): number {
  if (!neighborhood) return 1.0
  const lower = neighborhood.toLowerCase()
  for (const [pattern, factor] of Object.entries(LOCATION_FACTORS)) {
    if (pattern === 'DEFAULT') continue
    if (lower.includes(pattern.toLowerCase())) return factor
  }
  return LOCATION_FACTORS.DEFAULT
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(value)
}
