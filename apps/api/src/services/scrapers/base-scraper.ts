import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

export interface ScrapedAuction {
  externalId: string
  source: string
  sourceUrl?: string
  auctioneerName?: string
  auctioneerUrl?: string
  title: string
  description?: string
  propertyType?: string
  category?: string
  status?: string
  modality?: string

  // Location
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string

  // Areas
  totalArea?: number
  builtArea?: number
  landArea?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number

  // Values
  appraisalValue?: number
  minimumBid?: number
  firstRoundBid?: number
  secondRoundBid?: number
  discountPercent?: number

  // Dates
  firstRoundDate?: Date
  secondRoundDate?: Date
  auctionDate?: Date
  auctionEndDate?: Date

  // Legal
  processNumber?: string
  court?: string
  registryNumber?: string
  registryOffice?: string
  debtorName?: string
  creditorName?: string
  occupation?: string
  hasDebts?: boolean
  editalUrl?: string

  // Bank
  bankName?: string
  financingAvailable?: boolean
  fgtsAllowed?: boolean

  // Media
  coverImage?: string
  images?: string[]
  documentsUrls?: string[]

  // Extra
  features?: string[]
  tags?: string[]
  metadata?: Record<string, any>
}

function generateSlug(title: string, city?: string, id?: string): string {
  const base = [title, city].filter(Boolean).join(' ')
  const slug = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
  return id ? `${slug}-${id.substring(0, 8)}` : slug
}

function computeHash(data: ScrapedAuction): string {
  const key = JSON.stringify({
    title: data.title,
    minimumBid: data.minimumBid,
    status: data.status,
    auctionDate: data.auctionDate?.toISOString(),
  })
  return crypto.createHash('md5').update(key).digest('hex')
}

function calculateDiscount(appraisalValue?: number, minimumBid?: number): number | null {
  if (!appraisalValue || !minimumBid || appraisalValue <= 0) return null
  return Number((((appraisalValue - minimumBid) / appraisalValue) * 100).toFixed(1))
}

function calculateOpportunityScore(data: ScrapedAuction): number {
  let score = 50
  const discount = calculateDiscount(data.appraisalValue, data.minimumBid)

  if (discount) {
    if (discount > 50) score += 20
    else if (discount > 30) score += 15
    else if (discount > 20) score += 10
    else if (discount > 10) score += 5
  }

  if (data.occupation === 'DESOCUPADO') score += 10
  if (data.financingAvailable) score += 5
  if (data.fgtsAllowed) score += 5
  if (!data.hasDebts) score += 5

  return Math.min(100, Math.max(0, score))
}

export abstract class BaseScraper {
  protected prisma: PrismaClient
  protected source: string
  protected sourceUrl: string

  constructor(prisma: PrismaClient, source: string, sourceUrl: string) {
    this.prisma = prisma
    this.source = source
    this.sourceUrl = sourceUrl
  }

  abstract scrape(): Promise<ScrapedAuction[]>

  async run(): Promise<{ created: number; updated: number; found: number; errors: string[] }> {
    const run = await this.prisma.scraperRun.create({
      data: {
        source: this.source,
        sourceUrl: this.sourceUrl,
        status: 'RUNNING',
      },
    })

    let created = 0
    let updated = 0
    const errors: string[] = []
    let items: ScrapedAuction[] = []

    try {
      items = await this.scrape()

      for (const item of items) {
        try {
          const hash = computeHash(item)
          const existing = await this.prisma.auction.findFirst({
            where: {
              externalId: item.externalId,
              source: item.source as any,
            },
          })

          const discount = calculateDiscount(item.appraisalValue, item.minimumBid)
          const score = calculateOpportunityScore(item)
          const slug = generateSlug(item.title, item.city, item.externalId)

          const auctionData = {
            externalId: item.externalId,
            source: item.source as any,
            sourceUrl: item.sourceUrl,
            auctioneerName: item.auctioneerName,
            auctioneerUrl: item.auctioneerUrl,
            title: item.title,
            description: item.description,
            propertyType: (item.propertyType || 'HOUSE') as any,
            category: (item.category || 'RESIDENTIAL') as any,
            status: (item.status || 'UPCOMING') as any,
            modality: (item.modality || 'ONLINE') as any,
            street: item.street,
            number: item.number,
            complement: item.complement,
            neighborhood: item.neighborhood,
            city: item.city,
            state: item.state,
            zipCode: item.zipCode,
            totalArea: item.totalArea,
            builtArea: item.builtArea,
            landArea: item.landArea,
            bedrooms: item.bedrooms || 0,
            bathrooms: item.bathrooms || 0,
            parkingSpaces: item.parkingSpaces || 0,
            appraisalValue: item.appraisalValue,
            minimumBid: item.minimumBid,
            firstRoundBid: item.firstRoundBid,
            secondRoundBid: item.secondRoundBid,
            discountPercent: discount,
            firstRoundDate: item.firstRoundDate,
            secondRoundDate: item.secondRoundDate,
            auctionDate: item.auctionDate,
            auctionEndDate: item.auctionEndDate,
            processNumber: item.processNumber,
            court: item.court,
            registryNumber: item.registryNumber,
            registryOffice: item.registryOffice,
            debtorName: item.debtorName,
            creditorName: item.creditorName,
            occupation: item.occupation,
            hasDebts: item.hasDebts,
            editalUrl: item.editalUrl,
            bankName: item.bankName,
            financingAvailable: item.financingAvailable || false,
            fgtsAllowed: item.fgtsAllowed || false,
            coverImage: item.coverImage,
            images: item.images || [],
            documentsUrls: item.documentsUrls || [],
            features: item.features || [],
            tags: item.tags || [],
            metadata: item.metadata || {},
            opportunityScore: score,
            estimatedROI: discount ? discount * 0.7 : null,
            lastScrapedAt: new Date(),
            scrapedHash: hash,
          }

          if (existing) {
            if (existing.scrapedHash !== hash) {
              await this.prisma.auction.update({
                where: { id: existing.id },
                data: auctionData,
              })
              updated++
            }
          } else {
            await this.prisma.auction.create({
              data: { ...auctionData, slug },
            }).catch(async () => {
              // Slug conflict — add random suffix
              await this.prisma.auction.create({
                data: { ...auctionData, slug: `${slug}-${Date.now().toString(36)}` },
              })
            })
            created++
          }
        } catch (err: any) {
          errors.push(`Item ${item.externalId}: ${err.message}`)
        }
      }

      await this.prisma.scraperRun.update({
        where: { id: run.id },
        data: {
          status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
          finishedAt: new Date(),
          itemsFound: items.length,
          itemsCreated: created,
          itemsUpdated: updated,
          errorMessage: errors.length > 0 ? errors.join('\n') : null,
        },
      })
    } catch (err: any) {
      await this.prisma.scraperRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          itemsFound: items.length,
          errorMessage: err.message,
        },
      })
      throw err
    }

    return { created, updated, found: items.length, errors }
  }
}
