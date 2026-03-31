import fp from 'fastify-plugin'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'
import { automationEmitter } from '../services/automation.emitter.js'
import { runAutomation } from '../services/automation.worker.js'
import { runScheduledJobs } from '../services/scheduled.jobs.js'
import type { AutomationEventPayload } from '../services/automation.types.js'
import { env } from '../utils/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    automationQueue: Queue | null
  }
}

export default fp(async (app: FastifyInstance) => {
  if (!env.REDIS_URL) {
    app.log.warn('REDIS_URL not set — automation engine disabled')
    app.decorate('automationQueue', null)
    return
  }

  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })

  const queue = new Queue('automation', { connection })
  app.decorate('automationQueue', queue)

  // Funnel domain events into BullMQ
  automationEmitter.on('automation:event', async (payload: AutomationEventPayload) => {
    try {
      await queue.add('process', payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      })
    } catch (err) {
      app.log.error({ err }, 'Failed to enqueue automation event')
    }
  })

  // Worker in same process (can be extracted later)
  const worker = new Worker(
    'automation',
    async (job) => runAutomation(app, job.data as AutomationEventPayload),
    { connection, concurrency: 5 },
  )

  worker.on('failed', (job, err) => {
    app.log.error({ jobId: job?.id, err }, 'Automation job failed')
  })

  // Scheduled jobs — run every 30 minutes after server is ready
  let scheduledTimer: ReturnType<typeof setInterval> | null = null
  app.addHook('onReady', () => {
    setTimeout(() => runScheduledJobs(app), 60_000) // 1min after boot
    scheduledTimer = setInterval(() => runScheduledJobs(app), 30 * 60 * 1000)
    app.log.info('✅ Scheduled jobs started (interval: 30min)')
  })

  app.addHook('onClose', async () => {
    if (scheduledTimer) clearInterval(scheduledTimer)
    await worker.close()
    await queue.close()
    await connection.quit()
  })

  app.log.info('✅ Automation engine started')
})
