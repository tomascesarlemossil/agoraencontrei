import { PrismaClient } from '@prisma/client'

/**
 * Serviço de Interlinkagem Automática
 *
 * Quando um imóvel entra no banco (via scraper ou manual):
 * 1. Identifica se pertence a um dos edifícios/condomínios cadastrados
 * 2. Cria/atualiza metadata de linkagem no imóvel
 * 3. Atualiza contadores do condomínio
 *
 * Isso cria uma teia de links internos que aumenta o Domain Authority.
 */

// Lista de condomínios/edifícios conhecidos em Franca
const KNOWN_CONDOS = [
  'Collis Residence', 'Di Villaggio Firenze', 'Dona Sabina', 'Gaia',
  'Olivito', 'Parque Freemont', 'Pérola', 'Piemonte', 'Porto dos Sonhos',
  'Reserva das Amoreiras', 'Residencial Brasil', 'Residencial Dom Bosco',
  'Residencial Piemonte', 'Residencial Trianon', 'San Pietro', 'Siena',
  'Siracusa', 'Terra Mater', 'Terra Nova', 'Village Giardinno',
  'Villagio Di Roma', 'Ville de France', 'Recanto dos Lagos', 'Reserva Real',
  'Quinta da Boa Vista', 'Villa Toscana', 'Riviera', 'Le Parc',
  'Jardins de Franca', 'Residencial Zanetti', 'San Conrado',
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findMatchingCondo(title: string, condoName?: string | null): string | null {
  const text = `${title} ${condoName || ''}`.toUpperCase()
  for (const condo of KNOWN_CONDOS) {
    if (text.includes(condo.toUpperCase())) return condo
  }
  return null
}

export class InterlinkingService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Processar todos os imóveis e criar links internos
   */
  async processAll(): Promise<{ linked: number; condosFound: string[] }> {
    const properties = await this.prisma.property.findMany({
      where: { status: 'ACTIVE' as any },
      select: { id: true, title: true, condoName: true, neighborhood: true, city: true },
    })

    const condosFound = new Set<string>()
    let linked = 0

    for (const prop of properties) {
      const condo = findMatchingCondo(prop.title, prop.condoName)
      if (condo) {
        condosFound.add(condo)
        const condoSlug = `condominio-${slugify(condo)}`
        const condoUrl = `/condominios/franca/${condoSlug}`

        // Atualizar metadata do imóvel com link para condomínio
        await this.prisma.property.update({
          where: { id: prop.id },
          data: {
            condoName: condo,
            metaKeywords: {
              push: `${condo.toLowerCase()} franca sp`,
            },
          },
        }).catch(() => {})
        linked++
      }
    }

    // Processar leilões também
    const auctions = await this.prisma.auction.findMany({
      where: { status: { notIn: ['CANCELLED', 'CLOSED'] }, city: 'Franca' },
      select: { id: true, title: true, neighborhood: true },
    })

    for (const auction of auctions) {
      const condo = findMatchingCondo(auction.title)
      if (condo) {
        condosFound.add(condo)
        await this.prisma.auction.update({
          where: { id: auction.id },
          data: { tags: { push: `condo:${slugify(condo)}` } },
        }).catch(() => {})
        linked++
      }
    }

    return { linked, condosFound: Array.from(condosFound) }
  }

  /**
   * Processar um único imóvel (chamado pelo scraper após inserção)
   */
  async processProperty(propertyId: string): Promise<string | null> {
    const prop = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { title: true, condoName: true },
    })
    if (!prop) return null

    const condo = findMatchingCondo(prop.title, prop.condoName)
    if (!condo) return null

    await this.prisma.property.update({
      where: { id: propertyId },
      data: { condoName: condo },
    }).catch(() => {})

    return condo
  }

  /**
   * Processar um único leilão
   */
  async processAuction(auctionId: string): Promise<string | null> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      select: { title: true },
    })
    if (!auction) return null

    const condo = findMatchingCondo(auction.title)
    if (!condo) return null

    await this.prisma.auction.update({
      where: { id: auctionId },
      data: { tags: { push: `condo:${slugify(condo)}` } },
    }).catch(() => {})

    return condo
  }

  /**
   * Obter dados agregados de um condomínio para a página
   */
  async getCondoData(condoName: string) {
    const [properties, auctions] = await Promise.all([
      this.prisma.property.findMany({
        where: {
          condoName: { contains: condoName, mode: 'insensitive' },
          status: 'ACTIVE' as any,
        },
        select: {
          id: true, title: true, slug: true, price: true, priceRent: true,
          totalArea: true, bedrooms: true, bathrooms: true, purpose: true,
          coverImage: true, type: true, neighborhood: true,
        },
      }),
      this.prisma.auction.findMany({
        where: {
          title: { contains: condoName, mode: 'insensitive' },
          status: { notIn: ['CANCELLED', 'CLOSED'] },
        },
        select: {
          id: true, title: true, slug: true, minimumBid: true,
          appraisalValue: true, discountPercent: true, opportunityScore: true,
          source: true, totalArea: true,
        },
      }),
    ])

    // Calcular preço/m² médio
    const pricesM2 = properties
      .filter(p => p.price && p.totalArea && Number(p.totalArea) > 0)
      .map(p => Number(p.price) / Number(p.totalArea))

    const avgPriceM2 = pricesM2.length > 0
      ? pricesM2.reduce((a, b) => a + b, 0) / pricesM2.length
      : null

    const minPrice = properties.reduce((min, p) => {
      const v = Number(p.price) || Infinity
      return v < min ? v : min
    }, Infinity)

    return {
      name: condoName,
      slug: slugify(condoName),
      totalProperties: properties.length,
      totalAuctions: auctions.length,
      avgPriceM2: avgPriceM2 ? Number(avgPriceM2.toFixed(2)) : null,
      minPrice: minPrice === Infinity ? null : minPrice,
      properties,
      auctions,
    }
  }
}
