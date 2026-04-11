/**
 * Lead Scoring AI Service — Priorização inteligente de leads
 * Analisa comportamento do lead (cliques, tempo, mensagens) e calcula score.
 *
 * Score 0-100:
 * - 0-25: Frio (Cold)
 * - 26-50: Morno (Warm)
 * - 51-75: Quente (Hot)
 * - 76-100: Super Quente (On Fire)
 */

import Anthropic from '@anthropic-ai/sdk'
import { env } from '../utils/env.js'

// ── Types ────────────────────────────────────────────────────────────────────

export interface LeadBehavior {
  totalPageViews: number
  propertyViews: number
  photoViews: number
  timeOnSiteMinutes: number
  messagesCount: number
  whatsappClicks: number
  phoneCallClicks: number
  favoritesCount: number
  searchesCount: number
  returnVisits: number
  lastVisitDaysAgo: number
  utmSource?: string
  utmMedium?: string
  interest?: string        // 'buy' | 'rent'
  budget?: number
  hasEmail: boolean
  hasPhone: boolean
}

export interface LeadScoreResult {
  score: number             // 0-100
  temperature: 'cold' | 'warm' | 'hot' | 'on_fire'
  priority: number          // 1 (highest) - 4 (lowest)
  reasons: string[]         // Why this score
  suggestedAction: string   // Next best action for the broker
  conversionProbability: number  // 0-100%
}

// ── Scoring Weights ─────────────────────────────────────────────────────────

const WEIGHTS = {
  // Engagement signals
  propertyViews:     { weight: 3,  max: 20 },
  photoViews:        { weight: 2,  max: 50 },
  timeOnSite:        { weight: 4,  max: 30 },   // minutes
  messagesCount:     { weight: 8,  max: 5 },
  whatsappClicks:    { weight: 10, max: 3 },
  phoneCallClicks:   { weight: 12, max: 2 },
  favoritesCount:    { weight: 5,  max: 10 },
  searchesCount:     { weight: 2,  max: 15 },
  returnVisits:      { weight: 6,  max: 5 },

  // Profile completeness
  hasEmail:          { weight: 5,  max: 1 },
  hasPhone:          { weight: 8,  max: 1 },
  hasBudget:         { weight: 5,  max: 1 },

  // Recency penalty
  recencyBonus:      15,  // max bonus for recent activity
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Calcula o score de um lead baseado em comportamento e dados de perfil.
 * Algoritmo determinístico (sem IA) — rápido e previsível.
 */
export function calculateLeadScore(behavior: LeadBehavior): LeadScoreResult {
  let rawScore = 0
  const reasons: string[] = []

  // Property views (high intent signal)
  const pvScore = Math.min(behavior.propertyViews / WEIGHTS.propertyViews.max, 1) * WEIGHTS.propertyViews.weight
  if (behavior.propertyViews >= 5) reasons.push(`Visualizou ${behavior.propertyViews} imóveis`)
  rawScore += pvScore

  // Photo views (engagement signal)
  const photoScore = Math.min(behavior.photoViews / WEIGHTS.photoViews.max, 1) * WEIGHTS.photoViews.weight
  if (behavior.photoViews >= 20) reasons.push('Alto engajamento com fotos')
  rawScore += photoScore

  // Time on site (strong intent)
  const timeScore = Math.min(behavior.timeOnSiteMinutes / WEIGHTS.timeOnSite.max, 1) * WEIGHTS.timeOnSite.weight
  if (behavior.timeOnSiteMinutes >= 10) reasons.push(`${behavior.timeOnSiteMinutes}min navegando no site`)
  rawScore += timeScore

  // Direct contact signals (highest weight)
  const msgScore = Math.min(behavior.messagesCount / WEIGHTS.messagesCount.max, 1) * WEIGHTS.messagesCount.weight
  if (behavior.messagesCount > 0) reasons.push(`Enviou ${behavior.messagesCount} mensagem(s)`)
  rawScore += msgScore

  const waScore = Math.min(behavior.whatsappClicks / WEIGHTS.whatsappClicks.max, 1) * WEIGHTS.whatsappClicks.weight
  if (behavior.whatsappClicks > 0) reasons.push('Clicou no WhatsApp')
  rawScore += waScore

  const phoneScore = Math.min(behavior.phoneCallClicks / WEIGHTS.phoneCallClicks.max, 1) * WEIGHTS.phoneCallClicks.weight
  if (behavior.phoneCallClicks > 0) reasons.push('Clicou para ligar')
  rawScore += phoneScore

  // Favorites (moderate intent)
  const favScore = Math.min(behavior.favoritesCount / WEIGHTS.favoritesCount.max, 1) * WEIGHTS.favoritesCount.weight
  if (behavior.favoritesCount >= 3) reasons.push(`${behavior.favoritesCount} imóveis favoritados`)
  rawScore += favScore

  // Search activity
  const searchScore = Math.min(behavior.searchesCount / WEIGHTS.searchesCount.max, 1) * WEIGHTS.searchesCount.weight
  rawScore += searchScore

  // Return visits (strong loyalty signal)
  const returnScore = Math.min(behavior.returnVisits / WEIGHTS.returnVisits.max, 1) * WEIGHTS.returnVisits.weight
  if (behavior.returnVisits >= 3) reasons.push(`${behavior.returnVisits} visitas de retorno`)
  rawScore += returnScore

  // Profile completeness
  if (behavior.hasEmail) rawScore += WEIGHTS.hasEmail.weight
  if (behavior.hasPhone) {
    rawScore += WEIGHTS.hasPhone.weight
    reasons.push('Telefone informado')
  }
  if (behavior.budget && behavior.budget > 0) {
    rawScore += WEIGHTS.hasBudget.weight
    reasons.push(`Orçamento definido: R$ ${behavior.budget.toLocaleString('pt-BR')}`)
  }

  // Recency bonus (decays over 30 days)
  if (behavior.lastVisitDaysAgo <= 1) {
    rawScore += WEIGHTS.recencyBonus
    reasons.push('Ativo hoje')
  } else if (behavior.lastVisitDaysAgo <= 3) {
    rawScore += WEIGHTS.recencyBonus * 0.7
    reasons.push('Ativo nos últimos 3 dias')
  } else if (behavior.lastVisitDaysAgo <= 7) {
    rawScore += WEIGHTS.recencyBonus * 0.4
  } else if (behavior.lastVisitDaysAgo <= 30) {
    rawScore += WEIGHTS.recencyBonus * 0.1
  }
  // After 30 days: no bonus (lead may be stale)

  // UTM source bonus (paid traffic = more intent)
  if (behavior.utmMedium === 'cpc' || behavior.utmMedium === 'ppc') {
    rawScore += 3
    reasons.push('Origem: tráfego pago')
  }

  // Normalize to 0-100
  const maxPossible = Object.values(WEIGHTS).reduce((sum: number, w: any) => {
    if (typeof w === 'number') return sum + w
    return sum + w.weight
  }, 0 as number)
  const score = Math.round(Math.min((rawScore / maxPossible) * 100, 100))

  // Determine temperature
  let temperature: LeadScoreResult['temperature']
  let priority: number
  if (score >= 76) {
    temperature = 'on_fire'
    priority = 1
  } else if (score >= 51) {
    temperature = 'hot'
    priority = 2
  } else if (score >= 26) {
    temperature = 'warm'
    priority = 3
  } else {
    temperature = 'cold'
    priority = 4
  }

  // Suggest action
  const suggestedAction = getSuggestedAction(temperature, behavior)

  // Estimate conversion probability
  const conversionProbability = Math.round(score * 0.6) // Simplified model

  if (reasons.length === 0) {
    reasons.push('Pouca atividade registrada')
  }

  return { score, temperature, priority, reasons, suggestedAction, conversionProbability }
}

/**
 * Usa IA para gerar uma análise mais detalhada do lead e sugerir abordagem.
 * Complementa o score numérico com insights qualitativos.
 */
export async function getAILeadInsight(
  leadName: string,
  behavior: LeadBehavior,
  scoreResult: LeadScoreResult,
): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    return scoreResult.suggestedAction
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Você é um consultor de vendas imobiliárias em Franca/SP.
Analise este lead e sugira a melhor abordagem para o corretor.

Lead: ${leadName}
Score: ${scoreResult.score}/100 (${scoreResult.temperature})
Interesse: ${behavior.interest || 'não definido'}
Orçamento: ${behavior.budget ? `R$ ${behavior.budget.toLocaleString('pt-BR')}` : 'não informado'}
Atividade: ${scoreResult.reasons.join('; ')}

Em 2-3 frases, sugira: canal de contato ideal, tom da abordagem e oferta recomendada.
Seja direto e prático. Responda em português.`,
      }],
    })

    return response.content[0].type === 'text' ? response.content[0].text.trim() : scoreResult.suggestedAction
  } catch {
    return scoreResult.suggestedAction
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getSuggestedAction(
  temperature: LeadScoreResult['temperature'],
  behavior: LeadBehavior,
): string {
  switch (temperature) {
    case 'on_fire':
      return behavior.whatsappClicks > 0
        ? 'URGENTE: Ligar imediatamente. Lead demonstrou alto interesse e já tentou contato via WhatsApp.'
        : 'URGENTE: Enviar WhatsApp com imóveis selecionados. Lead está muito engajado.'
    case 'hot':
      return 'Enviar WhatsApp personalizado com 3 sugestões de imóveis baseadas no perfil de busca.'
    case 'warm':
      return 'Enviar email com newsletter de imóveis relevantes. Acompanhar engajamento.'
    case 'cold':
      return 'Manter no funil de nutrição automática. Enviar conteúdo educacional sobre o mercado.'
  }
}
