/**
 * Central de Permutas
 *
 * POST /api/v1/public/exchange            — registra um bem oferecido em troca
 * GET  /api/v1/public/exchange/properties — imóveis que aceitam permuta
 * GET  /api/v1/public/exchange            — lista de ofertas (admin)
 *
 * Ao registrar uma oferta, cruza com imóveis marcados como allowExchange e
 * notifica as imobiliárias compatíveis.
 */

import type { FastifyInstance } from 'fastify'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { notify } from '../../services/notification.service.js'

const CreateOfferBody = z.object({
  name:             z.string().min(2).max(160),
  email:            z.string().email(),
  phone:            z.string().max(30).optional(),
  offerType:        z.enum(['vehicle', 'property', 'land', 'credit', 'machinery', 'other']),
  offerDescription: z.string().min(3).max(2000),
  offerValue:       z.number().positive().optional(),
  wantedType:       z.string().optional(),
  wantedCity:       z.string().optional(),
  wantedMaxValue:   z.number().positive().optional(),
})

const OFFER_LABELS: Record<string, string> = {
  vehicle: 'Veículo', property: 'Imóvel', land: 'Terreno',
  credit: 'Carta de crédito', machinery: 'Máquina/Equipamento', other: 'Outro',
}

export default async function exchangeRoutes(app: FastifyInstance) {
  // POST / — registrar oferta de permuta (público)
  app.post('/', {
    schema: { tags: ['exchange'], summary: 'Register an exchange offer' },
  }, async (req, reply) => {
    const body = CreateOfferBody.parse(req.body)

    const offer = await app.prisma.exchangeOffer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        offerType: body.offerType,
        offerDescription: body.offerDescription,
        offerValue: body.offerValue ?? null,
        wantedType: body.wantedType ?? null,
        wantedCity: body.wantedCity ?? null,
        wantedMaxValue: body.wantedMaxValue ?? null,
      },
    })

    // Cruza com imóveis que aceitam permuta.
    const matchWhere: Prisma.PropertyWhereInput = {
      status: 'ACTIVE',
      authorizedPublish: true,
      allowExchange: true,
      ...(body.wantedType && { type: body.wantedType.toUpperCase() as Prisma.PropertyWhereInput['type'] }),
      ...(body.wantedCity && { city: { contains: body.wantedCity, mode: 'insensitive' } }),
      ...(body.wantedMaxValue && { price: { lte: body.wantedMaxValue } }),
    }
    const matches = await app.prisma.property.findMany({
      where: matchWhere,
      select: { id: true, companyId: true },
      take: 50,
    }).catch(() => [] as { id: string; companyId: string }[])

    // Notifica cada imobiliária compatível (uma vez por empresa).
    const companies = [...new Set(matches.map(m => m.companyId))]
    for (const companyId of companies) {
      await notify({
        prisma: app.prisma,
        companyId,
        type: 'lead_captured',
        title: `Nova permuta disponível: ${OFFER_LABELS[body.offerType] ?? body.offerType}`,
        body: [
          `${body.name} oferece em permuta: ${body.offerDescription}`,
          body.offerValue ? `Valor estimado: R$ ${body.offerValue.toLocaleString('pt-BR')}` : '',
          body.wantedType || body.wantedCity ? `Procura: ${[body.wantedType, body.wantedCity].filter(Boolean).join(' em ')}` : '',
          `Contato: ${body.email}${body.phone ? ` · ${body.phone}` : ''}`,
        ].filter(Boolean).join('\n'),
        payload: { exchangeOfferId: offer.id, offerType: body.offerType },
      }).catch(() => {})
    }

    return reply.status(201).send({
      success: true,
      data: { id: offer.id, matchedProperties: matches.length },
      message: matches.length
        ? `Oferta registrada! Encontramos ${matches.length} imóvel(is) que podem aceitar sua permuta.`
        : 'Oferta registrada! Avisaremos quando surgir um imóvel compatível.',
    })
  })

  // GET /properties — imóveis que aceitam permuta (público)
  app.get('/properties', {
    schema: { tags: ['exchange'], summary: 'Properties that accept exchange' },
  }, async (req, reply) => {
    const q = req.query as { city?: string; type?: string; limit?: string }
    const take = Math.min(Number(q.limit) || 24, 60)

    const listWhere: Prisma.PropertyWhereInput = {
      status: 'ACTIVE',
      authorizedPublish: true,
      allowExchange: true,
      ...(q.city && { city: { contains: q.city, mode: 'insensitive' } }),
      ...(q.type && { type: q.type.toUpperCase() as Prisma.PropertyWhereInput['type'] }),
    }
    const properties = await app.prisma.property.findMany({
      where: listWhere,
      select: {
        id: true, title: true, slug: true, coverImage: true, price: true,
        type: true, city: true, neighborhood: true, bedrooms: true, totalArea: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
    }).catch(() => [])

    return reply.send({ data: properties })
  })

  // GET / — lista de ofertas (admin)
  app.get('/', {
    schema: { tags: ['exchange'], summary: 'List exchange offers (admin)' },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const q = req.query as { status?: string }
    const offers = await app.prisma.exchangeOffer.findMany({
      where: { ...(q.status && { status: q.status }) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => [])
    return reply.send({ data: offers })
  })
}
