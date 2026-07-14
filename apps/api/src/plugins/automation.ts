import fp from 'fastify-plugin'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'
import { automationEmitter } from '../services/automation.emitter.js'
import { runAutomation } from '../services/automation.worker.js'
import { runScheduledJobs } from '../services/scheduled.jobs.js'
import { runDetailEnrichmentBatch } from '../services/auction-detail-enrichment.service.js'
import { runAuctionArchiveBatch } from '../services/auction-archive.service.js'
import { processVisualAIJob } from '../workers/visual-ai.worker.js'
import { processCampaignJob } from '../workers/campaign.worker.js'
import { processVideoEditorJob } from '../workers/video-editor.worker.js'
import { processOutboundJob } from '../services/outbound-queue.service.js'
import { processWaCampaignJob } from '../workers/wa-campaign.worker.js'
import type { AutomationEventPayload } from '../services/automation.types.js'
import { env } from '../utils/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    automationQueue:  Queue | null
    visualAIQueue:    Queue | null
    campaignsQueue:   Queue | null
    outboundQueue:    Queue | null
    videoEditorQueue: Queue | null
    waCampaignsQueue: Queue | null
  }
}

export default fp(async (app: FastifyInstance) => {
  if (!env.REDIS_URL) {
    app.log.warn('REDIS_URL not set — automation engine disabled')
    app.decorate('automationQueue',  null)
    app.decorate('visualAIQueue',    null)
    app.decorate('campaignsQueue',   null)
    app.decorate('outboundQueue',    null)
    app.decorate('videoEditorQueue', null)
    app.decorate('waCampaignsQueue', null)
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
  const automationQueue  = new Queue('automation',   { connection })
  const visualAIQueue    = new Queue('visual-ai',    { connection })
  const campaignsQueue   = new Queue('campaigns',    { connection })
  const outboundQueue    = new Queue('outbound',     { connection })
  const videoEditorQueue = new Queue('video-editor', { connection })
  const waCampaignsQueue = new Queue('wa-campaigns',  { connection })

  app.decorate('automationQueue',  automationQueue)
  app.decorate('visualAIQueue',    visualAIQueue)
  app.decorate('campaignsQueue',   campaignsQueue)
  app.decorate('outboundQueue',    outboundQueue)
  app.decorate('videoEditorQueue', videoEditorQueue)
  app.decorate('waCampaignsQueue', waCampaignsQueue)

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

  // ── Video editor worker — FFmpeg renders are CPU-heavy, keep concurrency low
  const videoEditorWorker = new Worker(
    'video-editor',
    async (job) => processVideoEditorJob(job as any, app.prisma),
    { connection, concurrency: 1 },
  )

  // ── WhatsApp campaigns worker — one recipient per job (simulated no MVP) ──
  const waCampaignsWorker = new Worker(
    'wa-campaigns',
    async (job) => processWaCampaignJob(job, app.prisma),
    { connection, concurrency: 2 },
  )

  for (const [name, worker] of [
    ['automation',   automationWorker],
    ['visual-ai',    visualAIWorker],
    ['campaigns',    campaignsWorker],
    ['outbound',     outboundWorker],
    ['video-editor', videoEditorWorker],
    ['wa-campaigns', waCampaignsWorker],
  ] as const) {
    worker.on('failed', (job, err) => {
      app.log.error({ queue: name, jobId: job?.id, err }, `${name} job failed`)
    })
  }

  // ── Scheduled jobs — every 30 minutes after boot ──────────────────────────
  let scheduledTimer: ReturnType<typeof setInterval> | null = null
  let auctionBackfillTimer: ReturnType<typeof setTimeout> | null = null
  app.addHook('onReady', () => {
    // A carga inicial de matrículas não deve esperar todas as demais automações.
    // Executa fora do caminho de boot e é idempotente.
    auctionBackfillTimer = setTimeout(async () => {
      try {
        const detail = await runDetailEnrichmentBatch(app.prisma, 500)
        app.log.info(`[auction-backfill] ${detail.enriched}/${detail.processed} documentos oficiais descobertos`)
        const archive = await runAuctionArchiveBatch(app.prisma, 500)
        app.log.info(`[auction-backfill] ${archive.archived} documentos arquivados de ${archive.processed} leilões`)
      } catch (e) {
        app.log.error({ err: e }, '[auction-backfill] failed')
      }
    }, 5_000)
    setTimeout(() => runScheduledJobs(app).catch(e => app.log.error('Scheduled jobs error:', e.message)), 60_000)
    scheduledTimer = setInterval(() => runScheduledJobs(app).catch(e => app.log.error('Scheduled jobs error:', e.message)), 30 * 60 * 1000)
    app.log.info('✅ Scheduled jobs started (interval: 30min)')
  })

  app.addHook('onClose', async () => {
    if (auctionBackfillTimer) clearTimeout(auctionBackfillTimer)
    if (scheduledTimer) clearInterval(scheduledTimer)
    await Promise.all([
      automationWorker.close(),
      visualAIWorker.close(),
      campaignsWorker.close(),
      outboundWorker.close(),
      videoEditorWorker.close(),
      waCampaignsWorker.close(),
    ])
    await Promise.all([
      automationQueue.close(),
      visualAIQueue.close(),
      campaignsQueue.close(),
      outboundQueue.close(),
      videoEditorQueue.close(),
      waCampaignsQueue.close(),
    ])
    await connection.quit()
  })

  app.log.info('✅ Automation engine started (queues: automation, visual-ai, campaigns, outbound, video-editor, wa-campaigns)')
})
