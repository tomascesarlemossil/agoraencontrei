/**
 * Google Indexing API Routes — Notifica Google sobre novas páginas
 *
 * POST /api/v1/seo/indexing/notify     — Notifica URL única
 * POST /api/v1/seo/indexing/batch      — Notifica múltiplas URLs
 * POST /api/v1/seo/indexing/property   — Auto-notifica ao publicar imóvel
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  notifyGoogleIndexing,
  batchNotifyGoogle,
  buildPropertyUrl,
  buildNeighborhoodUrl,
  buildAuctionUrl,
} from '../../services/google-indexing.service.js'

export default async function seoIndexingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /notify — Notifica uma URL ao Google
  app.post('/notify', {
    schema: { tags: ['seo-indexing'], summary: 'Notify Google about a URL update' },
  }, async (req, reply) => {
    const body = z.object({
      url: z.string().url(),
      type: z.enum(['URL_UPDATED', 'URL_DELETED']).default('URL_UPDATED'),
    }).parse(req.body)

    const result = await notifyGoogleIndexing(body.url, body.type)
    return reply.send({ success: result.success, data: result })
  })

  // POST /batch — Notifica múltiplas URLs
  app.post('/batch', {
    schema: { tags: ['seo-indexing'], summary: 'Batch notify Google about URL updates' },
  }, async (req, reply) => {
    const body = z.object({
      urls: z.array(z.string().url()).min(1).max(200),
      type: z.enum(['URL_UPDATED', 'URL_DELETED']).default('URL_UPDATED'),
    }).parse(req.body)

    const result = await batchNotifyGoogle(body.urls, body.type)
    return reply.send({ success: true, data: result })
  })

  // POST /property — Notifica ao publicar/atualizar imóvel
  app.post('/property', {
    schema: { tags: ['seo-indexing'], summary: 'Notify Google about property page' },
  }, async (req, reply) => {
    const body = z.object({
      propertyId: z.string(),
    }).parse(req.body)

    const property = await app.prisma.property.findFirst({
      where: { id: body.propertyId, companyId: req.user.cid },
      select: { slug: true, city: true, state: true, neighborhood: true },
    })

    if (!property?.slug) {
      return reply.status(404).send({ error: 'PROPERTY_NOT_FOUND' })
    }

    const urls = [buildPropertyUrl(property.slug)]

    // Also notify neighborhood page if available
    if (property.neighborhood && property.city && property.state) {
      urls.push(buildNeighborhoodUrl(property.state, property.city, property.neighborhood))
    }

    const result = await batchNotifyGoogle(urls)
    return reply.send({ success: true, data: result })
  })

  // POST /auction — Notifica ao publicar leilão
  app.post('/auction', {
    schema: { tags: ['seo-indexing'], summary: 'Notify Google about auction page' },
  }, async (req, reply) => {
    const body = z.object({
      auctionId: z.string(),
    }).parse(req.body)

    const auction = await app.prisma.auction.findFirst({
      where: { id: body.auctionId },
      select: { slug: true },
    })

    if (!auction?.slug) {
      return reply.status(404).send({ error: 'AUCTION_NOT_FOUND' })
    }

    const result = await notifyGoogleIndexing(buildAuctionUrl(auction.slug))
    return reply.send({ success: true, data: result })
  })
}
