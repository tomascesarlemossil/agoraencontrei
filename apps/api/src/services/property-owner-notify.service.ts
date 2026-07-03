import type { PrismaClient } from '@prisma/client'
import { sendWhatsappText } from './whatsapp-notify.service.js'
import { sendEmail, isEmailConfigured } from './email.service.js'

// Rótulos amigáveis para os campos alterados (espelha o histórico do front).
const FIELD_LABELS: Record<string, string> = {
  title: 'Título', description: 'Descrição', price: 'Preço', priceRent: 'Aluguel',
  status: 'Situação', type: 'Tipo', purpose: 'Finalidade', bedrooms: 'Quartos',
  bathrooms: 'Banheiros', suites: 'Suítes', parkingSpaces: 'Vagas', area: 'Área',
  totalArea: 'Área total', street: 'Rua', number: 'Número', neighborhood: 'Bairro',
  city: 'Cidade', state: 'Estado', zipCode: 'CEP', condoFee: 'Condomínio',
  iptu: 'IPTU', features: 'Características', coverImage: 'Foto de capa',
  images: 'Fotos', isFeatured: 'Destaque', reference: 'Referência',
}

function labelFor(field: string): string {
  return FIELD_LABELS[field] ?? field
}

export interface OwnerNotifyResult {
  notified: number   // quantos proprietários receberam ao menos 1 canal
  channels: number   // total de mensagens enviadas (WhatsApp + e-mail)
  owners: number     // proprietários vinculados ao imóvel
}

/**
 * Avisa os proprietários de um imóvel que ele foi atualizado. Disparado apenas
 * quando o usuário marca "notificar proprietário" na edição. Best-effort: uma
 * falha de canal (WhatsApp/e-mail) nunca quebra o fluxo de atualização.
 */
export async function notifyPropertyOwnersOfUpdate(
  prisma: PrismaClient,
  params: {
    propertyId: string
    changedFields: string[]
    companyName?: string
  },
): Promise<OwnerNotifyResult> {
  const property = await prisma.property.findUnique({
    where: { id: params.propertyId },
    select: { id: true, title: true, reference: true },
  })
  if (!property) return { notified: 0, channels: 0, owners: 0 }

  const owners = await prisma.propertyOwner.findMany({
    where: { propertyId: params.propertyId },
    include: { contact: { select: { id: true, name: true, phone: true, email: true } } },
  })
  if (!owners.length) return { notified: 0, channels: 0, owners: 0 }

  const changed = params.changedFields
    .filter((f) => !['id', 'companyId', 'createdAt', 'updatedAt', 'userId', 'slug'].includes(f))
    .map(labelFor)
  const changeSummary = changed.length ? changed.join(', ') : 'informações do imóvel'
  const ref = property.reference ? ` (ref. ${property.reference})` : ''
  const brand = params.companyName?.trim() || 'AgoraEncontrei'

  let notified = 0
  let channels = 0

  for (const o of owners) {
    const c = (o as any).contact
    if (!c) continue
    const greeting = c.name ? `Olá, ${c.name}!` : 'Olá!'
    const text =
      `${greeting}\n\n` +
      `${brand}: o seu imóvel *${property.title}*${ref} foi atualizado.\n\n` +
      `Itens alterados: ${changeSummary}.\n\n` +
      `Qualquer dúvida sobre a atualização, estamos à disposição.`

    let sent = false

    if (c.phone) {
      try {
        const ok = await sendWhatsappText(c.phone, text)
        if (ok) { sent = true; channels++ }
      } catch { /* canal indisponível — segue */ }
    }

    if (c.email && isEmailConfigured()) {
      try {
        await sendEmail({
          to: c.email,
          subject: `Seu imóvel foi atualizado — ${brand}`,
          html: `
            <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f6f1;color:#1B2B5B">
              <h1 style="color:#1B2B5B;margin:0 0 8px">${greeting}</h1>
              <p style="margin:0 0 16px;color:#475569">
                O seu imóvel <strong>${property.title}</strong>${ref} foi atualizado por <strong>${brand}</strong>.
              </p>
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:16px 0">
                <p style="margin:0 0 4px;color:#1B2B5B;font-weight:600">Itens alterados</p>
                <p style="margin:0;color:#475569">${changeSummary}</p>
              </div>
              <p style="margin:16px 0 0;color:#475569">Qualquer dúvida sobre a atualização, estamos à disposição.</p>
            </div>`,
          text,
        })
        sent = true
        channels++
      } catch { /* e-mail indisponível — segue */ }
    }

    if (sent) notified++
  }

  return { notified, channels, owners: owners.length }
}
