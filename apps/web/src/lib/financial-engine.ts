/**
 * Financial Engine — Motor de Cálculos Financeiros Avançados
 *
 * NPV, IRR, DCF, Cap Rate, WACC, Projeção Multi-Ano,
 * Monte Carlo, Stress Testing, Análise de Sensibilidade
 *
 * Superando qualquer calculadora imobiliária do Brasil (QuintoAndar, ZAP, Loft)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InvestmentParams {
  bidValue: number
  appraisalValue: number
  monthlyRent: number
  totalAcquisitionCosts: number // ITBI + registro + escritura + advogado + desocupação + reforma
  state: string
  isOccupied: boolean
  needsReform: boolean
  reformCost: number
  propertyType?: string
  area?: number
}

export interface MacroRates {
  selic: number       // ex: 14.25 (%)
  ipca: number        // ex: 4.5 (%)
  igpm: number        // ex: 5.0 (%)
  cdi: number         // ex: 14.15 (%)
  tr: number          // ex: 2.0 (%)
  poupanca: number    // ex: 7.5 (%)
  financingRate: number // ex: 9.5 (%) — taxa média de financiamento imobiliário
}

export interface CashFlow {
  year: number
  grossRent: number         // aluguel bruto anual
  vacancy: number           // perda por vacância
  maintenance: number       // custos manutenção
  propertyTax: number       // IPTU
  insurance: number         // seguro
  management: number        // taxa administração
  netOperatingIncome: number // NOI
  appreciation: number      // valorização do imóvel
  equityValue: number       // valor patrimonial acumulado
  cumulativeCashFlow: number
  cumulativeReturn: number  // retorno acumulado %
}

export interface DCFResult {
  npv: number
  irr: number
  paybackYears: number
  cashFlows: CashFlow[]
  totalReturn: number       // retorno total %
  annualizedReturn: number  // retorno anualizado %
  capRate: number
  cashOnCash: number        // retorno sobre capital investido
  grossYield: number
  netYield: number
  equityMultiple: number
  breakEvenMonth: number
}

export interface ScenarioResult {
  name: string
  label: string
  color: string
  npv: number
  irr: number
  paybackYears: number
  totalReturn: number
  annualizedReturn: number
  cashFlows: CashFlow[]
}

export interface SensitivityPoint {
  variable: string
  variation: number   // ex: -20, -10, 0, +10, +20 (%)
  npv: number
  irr: number
  totalReturn: number
}

export interface MonteCarloResult {
  simulations: number
  mean: { npv: number; irr: number; totalReturn: number }
  median: { npv: number; irr: number; totalReturn: number }
  stdDev: { npv: number; irr: number; totalReturn: number }
  percentile5: { npv: number; irr: number; totalReturn: number }
  percentile25: { npv: number; irr: number; totalReturn: number }
  percentile75: { npv: number; irr: number; totalReturn: number }
  percentile95: { npv: number; irr: number; totalReturn: number }
  probabilityPositiveNPV: number
  probabilityAboveSelic: number
  distribution: { bucket: number; count: number }[]
}

export interface StressTestResult {
  scenario: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  npv: number
  irr: number
  totalReturn: number
  survives: boolean    // investimento sobrevive ao cenário?
  impactPercent: number // impacto vs cenário base
}

export interface PortfolioAsset {
  id: string
  name: string
  city: string
  state: string
  investedAmount: number
  currentValue: number
  monthlyRent: number
  capRate: number
  irr: number
  weight: number       // peso no portfólio (%)
}

export interface PortfolioAnalysis {
  totalInvested: number
  totalCurrentValue: number
  totalMonthlyRent: number
  portfolioReturn: number
  weightedCapRate: number
  weightedIRR: number
  diversificationScore: number // 0-100
  assets: PortfolioAsset[]
  cityConcentration: Record<string, number>
  stateConcentration: Record<string, number>
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

// ─── Default Macro Rates (fallback when BCB unavailable) ────────────────────

export const DEFAULT_MACRO_RATES: MacroRates = {
  selic: 14.25,
  ipca: 4.5,
  igpm: 5.0,
  cdi: 14.15,
  tr: 2.0,
  poupanca: 7.5,
  financingRate: 9.5,
}

// ─── Core Financial Functions ───────────────────────────────────────────────

/**
 * Net Present Value (Valor Presente Líquido)
 * Desconta fluxos de caixa futuros a uma taxa de desconto
 */
export function calculateNPV(cashFlows: number[], discountRate: number): number {
  const r = discountRate / 100
  return cashFlows.reduce((npv, cf, t) => {
    return npv + cf / Math.pow(1 + r, t)
  }, 0)
}

/**
 * Internal Rate of Return (Taxa Interna de Retorno)
 * Encontra a taxa que faz NPV = 0 usando Newton-Raphson
 */
export function calculateIRR(cashFlows: number[], maxIterations = 1000, tolerance = 0.00001): number {
  if (cashFlows.length < 2) return 0

  // Initial guess
  let rate = 0.1

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let dnpv = 0

    for (let t = 0; t < cashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t)
      npv += cashFlows[t] / factor
      if (t > 0) dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1)
    }

    if (Math.abs(npv) < tolerance) return rate * 100
    if (dnpv === 0) break

    const newRate = rate - npv / dnpv
    if (Math.abs(newRate - rate) < tolerance) return newRate * 100
    rate = newRate

    // Clamp to reasonable range
    if (rate < -0.99) rate = -0.5
    if (rate > 10) rate = 5
  }

  // Fallback: bisection method if Newton-Raphson didn't converge
  let low = -0.5
  let high = 5.0
  for (let i = 0; i < 1000; i++) {
    const mid = (low + high) / 2
    const npvMid = cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + mid, t), 0)
    if (Math.abs(npvMid) < tolerance) return mid * 100
    if (npvMid > 0) low = mid
    else high = mid
  }

  return ((low + high) / 2) * 100
}

/**
 * Cap Rate (Taxa de Capitalização)
 * NOI anual / Valor de mercado
 */
export function calculateCapRate(netOperatingIncome: number, marketValue: number): number {
  if (marketValue <= 0) return 0
  return (netOperatingIncome / marketValue) * 100
}

/**
 * Cash on Cash Return (Retorno sobre Capital Investido)
 * Fluxo de caixa anual / Capital investido
 */
export function calculateCashOnCash(annualCashFlow: number, totalInvestment: number): number {
  if (totalInvestment <= 0) return 0
  return (annualCashFlow / totalInvestment) * 100
}

/**
 * WACC (Custo Médio Ponderado de Capital)
 * Para investidores que usam mix de capital próprio + financiamento
 */
export function calculateWACC(params: {
  equityAmount: number
  equityReturn: number     // retorno exigido pelo investidor (% a.a.)
  debtAmount: number
  debtRate: number         // taxa de financiamento (% a.a.)
  taxRate?: number         // alíquota IR (para dedução de juros)
}): number {
  const total = params.equityAmount + params.debtAmount
  if (total <= 0) return 0

  const we = params.equityAmount / total
  const wd = params.debtAmount / total
  const re = params.equityReturn / 100
  const rd = params.debtRate / 100
  const t = (params.taxRate || 0) / 100

  return (we * re + wd * rd * (1 - t)) * 100
}

/**
 * Price table (tabela Price) — parcela fixa de financiamento
 */
export function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate <= 0 || months <= 0) return principal / Math.max(months, 1)
  const r = annualRate / 100 / 12
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

// ─── DCF Analysis (Fluxo de Caixa Descontado) ──────────────────────────────

export interface DCFParams {
  investment: InvestmentParams
  rates: MacroRates
  projectionYears?: number
  vacancyRate?: number        // % meses vagos (ex: 8 = ~1 mês/ano)
  maintenanceRate?: number    // % do valor p/ manutenção anual
  propertyTaxRate?: number    // % IPTU anual
  insuranceRate?: number      // % seguro anual
  managementFee?: number      // % taxa administração sobre aluguel
  appreciationRate?: number   // % valorização anual (null = usa IPCA)
  rentAdjustmentRate?: number // % reajuste aluguel anual (null = usa IGP-M)
  discountRate?: number       // % taxa de desconto (null = usa SELIC)
  exitCapRate?: number        // Cap rate na saída (venda)
}

export function runDCF(params: DCFParams): DCFResult {
  const {
    investment,
    rates,
    projectionYears = 10,
    vacancyRate = 8.33,        // ~1 mês/ano
    maintenanceRate = 1.0,     // 1% do valor ao ano
    propertyTaxRate = 0.8,     // 0.8% IPTU médio
    insuranceRate = 0.15,      // 0.15% seguro
    managementFee = 10,        // 10% sobre aluguel
    appreciationRate,
    rentAdjustmentRate,
    discountRate,
    exitCapRate = 7,
  } = params

  const totalInvestment = investment.bidValue + investment.totalAcquisitionCosts
  const annualAppreciation = (appreciationRate ?? rates.ipca) / 100
  const annualRentAdjust = (rentAdjustmentRate ?? rates.igpm) / 100
  const discount = (discountRate ?? rates.selic) / 100

  const cashFlowValues: number[] = [-totalInvestment]
  const cashFlows: CashFlow[] = []
  let cumulativeCF = -totalInvestment
  let currentPropertyValue = investment.appraisalValue || investment.bidValue * 1.5
  let currentMonthlyRent = investment.monthlyRent

  for (let year = 1; year <= projectionYears; year++) {
    // Adjust rent and property value
    if (year > 1) {
      currentMonthlyRent *= (1 + annualRentAdjust)
      currentPropertyValue *= (1 + annualAppreciation)
    }

    const grossRent = currentMonthlyRent * 12
    const vacancy = grossRent * (vacancyRate / 100)
    const effectiveGrossRent = grossRent - vacancy
    const maintenance = currentPropertyValue * (maintenanceRate / 100)
    const propertyTax = currentPropertyValue * (propertyTaxRate / 100)
    const insurance = currentPropertyValue * (insuranceRate / 100)
    const management = effectiveGrossRent * (managementFee / 100)
    const noi = effectiveGrossRent - maintenance - propertyTax - insurance - management

    cumulativeCF += noi
    const cumulativeReturn = totalInvestment > 0 ? (cumulativeCF / totalInvestment) * 100 : 0

    // On last year, add terminal value (sale proceeds)
    const isLastYear = year === projectionYears
    const terminalValue = isLastYear ? currentPropertyValue * (1 + annualAppreciation) : 0
    const yearCF = noi + terminalValue

    cashFlowValues.push(yearCF)

    cashFlows.push({
      year,
      grossRent: round(grossRent),
      vacancy: round(vacancy),
      maintenance: round(maintenance),
      propertyTax: round(propertyTax),
      insurance: round(insurance),
      management: round(management),
      netOperatingIncome: round(noi),
      appreciation: round(currentPropertyValue - (investment.appraisalValue || investment.bidValue * 1.5)),
      equityValue: round(currentPropertyValue),
      cumulativeCashFlow: round(cumulativeCF),
      cumulativeReturn: round(cumulativeReturn),
    })
  }

  const npv = calculateNPV(cashFlowValues, discountRate ?? rates.selic)
  const irr = calculateIRR(cashFlowValues)

  // Payback
  let breakEvenMonth = 0
  let runningCF = -totalInvestment
  for (let m = 1; m <= projectionYears * 12; m++) {
    const yearIdx = Math.ceil(m / 12) - 1
    if (yearIdx >= cashFlows.length) break
    runningCF += cashFlows[yearIdx].netOperatingIncome / 12
    if (runningCF >= 0 && breakEvenMonth === 0) {
      breakEvenMonth = m
    }
  }

  const firstYearNOI = cashFlows[0]?.netOperatingIncome || 0
  const firstYearGrossRent = cashFlows[0]?.grossRent || 0
  const firstYearNetRent = firstYearGrossRent - (cashFlows[0]?.vacancy || 0)

  const totalReturn = totalInvestment > 0
    ? ((cumulativeCF + currentPropertyValue * (1 + annualAppreciation) - totalInvestment) / totalInvestment) * 100
    : 0
  const annualizedReturn = projectionYears > 0
    ? (Math.pow(1 + totalReturn / 100, 1 / projectionYears) - 1) * 100
    : 0

  return {
    npv: round(npv),
    irr: round(irr),
    paybackYears: round(breakEvenMonth / 12),
    cashFlows,
    totalReturn: round(totalReturn),
    annualizedReturn: round(annualizedReturn),
    capRate: round(calculateCapRate(firstYearNOI, currentPropertyValue)),
    cashOnCash: round(calculateCashOnCash(firstYearNOI, totalInvestment)),
    grossYield: round(totalInvestment > 0 ? (firstYearGrossRent / totalInvestment) * 100 : 0),
    netYield: round(totalInvestment > 0 ? (firstYearNetRent / totalInvestment) * 100 : 0),
    equityMultiple: round(totalInvestment > 0 ? (cumulativeCF + currentPropertyValue) / totalInvestment : 0),
    breakEvenMonth,
  }
}

// ─── Scenario Analysis ──────────────────────────────────────────────────────

export function runScenarios(params: DCFParams): ScenarioResult[] {
  const base = runDCF(params)

  // Optimistic: appreciation +2pp, rent +1pp, vacancy -3pp
  const optimistic = runDCF({
    ...params,
    appreciationRate: (params.appreciationRate ?? params.rates.ipca) + 2,
    rentAdjustmentRate: (params.rentAdjustmentRate ?? params.rates.igpm) + 1,
    vacancyRate: Math.max(0, (params.vacancyRate ?? 8.33) - 3),
  })

  // Pessimistic: appreciation -2pp, rent -1pp, vacancy +5pp
  const pessimistic = runDCF({
    ...params,
    appreciationRate: Math.max(0, (params.appreciationRate ?? params.rates.ipca) - 2),
    rentAdjustmentRate: Math.max(0, (params.rentAdjustmentRate ?? params.rates.igpm) - 1),
    vacancyRate: (params.vacancyRate ?? 8.33) + 5,
  })

  return [
    {
      name: 'optimistic',
      label: 'Otimista',
      color: '#22c55e',
      npv: optimistic.npv,
      irr: optimistic.irr,
      paybackYears: optimistic.paybackYears,
      totalReturn: optimistic.totalReturn,
      annualizedReturn: optimistic.annualizedReturn,
      cashFlows: optimistic.cashFlows,
    },
    {
      name: 'base',
      label: 'Base',
      color: '#3b82f6',
      npv: base.npv,
      irr: base.irr,
      paybackYears: base.paybackYears,
      totalReturn: base.totalReturn,
      annualizedReturn: base.annualizedReturn,
      cashFlows: base.cashFlows,
    },
    {
      name: 'pessimistic',
      label: 'Pessimista',
      color: '#ef4444',
      npv: pessimistic.npv,
      irr: pessimistic.irr,
      paybackYears: pessimistic.paybackYears,
      totalReturn: pessimistic.totalReturn,
      annualizedReturn: pessimistic.annualizedReturn,
      cashFlows: pessimistic.cashFlows,
    },
  ]
}

// ─── Sensitivity Analysis ───────────────────────────────────────────────────

export function runSensitivityAnalysis(params: DCFParams): SensitivityPoint[] {
  const variations = [-30, -20, -10, 0, 10, 20, 30]
  const results: SensitivityPoint[] = []

  const variables = [
    { name: 'Aluguel', key: 'rent' },
    { name: 'Valorização', key: 'appreciation' },
    { name: 'Vacância', key: 'vacancy' },
    { name: 'SELIC (Desconto)', key: 'discount' },
    { name: 'Custos Manutenção', key: 'maintenance' },
  ]

  for (const v of variables) {
    for (const pct of variations) {
      const factor = 1 + pct / 100
      let modified: DCFParams

      switch (v.key) {
        case 'rent':
          modified = {
            ...params,
            investment: {
              ...params.investment,
              monthlyRent: params.investment.monthlyRent * factor,
            },
          }
          break
        case 'appreciation':
          modified = {
            ...params,
            appreciationRate: (params.appreciationRate ?? params.rates.ipca) * factor,
          }
          break
        case 'vacancy':
          modified = {
            ...params,
            vacancyRate: (params.vacancyRate ?? 8.33) * factor,
          }
          break
        case 'discount':
          modified = {
            ...params,
            discountRate: (params.discountRate ?? params.rates.selic) * factor,
          }
          break
        case 'maintenance':
          modified = {
            ...params,
            maintenanceRate: (params.maintenanceRate ?? 1.0) * factor,
          }
          break
        default:
          modified = params
      }

      const dcf = runDCF(modified)
      results.push({
        variable: v.name,
        variation: pct,
        npv: dcf.npv,
        irr: dcf.irr,
        totalReturn: dcf.totalReturn,
      })
    }
  }

  return results
}

// ─── Monte Carlo Simulation ─────────────────────────────────────────────────

function gaussianRandom(): number {
  // Box-Muller transform
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

export function runMonteCarlo(
  params: DCFParams,
  simulations = 1000,
): MonteCarloResult {
  const npvs: number[] = []
  const irrs: number[] = []
  const returns: number[] = []

  const baseRent = params.investment.monthlyRent
  const baseAppreciation = params.appreciationRate ?? params.rates.ipca
  const baseVacancy = params.vacancyRate ?? 8.33

  for (let i = 0; i < simulations; i++) {
    // Random variations (normal distribution)
    const rentFactor = 1 + gaussianRandom() * 0.15       // ±15% std dev
    const appreciationDelta = gaussianRandom() * 2        // ±2pp std dev
    const vacancyDelta = gaussianRandom() * 4             // ±4pp std dev

    const simParams: DCFParams = {
      ...params,
      investment: {
        ...params.investment,
        monthlyRent: Math.max(baseRent * 0.3, baseRent * rentFactor),
      },
      appreciationRate: Math.max(-5, baseAppreciation + appreciationDelta),
      vacancyRate: Math.max(0, Math.min(50, baseVacancy + vacancyDelta)),
    }

    const result = runDCF(simParams)
    npvs.push(result.npv)
    irrs.push(result.irr)
    returns.push(result.totalReturn)
  }

  // Sort for percentiles
  npvs.sort((a, b) => a - b)
  irrs.sort((a, b) => a - b)
  returns.sort((a, b) => a - b)

  const pctIdx = (p: number) => Math.floor(simulations * p / 100)

  // Distribution buckets for NPV histogram
  const minNPV = npvs[0]
  const maxNPV = npvs[npvs.length - 1]
  const bucketCount = 20
  const bucketSize = (maxNPV - minNPV) / bucketCount || 1
  const distribution: { bucket: number; count: number }[] = []
  for (let b = 0; b < bucketCount; b++) {
    const low = minNPV + b * bucketSize
    const high = low + bucketSize
    const count = npvs.filter(v => v >= low && (b === bucketCount - 1 ? v <= high : v < high)).length
    distribution.push({ bucket: round(low + bucketSize / 2), count })
  }

  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length
  const stdDev = (arr: number[]) => {
    const m = mean(arr)
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length)
  }
  const median = (arr: number[]) => arr[Math.floor(arr.length / 2)]

  return {
    simulations,
    mean: { npv: round(mean(npvs)), irr: round(mean(irrs)), totalReturn: round(mean(returns)) },
    median: { npv: round(median(npvs)), irr: round(median(irrs)), totalReturn: round(median(returns)) },
    stdDev: { npv: round(stdDev(npvs)), irr: round(stdDev(irrs)), totalReturn: round(stdDev(returns)) },
    percentile5: { npv: round(npvs[pctIdx(5)]), irr: round(irrs[pctIdx(5)]), totalReturn: round(returns[pctIdx(5)]) },
    percentile25: { npv: round(npvs[pctIdx(25)]), irr: round(irrs[pctIdx(25)]), totalReturn: round(returns[pctIdx(25)]) },
    percentile75: { npv: round(npvs[pctIdx(75)]), irr: round(irrs[pctIdx(75)]), totalReturn: round(returns[pctIdx(75)]) },
    percentile95: { npv: round(npvs[pctIdx(95)]), irr: round(irrs[pctIdx(95)]), totalReturn: round(returns[pctIdx(95)]) },
    probabilityPositiveNPV: round((npvs.filter(v => v > 0).length / simulations) * 100),
    probabilityAboveSelic: round((returns.filter(v => v > params.rates.selic * (params.projectionYears || 10)).length / simulations) * 100),
    distribution,
  }
}

// ─── Stress Testing ─────────────────────────────────────────────────────────

export function runStressTests(params: DCFParams): StressTestResult[] {
  const base = runDCF(params)
  const baseNPV = base.npv

  const scenarios: { name: string; desc: string; severity: StressTestResult['severity']; overrides: Partial<DCFParams> }[] = [
    {
      name: 'Vacância Alta',
      desc: 'Imóvel fica vazio 25% do tempo (3 meses/ano)',
      severity: 'MEDIUM',
      overrides: { vacancyRate: 25 },
    },
    {
      name: 'Vacância Extrema',
      desc: 'Imóvel vazio 50% do tempo + aluguel cai 20%',
      severity: 'HIGH',
      overrides: {
        vacancyRate: 50,
        investment: { ...params.investment, monthlyRent: params.investment.monthlyRent * 0.8 },
      },
    },
    {
      name: 'SELIC a 18%',
      desc: 'Banco Central eleva SELIC para 18% (custo de oportunidade sobe)',
      severity: 'MEDIUM',
      overrides: { discountRate: 18 },
    },
    {
      name: 'Crise Imobiliária',
      desc: 'Desvalorização de 15%, vacância 30%, aluguel cai 15%',
      severity: 'HIGH',
      overrides: {
        appreciationRate: -5,
        vacancyRate: 30,
        investment: { ...params.investment, monthlyRent: params.investment.monthlyRent * 0.85 },
      },
    },
    {
      name: 'Estagflação',
      desc: 'IPCA 12%, SELIC 20%, valorização zero, vacância 20%',
      severity: 'EXTREME',
      overrides: {
        appreciationRate: 0,
        vacancyRate: 20,
        discountRate: 20,
        rentAdjustmentRate: 12,
      },
    },
    {
      name: 'Cenário 2015-2016',
      desc: 'Recessão: desvalorização 10%, vacância 35%, custos +30%',
      severity: 'EXTREME',
      overrides: {
        appreciationRate: -3,
        vacancyRate: 35,
        maintenanceRate: 1.3,
        investment: { ...params.investment, monthlyRent: params.investment.monthlyRent * 0.75 },
      },
    },
    {
      name: 'Desocupação Judicial Longa',
      desc: 'Ocupante resiste, processo demora 2 anos, custos extras R$30k',
      severity: 'HIGH',
      overrides: {
        investment: {
          ...params.investment,
          totalAcquisitionCosts: params.investment.totalAcquisitionCosts + 30000,
        },
        vacancyRate: 40,
      },
    },
  ]

  return scenarios.map(s => {
    const dcf = runDCF({ ...params, ...s.overrides })
    const impact = baseNPV !== 0 ? ((dcf.npv - baseNPV) / Math.abs(baseNPV)) * 100 : 0

    return {
      scenario: s.name,
      description: s.desc,
      severity: s.severity,
      npv: round(dcf.npv),
      irr: round(dcf.irr),
      totalReturn: round(dcf.totalReturn),
      survives: dcf.npv > 0,
      impactPercent: round(impact),
    }
  })
}

// ─── Portfolio Analysis ─────────────────────────────────────────────────────

export function analyzePortfolio(assets: PortfolioAsset[]): PortfolioAnalysis {
  if (assets.length === 0) {
    return {
      totalInvested: 0, totalCurrentValue: 0, totalMonthlyRent: 0,
      portfolioReturn: 0, weightedCapRate: 0, weightedIRR: 0,
      diversificationScore: 0, assets: [], cityConcentration: {},
      stateConcentration: {}, riskLevel: 'HIGH',
    }
  }

  const totalInvested = assets.reduce((s, a) => s + a.investedAmount, 0)
  const totalCurrentValue = assets.reduce((s, a) => s + a.currentValue, 0)
  const totalMonthlyRent = assets.reduce((s, a) => s + a.monthlyRent, 0)

  // Weighted metrics
  const weightedAssets = assets.map(a => ({
    ...a,
    weight: totalInvested > 0 ? (a.investedAmount / totalInvested) * 100 : 0,
  }))

  const weightedCapRate = weightedAssets.reduce((s, a) => s + a.capRate * (a.weight / 100), 0)
  const weightedIRR = weightedAssets.reduce((s, a) => s + a.irr * (a.weight / 100), 0)
  const portfolioReturn = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0

  // Concentration
  const cityConc: Record<string, number> = {}
  const stateConc: Record<string, number> = {}
  for (const a of weightedAssets) {
    cityConc[a.city] = (cityConc[a.city] || 0) + a.weight
    stateConc[a.state] = (stateConc[a.state] || 0) + a.weight
  }

  // Diversification score: Herfindahl-Hirschman Index (inverted)
  const hhi = Object.values(cityConc).reduce((s, w) => s + (w / 100) ** 2, 0)
  const maxHHI = 1 // single asset
  const minHHI = 1 / Math.max(assets.length, 1)
  const diversificationScore = maxHHI > minHHI
    ? Math.round(((maxHHI - hhi) / (maxHHI - minHHI)) * 100)
    : 0

  // Risk
  const maxConcentration = Math.max(...Object.values(cityConc))
  const riskLevel: PortfolioAnalysis['riskLevel'] =
    assets.length <= 1 || maxConcentration > 70 ? 'HIGH' :
    assets.length <= 3 || maxConcentration > 50 ? 'MEDIUM' : 'LOW'

  return {
    totalInvested: round(totalInvested),
    totalCurrentValue: round(totalCurrentValue),
    totalMonthlyRent: round(totalMonthlyRent),
    portfolioReturn: round(portfolioReturn),
    weightedCapRate: round(weightedCapRate),
    weightedIRR: round(weightedIRR),
    diversificationScore,
    assets: weightedAssets,
    cityConcentration: cityConc,
    stateConcentration: stateConc,
    riskLevel,
  }
}

// ─── Comparison Helper ──────────────────────────────────────────────────────

export interface ComparisonMetrics {
  id: string
  name: string
  npv: number
  irr: number
  capRate: number
  cashOnCash: number
  paybackYears: number
  totalReturn: number
  grossYield: number
  netYield: number
  riskScore: number       // 0-10
  liquidityScore: number  // 0-10
  overallScore: number    // 0-100
}

export function compareProperties(
  properties: { id: string; name: string; params: DCFParams; riskScore?: number; liquidityScore?: number }[]
): ComparisonMetrics[] {
  return properties.map(p => {
    const dcf = runDCF(p.params)
    const risk = p.riskScore ?? (p.params.investment.isOccupied ? 7 : 3)
    const liquidity = p.liquidityScore ?? 5

    // Overall score: weighted combination
    const normalizedIRR = Math.min(dcf.irr / 20, 1) * 30       // max 30 pts
    const normalizedNPV = dcf.npv > 0 ? 20 : dcf.npv > -50000 ? 10 : 0  // max 20 pts
    const normalizedRisk = ((10 - risk) / 10) * 25              // max 25 pts (lower risk = higher score)
    const normalizedLiquidity = (liquidity / 10) * 15           // max 15 pts
    const normalizedPayback = dcf.paybackYears < 8 ? 10 : dcf.paybackYears < 15 ? 5 : 0 // max 10 pts

    return {
      id: p.id,
      name: p.name,
      npv: dcf.npv,
      irr: dcf.irr,
      capRate: dcf.capRate,
      cashOnCash: dcf.cashOnCash,
      paybackYears: dcf.paybackYears,
      totalReturn: dcf.totalReturn,
      grossYield: dcf.grossYield,
      netYield: dcf.netYield,
      riskScore: risk,
      liquidityScore: liquidity,
      overallScore: round(Math.min(100, normalizedIRR + normalizedNPV + normalizedRisk + normalizedLiquidity + normalizedPayback)),
    }
  })
}

// ─── Utility ────────────────────────────────────────────────────────────────

function round(n: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
