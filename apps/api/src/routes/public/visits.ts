import type { FastifyInstance } from 'fastify'

export default async function visitRoutes(app: FastifyInstance) {
  // POST /api/v1/public/visits — schedule a visit (public, no auth)
  app.post('/', async (req, reply) => {
    const body = req.body as {
      propertyId: string
      propertySlug?: string
      propertyTitle?: string
      name: string
      phone: string
      email?: string
      preferredDate: string  // ISO date string
      preferredTime: string  // HH:mm
      notes?: string
    }

    if (!body.propertyId || !body.name || !body.phone || !body.preferredDate || !body.preferredTime) {
      return reply.status(400).send({ error: 'MISSING_FIELDS' })
    }

    // Get the property to find the company
    const property = await app.prisma.property.findFirst({
      where: { id: body.propertyId },
      select: { companyId: true, title: true, address: true, city: true },
    })
    if (!property) return reply.status(404).send({ error: 'PROPERTY_NOT_FOUND' })

    const companyId = property.companyId
    const visitDateTime = new Date(`${body.preferredDate}T${body.preferredTime}:00`)
    const title = body.propertyTitle ?? property.title ?? 'Imóvel'

    // 1. Find or create a lead (Contact)
    let contact = await app.prisma.contact.findFirst({
      where: { phone: body.phone, companyId },
    })
    if (!contact) {
      contact = await app.prisma.contact.create({
        data: {
          name: body.name,
          phone: body.phone,
          email: body.email ?? null,
          companyId,
          type: 'LEAD',
        },
      })
    }

    // 2. Create an Activity (visit) in the agent's agenda
    const activity = await app.prisma.activity.create({
      data: {
        companyId,
        contactId: contact.id,
        type: 'VISIT',
        title: `Visita: ${title}`,
        description: `Cliente: ${body.name} (${body.phone})\nImóvel: ${title}\nData: ${visitDateTime.toLocaleDateString('pt-BR')} às ${body.preferredTime}\n${body.notes ? `Obs: ${body.notes}` : ''}`,
        dueDate: visitDateTime,
        status: 'PENDING',
      },
    })

    // 3. Create a Deal (lead pipeline) if not exists
    const existingDeal = await app.prisma.deal.findFirst({
      where: { contactId: contact.id, propertyId: body.propertyId, companyId, stage: { in: ['LEAD', 'CONTACT', 'VISIT'] } },
    })
    if (!existingDeal) {
      await app.prisma.deal.create({
        data: {
          companyId,
          contactId: contact.id,
          propertyId: body.propertyId,
          title: `Visita agendada — ${title}`,
          stage: 'VISIT',
          value: null,
        },
      }).catch(() => {/* deal creation is optional */})
    }

    // 4. Send WhatsApp to company agent (if configured)
    const { env } = await import('../../utils/env.js')
    if (env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID) {
      try {
        // Find company's WhatsApp phone number (from settings or first admin user)
        const company = await app.prisma.company.findUnique({
          where: { id: companyId },
          select: { phone: true, name: true },
        })

        const dateStr = visitDateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
        const message = `🏠 *Nova Visita Agendada!*\n\n👤 *Cliente:* ${body.name}\n📱 *Telefone:* ${body.phone}${body.email ? `\n📧 *E-mail:* ${body.email}` : ''}\n\n🏡 *Imóvel:* ${title}${property.city ? ` — ${property.city}` : ''}\n\n📅 *Data:* ${dateStr}\n⏰ *Horário:* ${body.preferredTime}${body.notes ? `\n📝 *Obs:* ${body.notes}` : ''}\n\n_Via Portal Imobiliária Lemos_`

        // Use company phone as destination (the agent's WhatsApp)
        const agentPhone = company?.phone?.replace(/\D/g, '')
        if (agentPhone && agentPhone.length >= 10) {
          const destination = agentPhone.startsWith('55') ? agentPhone : `55${agentPhone}`
          await fetch(`https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: destination,
              type: 'text',
              text: { body: message },
            }),
          })
        }
      } catch (err) {
        app.log.warn({ err }, 'Failed to send WhatsApp visit notification')
      }
    }

    return reply.send({ success: true, activityId: activity.id, contactId: contact.id })
  })
}
