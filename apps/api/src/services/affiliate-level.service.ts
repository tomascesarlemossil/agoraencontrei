/**
 * Affiliate Level Service — Gamificação e promoção de nível
 *
 * Bronze: padrão (0-4 clientes ativos)
 * Prata: 5+ clientes ativos (25% comissão)
 * Ouro: 15+ clientes ativos (30% comissão)
 *
 * Recalcula baseado em clientes ativos ou pode ser parametrizado no futuro.
 */

const LEVEL_THRESHOLDS = [
  { level: 'ouro', minClients: 15, rate: 0.30 },
  { level: 'prata', minClients: 5, rate: 0.25 },
  { level: 'bronze', minClients: 0, rate: 0.20 },
]

export function determineLevelByClients(activeClients: number): { level: string; rate: number } {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (activeClients >= threshold.minClients) {
      return { level: threshold.level, rate: threshold.rate }
    }
  }
  return { level: 'bronze', rate: 0.20 }
}

/**
 * Recalculate affiliate level based on converted referrals with active tenants.
 */
export async function recalculateAffiliateLevel(
  prisma: any,
  affiliateId: string,
): Promise<{ level: string; rate: number; changed: boolean }> {
  // Count converted referrals where tenant is active
  const activeReferrals = await prisma.affiliateReferral.count({
    where: {
      affiliateId,
      status: 'converted',
      tenant: { planStatus: { in: ['ACTIVE', 'TRIAL'] } },
    },
  }).catch(() => {
    // Fallback: use totalClients from affiliate
    return null
  })

  // Fallback to totalClients if referral count fails
  let activeClients: number
  if (activeReferrals !== null) {
    activeClients = activeReferrals
  } else {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      select: { totalClients: true },
    }).catch(() => null)
    activeClients = affiliate?.totalClients ?? 0
  }

  const { level, rate } = determineLevelByClients(activeClients)

  // Get current level
  const current = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { level: true, commissionRate: true },
  }).catch(() => null)

  const changed = current?.level !== level

  if (changed) {
    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        level,
        commissionRate: rate,
        totalClients: activeClients,
      },
    })

    // Audit level change
    await prisma.auditLog.create({
      data: {
        companyId: 'platform',
        action: 'affiliate.level.changed',
        resource: 'affiliate',
        resourceId: affiliateId,
        payload: {
          previousLevel: current?.level,
          newLevel: level,
          newRate: rate,
          activeClients,
        },
      },
    }).catch(() => {})
  }

  return { level, rate, changed }
}

/**
 * Recalculate all affiliates' levels. Run periodically or after payment events.
 */
export async function recalculateAllLevels(prisma: any): Promise<number> {
  const affiliates = await prisma.affiliate.findMany({
    where: { isActive: true },
    select: { id: true },
  }).catch(() => [])

  let changedCount = 0
  for (const aff of affiliates) {
    const result = await recalculateAffiliateLevel(prisma, aff.id)
    if (result.changed) changedCount++
  }

  return changedCount
}
