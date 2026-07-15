import type { PrismaClient } from '@prisma/client'
import streets from '../data/ibge-franca-streets-2022.json' with { type: 'json' }
import { linkPropertiesToTerritory } from './territorial-ingestion.service.js'
import { seedOperationalNeighborhoods } from './operational-neighborhood-seed.service.js'

type IbgeStreet = {
  id: string
  name: string
  normalizedName: string
  streetType: string | null
  confidence: number
  faceCount: number
  totalResidential: number
  totalAddresses: number
}

export async function seedIbgeFrancaTerritory(prisma: PrismaClient) {
  const client = prisma as any
  const source = await client.intelligenceDataSource.findUnique({ where: { slug: 'ibge-faces-logradouros-2022' }, select: { id: true } })
  if (!source) return { seeded: false, reason: 'ibge_source_not_registered' }

  const city = await client.territorialCity.upsert({
    where: { id: 'territorial_city_franca_sp' },
    update: { name: 'Franca', stateCode: 'SP', ibgeCode: '3516200', slug: 'franca', sourceId: source.id, confidence: 95, isActive: true },
    create: { id: 'territorial_city_franca_sp', name: 'Franca', stateCode: 'SP', ibgeCode: '3516200', slug: 'franca', sourceId: source.id, confidence: 95, isActive: true, metadata: { sourceYear: 2022 } },
  })

  const existing = await client.territorialStreet.count({ where: { cityId: city.id, sourceId: source.id } })
  let inserted = 0
  if (existing < streets.length) {
    for (let offset = 0; offset < streets.length; offset += 500) {
      const batch = (streets as IbgeStreet[]).slice(offset, offset + 500).map(street => ({
        id: street.id,
        cityId: city.id,
        neighborhoodId: null,
        name: street.name,
        normalizedName: street.normalizedName,
        streetType: street.streetType,
        sourceId: source.id,
        confidence: street.confidence,
        metadata: {
          faceCount: street.faceCount,
          totalResidential: street.totalResidential,
          totalAddresses: street.totalAddresses,
          sourceYear: 2022,
        },
      }))
      const result = await client.territorialStreet.createMany({ data: batch, skipDuplicates: true })
      inserted += result.count
    }
  }

  const linked = await linkPropertiesToTerritory(prisma)
  const operationalNeighborhoods = await seedOperationalNeighborhoods(prisma, city.id)
  return { seeded: true, source: 'ibge-faces-logradouros-2022', available: streets.length, existing, inserted, linked, operationalNeighborhoods }
}

export const ibgeFrancaStreetCount = streets.length
