import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createCampaign,
  addRecipients,
  dispatchCampaign,
  processRecipient,
} from '../src/services/wa-campaigns/wa-campaigns.service.js'
import { makeMockPrisma } from './wa-mock-prisma.js'

/** Fila fake que apenas coleta os jobs adicionados. */
function makeMockQueue() {
  const jobs: any[] = []
  return { jobs, add: async (name: string, data: any) => { jobs.push({ name, data }); return { id: `j${jobs.length}` } } }
}

test('dispatch com fila enfileira um job por destinatário e marca QUEUED', async () => {
  const prisma = makeMockPrisma()
  const c = await createCampaign(prisma, { companyId: 'c1', createdById: 'u1', name: 'X', messageBody: 'Olá {{nome}}' })
  await addRecipients(prisma, {
    campaignId: c.id, companyId: 'c1',
    entries: [
      { raw: '11912345678', name: 'Ana' },
      { raw: '21987654321', name: 'Bia' },
    ],
  })

  const queue = makeMockQueue()
  const res = await dispatchCampaign(prisma, queue as any, { companyId: 'c1', campaignId: c.id })

  assert.equal(res.mode, 'queue')
  assert.equal(res.simulated, true, 'MVP: provider simulado')
  assert.equal(res.enqueued, 2)
  assert.equal(queue.jobs.length, 2)
  const recs = prisma.__db.waCampaignRecipient.filter((r: any) => r.valid)
  assert.ok(recs.every((r: any) => r.status === 'QUEUED'))
})

test('dispatch inline (sem fila) envia via provider simulado → DELIVERED e campanha SENT', async () => {
  const prisma = makeMockPrisma()
  const c = await createCampaign(prisma, { companyId: 'c1', createdById: 'u1', name: 'X', messageBody: 'Olá {{nome}}' })
  await addRecipients(prisma, {
    campaignId: c.id, companyId: 'c1',
    entries: [{ raw: '11912345678', name: 'Ana' }, { raw: '21987654321', name: 'Bia' }],
  })

  const res = await dispatchCampaign(prisma, null, { companyId: 'c1', campaignId: c.id })
  assert.equal(res.mode, 'inline')
  assert.equal(res.enqueued, 2)

  const recs = prisma.__db.waCampaignRecipient.filter((r: any) => r.valid)
  assert.ok(recs.every((r: any) => r.status === 'DELIVERED'), 'todos entregues (simulado)')
  assert.ok(recs.every((r: any) => r.providerMessageId?.startsWith('sim_')), 'id simulado')

  const camp = prisma.__db.waCampaign.find((x: any) => x.id === c.id)
  assert.equal(camp.status, 'SENT')
  assert.equal(camp.totalSent, 2)
  assert.equal(camp.totalDelivered, 2)
})

test('exige aprovação humana antes de disparar quando risco pede', async () => {
  const prisma = makeMockPrisma()
  const c = await createCampaign(prisma, { companyId: 'c1', createdById: 'u1', name: 'X', messageBody: 'Olá' })
  // Força a flag de aprovação (simula risco médio/alto já calculado).
  await prisma.waCampaign.update({ where: { id: c.id }, data: { requiresApproval: true } })
  await addRecipients(prisma, { campaignId: c.id, companyId: 'c1', entries: [{ raw: '11912345678' }] })
  // addRecipients recomputa risco; garante de novo a trava para o teste.
  await prisma.waCampaign.update({ where: { id: c.id }, data: { requiresApproval: true } })

  await assert.rejects(
    () => dispatchCampaign(prisma, null, { companyId: 'c1', campaignId: c.id }),
    /APPROVAL_REQUIRED/,
  )
})

test('processRecipient bloqueia envio se o número virou opt-out após a fila', async () => {
  const prisma = makeMockPrisma()
  const c = await createCampaign(prisma, { companyId: 'c1', createdById: 'u1', name: 'X', messageBody: 'Olá' })
  await addRecipients(prisma, { campaignId: c.id, companyId: 'c1', entries: [{ raw: '11912345678', name: 'Ana' }] })
  const rec = prisma.__db.waCampaignRecipient.find((r: any) => r.valid)

  // Opt-out chega depois de enfileirar.
  await prisma.waOptOut.create({ data: { companyId: 'c1', phoneE164: '+5511912345678' } })
  await processRecipient(prisma, rec.id)

  const after = prisma.__db.waCampaignRecipient.find((r: any) => r.id === rec.id)
  assert.equal(after.status, 'UNSUBSCRIBED')
})
