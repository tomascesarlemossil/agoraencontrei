import { PrismaClient } from '@prisma/client'
import { CaixaScraper } from './caixa-scraper.js'
import { GenericLeiloeiroScraper, LEILOEIROS_CONFIG, BANCOS_CONFIG } from './generic-scraper.js'
import { AiNewsroomService } from '../ai-newsroom.service.js'
import { env } from '../../utils/env.js'
import { fetchSantanderApifyLastRun, persistApifySantanderItems } from '../apify-santander.service.js'
import { fetchCaixaApifyLastRun, persistApifyCaixaItems } from '../apify-caixa.service.js'
import { fetchZukApifyLastRun, persistApifyZukItems } from '../apify-zuk.service.js'
import { AuctionAlertService } from '../auction-alerts.service.js'

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

    const safe = (fn: () => Promise<any>, label: string) => () => fn().catch(e => console.error(`[ScraperScheduler] ${label} error:`, e.message))

    // Rodar uma vez na inicialização (com delay para não travar o boot)
    setTimeout(safe(() => this.runAll(), 'runAll'), 30_000) // 30s após boot

    // Caixa: a cada 6 horas
    this.intervals.push(setInterval(safe(() => this.runCaixa(), 'runCaixa'), 6 * 60 * 60 * 1000))

    // Bancos: a cada 12 horas
    this.intervals.push(setInterval(safe(() => this.runBancos(), 'runBancos'), 12 * 60 * 60 * 1000))

    // Leiloeiros: a cada 24 horas (stagger)
    this.intervals.push(setInterval(safe(() => this.runLeiloeiros(), 'runLeiloeiros'), 24 * 60 * 60 * 1000))

    // Limpeza: diário
    this.intervals.push(setInterval(safe(() => this.cleanup(), 'cleanup'), 24 * 60 * 60 * 1000))

    // Atualizar scores: a cada 4 horas
    this.intervals.push(setInterval(safe(() => this.updateScores(), 'updateScores'), 4 * 60 * 60 * 1000))

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

    await new Promise(resolve => setTimeout(resolve, 5000))

    try {
      const zukResult = await this.runZuk()
      results.push(zukResult)
    } catch (err: any) {
      console.error('[ScraperScheduler] Erro no Zuk:', err.message)
    }

    console.log(`[ScraperScheduler] Concluído. ${results.length} fontes processadas.`)

    // Após varrer todas as fontes, dispara alertas WhatsApp para os
    // matches novos. Isto fechava o ciclo: até aqui o alerta era criado no
    // banco mas nunca era processado, então o usuário nunca recebia nada.
    try {
      const alerts = new AuctionAlertService(this.prisma)
      const r = await alerts.processAlerts()
      console.log(`[ScraperScheduler] Alertas processados: ${r.matched} matches, ${r.sent} enviados`)
    } catch (err: any) {
      console.error('[ScraperScheduler] Alertas falharam:', err.message)
    }

    // IA Newsroom — gerar posts para leilões "joia"
    try {
      const newsroom = new AiNewsroomService(this.prisma)
      const posts = await newsroom.generatePosts()
      if (posts.created > 0) console.log(`[ScraperScheduler] IA Newsroom: ${posts.created} posts gerados`)
    } catch (err: any) {
      console.error('[ScraperScheduler] IA Newsroom erro:', err.message)
    }
    return results
  }

  async runCaixa(): Promise<ScraperResult> {
    console.log('[ScraperScheduler] Rodando scraper Caixa...')
    const start = Date.now()
    const scraper = new CaixaScraper(this.prisma)

    try {
      const result = await scraper.run()
      let merged = { ...result }

      // Apify-enriched Caixa data complements the official CSV with photos,
      // edital URLs and room counts the CSV does not expose. Skipped silently
      // when APIFY_API_TOKEN is not configured.
      if (env.APIFY_API_TOKEN) {
        try {
          const apifyItems = await fetchCaixaApifyLastRun()
          if (apifyItems.length > 0) {
            const apifyResult = await persistApifyCaixaItems(this.prisma, apifyItems)
            merged = {
              found: result.found + apifyResult.found,
              created: result.created + apifyResult.created,
              updated: result.updated + apifyResult.updated,
              errors: [...(result.errors || []), ...apifyResult.errors],
            }
            console.log(`[ScraperScheduler] Caixa+Apify: +${apifyResult.found} encontrados, +${apifyResult.created} novos`)
          }
        } catch (err: any) {
          console.error('[ScraperScheduler] Caixa Apify falhou:', err.message)
        }
      }

      const duration = Date.now() - start
      console.log(`[ScraperScheduler] Caixa: ${merged.found} encontrados, ${merged.created} novos, ${merged.updated} atualizados (${duration}ms)`)
      return { source: 'CAIXA', ...merged, duration }
    } catch (err: any) {
      console.error('[ScraperScheduler] Caixa falhou:', err.message)
      return { source: 'CAIXA', found: 0, created: 0, updated: 0, errors: [err.message], duration: Date.now() - start }
    }
  }

  async runBancos(): Promise<ScraperResult[]> {
    console.log('[ScraperScheduler] Rodando scrapers de Bancos...')
    const results: ScraperResult[] = []
    const apifyEnabled = !!env.APIFY_API_TOKEN
    let santanderHandledByApify = false

    // Santander via Apify — the bank's site is a SPA that returns blank HTML
    // to raw fetch, so the GenericLeiloeiroScraper always recorded zero. The
    // Apify actor renders the page and returns enriched listings.
    if (apifyEnabled) {
      const start = Date.now()
      try {
        const items = await fetchSantanderApifyLastRun()
        if (items.length > 0) {
          const r = await persistApifySantanderItems(this.prisma, items)
          const duration = Date.now() - start
          console.log(`[ScraperScheduler] Santander (Apify): ${r.found} encontrados, ${r.created} novos (${duration}ms)`)
          results.push({ source: 'SANTANDER', ...r, duration })
          santanderHandledByApify = true
        } else {
          console.warn('[ScraperScheduler] Santander Apify: nenhum item no último run')
        }
      } catch (err: any) {
        console.error('[ScraperScheduler] Santander Apify falhou:', err.message)
        results.push({ source: 'SANTANDER', found: 0, created: 0, updated: 0, errors: [err.message], duration: Date.now() - start })
      }
    } else {
      console.warn('[ScraperScheduler] APIFY_API_TOKEN ausente — Santander cairá no scraper genérico (que falha em SPA)')
    }

    for (const config of BANCOS_CONFIG) {
      // Skip Santander generic scraper when Apify already filled the DB.
      if (config.source === 'SANTANDER' && santanderHandledByApify) continue

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

  /**
   * Zuk Leilões via Apify — agregador multi-banco (Bradesco, Santander,
   * Sicoob, Creditas, judicial). Sem isto o portal SPA retorna HTML vazio.
   */
  async runZuk(): Promise<ScraperResult> {
    console.log('[ScraperScheduler] Rodando scraper Zuk (Apify)...')
    const start = Date.now()
    if (!env.APIFY_API_TOKEN) {
      return { source: 'ZUK', found: 0, created: 0, updated: 0, errors: ['APIFY_API_TOKEN não configurado'], duration: Date.now() - start }
    }
    try {
      const items = await fetchZukApifyLastRun()
      if (items.length === 0) {
        console.warn('[ScraperScheduler] Zuk Apify: nenhum item no último run')
        return { source: 'ZUK', found: 0, created: 0, updated: 0, errors: [], duration: Date.now() - start }
      }
      const r = await persistApifyZukItems(this.prisma, items)
      const duration = Date.now() - start
      console.log(`[ScraperScheduler] Zuk: ${r.found} encontrados, ${r.created} novos, ${r.updated} atualizados (${duration}ms)`)
      return { source: 'ZUK', ...r, duration }
    } catch (err: any) {
      console.error('[ScraperScheduler] Zuk falhou:', err.message)
      return { source: 'ZUK', found: 0, created: 0, updated: 0, errors: [err.message], duration: Date.now() - start }
    }
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

  /** Marcar leilões com data passada como CLOSED (exceto Caixa vendas diretas) */
  async cleanup(): Promise<void> {
    console.log('[ScraperScheduler] Limpeza de leilões expirados...')
    const now = new Date()

    // Only close time-limited auctions (judicial, extrajudicial, leiloeiro)
    // Caixa/bank direct sales don't have strict end dates - they stay active until sold
    const result = await this.prisma.auction.updateMany({
      where: {
        auctionDate: { lt: now },
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
        source: { notIn: ['CAIXA', 'BANCO_DO_BRASIL', 'BRADESCO', 'SANTANDER', 'ITAU'] },
      },
      data: { status: 'CLOSED' },
    })

    // For bank auctions, only close if they haven't been scraped in 7+ days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const bankResult = await this.prisma.auction.updateMany({
      where: {
        lastScrapedAt: { lt: sevenDaysAgo },
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
        source: { in: ['CAIXA', 'BANCO_DO_BRASIL', 'BRADESCO', 'SANTANDER', 'ITAU'] },
      },
      data: { status: 'CLOSED' },
    })

    console.log(`[ScraperScheduler] ${result.count} leilões + ${bankResult.count} bancários marcados como CLOSED`)
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
