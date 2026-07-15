/**
 * Nota AgoraEncontrei 0–100 (plano §11).
 *
 * Score EXPLICÁVEL de oportunidade — nunca um "número mágico". Cada critério tem
 * peso, pontuação e justificativa, e reaproveita o que já calculamos (Desconto
 * Real AE, comparáveis, avaliação inflada, ocupação, documentos, financiamento).
 *
 * Composição (peso máximo):
 *   Desconto real .............. 25
 *   Liquidez regional .......... 15
 *   Segurança documental ....... 15
 *   Qualidade dos comparáveis .. 10
 *   Estado de ocupação ......... 10
 *   Potencial de valorização ... 10
 *   Custos adicionais .......... 10
 *   Facilidade de financiamento . 5
 *
 * Pura e sem I/O — recebe os artefatos já computados no endpoint.
 */

import type { RealDiscountResult } from './auction-real-discount.service.js'
import type { ComparablesResult } from './auction-comparables.service.js'

export interface ScoreCriterion {
  key: string
  label: string
  weight: number
  points: number
  note: string
}

export interface AgoraScore {
  score: number // 0–100
  grade: 'EXCEPCIONAL' | 'FORTE' | 'MODERADA' | 'RISCO_ELEVADO' | 'NAO_RECOMENDADA'
  gradeLabel: string
  criteria: ScoreCriterion[]
  confidence: number // média ponderada da confiança dos dados usados
  summary: string
}

export interface ScoreInput {
  occupation: string | null
  financingAvailable: boolean
  fgtsAllowed: boolean
  hasEdital: boolean
  hasMatricula: boolean
  hasRegistryNumber: boolean
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

const GRADE_LABEL: Record<AgoraScore['grade'], string> = {
  EXCEPCIONAL: 'Oportunidade excepcional',
  FORTE: 'Oportunidade forte',
  MODERADA: 'Oportunidade moderada',
  RISCO_ELEVADO: 'Risco elevado',
  NAO_RECOMENDADA: 'Não recomendada sem análise especializada',
}

function gradeFor(score: number): AgoraScore['grade'] {
  if (score >= 90) return 'EXCEPCIONAL'
  if (score >= 75) return 'FORTE'
  if (score >= 60) return 'MODERADA'
  if (score >= 40) return 'RISCO_ELEVADO'
  return 'NAO_RECOMENDADA'
}

/**
 * Calcula a Nota AgoraEncontrei a partir dos artefatos de análise já prontos.
 */
export function computeAgoraScore(
  input: ScoreInput,
  realDiscount: RealDiscountResult | null,
  comparables: ComparablesResult | null,
): AgoraScore {
  const criteria: ScoreCriterion[] = []

  // ── Desconto real (25) ────────────────────────────────────────────────────
  // Mapeia a margem líquida real: 0% → 0 pts, 30%+ → 25 pts.
  {
    const margin = realDiscount?.netMarginPercent
    let pts = 0
    let note = 'Sem dados suficientes para a margem líquida.'
    if (margin != null) {
      pts = clamp((margin / 30) * 25, 0, 25)
      note = `Margem líquida real estimada de ${margin}%.`
    }
    criteria.push({ key: 'real_discount', label: 'Desconto real', weight: 25, points: Math.round(pts), note })
  }

  // ── Liquidez regional (15) ────────────────────────────────────────────────
  // Mais comparáveis ativos na região → mercado mais líquido.
  {
    const sample = comparables?.marketEstimate?.sampleSize ?? comparables?.comparables?.length ?? 0
    const pts = clamp((sample / 20) * 15, 0, 15)
    criteria.push({
      key: 'liquidity', label: 'Liquidez regional', weight: 15, points: Math.round(pts),
      note: sample > 0 ? `${sample} imóveis comparáveis na região.` : 'Poucos comparáveis — liquidez incerta.',
    })
  }

  // ── Segurança documental (15) ─────────────────────────────────────────────
  {
    let pts = 0
    const bits: string[] = []
    if (input.hasMatricula || input.hasRegistryNumber) { pts += 8; bits.push('matrícula') }
    if (input.hasEdital) { pts += 7; bits.push('edital') }
    criteria.push({
      key: 'documents', label: 'Segurança documental', weight: 15, points: clamp(pts, 0, 15),
      note: bits.length ? `Documentos disponíveis: ${bits.join(', ')}.` : 'Sem edital/matrícula anexados ainda.',
    })
  }

  // ── Qualidade dos comparáveis (10) ────────────────────────────────────────
  {
    const conf = comparables?.marketEstimate?.confidence ?? 0
    const pts = clamp((conf / 100) * 10, 0, 10)
    criteria.push({
      key: 'comparables_quality', label: 'Qualidade dos comparáveis', weight: 10, points: Math.round(pts),
      note: conf > 0 ? `Confiança da estimativa de mercado: ${conf}%.` : 'Sem estimativa de mercado por comparáveis.',
    })
  }

  // ── Estado de ocupação (10) ───────────────────────────────────────────────
  {
    const occ = input.occupation
    let pts = 5
    let note = 'Ocupação não confirmada.'
    if (occ === 'DESOCUPADO') { pts = 10; note = 'Imóvel desocupado — sem custo/atraso de desocupação.' }
    else if (occ === 'OCUPADO') { pts = 2; note = 'Imóvel ocupado — prevê custo e prazo de desocupação.' }
    criteria.push({ key: 'occupation', label: 'Estado de ocupação', weight: 10, points: pts, note })
  }

  // ── Potencial de valorização (10) ─────────────────────────────────────────
  // Usa o detector de avaliação: comprar abaixo do mercado por m² é upside.
  {
    const above = comparables?.inflatedAppraisal?.appraisalAboveMarketPercent
    const real = comparables?.inflatedAppraisal?.realDiscountPercent
    let pts = 5
    let note = 'Valorização neutra / sem sinal claro.'
    if (real != null) {
      pts = clamp((real / 40) * 10, 0, 10)
      note = `Desconto real de ${real}% sobre o mercado estimado.`
    } else if (above != null && above <= -10) {
      pts = 8; note = 'Avaliação abaixo do preço/m² regional — possível upside.'
    }
    criteria.push({ key: 'appreciation', label: 'Potencial de valorização', weight: 10, points: Math.round(pts), note })
  }

  // ── Custos adicionais (10) ────────────────────────────────────────────────
  // Menor carga de custos sobre o lance → mais pontos.
  {
    let pts = 6
    let note = 'Custos de arrematação padrão.'
    if (realDiscount?.costs && realDiscount.minimumBid) {
      const ratio = realDiscount.costs.totalCosts / realDiscount.minimumBid
      pts = clamp(10 - ratio * 25, 0, 10) // ~20% de custos → ~5 pts
      note = `Custos de arrematação ≈ ${Math.round(ratio * 100)}% do lance.`
    }
    criteria.push({ key: 'costs', label: 'Custos adicionais', weight: 10, points: Math.round(pts), note })
  }

  // ── Facilidade de financiamento (5) ───────────────────────────────────────
  {
    let pts = 0
    const bits: string[] = []
    if (input.financingAvailable) { pts += 3; bits.push('financiável') }
    if (input.fgtsAllowed) { pts += 2; bits.push('FGTS') }
    criteria.push({
      key: 'financing', label: 'Facilidade de financiamento', weight: 5, points: clamp(pts, 0, 5),
      note: bits.length ? `Aceita: ${bits.join(', ')}.` : 'Sem financiamento/FGTS informado.',
    })
  }

  const score = clamp(Math.round(criteria.reduce((sum, c) => sum + c.points, 0)), 0, 100)
  const grade = gradeFor(score)

  // Confiança geral: puxa da confiança dos comparáveis e da presença de dados.
  const dataConfidence = comparables?.marketEstimate?.confidence ?? 30
  const docBoost = (input.hasMatricula || input.hasRegistryNumber ? 10 : 0) + (input.hasEdital ? 5 : 0)
  const confidence = clamp(Math.round(dataConfidence * 0.7 + docBoost + (realDiscount?.marketValue ? 15 : 0)), 0, 100)

  return {
    score,
    grade,
    gradeLabel: GRADE_LABEL[grade],
    criteria,
    confidence,
    summary: `Nota ${score}/100 — ${GRADE_LABEL[grade]}. Composta por ${criteria.length} critérios ponderados e transparentes.`,
  }
}
