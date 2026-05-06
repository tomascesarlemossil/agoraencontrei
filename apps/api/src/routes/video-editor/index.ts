/**
 * Video Editor — REST routes.
 *
 * All endpoints require auth. Renders are billed against the Nível Máximo
 * plan via the per-company quota in `videoEditorQuota` (50/day default,
 * Luma B-roll seconds charged from `brollCredits`).
 *
 * Endpoint map:
 *   GET    /api/v1/video-editor/catalog                presets + transitions + resolutions
 *   GET    /api/v1/video-editor/quota                  current quota snapshot
 *   POST   /api/v1/video-editor/extract-audio          extract audio from a video upload
 *   POST   /api/v1/video-editor/projects               create draft + presigned PUT URLs
 *   POST   /api/v1/video-editor/projects/:id/render    enqueue render
 *   GET    /api/v1/video-editor/projects/:id           job status
 *   GET    /api/v1/video-editor/projects/:id/download  signed GET URL
 *   DELETE /api/v1/video-editor/projects/:id           cancel + S3 cleanup
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {
  PRESETS, TRANSITIONS, RESOLUTIONS, SUPPORTED_OUTPUT_FORMATS,
  videoS3, buildVideoKey,
  snapshot as quotaSnapshot, assertCanRender, consumeDaily, getQuota, QuotaError,
} from '../../services/video-editor/index.js'
import { extractAudio, probeMedia } from '../../services/video-editor/ffmpeg.service.js'

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

  /**
   * Gate every endpoint *except* `/catalog` behind a provisioned quota row.
   * The catalog stays open so an unprovisioned partner can still see what
   * they'd unlock if they upgraded.
   */
  app.addHook('preHandler', async (req, reply) => {
    if (req.url.endsWith('/catalog')) return
    const user = (req as any).user as { companyId?: string } | undefined
    if (!user?.companyId) return // route's own auth will reject
    const quota = await getQuota(app.prisma, user.companyId)
    if (!quota) {
      return reply.status(403).send({
        error:   'NOT_PROVISIONED',
        message: 'Editor de Vídeo IA não disponível neste plano. Faça upgrade para o Nível Máximo.',
      })
    }
  })

  // ── Catalog (UI populates pickers; open to all authenticated users) ────
  app.get('/catalog', async (_req, reply) => {
    return reply.send({
      presets:     PRESETS,
      transitions: TRANSITIONS,
      resolutions: RESOLUTIONS,
      formats:     SUPPORTED_OUTPUT_FORMATS,
    })
  })

  // ── Quota snapshot ─────────────────────────────────────────────────────
  app.get('/quota', async (req, reply) => {
    const user = (req as any).user as { companyId: string }
    const snap = await quotaSnapshot(app.prisma, user.companyId)
    return reply.send(snap)
  })

  // ── Extract audio from a video upload (multipart) ──────────────────────
  // Returns the S3 key the caller can pass back as `audioKey` in /render.
  // We deliberately stream-to-disk first so FFmpeg can probe + transcode
  // without holding the full file in RAM.
  app.post('/extract-audio', async (req, reply) => {
    if (!videoS3.isConfigured()) {
      return reply.status(503).send({ error: 'VIDEO_BUCKET_UNCONFIGURED' })
    }
    const user = (req as any).user as { sub: string; companyId: string }

    const file = await req.file()
    if (!file) return reply.status(400).send({ error: 'NO_FILE' })

    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), `vidaudio-${user.sub}-`))
    try {
      const inPath  = path.join(tmp, file.filename || 'input')
      const outPath = path.join(tmp, 'audio.m4a')
      const chunks: Buffer[] = []
      for await (const c of file.file) chunks.push(c)
      await fs.writeFile(inPath, Buffer.concat(chunks))

      const probe = await probeMedia(inPath).catch(() => null)
      if (!probe?.hasAudio) {
        return reply.status(400).send({ error: 'NO_AUDIO_TRACK' })
      }

      await extractAudio(inPath, outPath)
      const audio = await fs.readFile(outPath)

      const key = buildVideoKey({
        companyId: user.companyId,
        jobId:     `extracted-${Date.now()}`,
        kind:      'audio',
        filename:  'extracted.m4a',
      })
      await videoS3.putBuffer(key, audio, 'audio/mp4')
      return reply.send({ key, durationSec: Math.round(probe.durationSec) })
    } catch (e: any) {
      return reply.status(500).send({ error: 'EXTRACTION_FAILED', detail: e?.message ?? String(e) })
    } finally {
      await fs.rm(tmp, { recursive: true, force: true }).catch(() => {})
    }
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

    // Quota check — daily limit + B-roll credit balance.
    const brollSeconds = body.brollEnabled
      ? (body.brollPrompts ?? []).reduce((sum, p) => sum + p.durationSec, 0)
      : 0
    try {
      await assertCanRender(app.prisma, user.companyId, { brollSeconds })
    } catch (e) {
      if (e instanceof QuotaError) {
        return reply.status(402).send({ error: e.code, message: e.message })
      }
      throw e
    }

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

    // Charge the daily counter only after the job is successfully enqueued.
    await consumeDaily(app.prisma, user.companyId)

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
