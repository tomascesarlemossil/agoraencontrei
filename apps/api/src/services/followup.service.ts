/**
 * Follow-up Scheduler Service — automated D+1, D+3, D+7 follow-ups
 *
 * After an outbound message is sent, schedules follow-up messages.
 * Skips follow-ups if the lead replied, converted, or unsubscribed.
 */

import type { PrismaClient } from '@prisma/client'
import type { Queue } from 'bullmq'
import { FOLLOWUP_TEMPLATES } from './outbound-queue.service.js'

// ── Types ───────────────────────────────────────────────────────────────────

interface ScheduleFollowUpsInput {
  leadId: string
  outboundId: string
  phone: string
  name: string
}

interface ProcessFollowUpsResult {
  sent: number
  skipped: number
  cancelled: number
}

// ── Follow-up delays in milliseconds ────────────────────────────────────────

const FOLLOWUP_DELAYS: Record<string, number> = {
  d1: 1 * 24 * 60 * 60 * 1000,  // 1 day
  d3: 3 * 24 * 60 * 60 * 1000,  // 3 days
  d7: 7 * 24 * 60 * 60 * 1000,  // 7 days
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Schedule follow-up messages for a lead after initial outbound
 */
export async function scheduleFollowUps(
  prisma: PrismaClient,
  input: ScheduleFollowUpsInput,
): Promise<string[]> {
  const now = Date.now()
  const ids: string[] = []

  for (const [step, delayMs] of Object.entries(FOLLOWUP_DELAYS)) {
    const scheduledAt = new Date(now + delayMs)

    // Check if a follow-up for this step already exists
    const existing = await (prisma as any).followUpSchedule.findFirst({
      where: {
        leadId: input.leadId,
        step,
        status: 'pending',
      },
    }).catch(() => null)

    if (existing) continue

    const followUp = await (prisma as any).followUpSchedule.create({
      data: {
        leadId: input.leadId,
        outboundId: input.outboundId,
        phone: input.phone,
        step,
        scheduledAt,
        status: 'pending',
        metadata: { leadName: input.name },
      },
    })
    ids.push(followUp.id)
  }

  return ids
}

/**
 * Cancel all pending follow-ups for a lead (e.g., when they reply or convert)
 */
export async function cancelFollowUps(
  prisma: PrismaClient,
  leadId: string,
  reason: string,
): Promise<number> {
  const result = await (prisma as any).followUpSchedule.updateMany({
    where: {
      leadId,
      status: 'pending',
    },
    data: {
      status: 'cancelled',
      skipReason: reason,
    },
  }).catch(() => ({ count: 0 }))

  return result.count
}

/**
 * Process due follow-ups — called by scheduled jobs
 * Finds all pending follow-ups where scheduledAt <= now, checks skip conditions, sends
 */
export async function processDueFollowUps(
  prisma: PrismaClient,
  queue: Queue | null,
): Promise<ProcessFollowUpsResult> {
  const now = new Date()
  let sent = 0
  let skipped = 0
  let cancelled = 0

  // Find pending follow-ups that are due
  const dueFollowUps = await (prisma as any).followUpSchedule.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: now },
    },
    take: 100, // Process in batches
    orderBy: { scheduledAt: 'asc' },
  }).catch(() => [])

  for (const followUp of dueFollowUps) {
    // ── Check skip conditions ───────────────────────────────────────────

    // 1. Check if lead already replied to any outbound message
    const hasReplied = await (prisma as any).outboundMessage.findFirst({
      where: {
        phone: followUp.phone,
        status: 'replied',
      },
    }).catch(() => null)

    if (hasReplied) {
      await (prisma as any).followUpSchedule.update({
        where: { id: followUp.id },
        data: { status: 'skipped', skipReason: 'replied' },
      }).catch(() => {})
      skipped++
      continue
    }

    // 2. Check if lead already converted in the funnel
    const converted = await prisma.salesFunnel.findFirst({
      where: {
        OR: [
          { phone: followUp.phone },
          { leadId: followUp.leadId },
        ],
        stage: 'converted',
      },
    }).catch(() => null) as any

    if (converted) {
      await cancelFollowUps(prisma, followUp.leadId, 'converted')
      cancelled++
      continue
    }

    // ── Send the follow-up ──────────────────────────────────────────────
    const leadName = (followUp.metadata as any)?.leadName || 'Parceiro'
    const templateFn = FOLLOWUP_TEMPLATES[followUp.step]
    if (!templateFn) {
      skipped++
      continue
    }

    const message = templateFn(leadName)

    // Create outbound message record
    const outbound = await (prisma as any).outboundMessage.create({
      data: {
        leadId: followUp.leadId,
        phone: followUp.phone,
        senderNumber: 'followup',
        templateVersion: `followup_${followUp.step}`,
        channel: 'whatsapp',
        message,
        status: 'queued',
        metadata: { followUpId: followUp.id, step: followUp.step },
      },
    }).catch(() => null)

    if (outbound && queue) {
      // Enqueue with small random delay (5-30s for follow-ups)
      const delay = Math.floor(Math.random() * 25_000) + 5_000
      await queue.add(
        'outbound:send',
        {
          outboundId: outbound.id,
          phone: followUp.phone,
          message,
          senderNumber: 'followup',
        },
        {
          delay,
          attempts: 2,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 100 },
        },
      ).catch(() => {})
    }

    // Mark follow-up as sent
    await (prisma as any).followUpSchedule.update({
      where: { id: followUp.id },
      data: { status: 'sent', sentAt: new Date() },
    }).catch(() => {})

    sent++
  }

  return { sent, skipped, cancelled }
}

/**
 * Get follow-up metrics for the dashboard
 */
export async function getFollowUpMetrics(prisma: PrismaClient) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [pending, sentMonth, skippedMonth, byStep] = await Promise.all([
    (prisma as any).followUpSchedule.count({
      where: { status: 'pending' },
    }).catch(() => 0),
    (prisma as any).followUpSchedule.count({
      where: { status: 'sent', sentAt: { gte: monthStart } },
    }).catch(() => 0),
    (prisma as any).followUpSchedule.count({
      where: { status: 'skipped', updatedAt: { gte: monthStart } },
    }).catch(() => 0),
    (prisma as any).followUpSchedule.groupBy({
      by: ['step'],
      where: { status: 'sent', sentAt: { gte: monthStart } },
      _count: true,
    }).catch(() => []),
  ])

  return {
    pending,
    sentMonth,
    skippedMonth,
    byStep: byStep.map((s: any) => ({ step: s.step, count: s._count })),
  }
}
