/**
 * Street View Routes — Google Street View facade capture
 *
 * POST /api/v1/streetview/check        — Check availability for a location
 * POST /api/v1/streetview/generate     — Generate URL for a property/auction
 * POST /api/v1/streetview/batch        — Batch generate for properties without facade
 * GET  /api/v1/streetview/status       — API key status and quota info
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  checkStreetViewAvailability,
  buildStreetViewUrl,
  buildStreetViewUrlFromCoords,
  getStreetViewForProperty,
  batchGenerateStreetView,
} from '../../services/streetview.service.js'
import { env } from '../../utils/env.js'

export default async function streetviewRoutes(app: FastifyInstance) {
  // GET /status — Check if Street View API is configured (public)
  app.get('/status', {
    schema: { tags: ['streetview'], summary: 'Street View API status' },
  }, async (_req, reply) => {
    const configured = !!(env as any).GOOGLE_MAPS_API_KEY
    return reply.send({
      success: true,
      data: {
        configured,
        message: configured
          ? 'Google Street View API ativa.'
          : 'GOOGLE_MAPS_API_KEY não configurada. Adicione no Railway → Variables.',
        docs: 'https://developers.google.com/maps/documentation/streetview',
      },
    })
  })

  // Authenticated routes
  app.register(async (authApp) => {
    authApp.addHook('preHandler', app.authenticate)

    // POST /check — Check Street View availability for a location
    authApp.post('/check', {
      schema: { tags: ['streetview'], summary: 'Check Street View availability' },
    }, async (req, reply) => {
      const body = z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        address: z.string().optional(),
      }).refine(
        d => (d.latitude && d.longitude) || d.address,
        { message: 'Provide latitude/longitude or address' },
      ).parse(req.body)

      let location: string
      if (body.latitude && body.longitude) {
        location = `${body.latitude},${body.longitude}`
      } else {
        location = body.address!
      }

      const result = await checkStreetViewAvailability(location)
      return reply.send({ success: true, data: result })
    })

    // POST /generate — Generate Street View URL for a property or auction
    authApp.post('/generate', {
      schema: { tags: ['streetview'], summary: 'Generate Street View image for property/auction' },
    }, async (req, reply) => {
      const body = z.object({
        propertyId: z.string().optional(),
        auctionId: z.string().optional(),
        width: z.number().int().min(100).max(640).optional(),
        height: z.number().int().min(100).max(640).optional(),
        heading: z.number().min(0).max(360).optional(),
        pitch: z.number().min(-90).max(90).optional(),
        fov: z.number().min(10).max(120).optional(),
      }).refine(
        d => d.propertyId || d.auctionId,
        { message: 'Provide propertyId or auctionId' },
      ).parse(req.body)

      const svOptions = {
        width: body.width,
        height: body.height,
        heading: body.heading,
        pitch: body.pitch,
        fov: body.fov,
      }

      if (body.propertyId) {
        const property = await app.prisma.property.findFirst({
          where: { id: body.propertyId, companyId: req.user.cid },
          select: {
            id: true, latitude: true, longitude: true,
            street: true, number: true, city: true, state: true,
          },
        })

        if (!property) {
          return reply.status(404).send({ error: 'PROPERTY_NOT_FOUND' })
        }

        const result = await getStreetViewForProperty(property, svOptions)

        // Save to property if available
        if (result.available && result.imageUrl) {
          await app.prisma.property.update({
            where: { id: body.propertyId },
            data: { streetViewUrl: result.imageUrl },
          }).catch(() => {})
        }

        return reply.send({ success: true, data: result })
      }

      if (body.auctionId) {
        const auction = await app.prisma.auction.findFirst({
          where: { id: body.auctionId },
          select: {
            id: true, latitude: true, longitude: true,
            street: true, number: true, city: true, state: true,
          },
        })

        if (!auction) {
          return reply.status(404).send({ error: 'AUCTION_NOT_FOUND' })
        }

        const result = await getStreetViewForProperty(auction, svOptions)

        if (result.available && result.imageUrl) {
          await app.prisma.auction.update({
            where: { id: body.auctionId },
            data: { streetViewUrl: result.imageUrl } as any,
          }).catch(() => {})
        }

        return reply.send({ success: true, data: result })
      }
    })

    // POST /batch — Batch generate Street View for properties/auctions without it
    authApp.post('/batch', {
      schema: { tags: ['streetview'], summary: 'Batch generate Street View images' },
    }, async (req, reply) => {
      if (req.user.role !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'FORBIDDEN' })
      }

      const body = z.object({
        type: z.enum(['property', 'auction']).default('property'),
        limit: z.number().int().min(1).max(200).default(50),
        onlyWithCoords: z.boolean().default(true),
        city: z.string().optional(),
        state: z.string().optional(),
      }).parse(req.body || {})

      const result = await batchGenerateStreetView(app.prisma, {
        type: body.type,
        limit: body.limit,
        onlyWithCoords: body.onlyWithCoords,
        city: body.city,
        state: body.state,
      })

      return reply.send({ success: true, data: result })
    })
  })
}
