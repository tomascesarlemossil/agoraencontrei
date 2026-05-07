/**
 * Video editor — render orchestrator.
 *
 * Pulls all inputs (clips + audio) from the local FS, builds an FFmpeg
 * filter graph from the chosen preset/transition/resolution, applies caption
 * burn-in if enabled, splices any B-roll clips at the requested timeline
 * positions, and writes the final render to a temp path. The worker is
 * responsible for downloads + uploads — this module is pure I/O on disk.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { runFfmpeg, probeMedia, captureThumbnail } from './ffmpeg.service.js'
import { getPreset, type PresetDefinition }       from './presets.js'
import { getTransition, type TransitionDefinition } from './transitions.js'
import { getResolution, getFormatCodecs, type OutputFormat } from './resolutions.js'

export interface BRollInsertion {
  /** Local path to the downloaded B-roll clip. */
  path:        string
  /** Position in the **assembled** timeline (in seconds) where this B-roll
   *  should be inserted between user clips. */
  atSec:       number
  durationSec: number
}

export interface LogoOverlay {
  /** Local path to the logo file (PNG with transparency works best). */
  path:        string
  position:    'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  sizePercent: number
  opacity:     number
}

export interface RenderInput {
  jobId:        string
  /** Local file paths after download from S3. */
  clipPaths:    string[]
  audioPath:    string | null
  /** Local path to a pre-rendered .ass subtitle file, if captions are enabled. */
  captionsPath: string | null
  /** B-roll clips to splice into the timeline at specific positions. */
  brollClips:   BRollInsertion[]
  /** Optional logo burned into every frame. */
  logo:         LogoOverlay | null
  presetId:     string | null
  transitionId: string | null
  resolution:   string
  outputFormat: OutputFormat
  /**
   * When true, the render is downscaled to 480p and uses a fast preset.
   * Used by the "preview" workflow so partners can sanity-check before
   * burning compute on a full 4K render.
   */
  previewMode?: boolean
}

export interface RenderOutput {
  outputPath:    string
  thumbnailPath: string
  durationSec:   number
  fileSizeBytes: number
}

export async function renderProject(input: RenderInput): Promise<RenderOutput> {
  const preset     = getPreset(input.presetId)
  const transition = getTransition(input.transitionId)
  // Preview mode forces a small frame so the render finishes in seconds.
  const resolution = input.previewMode
    ? { id: 'preview' as const, label: 'Preview 480p', width: 854, height: 480, crf: 28 }
    : getResolution(input.resolution)
  const codecs     = getFormatCodecs(input.outputFormat)

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `videojob-${input.jobId}-`))
  const outPath       = path.join(tmpDir, `out.${input.outputFormat}`)
  const thumbnailPath = path.join(tmpDir, 'thumbnail.jpg')

  try {
    if (input.clipPaths.length === 0) throw new Error('No input clips')

    // Probe every clip to get real durations — needed for accurate xfade
    // offsets and for figuring out where B-roll lands in the timeline.
    const userClipsWithDur = await Promise.all(
      input.clipPaths.map(async (p) => ({ path: p, durationSec: (await probeMedia(p)).durationSec })),
    )

    // Splice B-roll clips into the user clip order based on each one's atSec.
    const orderedClips = spliceBRoll(userClipsWithDur, input.brollClips, preset.maxClipSec)

    if (orderedClips.length === 0) throw new Error('Empty timeline after splicing')

    const filterGraph = buildFilterGraph({
      clips:        orderedClips,
      preset,
      transition,
      width:        resolution.width,
      height:       resolution.height,
      hasCaptions:  !!input.captionsPath,
      captionsPath: input.captionsPath,
      logo:         input.logo,
      logoInputIdx: input.audioPath ? orderedClips.length + 1 : orderedClips.length,
    })

    const args: string[] = []
    for (const c of orderedClips) args.push('-i', c.path)
    if (input.audioPath) args.push('-i', input.audioPath)
    if (input.logo)      args.push('-i', input.logo.path)

    args.push(
      '-filter_complex', filterGraph.graph,
      '-map', filterGraph.videoOut,
    )

    if (input.audioPath) {
      // External audio track wins, mixed at preset gain.
      args.push('-map', `${orderedClips.length}:a`,
                '-af', `volume=${preset.audioGain}`,
                '-shortest')
    }

    args.push(
      '-c:v',  codecs.vcodec,
      '-crf',  String(resolution.crf),
      '-preset', input.previewMode ? 'ultrafast' : 'medium',
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

    // Capture thumbnail at 1s (or earlier if the render is shorter).
    const thumbAt = Math.min(1, Math.max(0, probe.durationSec - 0.1))
    await captureThumbnail(outPath, thumbnailPath, thumbAt).catch(() => {/* non-fatal */})

    return {
      outputPath:    outPath,
      thumbnailPath,
      durationSec:   Math.round(probe.durationSec),
      fileSizeBytes: stat.size,
    }
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    throw err
  }
}

interface PreparedClip { path: string; durationSec: number }

/**
 * Combine user clips with B-roll insertions into a single ordered timeline.
 *
 * Rules:
 *   - Each B-roll clip declares an `atSec` position. We walk through the
 *     user clips, accumulating duration, and insert the B-roll as a separate
 *     timeline entry whenever the running offset crosses the B-roll's atSec.
 *   - If `maxClipSec` is set on the preset, user clips are trimmed at the
 *     filter-graph level (not here) — but we still respect their full
 *     duration when placing B-roll, so the partner's mental model matches.
 *   - B-roll always plays in full (no trim).
 */
function spliceBRoll(
  userClips: PreparedClip[],
  broll:     BRollInsertion[],
  _maxClipSec: number | null,
): PreparedClip[] {
  if (broll.length === 0) return userClips

  // Sort by ascending atSec so we insert in order without re-sorting.
  const sorted = [...broll].sort((a, b) => a.atSec - b.atSec)
  const result: PreparedClip[] = []
  let elapsed = 0
  let pending = 0

  for (const clip of userClips) {
    // Insert any B-roll whose atSec falls before/at the start of this clip.
    while (pending < sorted.length && sorted[pending].atSec <= elapsed) {
      result.push({ path: sorted[pending].path, durationSec: sorted[pending].durationSec })
      pending++
    }
    result.push(clip)
    elapsed += clip.durationSec
  }
  // Append any remaining B-roll at the very end of the timeline.
  while (pending < sorted.length) {
    result.push({ path: sorted[pending].path, durationSec: sorted[pending].durationSec })
    pending++
  }
  return result
}

interface FilterGraph {
  graph:    string
  videoOut: string
}

/**
 * Build the `-filter_complex` argument.
 *
 * Strategy:
 *   1) Each clip is normalized to the target WxH with letterbox padding,
 *      then color-graded by the preset.
 *   2) If `transition.xfadeName` is set, clips are joined with `xfade` so
 *      they cross-fade. The offset is computed from real probed durations.
 *   3) If captions are enabled, we burn-in the .ass subtitle file at the
 *      very end so the styling sits above transitions.
 *
 * Audio of the source clips is intentionally not muxed in v1 — the worker
 * either supplies an external audio track or the output has no sound.
 */
function buildFilterGraph(opts: {
  clips:        PreparedClip[]
  preset:       PresetDefinition
  transition:   TransitionDefinition
  width:        number
  height:       number
  hasCaptions:  boolean
  captionsPath: string | null
  logo:         LogoOverlay | null
  /** Index of the logo input in the FFmpeg `-i` list (after clips & audio). */
  logoInputIdx: number
}): FilterGraph {
  const { clips, preset, transition, width, height, hasCaptions, captionsPath, logo, logoInputIdx } = opts
  const parts: string[] = []

  // 1) Normalize + color-grade each clip
  const normalized: string[] = []
  for (let i = 0; i < clips.length; i++) {
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
  if (clips.length === 1) {
    parts.push(`${normalized[0]}null${videoOut}`)
  } else if (transition.xfadeName) {
    // Chain xfade across N clips. Each xfade needs the running offset =
    // sum of previous clip durations - sum of previous xfade durations.
    let prev = normalized[0]
    let runningOffset = clips[0].durationSec - transition.durationSec
    for (let i = 1; i < clips.length; i++) {
      const isLast = i === clips.length - 1
      const out    = isLast ? 'vchain' : `vch${i}`
      parts.push(
        `${prev}${normalized[i]}xfade=transition=${transition.xfadeName}:` +
        `duration=${transition.durationSec}:offset=${runningOffset.toFixed(3)}[${out}]`,
      )
      prev = `[${out}]`
      runningOffset += clips[i].durationSec - transition.durationSec
    }
    parts.push(`${prev}null${videoOut}`)
  } else {
    parts.push(`${normalized.join('')}concat=n=${clips.length}:v=1:a=0${videoOut}`)
  }

  // 3) Caption burn-in
  if (hasCaptions && captionsPath) {
    const escaped = captionsPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'")
    parts.push(`${videoOut}ass='${escaped}'[vcaps]`)
    videoOut = '[vcaps]'
  }

  // 4) Logo overlay — scaled to a percent of frame width, anchored at the
  //    requested corner with a margin equal to ~2% of the smaller axis so
  //    it never touches the edge of the frame.
  if (logo) {
    const targetWidth = Math.round((logo.sizePercent / 100) * width)
    const margin      = Math.max(12, Math.round(0.02 * Math.min(width, height)))
    const xy = {
      'bottom-right': `x=W-w-${margin}:y=H-h-${margin}`,
      'bottom-left':  `x=${margin}:y=H-h-${margin}`,
      'top-right':    `x=W-w-${margin}:y=${margin}`,
      'top-left':     `x=${margin}:y=${margin}`,
    }[logo.position]
    parts.push(
      `[${logoInputIdx}:v]scale=${targetWidth}:-1,format=rgba,colorchannelmixer=aa=${logo.opacity.toFixed(2)}[lg]`,
    )
    parts.push(`${videoOut}[lg]overlay=${xy}[vfinal]`)
    videoOut = '[vfinal]'
  }

  return { graph: parts.join(';'), videoOut }
}
