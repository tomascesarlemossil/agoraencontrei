/**
 * Video editor — auto-captions.
 *
 * Primary provider: AssemblyAI (best PT-BR + word-level timestamps for
 * "TikTok-style" word-pop captions). Falls back to Whisper (OpenAI) when
 * ASSEMBLYAI_API_KEY is missing but OPENAI_API_KEY is set, and to a stub
 * otherwise (which lets the rest of the pipeline succeed without errors).
 */
import { env } from '../../utils/env.js'

export interface CaptionWord {
  text:  string
  start: number  // seconds
  end:   number  // seconds
}

export interface CaptionResult {
  language: string
  words:    CaptionWord[]
  text:     string
  provider: 'assemblyai' | 'whisper' | 'stub'
}

// ── AssemblyAI ────────────────────────────────────────────────────────────

async function transcribeAssemblyAI(audioUrl: string, language: string): Promise<CaptionResult> {
  const key = env.ASSEMBLYAI_API_KEY!
  // 1) Submit transcription job. Universal-2 is multilingual and gives
  // word-level timestamps; the explicit `language_code` keeps PT-BR output
  // stable rather than relying on auto-detect.
  const submitRes = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: { authorization: key, 'content-type': 'application/json' },
    body: JSON.stringify({
      audio_url:        audioUrl,
      language_code:    language || 'pt',
      speech_models:    ['universal-2'],
      punctuate:        true,
      format_text:      true,
    }),
  })
  if (!submitRes.ok) {
    const detail = await submitRes.text().catch(() => '')
    throw new Error(`AssemblyAI submit failed: ${submitRes.status} ${detail.slice(0, 300)}`)
  }
  const submit = await submitRes.json() as { id: string }

  // 2) Poll until complete (up to 5 minutes)
  const deadline = Date.now() + 5 * 60_000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${submit.id}`, {
      headers: { authorization: key },
    })
    if (!pollRes.ok) throw new Error(`AssemblyAI poll failed: ${pollRes.status}`)
    const poll = await pollRes.json() as {
      status: 'queued' | 'processing' | 'completed' | 'error'
      text?:  string
      words?: Array<{ text: string; start: number; end: number }>
      error?: string
      language_code?: string
    }
    if (poll.status === 'completed') {
      return {
        language: poll.language_code ?? language,
        text:     poll.text ?? '',
        words:    (poll.words ?? []).map(w => ({
          text:  w.text,
          start: w.start / 1000,
          end:   w.end / 1000,
        })),
        provider: 'assemblyai',
      }
    }
    if (poll.status === 'error') {
      throw new Error(`AssemblyAI transcription error: ${poll.error}`)
    }
  }
  throw new Error('AssemblyAI transcription timed out')
}

// ── Whisper fallback ──────────────────────────────────────────────────────

async function transcribeWhisper(audioUrl: string, _language: string): Promise<CaptionResult> {
  const key = env.OPENAI_API_KEY!
  // Whisper API needs a file upload, not a URL — so we fetch then forward.
  const fileRes = await fetch(audioUrl)
  if (!fileRes.ok) throw new Error(`Audio fetch failed: ${fileRes.status}`)
  const buf  = Buffer.from(await fileRes.arrayBuffer())
  const blob = new Blob([buf])

  const form = new FormData()
  form.append('file', blob, 'audio.mp3')
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'word')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    body: form,
  })
  if (!res.ok) throw new Error(`Whisper failed: ${res.status}`)
  const data = await res.json() as {
    text: string
    language: string
    words?: Array<{ word: string; start: number; end: number }>
  }
  return {
    language: data.language,
    text:     data.text,
    words:    (data.words ?? []).map(w => ({ text: w.word, start: w.start, end: w.end })),
    provider: 'whisper',
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export async function transcribe(audioUrl: string, language = 'pt-BR'): Promise<CaptionResult> {
  if (env.ASSEMBLYAI_API_KEY) return transcribeAssemblyAI(audioUrl, language)
  if (env.OPENAI_API_KEY)     return transcribeWhisper(audioUrl, language)
  // Stub — keeps the pipeline working end-to-end without any provider.
  return {
    language,
    text:     '',
    words:    [],
    provider: 'stub',
  }
}

/**
 * Render captions to an .ass subtitle file string.
 *
 * .ass (Advanced SubStation Alpha) is FFmpeg's preferred subtitle format
 * because it supports per-word styling — which is what gives that
 * "TikTok-style" pop effect on the active word.
 */
export function renderCaptionsToAss(
  result: CaptionResult,
  style: {
    fontFamily:  string
    fontSizePct: number
    color:       string
    highlight:   string
    position:    'bottom' | 'middle' | 'top'
    bold:        boolean
  },
  frameHeight: number,
): string {
  const fontSize  = Math.round((style.fontSizePct / 100) * frameHeight)
  const primary   = hexToAssColor(style.color)
  const highlight = hexToAssColor(style.highlight)
  const alignment = style.position === 'top' ? 8 : style.position === 'middle' ? 5 : 2
  const bold      = style.bold ? -1 : 0

  // Group words into ~3-word chunks so the screen doesn't overflow.
  const chunks: CaptionWord[][] = []
  for (let i = 0; i < result.words.length; i += 3) chunks.push(result.words.slice(i, i + 3))

  const events = chunks.map(chunk => {
    const start = secondsToAssTime(chunk[0].start)
    const end   = secondsToAssTime(chunk[chunk.length - 1].end)
    const line  = chunk
      .map(w => `{\\c${highlight}}${w.text}{\\c${primary}}`)
      .join(' ')
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${line}`
  })

  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1920',
    `PlayResY: ${frameHeight}`,
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV',
    `Style: Default,${style.fontFamily},${fontSize},${primary},&H00000000,&H80000000,${bold},1,2,1,${alignment},20,20,40`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...events,
  ].join('\n')
}

function hexToAssColor(hex: string): string {
  const clean = hex.replace('#', '')
  const r = clean.slice(0, 2)
  const g = clean.slice(2, 4)
  const b = clean.slice(4, 6)
  return `&H00${b}${g}${r}`.toUpperCase()
}

function secondsToAssTime(sec: number): string {
  const h  = Math.floor(sec / 3600)
  const m  = Math.floor((sec % 3600) / 60)
  const s  = Math.floor(sec % 60)
  const cs = Math.floor((sec % 1) * 100)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}
