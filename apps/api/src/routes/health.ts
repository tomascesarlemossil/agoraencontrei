import type { FastifyInstance } from 'fastify'

// Escapa valores para formato Prometheus text exposition.
// Ref: https://prometheus.io/docs/instrumenting/exposition_formats/
function promEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

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

  // ── GET /metrics — Prometheus text exposition ────────────────────────
  // Protegido por Bearer token (env METRICS_TOKEN). Sem o env configurado,
  // o endpoint retorna 404 — não expõe nada por default, evitando vazar
  // métricas operacionais (contadores de leads, receitas, etc.) para
  // scrapers não autorizados.
  //
  // Uso: curl -H "Authorization: Bearer <METRICS_TOKEN>" /metrics
  // Integra direto com Grafana Cloud, Datadog, Prometheus federado.
  app.get('/metrics', {
    schema: {
      tags: ['system'],
      summary: 'Prometheus metrics (token-protected)',
      hide: true, // não exibir no swagger público
    },
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const token = process.env.METRICS_TOKEN
    if (!token) {
      return reply.status(404).send({ error: 'NOT_FOUND' })
    }

    const authHeader = req.headers['authorization'] as string | undefined
    const provided = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (provided !== token) {
      return reply.status(401).send({ error: 'UNAUTHORIZED' })
    }

    const lines: string[] = []
    lines.push('# HELP api_up 1 if the API process is up')
    lines.push('# TYPE api_up gauge')
    lines.push('api_up 1')

    // BullMQ queues — waiting/active/failed por fila
    const queues: Array<[string, any]> = [
      ['automation', app.automationQueue],
      ['outbound', (app as any).outboundQueue],
      ['campaigns', (app as any).campaignsQueue],
      ['visual_ai', (app as any).visualAIQueue],
    ]

    lines.push('# HELP bullmq_jobs Queue job counts by state')
    lines.push('# TYPE bullmq_jobs gauge')
    for (const [name, q] of queues) {
      if (!q) continue
      const [waiting, active, failed, delayed] = await Promise.all([
        q.getWaitingCount().catch(() => 0),
        q.getActiveCount().catch(() => 0),
        q.getFailedCount().catch(() => 0),
        q.getDelayedCount().catch(() => 0),
      ])
      const q_esc = promEscape(name)
      lines.push(`bullmq_jobs{queue="${q_esc}",state="waiting"} ${waiting}`)
      lines.push(`bullmq_jobs{queue="${q_esc}",state="active"} ${active}`)
      lines.push(`bullmq_jobs{queue="${q_esc}",state="failed"} ${failed}`)
      lines.push(`bullmq_jobs{queue="${q_esc}",state="delayed"} ${delayed}`)
    }

    // Contadores de domínio — janelas de 5min e 1h para detecção de anomalias
    const now = Date.now()
    const fiveMinAgo = new Date(now - 5 * 60_000)
    const hourAgo = new Date(now - 60 * 60_000)

    try {
      const [
        leadsLast5m,
        outboundFailed1h,
        webhookErrors1h,
        repasseFailed24h,
      ] = await Promise.all([
        app.prisma.salesFunnel.count({ where: { createdAt: { gte: fiveMinAgo } } }).catch(() => 0),
        (app.prisma as any).outboundMessage.count({ where: { status: 'failed', createdAt: { gte: hourAgo } } }).catch(() => 0),
        app.prisma.auditLog.count({
          where: { action: { contains: 'webhook.error' }, createdAt: { gte: hourAgo } },
        }).catch(() => 0),
        (app.prisma as any).scheduledRepasse.count({
          where: { status: 'FAILED', updatedAt: { gte: new Date(now - 24 * 3_600_000) } },
        }).catch(() => 0),
      ])

      lines.push('# HELP leads_created_5m SalesFunnel entries created in last 5 minutes')
      lines.push('# TYPE leads_created_5m gauge')
      lines.push(`leads_created_5m ${leadsLast5m}`)

      lines.push('# HELP outbound_failed_1h Outbound messages failed in last hour')
      lines.push('# TYPE outbound_failed_1h gauge')
      lines.push(`outbound_failed_1h ${outboundFailed1h}`)

      lines.push('# HELP webhook_errors_1h Webhook errors logged in last hour')
      lines.push('# TYPE webhook_errors_1h gauge')
      lines.push(`webhook_errors_1h ${webhookErrors1h}`)

      lines.push('# HELP repasse_failed_24h ScheduledRepasse failed in last 24h')
      lines.push('# TYPE repasse_failed_24h gauge')
      lines.push(`repasse_failed_24h ${repasseFailed24h}`)
    } catch {
      /* contadores best-effort — não quebra o endpoint */
    }

    // Process metrics
    const mem = process.memoryUsage()
    lines.push('# HELP process_memory_rss_bytes Resident Set Size')
    lines.push('# TYPE process_memory_rss_bytes gauge')
    lines.push(`process_memory_rss_bytes ${mem.rss}`)
    lines.push('# HELP process_memory_heap_used_bytes Heap used')
    lines.push('# TYPE process_memory_heap_used_bytes gauge')
    lines.push(`process_memory_heap_used_bytes ${mem.heapUsed}`)
    lines.push('# HELP process_uptime_seconds Uptime in seconds')
    lines.push('# TYPE process_uptime_seconds counter')
    lines.push(`process_uptime_seconds ${process.uptime().toFixed(0)}`)

    reply.header('content-type', 'text/plain; version=0.0.4')
    return reply.send(lines.join('\n') + '\n')
  })
}
