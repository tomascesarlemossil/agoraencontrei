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
    const priceChanges = await this.detectPriceChanges()

    // 5. Alertar parceiros Prime sobre novas oportunidades com ROI > 40% no bairro deles
    await this.alertPrimePartnersAboutOpportunities().catch(err =>
      console.error('[AuctionMonitor] Erro ao alertar parceiros Prime:', err.message)
    )

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

  /**
   * Alerta parceiros Prime/VIP quando um leilão com ROI > 40% entra no bairro de atuação deles
   * Roda a cada ciclo do monitor (30 min) mas só envia para leilões criados na última hora
   */
  private async alertPrimePartnersAboutOpportunities(): Promise<void> {
    const { sendEmail, isEmailConfigured } = await import('./email.service.js')
    if (!isEmailConfigured()) return

    // Buscar leilões com desconto > 40% criados na última hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const highROIAuctions = await this.prisma.auction.findMany({
      where: {
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
        createdAt: { gte: oneHourAgo },
        discountPercent: { gte: 40 },
      },
      select: {
        id: true, title: true, slug: true, city: true, state: true,
        neighborhood: true, minimumBid: true, appraisalValue: true,
        discountPercent: true, opportunityScore: true, propertyType: true,
      },
    })

    if (highROIAuctions.length === 0) return

    // Buscar parceiros Prime/VIP com email (usa raw query — modelo specialist pode não existir ainda)
    const primePartners = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, email, city FROM partners WHERE plan IN ('PRIME', 'VIP', 'ELITE', 'FOUNDER') AND active = true AND email IS NOT NULL LIMIT 100`
    ).catch(() => [] as any[])
    if (false as any) await this.prisma.$queryRaw`SELECT 1` // dummy to satisfy type
    for (const auction of highROIAuctions) {
      // Filtrar parceiros que atuam na mesma cidade/bairro
      const relevantPartners = primePartners.filter((p: any) => {
        if (p.city && auction.city && p.city.toLowerCase() !== auction.city.toLowerCase()) return false
        return true // Se não tem cidade configurada, recebe todos
      })

      for (const partner of relevantPartners) {
        if (!partner.email) continue
        const bid = auction.minimumBid ? `R$ ${Number(auction.minimumBid).toLocaleString('pt-BR')}` : 'a consultar'
        const disc = auction.discountPercent ? `${auction.discountPercent}%` : ''
        const score = auction.opportunityScore || 0
        const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'

        await sendEmail({
          to: partner.email,
          subject: `🔨 Novo Leilão Detectado em ${auction.neighborhood || auction.city}! ${disc} de desconto`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fff">
              <div style="background:linear-gradient(135deg,#1B2B5B,#2d4a8a);padding:24px;text-align:center">
                <h1 style="color:#C9A84C;margin:0;font-size:22px">🔨 Oportunidade Detectada!</h1>
                <p style="color:#fff;margin:8px 0 0;font-size:14px">AgoraEncontrei — Alerta Exclusivo Parceiro ${partner.name?.split(' ')[0] || ''}</p>
              </div>
              <div style="padding:24px">
                <p style="color:#555;font-size:15px">Olá, <strong>${partner.name?.split(' ')[0] || 'Parceiro'}</strong>!</p>
                <p style="color:#555;font-size:15px">Nosso robô acabou de detectar um leilão de alto ROI no seu bairro de atuação:</p>
                <div style="background:#f8faff;border:2px solid #C9A84C;border-radius:12px;padding:20px;margin:16px 0">
                  <h2 style="color:#1B2B5B;margin:0 0 8px;font-size:16px">${auction.title}</h2>
                  <p style="color:#666;margin:0 0 12px;font-size:13px">📍 ${auction.neighborhood || ''}, ${auction.city}/${auction.state}</p>
                  <div style="display:flex;gap:12px;flex-wrap:wrap">
                    <div style="background:#fff;border-radius:8px;padding:10px 14px;text-align:center;flex:1;min-width:100px">
                      <div style="font-size:11px;color:#999">Lance Mínimo</div>
                      <div style="font-size:18px;font-weight:800;color:#1B2B5B">${bid}</div>
                    </div>
                    <div style="background:#fff;border-radius:8px;padding:10px 14px;text-align:center;flex:1;min-width:100px">
                      <div style="font-size:11px;color:#999">Desconto Real</div>
                      <div style="font-size:18px;font-weight:800;color:#dc2626">${disc}</div>
                    </div>
                    <div style="background:#fff;border-radius:8px;padding:10px 14px;text-align:center;flex:1;min-width:100px">
                      <div style="font-size:11px;color:#999">Score</div>
                      <div style="font-size:18px;font-weight:800;color:${scoreColor}">${score}/100</div>
                    </div>
                  </div>
                </div>
                <p style="color:#555;font-size:14px">💡 <strong>Por que isso é bom para você?</strong> Investidores interessados neste imóvel vão buscar um especialista de confiança na região. Esteja com seu perfil em dia!</p>
                <div style="text-align:center;margin:24px 0">
                  <a href="https://agoraencontrei.com.br/leiloes/${auction.slug}" style="background:linear-gradient(135deg,#C9A84C,#e6c96a);color:#1B2B5B;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;display:inline-block">
                    Ver Imóvel no Mapa →
                  </a>
                </div>
              </div>
              <div style="background:#f5f5f5;padding:16px;text-align:center;font-size:11px;color:#999">
                Você recebe este alerta por ser Parceiro ${partner.name ? 'Prime/VIP' : ''} do AgoraEncontrei.
                <a href="https://agoraencontrei.com.br/dashboard" style="color:#1B2B5B">Gerenciar preferências</a>
              </div>
            </div>
          `,
        }).catch(() => {}) // fire and forget
      }
    }
  }

  private async sendWhatsApp(phone: string, message: string): Promise<void> {
    const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
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
