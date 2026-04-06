import type { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { s3Service } from '../../services/s3.service.js'

export default async function uploadRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /api/v1/upload — upload file to S3 or fallback to base64 inline
  // Accepts ANY file type and ANY size — no restrictions
  app.post('/', {
    schema: { tags: ['upload'] },
  }, async (req, reply) => {
    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'NO_FILE' })

    const chunks: Buffer[] = []
    for await (const chunk of data.file) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Determine a safe mimetype — fallback to octet-stream if unknown
    const mimetype = data.mimetype || 'application/octet-stream'

    // If S3 is configured, use it (no size limit)
    if (s3Service.isConfigured()) {
      const key = `${req.user.cid}/${nanoid()}/${data.filename}`
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

    const { filename, contentType } = req.body as { filename: string; contentType: string }
    const key = `${req.user.cid}/${nanoid()}/${filename}`
    const url = await s3Service.presignPut(key, contentType)

    return reply.send({ uploadUrl: url, key })
  })
}
