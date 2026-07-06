import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createCampaign,
  addRecipients,
} from '../src/services/wa-campaigns/wa-campaigns.service.js'
import { addOptOut } from '../src/services/wa-campaigns/wa-optout.service.js'
import { computeCampaignRisk } from '../src/services/wa-campaigns/wa-risk.service.js'
import { makeMockPrisma } from './wa-mock-prisma.js'

test('createCampaign persiste em DRAFT com base na empresa', async () => {
  const prisma = makeMockPrisma()
  const c = await createCampaign(prisma, { companyId: 'c1', createdById: 'u1', name: 'Aurora', messageBody: 'Olá {{nome}}' })
  assert.equal(c.status, 'DRAFT')
  assert.equal(c.companyId, 'c1')
  assert.equal(prisma.__db.waCampaign.length, 1)
})

test('addRecipients normaliza, deduplica, ignora inválidos e bloqueia opt-out', async () => {
  const prisma = makeMockPrisma()
  const c = await createCampaign(prisma, { companyId: 'c1', createdById: 'u1', name: 'Aurora', messageBody: 'Olá' })

  // Um número já descadastrado deve ser bloqueado no envio.
  await addOptOut(prisma, { companyId: 'c1', phoneE164: '+5521987654321' })

  const report = await addRecipients(prisma, {
    campaignId: c.id,
    companyId: 'c1',
    entries: [
      { raw: '11912345678', source: 'import', consentBasis: 'consent' },
      { raw: '(11) 91234-5678', source: 'import', consentBasis: 'consent' }, // duplicado
      { raw: '11 3234-5678', source: 'import', consentBasis: 'consent' },     // fixo → inválido
      { raw: '21987654321', source: 'import', consentBasis: 'consent' },      // opt-out
      { raw: 'abc', source: 'import', consentBasis: 'consent' },              // inválido
    ],
  })

  assert.equal(report.added, 1, 'apenas 1 destinatário novo válido e liberado')
  assert.equal(report.duplicatesInBatch, 1)
  assert.equal(report.invalid, 2)
  assert.equal(report.blockedOptOut, 1)

  // Segundo lote com o mesmo número já existente → duplicado existente.
  const report2 = await addRecipients(prisma, {
    campaignId: c.id,
    companyId: 'c1',
    entries: [{ raw: '11912345678', source: 'import', consentBasis: 'consent' }],
  })
  assert.equal(report2.duplicatesExisting, 1)
  assert.equal(report2.added, 0)
})

test('computeCampaignRisk: lista pequena com consentimento → baixo, sem aprovação', () => {
  const r = computeCampaignRisk({
    totalValid: 10, totalInvalid: 0, totalBlockedOptOut: 0,
    consentBasisCounts: { consent: 10 }, hasApprovedTemplate: true, messageBody: 'Olá',
  })
  assert.equal(r.level, 'low')
  assert.equal(r.requiresApproval, false)
})

test('computeCampaignRisk: lista grande + sem template + base fraca → alto, exige aprovação', () => {
  const r = computeCampaignRisk({
    totalValid: 600, totalInvalid: 200, totalBlockedOptOut: 0,
    consentBasisCounts: { legitimate_interest: 600 }, hasApprovedTemplate: false,
    messageBody: 'Confira https://exemplo.com',
  })
  assert.equal(r.level, 'high')
  assert.equal(r.requiresApproval, true)
  assert.ok(r.score >= 60)
})
