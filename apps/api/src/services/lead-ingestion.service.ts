/**
 * Lead Ingestion Service — multi-source lead capture, deduplication, scoring
 *
 * Central entry point for leads from ALL channels:
 * whatsapp_outbound | meta_ads | google_ads | seo | affiliate | organic
 *
 * Deduplicates by phone/email, assigns score, creates SalesFunnel entry,
 * and emits automation events.
 */

import type { PrismaClient } from '@prisma/client'
import { emitAutomation } from './automation.emitter.js'

// ── Types ───────────────────────────────────────────────────────────────────

export interface IngestLeadInput {
  name: string
  phone?: string
  email?: string
  source: string // whatsapp_outbound | meta_ads | google_ads | seo | affiliate | organic
  campaign?: string
  affiliateCode?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  interest?: string // buy | rent | saas
  budget?: number
  notes?: string
  metadata?: Record<string, unknown>
}

export interface IngestResult {
  funnelId: string
  leadId: string | null
  isDuplicate: boolean
  score: number
  source: string
}

// ── Score Rules ─────────────────────────────────────────────────────────────

const SOURCE_SCORES: Record<string, number> = {
  meta_ads: 30,
  google_ads: 35,
  seo: 25,
  affiliate: 40,
  whatsapp_outbound: 15,
  organic: 20,
  referral: 40,
  preview: 35,
}

function calculateInitialScore(input: IngestLeadInput): number {
  let score = SOURCE_SCORES[input.source] ?? 10

  if (input.phone) score += 10
  if (input.email) score += 5
  if (input.interest) score += 10
  if (input.budget && input.budget > 0) score += 15
  if (input.affiliateCode) score += 10

  return Math.min(score, 100)
}

// ── Normalize phone ─────────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Add Brazil country code if missing
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

// ── Main Functions ──────────────────────────────────────────────────────────

/**
 * Ingest a lead from any source. Deduplicates, scores, creates funnel entry.
 */
export async function ingestLead(
  prisma: PrismaClient,
  input: IngestLeadInput,
  companyId?: string,
): Promise<IngestResult> {
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : undefined
  const score = calculateInitialScore(input)

  // ── Deduplication: check by phone first, then email ───────────────────
  let existingFunnel: any = null
  let isDuplicate = false

  if (normalizedPhone) {
    existingFunnel = await prisma.salesFunnel.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null) as any
  }

  if (!existingFunnel && input.email) {
    existingFunnel = await prisma.salesFunnel.findFirst({
      where: { email: input.email.toLowerCase() },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null) as any
  }

  // If existing funnel entry found within last 30 days, update it instead of creating new
  if (existingFunnel) {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(existingFunnel.createdAt).getTime()) / 86_400_000,
    )

    if (daysSinceCreated < 30) {
      isDuplicate = true
      // Update score if higher, update metadata
      const newScore = Math.max(existingFunnel.score, score)
      await prisma.salesFunnel.update({
        where: { id: existingFunnel.id },
        data: {
          score: newScore,
          metadata: {
            ...(existingFunnel.metadata as any || {}),
            lastIngestion: new Date().toISOString(),
            lastSource: input.source,
            ingestionCount: ((existingFunnel.metadata as any)?.ingestionCount || 1) + 1,
          },
        },
      }).catch(() => {})

      return {
        funnelId: existingFunnel.id,
        leadId: existingFunnel.leadId,
        isDuplicate: true,
        score: newScore,
        source: input.source,
      }
    }
  }

  // ── Create SalesFunnel entry ──────────────────────────────────────────
  const funnel = await prisma.salesFunnel.create({
    data: {
      name: input.name,
      phone: normalizedPhone,
      email: input.email?.toLowerCase(),
      source: input.source,
      campaign: input.campaign,
      affiliateCode: input.affiliateCode,
      score,
      stage: 'captured',
      metadata: {
        ...(input.metadata || {}),
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        ingestedAt: new Date().toISOString(),
      },
    },
  }) as any

  // ── Also create Lead record if companyId available ────────────────────
  let leadId: string | null = null
  if (companyId) {
    // Check for existing Lead by phone/email
    let existingLead: any = null
    if (normalizedPhone) {
      existingLead = await prisma.lead.findFirst({
        where: { companyId, phone: normalizedPhone },
      }).catch(() => null)
    }
    if (!existingLead && input.email) {
      existingLead = await prisma.lead.findFirst({
        where: { companyId, email: input.email.toLowerCase() },
      }).catch(() => null)
    }

    if (existingLead) {
      leadId = existingLead.id
    } else {
      const lead = await prisma.lead.create({
        data: {
          companyId,
          name: input.name,
          phone: normalizedPhone,
          email: input.email?.toLowerCase(),
          source: input.source,
          interest: input.interest,
          budget: input.budget,
          score,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          metadata: (input.metadata || {}) as any,
        },
      }).catch(() => null)
      leadId = lead?.id ?? null
    }

    // Link funnel to lead
    if (leadId) {
      await prisma.salesFunnel.update({
        where: { id: funnel.id },
        data: { leadId },
      }).catch(() => {})
    }
  }

  // ── Emit automation event ─────────────────────────────────────────────
  if (companyId) {
    emitAutomation({
      companyId,
      event: 'lead_created',
      data: {
        leadId: leadId ?? funnel.id,
        leadName: input.name,
        leadEmail: input.email ?? '',
        leadPhone: normalizedPhone ?? '',
        source: input.source,
        campaign: input.campaign ?? '',
        score,
        funnelId: funnel.id,
      },
    })
  }

  return {
    funnelId: funnel.id,
    leadId,
    isDuplicate,
    score,
    source: input.source,
  }
}

/**
 * Update funnel stage for a lead (e.g., preview_sent → preview_clicked → checkout_sent)
 */
export async function updateFunnelStage(
  prisma: PrismaClient,
  funnelId: string,
  stage: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  const data: any = { stage }
  if (stage === 'converted') data.convertedAt = new Date()
  if (extra?.previewSiteName) data.previewSiteName = extra.previewSiteName
  if (extra?.checkoutUrl) data.checkoutUrl = extra.checkoutUrl
  if (extra?.tenantId) data.tenantId = extra.tenantId

  await prisma.salesFunnel.update({
    where: { id: funnelId },
    data,
  }).catch(() => {})
}

/**
 * Get funnel metrics for the dashboard
 */
export async function getFunnelMetrics(prisma: PrismaClient) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalToday,
    totalMonth,
    bySource,
    byStage,
    conversionToday,
    conversionMonth,
  ] = await Promise.all([
    prisma.salesFunnel.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.salesFunnel.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.salesFunnel.groupBy({
      by: ['source'],
      where: { createdAt: { gte: monthStart } },
      _count: true,
    }),
    prisma.salesFunnel.groupBy({
      by: ['stage'],
      where: { createdAt: { gte: monthStart } },
      _count: true,
    }),
    prisma.salesFunnel.count({
      where: { stage: 'converted', convertedAt: { gte: todayStart } },
    }),
    prisma.salesFunnel.count({
      where: { stage: 'converted', convertedAt: { gte: monthStart } },
    }),
  ])

  const sourceBreakdown = bySource.map((s: any) => ({
    source: s.source,
    count: s._count,
  }))

  const stageBreakdown = byStage.map((s: any) => ({
    stage: s.stage,
    count: s._count,
  }))

  const conversionRate = totalMonth > 0
    ? Number(((conversionMonth / totalMonth) * 100).toFixed(1))
    : 0

  return {
    leadsHoje: totalToday,
    leadsMes: totalMonth,
    conversoesHoje: conversionToday,
    conversoesMes: conversionMonth,
    conversionRate,
    bySource: sourceBreakdown,
    byStage: stageBreakdown,
  }
}
