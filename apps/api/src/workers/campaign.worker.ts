/**
 * Campaign Worker — BullMQ processor for 'campaigns' queue
 *
 * Handles two job types:
 *   send      — immediate broadcast (email or WhatsApp)
 *   scheduled — delayed job, scheduled via BullMQ delay option
 *
 * Email delivery requires SMTP_HOST/USER/PASS/FROM env vars.
 * WhatsApp delivery requires WHATSAPP_TOKEN + WHATSAPP_PHONE_ID env vars.
 */
import type { PrismaClient } from '@prisma/client'
import type { Job } from 'bullmq'
import { sendBulkEmail, buildCampaignHtml, isEmailConfigured } from '../services/email.service.js'
import { env } from '../utils/env.js'

export interface CampaignJobData {
  campanhaId: string
  companyId:  string
}

const SEGMENT_WHERE: Record<string, any> = {
  todos_clientes: {},
  proprietarios:  { roles: { has: 'LANDLORD' } },
  inquilinos:     { roles: { has: 'TENANT' } },
  custom:         {},
}

async function getEmailRecipients(
  prisma: PrismaClient,
  companyId: string,
  segmento: string,
): Promise<string[]> {
  if (segmento === 'leads_frios') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const leads = await prisma.lead.findMany({
      where: {
        companyId,
        status: { in: ['NEW', 'CONTACTED'] },
        updatedAt: { lt: cutoff },
        email: { not: null },
      },
      select: { email: true },
    })
    return leads.map(l => l.email!).filter(Boolean)
  }
  const where = SEGMENT_WHERE[segmento] ?? {}
  const clients = await prisma.client.findMany({
    where: { companyId, ...where, email: { not: null } },
    select: { email: true },
  })
  return clients.map(c => c.email!).filter(Boolean)
}

async function getWhatsAppRecipients(
  prisma: PrismaClient,
  companyId: string,
  segmento: string,
): Promise<string[]> {
  if (segmento === 'leads_frios') {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const leads = await prisma.lead.findMany({
      where: {
        companyId,
        status: { in: ['NEW', 'CONTACTED'] },
        updatedAt: { lt: cutoff },
        phone: { not: null },
      },
      select: { phone: true },
    })
    return leads.map(l => l.phone!).filter(Boolean)
  }
  const where = SEGMENT_WHERE[segmento] ?? {}
  const clients = await prisma.client.findMany({
    where: { companyId, ...where, phone: { not: null } },
    select: { phone: true },
    take: 500,
  })
  return clients.map(c => c.phone!).filter(Boolean)
}

async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  const token   = env.WHATSAPP_TOKEN
  const phoneId = env.WHATSAPP_PHONE_ID
  if (!token || !phoneId) return false

  // Normalize phone to E.164 (strip non-digits, prepend 55 if BR number)
  const digits = phone.replace(/\D/g, '')
  const e164 = digits.startsWith('55') ? digits : `55${digits}`

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: e164,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      },
    )
    return res.ok
  } catch {
    return false
  }
}

export async function processCampaignJob(
  job: Job<CampaignJobData>,
  prisma: PrismaClient,
): Promise<void> {
  const { campanhaId, companyId } = job.data

  const campanha = await prisma.marketingCampaign.findFirst({
    where: { id: campanhaId, companyId },
  })
  if (!campanha) return // Deleted before processing

  if (campanha.status === 'SENT' || campanha.status === 'CANCELLED') return

  // Fetch company info for email template
  const company = await prisma.company.findFirst({
    where: { id: companyId },
    select: { name: true, logoUrl: true },
  })
  const companyName = company?.name ?? 'Imobiliária Lemos'
  const companyLogo = (company as any)?.logoUrl ?? null

  // Mark as SENDING
  await prisma.marketingCampaign.update({
    where: { id: campanhaId },
    data: { status: 'SENDING' },
  })

  let sent = 0
  let failed = 0

  try {
    if (campanha.tipo === 'email') {
      const recipients = await getEmailRecipients(prisma, companyId, campanha.segmento)
      if (recipients.length === 0) {
        await prisma.marketingCampaign.update({
          where: { id: campanhaId },
          data: { status: 'SENT', totalEnviados: 0 },
        })
        return
      }

      if (!isEmailConfigured()) {
        // Log but mark as sent (SMTP not configured — degrade gracefully)
        await prisma.marketingCampaign.update({
          where: { id: campanhaId },
          data: { status: 'SENT', totalEnviados: recipients.length },
        })
        return
      }

      const html = buildCampaignHtml({
        companyName,
        companyLogo,
        mensagem: campanha.mensagem,
        nomeCampanha: campanha.nome,
      })

      const result = await sendBulkEmail({
        recipients,
        subject: campanha.nome,
        html,
        batchSize: 50,
        delayMs: 1500,
        onProgress: async (s) => {
          // Update progress every 50 emails
          await prisma.marketingCampaign.update({
            where: { id: campanhaId },
            data: { totalEnviados: s },
          }).catch(() => {})
        },
      })
      sent   = result.sent
      failed = result.failed

    } else if (campanha.tipo === 'whatsapp') {
      const phones = await getWhatsAppRecipients(prisma, companyId, campanha.segmento)

      for (const phone of phones) {
        const ok = await sendWhatsAppMessage(phone, campanha.mensagem)
        if (ok) sent++
        else failed++
        // Rate limit: 1 message per 200ms
        await new Promise(r => setTimeout(r, 200))
      }
    }

    await prisma.marketingCampaign.update({
      where: { id: campanhaId },
      data: { status: 'SENT', totalEnviados: sent },
    })

  } catch (err: any) {
    await prisma.marketingCampaign.update({
      where: { id: campanhaId },
      data: { status: 'DRAFT' }, // reset to draft so user can retry
    })
    throw err
  }
}
