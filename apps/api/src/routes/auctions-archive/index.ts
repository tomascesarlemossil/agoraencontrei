import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { buildAuctionReport, type AuctionReportFilters } from '../../services/auction-report.service.js'
import { getPropertyTimeline } from '../../services/auction-identity.service.js'
import { buildHiddenOpportunities } from '../../services/auction-hidden-opportunity.service.js'
import { runDocumentAnalysis } from '../../services/auction-document-analysis.service.js'

/**
 * Endpoints públicos do arquivo histórico de leilões. Registrados no mesmo
 * prefixo /api/v1/auctions (paths estáticos vencem os paramétricos no Fastify).
 * Expõem o mesmo relatório que o Tomás usa, o histórico de snapshots, os
 * documentos arquivados e a linha do tempo do imóvel.
 */

const reportQuerySchema = z.object({
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  state: z.string().optional(),
  propertyType: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  soldOnly: z.coerce.boolean().optional(),
  minDiscount: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sinceMonths: z.coerce.number().optional(),
})

export default async function auctionsArchiveRoutes(app: FastifyInstance) {
  // Relatório estatístico agregado (o mesmo que alimenta o Tomás).
  app.get('/report', async (req, reply) => {
    const parsed = reportQuerySchema.safeParse(req.query)
    if (!parsed.success) return reply.status(400).send({ error: 'invalid_query', issues: parsed.error.issues })
    const report = await buildAuctionReport(app.prisma, parsed.data as AuctionReportFilters)
    return reply.send(report)
  })

  // Radar de oportunidades ocultas (índice + motivos) por região.
  app.get('/hidden-opportunities', async (req, reply) => {
    const q = req.query as Record<string, string>
    const result = await buildHiddenOpportunities(app.prisma, {
      city: q.city, state: q.state, propertyType: q.propertyType,
      limit: q.limit ? Number(q.limit) : undefined,
    })
    return reply.send(result)
  })

  // Histórico temporal (snapshots) de um leilão.
  app.get('/:slug/history', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const auction = await app.prisma.auction.findUnique({ where: { slug }, select: { id: true, title: true } })
    if (!auction) return reply.status(404).send({ error: 'not_found' })
    const snapshots = await app.prisma.auctionSnapshot.findMany({
      where: { auctionId: auction.id },
      orderBy: { capturedAt: 'asc' },
      select: {
        capturedAt: true, status: true, appraisalValue: true, minimumBid: true,
        currentBid: true, soldValue: true, discountPercent: true,
      },
    })
    const num = (v: unknown) => (v == null ? null : Number(v))
    return reply.send({
      slug, title: auction.title, count: snapshots.length,
      history: snapshots.map((s) => ({
        capturedAt: s.capturedAt, status: s.status,
        appraisalValue: num(s.appraisalValue), minimumBid: num(s.minimumBid),
        currentBid: num(s.currentBid), soldValue: num(s.soldValue), discountPercent: s.discountPercent,
      })),
    })
  })

  // Leitor de edital/matrícula: análise determinística dos documentos (lazy).
  app.get('/:slug/document-analysis', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const result = await runDocumentAnalysis(app.prisma, slug)
    if (!result) return reply.status(404).send({ error: 'not_found' })
    return reply.send(result)
  })

  // Documentos públicos arquivados (edital, matrícula, laudo, ata).
  app.get('/:slug/documents', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const auction = await app.prisma.auction.findUnique({ where: { slug }, select: { id: true } })
    if (!auction) return reply.status(404).send({ error: 'not_found' })
    const docs = await app.prisma.auctionDocument.findMany({
      where: { auctionId: auction.id },
      orderBy: { capturedAt: 'desc' },
      select: {
        type: true, sourceUrl: true, s3Url: true, mimeType: true,
        sizeBytes: true, status: true, capturedAt: true,
      },
    })
    return reply.send({ slug, count: docs.length, documents: docs })
  })

  // Linha do tempo do imóvel (todas as vezes que foi a leilão).
  app.get('/property/:identityId/timeline', async (req, reply) => {
    const { identityId } = req.params as { identityId: string }
    const timeline = await getPropertyTimeline(app.prisma, identityId)
    if (!timeline) return reply.status(404).send({ error: 'not_found' })
    return reply.send(timeline)
  })
}
