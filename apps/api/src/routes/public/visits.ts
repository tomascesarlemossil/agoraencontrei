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
      website?: string  // honeypot anti-bot
    }

    // Honeypot: campo invisível preenchido = bot. Sucesso falso, nada criado.
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return reply.send({ success: true })
    }

    if (!body.propertyId || !body.name || !body.phone || !body.preferredDate || !body.preferredTime) {
      return reply.status(400).send({ error: 'MISSING_FIELDS' })
    }

    // Get the property to find the company
    const property = await app.prisma.property.findFirst({
      where: { id: body.propertyId },
      select: { companyId: true, title: true, street: true, city: true },
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
          type: 'INDIVIDUAL',
        },
      })
    }

    // 2. Create an Activity (visit) in the agent's agenda
    const activity = await app.prisma.activity.create({
      data: {
        companyId,
        contactId: contact.id,
        type: 'visit',
        title: `Visita: ${title}`,
        description: `Cliente: ${body.name} (${body.phone})\nImóvel: ${title}\nData: ${visitDateTime.toLocaleDateString('pt-BR')} às ${body.preferredTime}\n${body.notes ? `Obs: ${body.notes}` : ''}`,
        scheduledAt: visitDateTime,
      },
    })

    // Structured visit record so the dashboard agenda can manage status,
    // confirmation and post-visit feedback (separate from the free-form Activity).
    const propertyVisit = await app.prisma.propertyVisit.create({
      data: {
        companyId,
        propertyId: body.propertyId,
        visitorName: body.name,
        visitorEmail: body.email ?? null,
        visitorPhone: body.phone,
        scheduledAt: visitDateTime,
        mode: 'in_person',
        notes: body.notes ?? null,
      },
    }).catch(() => null)

    // In-app + e-mail notification for company admins so the visit is
    // surfaced the moment it is scheduled.
    try {
      const { notify } = await import('../../services/notification.service.js')
      const dateLabel = visitDateTime.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      await notify({
        prisma: app.prisma,
        companyId,
        type: 'visit_requested',
        title: 'Nova visita agendada',
        body: `${body.name} agendou uma visita para ${title} em ${dateLabel}.\nTelefone: ${body.phone}${body.notes ? `\nObs: ${body.notes}` : ''}`,
        payload: {
          visitId: propertyVisit?.id ?? null,
          propertyId: body.propertyId,
          visitorName: body.name,
          visitorPhone: body.phone,
          scheduledAt: visitDateTime.toISOString(),
        },
      })
    } catch (err) {
      app.log.warn({ err }, 'visit notify failed')
    }

    // 3. Create a Deal (lead pipeline) if not exists
    const existingDeal = await app.prisma.deal.findFirst({
      where: {
        contactId: contact.id,
        companyId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        properties: { some: { propertyId: body.propertyId } },
      },
    })
    if (!existingDeal) {
      // Find the first active broker/user in this company to assign the deal
      const broker = await app.prisma.user.findFirst({
        where: { companyId, status: 'ACTIVE' },
        select: { id: true },
      })
      if (broker) {
        await app.prisma.deal.create({
          data: {
            companyId,
            contactId: contact.id,
            brokerId: broker.id,
            title: `Visita agendada — ${title}`,
            status: 'OPEN',
            value: null,
            properties: {
              create: { propertyId: body.propertyId },
            },
          },
        }).catch(() => {/* deal creation is optional */})
      }
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

  // GET /api/v1/public/visits/:id/feedback — fetch visit info for the public
  // feedback page (only returns the bare minimum needed to render the form).
  app.get('/:id/feedback', async (req, reply) => {
    const { id } = req.params as { id: string }
    const visit = await app.prisma.propertyVisit.findUnique({
      where: { id },
      select: {
        id: true, visitorName: true, scheduledAt: true,
        status: true, rating: true, propertyId: true,
      },
    }).catch(() => null)
    if (!visit) return reply.status(404).send({ error: 'NOT_FOUND' })

    const prop = await app.prisma.property.findUnique({
      where: { id: visit.propertyId },
      select: { title: true, slug: true, neighborhood: true, city: true },
    }).catch(() => null)

    return reply.send({
      id: visit.id,
      visitorName: visit.visitorName,
      scheduledAt: visit.scheduledAt,
      status: visit.status,
      alreadyRated: visit.rating != null,
      property: prop,
    })
  })

  // POST /api/v1/public/visits/:id/feedback — visitor submits rating + comment.
  // Only accepted when the visit is marked done and has no rating yet, so the
  // link can be safely shared (no auth) without risk of overwrite or spam.
  app.post('/:id/feedback', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as { rating?: number; feedback?: string }
    const rating = Math.max(1, Math.min(5, Number(body.rating) || 0))
    const feedback = (body.feedback ?? '').toString().slice(0, 2000)
    if (!rating) return reply.status(400).send({ error: 'INVALID_RATING' })

    const visit = await app.prisma.propertyVisit.findUnique({
      where: { id },
      select: { id: true, status: true, rating: true, companyId: true, visitorName: true },
    }).catch(() => null)
    if (!visit) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (visit.status !== 'done') return reply.status(409).send({ error: 'VISIT_NOT_COMPLETED' })
    if (visit.rating != null) return reply.status(409).send({ error: 'ALREADY_RATED' })

    await app.prisma.propertyVisit.update({
      where: { id },
      data: { rating, feedback: feedback || null },
    })

    // Notifica o corretor que o feedback chegou — sinal forte para reabrir o
    // diálogo com o cliente (proposta, novas opções, etc.).
    try {
      const { notify } = await import('../../services/notification.service.js')
      await notify({
        prisma: app.prisma,
        companyId: visit.companyId,
        type: 'system',
        title: 'Feedback de visita recebido',
        body: `${visit.visitorName} avaliou a visita ${rating}/5.${feedback ? `\n"${feedback.slice(0, 200)}"` : ''}`,
        payload: { visitId: id, rating },
      })
    } catch { /* non-fatal */ }

    return reply.send({ success: true })
  })
}
