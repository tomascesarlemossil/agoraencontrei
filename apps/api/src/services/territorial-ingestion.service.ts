import type { PrismaClient } from '@prisma/client'
import { normalizeTerritorialName, resolveTerritorialAddress } from './territorial-intelligence.service.js'

export type TerritorialImportRow = {
  city: string
  state: string
  ibgeCode?: string
  neighborhood?: string
  neighborhoodKind?: 'OFFICIAL' | 'COMMERCIAL' | 'POPULAR'
  neighborhoodAliases?: string[]
  street?: string
  streetType?: string
  postalCode?: string
  confidence?: number
  metadata?: Record<string, unknown>
}

const slug = (value: string) => normalizeTerritorialName(value).replace(/\s+/g, '-')
const score = (value?: number) => Math.min(100, Math.max(0, Math.round(value ?? 50)))

export function validateTerritorialImportRow(row: TerritorialImportRow) {
  const errors: string[] = []
  if (!normalizeTerritorialName(row.city)) errors.push('city_required')
  if (!/^[A-Za-z]{2}$/.test(row.state || '')) errors.push('state_must_have_two_letters')
  if (row.street && !row.neighborhood) errors.push('street_requires_neighborhood')
  if (row.confidence !== undefined && (row.confidence < 0 || row.confidence > 100)) errors.push('confidence_out_of_range')
  return { valid: errors.length === 0, errors }
}

/** Importa somente dados cuja fonte já tenha sido juridicamente aprovada. */
export async function importTerritorialRows(
  prisma: PrismaClient,
  input: { sourceSlug: string; rows: TerritorialImportRow[] },
) {
  const client = prisma as any
  const source = await client.intelligenceDataSource.findUnique({ where: { slug: input.sourceSlug } })
  if (!source || !source.isActive || source.legalStatus !== 'APPROVED' || !source.storageAllowed) {
    return { imported: false, reason: 'source_not_authorized_for_storage', processed: 0 }
  }

  const summary = { imported: true, processed: 0, rejected: 0, cities: 0, neighborhoods: 0, aliases: 0, streets: 0, issues: [] as Array<{ row: number; errors: string[] }> }
  for (const [index, row] of input.rows.entries()) {
    const validation = validateTerritorialImportRow(row)
    if (!validation.valid) {
      summary.rejected++
      summary.issues.push({ row: index + 1, errors: validation.errors })
      continue
    }

    const stateCode = row.state.toUpperCase()
    const citySlug = slug(row.city)
    const existingCity = await client.territorialCity.findFirst({ where: { stateCode, slug: citySlug }, select: { id: true } })
    const city = existingCity
      ? await client.territorialCity.update({ where: { id: existingCity.id }, data: { name: row.city.trim(), ibgeCode: row.ibgeCode || undefined, confidence: score(row.confidence), sourceId: source.id } })
      : await client.territorialCity.create({ data: { name: row.city.trim(), stateCode, slug: citySlug, ibgeCode: row.ibgeCode, confidence: score(row.confidence), sourceId: source.id, metadata: row.metadata || {} } })
    if (!existingCity) summary.cities++

    let neighborhood: any = null
    if (row.neighborhood) {
      const neighborhoodSlug = slug(row.neighborhood)
      const existing = await client.territorialNeighborhood.findFirst({ where: { cityId: city.id, slug: neighborhoodSlug }, select: { id: true } })
      neighborhood = existing
        ? await client.territorialNeighborhood.update({ where: { id: existing.id }, data: { name: row.neighborhood.trim(), kind: row.neighborhoodKind || 'OFFICIAL', confidence: score(row.confidence), sourceId: source.id } })
        : await client.territorialNeighborhood.create({ data: { cityId: city.id, name: row.neighborhood.trim(), slug: neighborhoodSlug, kind: row.neighborhoodKind || 'OFFICIAL', confidence: score(row.confidence), sourceId: source.id, metadata: row.metadata || {} } })
      if (!existing) summary.neighborhoods++

      for (const alias of row.neighborhoodAliases || []) {
        const normalizedName = normalizeTerritorialName(alias)
        if (!normalizedName) continue
        const existingAlias = await client.territorialNeighborhoodAlias.findFirst({ where: { neighborhoodId: neighborhood.id, normalizedName }, select: { id: true } })
        if (!existingAlias) {
          await client.territorialNeighborhoodAlias.create({ data: { neighborhoodId: neighborhood.id, name: alias.trim(), normalizedName, sourceId: source.id } })
          summary.aliases++
        }
      }
    }

    if (row.street && neighborhood) {
      const normalizedName = normalizeTerritorialName(row.street)
      const existing = await client.territorialStreet.findFirst({ where: { cityId: city.id, neighborhoodId: neighborhood.id, normalizedName }, select: { id: true } })
      const data = {
        cityId: city.id, neighborhoodId: neighborhood.id, name: row.street.trim(), normalizedName,
        streetType: row.streetType, postalCode: row.postalCode?.replace(/\D/g, ''),
        confidence: score(row.confidence), sourceId: source.id, metadata: row.metadata || {},
      }
      if (existing) await client.territorialStreet.update({ where: { id: existing.id }, data })
      else { await client.territorialStreet.create({ data }); summary.streets++ }
    }
    summary.processed++
  }
  return summary
}

/** Vincula imóveis ao cadastro canônico sem alterar o endereço declarado originalmente. */
export async function linkPropertiesToTerritory(
  prisma: PrismaClient,
  options: { companyId?: string; batchSize?: number } = {},
) {
  const batchSize = Math.min(500, Math.max(10, options.batchSize || 100))
  let cursor: string | undefined
  const summary = { examined: 0, linked: 0, unresolved: 0, failed: 0 }
  do {
    const rows = await prisma.property.findMany({
      where: {
        ...(options.companyId ? { companyId: options.companyId } : {}),
        city: { not: null }, street: { not: null }, territorialStreetId: null,
      } as any,
      select: { id: true, city: true, state: true, street: true, neighborhood: true, zipCode: true },
      orderBy: { id: 'asc' }, take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    if (!rows.length) break
    for (const property of rows) {
      summary.examined++
      try {
        const resolution = await resolveTerritorialAddress(prisma, {
          city: property.city!, state: property.state || undefined, street: property.street!,
          neighborhood: property.neighborhood || undefined, postalCode: property.zipCode || undefined,
        })
        if (!resolution.resolved || !resolution.city) { summary.unresolved++; continue }
        await prisma.property.update({
          where: { id: property.id },
          data: {
            territorialCityId: resolution.city.id,
            territorialNeighborhoodId: resolution.neighborhood?.id || null,
            territorialStreetId: resolution.street?.id || null,
          } as any,
        })
        summary.linked++
      } catch { summary.failed++ }
    }
    cursor = rows.at(-1)?.id
    if (rows.length < batchSize) break
  } while (cursor)
  return summary
}

