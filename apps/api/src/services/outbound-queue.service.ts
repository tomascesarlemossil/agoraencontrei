/**
 * Outbound Queue Service — BullMQ-powered message dispatch
 *
 * Rate-limited WhatsApp outbound with:
 * - A/B/C template rotation
 * - Sender number rotation
 * - Random delay (30-120s) between messages
 * - Per-number hourly limits (30 msgs/hour)
 * - Campaign tracking
 */

import type { PrismaClient } from '@prisma/client'
import type { Queue } from 'bullmq'

// ── Message Templates ───────────────────────────────────────────────────────

export interface OutboundTemplate {
  version: string
  body: (name: string, previewLink: string) => string
}

export const OUTBOUND_TEMPLATES: OutboundTemplate[] = [
  {
    version: 'A',
    body: (name, link) =>
      `Fala ${name}, tudo bem?\n\nMontei um modelo de portal com IA pra você 👇\n${link}\n\nEle já atende cliente automático e manda lead no WhatsApp.`,
  },
  {
    version: 'B',
    body: (name, link) =>
      `Vi seu perfil e fiz um rascunho de como ficaria seu portal 👇\n${link}\n\nIsso aqui já começa a gerar cliente direto no WhatsApp, ${name}.`,
  },
  {
    version: 'C',
    body: (name, link) =>
      `${name}, hoje você depende de portal…\n\nMas dá pra ter o seu próprio com IA 👇\n${link}\n\nOlha esse exemplo que montei pra você.`,
  },
]

// ── Follow-up Templates ─────────────────────────────────────────────────────

export const FOLLOWUP_TEMPLATES: Record<string, (name: string) => string> = {
  d1: (name) =>
    `Fala ${name}, conseguiu ver o modelo que te mandei?\n\nPosso ativar pra você hoje se quiser.`,
  d3: (name) =>
    `${name}, se você começar hoje, já pode ter cliente entrando essa semana.\n\nQuer testar?`,
  d7: (name) =>
    `${name}, vou encerrar os testes gratuitos em breve.\n\nQuer garantir o seu portal antes?`,
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface EnqueueOutboundInput {
  leadId?: string
  funnelId?: string
  name: string
  phone: string
  previewSiteName?: string
  campaignId?: string
  senderNumber?: string
  templateVersion?: string // Force specific version, otherwise random
}

export interface OutboundJobData {
  outboundId: string
  phone: string
  message: string
  senderNumber: string
  previewLink?: string
}

// ── Configuration ───────────────────────────────────────────────────────────

const MAX_MSGS_PER_HOUR_PER_NUMBER = 30
const MIN_DELAY_MS = 30_000  // 30 seconds
const MAX_DELAY_MS = 120_000 // 120 seconds

// Default sender numbers — configured via env or database
function getSenderNumbers(): string[] {
  const numbers = process.env.OUTBOUND_SENDER_NUMBERS
  if (numbers) return numbers.split(',').map(n => n.trim())
  // Fallback to main WhatsApp number
  const main = process.env.WHATSAPP_PHONE_ID
  return main ? [main] : ['default']
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Select the next sender number using round-robin with hourly rate limiting
 */
export async function selectSenderNumber(prisma: PrismaClient): Promise<string> {
  const numbers = getSenderNumbers()
  if (numbers.length === 0) throw new Error('No sender numbers configured')

  const oneHourAgo = new Date(Date.now() - 3_600_000)

  // Find the number with the fewest sends in the last hour
  const counts = await Promise.all(
    numbers.map(async (num) => {
      const count = await (prisma as any).outboundMessage.count({
        where: {
          senderNumber: num,
          sentAt: { gte: oneHourAgo },
          status: { in: ['sent', 'delivered', 'read'] },
        },
      }).catch(() => 0)
      return { number: num, count }
    }),
  )

  // Filter out numbers that have hit the limit
  const available = counts.filter(c => c.count < MAX_MSGS_PER_HOUR_PER_NUMBER)
  if (available.length === 0) {
    throw new Error('All sender numbers at rate limit — try again later')
  }

  // Pick the one with the fewest sends
  available.sort((a, b) => a.count - b.count)
  return available[0].number
}

/**
 * Select a random template version, or use the specified one
 */
function selectTemplate(version?: string): OutboundTemplate {
  if (version) {
    return OUTBOUND_TEMPLATES.find(t => t.version === version) ?? OUTBOUND_TEMPLATES[0]
  }
  return OUTBOUND_TEMPLATES[Math.floor(Math.random() * OUTBOUND_TEMPLATES.length)]
}

/**
 * Generate a random delay between MIN and MAX
 */
function randomDelay(): number {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS
}

/**
 * Generate the preview link for a lead
 */
function buildPreviewLink(siteName: string): string {
  const webUrl = process.env.WEB_URL || 'https://agoraencontrei.com.br'
  return `${webUrl}/preview/${siteName}`
}

/**
 * Enqueue a single outbound message
 */
export async function enqueueOutbound(
  prisma: PrismaClient,
  queue: Queue | null,
  input: EnqueueOutboundInput,
): Promise<{ outboundId: string; template: string }> {
  const senderNumber = input.senderNumber ?? await selectSenderNumber(prisma)
  const template = selectTemplate(input.templateVersion)

  const previewLink = input.previewSiteName
    ? buildPreviewLink(input.previewSiteName)
    : ''

  const message = template.body(input.name, previewLink)

  // Create OutboundMessage record
  const outbound = await (prisma as any).outboundMessage.create({
    data: {
      leadId: input.leadId,
      phone: input.phone,
      senderNumber,
      templateVersion: template.version,
      campaignId: input.campaignId,
      channel: 'whatsapp',
      message,
      previewLink: previewLink || null,
      status: 'queued',
      metadata: {
        funnelId: input.funnelId,
        enqueuedAt: new Date().toISOString(),
      },
    },
  })

  // Enqueue to BullMQ with random delay.
  // jobId = outbound.id garante idempotência: se o mesmo outbound
  // for re-enfileirado (retry manual, race em chamadas concorrentes),
  // BullMQ descarta o duplicado. Sem isso, 2 calls concorrentes com
  // a mesma mensagem resultariam em 2 envios.
  if (queue) {
    const delay = randomDelay()
    try {
      await queue.add(
        'outbound:send',
        {
          outboundId: outbound.id,
          phone: input.phone,
          message,
          senderNumber,
          previewLink: previewLink || undefined,
        } as OutboundJobData,
        {
          jobId: outbound.id,
          delay,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 200 },
        },
      )
    } catch (err: any) {
      // Compensação: se a fila falhou (Redis down, payload reject),
      // marca o registro como failed para não ficar eternamente "queued"
      // órfão no banco. Sem isso, dashboard de outbound contabilizaria
      // mensagem como "pendente de envio" que nunca sairá.
      await (prisma as any).outboundMessage.update({
        where: { id: outbound.id },
        data: {
          status: 'failed',
          errorMessage: `Queue enqueue failed: ${err?.message?.slice(0, 480) ?? 'unknown'}`,
        },
      }).catch(() => {
        // best-effort — se DB também falhou, o erro original propaga
      })
      throw err
    }
  }

  return { outboundId: outbound.id, template: template.version }
}

/**
 * Enqueue multiple leads for a campaign
 */
export async function enqueueBatchOutbound(
  prisma: PrismaClient,
  queue: Queue | null,
  leads: Array<{ leadId?: string; funnelId?: string; name: string; phone: string; previewSiteName?: string }>,
  campaignId: string,
): Promise<{ enqueued: number; skipped: number }> {
  let enqueued = 0
  let skipped = 0

  for (const lead of leads) {
    // Check if already messaged in last 7 days
    const recentMessage = await (prisma as any).outboundMessage.findFirst({
      where: {
        phone: lead.phone,
        status: { in: ['sent', 'delivered', 'read', 'queued'] },
        createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
      },
    }).catch(() => null)

    if (recentMessage) {
      skipped++
      continue
    }

    try {
      await enqueueOutbound(prisma, queue, {
        ...lead,
        campaignId,
      })
      enqueued++
    } catch {
      skipped++
    }
  }

  return { enqueued, skipped }
}

/**
 * Process an outbound job — called by BullMQ worker
 */
export async function processOutboundJob(
  prisma: PrismaClient,
  jobData: OutboundJobData,
): Promise<void> {
  const { outboundId, phone, message, senderNumber } = jobData

  try {
    // Dynamic import to avoid breaking if whatsapp not configured
    const { whatsappService } = await import('./whatsapp.service.js')
    await whatsappService.sendText(phone, message)

    // Update status to sent
    await (prisma as any).outboundMessage.update({
      where: { id: outboundId },
      data: { status: 'sent', sentAt: new Date() },
    })
  } catch (err: any) {
    // Update status to failed
    await (prisma as any).outboundMessage.update({
      where: { id: outboundId },
      data: { status: 'failed', errorMessage: err.message?.slice(0, 500) },
    }).catch(() => {})
    throw err // Let BullMQ retry
  }
}

/**
 * Get outbound metrics for the dashboard
 */
export async function getOutboundMetrics(prisma: PrismaClient) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    sentToday,
    sentMonth,
    deliveredMonth,
    repliedMonth,
    failedMonth,
    byTemplate,
  ] = await Promise.all([
    (prisma as any).outboundMessage.count({
      where: { status: { in: ['sent', 'delivered', 'read', 'replied'] }, sentAt: { gte: todayStart } },
    }).catch(() => 0),
    (prisma as any).outboundMessage.count({
      where: { status: { in: ['sent', 'delivered', 'read', 'replied'] }, sentAt: { gte: monthStart } },
    }).catch(() => 0),
    (prisma as any).outboundMessage.count({
      where: { status: { in: ['delivered', 'read', 'replied'] }, sentAt: { gte: monthStart } },
    }).catch(() => 0),
    (prisma as any).outboundMessage.count({
      where: { status: 'replied', sentAt: { gte: monthStart } },
    }).catch(() => 0),
    (prisma as any).outboundMessage.count({
      where: { status: 'failed', createdAt: { gte: monthStart } },
    }).catch(() => 0),
    (prisma as any).outboundMessage.groupBy({
      by: ['templateVersion'],
      where: { sentAt: { gte: monthStart } },
      _count: true,
    }).catch(() => []),
  ])

  // A/B template performance
  const templatePerformance = await Promise.all(
    OUTBOUND_TEMPLATES.map(async (t) => {
      const [sent, replied] = await Promise.all([
        (prisma as any).outboundMessage.count({
          where: { templateVersion: t.version, status: { in: ['sent', 'delivered', 'read', 'replied'] }, sentAt: { gte: monthStart } },
        }).catch(() => 0),
        (prisma as any).outboundMessage.count({
          where: { templateVersion: t.version, status: 'replied', sentAt: { gte: monthStart } },
        }).catch(() => 0),
      ])
      return {
        version: t.version,
        sent,
        replied,
        replyRate: sent > 0 ? Number(((replied / sent) * 100).toFixed(1)) : 0,
      }
    }),
  )

  const deliveryRate = sentMonth > 0
    ? Number(((deliveredMonth / sentMonth) * 100).toFixed(1))
    : 0

  const replyRate = sentMonth > 0
    ? Number(((repliedMonth / sentMonth) * 100).toFixed(1))
    : 0

  return {
    sentToday,
    sentMonth,
    deliveredMonth,
    repliedMonth,
    failedMonth,
    deliveryRate,
    replyRate,
    templatePerformance,
  }
}
