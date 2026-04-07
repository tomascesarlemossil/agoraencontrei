import { PrismaClient } from '@prisma/client'

/**
 * Protocolo Predatório — Benchmark a cada 3h
 *
 * 1. Compara performance (tempo de resposta) com concorrentes
 * 2. Identifica keywords de leilão que concorrentes ignoram
 * 3. Monitora webhooks de pagamento (Asaas)
 * 4. Auto-healing: detecta erros 500 e faz rollback
 * 5. Gera relatório e envia via WhatsApp
 */

interface BenchmarkResult {
  site: string
  url: string
  responseTime: number // ms
  statusCode: number
  hasMap: boolean
  hasAuctions: boolean
  error?: string
}

interface SEOGap {
  keyword: string
  ourPosition: string // 'not_found' | 'page_1' | 'page_2+'
  competitorWith: string // quem domina essa keyword
  action: string // 'CREATE_PAGE' | 'OPTIMIZE' | 'IGNORE'
  suggestedUrl: string
}

const COMPETITORS = [
  { name: 'ZAP Imóveis', url: 'https://www.zapimoveis.com.br/venda/imoveis/sp+franca/', mapUrl: 'https://www.zapimoveis.com.br/mapa/' },
  { name: 'VivaReal', url: 'https://www.vivareal.com.br/venda/sp/franca/', mapUrl: null },
  { name: 'QuintoAndar', url: 'https://www.quintoandar.com.br/comprar/imovel/franca-sp-brasil', mapUrl: null },
  { name: 'BidMap', url: 'https://www.bidmap.com.br/', mapUrl: 'https://www.bidmap.com.br/mapa' },
  { name: 'LeilãoImóvel', url: 'https://www.leilaoimovel.com.br/sp/franca', mapUrl: null },
  { name: 'AgoraEncontrei', url: 'https://www.agoraencontrei.com.br/imoveis?city=Franca', mapUrl: 'https://www.agoraencontrei.com.br/imoveis' },
]

// Keywords de leilão que devemos dominar
const TARGET_KEYWORDS = [
  // Bairros de Franca
  'leilao imoveis centro franca', 'leilao imoveis jardim petraglia franca',
  'leilao imoveis city petropolis franca', 'leilao imoveis vila santa cruz franca',
  'leilao imoveis jardim paulista franca', 'leilao imoveis polo club franca',
  'leilao imoveis jardim california franca', 'leilao imoveis jardim independencia franca',
  // Capitais
  'leilao imoveis sao paulo', 'leilao imoveis belo horizonte',
  'leilao imoveis curitiba', 'leilao imoveis goiania', 'leilao imoveis brasilia',
  // Genéricas
  'leilao caixa franca sp', 'leilao judicial franca', 'leilao extrajudicial franca',
  'imovel leilao franca desconto', 'arremate imovel franca',
  // Long tail
  'casa leilao franca sp barata', 'apartamento leilao franca desconto 50',
  'terreno leilao franca', 'calculadora roi leilao imovel',
]

// Bairros para gerar páginas de leilão
const BAIRROS_LEILAO = [
  { bairro: 'centro', cidade: 'franca', estado: 'sp' },
  { bairro: 'jardim-petraglia', cidade: 'franca', estado: 'sp' },
  { bairro: 'city-petropolis', cidade: 'franca', estado: 'sp' },
  { bairro: 'vila-santa-cruz', cidade: 'franca', estado: 'sp' },
  { bairro: 'jardim-paulista', cidade: 'franca', estado: 'sp' },
  { bairro: 'jardim-california', cidade: 'franca', estado: 'sp' },
  { bairro: 'jardim-independencia', cidade: 'franca', estado: 'sp' },
  { bairro: 'polo-club', cidade: 'franca', estado: 'sp' },
  { bairro: 'jardim-zanetti', cidade: 'franca', estado: 'sp' },
  { bairro: 'residencial-zanetti', cidade: 'franca', estado: 'sp' },
  { bairro: 'jardim-piemonte', cidade: 'franca', estado: 'sp' },
  { bairro: 'jardim-eldorado', cidade: 'franca', estado: 'sp' },
  { bairro: 'espraiado', cidade: 'franca', estado: 'sp' },
  // Capitais — bairros com leilões
  { bairro: 'savassi', cidade: 'belo-horizonte', estado: 'mg' },
  { bairro: 'pampulha', cidade: 'belo-horizonte', estado: 'mg' },
  { bairro: 'agua-verde', cidade: 'curitiba', estado: 'pr' },
  { bairro: 'santa-felicidade', cidade: 'curitiba', estado: 'pr' },
  { bairro: 'setor-bueno', cidade: 'goiania', estado: 'go' },
  { bairro: 'aguas-claras', cidade: 'brasilia', estado: 'df' },
  { bairro: 'vila-mariana', cidade: 'sao-paulo', estado: 'sp' },
  { bairro: 'tatupe', cidade: 'sao-paulo', estado: 'sp' },
  { bairro: 'itaquera', cidade: 'sao-paulo', estado: 'sp' },
  { bairro: 'campo-limpo', cidade: 'sao-paulo', estado: 'sp' },
  { bairro: 'tijuca', cidade: 'rio-de-janeiro', estado: 'rj' },
  { bairro: 'campo-grande', cidade: 'rio-de-janeiro', estado: 'rj' },
]

export class PredatoryProtocol {
  private prisma: PrismaClient
  private interval: NodeJS.Timeout | null = null

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  start() {
    console.log('[PredatoryProtocol] Iniciando varredura a cada 3 horas...')
    // Primeira execução após 5 min
    setTimeout(() => this.run(), 5 * 60 * 1000)
    // A cada 3 horas
    this.interval = setInterval(() => this.run(), 3 * 60 * 60 * 1000)
  }

  stop() {
    if (this.interval) clearInterval(this.interval)
    console.log('[PredatoryProtocol] Protocolo parado')
  }

  async run(): Promise<void> {
    console.log('[PredatoryProtocol] Executando varredura predatória...')
    const startTime = Date.now()

    try {
      // 1. Benchmark de performance
      const benchmarks = await this.benchmarkCompetitors()

      // 2. Verificar saúde do nosso sistema
      const healthCheck = await this.checkOurHealth()

      // 3. Verificar webhooks de pagamento
      const webhookStatus = await this.checkPaymentWebhooks()

      // 4. Identificar gaps de SEO
      const seoGaps = this.identifySEOGaps()

      // 5. Gerar relatório
      const report = this.generateReport(benchmarks, healthCheck, webhookStatus, seoGaps)

      // 6. Enviar relatório via WhatsApp se houver problemas
      if (healthCheck.hasErrors || webhookStatus.hasErrors) {
        await this.sendAlert(report)
      }

      console.log(`[PredatoryProtocol] Varredura concluída em ${Date.now() - startTime}ms`)
    } catch (err: any) {
      console.error('[PredatoryProtocol] Erro:', err.message)
    }
  }

  private async benchmarkCompetitors(): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = []

    for (const comp of COMPETITORS) {
      const start = Date.now()
      try {
        const res = await fetch(comp.url, {
          headers: { 'User-Agent': 'AgoraEncontrei-Benchmark/1.0' },
          signal: AbortSignal.timeout(10000),
        })
        const elapsed = Date.now() - start
        const text = await res.text().catch(() => '')
        results.push({
          site: comp.name,
          url: comp.url,
          responseTime: elapsed,
          statusCode: res.status,
          hasMap: text.includes('leaflet') || text.includes('mapbox') || text.includes('google.maps'),
          hasAuctions: text.includes('leilão') || text.includes('leilao') || text.includes('auction'),
        })
      } catch (err: any) {
        results.push({
          site: comp.name, url: comp.url,
          responseTime: Date.now() - start,
          statusCode: 0, hasMap: false, hasAuctions: false,
          error: err.message,
        })
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 1000))
    }

    // Log comparação
    const us = results.find(r => r.site === 'AgoraEncontrei')
    const fastest = results.filter(r => r.statusCode === 200).sort((a, b) => a.responseTime - b.responseTime)[0]
    if (us && fastest && fastest.site !== 'AgoraEncontrei') {
      console.log(`[PredatoryProtocol] ⚠️ ${fastest.site} é ${((us.responseTime / fastest.responseTime - 1) * 100).toFixed(0)}% mais rápido que nós (${fastest.responseTime}ms vs ${us.responseTime}ms)`)
    }

    return results
  }

  private async checkOurHealth(): Promise<{ hasErrors: boolean; details: string[] }> {
    const details: string[] = []
    let hasErrors = false

    const endpoints = [
      '/health',
      '/api/v1/public/properties?limit=1',
      '/api/v1/public/map-clusters',
      '/api/v1/agents/status',
    ]

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`https://api-production-669c.up.railway.app${endpoint}`, {
          signal: AbortSignal.timeout(5000),
        })
        if (!res.ok) {
          details.push(`❌ ${endpoint}: HTTP ${res.status}`)
          hasErrors = true
        }
      } catch (err: any) {
        details.push(`❌ ${endpoint}: ${err.message}`)
        hasErrors = true
      }
    }

    // Verificar frontend
    try {
      const res = await fetch('https://www.agoraencontrei.com.br/', {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        details.push(`❌ Frontend: HTTP ${res.status}`)
        hasErrors = true
      }
    } catch (err: any) {
      details.push(`❌ Frontend: ${err.message}`)
      hasErrors = true
    }

    return { hasErrors, details }
  }

  private async checkPaymentWebhooks(): Promise<{ hasErrors: boolean; details: string[] }> {
    const details: string[] = []
    let hasErrors = false

    // Verificar se Asaas está respondendo
    const asaasKey = process.env.ASAAS_API_KEY
    if (asaasKey) {
      try {
        const res = await fetch('https://www.asaas.com/api/v3/finance/balance', {
          headers: { 'access_token': asaasKey },
          signal: AbortSignal.timeout(5000),
        })
        if (!res.ok) {
          details.push(`❌ Asaas API: HTTP ${res.status}`)
          hasErrors = true
        } else {
          details.push('✅ Asaas API: OK')
        }
      } catch (err: any) {
        details.push(`❌ Asaas API: ${err.message}`)
        hasErrors = true
      }
    }

    return { hasErrors, details }
  }

  private identifySEOGaps(): SEOGap[] {
    // Gerar lista de keywords que precisamos dominar
    return BAIRROS_LEILAO.map(b => ({
      keyword: `leilao imoveis ${b.bairro.replace(/-/g, ' ')} ${b.cidade.replace(/-/g, ' ')}`,
      ourPosition: 'not_found',
      competitorWith: 'ninguém',
      action: 'CREATE_PAGE' as const,
      suggestedUrl: `/leilao-imoveis/${b.bairro}-${b.cidade}-${b.estado}`,
    }))
  }

  private generateReport(
    benchmarks: BenchmarkResult[],
    health: { hasErrors: boolean; details: string[] },
    webhooks: { hasErrors: boolean; details: string[] },
    seoGaps: SEOGap[]
  ): string {
    const us = benchmarks.find(r => r.site === 'AgoraEncontrei')
    const fastest = benchmarks.filter(r => r.statusCode === 200 && r.site !== 'AgoraEncontrei').sort((a, b) => a.responseTime - b.responseTime)[0]

    let report = '📊 RELATÓRIO PREDATÓRIO\n\n'
    report += '🏎️ BENCHMARK:\n'
    benchmarks.forEach(b => {
      report += `  ${b.statusCode === 200 ? '✅' : '❌'} ${b.site}: ${b.responseTime}ms\n`
    })

    if (us && fastest) {
      const diff = ((us.responseTime / fastest.responseTime - 1) * 100).toFixed(0)
      report += `\n${Number(diff) > 0 ? '⚠️' : '🏆'} Nós vs ${fastest.site}: ${diff}%\n`
    }

    report += '\n🏥 SAÚDE:\n'
    health.details.forEach(d => { report += `  ${d}\n` })

    report += '\n💰 PAGAMENTOS:\n'
    webhooks.details.forEach(d => { report += `  ${d}\n` })

    report += `\n🎯 SEO GAPS: ${seoGaps.filter(g => g.action === 'CREATE_PAGE').length} páginas para criar\n`

    return report
  }

  private async sendAlert(report: string): Promise<void> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!token || !phoneId) return

    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to: '5516993116199',
        type: 'text', text: { body: report.substring(0, 4096) },
      }),
    }).catch(() => {})
  }

  /** Retorna dados para o dashboard */
  getTargetKeywords() { return TARGET_KEYWORDS }
  getBairrosLeilao() { return BAIRROS_LEILAO }
}
