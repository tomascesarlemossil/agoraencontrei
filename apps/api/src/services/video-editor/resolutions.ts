/**
 * Video editor — resolution presets.
 *
 * Output dimensions are expressed as `WIDTHxHEIGHT` so they can be passed
 * directly to FFmpeg's `scale` filter. Aspect ratio of the source clip is
 * preserved with letterboxing (`force_original_aspect_ratio=decrease,pad`).
 */

export interface ResolutionDefinition {
  id:     '1080p' | '2k' | '4k'
  label:  string
  width:  number
  height: number
  // CRF (constant rate factor) — lower = better quality, higher file size
  crf:    number
}

export const RESOLUTIONS: ResolutionDefinition[] = [
  { id: '1080p', label: '1080p (Full HD)', width: 1920, height: 1080, crf: 22 },
  { id: '2k',    label: '2K (QHD)',        width: 2560, height: 1440, crf: 21 },
  { id: '4k',    label: '4K (UHD)',        width: 3840, height: 2160, crf: 20 },
]

export function getResolution(id: string): ResolutionDefinition {
  return RESOLUTIONS.find(r => r.id === id) ?? RESOLUTIONS[0]
}

export const SUPPORTED_OUTPUT_FORMATS = ['mp4', 'mov', 'webm'] as const
export type OutputFormat = typeof SUPPORTED_OUTPUT_FORMATS[number]

/** Map output format → FFmpeg muxer + video codec + audio codec. */
export function getFormatCodecs(format: OutputFormat) {
  switch (format) {
    case 'mp4': return { muxer: 'mp4',  vcodec: 'libx264', acodec: 'aac'   }
    case 'mov': return { muxer: 'mov',  vcodec: 'libx264', acodec: 'aac'   }
    case 'webm':return { muxer: 'webm', vcodec: 'libvpx-vp9', acodec: 'libopus' }
  }
}
