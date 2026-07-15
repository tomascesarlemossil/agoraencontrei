import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { normalizeTerritorialName } from './territorial-intelligence.service.js'
import { linkPropertiesToTerritory } from './territorial-ingestion.service.js'

const slug = (value: string) => normalizeTerritorialName(value).replace(/\s+/g, '-')
const stableId = (prefix: string, value: string) => `${prefix}_${createHash('sha1').update(value).digest('hex').slice(0, 20)}`

/**
 * Materializa conhecimento operacional proveniente do próprio cadastro.
 * Esses bairros nunca são rotulados como oficiais e cada relação guarda a quantidade de evidências.
 */
export async function seedOperationalNeighborhoods(prisma: PrismaClient, cityId = 'territorial_city_franca_sp') {
  const client = prisma as any
  const source = await client.intelligenceDataSource.findUnique({
    where: { slug: 'internal-property-neighborhoods' }, select: { id: true },
  })
  if (!source) return { seeded: false, reason: 'internal_source_not_registered' }

  const rows = await prisma.property.findMany({
    where: { city: { equals: 'Franca', mode: 'insensitive' }, neighborhood: { not: null } } as any,
    select: { street: true, neighborhood: true },
  })
  const neighborhoodEvidence = new Map<string, { name: string; count: number }>()
  const pairEvidence = new Map<string, { street: string; neighborhood: string; count: number }>()
  for (const row of rows) {
    const name = row.neighborhood?.trim()
    if (!name) continue
    const neighborhoodSlug = slug(name)
    if (!neighborhoodSlug) continue
    const neighborhood = neighborhoodEvidence.get(neighborhoodSlug)
    if (neighborhood) neighborhood.count++
    else neighborhoodEvidence.set(neighborhoodSlug, { name, count: 1 })

    if (row.street?.trim()) {
      const normalizedStreet = normalizeTerritorialName(row.street)
      if (!normalizedStreet) continue
      const key = `${normalizedStreet}\u0000${neighborhoodSlug}`
      const pair = pairEvidence.get(key)
      if (pair) pair.count++
      else pairEvidence.set(key, { street: normalizedStreet, neighborhood: neighborhoodSlug, count: 1 })
    }
  }

  for (const [neighborhoodSlug, evidence] of neighborhoodEvidence) {
    await client.territorialNeighborhood.upsert({
      where: { cityId_slug: { cityId, slug: neighborhoodSlug } },
      update: {
        metadata: { classification: 'operational', evidenceCount: evidence.count, derivedFrom: 'property_listings' },
      },
      create: {
        id: stableId('territorial_neighborhood', `${cityId}:${neighborhoodSlug}`), cityId,
        name: evidence.name, slug: neighborhoodSlug, kind: 'COMMERCIAL', sourceId: source.id,
        confidence: Math.min(75, 45 + Math.round(Math.log2(evidence.count + 1) * 5)),
        metadata: { classification: 'operational', evidenceCount: evidence.count, derivedFrom: 'property_listings' },
      },
    })
  }

  const neighborhoods = await client.territorialNeighborhood.findMany({ where: { cityId }, select: { id: true, slug: true } })
  const streets = await client.territorialStreet.findMany({ where: { cityId }, select: { id: true, normalizedName: true } })
  const neighborhoodBySlug = new Map(neighborhoods.map((item: any) => [item.slug, item.id]))
  const streetByName = new Map(streets.map((item: any) => [item.normalizedName, item.id]))
  let relations = 0
  for (const [key, evidence] of pairEvidence) {
    const streetId = streetByName.get(evidence.street)
    const neighborhoodId = neighborhoodBySlug.get(evidence.neighborhood)
    if (!streetId || !neighborhoodId) continue
    await client.territorialStreetNeighborhood.upsert({
      where: { streetId_neighborhoodId: { streetId, neighborhoodId } },
      update: { evidenceCount: evidence.count, metadata: { classification: 'observed', derivedFrom: 'property_listings' } },
      create: {
        id: stableId('territorial_street_neighborhood', key), streetId, neighborhoodId,
        sourceId: source.id, confidence: Math.min(75, 45 + Math.round(Math.log2(evidence.count + 1) * 5)),
        evidenceCount: evidence.count, metadata: { classification: 'observed', derivedFrom: 'property_listings' },
      },
    })
    relations++
  }

  const linked = await linkPropertiesToTerritory(prisma)
  return { seeded: true, neighborhoods: neighborhoodEvidence.size, relations, linked }
}
