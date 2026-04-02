/**
 * Visual AI Worker — BullMQ processor for visual-ai queue
 *
 * Integrations (activated when API keys are set):
 *   render:         Veras AI (VERAS_API_KEY)     — fotorrealista de imóvel
 *   staging:        mnml.ai  (MNML_API_KEY)      — virtual staging / remoção móveis
 *   enhance_batch:  Imagen AI (GOOGLE_IMAGEN_API_KEY) — edição em lote
 *
 * Stub mode: when API keys are absent, simulates processing with a 3-second
 * delay and returns a placeholder output URL. This allows the UI to work
 * end-to-end without real credentials.
 */
import type { PrismaClient } from '@prisma/client'
import type { Job } from 'bullmq'
import { env } from '../utils/env.js'

export interface VisualAIJobData {
  jobId:      string
  tipo:       'render' | 'staging' | 'enhance_batch'
  inputUrl:   string
  style?:     string
  propertyId: string
  companyId:  string
}

// ── Stub placeholder images per tipo ──────────────────────────────────────────
const STUB_OUTPUT: Record<string, string> = {
  render:        'https://placehold.co/1280x960/1B2B5B/C9A84C?text=Render+Simulado',
  staging:       'https://placehold.co/1280x960/1B2B5B/C9A84C?text=Staging+Simulado',
  enhance_batch: 'https://placehold.co/1280x960/1B2B5B/C9A84C?text=Imagem+Melhorada',
}

// ── Veras AI integration ───────────────────────────────────────────────────────
async function processRender(inputUrl: string, style: string): Promise<string> {
  const apiKey = (env as any).VERAS_API_KEY
  if (!apiKey) {
    // Stub: simulate 3s processing
    await new Promise(r => setTimeout(r, 3000))
    return STUB_OUTPUT.render
  }
  // Real: Veras AI API
  const res = await fetch('https://app.verasai.com/api/render', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: inputUrl, style: style || 'modern', outputFormat: 'jpeg' }),
  })
  if (!res.ok) throw new Error(`Veras AI error: ${res.status}`)
  const data = await res.json() as any
  return data.outputUrl ?? data.url
}

// ── mnml.ai integration ────────────────────────────────────────────────────────
async function processStaging(inputUrl: string, style: string): Promise<string> {
  const apiKey = env.MNML_API_KEY
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 3000))
    return STUB_OUTPUT.staging
  }
  const res = await fetch('https://api.mnml.ai/v1/stage', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_url: inputUrl, room_type: style || 'sala', style: 'modern' }),
  })
  if (!res.ok) throw new Error(`mnml.ai error: ${res.status}`)
  const data = await res.json() as any
  return data.result_url ?? data.output_url
}

// ── Google Imagen AI integration ───────────────────────────────────────────────
async function processEnhanceBatch(inputUrl: string): Promise<string> {
  const apiKey = env.GOOGLE_IMAGEN_API_KEY
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 2000))
    return STUB_OUTPUT.enhance_batch
  }
  // Imagen API v1 — upscale + enhance
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ image: { gcsUri: inputUrl } }],
        parameters: { mode: 'enhance', outputOptions: { mimeType: 'image/jpeg' } },
      }),
    },
  )
  if (!res.ok) throw new Error(`Imagen AI error: ${res.status}`)
  const data = await res.json() as any
  return data.predictions?.[0]?.bytesBase64Encoded
    ? `data:image/jpeg;base64,${data.predictions[0].bytesBase64Encoded}`
    : STUB_OUTPUT.enhance_batch
}

// ── Main processor ─────────────────────────────────────────────────────────────
export async function processVisualAIJob(
  job: Job<VisualAIJobData>,
  prisma: PrismaClient,
): Promise<void> {
  const { jobId, tipo, inputUrl, style } = job.data

  // Mark as PROCESSING
  await prisma.visualAIJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING' },
  })

  try {
    let outputUrl: string

    if (tipo === 'render') {
      outputUrl = await processRender(inputUrl, style ?? 'modern')
    } else if (tipo === 'staging') {
      outputUrl = await processStaging(inputUrl, style ?? 'sala')
    } else {
      outputUrl = await processEnhanceBatch(inputUrl)
    }

    await prisma.visualAIJob.update({
      where: { id: jobId },
      data: { status: 'DONE', outputUrl },
    })
  } catch (err: any) {
    await prisma.visualAIJob.update({
      where: { id: jobId },
      data: { status: 'ERROR', errorMsg: err?.message ?? 'Unknown error' },
    })
    throw err // re-throw so BullMQ records the failure and can retry
  }
}
