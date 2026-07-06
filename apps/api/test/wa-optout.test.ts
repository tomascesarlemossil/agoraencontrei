import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isOptOutMessage,
  isOptedOut,
  addOptOut,
  getOptedOutSet,
  handleInboundReply,
} from '../src/services/wa-campaigns/wa-optout.service.js'
import { makeMockPrisma } from './wa-mock-prisma.js'

test('detecta palavras-chave de descadastro', () => {
  assert.equal(isOptOutMessage('SAIR'), true)
  assert.equal(isOptOutMessage('parar'), true)
  assert.equal(isOptOutMessage('Quero cancelar por favor'), true)
  assert.equal(isOptOutMessage('STOP'), true)
})

test('não trata mensagem comum como descadastro', () => {
  assert.equal(isOptOutMessage('Tenho interesse no imóvel'), false)
  assert.equal(isOptOutMessage('quando posso visitar?'), false)
})

test('addOptOut + isOptedOut são idempotentes e consultáveis', async () => {
  const prisma = makeMockPrisma()
  await addOptOut(prisma, { companyId: 'c1', phoneE164: '+5511912345678', reason: 'manual' })
  await addOptOut(prisma, { companyId: 'c1', phoneE164: '+5511912345678' }) // idempotente
  assert.equal(prisma.__db.waOptOut.length, 1)
  assert.equal(await isOptedOut(prisma, 'c1', '+5511912345678'), true)
  assert.equal(await isOptedOut(prisma, 'c1', '+5511900000000'), false)
  const set = await getOptedOutSet(prisma, 'c1', ['+5511912345678', '+5511900000000'])
  assert.deepEqual([...set], ['+5511912345678'])
})

test('handleInboundReply com SAIR registra opt-out e marca UNSUBSCRIBED', async () => {
  const prisma = makeMockPrisma()
  await prisma.waCampaign.create({ data: { id: 'camp1', companyId: 'c1', name: 'X', messageBody: 'oi', createdById: 'u1' } })
  await prisma.waCampaignRecipient.create({
    data: { id: 'rec1', campaignId: 'camp1', companyId: 'c1', rawPhone: '11912345678', phoneE164: '+5511912345678', valid: true, status: 'DELIVERED' },
  })

  const res = await handleInboundReply(prisma, { companyId: 'c1', phone: '11912345678', text: 'SAIR' })
  assert.equal(res.optedOut, true)
  assert.equal(prisma.__db.waOptOut.length, 1)
  const rec = prisma.__db.waCampaignRecipient.find((r: any) => r.id === 'rec1')
  assert.equal(rec.status, 'UNSUBSCRIBED')
})

test('handleInboundReply com resposta comum abre atendimento (Lead) e marca REPLIED', async () => {
  const prisma = makeMockPrisma()
  await prisma.waCampaign.create({ data: { id: 'camp2', companyId: 'c1', name: 'X', messageBody: 'oi', createdById: 'u1' } })
  await prisma.waCampaignRecipient.create({
    data: { id: 'rec2', campaignId: 'camp2', companyId: 'c1', name: 'Ana', rawPhone: '11912345678', phoneE164: '+5511912345678', valid: true, status: 'DELIVERED' },
  })

  const res = await handleInboundReply(prisma, { companyId: 'c1', phone: '11912345678', text: 'Tenho interesse!' })
  assert.equal(res.optedOut, false)
  assert.ok(res.leadId, 'deve criar/achar um lead')
  assert.equal(prisma.__db.lead.length, 1)
  const rec = prisma.__db.waCampaignRecipient.find((r: any) => r.id === 'rec2')
  assert.equal(rec.status, 'REPLIED')
})
