/**
 * Serviço central de campanhas de WhatsApp.
 *
 * Orquestra: criação, ingestão de destinatários (normalização + dedupe +
 * bloqueio de opt-out + registro de origem/base LGPD), cálculo de risco,
 * aprovação humana e disparo pela fila (com envio simulado no MVP).
 */

import type { PrismaClient } from '@prisma/client'
import type { Queue } from 'bullmq'
import { normalizePhoneBR } from './phone.util.js'
import { getOptedOutSet } from './wa-optout.service.js'
import { computeCampaignRisk } from './wa-risk.service.js'
import { getWaProvider, renderMessage } from './wa-provider.js'

export const WA_CAMPAIGNS_QUEUE = 'wa-campaigns'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateCampaignInput {
  companyId: string
  createdById: string
  name: string
  propertyId?: string
  empreendimento?: string
  templateName?: string
  templateLang?: string
  messageBody: string
  variables?: Record<string, unknown>
  scheduledAt?: Date
}

export interface RecipientEntry {
  raw: string
  name?: string
  source?: string
  consentBasis?: string
  sourceRef?: string
  variables?: Record<string, unknown>
}

export interface AddRecipientsReport {
  added: number
  invalid: number
  duplicatesInBatch: number
  duplicatesExisting: number
  blockedOptOut: number
  invalidSamples: { raw: string; reason?: string }[]
}

// ── Criação / leitura ────────────────────────────────────────────────────────

export async function createCampaign(prisma: PrismaClient, input: CreateCampaignInput) {
  return (prisma as any).waCampaign.create({
    data: {
      companyId: input.companyId,
      createdById: input.createdById,
      name: input.name,
      propertyId: input.propertyId,
      empreendimento: input.empreendimento,
      templateName: input.templateName,
      templateLang: input.templateLang ?? 'pt_BR',
      messageBody: input.messageBody,
      variables: (input.variables ?? {}) as any,
      scheduledAt: input.scheduledAt,
      status: 'DRAFT',
    },
  })
}

export async function getCampaign(prisma: PrismaClient, companyId: string, id: string) {
  return (prisma as any).waCampaign.findFirst({
    where: { id, companyId },
    include: {
      recipients: { orderBy: { createdAt: 'desc' }, take: 500 },
    },
  })
}

export async function listCampaigns(prisma: PrismaClient, companyId: string, status?: string) {
  return (prisma as any).waCampaign.findMany({
    where: { companyId, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

// ── Ingestão de destinatários ────────────────────────────────────────────────

/**
 * Normaliza, deduplica, bloqueia opt-out e persiste destinatários.
 * Origem (source) e base LGPD (consentBasis) são obrigatórias por contato.
 */
export async function addRecipients(
  prisma: PrismaClient,
  args: { campaignId: string; companyId: string; entries: RecipientEntry[] },
): Promise<AddRecipientsReport> {
  const { campaignId, companyId, entries } = args

  const report: AddRecipientsReport = {
    added: 0,
    invalid: 0,
    duplicatesInBatch: 0,
    duplicatesExisting: 0,
    blockedOptOut: 0,
    invalidSamples: [],
  }

  // 1) Normaliza e separa válidos/inválidos, deduplicando dentro do lote.
  const seenInBatch = new Set<string>()
  const validEntries: { e164: string; entry: RecipientEntry }[] = []
  const invalidRows: any[] = []

  for (const entry of entries) {
    const n = normalizePhoneBR(entry.raw)
    if (!n.valid || !n.e164) {
      report.invalid++
      if (report.invalidSamples.length < 20) {
        report.invalidSamples.push({ raw: entry.raw, reason: n.reason })
      }
      invalidRows.push({
        campaignId,
        companyId,
        name: entry.name,
        rawPhone: entry.raw,
        phoneE164: null,
        valid: false,
        invalidReason: n.reason,
        source: entry.source ?? 'import',
        consentBasis: entry.consentBasis ?? 'consent',
        sourceRef: entry.sourceRef,
        status: 'SKIPPED',
        variables: (entry.variables ?? {}) as any,
      })
      continue
    }
    if (seenInBatch.has(n.e164)) {
      report.duplicatesInBatch++
      continue
    }
    seenInBatch.add(n.e164)
    validEntries.push({ e164: n.e164, entry })
  }

  const batchPhones = validEntries.map((v) => v.e164)

  // 2) Duplicados já existentes na campanha.
  const existing = await (prisma as any).waCampaignRecipient
    .findMany({
      where: { campaignId, phoneE164: { in: batchPhones } },
      select: { phoneE164: true },
    })
    .catch(() => [])
  const existingSet = new Set<string>(existing.map((r: any) => r.phoneE164))

  // 3) Bloqueio de opt-out (LGPD / descadastro).
  const optedOut = await getOptedOutSet(prisma, companyId, batchPhones)

  const toCreate: any[] = [...invalidRows]

  for (const { e164, entry } of validEntries) {
    if (existingSet.has(e164)) {
      report.duplicatesExisting++
      continue
    }
    const isOptOut = optedOut.has(e164)
    if (isOptOut) report.blockedOptOut++
    else report.added++

    toCreate.push({
      campaignId,
      companyId,
      name: entry.name,
      rawPhone: entry.raw,
      phoneE164: e164,
      valid: true,
      source: entry.source ?? 'import',
      consentBasis: entry.consentBasis ?? 'consent',
      sourceRef: entry.sourceRef,
      status: isOptOut ? 'UNSUBSCRIBED' : 'PENDING',
      variables: (entry.variables ?? {}) as any,
    })
  }

  if (toCreate.length > 0) {
    await (prisma as any).waCampaignRecipient.createMany({ data: toCreate, skipDuplicates: true })
  }

  await refreshCampaignCounts(prisma, campaignId)
  await recomputeRisk(prisma, campaignId).catch(() => null)

  return report
}

export async function removeRecipient(
  prisma: PrismaClient,
  companyId: string,
  campaignId: string,
  recipientId: string,
) {
  await (prisma as any).waCampaignRecipient
    .deleteMany({ where: { id: recipientId, campaignId, companyId } })
    .catch(() => null)
  await refreshCampaignCounts(prisma, campaignId)
}

// ── Risco ────────────────────────────────────────────────────────────────────

export async function recomputeRisk(prisma: PrismaClient, campaignId: string) {
  const campaign = await (prisma as any).waCampaign.findUnique({ where: { id: campaignId } })
  if (!campaign) return null

  const recipients = await (prisma as any).waCampaignRecipient.findMany({
    where: { campaignId },
    select: { valid: true, status: true, consentBasis: true, source: true },
  })

  let totalValid = 0
  let totalInvalid = 0
  let totalBlockedOptOut = 0
  let prospected = 0
  const consentBasisCounts: Record<string, number> = {}

  for (const r of recipients) {
    if (!r.valid) {
      totalInvalid++
      continue
    }
    if (r.status === 'UNSUBSCRIBED') {
      totalBlockedOptOut++
      continue
    }
    totalValid++
    consentBasisCounts[r.consentBasis] = (consentBasisCounts[r.consentBasis] ?? 0) + 1
    if (r.source === 'prospect_agent') prospected++
  }

  const risk = computeCampaignRisk({
    totalValid,
    totalInvalid,
    totalBlockedOptOut,
    consentBasisCounts,
    hasApprovedTemplate: !!campaign.templateName,
    messageBody: campaign.messageBody,
    prospectFraction: totalValid > 0 ? prospected / totalValid : 0,
  })

  await (prisma as any).waCampaign.update({
    where: { id: campaignId },
    data: {
      riskScore: risk.score,
      riskLevel: risk.level,
      riskFactors: risk.factors as any,
      requiresApproval: risk.requiresApproval,
    },
  })

  return risk
}

// ── Aprovação ────────────────────────────────────────────────────────────────

export async function approveCampaign(
  prisma: PrismaClient,
  companyId: string,
  campaignId: string,
  approvedById: string,
) {
  const campaign = await (prisma as any).waCampaign.findFirst({ where: { id: campaignId, companyId } })
  if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND')
  return (prisma as any).waCampaign.update({
    where: { id: campaignId },
    data: { status: 'APPROVED', approvedById, approvedAt: new Date() },
  })
}

// ── Disparo ──────────────────────────────────────────────────────────────────

export interface DispatchResult {
  enqueued: number
  mode: 'queue' | 'inline'
  simulated: boolean
}

/**
 * Enfileira o disparo. Exige aprovação humana quando o risco pede.
 * Sem Redis/fila, processa inline (útil em dev/testes). No MVP tudo é simulado.
 */
export async function dispatchCampaign(
  prisma: PrismaClient,
  queue: Queue | null,
  args: { companyId: string; campaignId: string },
): Promise<DispatchResult> {
  const campaign = await (prisma as any).waCampaign.findFirst({
    where: { id: args.campaignId, companyId: args.companyId },
  })
  if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND')

  if (campaign.requiresApproval && campaign.status !== 'APPROVED') {
    throw new Error('APPROVAL_REQUIRED')
  }
  if (['SENDING', 'SENT', 'QUEUED'].includes(campaign.status)) {
    throw new Error('ALREADY_DISPATCHED')
  }

  const recipients = await (prisma as any).waCampaignRecipient.findMany({
    where: { campaignId: args.campaignId, status: 'PENDING', valid: true },
    select: { id: true },
  })

  await (prisma as any).waCampaign.update({
    where: { id: args.campaignId },
    data: { status: 'SENDING', startedAt: new Date() },
  })

  const provider = await getWaProvider(prisma, args.companyId)
  const simulated = provider.name === 'simulated'

  if (queue) {
    for (const r of recipients) {
      await queue.add(
        'send',
        { recipientId: r.id, campaignId: args.campaignId, companyId: args.companyId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 1000 },
        },
      )
    }
    await (prisma as any).waCampaignRecipient.updateMany({
      where: { campaignId: args.campaignId, status: 'PENDING', valid: true },
      data: { status: 'QUEUED', queuedAt: new Date() },
    })
    return { enqueued: recipients.length, mode: 'queue', simulated }
  }

  // Fallback inline (sem Redis) — processa cada destinatário sequencialmente.
  for (const r of recipients) {
    await processRecipient(prisma, r.id).catch(() => null)
  }
  await finalizeCampaignIfDone(prisma, args.campaignId)
  return { enqueued: recipients.length, mode: 'inline', simulated }
}

/**
 * Processa um destinatário: revalida opt-out, envia via provider e atualiza
 * status. Usado tanto pelo worker da fila quanto pelo fallback inline.
 */
export async function processRecipient(prisma: PrismaClient, recipientId: string): Promise<void> {
  const recipient = await (prisma as any).waCampaignRecipient.findUnique({ where: { id: recipientId } })
  if (!recipient || !recipient.valid || !recipient.phoneE164) return
  if (['SENT', 'DELIVERED', 'READ', 'REPLIED', 'UNSUBSCRIBED'].includes(recipient.status)) return

  const campaign = await (prisma as any).waCampaign.findUnique({ where: { id: recipient.campaignId } })
  if (!campaign) return

  // Revalida opt-out no momento do envio (pode ter chegado SAIR depois).
  const optOut = await (prisma as any).waOptOut
    .findUnique({
      where: { companyId_phoneE164: { companyId: recipient.companyId, phoneE164: recipient.phoneE164 } },
    })
    .catch(() => null)
  if (optOut) {
    await (prisma as any).waCampaignRecipient.update({
      where: { id: recipientId },
      data: { status: 'UNSUBSCRIBED' },
    })
    await (prisma as any).waCampaign.update({
      where: { id: campaign.id },
      data: { totalOptOut: { increment: 1 } },
    })
    return
  }

  const provider = await getWaProvider(prisma, recipient.companyId)
  const variables = {
    ...(campaign.variables as Record<string, unknown>),
    ...(recipient.variables as Record<string, unknown>),
    nome: recipient.name ?? '',
  }
  const body = renderMessage(campaign.messageBody, variables)

  const result = await provider.send({
    to: recipient.phoneE164,
    body,
    templateName: campaign.templateName ?? undefined,
    templateLang: campaign.templateLang,
  })

  if (result.status === 'FAILED') {
    await (prisma as any).waCampaignRecipient.update({
      where: { id: recipientId },
      data: { status: 'FAILED', errorMessage: result.errorMessage },
    })
    await (prisma as any).waCampaign.update({
      where: { id: campaign.id },
      data: { totalFailed: { increment: 1 } },
    })
    return
  }

  // No modo simulado marcamos DELIVERED direto (não há webhook de entrega).
  const finalStatus = result.simulated ? 'DELIVERED' : 'SENT'
  await (prisma as any).waCampaignRecipient.update({
    where: { id: recipientId },
    data: {
      status: finalStatus,
      providerMessageId: result.providerMessageId,
      sentAt: new Date(),
      ...(result.simulated ? { deliveredAt: new Date() } : {}),
    },
  })
  await (prisma as any).waCampaign.update({
    where: { id: campaign.id },
    data: {
      totalSent: { increment: 1 },
      ...(result.simulated ? { totalDelivered: { increment: 1 } } : {}),
    },
  })
}

/** Marca a campanha como SENT quando não há mais destinatários pendentes/na fila. */
export async function finalizeCampaignIfDone(prisma: PrismaClient, campaignId: string): Promise<void> {
  const pending = await (prisma as any).waCampaignRecipient.count({
    where: { campaignId, status: { in: ['PENDING', 'QUEUED'] } },
  })
  if (pending === 0) {
    await (prisma as any).waCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENT', completedAt: new Date() },
    })
  }
}

export async function cancelCampaign(prisma: PrismaClient, companyId: string, campaignId: string) {
  return (prisma as any).waCampaign.updateMany({
    where: { id: campaignId, companyId, status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'QUEUED'] } },
    data: { status: 'CANCELLED' },
  })
}

// ── Utilidades ───────────────────────────────────────────────────────────────

/** Recalcula os contadores agregados da campanha a partir dos destinatários. */
export async function refreshCampaignCounts(prisma: PrismaClient, campaignId: string): Promise<void> {
  const recipients = await (prisma as any).waCampaignRecipient.findMany({
    where: { campaignId },
    select: { status: true, valid: true },
  })
  let totalRecipients = 0
  let totalOptOut = 0
  for (const r of recipients) {
    if (r.valid && r.status !== 'SKIPPED') totalRecipients++
    if (r.status === 'UNSUBSCRIBED') totalOptOut++
  }
  await (prisma as any).waCampaign.update({
    where: { id: campaignId },
    data: { totalRecipients, totalOptOut },
  })
}
