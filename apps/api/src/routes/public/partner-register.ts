import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { notify } from '../../services/notification.service.js'

const PartnerSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  specialty: z.string().min(2),
  company: z.string().optional(),
  creci: z.string().optional(),
  bio: z.string().optional(),
  condos: z.array(z.string()).default([]),
  isFounder: z.boolean().default(false),
})

export async function partnerRegisterRoute(app: FastifyInstance) {

  // POST /api/v1/public/partner-register
  app.post('/partner-register', async (req, reply) => {
    const result = PartnerSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
    }

    const data = result.data

    // Store as a lead with partner metadata
    try {
      const lead = await app.prisma.lead.create({
        data: {
          companyId: process.env.PUBLIC_COMPANY_ID || (await app.prisma.company.findFirst({ select: { id: true } }))?.id || 'cmnhzieqf0000mx1cqcqgfv4n',
          name: data.name,
          email: data.email,
          phone: data.phone,
          source: 'PARTNER_REGISTER',
          status: 'NEW',
          notes: `Parceiro: ${data.specialty}${data.company ? ` — ${data.company}` : ''}${data.creci ? ` (${data.creci})` : ''}\nEdifícios: ${data.condos.join(', ')}\nMembro Fundador: ${data.isFounder ? 'SIM' : 'NÃO'}\nBio: ${data.bio || '—'}`,
        },
      })

      // In-app + e-mail notification (notification center + platform admins)
      await notify({
        prisma: app.prisma,
        companyId: lead.companyId,
        type: 'partner_registered',
        title: data.isFounder
          ? `💰 Novo Membro Fundador: ${data.name}`
          : `👤 Novo parceiro cadastrado: ${data.name}`,
        body: [
          `Especialidade: ${data.specialty}${data.company ? ` — ${data.company}` : ''}`,
          data.creci ? `CRECI: ${data.creci}` : '',
          `Telefone: ${data.phone}`,
          `E-mail: ${data.email}`,
          data.condos.length ? `Edifícios: ${data.condos.slice(0, 8).join(', ')}` : '',
          `Plano: ${data.isFounder ? 'Membro Fundador (R$ 497/mês)' : 'Gratuito'}`,
        ].filter(Boolean).join('\n'),
        payload: { leadId: lead.id, name: data.name, phone: data.phone, isFounder: data.isFounder },
      }).catch(() => {})

      // Notify Tomás via WhatsApp
      const whatsappToken = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN
      const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID

      if (whatsappToken && phoneId) {
        const emoji = data.isFounder ? '💰 NOVO MEMBRO FUNDADOR ADERIU!' : '👤 NOVO PARCEIRO CADASTRADO!'
        const msg = `${emoji}\n\n*${data.name}*\n📋 ${data.specialty}${data.company ? ` — ${data.company}` : ''}\n📱 ${data.phone}\n📧 ${data.email}${data.condos.length > 0 ? `\n🏢 Edifícios: ${data.condos.slice(0, 5).join(', ')}` : ''}${data.isFounder ? '\n\n🏆 Plano: Membro Fundador R$ 497/mês' : '\n\nPlano: Gratuito'}`

        // Send to Tomás
        fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '5516993116199', // Tomás
            type: 'text',
            text: { body: msg },
          }),
        }).catch(() => {}) // fire and forget
      }

      return reply.status(201).send({
        id: lead.id,
        message: data.isFounder
          ? 'Parceiro cadastrado como Membro Fundador! Tomás foi notificado.'
          : 'Parceiro cadastrado com sucesso! Seu perfil será publicado em breve.',
        isFounder: data.isFounder,
      })
    } catch (err: any) {
      app.log.error('Partner register error:', err)
      return reply.status(500).send({ error: 'INTERNAL_ERROR', message: 'Erro ao cadastrar parceiro.' })
    }
  })
}
