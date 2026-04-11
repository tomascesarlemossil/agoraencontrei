/**
 * Sales Funnel Service — Tomás intent detection + auto-preview + auto-checkout
 *
 * Manages the full sales pipeline:
 * captured → engaged → preview_sent → preview_clicked → checkout_sent → converted → lost
 *
 * Integrates with:
 * - Preview Engine (auto-generate previews)
 * - Outbound Queue (auto-send messages)
 * - Asaas/Checkout (auto-generate payment links)
 */

import type { PrismaClient } from '@prisma/client'

// ── Intent Detection ────────────────────────────────────────────────────────

const PRICE_KEYWORDS = [
  'quanto custa', 'qual o preço', 'preço', 'valor', 'quanto é',
  'plano', 'planos', 'mensalidade', 'investimento', 'custo',
]

const INTEREST_KEYWORDS = [
  'como funciona', 'interesse', 'interessado', 'quero saber',
  'me conta', 'quero', 'preciso', 'preciso de', 'tenho interesse',
  'gostei', 'achei interessante', 'pode me mostrar',
]

const ACTIVATION_KEYWORDS = [
  'ativar', 'começar', 'quero ativar', 'pode ativar',
  'vamos fechar', 'quero contratar', 'bora', 'fecha',
  'manda o link', 'como faço pra ativar',
]

export type SalesIntent = 'price' | 'interest' | 'activation' | 'none'

/**
 * Detect sales intent from a message
 */
export function detectSalesIntent(message: string): SalesIntent {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (ACTIVATION_KEYWORDS.some(k => lower.includes(k))) return 'activation'
  if (PRICE_KEYWORDS.some(k => lower.includes(k))) return 'price'
  if (INTEREST_KEYWORDS.some(k => lower.includes(k))) return 'interest'
  return 'none'
}

// ── Sales Actions ───────────────────────────────────────────────────────────

/**
 * Generate a preview for a funnel lead and update stage
 */
export async function triggerPreviewForFunnel(
  prisma: PrismaClient,
  funnelId: string,
  leadName: string,
  segment?: string,
): Promise<{ previewUrl: string; siteName: string } | null> {
  // Generate a slug from the lead name
  const siteName = leadName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

  try {
    // Dynamic import to avoid circular deps
    const { generateBranding } = await import('./preview-branding.service.js')
    const { createPreviewSession } = await import('./preview-token.service.js')

    const branding = generateBranding({
      companyName: leadName,
      segment: segment || 'corretor',
    })

    await createPreviewSession(prisma, {
      siteName,
      companyName: branding.companyName,
      theme: branding.theme.key,
      slogan: branding.slogan,
      segment: branding.segment,
    })

    // Update funnel stage
    await prisma.salesFunnel.update({
      where: { id: funnelId },
      data: {
        stage: 'preview_sent',
        previewSiteName: siteName,
      },
    }).catch(() => {})

    const webUrl = process.env.WEB_URL || 'https://agoraencontrei.com.br'
    return {
      previewUrl: `${webUrl}/preview/${siteName}`,
      siteName,
    }
  } catch {
    return null
  }
}

/**
 * Generate a checkout link for a funnel lead
 */
export async function triggerCheckoutForFunnel(
  prisma: PrismaClient,
  funnelId: string,
  plan: string = 'pro',
): Promise<{ checkoutUrl: string } | null> {
  try {
    const webUrl = process.env.WEB_URL || 'https://agoraencontrei.com.br'
    const checkoutUrl = `${webUrl}/checkout?plan=${plan}&ref=funnel_${funnelId}`

    // Update funnel stage
    await prisma.salesFunnel.update({
      where: { id: funnelId },
      data: {
        stage: 'checkout_sent',
        checkoutUrl,
      },
    }).catch(() => {})

    return { checkoutUrl }
  } catch {
    return null
  }
}

/**
 * Handle Tomás conversation with sales intent detection
 * Returns suggested actions based on detected intent
 */
export interface SalesAction {
  type: 'preview' | 'checkout' | 'message' | 'none'
  message?: string
  previewUrl?: string
  checkoutUrl?: string
}

export async function handleSalesIntent(
  prisma: PrismaClient,
  funnelId: string,
  leadName: string,
  userMessage: string,
  segment?: string,
): Promise<SalesAction> {
  const intent = detectSalesIntent(userMessage)

  if (intent === 'none') return { type: 'none' }

  // Load current funnel state
  const funnel = await prisma.salesFunnel.findUnique({
    where: { id: funnelId },
  }).catch(() => null) as any

  if (!funnel) return { type: 'none' }

  // ── Intent: price or interest → generate preview first ────────────────
  if (intent === 'price' || intent === 'interest') {
    // If preview not yet sent, generate it
    if (!funnel.previewSiteName || funnel.stage === 'captured' || funnel.stage === 'engaged') {
      const preview = await triggerPreviewForFunnel(prisma, funnelId, leadName, segment)
      if (preview) {
        return {
          type: 'preview',
          previewUrl: preview.previewUrl,
          message: `Basicamente você vai ter um portal com IA que atende seus clientes automaticamente.\n\nInclusive já montei um modelo seu aqui 👇\n${preview.previewUrl}\n\nSe fizer sentido, já consigo colocar rodando hoje.`,
        }
      }
    }

    // Preview already sent, suggest checkout
    if (funnel.stage === 'preview_sent' || funnel.stage === 'preview_clicked') {
      const checkout = await triggerCheckoutForFunnel(prisma, funnelId)
      if (checkout) {
        return {
          type: 'checkout',
          checkoutUrl: checkout.checkoutUrl,
          message: `Já posso deixar isso rodando pra você hoje.\n\nAqui está o link pra ativar 👇\n${checkout.checkoutUrl}`,
        }
      }
    }
  }

  // ── Intent: activation → go straight to checkout ──────────────────────
  if (intent === 'activation') {
    const checkout = await triggerCheckoutForFunnel(prisma, funnelId)
    if (checkout) {
      return {
        type: 'checkout',
        checkoutUrl: checkout.checkoutUrl,
        message: `Perfeito! Aqui está o link para ativar seu portal 👇\n${checkout.checkoutUrl}\n\nÉ rápido, já fica pronto em minutos.`,
      }
    }
  }

  return { type: 'none' }
}

// ── Funnel Analytics ────────────────────────────────────────────────────────

/**
 * Get full funnel conversion metrics for the dashboard
 */
export async function getFunnelConversionMetrics(prisma: PrismaClient) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const weekAgo = new Date(Date.now() - 7 * 86_400_000)

  // Stage counts for funnel visualization
  const stages = ['captured', 'engaged', 'preview_sent', 'preview_clicked', 'checkout_sent', 'converted', 'lost']

  const stageCounts = await Promise.all(
    stages.map(async (stage) => {
      const count = await prisma.salesFunnel.count({
        where: { stage, createdAt: { gte: monthStart } },
      }).catch(() => 0)
      return { stage, count }
    }),
  )

  // Source → conversion pipeline
  const sourceConversions = await prisma.salesFunnel.groupBy({
    by: ['source'],
    where: { createdAt: { gte: monthStart } },
    _count: true,
  }).catch(() => [])

  const sourceConversionsConverted = await prisma.salesFunnel.groupBy({
    by: ['source'],
    where: { stage: 'converted', createdAt: { gte: monthStart } },
    _count: true,
  }).catch(() => [])

  const convertedMap = new Map(
    sourceConversionsConverted.map((s: any) => [s.source, s._count]),
  )

  const channelPerformance = sourceConversions.map((s: any) => ({
    source: s.source,
    total: s._count,
    converted: convertedMap.get(s.source) || 0,
    conversionRate: s._count > 0
      ? Number((((convertedMap.get(s.source) || 0) / s._count) * 100).toFixed(1))
      : 0,
  }))

  // Daily trend (last 7 days)
  const dailyTrend: Array<{ date: string; captured: number; converted: number }> = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(Date.now() - i * 86_400_000)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const [captured, converted] = await Promise.all([
      prisma.salesFunnel.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      }).catch(() => 0),
      prisma.salesFunnel.count({
        where: { stage: 'converted', convertedAt: { gte: dayStart, lte: dayEnd } },
      }).catch(() => 0),
    ])

    dailyTrend.push({
      date: dayStart.toISOString().split('T')[0],
      captured,
      converted,
    })
  }

  return {
    stages: stageCounts,
    channelPerformance,
    dailyTrend,
  }
}

/**
 * Convert a funnel entry after payment confirmation
 */
export async function convertFunnelEntry(
  prisma: PrismaClient,
  identifier: { phone?: string; email?: string; funnelId?: string },
  tenantId: string,
): Promise<void> {
  const where: any = {}
  if (identifier.funnelId) {
    where.id = identifier.funnelId
  } else if (identifier.phone) {
    where.phone = identifier.phone
  } else if (identifier.email) {
    where.email = identifier.email
  } else {
    return
  }

  // Find the most recent non-converted funnel entry
  const funnel = await prisma.salesFunnel.findFirst({
    where: {
      ...where,
      stage: { not: 'converted' },
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null) as any

  if (funnel) {
    await prisma.salesFunnel.update({
      where: { id: funnel.id },
      data: {
        stage: 'converted',
        convertedAt: new Date(),
        tenantId,
      },
    }).catch(() => {})
  }
}
