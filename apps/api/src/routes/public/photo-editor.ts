/**
 * Public photo editing endpoint — no JWT required on this side, mas
 * o microserviço Python continua autenticado via X-Processor-Token
 * (fail-closed). Propagamos o token a partir do env da API.
 *
 * Nota de segurança: como este endpoint é público, ele ainda está
 * sujeito ao rate limit global do Fastify. O rate limit adicional
 * do Python (por IP de origem = a API) funciona como defesa em
 * profundidade contra abuse interno.
 */
import type { FastifyInstance } from 'fastify'
import fetch from 'node-fetch'
import FormData from 'form-data'

const IMAGE_PROCESSOR_URL = process.env.IMAGE_PROCESSOR_URL ?? 'http://localhost:3200'
const IMAGE_PROCESSOR_TOKEN = process.env.IMAGE_PROCESSOR_TOKEN ?? ''

export async function publicPhotoEditorRoutes(app: FastifyInstance) {
  // POST /api/v1/public/photo-editor/apply — process photo with filter (no auth)
  app.post('/photo-editor/apply', async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: 'NO_FILE' })

      const body = req.body as any
      const filterId = body?.filter_id ?? 'efeito-1'
      const applyLogo = (body?.apply_logo ?? 'true') !== 'false'
      const logoPosition = body?.logo_position ?? 'bottom-right'

      const chunks: Buffer[] = []
      for await (const chunk of data.file) chunks.push(chunk)
      const buffer = Buffer.concat(chunks)

      const form = new FormData()
      form.append('file', buffer, { filename: data.filename, contentType: data.mimetype })
      form.append('filter_id', filterId)
      form.append('apply_logo', applyLogo ? 'true' : 'false')
      form.append('logo_position', logoPosition)

      const headers: Record<string, string> = { ...form.getHeaders() }
      if (IMAGE_PROCESSOR_TOKEN) headers['X-Processor-Token'] = IMAGE_PROCESSOR_TOKEN
      const res = await fetch(`${IMAGE_PROCESSOR_URL}/preview/upload`, {
        method: 'POST',
        body: form as any,
        headers,
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
}
