import type { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { s3Service } from '../../services/s3.service.js'

export default async function uploadRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── Allowed file types and size limits ─────────────────────────────────
  // SVG is intentionally NOT allowed — SVG files can carry inline <script>
  // that executes in the user's browser when the file is rendered or opened
  // directly (stored XSS / CWE-79). Use PNG/WebP/AVIF for vector-style logos.
  const ALLOWED_MIMETYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
    'application/pdf',
    'video/mp4', 'video/webm',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ])
  const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

  /**
   * Sanitize the filename supplied by the client before using it inside an
   * S3 key. Strips path separators (defence-in-depth against traversal),
   * non-ASCII chars and shell metacharacters. Falls back to a generated
   * name if everything got stripped.
   */
  function sanitizeFilename(name: string | undefined): string {
    const raw = (name || '').trim()
    // Keep only the basename — block any "../" attempt up front.
    const base = raw.split(/[\\/]/).pop() || ''
    const cleaned = base
      .normalize('NFKD')
      .replace(/[^\w.\-]+/g, '_')   // letters, digits, _, ., -
      .replace(/_+/g, '_')
      .replace(/^[._-]+|[._-]+$/g, '')
      .slice(0, 120)
    return cleaned || `file-${nanoid(8)}`
  }

  // POST /api/v1/upload — upload file to S3 or fallback to base64 inline
  app.post('/', {
    // Dedicated rate-limit: uploads are far more expensive than typical
    // requests, so they get a tighter cap independent of the global one.
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    schema: { tags: ['upload'] },
  }, async (req, reply) => {
    const data = await req.file({ limits: { fileSize: MAX_FILE_SIZE } })
    if (!data) return reply.status(400).send({ error: 'NO_FILE' })

    // Validate MIME type
    const mimetype = data.mimetype || 'application/octet-stream'
    if (!ALLOWED_MIMETYPES.has(mimetype)) {
      return reply.status(400).send({
        error: 'INVALID_FILE_TYPE',
        message: `Tipo de arquivo não permitido: ${mimetype}. Permitidos: imagens (exceto SVG), PDFs, vídeos e documentos Office.`,
      })
    }

    const chunks: Buffer[] = []
    let totalSize = 0
    for await (const chunk of data.file) {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE) {
        return reply.status(413).send({
          error: 'FILE_TOO_LARGE',
          message: `Arquivo excede o limite de ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        })
      }
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    const safeName = sanitizeFilename(data.filename)

    // If S3 is configured, use it (no size limit)
    if (s3Service.isConfigured()) {
      const key = `${req.user.cid}/${nanoid()}/${safeName}`
      const url = await s3Service.upload(key, buffer, mimetype)
      return reply.send({ url, key, size: buffer.length, contentType: mimetype })
    }

    // Fallback: store as base64 data URL — no size limit enforced
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${mimetype};base64,${base64}`
    const key = `inline/${req.user.cid}/${nanoid()}`

    return reply.send({ url: dataUrl, key, size: buffer.length, contentType: mimetype, inline: true })
  })

  // POST /api/v1/upload/presign — get presigned URL for direct browser upload
  app.post('/presign', {
    config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    schema: { tags: ['upload'] },
  }, async (req, reply) => {
    if (!s3Service.isConfigured()) {
      // Return a flag indicating client should use the regular upload endpoint
      return reply.status(200).send({
        uploadUrl: null,
        key: null,
        useDirectUpload: true,
        message: 'S3 not configured, use POST /upload instead',
      })
    }

    const body = (req.body || {}) as { filename?: string; contentType?: string }
    const filename = typeof body.filename === 'string' ? body.filename : ''
    const contentType = typeof body.contentType === 'string' ? body.contentType : ''

    // Validate the requested content-type against the same allowlist used by
    // the direct-upload endpoint. Without this the presigned URL would
    // happily mint a slot for `image/svg+xml`, `text/html`, etc., letting a
    // malicious client bypass the SVG/exec block by going straight to S3.
    if (!ALLOWED_MIMETYPES.has(contentType)) {
      return reply.status(400).send({
        error: 'INVALID_CONTENT_TYPE',
        message: `Tipo de arquivo não permitido: ${contentType || '(vazio)'}.`,
      })
    }

    const safeName = sanitizeFilename(filename)
    const key = `${req.user.cid}/${nanoid()}/${safeName}`
    const url = await s3Service.presignPut(key, contentType)

    return reply.send({ uploadUrl: url, key })
  })
}
