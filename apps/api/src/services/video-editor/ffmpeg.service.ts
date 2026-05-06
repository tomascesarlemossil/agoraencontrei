/**
 * Thin wrapper around the system `ffmpeg`/`ffprobe` binaries.
 *
 * We deliberately don't depend on `fluent-ffmpeg`: the dependency is heavy
 * and our needs are narrow (concat, transitions via xfade, caption burn-in,
 * resolution/format encode). All complex filter graphs are built as plain
 * strings here and handed straight to spawn().
 */
import { spawn } from 'node:child_process'

export interface RunOptions {
  /** Hard timeout in ms; the process is SIGKILLed if it overruns. */
  timeoutMs?:  number
  /** Optional logger to receive stderr/stdout lines for observability. */
  onLog?:      (line: string) => void
}

export interface RunResult {
  stdout: string
  stderr: string
}

export async function runFfmpeg(args: string[], opts: RunOptions = {}): Promise<RunResult> {
  return run('ffmpeg', ['-y', '-hide_banner', ...args], opts)
}

export async function runFfprobe(args: string[], opts: RunOptions = {}): Promise<RunResult> {
  return run('ffprobe', ['-hide_banner', ...args], opts)
}

async function run(bin: string, args: string[], opts: RunOptions): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let killed = false

    const timer = opts.timeoutMs
      ? setTimeout(() => { killed = true; child.kill('SIGKILL') }, opts.timeoutMs)
      : null

    child.stdout.on('data', d => {
      const s = d.toString()
      stdout += s
      opts.onLog?.(s)
    })
    child.stderr.on('data', d => {
      const s = d.toString()
      stderr += s
      opts.onLog?.(s)
    })

    child.on('error', err => {
      if (timer) clearTimeout(timer)
      reject(err)
    })
    child.on('close', code => {
      if (timer) clearTimeout(timer)
      if (killed)        return reject(new Error(`${bin} timed out after ${opts.timeoutMs}ms`))
      if (code !== 0)    return reject(new Error(`${bin} exited ${code}: ${stderr.slice(-500)}`))
      resolve({ stdout, stderr })
    })
  })
}

/** Probe a media file and return duration (seconds) and dimensions if present. */
export async function probeMedia(path: string): Promise<{
  durationSec: number
  width?: number
  height?: number
  hasAudio: boolean
}> {
  const { stdout } = await runFfprobe([
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    path,
  ])
  const data = JSON.parse(stdout || '{}') as {
    format?:  { duration?: string }
    streams?: Array<{ codec_type: string; width?: number; height?: number }>
  }
  const video = data.streams?.find(s => s.codec_type === 'video')
  const audio = data.streams?.find(s => s.codec_type === 'audio')
  return {
    durationSec: parseFloat(data.format?.duration ?? '0') || 0,
    width:       video?.width,
    height:      video?.height,
    hasAudio:    !!audio,
  }
}

/** Extract the audio track of a video as a standalone file (m4a). */
export async function extractAudio(srcPath: string, outPath: string): Promise<void> {
  await runFfmpeg([
    '-i', srcPath,
    '-vn',
    '-c:a', 'aac',
    '-b:a', '192k',
    outPath,
  ], { timeoutMs: 5 * 60_000 })
}
