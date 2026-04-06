import { PrismaClient } from '@prisma/client'

/**
 * Monitor de Lances 24/7
 *
 * Roda a cada 30 minutos e:
 * 1. Marca leilões com data passada como CLOSED
 * 2. Detecta mudanças de preço (scraper vs DB)
 * 3. Notifica usuários com alertas ativos sobre mudanças
 * 4. Remove leilões suspensos/cancelados do mapa
 * 5. Recalcula scores de oportunidade
 */

export class AuctionMonitorService {
  private prisma: PrismaClient
  private interval: NodeJS.Timeout | null = null

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  start() {
    console.log('[AuctionMonitor] Iniciando monitor de lances 24/7...')

    // Rodar imediatamente após 10s do boot
    setTimeout(() => this.runCheck(), 10_000)

    // A cada 30 minutos
    this.interval = setInterval(() => this.runCheck(), 30 * 60 * 1000)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    console.log('[AuctionMonitor] Monitor parado')
  }

  async runCheck(): Promise<{
    expired: number
    priceChanges: number
    suspended: number
    scoresUpdated: number
  }> {
    console.log('[AuctionMonitor] Executando verificação...')
    const now = new Date()

    // 1. Marcar leilões expirados como CLOSED
    const expired = await this.prisma.auction.updateMany({
      where: {
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
        auctionDate: { lt: now },
      },
      data: { status: 'CLOSED' },
    })

    // Também checar auctionEndDate
    const expiredEnd = await this.prisma.auction.updateMany({
      where: {
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
        auctionEndDate: { lt: now, not: null },
      },
      data: { status: 'CLOSED' },
    })

    // 2. Detectar leilões sem atualização há mais de 7 dias (possível suspensão)
    const staleThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const staleAuctions = await this.prisma.auction.findMany({
      where: {
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
        lastScrapedAt: { lt: staleThreshold, not: null },
      },
      select: { id: true, title: true, source: true },
    })

    // Marcar como SUSPENDED se não foram atualizados por scraper em 7 dias
    let suspended = 0
    if (staleAuctions.length > 0) {
      const result = await this.prisma.auction.updateMany({
        where: { id: { in: staleAuctions.map(a => a.id) } },
        data: { status: 'SUSPENDED' },
      })
      suspended = result.count
      console.log(`[AuctionMonitor] ${suspended} leilões marcados como SUSPENDED (sem atualização > 7 dias)`)
    }

    // 3. Recalcular scores de oportunidade para leilões ativos
    const activeAuctions = await this.prisma.auction.findMany({
      where: {
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
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
      },
    })

    let scoresUpdated = 0
    for (const auction of activeAuctions) {
      let score = 50
      if (auction.appraisalValue && auction.minimumBid) {
        const discount = (Number(auction.appraisalValue) - Number(auction.minimumBid)) / Number(auction.appraisalValue) * 100

        if (discount > 50) score += 20
        else if (discount > 30) score += 15
        else if (discount > 20) score += 10
        else if (discount > 10) score += 5

        if (auction.occupation === 'DESOCUPADO') score += 10
        if (auction.financingAvailable) score += 5
        if (auction.fgtsAllowed) score += 5
        if (!auction.hasDebts) score += 5

        score = Math.min(100, Math.max(0, score))

        await this.prisma.auction.update({
          where: { id: auction.id },
          data: {
            opportunityScore: score,
            estimatedROI: discount * 0.7,
            discountPercent: Number(discount.toFixed(1)),
          },
        })
        scoresUpdated++
      }
    }

    // 4. Enviar alertas para mudanças de preço significativas
    // (Detectar via diferença entre minimumBid atual e o valor no metadata.previousBid)
    const priceChanges = await this.detectPriceChanges()

    console.log(`[AuctionMonitor] Concluído: ${expired.count + expiredEnd.count} expirados, ${suspended} suspensos, ${scoresUpdated} scores atualizados, ${priceChanges} mudanças de preço`)

    return {
      expired: expired.count + expiredEnd.count,
      priceChanges,
      suspended,
      scoresUpdated,
    }
  }

  private async detectPriceChanges(): Promise<number> {
    // Buscar leilões que tiveram mudança de preço no último scrape
    const recentlyUpdated = await this.prisma.auction.findMany({
      where: {
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
        updatedAt: { gt: new Date(Date.now() - 60 * 60 * 1000) }, // última hora
      },
      select: {
        id: true,
        title: true,
        city: true,
        state: true,
        minimumBid: true,
        appraisalValue: true,
        metadata: true,
        slug: true,
      },
    })

    let changes = 0
    for (const auction of recentlyUpdated) {
      const meta = auction.metadata as any
      const previousBid = meta?.previousMinimumBid
      const currentBid = Number(auction.minimumBid)

      if (previousBid && previousBid !== currentBid) {
        changes++

        // Buscar alertas que matcham este leilão
        const alerts = await this.prisma.auctionAlert.findMany({
          where: {
            active: true,
            OR: [
              { city: auction.city || undefined },
              { city: null }, // alertas sem filtro de cidade
            ],
          },
          select: { id: true, phone: true, email: true },
        })

        // Notificar via WhatsApp (se configurado)
        for (const alert of alerts) {
          if (alert.phone) {
            const direction = currentBid < previousBid ? '📉 BAIXOU' : '📈 SUBIU'
            const msg = `${direction} o lance do leilão "${auction.title}" em ${auction.city}/${auction.state}!\n\nAntes: R$ ${previousBid.toLocaleString('pt-BR')}\nAgora: R$ ${currentBid.toLocaleString('pt-BR')}\n\n🔗 agoraencontrei.com.br/leiloes/${auction.slug}`

            // Fire and forget - não travar o monitor por falha de envio
            this.sendWhatsApp(alert.phone, msg).catch(() => {})
          }
        }

        // Salvar preço anterior para próxima comparação
        await this.prisma.auction.update({
          where: { id: auction.id },
          data: {
            metadata: { ...meta, previousMinimumBid: currentBid },
          },
        })
      }
    }

    return changes
  }

  private async sendWhatsApp(phone: string, message: string): Promise<void> {
    const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!token || !phoneId) return

    const cleanPhone = phone.replace(/\D/g, '')
    const formatted = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formatted,
        type: 'text',
        text: { body: message },
      }),
    })
  }
}
