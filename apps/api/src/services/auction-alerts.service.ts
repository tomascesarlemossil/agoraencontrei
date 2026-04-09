import { PrismaClient } from '@prisma/client'

/**
 * Serviço de alertas de leilões
 *
 * Verifica novos leilões vs alertas cadastrados e
 * envia notificações via WhatsApp e email.
 *
 * Integra com o WhatsApp Cloud API já configurado no sistema.
 */

interface AlertMatch {
  alertId: string
  auctionId: string
  email?: string | null
  phone?: string | null
  auctionTitle: string
  auctionCity?: string | null
  minimumBid?: number | null
  discountPercent?: number | null
  opportunityScore?: number | null
  auctionDate?: Date | null
  sourceUrl?: string | null
}

export class AuctionAlertService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Verificar alertas e enviar notificações para novos leilões
   * Deve rodar após cada execução de scraper
   */
  async processAlerts(): Promise<{ matched: number; sent: number }> {
    // Buscar alertas ativos
    const alerts = await this.prisma.auctionAlert.findMany({
      where: { active: true },
    })

    if (alerts.length === 0) return { matched: 0, sent: 0 }

    let matched = 0
    let sent = 0

    for (const alert of alerts) {
      try {
        // Construir filtro baseado no alerta
        const where: any = {
          status: { notIn: ['CANCELLED', 'CLOSED', 'SOLD'] },
          createdAt: {
            gt: alert.lastSentAt || new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
          },
        }

        if (alert.city) where.city = { contains: alert.city, mode: 'insensitive' }
        if (alert.state) where.state = alert.state
        if (alert.propertyType) where.propertyType = alert.propertyType
        if (alert.minDiscount) where.discountPercent = { gte: alert.minDiscount }
        if (alert.maxPrice) where.minimumBid = { lte: Number(alert.maxPrice) }
        if (alert.minScore) where.opportunityScore = { gte: alert.minScore }
        if (alert.source) where.source = alert.source

        const newAuctions = await this.prisma.auction.findMany({
          where,
          take: 10,
          orderBy: { opportunityScore: 'desc' },
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            minimumBid: true,
            appraisalValue: true,
            discountPercent: true,
            opportunityScore: true,
            auctionDate: true,
            sourceUrl: true,
            slug: true,
          },
        })

        if (newAuctions.length === 0) continue
        matched += newAuctions.length

        // Montar mensagem
        const message = this.buildAlertMessage(newAuctions)

        // Enviar via WhatsApp
        if (alert.phone) {
          await this.sendWhatsAppAlert(alert.phone, message)
          sent++
        }

        // Atualizar alerta
        await this.prisma.auctionAlert.update({
          where: { id: alert.id },
          data: {
            lastSentAt: new Date(),
            sentCount: { increment: 1 },
          },
        })
      } catch (err: any) {
        console.error(`[AuctionAlerts] Erro no alerta ${alert.id}: ${err.message}`)
      }
    }

    return { matched, sent }
  }

  private buildAlertMessage(auctions: any[]): string {
    let msg = `🏠 *AgoraEncontrei — Novas Oportunidades de Leilão!*\n\n`

    for (const a of auctions) {
      const discount = a.discountPercent ? `${a.discountPercent}% desc.` : ''
      const score = a.opportunityScore ? `Score: ${a.opportunityScore}/100` : ''
      const bid = a.minimumBid ? `Lance mín: R$ ${Number(a.minimumBid).toLocaleString('pt-BR')}` : ''
      const date = a.auctionDate ? `Data: ${new Date(a.auctionDate).toLocaleDateString('pt-BR')}` : ''

      msg += `📌 *${a.title}*\n`
      msg += `📍 ${a.city || ''}${a.state ? `/${a.state}` : ''}\n`
      if (bid) msg += `💰 ${bid}\n`
      if (discount) msg += `🔥 ${discount}\n`
      if (score) msg += `⭐ ${score}\n`
      if (date) msg += `📅 ${date}\n`
      msg += `🔗 agoraencontrei.com.br/leiloes/${a.slug}\n\n`
    }

    msg += `_Para cancelar este alerta, acesse seu painel no AgoraEncontrei._`
    return msg
  }

  private async sendWhatsAppAlert(phone: string, message: string): Promise<void> {
    // Integrar com o WhatsApp Cloud API já configurado no sistema
    // O serviço de WhatsApp já existe em apps/api/src/routes/whatsapp/
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

      // Usar a Meta Cloud API diretamente
      const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN
      const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

      if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
        console.warn('[AuctionAlerts] WhatsApp não configurado — alerta não enviado')
        return
      }

      await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        }),
      })

      console.log(`[AuctionAlerts] WhatsApp enviado para ${formattedPhone}`)
    } catch (err: any) {
      console.error(`[AuctionAlerts] Erro WhatsApp: ${err.message}`)
    }
  }
}
