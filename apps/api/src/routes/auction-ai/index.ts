/**
 * Auction Intelligence Routes — AI-powered analysis & ROI calculator
 *
 * POST /api/v1/auction-ai/analyze        — Analyze auction edital with AI
 * POST /api/v1/auction-ai/roi            — Calculate ROI (no AI needed)
 * GET  /api/v1/auction-ai/:auctionId     — Get existing analysis
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  analyzeEdital,
  calculateROI,
  getAuctionAnalysis,
} from '../../services/auction-ai.service.js'

export default async function auctionAIRoutes(app: FastifyInstance) {
  // POST /roi — Public ROI calculator (no auth required)
  app.post('/roi', {
    schema: { tags: ['auction-ai'], summary: 'Calculate auction ROI' },
  }, async (req, reply) => {
    const body = z.object({
      purchaseValue: z.number().positive(),
      appraisalValue: z.number().positive().optional(),
      estimatedMarketValue: z.number().positive().optional(),
      iptuDebt: z.number().min(0).optional(),
      condoDebt: z.number().min(0).optional(),
      otherDebts: z.number().min(0).optional(),
      reformCost: z.number().min(0).optional(),
      itbiPercent: z.number().min(0).max(10).optional(),
      cartorioCost: z.number().min(0).optional(),
      brokerCommission: z.number().min(0).optional(),
      monthlyRent: z.number().min(0).optional(),
      propertyType: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
    }).parse(req.body)

    const result = calculateROI(body)
    return reply.send({ success: true, data: result })
  })

  // Authenticated routes
  app.register(async (authApp) => {
    authApp.addHook('preHandler', app.authenticate)

    // POST /analyze — Analyze auction with AI
    authApp.post('/analyze', {
      schema: { tags: ['auction-ai'], summary: 'Analyze auction edital with AI' },
    }, async (req, reply) => {
      const body = z.object({
        auctionId: z.string(),
        editalUrl: z.string().url().optional(),
        editalText: z.string().optional(),
        minimumBid: z.number().positive().optional(),
        appraisalValue: z.number().positive().optional(),
        propertyType: z.string().optional(),
        totalArea: z.number().positive().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
      }).parse(req.body)

      // Verify auction exists
      const auction = await app.prisma.auction.findFirst({
        where: { id: body.auctionId },
        select: {
          id: true, minimumBid: true, appraisalValue: true,
          propertyType: true, totalArea: true, city: true, state: true,
          editalUrl: true,
        },
      })

      if (!auction) {
        return reply.status(404).send({ error: 'AUCTION_NOT_FOUND' })
      }

      const result = await analyzeEdital(app.prisma as any, {
        auctionId: body.auctionId,
        editalUrl: body.editalUrl || auction.editalUrl || undefined,
        editalText: body.editalText,
        minimumBid: body.minimumBid || Number(auction.minimumBid) || 0,
        appraisalValue: body.appraisalValue || Number(auction.appraisalValue) || 0,
        propertyType: body.propertyType || auction.propertyType,
        totalArea: body.totalArea || auction.totalArea || undefined,
        city: body.city || auction.city || undefined,
        state: body.state || auction.state || undefined,
      })

      return reply.send({ success: true, data: result })
    })

    // GET /:auctionId — Get existing analysis
    authApp.get('/:auctionId', {
      schema: { tags: ['auction-ai'], summary: 'Get existing auction AI analysis' },
    }, async (req, reply) => {
      const { auctionId } = req.params as { auctionId: string }

      const analysis = await getAuctionAnalysis(app.prisma as any, auctionId)

      if (!analysis) {
        return reply.status(404).send({ error: 'ANALYSIS_NOT_FOUND' })
      }

      return reply.send({ success: true, data: analysis })
    })
  })
}
