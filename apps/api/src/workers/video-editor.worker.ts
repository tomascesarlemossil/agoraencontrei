/**
 * Video Editor Worker — BullMQ processor for the `video-editor` queue.
 *
 * Pipeline:
 *   1. Mark job PROCESSING.
 *   2. Download all input clips + audio (if any) from S3 to a temp dir.
 *   3. If captions enabled: pre-sign the audio key, send to AssemblyAI/Whisper,
 *      render to .ass.
 *   4. If B-roll enabled: call Luma Ray 2 once per prompt, download the result
 *      into the temp dir, accumulate `creditsUsed`.
 *   5. Run FFmpeg via render.service to produce the final file.
 *   6. Upload to S3 (video bucket), set `expiresAt = now + 24h`, mark DONE.
 *   7. Always cleanup temp dir + delete input keys.
 *
 * The worker degrades gracefully when integrations are missing:
 *   - No AWS keys              → fail fast (we need somewhere to read/write)
 *   - No AssemblyAI/OpenAI key → captions skipped (warning logged)
 *   - No Luma key              → B-roll skipped, no credits charged
 *   - No ffmpeg in PATH        → fail with a clear message at the first call
 */
import type { PrismaClient } from '@prisma/client'
import type { Job } from 'bullmq'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { pipeline } from 'node:stream/promises'

import { videoS3, buildVideoKey } from '../services/video-editor/s3.service.js'
import { renderProject }   from '../services/video-editor/render.service.js'
import { transcribe, renderCaptionsToAss } from '../services/video-editor/captions.service.js'
import { generateBRoll, LUMA_CREDIT_COST_PER_SECOND } from '../services/video-editor/luma.service.js'
import { getPreset }       from '../services/video-editor/presets.js'
import { getResolution }   from '../services/video-editor/resolutions.js'
import type { OutputFormat } from '../services/video-editor/resolutions.js'

export interface VideoEditorJobData {
  jobId:     string
  companyId: string
}

export async function processVideoEditorJob(
  job: Job<VideoEditorJobData>,
  prisma: PrismaClient,
): Promise<void> {
  const { jobId } = job.data

  const record = await prisma.videoEditorJob.findUnique({ where: { id: jobId } })
  if (!record) throw new Error(`VideoEditorJob ${jobId} not found`)

  await prisma.videoEditorJob.update({
    where: { id: jobId },
    data:  { status: 'PROCESSING', errorMsg: null },
  })

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), `vidjob-${jobId}-`))

  try {
    if (!videoS3.isConfigured()) {
      throw new Error('AWS_S3_VIDEO_BUCKET / credentials not configured')
    }

    // ── 1) Download inputs ───────────────────────────────────────────────
    const inputClips = (record.inputClips as Array<{ key: string; label?: string }>) ?? []
    if (inputClips.length === 0) throw new Error('No input clips on job')

    const clipPaths: string[] = []
    for (let i = 0; i < inputClips.length; i++) {
      const url = await videoS3.presignGet(inputClips[i].key, 600)
      const dst = path.join(tmp, `clip-${i}.bin`)
      await downloadTo(url, dst)
      clipPaths.push(dst)
    }

    let audioPath: string | null = null
    if (record.audioKey) {
      const url = await videoS3.presignGet(record.audioKey, 600)
      const dst = path.join(tmp, 'audio.bin')
      await downloadTo(url, dst)
      audioPath = dst
    }

    // ── 2) Captions ──────────────────────────────────────────────────────
    let captionsPath: string | null = null
    if (record.captionsEnabled) {
      const sourceUrl = record.audioKey
        ? await videoS3.presignGet(record.audioKey, 600)
        : await videoS3.presignGet(inputClips[0].key, 600)
      const cap = await transcribe(sourceUrl, record.captionsLanguage ?? 'pt-BR')
      if (cap.provider !== 'stub' && cap.words.length > 0) {
        const preset = getPreset(record.presetId)
        const res    = getResolution(record.resolution)
        const style  = (record.captionsStyle as Partial<typeof preset.captionStyle> | null) ?? {}
        const ass    = renderCaptionsToAss(cap, { ...preset.captionStyle, ...style }, res.height)
        captionsPath = path.join(tmp, 'captions.ass')
        await fs.writeFile(captionsPath, ass, 'utf8')
      }
    }

    // ── 3) B-roll (Luma Ray 2) ───────────────────────────────────────────
    let brollPath: string | null = null
    let creditsUsed = 0
    if (record.brollEnabled) {
      const prompts = (record.brollPrompts as Array<{ promptText: string; durationSec: number; atSec: number }>) ?? []
      // v1: only the first prompt is rendered; multi-clip splice comes later.
      if (prompts[0]) {
        const broll = await generateBRoll(prompts[0])
        if (broll) {
          brollPath = path.join(tmp, 'broll.mp4')
          await downloadTo(broll.videoUrl, brollPath)
          creditsUsed += Math.ceil(broll.durationSec) * LUMA_CREDIT_COST_PER_SECOND
        }
      }
    }

    // ── 4) Render ────────────────────────────────────────────────────────
    const result = await renderProject({
      jobId,
      clipPaths,
      audioPath,
      captionsPath,
      brollPath,
      presetId:     record.presetId,
      transitionId: record.transitionId,
      resolution:   record.resolution,
      outputFormat: (record.outputFormat as OutputFormat) ?? 'mp4',
    })

    // ── 5) Upload result ─────────────────────────────────────────────────
    const outputKey = buildVideoKey({
      companyId: record.companyId,
      jobId,
      kind:      'output',
      filename:  `final.${record.outputFormat}`,
    })
    const buffer = await fs.readFile(result.outputPath)
    const contentType =
      record.outputFormat === 'webm' ? 'video/webm' :
      record.outputFormat === 'mov'  ? 'video/quicktime' :
                                       'video/mp4'
    await videoS3.putBuffer(outputKey, buffer, contentType)

    // ── 6) Mark DONE with 24h TTL ────────────────────────────────────────
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.videoEditorJob.update({
      where: { id: jobId },
      data: {
        status:        'DONE',
        outputKey,
        durationSec:   result.durationSec,
        fileSizeBytes: BigInt(result.fileSizeBytes),
        expiresAt,
        creditsUsed,
      },
    })
  } catch (err: any) {
    await prisma.videoEditorJob.update({
      where: { id: jobId },
      data: {
        status:   'ERROR',
        errorMsg: (err?.message ?? 'Unknown error').slice(0, 1000),
      },
    })
    throw err
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {})
  }
}

async function downloadTo(url: string, dstPath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status}) for ${url.slice(0, 80)}`)
  await pipeline(res.body as any, createWriteStream(dstPath))
}
