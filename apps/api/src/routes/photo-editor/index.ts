/**
 * Rota proxy para o microserviço Python de edição de fotos.
 * Todos os endpoints requerem autenticação JWT.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import fetch from 'node-fetch'
import FormData from 'form-data'

const IMAGE_PROCESSOR_URL = process.env.IMAGE_PROCESSOR_URL ?? 'http://localhost:3200'

async function proxyToProcessor(path: string, options: RequestInit = {}) {
  const res = await fetch(`${IMAGE_PROCESSOR_URL}${path}`, options as any)
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

  // POST /api/v1/photo-editor/preview — gera preview com filtro (por URL)
  app.post('/preview', async (req, reply) => {
    try {
      const body = z.object({
        image_url: z.string(), // accepts URLs, data URLs, relative paths
        filter_id: z.string(),
        apply_logo: z.boolean().default(true),
        logo_position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center']).default('bottom-right'),
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
      const logoPosition = body?.logo_position ?? 'bottom-right'
      const previewWidth = parseInt(body?.preview_width ?? '800')

      const chunks: Buffer[] = []
      for await (const chunk of data.file) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)

      // Enviar para o microserviço Python via form-data
      const form = new FormData()
      form.append('file', buffer, { filename: data.filename, contentType: data.mimetype })
      form.append('filter_id', filterId)
      form.append('apply_logo', applyLogo ? 'true' : 'false')
      form.append('logo_position', logoPosition)
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
        apply_logo: z.boolean().default(true),
        logo_position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center']).default('bottom-right'),
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
        apply_logo: z.boolean().default(true),
        logo_position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center']).default('bottom-right'),
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
