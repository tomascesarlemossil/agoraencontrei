/**
 * Affiliate Commission Service — Cálculo e gestão de comissões
 *
 * Comissão calculada sobre valor EFETIVAMENTE RECEBIDO.
 * Bronze = 20% | Prata = 25% | Ouro = 30%
 */

const LEVEL_RATES: Record<string, number> = {
  bronze: 0.20,
  prata: 0.25,
  ouro: 0.30,
}

export function getCommissionRate(level: string): number {
  return LEVEL_RATES[level] ?? LEVEL_RATES.bronze
}

/**
 * Calculate affiliate commission for a confirmed payment.
 * Uses the affiliate's current level/rate.
 */
export async function calculateAffiliateCommission(
  prisma: any,
  input: {
    transactionId: string
    affiliateId: string
    grossAmount: number
    tenantId?: string
    description?: string
  },
): Promise<any> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: input.affiliateId },
    select: { id: true, level: true, commissionRate: true },
  }).catch(() => null)

  if (!affiliate) return null

  const rate = Number(affiliate.commissionRate) || getCommissionRate(affiliate.level)
  const commissionAmount = Math.round(input.grossAmount * rate * 100) / 100

  return {
    affiliateId: input.affiliateId,
    rate,
    grossAmount: input.grossAmount,
    commissionAmount,
    level: affiliate.level,
  }
}

/**
 * Create AffiliateEarning record for a confirmed payment.
 * Prevents duplicate earnings for the same transaction.
 */
export async function createAffiliateEarning(
  prisma: any,
  input: {
    affiliateId: string
    tenantId?: string
    transactionId?: string
    grossAmount: number
    commissionAmount: number
    description?: string
  },
): Promise<any> {
  // Prevent duplicate
  if (input.transactionId) {
    const existing = await prisma.affiliateEarning.findFirst({
      where: { affiliateId: input.affiliateId, transactionId: input.transactionId },
    }).catch(() => null)
    if (existing) return existing
  }

  const earning = await prisma.affiliateEarning.create({
    data: {
      affiliateId: input.affiliateId,
      tenantId: input.tenantId || null,
      transactionId: input.transactionId || null,
      amount: input.commissionAmount,
      grossValue: input.grossAmount,
      status: 'pending',
      description: input.description || 'Comissão de indicação',
    },
  })

  // Update affiliate totals
  await prisma.affiliate.update({
    where: { id: input.affiliateId },
    data: {
      pendingEarnings: { increment: input.commissionAmount },
      totalEarnings: { increment: input.commissionAmount },
    },
  }).catch(() => {})

  return earning
}

/**
 * Approve earning (mark as ready for payout).
 */
export async function approveAffiliateEarning(
  prisma: any,
  earningId: string,
): Promise<any> {
  return prisma.affiliateEarning.update({
    where: { id: earningId },
    data: { status: 'paid', paidAt: new Date() },
  })
}

/**
 * Cancel earning — reverses totals on affiliate.
 */
export async function cancelAffiliateEarning(
  prisma: any,
  earningId: string,
): Promise<void> {
  const earning = await prisma.affiliateEarning.findUnique({
    where: { id: earningId },
    select: { id: true, affiliateId: true, amount: true, status: true },
  }).catch(() => null)

  if (!earning || earning.status === 'cancelled') return

  await prisma.affiliateEarning.update({
    where: { id: earningId },
    data: { status: 'cancelled' },
  })

  // Reverse totals
  const amount = Number(earning.amount)
  if (earning.status === 'pending') {
    await prisma.affiliate.update({
      where: { id: earning.affiliateId },
      data: {
        pendingEarnings: { decrement: amount },
        totalEarnings: { decrement: amount },
      },
    }).catch(() => {})
  }
}
