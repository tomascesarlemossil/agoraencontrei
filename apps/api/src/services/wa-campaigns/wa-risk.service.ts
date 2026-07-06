/**
 * Cálculo de risco de campanha.
 *
 * O objetivo é evitar spam, proteger a reputação do número do usuário e forçar
 * revisão humana quando a campanha tem sinais de risco (lista grande, muitos
 * inválidos, base LGPD frágil, ausência de template aprovado etc.).
 *
 * Função pura → fácil de testar e reutilizar na UI (preview de risco).
 */

export interface RiskInput {
  totalValid: number
  totalInvalid: number
  totalBlockedOptOut: number
  /** Distribuição de destinatários por base LGPD (consentBasis → contagem). */
  consentBasisCounts: Record<string, number>
  hasApprovedTemplate: boolean
  messageBody: string
  /** Fração de contatos vindos do agente de prospecção (0..1). */
  prospectFraction?: number
}

export interface RiskFactor {
  code: string
  label: string
  weight: number
}

export type RiskLevel = 'low' | 'medium' | 'high'

export interface RiskResult {
  score: number // 0-100
  level: RiskLevel
  requiresApproval: boolean
  factors: RiskFactor[]
}

/** Bases LGPD consideradas "fortes" (relação prévia com o titular). */
const STRONG_CONSENT = new Set(['consent', 'contract', 'existing_customer'])

const LINK_REGEX = /(https?:\/\/|wa\.me\/|bit\.ly|\b\w+\.(com|br|net|io)\b)/i

export function computeCampaignRisk(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = []
  let score = 0

  const totalRecipients = input.totalValid
  const totalContacts =
    input.totalValid + input.totalInvalid + input.totalBlockedOptOut

  // 1) Tamanho da lista — quanto maior, maior o risco de ser tratado como spam.
  if (totalRecipients > 500) {
    factors.push({ code: 'large_list', label: 'Lista muito grande (>500)', weight: 30 })
    score += 30
  } else if (totalRecipients > 200) {
    factors.push({ code: 'large_list', label: 'Lista grande (>200)', weight: 18 })
    score += 18
  } else if (totalRecipients > 50) {
    factors.push({ code: 'medium_list', label: 'Lista média (>50)', weight: 8 })
    score += 8
  }

  // 2) Qualidade da lista — muitos números inválidos indicam base "comprada"/suja.
  if (totalContacts > 0) {
    const invalidFraction = input.totalInvalid / totalContacts
    if (invalidFraction > 0.3) {
      factors.push({ code: 'dirty_list', label: 'Muitos telefones inválidos (>30%)', weight: 20 })
      score += 20
    } else if (invalidFraction > 0.1) {
      factors.push({ code: 'some_invalid', label: 'Telefones inválidos (>10%)', weight: 8 })
      score += 8
    }
  }

  // 3) Base LGPD — proporção sem base forte de uso do contato.
  const weakConsent = Object.entries(input.consentBasisCounts).reduce(
    (sum, [basis, count]) => (STRONG_CONSENT.has(basis) ? sum : sum + count),
    0,
  )
  if (totalRecipients > 0) {
    const weakFraction = weakConsent / totalRecipients
    if (weakFraction > 0.5) {
      factors.push({ code: 'weak_lgpd', label: 'Maioria sem base forte de consentimento (LGPD)', weight: 25 })
      score += 25
    } else if (weakFraction > 0.2) {
      factors.push({ code: 'partial_lgpd', label: 'Parte da lista sem consentimento explícito', weight: 12 })
      score += 12
    }
  }

  // 4) Origem de prospecção — contatos comerciais pesquisados exigem mais cautela.
  if (input.prospectFraction && input.prospectFraction > 0.3) {
    factors.push({ code: 'prospected', label: 'Muitos contatos de prospecção pública', weight: 15 })
    score += 15
  }

  // 5) Template aprovado — sem template WABA aprovado o envio em massa é arriscado.
  if (!input.hasApprovedTemplate) {
    factors.push({ code: 'no_template', label: 'Sem modelo (template) aprovado', weight: 15 })
    score += 15
  }

  // 6) Mensagem com link — links elevam bloqueio/spam e devem ser revisados.
  if (LINK_REGEX.test(input.messageBody || '')) {
    factors.push({ code: 'contains_link', label: 'Mensagem contém link', weight: 6 })
    score += 6
  }

  score = Math.min(100, score)

  let level: RiskLevel = 'low'
  if (score >= 60) level = 'high'
  else if (score >= 25) level = 'medium'

  // Aprovação humana obrigatória para risco médio/alto.
  const requiresApproval = level !== 'low'

  return { score, level, requiresApproval, factors }
}
