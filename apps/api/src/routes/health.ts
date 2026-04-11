import type { FastifyInstance } from 'fastify'

export default async function healthRoutes(app: FastifyInstance) {
  // Simple healthcheck — always returns 200 so Railway healthcheck passes
  // Database status is informational only, not a gate
  app.get('/', { schema: { tags: ['system'] } }, async (_req, reply) => {
    let dbStatus = 'unknown'
    try {
      await app.prisma.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch {
      dbStatus = 'disconnected'
    }
    return reply.send({
      status: 'ok',
      service: 'agoraencontrei-api',
      version: '1.0.0',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    })
  })

  // ── GET /system — Detailed system health for dashboard badge ──────────
  app.get('/system', {
    schema: { tags: ['system'], summary: 'System health for dashboard badge' },
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const checks: Record<string, { status: 'green' | 'yellow' | 'red'; message: string }> = {}

    // Database check
    try {
      const start = Date.now()
      await app.prisma.$queryRaw`SELECT 1`
      const latency = Date.now() - start
      checks.database = {
        status: latency < 500 ? 'green' : latency < 2000 ? 'yellow' : 'red',
        message: `${latency}ms`,
      }
    } catch {
      checks.database = { status: 'red', message: 'disconnected' }
    }

    // Redis / Queue check
    try {
      if (app.automationQueue) {
        const waiting = await app.automationQueue.getWaitingCount().catch(() => -1)
        const active = await app.automationQueue.getActiveCount().catch(() => -1)
        const failed = await app.automationQueue.getFailedCount().catch(() => -1)
        checks.automationQueue = {
          status: failed > 50 ? 'red' : waiting > 100 ? 'yellow' : 'green',
          message: `waiting=${waiting} active=${active} failed=${failed}`,
        }
      } else {
        checks.automationQueue = { status: 'yellow', message: 'Redis not configured' }
      }

      if (app.outboundQueue) {
        const waiting = await app.outboundQueue.getWaitingCount().catch(() => -1)
        const active = await app.outboundQueue.getActiveCount().catch(() => -1)
        const failed = await app.outboundQueue.getFailedCount().catch(() => -1)
        checks.outboundQueue = {
          status: failed > 20 ? 'red' : waiting > 200 ? 'yellow' : 'green',
          message: `waiting=${waiting} active=${active} failed=${failed}`,
        }
      } else {
        checks.outboundQueue = { status: 'yellow', message: 'Redis not configured' }
      }
    } catch {
      checks.automationQueue = { status: 'red', message: 'error checking queue' }
      checks.outboundQueue = { status: 'red', message: 'error checking queue' }
    }

    // Recent API errors (from audit log)
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentErrors = await app.prisma.auditLog.count({
        where: {
          action: { contains: 'error' },
          createdAt: { gte: fiveMinAgo },
        },
      })
      checks.apiErrors = {
        status: recentErrors > 20 ? 'red' : recentErrors > 5 ? 'yellow' : 'green',
        message: `${recentErrors} errors in last 5min`,
      }
    } catch {
      checks.apiErrors = { status: 'yellow', message: 'unable to check' }
    }

    // Webhook health
    try {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const webhookErrors = await app.prisma.auditLog.count({
        where: {
          action: { contains: 'webhook.error' },
          createdAt: { gte: hourAgo },
        },
      })
      checks.webhooks = {
        status: webhookErrors > 10 ? 'red' : webhookErrors > 3 ? 'yellow' : 'green',
        message: `${webhookErrors} errors in last hour`,
      }
    } catch {
      checks.webhooks = { status: 'yellow', message: 'unable to check' }
    }

    // Overall status
    const statuses = Object.values(checks).map(c => c.status)
    const overall: 'green' | 'yellow' | 'red' = statuses.includes('red')
      ? 'red'
      : statuses.includes('yellow')
        ? 'yellow'
        : 'green'

    return reply.send({
      status: overall,
      checks,
      timestamp: new Date().toISOString(),
    })
  })
}
