/**
 * Rota proxy para o microserviço Python de edição de fotos.
 * Todos os endpoints requerem autenticação JWT.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import fetch from 'node-fetch'
import FormData from 'form-data'

const IMAGE_PROCESSOR_URL = process.env.IMAGE_PROCESSOR_URL ?? 'http://localhost:3200'
const IMAGE_PROCESSOR_TOKEN = process.env.IMAGE_PROCESSOR_TOKEN

async function proxyToProcessor(path: string, options: RequestInit = {}) {
  // Injects the shared-secret header automatically so every call from this
  // route goes through the microservice's `verify_token` dependency. In
  // production the processor is fail-closed, so without this the requests
  // would come back as 401.
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }
  if (IMAGE_PROCESSOR_TOKEN) headers['x-image-processor-token'] = IMAGE_PROCESSOR_TOKEN

  const res = await fetch(`${IMAGE_PROCESSOR_URL}${path}`, { ...options, headers } as any)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Image processor error ${res.status}: ${text}`)
  }
  return res.json()
}

export default async function photoEditorRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/photo-editor/filters — lista todos os filtros disponíveis
  app.get('/filters', async (_req, reply) => {
    try {
      const data = await proxyToProcessor('/filters')
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  // Shared schema — preview/process inherit the same logo controls so the
  // UI can pass logo_id + size + opacity consistently from everywhere.
  const logoControls = {
    apply_logo: z.boolean().default(true),
    logo_id: z.string().optional(),                                    // undefined => default logo
    logo_position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center']).default('bottom-right'),
    logo_size_percent: z.number().min(2).max(25).default(8),
    logo_opacity: z.number().min(0).max(1).default(0.85),
  }

  // POST /api/v1/photo-editor/preview — gera preview com filtro (por URL)
  app.post('/preview', async (req, reply) => {
    try {
      const body = z.object({
        image_url: z.string(), // accepts URLs, data URLs, relative paths
        filter_id: z.string(),
        ...logoControls,
        preview_width: z.number().int().min(400).max(1600).default(800),
      }).parse(req.body)
      const data = await proxyToProcessor('/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  // POST /api/v1/photo-editor/preview/upload — gera preview a partir de arquivo
  app.post('/preview/upload', async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'NO_FILE' })

      const body = req.body as any
      const filterId = body?.filter_id ?? 'efeito-1'
      const applyLogo = body?.apply_logo !== 'false'
      const logoId = typeof body?.logo_id === 'string' ? body.logo_id : ''
      const logoPosition = body?.logo_position ?? 'bottom-right'
      const logoSizePercent = parseFloat(body?.logo_size_percent ?? '8')
      const logoOpacity = parseFloat(body?.logo_opacity ?? '0.85')
      const previewWidth = parseInt(body?.preview_width ?? '800')

      const chunks: Buffer[] = []
      for await (const chunk of data.file) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)

      // Enviar para o microserviço Python via form-data
      const form = new FormData()
      form.append('file', buffer, { filename: data.filename, contentType: data.mimetype })
      form.append('filter_id', filterId)
      form.append('apply_logo', applyLogo ? 'true' : 'false')
      if (logoId) form.append('logo_id', logoId)
      form.append('logo_position', logoPosition)
      form.append('logo_size_percent', String(logoSizePercent))
      form.append('logo_opacity', String(logoOpacity))
      form.append('preview_width', String(previewWidth))

      const res = await fetch(`${IMAGE_PROCESSOR_URL}/preview/upload`, {
        method: 'POST',
        body: form as any,
        headers: form.getHeaders(),
      })

      if (!res.ok) {
        const text = await res.text()
        return reply.status(503).send({ error: 'IMAGE_PROCESSOR_ERROR', detail: text })
      }

      const result = await res.json()
      return reply.send(result)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  // POST /api/v1/photo-editor/process — processa imagem em qualidade completa
  app.post('/process', async (req, reply) => {
    try {
      const body = z.object({
        image_url: z.string(), // accepts URLs, data URLs, relative paths
        filter_id: z.string(),
        ...logoControls,
        output_quality: z.number().int().min(60).max(100).default(92),
      }).parse(req.body)
      const data = await proxyToProcessor('/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  // POST /api/v1/photo-editor/process/batch — processa múltiplas imagens
  app.post('/process/batch', async (req, reply) => {
    try {
      const body = z.object({
        image_urls: z.array(z.string()).min(1).max(50), // accepts URLs, data URLs, relative paths
        filter_id: z.string(),
        ...logoControls,
        output_quality: z.number().int().min(60).max(100).default(92),
      }).parse(req.body)
      const data = await proxyToProcessor('/process/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  // ── Logo library proxy ─────────────────────────────────────────────────
  // GET    /api/v1/photo-editor/logos                list
  // POST   /api/v1/photo-editor/logos                upload (multipart: file, name?)
  // GET    /api/v1/photo-editor/logos/:id            metadata
  // GET    /api/v1/photo-editor/logos/:id/file       raw PNG bytes (thumbnail src)
  // PATCH  /api/v1/photo-editor/logos/:id            rename / set default
  // DELETE /api/v1/photo-editor/logos/:id            remove
  const processorToken = process.env.IMAGE_PROCESSOR_TOKEN
  const withToken = (): Record<string, string> => (
    processorToken ? { 'x-image-processor-token': processorToken } : {}
  )

  app.get('/logos', async (_req, reply) => {
    try {
      const data = await proxyToProcessor('/logos')
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  app.post('/logos', async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'NO_FILE' })

      // Name arrives as a sibling form field; defensive default.
      const body = req.body as any
      const name = typeof body?.name === 'string' ? body.name : ''

      const chunks: Buffer[] = []
      for await (const chunk of data.file) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)

      const form = new FormData()
      form.append('file', buffer, { filename: data.filename, contentType: data.mimetype })
      if (name) form.append('name', name)

      const res = await fetch(`${IMAGE_PROCESSOR_URL}/logos`, {
        method: 'POST',
        body: form as any,
        headers: { ...form.getHeaders(), ...withToken() },
      })
      if (!res.ok) {
        const text = await res.text()
        return reply.status(res.status).send({ error: 'IMAGE_PROCESSOR_ERROR', detail: text })
      }
      const result = await res.json()
      return reply.send(result)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  app.get('/logos/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const data = await proxyToProcessor(`/logos/${encodeURIComponent(id)}`)
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  app.get('/logos/:id/file', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const res = await fetch(`${IMAGE_PROCESSOR_URL}/logos/${encodeURIComponent(id)}/file`, {
        headers: { ...withToken() },
      })
      if (!res.ok) return reply.status(res.status).send({ error: 'LOGO_NOT_FOUND' })
      const buf = Buffer.from(await res.arrayBuffer())
      return reply.type('image/png').send(buf)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  app.patch('/logos/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const body = z.object({
        name: z.string().min(1).max(120).optional(),
        is_default: z.boolean().optional(),
      }).parse(req.body ?? {})
      const data = await proxyToProcessor(`/logos/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  app.delete('/logos/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const data = await proxyToProcessor(`/logos/${encodeURIComponent(id)}`, { method: 'DELETE' })
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  // POST /api/v1/photo-editor/upload-logo — faz upload do logo da imobiliária
  app.post('/upload-logo', async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'NO_FILE' })

      const chunks: Buffer[] = []
      for await (const chunk of data.file) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)

      const form = new FormData()
      form.append('file', buffer, { filename: data.filename, contentType: data.mimetype })

      const res = await fetch(`${IMAGE_PROCESSOR_URL}/upload-logo`, {
        method: 'POST',
        body: form as any,
        headers: form.getHeaders(),
      })

      if (!res.ok) {
        const text = await res.text()
        return reply.status(503).send({ error: 'IMAGE_PROCESSOR_ERROR', detail: text })
      }

      const result = await res.json()
      return reply.send(result)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  // POST /api/v1/photo-editor/import-filter — importa novo filtro DNG
  app.post('/import-filter', async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'NO_FILE' })

      const body = req.body as any
      const filterName = body?.filter_name ?? null

      const chunks: Buffer[] = []
      for await (const chunk of data.file) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)

      const form = new FormData()
      form.append('file', buffer, { filename: data.filename, contentType: 'application/octet-stream' })
      if (filterName) form.append('filter_name', filterName)

      const res = await fetch(`${IMAGE_PROCESSOR_URL}/import-filter`, {
        method: 'POST',
        body: form as any,
        headers: form.getHeaders(),
      })

      if (!res.ok) {
        const text = await res.text()
        return reply.status(503).send({ error: 'IMAGE_PROCESSOR_ERROR', detail: text })
      }

      const result = await res.json()
      return reply.send(result)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })

  // DELETE /api/v1/photo-editor/filters/:filterId — remove filtro importado
  app.delete('/filters/:filterId', async (req, reply) => {
    const { filterId } = req.params as { filterId: string }
    try {
      const data = await proxyToProcessor(`/filters/${filterId}`, { method: 'DELETE' })
      return reply.send(data)
    } catch (e: any) {
      return reply.status(503).send({ error: 'IMAGE_PROCESSOR_UNAVAILABLE', detail: e.message })
    }
  })
}
