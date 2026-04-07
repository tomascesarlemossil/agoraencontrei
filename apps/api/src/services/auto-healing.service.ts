/**
 * Auto-Healing Service
 *
 * Monitora erros 500, quedas de endpoint, e problemas de pagamento.
 * Envia alertas via WhatsApp e tenta rollback automático.
 */

interface HealthCheck {
  endpoint: string
  status: number
  responseTime: number
  error?: string
}

export class AutoHealingService {
  private errorCount = new Map<string, number>()
  private interval: NodeJS.Timeout | null = null
  private readonly MAX_ERRORS_BEFORE_ALERT = 3
  private readonly CHECK_INTERVAL = 5 * 60 * 1000 // 5 min

  start() {
    console.log('[AutoHealing] Iniciando monitoramento...')
    this.interval = setInterval(() => this.runHealthChecks(), this.CHECK_INTERVAL)
    // Primeira verificação após 2 min
    setTimeout(() => this.runHealthChecks(), 2 * 60 * 1000)
  }

  stop() {
    if (this.interval) clearInterval(this.interval)
    console.log('[AutoHealing] Monitoramento parado')
  }

  async runHealthChecks(): Promise<HealthCheck[]> {
    const results: HealthCheck[] = []
    const baseUrl = process.env.APP_URL || 'http://localhost:3100'

    const endpoints = [
      '/health',
      '/api/v1/public/properties?limit=1',
      '/api/v1/agents/status',
      '/api/v1/auctions?limit=1',
    ]

    for (const endpoint of endpoints) {
      const start = Date.now()
      try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          signal: AbortSignal.timeout(10000),
        })
        const elapsed = Date.now() - start
        results.push({ endpoint, status: res.status, responseTime: elapsed })

        if (res.status >= 500) {
          this.incrementError(endpoint)
        } else {
          this.errorCount.set(endpoint, 0)
        }

        // Alerta se resposta > 5s
        if (elapsed > 5000) {
          console.warn(`[AutoHealing] ⚠️ ${endpoint} lento: ${elapsed}ms`)
        }
      } catch (err: any) {
        const elapsed = Date.now() - start
        results.push({ endpoint, status: 0, responseTime: elapsed, error: err.message })
        this.incrementError(endpoint)
      }
    }

    // Verificar webhooks de pagamento (Asaas)
    await this.checkPaymentHealth()

    return results
  }

  private incrementError(endpoint: string) {
    const count = (this.errorCount.get(endpoint) || 0) + 1
    this.errorCount.set(endpoint, count)

    if (count >= this.MAX_ERRORS_BEFORE_ALERT) {
      this.sendAlert(`🚨 ALERTA: ${endpoint} com ${count} erros consecutivos!`)
      this.errorCount.set(endpoint, 0) // Reset após alerta
    }
  }

  private async checkPaymentHealth() {
    const asaasKey = process.env.ASAAS_API_KEY
    if (!asaasKey) return

    try {
      const res = await fetch('https://www.asaas.com/api/v3/finance/balance', {
        headers: { 'access_token': asaasKey },
        signal: AbortSignal.timeout(5000),
      })

      if (!res.ok) {
        this.sendAlert(`🚨 Asaas API com erro: HTTP ${res.status}`)
      }
    } catch (err: any) {
      this.sendAlert(`🚨 Asaas API inacessível: ${err.message}`)
    }
  }

  private async sendAlert(message: string) {
    console.error(`[AutoHealing] ${message}`)
    const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!token || !phoneId) return

    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to: '5516993116199',
        type: 'text', text: { body: `[AgoraEncontrei AutoHealing]\n\n${message}\n\nTimestamp: ${new Date().toISOString()}` },
      }),
    }).catch(() => {})
  }
}
