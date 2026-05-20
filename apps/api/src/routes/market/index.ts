/**
 * Market — Radar de Mercado e Precificador (dashboard).
 *
 * GET  /api/v1/market/stats?city=&neighborhood=&type=&purpose=
 *   Agregados de mercado a partir dos imóveis ativos do marketplace.
 *
 * POST /api/v1/market/estimate
 *   Estima o valor de um imóvel a partir de comparáveis.
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getMarketStats, estimatePrice } from '../../services/market-stats.service.js'

export default async function marketRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/stats', { schema: { tags: ['market'] } }, async (req, reply) => {
    const q = req.query as { city?: string; neighborhood?: string; type?: string; purpose?: string }
    const stats = await getMarketStats(app.prisma, {
      city: q.city, neighborhood: q.neighborhood, type: q.type,
      purpose: q.purpose === 'RENT' || q.purpose === 'SALE' ? q.purpose : undefined,
    })
    return reply.send({ data: stats })
  })

  app.post('/estimate', { schema: { tags: ['market'] } }, async (req, reply) => {
    const body = z.object({
      city:         z.string().min(2).max(120),
      neighborhood: z.string().max(120).optional(),
      type:         z.string().max(40).optional(),
      area:         z.number().positive(),
      bedrooms:     z.number().int().min(0).max(20).optional(),
      purpose:      z.enum(['SALE', 'RENT']).optional(),
    }).parse(req.body)

    const result = await estimatePrice(app.prisma, body)
    return reply.send({ data: result })
  })
}
