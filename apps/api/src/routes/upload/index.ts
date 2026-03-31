import type { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { s3Service } from '../../services/s3.service.js'

export default async function uploadRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /api/v1/upload — upload file to S3
  app.post('/', {
    schema: { tags: ['upload'] },
  }, async (req, reply) => {
    if (!s3Service.isConfigured()) {
      return reply.status(503).send({ error: 'STORAGE_NOT_CONFIGURED' })
    }

    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'NO_FILE' })

    const ext = data.filename.split('.').pop() ?? 'bin'
    const key = `${req.user.cid}/${nanoid()}/${data.filename}`

    const chunks: Buffer[] = []
    for await (const chunk of data.file) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    const url = await s3Service.upload(key, buffer, data.mimetype)

    return reply.send({ url, key, size: buffer.length, contentType: data.mimetype })
  })

  // POST /api/v1/upload/presign — get presigned URL for direct browser upload
  app.post('/presign', {
    schema: { tags: ['upload'] },
  }, async (req, reply) => {
    if (!s3Service.isConfigured()) {
      return reply.status(503).send({ error: 'STORAGE_NOT_CONFIGURED' })
    }

    const { filename, contentType } = req.body as { filename: string; contentType: string }
    const key = `${req.user.cid}/${nanoid()}/${filename}`
    const url = await s3Service.presignPut(key, contentType)

    return reply.send({ uploadUrl: url, key })
  })
}
