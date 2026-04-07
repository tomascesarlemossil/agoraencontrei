/**
 * Tabela de custas judiciais e cartoriais por estado
 * Usado na calculadora de ROI para dar valores reais ao investidor
 *
 * Fontes:
 * - ITBI: Legislação municipal (varia por cidade, usamos capital como referência)
 * - Registro: Tabela de emolumentos estadual
 * - Escritura: Tabelionato de notas estadual
 */

export interface StateCosts {
  state: string
  itbiRate: number         // % sobre valor de arrematação
  registryEstimate: number // R$ estimativa de registro
  notaryEstimate: number   // R$ estimativa de escritura
  lawyerRate: number       // % honorários advocatícios
  evictionCostMin: number  // R$ custo mínimo desocupação
  evictionCostMax: number  // R$ custo máximo desocupação
  notes: string
}

export const STATE_COSTS: Record<string, StateCosts> = {
  SP: { state: 'SP', itbiRate: 0.03, registryEstimate: 3500, notaryEstimate: 2800, lawyerRate: 0.05, evictionCostMin: 5000, evictionCostMax: 15000, notes: 'ITBI 3% (São Paulo capital). Interior pode variar 2-3%.' },
  RJ: { state: 'RJ', itbiRate: 0.03, registryEstimate: 4000, notaryEstimate: 3200, lawyerRate: 0.05, evictionCostMin: 6000, evictionCostMax: 20000, notes: 'ITBI 3% (Rio de Janeiro capital). Niterói 2%.' },
  MG: { state: 'MG', itbiRate: 0.03, registryEstimate: 3000, notaryEstimate: 2500, lawyerRate: 0.05, evictionCostMin: 4000, evictionCostMax: 12000, notes: 'ITBI 3% (BH). Uberlândia 2.5%.' },
  PR: { state: 'PR', itbiRate: 0.025, registryEstimate: 3200, notaryEstimate: 2600, lawyerRate: 0.05, evictionCostMin: 4000, evictionCostMax: 12000, notes: 'ITBI 2.5% (Curitiba).' },
  RS: { state: 'RS', itbiRate: 0.03, registryEstimate: 3500, notaryEstimate: 2800, lawyerRate: 0.05, evictionCostMin: 5000, evictionCostMax: 15000, notes: 'ITBI 3% (Porto Alegre).' },
  SC: { state: 'SC', itbiRate: 0.02, registryEstimate: 2800, notaryEstimate: 2200, lawyerRate: 0.05, evictionCostMin: 4000, evictionCostMax: 12000, notes: 'ITBI 2% (Florianópolis). Balneário Camboriú 3%.' },
  BA: { state: 'BA', itbiRate: 0.03, registryEstimate: 2500, notaryEstimate: 2000, lawyerRate: 0.05, evictionCostMin: 3000, evictionCostMax: 10000, notes: 'ITBI 3% (Salvador).' },
  PE: { state: 'PE', itbiRate: 0.03, registryEstimate: 2500, notaryEstimate: 2000, lawyerRate: 0.05, evictionCostMin: 3000, evictionCostMax: 10000, notes: 'ITBI 3% (Recife).' },
  CE: { state: 'CE', itbiRate: 0.02, registryEstimate: 2000, notaryEstimate: 1800, lawyerRate: 0.05, evictionCostMin: 2500, evictionCostMax: 8000, notes: 'ITBI 2% (Fortaleza).' },
  GO: { state: 'GO', itbiRate: 0.03, registryEstimate: 2500, notaryEstimate: 2000, lawyerRate: 0.05, evictionCostMin: 3500, evictionCostMax: 10000, notes: 'ITBI 3% (Goiânia).' },
  DF: { state: 'DF', itbiRate: 0.03, registryEstimate: 4000, notaryEstimate: 3500, lawyerRate: 0.05, evictionCostMin: 6000, evictionCostMax: 18000, notes: 'ITBI 3% (Brasília). Custas mais altas do país.' },
  PA: { state: 'PA', itbiRate: 0.02, registryEstimate: 2000, notaryEstimate: 1500, lawyerRate: 0.05, evictionCostMin: 2500, evictionCostMax: 8000, notes: 'ITBI 2% (Belém).' },
  AM: { state: 'AM', itbiRate: 0.02, registryEstimate: 2000, notaryEstimate: 1500, lawyerRate: 0.05, evictionCostMin: 3000, evictionCostMax: 10000, notes: 'ITBI 2% (Manaus).' },
  MA: { state: 'MA', itbiRate: 0.02, registryEstimate: 1800, notaryEstimate: 1500, lawyerRate: 0.05, evictionCostMin: 2000, evictionCostMax: 7000, notes: 'ITBI 2% (São Luís).' },
  MT: { state: 'MT', itbiRate: 0.025, registryEstimate: 2500, notaryEstimate: 2000, lawyerRate: 0.05, evictionCostMin: 3000, evictionCostMax: 10000, notes: 'ITBI 2.5% (Cuiabá).' },
  MS: { state: 'MS', itbiRate: 0.02, registryEstimate: 2500, notaryEstimate: 2000, lawyerRate: 0.05, evictionCostMin: 3000, evictionCostMax: 10000, notes: 'ITBI 2% (Campo Grande).' },
  ES: { state: 'ES', itbiRate: 0.02, registryEstimate: 2500, notaryEstimate: 2000, lawyerRate: 0.05, evictionCostMin: 3500, evictionCostMax: 10000, notes: 'ITBI 2% (Vitória).' },
  RN: { state: 'RN', itbiRate: 0.03, registryEstimate: 2000, notaryEstimate: 1800, lawyerRate: 0.05, evictionCostMin: 2500, evictionCostMax: 8000, notes: 'ITBI 3% (Natal).' },
  PB: { state: 'PB', itbiRate: 0.02, registryEstimate: 1800, notaryEstimate: 1500, lawyerRate: 0.05, evictionCostMin: 2000, evictionCostMax: 7000, notes: 'ITBI 2% (João Pessoa).' },
  AL: { state: 'AL', itbiRate: 0.02, registryEstimate: 1800, notaryEstimate: 1500, lawyerRate: 0.05, evictionCostMin: 2000, evictionCostMax: 7000, notes: 'ITBI 2% (Maceió).' },
  PI: { state: 'PI', itbiRate: 0.02, registryEstimate: 1500, notaryEstimate: 1200, lawyerRate: 0.05, evictionCostMin: 2000, evictionCostMax: 6000, notes: 'ITBI 2% (Teresina).' },
  SE: { state: 'SE', itbiRate: 0.02, registryEstimate: 1800, notaryEstimate: 1500, lawyerRate: 0.05, evictionCostMin: 2000, evictionCostMax: 7000, notes: 'ITBI 2% (Aracaju).' },
  TO: { state: 'TO', itbiRate: 0.02, registryEstimate: 2000, notaryEstimate: 1500, lawyerRate: 0.05, evictionCostMin: 2500, evictionCostMax: 8000, notes: 'ITBI 2% (Palmas).' },
  RO: { state: 'RO', itbiRate: 0.02, registryEstimate: 2000, notaryEstimate: 1500, lawyerRate: 0.05, evictionCostMin: 2500, evictionCostMax: 8000, notes: 'ITBI 2% (Porto Velho).' },
  AC: { state: 'AC', itbiRate: 0.02, registryEstimate: 1500, notaryEstimate: 1200, lawyerRate: 0.05, evictionCostMin: 2000, evictionCostMax: 6000, notes: 'ITBI 2% (Rio Branco).' },
  AP: { state: 'AP', itbiRate: 0.02, registryEstimate: 1500, notaryEstimate: 1200, lawyerRate: 0.05, evictionCostMin: 2000, evictionCostMax: 6000, notes: 'ITBI 2% (Macapá).' },
  RR: { state: 'RR', itbiRate: 0.02, registryEstimate: 1500, notaryEstimate: 1200, lawyerRate: 0.05, evictionCostMin: 2000, evictionCostMax: 6000, notes: 'ITBI 2% (Boa Vista).' },
}

// Fallback para estados não mapeados
const DEFAULT_COSTS: StateCosts = {
  state: 'BR', itbiRate: 0.03, registryEstimate: 2500, notaryEstimate: 2000,
  lawyerRate: 0.05, evictionCostMin: 4000, evictionCostMax: 12000,
  notes: 'Valores médios nacionais. Consulte a legislação local.',
}

export function getStateCosts(state: string): StateCosts {
  return STATE_COSTS[state.toUpperCase()] || DEFAULT_COSTS
}

/**
 * Calcula custos completos de aquisição em leilão
 */
export function calculateAcquisitionCosts(params: {
  bidValue: number
  state: string
  isOccupied: boolean
  needsReform: boolean
  reformEstimate?: number
}): {
  itbi: number
  registry: number
  notary: number
  lawyer: number
  eviction: number
  reform: number
  totalCosts: number
  totalInvestment: number
  costs: StateCosts
} {
  const costs = getStateCosts(params.state)

  const itbi = params.bidValue * costs.itbiRate
  const registry = costs.registryEstimate
  const notary = costs.notaryEstimate
  const lawyer = params.bidValue * costs.lawyerRate
  const eviction = params.isOccupied ? costs.evictionCostMin : 0
  const reform = params.needsReform ? (params.reformEstimate || params.bidValue * 0.1) : 0

  const totalCosts = itbi + registry + notary + lawyer + eviction + reform
  const totalInvestment = params.bidValue + totalCosts

  return { itbi, registry, notary, lawyer, eviction, reform, totalCosts, totalInvestment, costs }
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i)
  let digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (parseInt(cleaned[9]) !== digit) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i)
  digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (parseInt(cleaned[10]) !== digit) return false

  return true
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i]
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (parseInt(cleaned[12]) !== digit) return false

  sum = 0
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i]
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (parseInt(cleaned[13]) !== digit) return false

  return true
}

/**
 * Valida CPF ou CNPJ (detecta automaticamente)
 */
export function validateDocument(doc: string): { valid: boolean; type: 'CPF' | 'CNPJ' | 'INVALID' } {
  const cleaned = doc.replace(/\D/g, '')
  if (cleaned.length === 11) return { valid: validateCPF(cleaned), type: 'CPF' }
  if (cleaned.length === 14) return { valid: validateCNPJ(cleaned), type: 'CNPJ' }
  return { valid: false, type: 'INVALID' }
}
