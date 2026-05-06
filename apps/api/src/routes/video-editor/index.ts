/**
 * Video Editor — REST routes.
 *
 * All endpoints require auth. Renders are billed against the Nível Máximo
 * plan; a separate quota/credit ledger will be wired in a later iteration.
 *
 * Endpoint map:
 *   GET    /api/v1/video-editor/catalog           → presets + transitions + resolutions
 *   POST   /api/v1/video-editor/projects          → create draft job (returns jobId + presigned PUT URLs)
 *   POST   /api/v1/video-editor/projects/:id/render → enqueue render with chosen config
 *   GET    /api/v1/video-editor/projects/:id      → job status
 *   GET    /api/v1/video-editor/projects/:id/download → signed GET URL for the final render
 *   DELETE /api/v1/video-editor/projects/:id      → mark job EXPIRED + best-effort S3 cleanup
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  PRESETS, TRANSITIONS, RESOLUTIONS, SUPPORTED_OUTPUT_FORMATS,
  videoS3, buildVideoKey,
} from '../../services/video-editor/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    videoEditorQueue: import('bullmq').Queue | null
  }
}

const ClipUploadIntentSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  kind: z.enum(['input', 'audio']).default('input'),
})

const RenderConfigSchema = z.object({
  presetId:        z.string().optional(),
  transitionId:    z.string().optional(),
  resolution:      z.enum(['1080p', '2k', '4k']).default('1080p'),
  outputFormat:    z.enum(SUPPORTED_OUTPUT_FORMATS).default('mp4'),
  captionsEnabled: z.boolean().default(false),
  captionsLanguage: z.string().default('pt-BR'),
  captionsStyle:   z.record(z.unknown()).optional(),
  audioSource:     z.enum(['upload', 'extracted_from_video', 'none']).default('none'),
  audioKey:        z.string().optional(),
  inputClips:      z.array(z.object({
    key:   z.string(),
    label: z.string().optional(),
  })).min(1).max(20),
  brollEnabled:    z.boolean().default(false),
  brollPrompts:    z.array(z.object({
    promptText:  z.string().min(3).max(500),
    durationSec: z.number().int().min(3).max(10),
    atSec:       z.number().min(0),
  })).optional(),
  config:          z.record(z.unknown()).optional(),
})

export default async function videoEditorRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── Catalog (UI populates pickers) ─────────────────────────────────────
  app.get('/catalog', async (_req, reply) => {
    return reply.send({
      presets:     PRESETS,
      transitions: TRANSITIONS,
      resolutions: RESOLUTIONS,
      formats:     SUPPORTED_OUTPUT_FORMATS,
    })
  })

  // ── Create draft job + return presigned PUT URLs for direct browser upload
  app.post('/projects', async (req, reply) => {
    const body = z.object({
      uploads: z.array(ClipUploadIntentSchema).min(1).max(20),
    }).parse(req.body)

    if (!videoS3.isConfigured()) {
      return reply.status(503).send({ error: 'VIDEO_BUCKET_UNCONFIGURED' })
    }

    const user = (req as any).user as { sub: string; companyId: string }

    const job = await app.prisma.videoEditorJob.create({
      data: {
        companyId: user.companyId,
        userId:    user.sub,
        status:    'PENDING',
      },
    })

    const uploads = await Promise.all(body.uploads.map(async (u) => {
      const key = buildVideoKey({
        companyId: user.companyId,
        jobId:     job.id,
        kind:      u.kind,
        filename:  u.filename,
      })
      const url = await videoS3.presignPut(key, u.contentType, 600)
      return { key, url, filename: u.filename, kind: u.kind }
    }))

    return reply.send({ jobId: job.id, uploads })
  })

  // ── Confirm uploads & enqueue render ───────────────────────────────────
  app.post('/projects/:id/render', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body   = RenderConfigSchema.parse(req.body)
    const user   = (req as any).user as { sub: string; companyId: string }

    const job = await app.prisma.videoEditorJob.findFirst({
      where: { id, companyId: user.companyId },
    })
    if (!job)                       return reply.status(404).send({ error: 'NOT_FOUND' })
    if (job.status === 'PROCESSING') return reply.status(409).send({ error: 'ALREADY_PROCESSING' })
    if (job.status === 'DONE')       return reply.status(409).send({ error: 'ALREADY_DONE' })

    // Verify each declared key actually exists in S3 (uploads completed).
    for (const clip of body.inputClips) {
      const head = await videoS3.head(clip.key)
      if (!head) return reply.status(400).send({ error: 'INPUT_NOT_UPLOADED', key: clip.key })
    }
    if (body.audioKey) {
      const head = await videoS3.head(body.audioKey)
      if (!head) return reply.status(400).send({ error: 'AUDIO_NOT_UPLOADED', key: body.audioKey })
    }

    const updated = await app.prisma.videoEditorJob.update({
      where: { id },
      data: {
        status:           'UPLOADED',
        inputClips:       body.inputClips as any,
        audioKey:         body.audioKey ?? null,
        audioSource:      body.audioSource,
        presetId:         body.presetId ?? null,
        transitionId:     body.transitionId ?? null,
        resolution:       body.resolution,
        outputFormat:     body.outputFormat,
        captionsEnabled:  body.captionsEnabled,
        captionsLanguage: body.captionsLanguage,
        captionsStyle:    (body.captionsStyle ?? null) as any,
        brollEnabled:     body.brollEnabled,
        brollPrompts:     (body.brollPrompts ?? null) as any,
        config:           (body.config ?? {}) as any,
        errorMsg:         null,
      },
    })

    if (!app.videoEditorQueue) {
      return reply.status(503).send({ error: 'RENDER_QUEUE_UNAVAILABLE' })
    }
    await app.videoEditorQueue.add('render', {
      jobId:     updated.id,
      companyId: updated.companyId,
    }, {
      attempts: 1,                              // renders are expensive; avoid retry storms
      removeOnComplete: { count: 50 },
      removeOnFail:     { count: 100 },
    })

    return reply.send({ id: updated.id, status: updated.status })
  })

  // ── Job status ─────────────────────────────────────────────────────────
  app.get('/projects/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const user   = (req as any).user as { sub: string; companyId: string }
    const job = await app.prisma.videoEditorJob.findFirst({
      where: { id, companyId: user.companyId },
    })
    if (!job) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send({
      id:               job.id,
      status:           job.status,
      errorMsg:         job.errorMsg,
      durationSec:      job.durationSec,
      fileSizeBytes:    job.fileSizeBytes ? Number(job.fileSizeBytes) : null,
      resolution:       job.resolution,
      outputFormat:     job.outputFormat,
      creditsUsed:      job.creditsUsed,
      expiresAt:        job.expiresAt,
      createdAt:        job.createdAt,
      updatedAt:        job.updatedAt,
    })
  })

  // ── Signed download URL for the final render ───────────────────────────
  app.get('/projects/:id/download', async (req, reply) => {
    const { id } = req.params as { id: string }
    const user   = (req as any).user as { sub: string; companyId: string }
    const job = await app.prisma.videoEditorJob.findFirst({
      where: { id, companyId: user.companyId },
    })
    if (!job)                   return reply.status(404).send({ error: 'NOT_FOUND' })
    if (job.status !== 'DONE')  return reply.status(409).send({ error: 'NOT_READY', status: job.status })
    if (!job.outputKey)         return reply.status(500).send({ error: 'OUTPUT_KEY_MISSING' })
    if (job.expiresAt && job.expiresAt < new Date()) {
      return reply.status(410).send({ error: 'EXPIRED' })
    }
    const url = await videoS3.presignGet(job.outputKey)
    return reply.send({ url, expiresAt: job.expiresAt })
  })

  // ── Cancel / cleanup ───────────────────────────────────────────────────
  app.delete('/projects/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const user   = (req as any).user as { sub: string; companyId: string }
    const job = await app.prisma.videoEditorJob.findFirst({
      where: { id, companyId: user.companyId },
    })
    if (!job) return reply.status(404).send({ error: 'NOT_FOUND' })

    // Best-effort S3 cleanup — don't block on per-key failures.
    const keys: string[] = []
    if (job.outputKey)    keys.push(job.outputKey)
    if (job.thumbnailKey) keys.push(job.thumbnailKey)
    if (job.audioKey)     keys.push(job.audioKey)
    for (const clip of (job.inputClips as Array<{ key: string }> | null) ?? []) keys.push(clip.key)
    await Promise.all(keys.map(k => videoS3.delete(k).catch(() => {})))

    await app.prisma.videoEditorJob.update({
      where: { id },
      data:  { status: 'EXPIRED' },
    })
    return reply.send({ ok: true })
  })
}
