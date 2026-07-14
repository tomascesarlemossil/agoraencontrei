import { createHash } from 'node:crypto'
import type { Prisma, PrismaClient } from '@prisma/client'

const normalize = (value?: string | null) => (value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\b(rua|r|avenida|av|alameda|travessa|rodovia)\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim()

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

function completeness(values: unknown[]): number {
  const present = values.filter(value => value !== null && value !== undefined && value !== '').length
  return Math.round((present / values.length) * 100)
}

export async function capturePropertySnapshot(
  prisma: PrismaClient,
  input: { propertyId: string; sourceSlug: string; externalListingId?: string; sourceUrl?: string; listingStatus?: string; rawData?: Prisma.InputJsonValue },
) {
  const source = await (prisma as any).intelligenceDataSource.findUnique({ where: { slug: input.sourceSlug } })
  if (!source || !source.isActive || source.legalStatus !== 'APPROVED' || !source.storageAllowed) {
    return { captured: false, reason: 'source_not_authorized_for_storage' }
  }
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: {
      id: true, street: true, number: true, zipCode: true, city: true, neighborhood: true,
      price: true, priceRent: true, condoFee: true, iptu: true, builtArea: true, landArea: true,
      bedrooms: true, parkingSpaces: true, status: true, updatedAt: true,
    },
  })
  if (!property) return { captured: false, reason: 'property_not_found' }

  const addressFingerprint = hash([normalize(property.city), normalize(property.street), normalize(property.number), normalize(property.zipCode)])
  const snapshotData = {
    listingStatus: input.listingStatus || property.status,
    askingPrice: property.price?.toString() || null,
    rentPrice: property.priceRent?.toString() || null,
    condoFee: property.condoFee?.toString() || null,
    propertyTax: property.iptu?.toString() || null,
    builtArea: property.builtArea,
    landArea: property.landArea,
    bedrooms: property.bedrooms,
    parkingSpaces: property.parkingSpaces,
  }
  const contentFingerprint = hash(snapshotData)
  const existingSnapshot = await (prisma as any).propertyListingSnapshot.findUnique({
    where: { propertyId_contentFingerprint: { propertyId: property.id, contentFingerprint } },
    select: { id: true },
  })
  if (existingSnapshot) {
    return { captured: false, reason: 'unchanged', snapshotId: existingSnapshot.id, contentFingerprint, addressFingerprint }
  }
  const result = await (prisma as any).propertyListingSnapshot.upsert({
    where: { propertyId_contentFingerprint: { propertyId: property.id, contentFingerprint } },
    update: {},
    create: {
      propertyId: property.id, sourceId: source.id, externalListingId: input.externalListingId,
      sourceUrl: input.sourceUrl, addressFingerprint, contentFingerprint,
      dataCompleteness: completeness([property.street, property.city, property.neighborhood, property.price, property.builtArea || property.landArea, property.bedrooms, property.parkingSpaces]),
      sourceReliability: source.reliabilityScore, rawData: input.rawData || {}, ...snapshotData,
    },
  })
  return { captured: true, snapshotId: result.id, contentFingerprint, addressFingerprint }
}

/** Best-effort hook for operational writes. A pending migration must never block property CRUD. */
export async function capturePropertySnapshotBestEffort(
  prisma: PrismaClient,
  input: Parameters<typeof capturePropertySnapshot>[1],
) {
  try {
    return await capturePropertySnapshot(prisma, input)
  } catch (error: any) {
    return { captured: false, reason: 'intelligence_storage_unavailable', error: error?.message || String(error) }
  }
}

export async function backfillPropertyIntelligence(
  prisma: PrismaClient,
  options: { companyId?: string; batchSize?: number; detectDuplicates?: boolean } = {},
) {
  const batchSize = Math.min(Math.max(options.batchSize || 100, 10), 500)
  let cursor: string | undefined
  const summary = { processed: 0, captured: 0, unchanged: 0, failed: 0, duplicateCandidates: 0 }
  do {
    const properties = await prisma.property.findMany({
      where: options.companyId ? { companyId: options.companyId } : undefined,
      select: { id: true, externalId: true }, orderBy: { id: 'asc' }, take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    if (!properties.length) break
    for (const property of properties) {
      summary.processed++
      const capture = await capturePropertySnapshotBestEffort(prisma, {
        propertyId: property.id, sourceSlug: 'agoraencontrei-internal', externalListingId: property.externalId || undefined,
      })
      if (capture.captured) summary.captured++
      else if (capture.reason === 'intelligence_storage_unavailable') summary.failed++
      else summary.unchanged++
      if (options.detectDuplicates) {
        try {
          const duplicates = await detectDuplicateCandidates(prisma, property.id, options.companyId)
          summary.duplicateCandidates += duplicates.found
        } catch { summary.failed++ }
      }
    }
    cursor = properties.at(-1)?.id
    if (properties.length < batchSize) break
  } while (cursor)
  return summary
}

type Candidate = {
  id: string; street: string | null; number: string | null; city: string | null; neighborhood: string | null
  latitude: number | null; longitude: number | null; builtArea: number | null; landArea: number | null
  bedrooms: number; parkingSpaces: number; condoName: string | null
}

function distanceMeters(a: Candidate, b: Candidate): number | null {
  if (a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null) return null
  const rad = Math.PI / 180
  const x = (b.longitude - a.longitude) * rad * Math.cos(((a.latitude + b.latitude) / 2) * rad)
  const y = (b.latitude - a.latitude) * rad
  return Math.sqrt(x * x + y * y) * 6_371_000
}

export function scoreDuplicate(a: Candidate, b: Candidate) {
  let score = 0
  const reasons: Array<{ rule: string; points: number }> = []
  const add = (rule: string, points: number) => { score += points; reasons.push({ rule, points }) }
  if (normalize(a.city) && normalize(a.city) === normalize(b.city) && normalize(a.street) === normalize(b.street) && normalize(a.number) === normalize(b.number)) add('same_normalized_address', 45)
  const distance = distanceMeters(a, b)
  if (distance !== null && distance <= 20) add('coordinates_within_20m', 25)
  const areaA = a.builtArea || a.landArea; const areaB = b.builtArea || b.landArea
  if (areaA && areaB && Math.abs(areaA - areaB) / Math.max(areaA, areaB) <= 0.05) add('area_difference_under_5pct', 10)
  if (a.bedrooms === b.bedrooms) add('same_bedrooms', 5)
  if (a.parkingSpaces === b.parkingSpaces) add('same_parking_spaces', 5)
  if (normalize(a.condoName) && normalize(a.condoName) === normalize(b.condoName)) add('same_condominium', 15)
  return { score: Math.min(score, 100), reasons, probableDuplicate: score >= 70 }
}

export async function detectDuplicateCandidates(prisma: PrismaClient, propertyId: string, companyId?: string) {
  const select = { id: true, street: true, number: true, city: true, neighborhood: true, latitude: true, longitude: true, builtArea: true, landArea: true, bedrooms: true, parkingSpaces: true, condoName: true }
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select })
  if (!property) return { found: 0, candidates: [] }
  const candidates = await prisma.property.findMany({
    where: { id: { not: propertyId }, ...(companyId ? { companyId } : {}), city: property.city ? { equals: property.city, mode: 'insensitive' } : undefined,
      OR: [{ street: property.street ? { equals: property.street, mode: 'insensitive' } : undefined }, { condoName: property.condoName ? { equals: property.condoName, mode: 'insensitive' } : undefined }].filter(Boolean) as any },
    select, take: 100,
  })
  const scored = candidates.map(candidate => ({ propertyId: candidate.id, ...scoreDuplicate(property, candidate) })).filter(item => item.score >= 45).sort((a, b) => b.score - a.score)
  for (const candidate of scored) {
    const [first, second] = [propertyId, candidate.propertyId].sort()
    await (prisma as any).propertyDuplicateCandidate.upsert({
      where: { propertyId_candidatePropertyId: { propertyId: first, candidatePropertyId: second } },
      update: { score: candidate.score, reasons: candidate.reasons },
      create: { propertyId: first, candidatePropertyId: second, score: candidate.score, reasons: candidate.reasons },
    })
  }
  return { found: scored.length, candidates: scored }
}

export async function verifyIntelligenceSource(prisma: PrismaClient, slug: string) {
  const source = await (prisma as any).intelligenceDataSource.findUnique({
    where: { slug },
    select: { slug: true, name: true, kind: true, accessMethod: true, storageAllowed: true, republicationAllowed: true, attributionRequired: true, retentionDays: true, reliabilityScore: true, legalStatus: true, legalReviewedAt: true, isActive: true },
  })
  return source || { error: 'source_not_registered' }
}
