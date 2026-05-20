/**
 * Property ↔ Client Match Engine
 *
 * Quando um imóvel novo é publicado, casa-o com os perfis de busca dos
 * clientes (PropertyAlert) e avisa cada cliente compatível por e-mail,
 * além de gerar uma notificação interna para o corretor dar follow-up.
 *
 * Fail-soft: nunca lança — a criação do imóvel não pode quebrar por causa
 * do match.
 */

import type { PrismaClient } from '@prisma/client'
import { notify } from './notification.service.js'
import { sendEmail, isEmailConfigured } from './email.service.js'

export interface MatchableProperty {
  id: string
  title: string
  slug: string | null
  companyId: string
  city: string | null
  neighborhood: string | null
  type: string
  purpose: string
  price: unknown
  priceRent: unknown
  bedrooms: number
  status?: string
  authorizedPublish?: boolean
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

function matchEmailHtml(
  name: string | null,
  title: string,
  priceLabel: string,
  location: string,
  url: string,
  unsubToken: string | null,
): string {
  const greeting = name ? `Olá, ${name}!` : 'Olá!'
  const unsub = unsubToken
    ? `<p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px">
         Não quer mais receber estes alertas?
         <a href="https://www.agoraencontrei.com.br/api/v1/public/alerts/unsubscribe?token=${unsubToken}">Cancelar</a>
       </p>`
    : ''
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
  <div style="background:#1B2B5B;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
    <strong style="font-size:16px">AgoraEncontrei</strong>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 8px 8px">
    <h2 style="margin:0 0 8px;font-size:18px;color:#111">${greeting}</h2>
    <p style="margin:0 0 16px;color:#444;line-height:1.6">
      Encontramos um imóvel novo que combina com o perfil que você cadastrou:
    </p>
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px">
      <strong style="font-size:16px;color:#111">${title}</strong><br>
      <span style="color:#666">${location}</span><br>
      <span style="color:#1B2B5B;font-weight:bold;font-size:18px">${priceLabel}</span>
    </div>
    <a href="${url}" style="display:inline-block;background:#C9A84C;color:#1B2B5B;font-weight:bold;
       padding:12px 24px;border-radius:8px;text-decoration:none">Ver imóvel</a>
  </div>
  ${unsub}
</div>`
}

/**
 * Casa um imóvel recém-publicado com os alertas de clientes e dispara as
 * notificações. Retorna a quantidade de clientes notificados.
 */
export async function notifyMatchingAlerts(
  prisma: PrismaClient,
  property: MatchableProperty,
): Promise<number> {
  // Só casa imóveis realmente publicados.
  if (property.status && property.status !== 'ACTIVE') return 0
  if (property.authorizedPublish === false) return 0

  const price = property.purpose === 'RENT' ? num(property.priceRent) : num(property.price)

  // Cada cláusula é um OR "campo não informado no alerta OU bate com o imóvel".
  const and: Record<string, unknown>[] = [
    { OR: [{ companyId: property.companyId }, { companyId: null }] },
    { OR: [{ type: null }, { type: property.type }] },
    { OR: [{ purpose: null }, { purpose: property.purpose }] },
    { OR: [{ bedrooms: null }, { bedrooms: { lte: property.bedrooms } }] },
  ]
  and.push(property.city
    ? { OR: [{ city: null }, { city: { equals: property.city, mode: 'insensitive' } }] }
    : { city: null })
  and.push(property.neighborhood
    ? { OR: [{ neighborhood: null }, { neighborhood: { equals: property.neighborhood, mode: 'insensitive' } }] }
    : { neighborhood: null })
  if (price != null) {
    and.push({ OR: [{ minPrice: null }, { minPrice: { lte: price } }] })
    and.push({ OR: [{ maxPrice: null }, { maxPrice: { gte: price } }] })
  }

  const alerts = await prisma.propertyAlert
    .findMany({ where: { active: true, AND: and } as never, take: 200 })
    .catch(() => [] as Array<{ id: string; email: string; name: string | null; phone: string | null; token: string | null }>)

  if (!alerts.length) return 0

  const url = `https://www.agoraencontrei.com.br/imoveis/${property.slug ?? property.id}`
  const location = [property.neighborhood, property.city].filter(Boolean).join(', ') || 'Localização sob consulta'
  const priceLabel = price != null ? `R$ ${price.toLocaleString('pt-BR')}` : 'Valor sob consulta'

  if (isEmailConfigured()) {
    for (const alert of alerts) {
      await sendEmail({
        to: alert.email,
        subject: 'Encontramos um imóvel compatível com seu perfil',
        html: matchEmailHtml(alert.name, property.title, priceLabel, location, url, alert.token),
      }).catch(() => {})
    }
  }

  // WhatsApp para quem cadastrou telefone — canal mais direto que e-mail.
  const { env } = await import('../utils/env.js')
  if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID) {
    const { whatsappService } = await import('./whatsapp.service.js')
    for (const alert of alerts) {
      if (!alert.phone) continue
      const phone = alert.phone.replace(/\D/g, '')
      if (phone.length < 10) continue
      const dest = phone.startsWith('55') ? phone : `55${phone}`
      const first = alert.name?.split(' ')[0] ?? 'Olá'
      const msg = `${first}, achamos um imóvel que combina com o que você procura!\n\n🏠 ${property.title}\n📍 ${location}\n💰 ${priceLabel}\n\nVer: ${url}`
      await whatsappService.sendText(dest, msg).catch(() => {})
    }
  }

  // Notificação interna para o corretor acompanhar.
  await notify({
    prisma,
    companyId: property.companyId,
    type: 'lead_captured',
    title: `${alerts.length} cliente(s) com perfil compatível com um novo imóvel`,
    body: `O imóvel "${property.title}" (${location}) combina com ${alerts.length} alerta(s) de clientes — ` +
      `eles foram avisados por e-mail. Faça o follow-up.`,
    payload: { propertyId: property.id, matchCount: alerts.length },
    email: false,
  }).catch(() => {})

  await prisma.propertyAlert
    .updateMany({ where: { id: { in: alerts.map(a => a.id) } }, data: { lastMatchedAt: new Date() } })
    .catch(() => {})

  return alerts.length
}
