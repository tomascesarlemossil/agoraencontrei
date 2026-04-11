/**
 * Import Routes — CSV/Excel Importer with AI Column Mapping
 *
 * POST /api/v1/import/preview     — Parse CSV and get AI-suggested mappings
 * POST /api/v1/import/execute     — Execute import with confirmed mappings
 * POST /api/v1/import/image-url   — Generate Cloudinary URL with tenant logo
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  previewImport,
  executeImport,
  buildCloudinaryUrl,
} from '../../services/import.service.js'

export default async function importRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /preview — Preview CSV and get mapping suggestions
  app.post('/preview', {
    schema: { tags: ['import'], summary: 'Preview CSV import with AI column mapping' },
  }, async (req, reply) => {
    const body = z.object({
      csvContent: z.string().min(10),
    }).parse(req.body)

    try {
      const preview = await previewImport(body.csvContent)
      return reply.send({ success: true, data: preview })
    } catch (error: any) {
      return reply.status(400).send({ error: 'INVALID_CSV', message: error.message })
    }
  })

  // POST /execute — Execute import with confirmed mappings
  app.post('/execute', {
    schema: { tags: ['import'], summary: 'Execute CSV import with column mappings' },
  }, async (req, reply) => {
    const body = z.object({
      csvContent: z.string().min(10),
      mappings: z.array(z.object({
        csvColumn: z.string(),
        targetField: z.string(),
        transform: z.string().optional(),
        confidence: z.number().optional(),
      })),
    }).parse(req.body)

    // Filter out skipped mappings
    const activeMappings = body.mappings
      .filter((m: any) => m.targetField !== 'skip')
      .map((m: any) => ({ ...m, confidence: m.confidence ?? 1 }))

    const result = await executeImport(
      app.prisma,
      body.csvContent,
      activeMappings,
      req.user.cid,
    )

    return reply.send({ success: true, data: result })
  })

  // POST /image-url — Generate Cloudinary URL with tenant logo overlay
  app.post('/image-url', {
    schema: { tags: ['import'], summary: 'Generate Cloudinary URL with logo overlay' },
  }, async (req, reply) => {
    const body = z.object({
      imageUrl: z.string().url(),
      width: z.number().int().min(100).max(4000).optional(),
      height: z.number().int().min(100).max(4000).optional(),
      logoUrl: z.string().url().optional(),
      quality: z.enum(['auto', 'best', 'good', 'eco']).optional(),
    }).parse(req.body)

    const url = buildCloudinaryUrl(body.imageUrl, {
      width: body.width,
      height: body.height,
      logoUrl: body.logoUrl,
      quality: body.quality,
    })

    return reply.send({ success: true, data: { url } })
  })
}
