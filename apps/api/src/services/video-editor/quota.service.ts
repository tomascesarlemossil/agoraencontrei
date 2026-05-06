/**
 * Video editor — quota & billing helpers.
 *
 * Two counters per company:
 *   - dailyUsed / dailyLimit  → resets every 24h. Default 50/day.
 *   - brollUsed  / brollCredits → consumable balance for Luma Ray 2 seconds.
 *
 * Quotas are auto-provisioned on first use. The Nível Máximo plan upgrade
 * flow should set `dailyLimit` and top-up `brollCredits` there.
 */
import type { PrismaClient } from '@prisma/client'

export interface QuotaSnapshot {
  dailyLimit:   number
  dailyUsed:    number
  dailyRemaining: number
  dailyResetAt: Date
  brollCredits: number
  brollUsed:    number
  brollRemaining: number
}

export class QuotaError extends Error {
  constructor(
    public readonly code: 'NOT_PROVISIONED' | 'DAILY_LIMIT_REACHED' | 'INSUFFICIENT_BROLL_CREDITS',
    message: string,
  ) {
    super(message)
    this.name = 'QuotaError'
  }
}

/**
 * Read the quota row for a company. Returns null if the company has not
 * been provisioned yet — callers (routes) should treat that as 403.
 *
 * Provisioning is explicit: it happens at checkout (for plans that include
 * the `video_editor` module) or via the admin top-up endpoint. We do NOT
 * auto-create here, otherwise any logged-in user could exercise the editor
 * regardless of plan.
 */
export async function getQuota(prisma: PrismaClient, companyId: string) {
  const existing = await prisma.videoEditorQuota.findUnique({ where: { companyId } })
  if (!existing) return null
  return rollDailyIfNeeded(prisma, existing)
}

async function rollDailyIfNeeded(prisma: PrismaClient, q: { id: string; dailyResetAt: Date }) {
  if (q.dailyResetAt > new Date()) return prisma.videoEditorQuota.findUniqueOrThrow({ where: { id: q.id } })
  return prisma.videoEditorQuota.update({
    where: { id: q.id },
    data:  { dailyUsed: 0, dailyResetAt: nextResetAt() },
  })
}

function nextResetAt(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
}

/** Read-only snapshot. Returns null when the company isn't provisioned. */
export async function snapshot(prisma: PrismaClient, companyId: string): Promise<QuotaSnapshot | null> {
  const q = await getQuota(prisma, companyId)
  if (!q) return null
  return {
    dailyLimit:     q.dailyLimit,
    dailyUsed:      q.dailyUsed,
    dailyRemaining: Math.max(0, q.dailyLimit - q.dailyUsed),
    dailyResetAt:   q.dailyResetAt,
    brollCredits:   q.brollCredits,
    brollUsed:      q.brollUsed,
    brollRemaining: Math.max(0, q.brollCredits - q.brollUsed),
  }
}

/**
 * Provision a quota row for a company. Idempotent — returns the existing
 * row if one already exists. Used by:
 *   - the SaaS checkout flow when the plan includes `video_editor`;
 *   - the admin endpoint when a partner upgrades after the fact.
 */
export async function provisionQuota(
  prisma: PrismaClient,
  companyId: string,
  opts: { dailyLimit?: number; brollCredits?: number } = {},
) {
  return prisma.videoEditorQuota.upsert({
    where:  { companyId },
    create: {
      companyId,
      dailyLimit:   opts.dailyLimit   ?? 50,
      brollCredits: opts.brollCredits ?? 0,
      dailyResetAt: nextResetAt(),
    },
    update: {},
  })
}

/**
 * Pre-flight check before enqueueing a render. Throws QuotaError when the
 * caller can't afford the requested operation. Pure — does NOT decrement.
 */
export async function assertCanRender(
  prisma: PrismaClient,
  companyId: string,
  opts: { brollSeconds?: number },
): Promise<QuotaSnapshot> {
  const snap = await snapshot(prisma, companyId)
  if (!snap) {
    throw new QuotaError(
      'NOT_PROVISIONED',
      'Editor de Vídeo IA não disponível neste plano. Faça upgrade para o Nível Máximo.',
    )
  }
  if (snap.dailyRemaining <= 0) {
    throw new QuotaError(
      'DAILY_LIMIT_REACHED',
      `Limite diário atingido (${snap.dailyLimit} vídeos/dia). Reseta em ${snap.dailyResetAt.toISOString()}.`,
    )
  }
  if ((opts.brollSeconds ?? 0) > snap.brollRemaining) {
    throw new QuotaError(
      'INSUFFICIENT_BROLL_CREDITS',
      `Créditos de B-roll insuficientes: precisa de ${opts.brollSeconds}, disponível ${snap.brollRemaining}.`,
    )
  }
  return snap
}

/**
 * Increment counters atomically. Called by the route AFTER a render is
 * successfully enqueued. We charge daily up front so a user can't game it
 * by spamming requests; B-roll credits are charged after the worker
 * finishes (since cost is known precisely then).
 */
export async function consumeDaily(prisma: PrismaClient, companyId: string): Promise<void> {
  // Caller must have already passed `assertCanRender`, which provisions
  // implicitly via 402. We only increment here.
  await prisma.videoEditorQuota.update({
    where: { companyId },
    data:  { dailyUsed: { increment: 1 } },
  }).catch(() => {/* missing row → silently skip; assertCanRender guards entry */})
}

export async function consumeBrollCredits(prisma: PrismaClient, companyId: string, credits: number): Promise<void> {
  if (credits <= 0) return
  await prisma.videoEditorQuota.update({
    where: { companyId },
    data:  { brollUsed: { increment: credits } },
  }).catch(() => {})
}

/**
 * Admin top-up — used by the billing system when a partner buys extra
 * credits. Idempotent (upsert); returns the post-top-up snapshot.
 */
export async function topUpBrollCredits(prisma: PrismaClient, companyId: string, addCredits: number): Promise<QuotaSnapshot> {
  await prisma.videoEditorQuota.upsert({
    where:  { companyId },
    create: { companyId, dailyLimit: 50, brollCredits: addCredits, dailyResetAt: nextResetAt() },
    update: { brollCredits: { increment: addCredits } },
  })
  const s = await snapshot(prisma, companyId)
  if (!s) throw new Error('Quota row missing after top-up — should be impossible')
  return s
}
