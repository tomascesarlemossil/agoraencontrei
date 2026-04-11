import fp from 'fastify-plugin'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'
import { automationEmitter } from '../services/automation.emitter.js'
import { runAutomation } from '../services/automation.worker.js'
import { runScheduledJobs } from '../services/scheduled.jobs.js'
import { processVisualAIJob } from '../workers/visual-ai.worker.js'
import { processCampaignJob } from '../workers/campaign.worker.js'
import { processOutboundJob } from '../services/outbound-queue.service.js'
import type { AutomationEventPayload } from '../services/automation.types.js'
import { env } from '../utils/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    automationQueue:  Queue | null
    visualAIQueue:    Queue | null
    campaignsQueue:   Queue | null
    outboundQueue:    Queue | null
  }
}

export default fp(async (app: FastifyInstance) => {
  if (!env.REDIS_URL) {
    app.log.warn('REDIS_URL not set — automation engine disabled')
    app.decorate('automationQueue', null)
    app.decorate('visualAIQueue',   null)
    app.decorate('campaignsQueue',  null)
    return
  }

  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    connectTimeout: 10000,
  })

  // Connect with timeout — don't block server startup
  try {
    const connectP = connection.connect()
    const timeoutP = new Promise((_, reject) => setTimeout(() => reject(new Error('Automation Redis timeout (10s)')), 10000))
    await Promise.race([connectP, timeoutP])
    connectP.catch(() => {})
  } catch (err: any) {
    app.log.warn(`⚠️ Automation Redis connect failed: ${err.message} — queues may not work`)
  }

  // ── Queues ────────────────────────────────────────────────────────────────
  const automationQueue = new Queue('automation',  { connection })
  const visualAIQueue   = new Queue('visual-ai',   { connection })
  const campaignsQueue  = new Queue('campaigns',   { connection })
  const outboundQueue   = new Queue('outbound',    { connection })

  app.decorate('automationQueue', automationQueue)
  app.decorate('visualAIQueue',   visualAIQueue)
  app.decorate('campaignsQueue',  campaignsQueue)
  app.decorate('outboundQueue',   outboundQueue)

  // ── Funnel domain events into automation queue ────────────────────────────
  automationEmitter.on('automation:event', async (payload: AutomationEventPayload) => {
    try {
      await automationQueue.add('process', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      })
    } catch (err) {
      app.log.error({ err }, 'Failed to enqueue automation event')
    }
  })

  // ── Workers ───────────────────────────────────────────────────────────────
  const automationWorker = new Worker(
    'automation',
    async (job) => runAutomation(app, job.data as AutomationEventPayload),
    { connection, concurrency: 5 },
  )

  const visualAIWorker = new Worker(
    'visual-ai',
    async (job) => processVisualAIJob(job, app.prisma),
    { connection, concurrency: 3 },
  )

  const campaignsWorker = new Worker(
    'campaigns',
    async (job) => processCampaignJob(job, app.prisma),
    { connection, concurrency: 2 },
  )

  // ── Outbound worker — dedicated queue for outbound messages ────────────
  const outboundWorker = new Worker(
    'outbound',
    async (job) => processOutboundJob(app.prisma, job.data),
    { connection, concurrency: 3 },
  )

  for (const [name, worker] of [
    ['automation', automationWorker],
    ['visual-ai',  visualAIWorker],
    ['campaigns',  campaignsWorker],
    ['outbound',   outboundWorker],
  ] as const) {
    worker.on('failed', (job, err) => {
      app.log.error({ queue: name, jobId: job?.id, err }, `${name} job failed`)
    })
  }

  // ── Scheduled jobs — every 30 minutes after boot ──────────────────────────
  let scheduledTimer: ReturnType<typeof setInterval> | null = null
  app.addHook('onReady', () => {
    setTimeout(() => runScheduledJobs(app).catch(e => app.log.error('Scheduled jobs error:', e.message)), 60_000)
    scheduledTimer = setInterval(() => runScheduledJobs(app).catch(e => app.log.error('Scheduled jobs error:', e.message)), 30 * 60 * 1000)
    app.log.info('✅ Scheduled jobs started (interval: 30min)')
  })

  app.addHook('onClose', async () => {
    if (scheduledTimer) clearInterval(scheduledTimer)
    await Promise.all([
      automationWorker.close(),
      visualAIWorker.close(),
      campaignsWorker.close(),
      outboundWorker.close(),
    ])
    await Promise.all([
      automationQueue.close(),
      visualAIQueue.close(),
      campaignsQueue.close(),
      outboundQueue.close(),
    ])
    await connection.quit()
  })

  app.log.info('✅ Automation engine started (queues: automation, visual-ai, campaigns, outbound)')
})
