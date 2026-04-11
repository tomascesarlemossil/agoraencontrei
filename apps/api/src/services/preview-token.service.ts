/**
 * Preview Token Service — Geração e validação de tokens temporários
 *
 * Previews expiram após 72h por padrão.
 * Tokens são baseados em crypto para evitar enumeração.
 */

import crypto from 'crypto'

const PREVIEW_EXPIRY_HOURS = 48

export interface PreviewTokenData {
  token: string
  siteName: string
  expiresAt: Date
}

/**
 * Generate a secure preview token.
 */
export function generatePreviewToken(siteName: string): PreviewTokenData {
  const token = crypto.randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + PREVIEW_EXPIRY_HOURS * 60 * 60 * 1000)

  return { token, siteName, expiresAt }
}

/**
 * Create or retrieve a PreviewSession from the database.
 */
export async function createPreviewSession(
  prisma: any,
  input: {
    siteName: string
    companyName: string
    theme: string
    slogan: string
    segment?: string
    city?: string
  },
): Promise<any> {
  const tokenData = generatePreviewToken(input.siteName)

  const session = await prisma.previewSession.create({
    data: {
      siteName: input.siteName,
      companyName: input.companyName,
      theme: input.theme,
      slogan: input.slogan,
      segment: input.segment || 'corretor',
      city: input.city || null,
      previewToken: tokenData.token,
      expiresAt: tokenData.expiresAt,
    },
  })

  return session
}

/**
 * Resolve a preview session by siteName. Returns null if expired.
 */
export async function resolvePreviewSession(
  prisma: any,
  siteName: string,
): Promise<any | null> {
  const session = await prisma.previewSession.findFirst({
    where: {
      siteName: siteName.toLowerCase(),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => null)

  return session
}

/**
 * Validate a preview token.
 */
export async function validatePreviewToken(
  prisma: any,
  token: string,
): Promise<any | null> {
  const session = await prisma.previewSession.findFirst({
    where: {
      previewToken: token,
      expiresAt: { gt: new Date() },
    },
  }).catch(() => null)

  return session
}

/**
 * Check if a preview is expired.
 */
export function isPreviewExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt)
}
