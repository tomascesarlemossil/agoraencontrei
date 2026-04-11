/**
 * Auction AI Service — Intelligent Edital Analysis & ROI Calculator
 *
 * Uses Claude AI to analyze auction edital PDFs and extract:
 * - Outstanding debts (IPTU, condomínio, outros)
 * - Occupation status and eviction risk
 * - Reform cost estimates
 * - Total investment calculation
 * - ROI, payback period, and monthly yield
 *
 * Also provides standalone ROI calculator for manual inputs.
 */

import type { PrismaClient } from '@prisma/client'
import { env } from '../utils/env.js'

// ── Types ───────────────────────────────────────────────────────────────────

export interface AuctionAnalysisInput {
  auctionId: string
  editalUrl?: string
  editalText?: string
  minimumBid?: number
  appraisalValue?: number
  propertyType?: string
  totalArea?: number
  city?: string
  state?: string
}

export interface AuctionAnalysisResult {
  totalDebts: number
  iptuDebt: number
  condoDebt: number
  otherDebts: number
  occupationStatus: string
  occupationRisk: string
  estimatedReformCost: number
  estimatedITBI: number
  estimatedCartorio: number
  totalInvestment: number
  estimatedMarketValue: number
  estimatedROI: number
  paybackMonths: number
  monthlyYield: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  aiSummary: string
}

export interface ROICalculatorInput {
  purchaseValue: number
  appraisalValue?: number
  estimatedMarketValue?: number
  iptuDebt?: number
  condoDebt?: number
  otherDebts?: number
  reformCost?: number
  itbiPercent?: number
  cartorioCost?: number
  brokerCommission?: number
  monthlyRent?: number
  propertyType?: string
  city?: string
  state?: string
}

export interface ROICalculatorResult {
  totalInvestment: number
  estimatedMarketValue: number
  grossProfit: number
  netProfit: number
  roi: number
  paybackMonths: number
  monthlyYield: number
  annualYield: number
  investmentBreakdown: {
    purchase: number
    debts: number
    reform: number
    itbi: number
    cartorio: number
    brokerFee: number
  }
  comparison: {
    savingsYield: number
    cdiYield: number
    selicYield: number
    propertyYield: number
  }
}

// ── Constants ───────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = (env as any).ANTHROPIC_API_KEY || ''
const ITBI_DEFAULT_PERCENT = 3.0  // 3% average across Brazil
const CARTORIO_BASE_COST = 3500   // average cartório costs
const REFORM_PER_M2: Record<string, number> = {
  HOUSE: 800,
  APARTMENT: 600,
  LAND: 0,
  COMMERCIAL: 500,
}

// Brazilian financial benchmarks (annual %)
const SELIC_RATE = 13.25
const CDI_RATE = 13.15
const SAVINGS_RATE = 7.75

// ── AI Analysis ─────────────────────────────────────────────────────────────

/**
 * Analyzes an auction edital using Claude AI.
 * Extracts debts, occupation, and risk assessment.
 */
export async function analyzeEdital(
  prisma: PrismaClient,
  input: AuctionAnalysisInput,
): Promise<AuctionAnalysisResult> {
  const editalContent = input.editalText || `URL do edital: ${input.editalUrl || 'Não fornecido'}`
  const minimumBid = input.minimumBid || 0
  const appraisal = input.appraisalValue || minimumBid * 1.5

  let aiResult: Partial<AuctionAnalysisResult> = {}

  if (ANTHROPIC_API_KEY && (input.editalText || input.editalUrl)) {
    try {
      aiResult = await callClaudeForAnalysis(editalContent, {
        minimumBid,
        appraisalValue: appraisal,
        propertyType: input.propertyType,
        totalArea: input.totalArea,
        city: input.city,
        state: input.state,
      })
    } catch (error: any) {
      console.error('[auction-ai] Claude analysis error:', error.message)
    }
  }

  // Fallback/defaults for missing AI values
  const totalArea = input.totalArea || 100
  const reformPerM2 = REFORM_PER_M2[input.propertyType || 'HOUSE'] || 600
  const estimatedReformCost = aiResult.estimatedReformCost ?? totalArea * reformPerM2 * 0.3
  const itbi = aiResult.estimatedITBI ?? minimumBid * ITBI_DEFAULT_PERCENT / 100
  const cartorio = aiResult.estimatedCartorio ?? CARTORIO_BASE_COST
  const totalDebts = aiResult.totalDebts ?? 0
  const iptuDebt = aiResult.iptuDebt ?? 0
  const condoDebt = aiResult.condoDebt ?? 0
  const otherDebts = aiResult.otherDebts ?? 0

  const totalInvestment = minimumBid + totalDebts + estimatedReformCost + itbi + cartorio
  const estimatedMarketValue = aiResult.estimatedMarketValue ?? appraisal
  const grossProfit = estimatedMarketValue - totalInvestment
  const roi = totalInvestment > 0 ? Math.round((grossProfit / totalInvestment) * 100 * 10) / 10 : 0

  // Monthly yield estimate (assuming rental at 0.5% of market value)
  const monthlyRent = estimatedMarketValue * 0.005
  const monthlyYield = totalInvestment > 0
    ? Math.round((monthlyRent / totalInvestment) * 100 * 100) / 100
    : 0

  const paybackMonths = monthlyRent > 0
    ? Math.round(totalInvestment / monthlyRent)
    : 0

  // Risk assessment
  const occupationStatus = aiResult.occupationStatus ?? 'DESCONHECIDO'
  const occupationRisk = aiResult.occupationRisk ?? 'MEDIO'
  const riskLevel = calculateRiskLevel(roi, occupationStatus, totalDebts, minimumBid)

  const result: AuctionAnalysisResult = {
    totalDebts,
    iptuDebt,
    condoDebt,
    otherDebts,
    occupationStatus,
    occupationRisk,
    estimatedReformCost: Math.round(estimatedReformCost),
    estimatedITBI: Math.round(itbi),
    estimatedCartorio: Math.round(cartorio),
    totalInvestment: Math.round(totalInvestment),
    estimatedMarketValue: Math.round(estimatedMarketValue),
    estimatedROI: roi,
    paybackMonths,
    monthlyYield,
    riskLevel,
    aiSummary: aiResult.aiSummary || '',
  }

  // Generate default summary if AI didn't provide one
  if (!result.aiSummary) {
    result.aiSummary = generateDefaultSummary(result, minimumBid)
  }

  // Save to database
  await (prisma as any).auctionAiAnalysis.create({
    data: {
      auctionId: input.auctionId,
      editalUrl: input.editalUrl || null,
      totalDebts: result.totalDebts,
      iptuDebt: result.iptuDebt,
      condoDebt: result.condoDebt,
      otherDebts: result.otherDebts,
      occupationStatus: result.occupationStatus,
      occupationRisk: result.occupationRisk,
      estimatedReformCost: result.estimatedReformCost,
      estimatedITBI: result.estimatedITBI,
      estimatedCartorio: result.estimatedCartorio,
      totalInvestment: result.totalInvestment,
      estimatedMarketValue: result.estimatedMarketValue,
      estimatedROI: result.estimatedROI,
      paybackMonths: result.paybackMonths,
      monthlyYield: result.monthlyYield,
      riskLevel: result.riskLevel,
      aiSummary: result.aiSummary,
      rawAnalysis: aiResult,
    },
  }).catch((e: any) => {
    console.error('[auction-ai] DB save error:', e.message)
  })

  return result
}

/**
 * Standalone ROI calculator — no AI required.
 */
export function calculateROI(input: ROICalculatorInput): ROICalculatorResult {
  const debts = (input.iptuDebt || 0) + (input.condoDebt || 0) + (input.otherDebts || 0)
  const itbi = input.purchaseValue * (input.itbiPercent || ITBI_DEFAULT_PERCENT) / 100
  const cartorio = input.cartorioCost || CARTORIO_BASE_COST
  const reform = input.reformCost || 0
  const brokerFee = input.brokerCommission || 0

  const totalInvestment = input.purchaseValue + debts + reform + itbi + cartorio + brokerFee
  const estimatedMarketValue = input.estimatedMarketValue || input.appraisalValue || input.purchaseValue * 1.5

  const grossProfit = estimatedMarketValue - totalInvestment
  const netProfit = grossProfit - brokerFee
  const roi = totalInvestment > 0 ? Math.round((grossProfit / totalInvestment) * 100 * 10) / 10 : 0

  const monthlyRent = input.monthlyRent || estimatedMarketValue * 0.005
  const monthlyYield = totalInvestment > 0
    ? Math.round((monthlyRent / totalInvestment) * 100 * 100) / 100
    : 0
  const annualYield = Math.round(monthlyYield * 12 * 100) / 100

  const paybackMonths = monthlyRent > 0 ? Math.round(totalInvestment / monthlyRent) : 0

  return {
    totalInvestment: Math.round(totalInvestment),
    estimatedMarketValue: Math.round(estimatedMarketValue),
    grossProfit: Math.round(grossProfit),
    netProfit: Math.round(netProfit),
    roi,
    paybackMonths,
    monthlyYield,
    annualYield,
    investmentBreakdown: {
      purchase: input.purchaseValue,
      debts,
      reform,
      itbi: Math.round(itbi),
      cartorio,
      brokerFee,
    },
    comparison: {
      savingsYield: SAVINGS_RATE,
      cdiYield: CDI_RATE,
      selicYield: SELIC_RATE,
      propertyYield: annualYield,
    },
  }
}

/**
 * Gets existing AI analysis for an auction.
 */
export async function getAuctionAnalysis(
  prisma: PrismaClient,
  auctionId: string,
): Promise<any | null> {
  return (prisma as any).auctionAiAnalysis.findFirst({
    where: { auctionId },
    orderBy: { analyzedAt: 'desc' },
  }).catch(() => null)
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function calculateRiskLevel(
  roi: number,
  occupationStatus: string,
  totalDebts: number,
  minimumBid: number,
): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
  let score = 0

  // ROI factor
  if (roi > 50) score -= 2
  else if (roi > 30) score -= 1
  else if (roi < 10) score += 1
  else if (roi < 0) score += 3

  // Occupation risk
  if (occupationStatus === 'OCUPADO' || occupationStatus === 'OCCUPIED') score += 2
  if (occupationStatus === 'DESCONHECIDO' || occupationStatus === 'UNKNOWN') score += 1

  // Debt ratio
  if (minimumBid > 0) {
    const debtRatio = totalDebts / minimumBid
    if (debtRatio > 0.3) score += 2
    else if (debtRatio > 0.1) score += 1
  }

  if (score <= 0) return 'LOW'
  if (score <= 2) return 'MEDIUM'
  if (score <= 4) return 'HIGH'
  return 'VERY_HIGH'
}

function generateDefaultSummary(result: AuctionAnalysisResult, minimumBid: number): string {
  const discount = result.estimatedMarketValue > 0
    ? Math.round((1 - minimumBid / result.estimatedMarketValue) * 100)
    : 0

  return `Imóvel com lance mínimo de R$ ${minimumBid.toLocaleString('pt-BR')} ` +
    `(${discount}% abaixo do valor de mercado estimado). ` +
    `Investimento total estimado: R$ ${result.totalInvestment.toLocaleString('pt-BR')}. ` +
    `ROI projetado: ${result.estimatedROI}%. ` +
    `Risco: ${result.riskLevel}. ` +
    `Payback estimado: ${result.paybackMonths} meses.`
}

async function callClaudeForAnalysis(
  editalContent: string,
  context: {
    minimumBid: number
    appraisalValue: number
    propertyType?: string
    totalArea?: number
    city?: string
    state?: string
  },
): Promise<Partial<AuctionAnalysisResult>> {
  const prompt = `Analise o seguinte edital de leilão imobiliário e extraia as informações solicitadas.

CONTEXTO DO IMÓVEL:
- Lance mínimo: R$ ${context.minimumBid.toLocaleString('pt-BR')}
- Valor de avaliação: R$ ${context.appraisalValue.toLocaleString('pt-BR')}
- Tipo: ${context.propertyType || 'Não informado'}
- Área total: ${context.totalArea || 'Não informada'} m²
- Cidade/Estado: ${context.city || '?'}/${context.state || '?'}

CONTEÚDO DO EDITAL:
${editalContent.substring(0, 8000)}

RESPONDA EXCLUSIVAMENTE no formato JSON abaixo (sem markdown, sem texto adicional):
{
  "totalDebts": 0,
  "iptuDebt": 0,
  "condoDebt": 0,
  "otherDebts": 0,
  "occupationStatus": "DESOCUPADO|OCUPADO|DESCONHECIDO",
  "occupationRisk": "BAIXO|MEDIO|ALTO",
  "estimatedReformCost": 0,
  "estimatedITBI": 0,
  "estimatedCartorio": 0,
  "estimatedMarketValue": 0,
  "aiSummary": "Resumo em português da análise..."
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.status}`)
  }

  const data: any = await res.json()
  const text = data.content?.[0]?.text || ''

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response')
  }

  return JSON.parse(jsonMatch[0])
}
