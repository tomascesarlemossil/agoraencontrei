import type { FastifyInstance } from 'fastify'
import { sseEmitter, type SSEEvent } from '../../services/sse.emitter.js'

export default async function eventsRoutes(app: FastifyInstance) {
  // GET /api/v1/events/stream — Server-Sent Events stream (requires auth via cookie token)
  // Note: EventSource API cannot set Authorization headers, so we accept token via query param
  // The token is short-lived and verified here as a JWT.
  app.get('/stream', async (req, reply) => {
    // Accept token from query string (EventSource cannot set headers)
    const q = req.query as Record<string, string>
    const token = q.token

    if (!token) {
      return reply.status(401).send({ error: 'UNAUTHORIZED' })
    }

    let user: { cid: string; sub: string }
    try {
      user = app.jwt.verify(token) as { cid: string; sub: string }
    } catch {
      return reply.status(401).send({ error: 'INVALID_TOKEN' })
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('X-Accel-Buffering', 'no') // disable nginx buffering
    reply.raw.flushHeaders()

    const send = (event: SSEEvent) => {
      const data = JSON.stringify({ type: event.type, payload: event.payload })
      reply.raw.write(`data: ${data}\n\n`)
    }

    const keepalive = setInterval(() => {
      reply.raw.write(': keepalive\n\n')
    }, 25_000)

    const channel = `sse:${user.cid}`
    sseEmitter.on(channel, send)

    req.raw.on('close', () => {
      clearInterval(keepalive)
      sseEmitter.off(channel, send)
    })

    // Prevent Fastify from auto-sending a response
    await new Promise<void>((resolve) => {
      req.raw.on('close', resolve)
    })
  })
}
