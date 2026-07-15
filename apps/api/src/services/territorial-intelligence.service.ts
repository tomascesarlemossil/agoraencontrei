import type { PrismaClient } from '@prisma/client'

export const normalizeTerritorialName = (value?: string | null) => (value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\b(rua|r|avenida|av|alameda|travessa|rodovia|praca)\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

type TerritorialResolutionInput = {
  city: string
  state?: string
  street: string
  neighborhood?: string
  postalCode?: string
}

/**
 * Resolve um endereço somente contra o cadastro canônico armazenado.
 * Não chama serviços externos e não transforma inferência de anúncio em fato oficial.
 */
export async function resolveTerritorialAddress(prisma: PrismaClient, input: TerritorialResolutionInput) {
  const client = prisma as any
  const citySlug = normalizeTerritorialName(input.city).replace(/\s+/g, '-')
  const city = await client.territorialCity?.findFirst({
    where: {
      slug: citySlug,
      ...(input.state ? { stateCode: input.state.toUpperCase() } : {}),
      isActive: true,
    },
    select: { id: true, name: true, stateCode: true, ibgeCode: true, confidence: true },
  })
  if (!city) return { resolved: false, reason: 'city_not_mapped', classification: 'unresolved' }

  const normalizedStreet = normalizeTerritorialName(input.street)
  const streetSelect = {
    id: true, name: true, streetType: true, postalCode: true, confidence: true,
    neighborhood: { select: { id: true, name: true, kind: true, confidence: true } },
  }
  let street = null
  if (normalizedStreet) {
    const normalizedPostalCode = input.postalCode?.replace(/\D/g, '')
    if (normalizedPostalCode) {
      street = await client.territorialStreet?.findFirst({
        where: { cityId: city.id, normalizedName: normalizedStreet, postalCode: normalizedPostalCode },
        select: streetSelect,
        orderBy: { confidence: 'desc' },
      })
    }
    if (!street) {
      street = await client.territorialStreet?.findFirst({
        where: { cityId: city.id, normalizedName: normalizedStreet },
        select: streetSelect,
        orderBy: { confidence: 'desc' },
      })
    }
  }

  let neighborhood = street?.neighborhood || null
  if (!neighborhood && input.neighborhood) {
    const normalizedNeighborhood = normalizeTerritorialName(input.neighborhood)
    neighborhood = await client.territorialNeighborhood?.findFirst({
      where: {
        cityId: city.id,
        OR: [
          { slug: normalizedNeighborhood.replace(/\s+/g, '-') },
          { aliases: { some: { normalizedName: normalizedNeighborhood } } },
        ],
      },
      select: { id: true, name: true, kind: true, confidence: true },
      orderBy: { confidence: 'desc' },
    })
  }

  return {
    resolved: Boolean(street || neighborhood),
    classification: street?.neighborhood ? 'canonical_street_mapping' : neighborhood ? 'canonical_neighborhood_mapping' : 'city_only',
    city,
    street: street ? { id: street.id, name: street.name, streetType: street.streetType, postalCode: street.postalCode } : null,
    neighborhood,
    confidence: Math.min(city.confidence, street?.confidence ?? 100, neighborhood?.confidence ?? 100),
    warning: street || neighborhood ? undefined : 'Cidade mapeada, mas logradouro e bairro ainda não foram confirmados no cadastro territorial.',
  }
}
