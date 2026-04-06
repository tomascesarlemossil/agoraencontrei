import { PrismaClient } from '@prisma/client'
import { CaixaScraper } from './caixa-scraper.js'
import { GenericLeiloeiroScraper, LEILOEIROS_CONFIG, BANCOS_CONFIG } from './generic-scraper.js'

/**
 * Scheduler de Scrapers — roda 24/7, varrendo todas as fontes
 *
 * Agenda:
 * - Caixa: a cada 6 horas (fonte mais importante)
 * - Bancos: a cada 12 horas
 * - Leiloeiros: a cada 24 horas (são muitos, distribuir ao longo do dia)
 * - Limpeza de leilões expirados: diário às 03h
 *
 * Integração: Usa o BullMQ já existente no sistema para agendar jobs
 */

interface ScraperResult {
  source: string
  found: number
  created: number
  updated: number
  errors: string[]
  duration: number
}

export class ScraperScheduler {
  private prisma: PrismaClient
  private isRunning = false
  private intervals: NodeJS.Timeout[] = []

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async start() {
    if (this.isRunning) return
    this.isRunning = true
    console.log('[ScraperScheduler] Iniciando scheduler de scrapers...')

    // Rodar uma vez na inicialização (com delay para não travar o boot)
    setTimeout(() => this.runAll(), 30_000) // 30s após boot

    // Caixa: a cada 6 horas
    this.intervals.push(setInterval(() => this.runCaixa(), 6 * 60 * 60 * 1000))

    // Bancos: a cada 12 horas
    this.intervals.push(setInterval(() => this.runBancos(), 12 * 60 * 60 * 1000))

    // Leiloeiros: a cada 24 horas (stagger)
    this.intervals.push(setInterval(() => this.runLeiloeiros(), 24 * 60 * 60 * 1000))

    // Limpeza: diário
    this.intervals.push(setInterval(() => this.cleanup(), 24 * 60 * 60 * 1000))

    // Atualizar scores: a cada 4 horas
    this.intervals.push(setInterval(() => this.updateScores(), 4 * 60 * 60 * 1000))

    console.log('[ScraperScheduler] Scheduler ativo — Caixa 6h, Bancos 12h, Leiloeiros 24h')
  }

  stop() {
    this.isRunning = false
    this.intervals.forEach(clearInterval)
    this.intervals = []
    console.log('[ScraperScheduler] Scheduler parado')
  }

  async runAll(): Promise<ScraperResult[]> {
    console.log('[ScraperScheduler] Executando TODOS os scrapers...')
    const results: ScraperResult[] = []

    try {
      const caixaResult = await this.runCaixa()
      results.push(caixaResult)
    } catch (err: any) {
      console.error('[ScraperScheduler] Erro no Caixa:', err.message)
    }

    // Esperar 5s entre fontes
    await new Promise(resolve => setTimeout(resolve, 5000))

    try {
      const bancosResults = await this.runBancos()
      results.push(...bancosResults)
    } catch (err: any) {
      console.error('[ScraperScheduler] Erro nos Bancos:', err.message)
    }

    await new Promise(resolve => setTimeout(resolve, 5000))

    try {
      const leiloeirosResults = await this.runLeiloeiros()
      results.push(...leiloeirosResults)
    } catch (err: any) {
      console.error('[ScraperScheduler] Erro nos Leiloeiros:', err.message)
    }

    console.log(`[ScraperScheduler] Concluído. ${results.length} fontes processadas.`)
    return results
  }

  async runCaixa(): Promise<ScraperResult> {
    console.log('[ScraperScheduler] Rodando scraper Caixa...')
    const start = Date.now()
    const scraper = new CaixaScraper(this.prisma)

    try {
      const result = await scraper.run()
      const duration = Date.now() - start
      console.log(`[ScraperScheduler] Caixa: ${result.found} encontrados, ${result.created} novos, ${result.updated} atualizados (${duration}ms)`)
      return { source: 'CAIXA', ...result, duration }
    } catch (err: any) {
      console.error('[ScraperScheduler] Caixa falhou:', err.message)
      return { source: 'CAIXA', found: 0, created: 0, updated: 0, errors: [err.message], duration: Date.now() - start }
    }
  }

  async runBancos(): Promise<ScraperResult[]> {
    console.log('[ScraperScheduler] Rodando scrapers de Bancos...')
    const results: ScraperResult[] = []

    for (const config of BANCOS_CONFIG) {
      const start = Date.now()
      try {
        const scraper = new GenericLeiloeiroScraper(this.prisma, config)
        const result = await scraper.run()
        const duration = Date.now() - start
        console.log(`[ScraperScheduler] ${config.name}: ${result.found} encontrados (${duration}ms)`)
        results.push({ source: config.source, ...result, duration })

        // Rate limit entre bancos
        await new Promise(resolve => setTimeout(resolve, 3000))
      } catch (err: any) {
        console.error(`[ScraperScheduler] ${config.name} falhou:`, err.message)
        results.push({ source: config.source, found: 0, created: 0, updated: 0, errors: [err.message], duration: Date.now() - start })
      }
    }

    return results
  }

  async runLeiloeiros(): Promise<ScraperResult[]> {
    console.log('[ScraperScheduler] Rodando scrapers de Leiloeiros...')
    const results: ScraperResult[] = []

    for (const config of LEILOEIROS_CONFIG) {
      const start = Date.now()
      try {
        const scraper = new GenericLeiloeiroScraper(this.prisma, config)
        const result = await scraper.run()
        const duration = Date.now() - start
        console.log(`[ScraperScheduler] ${config.name}: ${result.found} encontrados (${duration}ms)`)
        results.push({ source: config.source, ...result, duration })

        // Rate limit entre leiloeiros (2s)
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (err: any) {
        console.error(`[ScraperScheduler] ${config.name} falhou:`, err.message)
        results.push({ source: config.source, found: 0, created: 0, updated: 0, errors: [err.message], duration: Date.now() - start })
      }
    }

    return results
  }

  /** Marcar leilões com data passada como CLOSED */
  async cleanup(): Promise<void> {
    console.log('[ScraperScheduler] Limpeza de leilões expirados...')
    const now = new Date()

    const result = await this.prisma.auction.updateMany({
      where: {
        auctionDate: { lt: now },
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
      },
      data: { status: 'CLOSED' },
    })

    console.log(`[ScraperScheduler] ${result.count} leilões marcados como CLOSED`)
  }

  /** Recalcular scores de oportunidade */
  async updateScores(): Promise<void> {
    console.log('[ScraperScheduler] Atualizando scores de oportunidade...')

    const auctions = await this.prisma.auction.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'CLOSED', 'SOLD'] },
        minimumBid: { not: null },
      },
      select: {
        id: true,
        appraisalValue: true,
        minimumBid: true,
        occupation: true,
        financingAvailable: true,
        fgtsAllowed: true,
        hasDebts: true,
        totalArea: true,
      },
    })

    let updated = 0
    for (const auction of auctions) {
      let score = 50
      if (auction.appraisalValue && auction.minimumBid) {
        const discount = (Number(auction.appraisalValue) - Number(auction.minimumBid)) / Number(auction.appraisalValue) * 100
        if (discount > 50) score += 20
        else if (discount > 30) score += 15
        else if (discount > 20) score += 10
        else if (discount > 10) score += 5

        const roi = discount * 0.7
        await this.prisma.auction.update({
          where: { id: auction.id },
          data: {
            opportunityScore: Math.min(100, score +
              (auction.occupation === 'DESOCUPADO' ? 10 : 0) +
              (auction.financingAvailable ? 5 : 0) +
              (auction.fgtsAllowed ? 5 : 0) +
              (!auction.hasDebts ? 5 : 0)),
            estimatedROI: roi,
            discountPercent: Number(discount.toFixed(1)),
          },
        })
        updated++
      }
    }

    console.log(`[ScraperScheduler] ${updated} scores atualizados`)
  }
}
