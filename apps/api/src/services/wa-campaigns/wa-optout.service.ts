/**
 * Registro de opt-out (descadastro) por empresa.
 *
 * Toda campanha respeita este registro: um número que pediu SAIR/PARAR nunca
 * mais recebe disparo daquela empresa. Também trata respostas recebidas,
 * detectando palavras-chave de descadastro e abrindo atendimento no CRM.
 */

import type { PrismaClient } from '@prisma/client'
import { normalizePhoneBR } from './phone.util.js'

/** Palavras-chave que, sozinhas na mensagem, disparam descadastro imediato. */
export const OPT_OUT_KEYWORDS = [
  'sair',
  'parar',
  'pare',
  'cancelar',
  'descadastrar',
  'remover',
  'stop',
  'unsubscribe',
]

/** true quando o texto recebido é (essencialmente) um pedido de descadastro. */
export function isOptOutMessage(text: string): boolean {
  if (!text) return false
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z\s]/g, '')
    .trim()

  if (!normalized) return false

  const words = normalized.split(/\s+/)
  // Match exato, ou keyword como palavra inteira em mensagem curta (<=4 palavras).
  // Evita falso positivo em frases longas ("quando sair o lançamento me avise").
  if (OPT_OUT_KEYWORDS.includes(normalized)) return true
  if (words.length <= 4 && words.some((w) => OPT_OUT_KEYWORDS.includes(w))) return true
  return false
}

/** true se o número está descadastrado para a empresa. */
export async function isOptedOut(
  prisma: PrismaClient,
  companyId: string,
  phoneE164: string,
): Promise<boolean> {
  const row = await (prisma as any).waOptOut
    .findUnique({ where: { companyId_phoneE164: { companyId, phoneE164 } } })
    .catch(() => null)
  return !!row
}

/** Retorna o conjunto de números (E.164) descadastrados dentre os informados. */
export async function getOptedOutSet(
  prisma: PrismaClient,
  companyId: string,
  phones: string[],
): Promise<Set<string>> {
  if (phones.length === 0) return new Set()
  const rows = await (prisma as any).waOptOut
    .findMany({
      where: { companyId, phoneE164: { in: phones } },
      select: { phoneE164: true },
    })
    .catch(() => [])
  return new Set(rows.map((r: any) => r.phoneE164))
}

/** Adiciona (idempotente) um número ao registro de opt-out. */
export async function addOptOut(
  prisma: PrismaClient,
  input: { companyId: string; phoneE164: string; reason?: string; source?: string },
): Promise<void> {
  await (prisma as any).waOptOut
    .upsert({
      where: { companyId_phoneE164: { companyId: input.companyId, phoneE164: input.phoneE164 } },
      create: {
        companyId: input.companyId,
        phoneE164: input.phoneE164,
        reason: input.reason ?? 'keyword',
        source: input.source,
      },
      update: {},
    })
    .catch(() => null)
}

export interface InboundReplyResult {
  handled: boolean
  optedOut: boolean
  recipientId?: string
  leadId?: string
}

/**
 * Processa uma resposta recebida via WhatsApp.
 *
 * - Se for pedido de descadastro → registra opt-out e marca o destinatário
 *   como UNSUBSCRIBED (respeitando SAIR).
 * - Caso contrário → marca REPLIED e abre atendimento no CRM (Lead), para que
 *   um corretor continue a conversa.
 */
export async function handleInboundReply(
  prisma: PrismaClient,
  input: { companyId: string; phone: string; text: string },
): Promise<InboundReplyResult> {
  const norm = normalizePhoneBR(input.phone)
  const phoneE164 = norm.e164 ?? input.phone

  // Localiza o destinatário mais recente com este número, para vincular resposta.
  const recipient = await (prisma as any).waCampaignRecipient
    .findFirst({
      where: { companyId: input.companyId, phoneE164 },
      orderBy: { createdAt: 'desc' },
    })
    .catch(() => null)

  if (isOptOutMessage(input.text)) {
    await addOptOut(prisma, {
      companyId: input.companyId,
      phoneE164,
      reason: 'keyword',
      source: 'inbound_reply',
    })
    if (recipient) {
      await (prisma as any).waCampaignRecipient
        .update({ where: { id: recipient.id }, data: { status: 'UNSUBSCRIBED' } })
        .catch(() => null)
      await (prisma as any).waCampaign
        .update({ where: { id: recipient.campaignId }, data: { totalOptOut: { increment: 1 } } })
        .catch(() => null)
    }
    return { handled: true, optedOut: true, recipientId: recipient?.id }
  }

  // Resposta normal → abre/atualiza atendimento (Lead) e marca REPLIED.
  let leadId: string | undefined
  if (recipient) {
    await (prisma as any).waCampaignRecipient
      .update({
        where: { id: recipient.id },
        data: { status: 'REPLIED', repliedAt: new Date() },
      })
      .catch(() => null)
    await (prisma as any).waCampaign
      .update({ where: { id: recipient.campaignId }, data: { totalReplied: { increment: 1 } } })
      .catch(() => null)
  }

  // Cria um Lead de atendimento (best-effort — não bloqueia a resposta).
  try {
    const existing = await prisma.lead.findFirst({
      where: { companyId: input.companyId, phone: phoneE164 },
      select: { id: true },
    })
    if (existing) {
      leadId = existing.id
    } else {
      const lead = await prisma.lead.create({
        data: {
          companyId: input.companyId,
          name: recipient?.name ?? `Contato ${phoneE164}`,
          phone: phoneE164,
          source: 'whatsapp_campaign',
          status: 'NEW',
          notes: `Respondeu campanha WhatsApp: "${input.text.slice(0, 280)}"`,
        },
        select: { id: true },
      })
      leadId = lead.id
    }
  } catch {
    // Schema de Lead pode variar entre ambientes — resposta não deve falhar.
  }

  return { handled: true, optedOut: false, recipientId: recipient?.id, leadId }
}
