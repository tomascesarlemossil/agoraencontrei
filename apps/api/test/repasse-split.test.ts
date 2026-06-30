import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scheduleRepasseWithSplit } from '../src/services/repasse.service.js'

/** Mock mínimo do Prisma que captura os ScheduledRepasse criados. */
function mockPrisma(beneficiaries: any[]) {
  const created: any[] = []
  const prisma: any = {
    repasseBeneficiary: { findMany: async () => beneficiaries },
    scheduledRepasse: {
      create: async ({ data }: any) => {
        created.push(data)
        return { id: `r${created.length}`, ...data }
      },
    },
    tenant: { findUnique: async () => null },
  }
  return { prisma, created }
}

test('rateio: sem beneficiários → 1 repasse de 100% para o fallback', async () => {
  const { prisma, created } = mockPrisma([])
  const res = await scheduleRepasseWithSplit(prisma, {
    companyId: 'c1',
    contractId: 'k1',
    fallbackLandlordId: 'L1',
    grossValue: 3000,
    commissionPercent: 10,
  })
  assert.equal(res.length, 1)
  assert.equal(created.length, 1)
  assert.equal(Number(created[0].grossValue), 3000)
  assert.equal(created[0].landlordId, 'L1')
  assert.equal(Number(created[0].commissionValue), 300)
  assert.equal(Number(created[0].netValue), 2700)
})

test('rateio: 60/40 entre dois proprietários, comissão 10%', async () => {
  const { prisma, created } = mockPrisma([
    { id: 'b1', clientId: 'A', name: 'Dono A', percentage: 60, role: 'OWNER' },
    { id: 'b2', clientId: 'B', name: 'Dono B', percentage: 40, role: 'OWNER' },
  ])
  const res = await scheduleRepasseWithSplit(prisma, {
    companyId: 'c1',
    contractId: 'k1',
    fallbackLandlordId: 'L1',
    grossValue: 3000,
    commissionPercent: 10,
  })
  assert.equal(res.length, 2)
  const gross = created.map((c) => Number(c.grossValue))
  assert.deepEqual(gross, [1800, 1200])
  // soma dos brutos === total
  assert.equal(gross.reduce((a, b) => a + b, 0), 3000)
  // comissão e líquido por parte
  assert.equal(Number(created[0].commissionValue), 180)
  assert.equal(Number(created[0].netValue), 1620)
  assert.equal(Number(created[1].netValue), 1080)
  // destinos corretos
  assert.equal(created[0].landlordId, 'A')
  assert.equal(created[1].landlordId, 'B')
})

test('rateio: 3 partes 33.33/33.33/33.34 fecha em centavos', async () => {
  const { prisma, created } = mockPrisma([
    { id: 'b1', clientId: 'A', name: 'A', percentage: 33.33, role: 'OWNER' },
    { id: 'b2', clientId: 'B', name: 'B', percentage: 33.33, role: 'SECONDARY' },
    { id: 'b3', clientId: 'C', name: 'C', percentage: 33.34, role: 'FAVORED' },
  ])
  await scheduleRepasseWithSplit(prisma, {
    companyId: 'c1', contractId: 'k1', fallbackLandlordId: 'L1', grossValue: 1000, commissionPercent: 0,
  })
  const gross = created.map((c) => Number(c.grossValue))
  assert.equal(gross.reduce((a, b) => a + b, 0), 1000)
})

test('rateio: percentuais que não somam 100 lançam erro', async () => {
  const { prisma } = mockPrisma([
    { id: 'b1', clientId: 'A', name: 'A', percentage: 50, role: 'OWNER' },
    { id: 'b2', clientId: 'B', name: 'B', percentage: 30, role: 'OWNER' },
  ])
  await assert.rejects(
    () => scheduleRepasseWithSplit(prisma, {
      companyId: 'c1', contractId: 'k1', fallbackLandlordId: 'L1', grossValue: 1000,
    }),
    /RATEIO_INVALIDO/,
  )
})
