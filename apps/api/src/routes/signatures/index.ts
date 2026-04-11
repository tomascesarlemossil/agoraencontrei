/**
 * Digital Signature Routes — Clicksign Integration
 *
 * POST /api/v1/signatures/envelope     — Create signature envelope
 * GET  /api/v1/signatures              — List signatures
 * GET  /api/v1/signatures/:id/status   — Check signature status
 * POST /api/v1/signatures/webhook      — Clicksign webhook handler
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createEnvelope,
  getDocumentStatus,
  handleClicksignWebhook,
  listSignatures,
} from '../../services/clicksign.service.js'

export default async function signatureRoutes(app: FastifyInstance) {
  // POST /webhook — Clicksign webhook (no auth required)
  app.post('/webhook', {
    schema: { tags: ['signatures'], summary: 'Clicksign webhook handler' },
  }, async (req, reply) => {
    await handleClicksignWebhook(app.prisma as any, req.body)
    return reply.send({ ok: true })
  })

  // All other routes require auth
  app.register(async (authApp) => {
    authApp.addHook('preHandler', app.authenticate)

    // POST /envelope — Create a new signature envelope
    authApp.post('/envelope', {
      schema: { tags: ['signatures'], summary: 'Create signature envelope' },
    }, async (req, reply) => {
      const body = z.object({
        contractId: z.string().optional(),
        fileName: z.string().min(1),
        contentBase64: z.string().min(1),
        message: z.string().optional(),
        deadlineDays: z.number().int().min(1).max(90).optional(),
        signers: z.array(z.object({
          email: z.string().email(),
          name: z.string().min(2),
          cpf: z.string().optional(),
          phone: z.string().optional(),
          role: z.enum(['TENANT', 'LANDLORD', 'BROKER', 'WITNESS', 'GUARANTOR']),
          authType: z.enum(['email', 'sms', 'whatsapp']).optional(),
        })).min(1),
      }).parse(req.body)

      const result = await createEnvelope(app.prisma as any, {
        companyId: req.user.cid,
        contractId: body.contractId,
        fileName: body.fileName,
        contentBase64: body.contentBase64,
        signers: body.signers,
        message: body.message,
        deadlineDays: body.deadlineDays,
      })

      if (!result.success) {
        return reply.status(500).send({ error: 'ENVELOPE_CREATION_FAILED', message: result.error })
      }

      return reply.status(201).send({ success: true, data: result })
    })

    // GET / — List signatures for the company
    authApp.get('/', {
      schema: { tags: ['signatures'], summary: 'List digital signatures' },
    }, async (req, reply) => {
      const q = req.query as any
      const signatures = await listSignatures(app.prisma as any, req.user.cid, {
        status: q.status,
        contractId: q.contractId,
      })
      return reply.send({ success: true, data: signatures })
    })

    // GET /:id/status — Check signature status from Clicksign
    authApp.get('/:id/status', {
      schema: { tags: ['signatures'], summary: 'Check signature status' },
    }, async (req, reply) => {
      const { id } = req.params as { id: string }

      // Get local record first
      const local = await (app.prisma as any).digitalSignature.findUnique({
        where: { id },
      }).catch(() => null)

      if (!local || local.companyId !== req.user.cid) {
        return reply.status(404).send({ error: 'SIGNATURE_NOT_FOUND' })
      }

      // Fetch live status from Clicksign
      let liveStatus = null
      if (local.externalId) {
        liveStatus = await getDocumentStatus(local.externalId)
      }

      return reply.send({
        success: true,
        data: {
          local,
          liveStatus,
        },
      })
    })
  })
}
