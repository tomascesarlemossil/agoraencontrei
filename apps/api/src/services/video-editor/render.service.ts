/**
 * Video editor — render orchestrator.
 *
 * Pulls all inputs (clips + audio) from S3 to a temp dir, builds an FFmpeg
 * filter graph from the chosen preset/transition/resolution, applies caption
 * burn-in if enabled, and writes the final render to a temp path. The worker
 * is responsible for uploading the result back to S3.
 *
 * Does NOT touch the database directly — pure I/O on the filesystem.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { runFfmpeg, probeMedia } from './ffmpeg.service.js'
import { getPreset, type PresetDefinition }       from './presets.js'
import { getTransition, type TransitionDefinition } from './transitions.js'
import { getResolution, getFormatCodecs, type OutputFormat } from './resolutions.js'

export interface RenderInput {
  jobId:        string
  /** Local file paths after download from S3. */
  clipPaths:    string[]
  audioPath:    string | null
  /** Local path to a pre-rendered .ass subtitle file, if captions are enabled. */
  captionsPath: string | null
  /** Local path to a B-roll clip to splice in (single, may be null). */
  brollPath:    string | null
  presetId:     string | null
  transitionId: string | null
  resolution:   string
  outputFormat: OutputFormat
}

export interface RenderOutput {
  outputPath:   string
  durationSec:  number
  fileSizeBytes: number
}

export async function renderProject(input: RenderInput): Promise<RenderOutput> {
  const preset     = getPreset(input.presetId)
  const transition = getTransition(input.transitionId)
  const resolution = getResolution(input.resolution)
  const codecs     = getFormatCodecs(input.outputFormat)

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `videojob-${input.jobId}-`))
  const outPath = path.join(tmpDir, `out.${input.outputFormat}`)

  try {
    const clips = [...input.clipPaths]
    // B-roll is appended at the end for v1; later we can splice mid-timeline.
    if (input.brollPath) clips.push(input.brollPath)

    if (clips.length === 0) throw new Error('No input clips')

    const filterGraph = buildFilterGraph({
      clipCount:    clips.length,
      preset,
      transition,
      width:        resolution.width,
      height:       resolution.height,
      hasCaptions:  !!input.captionsPath,
      captionsPath: input.captionsPath,
    })

    const args: string[] = []
    for (const c of clips) args.push('-i', c)
    if (input.audioPath) args.push('-i', input.audioPath)

    args.push(
      '-filter_complex', filterGraph.graph,
      '-map', filterGraph.videoOut,
    )

    // Audio routing
    if (input.audioPath) {
      // External audio track wins, mixed at preset gain.
      args.push('-map', `${clips.length}:a`,
                '-af', `volume=${preset.audioGain}`)
    } else if (filterGraph.audioOut) {
      args.push('-map', filterGraph.audioOut)
    }

    args.push(
      '-c:v',  codecs.vcodec,
      '-crf',  String(resolution.crf),
      '-preset', 'medium',
      '-c:a',  codecs.acodec,
      '-b:a',  '192k',
      '-movflags', '+faststart',
      '-f',    codecs.muxer,
      outPath,
    )

    // Render budget: 30 minutes max per job (4K renders can be slow).
    await runFfmpeg(args, { timeoutMs: 30 * 60_000 })

    const probe = await probeMedia(outPath)
    const stat  = await fs.stat(outPath)
    return {
      outputPath:    outPath,
      durationSec:   Math.round(probe.durationSec),
      fileSizeBytes: stat.size,
    }
  } catch (err) {
    // Best-effort cleanup; the worker will also remove the parent tmp dir.
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    throw err
  }
}

interface FilterGraph {
  graph:    string
  videoOut: string  // e.g. "[vout]"
  audioOut: string | null
}

/**
 * Build the `-filter_complex` argument.
 *
 * Strategy:
 *   1) Each input clip is normalized to the target WxH with letterbox padding,
 *      then color-graded by the preset.
 *   2) If `transition.xfadeName` is set, clips are joined with `xfade` so they
 *      cross-fade. Otherwise they are concatenated with `concat`.
 *   3) Audio from the clips is concatenated only when the user didn't supply
 *      an external audio track (the worker passes `audioPath=null` in that
 *      case).
 *   4) If captions are enabled, we burn-in the .ass subtitle file at the very
 *      end so the styling sits above transitions.
 */
function buildFilterGraph(opts: {
  clipCount:    number
  preset:       PresetDefinition
  transition:   TransitionDefinition
  width:        number
  height:       number
  hasCaptions:  boolean
  captionsPath: string | null
}): FilterGraph {
  const { clipCount, preset, transition, width, height, hasCaptions, captionsPath } = opts
  const parts: string[] = []

  // 1) Normalize + color-grade each clip
  const normalized: string[] = []
  for (let i = 0; i < clipCount; i++) {
    const out = `v${i}`
    parts.push(
      `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,` +
      `setsar=1,${preset.videoFilter}[${out}]`,
    )
    normalized.push(`[${out}]`)
  }

  // 2) Combine clips
  let videoOut = '[vout]'
  if (clipCount === 1) {
    parts.push(`${normalized[0]}null${videoOut}`)
  } else if (transition.xfadeName) {
    // Chain xfade across N clips. Each xfade needs the running offset.
    let prev = normalized[0]
    let runningOffset = 0
    for (let i = 1; i < clipCount; i++) {
      const isLast = i === clipCount - 1
      const out    = isLast ? 'vchain' : `vch${i}`
      // Without per-clip durations we approximate offset = i * 5s. The render
      // service can tighten this once probe data is wired through.
      runningOffset += 5 - transition.durationSec
      parts.push(
        `${prev}${normalized[i]}xfade=transition=${transition.xfadeName}:` +
        `duration=${transition.durationSec}:offset=${runningOffset.toFixed(2)}[${out}]`,
      )
      prev = `[${out}]`
    }
    parts.push(`${prev}null${videoOut}`)
  } else {
    parts.push(`${normalized.join('')}concat=n=${clipCount}:v=1:a=0${videoOut}`)
  }

  // 3) Caption burn-in
  if (hasCaptions && captionsPath) {
    // Escape ":" and "'" — required for FFmpeg's ass filter argument parser.
    const escaped = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")
    parts.push(`${videoOut}ass='${escaped}'[vfinal]`)
    videoOut = '[vfinal]'
  }

  return {
    graph:    parts.join(';'),
    videoOut,
    // Audio output from clips is intentionally not built in v1 — the worker
    // either supplies an external audio track or the output has no sound.
    // (Concatenating raw audio across xfades is a separate filter graph.)
    audioOut: null,
  }
}
