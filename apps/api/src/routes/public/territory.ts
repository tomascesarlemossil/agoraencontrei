import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const PLAN_PRIORITY: Record<string, number> = {
  FREE: 10, PRIME: 50, ELITE: 80, FOUNDER: 100,
}

const ClaimSchema = z.object({
  partnerId: z.string(),
  territoryType: z.enum(['NEIGHBORHOOD', 'BUILDING', 'CITY']).default('BUILDING'),
  neighborhood: z.string().optional(),
  buildingName: z.string().optional(),
  buildingSlug: z.string().optional(),
  city: z.string().default('Franca'),
  state: z.string().default('SP'),
})

const WaitlistSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  specialty: z.string(),
  buildingName: z.string().optional(),
  buildingSlug: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().default('Franca'),
  message: z.string().optional(),
})

export async function territoryRoute(app: FastifyInstance) {

  // POST /api/v1/territory/claim — reivindicar território
  app.post('/territory/claim', async (req, reply) => {
    const result = ClaimSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ error: 'VALIDATION_ERROR', details: result.error.errors })
    const data = result.data

    // Buscar plano do parceiro
    const partners = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, plan, "isFounder" FROM partners WHERE id = $1`, data.partnerId
    )
    const partner = partners[0]
    if (!partner) return reply.status(404).send({ error: 'Parceiro não encontrado' })

    const plan = partner.isFounder ? 'FOUNDER' : (partner.plan || 'FREE')
    const priority = PLAN_PRIORITY[plan] || 10

    // Verificar se já existe claim ativo para este território
    const slug = data.buildingSlug || data.neighborhood?.toLowerCase().replace(/\s+/g, '-') || ''
    const existing = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, "partnerId", "partnerName", "priorityScore", "isExclusive"
       FROM territory_claims
       WHERE ("buildingSlug" = $1 OR neighborhood = $2) AND status = 'ACTIVE'
       ORDER BY "priorityScore" DESC`,
      slug, data.neighborhood || ''
    )

    // Se já tem parceiro exclusivo com prioridade maior, recusar
    const exclusiveHolder = existing.find(e => e.isExclusive && e.priorityScore >= priority && e.partnerId !== data.partnerId)
    if (exclusiveHolder) {
      return reply.status(409).send({
        error: 'TERRITORY_CLAIMED',
        message: `Este território já está protegido por ${exclusiveHolder.partnerName}. Entre na fila de espera.`,
        holder: { name: exclusiveHolder.partnerName, priority: exclusiveHolder.priorityScore },
        waitlistUrl: '/api/v1/territory/waitlist',
      })
    }

    // Criar ou atualizar claim
    const alreadyClaimed = existing.find(e => e.partnerId === data.partnerId)
    if (alreadyClaimed) {
      await app.prisma.$executeRawUnsafe(
        `UPDATE territory_claims SET "priorityScore" = $1, "partnerPlan" = $2, "updatedAt" = now() WHERE id = $3`,
        priority, plan, alreadyClaimed.id
      )
      return reply.send({ id: alreadyClaimed.id, message: 'Território atualizado', priority })
    }

    await app.prisma.$executeRawUnsafe(
      `INSERT INTO territory_claims (id, "partnerId", "partnerName", "partnerPlan", "territoryType", neighborhood, "buildingName", "buildingSlug", city, state, "priorityScore", "isExclusive")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      data.partnerId, partner.name, plan, data.territoryType,
      data.neighborhood || null, data.buildingName || null, slug,
      data.city, data.state, priority, plan === 'FOUNDER' || plan === 'ELITE'
    )

    // Notificar Tomás se for Founder/Elite
    if (plan === 'FOUNDER' || plan === 'ELITE') {
      const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
      if (token && phoneId) {
        fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp', to: '5516993116199', type: 'text',
            text: { body: `🛡️ TERRITÓRIO PROTEGIDO!\n\n*${partner.name}* (${plan}) reivindicou:\n📍 ${data.buildingName || data.neighborhood || data.city}\n🔒 Prioridade: ${priority}/100` },
          }),
        }).catch(() => {})
      }
    }

    return reply.status(201).send({
      message: 'Território reivindicado com sucesso!',
      priority,
      isExclusive: plan === 'FOUNDER' || plan === 'ELITE',
    })
  })

  // GET /api/v1/territory/my/:partnerId — territórios do parceiro
  app.get('/territory/my/:partnerId', async (req, reply) => {
    const { partnerId } = req.params as { partnerId: string }

    const territories = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, "territoryType", neighborhood, "buildingName", "buildingSlug", city, state,
              "priorityScore", "isExclusive", status, "claimedAt"
       FROM territory_claims
       WHERE "partnerId" = $1 AND status = 'ACTIVE'
       ORDER BY "priorityScore" DESC`,
      partnerId
    )

    const totalProtected = territories.filter(t => t.isExclusive).length
    const totalClaimed = territories.length

    return reply.send({
      territories,
      summary: {
        totalClaimed,
        totalProtected,
        maxPriority: territories.length > 0 ? Math.max(...territories.map(t => t.priorityScore)) : 0,
      },
    })
  })

  // GET /api/v1/territory/check/:slug — verificar disponibilidade
  app.get('/territory/check/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }

    const claims = await app.prisma.$queryRawUnsafe<any[]>(
      `SELECT "partnerId", "partnerName", "partnerPlan", "priorityScore", "isExclusive"
       FROM territory_claims
       WHERE ("buildingSlug" = $1 OR neighborhood = $1) AND status = 'ACTIVE'
       ORDER BY "priorityScore" DESC`,
      slug
    )

    const isExclusiveClaimed = claims.some(c => c.isExclusive)
    const topHolder = claims[0] || null

    return reply.send({
      slug,
      available: !isExclusiveClaimed,
      totalClaimants: claims.length,
      topHolder: topHolder ? { name: topHolder.partnerName, plan: topHolder.partnerPlan, priority: topHolder.priorityScore } : null,
      claims: claims.map(c => ({ name: c.partnerName, plan: c.partnerPlan, priority: c.priorityScore, exclusive: c.isExclusive })),
    })
  })

  // POST /api/v1/territory/waitlist — fila de espera
  app.post('/territory/waitlist', async (req, reply) => {
    const result = WaitlistSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ error: 'VALIDATION_ERROR' })
    const data = result.data

    const slug = data.buildingSlug || data.neighborhood?.toLowerCase().replace(/\s+/g, '-') || ''

    await app.prisma.$executeRawUnsafe(
      `INSERT INTO territory_waitlist (id, name, email, phone, specialty, neighborhood, "buildingName", "buildingSlug", city, state, message)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      data.name, data.email, data.phone, data.specialty,
      data.neighborhood || null, data.buildingName || null, slug,
      data.city, 'SP', data.message || null
    )

    // Notificar Tomás — lead quente!
    const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (token && phoneId) {
      fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp', to: '5516993116199', type: 'text',
          text: { body: `🔥 LEAD QUENTE — FILA DE ESPERA!\n\n*${data.name}* (${data.specialty})\n📍 Quer: ${data.buildingName || data.neighborhood || data.city}\n📱 ${data.phone}\n📧 ${data.email}\n\nEste profissional quer pagar para entrar no território!` },
        }),
      }).catch(() => {})
    }

    return reply.status(201).send({
      message: 'Adicionado à fila de espera! Você será notificado quando houver vaga.',
    })
  })
}
