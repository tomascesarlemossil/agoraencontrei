/**
 * Consentimento de transferência de lead (MARKETPLACE → parceiro) — Fase 4.
 *
 * Regra: nenhum dado de um usuário do marketplace vai para uma imobiliária sem
 * consentimento EXPLÍCITO, informado e versionado. Guardamos o texto exato
 * mostrado, os dados mínimos enviados, a finalidade, o canal, a origem, o
 * carimbo de tempo e uma eventual revogação. Toda ação gera trilha de auditoria.
 */
import type { PrismaClient, Prisma } from '@prisma/client'

/** Versão do texto de consentimento. Suba ao mudar o texto/campos. */
export const CONSENT_TEXT_VERSION = '2026-07-04.v1'

/** Campos que PODEM ser transferidos — o mínimo necessário, nunca o chat todo. */
export const TRANSFERABLE_LEAD_FIELDS = [
  'name', 'phone', 'email', 'interest', 'city', 'priceRange', 'paymentForm', 'bestTime',
] as const
export type TransferableField = typeof TRANSFERABLE_LEAD_FIELDS[number]

export interface LeadDataInput {
  name?: string
  phone?: string
  email?: string
  interest?: string
  city?: string
  priceRange?: string
  paymentForm?: string
  bestTime?: string
  /** Qualquer outro campo é DESCARTADO (minimização de dados). */
  [k: string]: unknown
}

/** Reduz um objeto de lead ao mínimo transferível (descarta o resto). */
export function minimalLeadData(input: LeadDataInput): Partial<Record<TransferableField, string>> {
  const out: Partial<Record<TransferableField, string>> = {}
  for (const f of TRANSFERABLE_LEAD_FIELDS) {
    const v = input[f]
    if (typeof v === 'string' && v.trim()) out[f] = v.trim()
  }
  return out
}

/** Texto informado exibido ao usuário ANTES de pedir o consentimento. */
export function buildConsentText(params: {
  partnerName: string
  data: Partial<Record<TransferableField, string>>
  purpose: string
  channel: string
}): string {
  const fields = Object.keys(params.data)
  const fieldLabels: Record<string, string> = {
    name: 'nome', phone: 'telefone', email: 'e-mail', interest: 'interesse',
    city: 'cidade', priceRange: 'faixa de preço', paymentForm: 'forma de pagamento', bestTime: 'melhor horário',
  }
  const shared = fields.map(f => fieldLabels[f] || f).join(', ') || 'nenhum dado'
  return (
    `Autorizo o AgoraEncontrei a enviar meus dados (${shared}) para ${params.partnerName} ` +
    `com a finalidade de ${params.purpose}, para contato via ${params.channel}. ` +
    `Posso revogar esta autorização a qualquer momento.`
  )
}

async function writeAudit(
  prisma: PrismaClient,
  action: string,
  toCompanyId: string,
  payload: Prisma.InputJsonValue,
) {
  try {
    await prisma.auditLog.create({
      data: { companyId: toCompanyId, action, resource: 'lead_transfer_consent', payload },
    })
  } catch {
    // auditoria nunca deve quebrar o fluxo principal
  }
}

export interface RecordConsentInput {
  chatId?: string
  visitorId?: string
  leadId?: string
  toCompanyId: string
  toCompanyName?: string
  purpose: string
  channel: string
  data: LeadDataInput
  source?: string
}

/** Registra o consentimento (minimiza dados, guarda texto+versão) + auditoria. */
export async function recordLeadTransferConsent(prisma: PrismaClient, input: RecordConsentInput) {
  const data = minimalLeadData(input.data)
  const consentText = buildConsentText({
    partnerName: input.toCompanyName || 'o parceiro',
    data, purpose: input.purpose, channel: input.channel,
  })
  const rec = await prisma.leadTransferConsent.create({
    data: {
      chatId: input.chatId,
      visitorId: input.visitorId,
      leadId: input.leadId,
      fromBrain: 'marketplace',
      toCompanyId: input.toCompanyId,
      toCompanyName: input.toCompanyName,
      purpose: input.purpose,
      channel: input.channel,
      dataShared: data as Prisma.InputJsonValue,
      consentText,
      consentVersion: CONSENT_TEXT_VERSION,
      source: input.source,
      granted: true,
    },
  })
  await writeAudit(prisma, 'lead_transfer.consent_granted', input.toCompanyId, {
    consentId: rec.id, version: CONSENT_TEXT_VERSION, fields: Object.keys(data),
    visitorId: input.visitorId ?? null, chatId: input.chatId ?? null,
  })
  return rec
}

/** True se existe consentimento vigente (concedido e não revogado) para o par. */
export async function hasValidConsent(
  prisma: PrismaClient,
  params: { toCompanyId: string; visitorId?: string; chatId?: string },
): Promise<boolean> {
  if (!params.visitorId && !params.chatId) return false
  const rec = await prisma.leadTransferConsent.findFirst({
    where: {
      toCompanyId: params.toCompanyId,
      granted: true,
      revokedAt: null,
      OR: [
        ...(params.visitorId ? [{ visitorId: params.visitorId }] : []),
        ...(params.chatId ? [{ chatId: params.chatId }] : []),
      ],
    },
    orderBy: { grantedAt: 'desc' },
  })
  return !!rec
}

/** Revoga o consentimento (respeitado por hasValidConsent) + auditoria. */
export async function revokeLeadTransferConsent(
  prisma: PrismaClient,
  params: { toCompanyId: string; visitorId?: string; chatId?: string },
): Promise<number> {
  const res = await prisma.leadTransferConsent.updateMany({
    where: {
      toCompanyId: params.toCompanyId,
      granted: true,
      revokedAt: null,
      OR: [
        ...(params.visitorId ? [{ visitorId: params.visitorId }] : []),
        ...(params.chatId ? [{ chatId: params.chatId }] : []),
      ],
    },
    data: { granted: false, revokedAt: new Date() },
  })
  if (res.count > 0) {
    await writeAudit(prisma, 'lead_transfer.consent_revoked', params.toCompanyId, {
      count: res.count, visitorId: params.visitorId ?? null, chatId: params.chatId ?? null,
    })
  }
  return res.count
}
