/**
 * Luma Ray 2 — AI B-roll generation.
 *
 * Sold as an **add-on credit** on top of the Nível Máximo plan (R$ 3.500/mo).
 * Each second of B-roll generated is billed via {@link VideoEditorJob.creditsUsed}.
 *
 * If LUMA_API_KEY is unset, the call resolves to `null` so the worker can
 * skip B-roll insertion gracefully.
 */
import { env } from '../../utils/env.js'

export interface BRollRequest {
  promptText:  string
  durationSec: number
  /** Insertion point in the final timeline (seconds). */
  atSec:       number
}

export interface BRollResult {
  /** Public URL of the generated MP4 (used by the renderer to download). */
  videoUrl:    string
  durationSec: number
  /** Provider-side ID (for audit / debugging). */
  providerId:  string
}

export async function generateBRoll(req: BRollRequest): Promise<BRollResult | null> {
  const key = env.LUMA_API_KEY
  if (!key) return null

  // Submit generation
  const submitRes = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt:     req.promptText,
      model:      'ray-2',
      // Luma's API takes target duration as an enum (5 or 10 seconds at the
      // time of writing). Round up to the nearest supported value.
      duration:   req.durationSec <= 5 ? '5s' : '10s',
      aspect_ratio: '16:9',
    }),
  })
  if (!submitRes.ok) {
    const txt = await submitRes.text()
    // Luma returns 403 "Not authenticated" when the key is valid but the
    // account has no billing/credits configured. Surface a friendlier
    // message so the partner knows what to do.
    if (submitRes.status === 401 || submitRes.status === 403) {
      throw new Error(
        `Luma rejected the API key (${submitRes.status}). Verify billing is active at ` +
        `https://lumalabs.ai/dream-machine/api and that the key has not been revoked.`,
      )
    }
    throw new Error(`Luma submit failed: ${submitRes.status} ${txt.slice(0, 200)}`)
  }
  const submit = await submitRes.json() as { id: string }

  // Poll up to 4 minutes
  const deadline = Date.now() + 4 * 60_000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4000))
    const pollRes = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${submit.id}`, {
      headers: { authorization: `Bearer ${key}` },
    })
    if (!pollRes.ok) throw new Error(`Luma poll failed: ${pollRes.status}`)
    const poll = await pollRes.json() as {
      state: 'queued' | 'dreaming' | 'completed' | 'failed'
      assets?: { video?: string }
      failure_reason?: string
    }
    if (poll.state === 'completed' && poll.assets?.video) {
      return {
        videoUrl:    poll.assets.video,
        durationSec: req.durationSec,
        providerId:  submit.id,
      }
    }
    if (poll.state === 'failed') {
      throw new Error(`Luma generation failed: ${poll.failure_reason ?? 'unknown'}`)
    }
  }
  throw new Error('Luma generation timed out')
}

/** Cost in credits per second of B-roll, used by the billing/quota layer. */
export const LUMA_CREDIT_COST_PER_SECOND = 1
