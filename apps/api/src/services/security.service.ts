/**
 * Security Service — Data Masking, Access Grants & Error Sanitization
 *
 * LGPD-compliant data protection utilities for the AgoraEncontrei platform.
 * Handles masking of personal data, temporary access grants, and safe error responses.
 */

import type { PrismaClient } from '@prisma/client'

// ── Data Masking (LGPD) ───────────────────────────────────────────────────────

/** Mask phone: (16) 98101-0004 → (**) *****-0004 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '***'
  return `(**) *****-${digits.slice(-4)}`
}

/** Mask email: tomas@lemos.com → to***@lemos.com */
export function maskEmail(email?: string | null): string {
  if (!email) return ''
  const [user, domain] = email.split('@')
  if (!user || !domain) return '***'
  return `${user.slice(0, 2)}***@${domain}`
}

/** Mask CPF: 123.456.789-00 → ***.***.***-00 */
export function maskCpf(cpf?: string | null): string {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length < 2) return '***'
  return `***.***.***-${digits.slice(-2)}`
}

/** Apply masking to a lead/contact object */
export function maskSensitiveFields(obj: Record<string, any>): Record<string, any> {
  const result = { ...obj }
  if (result.phone) result.phone = maskPhone(result.phone)
  if (result.cellphone) result.cellphone = maskPhone(result.cellphone)
  if (result.email) result.email = maskEmail(result.email)
  if (result.cpf) result.cpf = maskCpf(result.cpf)
  if (result.rg) result.rg = '***'
  return result
}

// ── Sensitive Access Grants ───────────────────────────────────────────────────

interface GrantParams {
  userId: string
  companyId: string
  entityType: string
  entityId: string
  reason: string
  durationMinutes?: number
}

/** Grant temporary access to sensitive data (default 10 minutes) */
export async function grantSensitiveAccess(prisma: PrismaClient, params: GrantParams) {
  const expiresAt = new Date(Date.now() + (params.durationMinutes || 10) * 60_000)

  return prisma.sensitiveAccessGrant.create({
    data: {
      userId: params.userId,
      companyId: params.companyId,
      entityType: params.entityType,
      entityId: params.entityId,
      reason: params.reason,
      expiresAt,
    },
  })
}

/** Check if user has an active grant to view sensitive data */
export async function hasActiveGrant(
  prisma: PrismaClient,
  userId: string,
  entityType: string,
  entityId: string,
): Promise<boolean> {
  const grant = await prisma.sensitiveAccessGrant.findFirst({
    where: {
      userId,
      entityType,
      entityId,
      expiresAt: { gt: new Date() },
    },
  })
  return !!grant
}

// ── Error Sanitization ────────────────────────────────────────────────────────

/** Sanitize error messages for client responses — never expose internals */
export function sanitizeError(error: unknown): { message: string; status: number } {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('not found')) return { message: 'Recurso não encontrado.', status: 404 }
    if (msg.includes('unauthorized') || msg.includes('jwt')) return { message: 'Acesso não autorizado.', status: 401 }
    if (msg.includes('forbidden')) return { message: 'Acesso negado.', status: 403 }
    if (msg.includes('unique constraint')) return { message: 'Registro duplicado.', status: 409 }
  }
  return { message: 'Não foi possível processar a solicitação. Tente novamente.', status: 500 }
}

// ── Tomás Security Evaluation ─────────────────────────────────────────────────

interface ConversationRiskParams {
  requestsInLastMinute: number
  repeatedPatterns: number
  suspiciousUserAgent: boolean
}

type RiskAction = 'allow' | 'throttle' | 'challenge' | 'block'

/** Evaluate if a Tomás conversation shows signs of abuse/scraping */
export function evaluateConversationRisk(params: ConversationRiskParams): {
  score: number
  action: RiskAction
  reason: string
} {
  let score = 0

  if (params.requestsInLastMinute > 25) score += 40
  if (params.repeatedPatterns > 5) score += 30
  if (params.suspiciousUserAgent) score += 30

  if (score >= 90) return { score, action: 'block', reason: 'Atividade bloqueada por segurança.' }
  if (score >= 70) return { score, action: 'challenge', reason: 'Preciso confirmar que estou falando com uma pessoa real.' }
  if (score >= 40) return { score, action: 'throttle', reason: 'Vou precisar de um momento para processar.' }

  return { score, action: 'allow', reason: '' }
}
