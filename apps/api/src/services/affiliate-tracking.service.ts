/**
 * Affiliate Tracking Service — Rastreio de indicação por ref code
 *
 * Resolve affiliate a partir de cookie/query param, cria AffiliateReferral,
 * vincula ao tenant no checkout/onboarding.
 */

export interface TrackingResult {
  affiliateId: string
  code: string
  name: string
  isActive: boolean
}

/**
 * Resolve affiliate from ?ref=CODE — validates code, checks active status.
 */
export async function resolveAffiliateFromCode(
  prisma: any,
  code: string,
): Promise<TrackingResult | null> {
  if (!code || code.length < 3) return null

  const affiliate = await prisma.affiliate.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true, code: true, name: true, isActive: true },
  }).catch(() => null)

  if (!affiliate || !affiliate.isActive) return null

  return {
    affiliateId: affiliate.id,
    code: affiliate.code,
    name: affiliate.name,
    isActive: affiliate.isActive,
  }
}

/**
 * Create or update AffiliateReferral when tracking is detected.
 */
export async function trackAffiliateReferral(
  prisma: any,
  input: {
    affiliateId: string
    referralCode: string
    source: string
    tenantId?: string
    leadId?: string
  },
): Promise<any> {
  // Check for existing referral with same affiliate + lead/tenant to avoid duplicates
  if (input.leadId) {
    const existing = await prisma.affiliateReferral.findFirst({
      where: { affiliateId: input.affiliateId, leadId: input.leadId },
    }).catch(() => null)
    if (existing) return existing
  }

  return prisma.affiliateReferral.create({
    data: {
      affiliateId: input.affiliateId,
      referralCode: input.referralCode,
      source: input.source,
      tenantId: input.tenantId || null,
      leadId: input.leadId || null,
      status: input.tenantId ? 'converted' : 'tracked',
    },
  })
}

/**
 * Convert tracked referral to tenant — called during checkout/activation.
 */
export async function convertReferralToTenant(
  prisma: any,
  affiliateId: string,
  tenantId: string,
): Promise<void> {
  // Find tracked referral for this affiliate
  const referral = await prisma.affiliateReferral.findFirst({
    where: { affiliateId, status: 'tracked' },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null)

  if (referral) {
    await prisma.affiliateReferral.update({
      where: { id: referral.id },
      data: { tenantId, status: 'converted' },
    }).catch(() => {})
  } else {
    // Create new converted referral
    await prisma.affiliateReferral.create({
      data: {
        affiliateId,
        tenantId,
        referralCode: '', // Will be populated
        source: 'checkout',
        status: 'converted',
      },
    }).catch(() => {})
  }

  // Update affiliate totalClients
  const clientCount = await prisma.affiliateReferral.count({
    where: { affiliateId, status: 'converted' },
  }).catch(() => 0)

  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: { totalClients: clientCount },
  }).catch(() => {})
}
