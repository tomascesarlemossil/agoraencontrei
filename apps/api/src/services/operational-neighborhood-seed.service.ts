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
  for (const row of rows) {
    const name = row.neighborhood?.trim()
    if (!name) continue
    const neighborhoodSlug = slug(name)
    if (!neighborhoodSlug) continue
    const neighborhood = neighborhoodEvidence.get(neighborhoodSlug)
    if (neighborhood) neighborhood.count++
    else neighborhoodEvidence.set(neighborhoodSlug, { name, count: 1 })

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

  const neighborhoodLinked = await prisma.$executeRawUnsafe(
    `UPDATE properties p
     SET "territorialNeighborhoodId" = tn.id
     FROM territorial_neighborhoods tn
     WHERE tn."cityId" = $1 AND p."territorialCityId" = $1
       AND p."territorialNeighborhoodId" IS NULL AND p.neighborhood IS NOT NULL
       AND LOWER(TRIM(p.neighborhood)) = LOWER(TRIM(tn.name))`,
    cityId,
  )
  await prisma.$executeRawUnsafe(
    `INSERT INTO territorial_street_neighborhoods
       (id, "streetId", "neighborhoodId", "sourceId", confidence, "evidenceCount", metadata, "createdAt", "updatedAt")
     SELECT 'territorial_street_neighborhood_' || MD5(p."territorialStreetId" || ':' || p."territorialNeighborhoodId"),
       p."territorialStreetId", p."territorialNeighborhoodId", $1, 55, COUNT(*)::int,
       '{"classification":"observed","derivedFrom":"property_listings"}'::jsonb, NOW(), NOW()
     FROM properties p
     WHERE p."territorialCityId" = $2 AND p."territorialStreetId" IS NOT NULL AND p."territorialNeighborhoodId" IS NOT NULL
     GROUP BY p."territorialStreetId", p."territorialNeighborhoodId"
     ON CONFLICT ("streetId", "neighborhoodId") DO UPDATE SET
       "evidenceCount" = EXCLUDED."evidenceCount", "updatedAt" = NOW()`,
    source.id, cityId,
  )
  const relations = await client.territorialStreetNeighborhood.count({
    where: { street: { cityId } },
  })

  const linked = await linkPropertiesToTerritory(prisma)
  return { seeded: true, neighborhoods: neighborhoodEvidence.size, neighborhoodLinked, relations, linked }
}
