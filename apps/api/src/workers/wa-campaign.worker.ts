/**
 * Worker da fila 'wa-campaigns' — processa um destinatário por job.
 *
 * Cada job envia (via provider — simulado no MVP) para um destinatário e,
 * ao terminar, tenta finalizar a campanha se não houver mais pendentes.
 */
import type { PrismaClient } from '@prisma/client'
import type { Job } from 'bullmq'
import { processRecipient, finalizeCampaignIfDone } from '../services/wa-campaigns/wa-campaigns.service.js'

export interface WaCampaignJobData {
  recipientId: string
  campaignId: string
  companyId: string
}

export async function processWaCampaignJob(job: Job, prisma: PrismaClient): Promise<void> {
  const { recipientId, campaignId } = job.data as WaCampaignJobData
  await processRecipient(prisma, recipientId)
  await finalizeCampaignIfDone(prisma, campaignId)
}
