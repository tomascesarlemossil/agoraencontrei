import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import {
  computeIdentityKey,
  resolveAuctionIdentity,
  getPropertyTimeline,
  runAuctionIdentityBatch,
} from '../src/services/auction-identity.service.js'

// ── Puros ───────────────────────────────────────────────────────────────────
test('computeIdentityKey: matrícula+cartório forte; fallback endereço; null se insuficiente', () => {
  assert.deepEqual(
    computeIdentityKey({ registryNumber: '90.123', registryOffice: '2º Cartório de Registro de Imóveis' }),
    { registryKey: '2cartorioderegistrodeimoveis#90123' },
  )
  const addr = computeIdentityKey({ city: 'Franca', state: 'SP', street: 'Rua A', number: '100' })
  assert.ok(addr?.addressKey?.includes('franca'))
  assert.equal(computeIdentityKey({ city: 'Franca' }), null, 'só cidade é insuficiente')
})

// ── Integração ──────────────────────────────────────────────────────────────
const DB = process.env.TEST_DATABASE_URL

test('identidade canônica agrupa o mesmo imóvel entre leilões + timeline', { skip: DB ? false : 'defina TEST_DATABASE_URL' }, async () => {
  const prisma = new PrismaClient({ datasourceUrl: DB })
  const tag = `IDN-${Math.round(performance.now())}`
  const mk = (o: any) => prisma.auction.create({
    data: {
      source: 'JUDICIAL' as any, status: (o.status || 'CLOSED') as any,
      title: o.title, slug: `${tag}-${o.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      externalId: `${tag}-${o.title}`,
      city: 'Franca', state: 'SP', neighborhood: 'Centro',
      registryNumber: o.registryNumber, registryOffice: o.registryOffice,
      street: o.street, number: o.number,
      minimumBid: o.minimumBid, soldValue: o.soldValue, auctionDate: o.auctionDate,
    },
  })

  try {
    // Mesmo imóvel (matrícula 90123 / mesmo cartório), duas idas a leilão
    const a2023 = await mk({ title: 'leilao 2023', registryNumber: '90.123', registryOffice: '2º CRI Franca', minimumBid: 200000, auctionDate: new Date('2023-05-01') })
    const a2024 = await mk({ title: 'leilao 2024', registryNumber: '90123', registryOffice: '2 CRI Franca', minimumBid: 180000, soldValue: 210000, status: 'SOLD', auctionDate: new Date('2024-08-01') })
    // Imóvel diferente
    const other = await mk({ title: 'outro imovel', registryNumber: '55777', registryOffice: '1º CRI Franca', minimumBid: 300000, auctionDate: new Date('2024-01-01') })

    const id1 = await resolveAuctionIdentity(prisma, a2023.id)
    const id2 = await resolveAuctionIdentity(prisma, a2024.id)
    const id3 = await resolveAuctionIdentity(prisma, other.id)

    assert.ok(id1 && id2 && id3)
    assert.equal(id1, id2, 'mesmo imóvel (matrícula+cartório) → mesma identidade')
    assert.notEqual(id1, id3, 'imóvel diferente → identidade diferente')

    const identity = (await prisma.auctionPropertyIdentity.findUnique({ where: { id: id1! } }))!
    assert.equal(identity.auctionCount, 2, 'identidade agrupa 2 leilões')
    assert.equal(identity.firstAuctionAt?.getFullYear(), 2023)
    assert.equal(identity.lastAuctionAt?.getFullYear(), 2024)

    // Timeline em ordem cronológica
    const tl: any = await getPropertyTimeline(prisma, id1!)
    assert.equal(tl.timeline.length, 2)
    assert.match(tl.timeline[0].title, /2023/, 'primeiro é o de 2023')
    assert.match(tl.timeline[1].title, /2024/, 'depois o de 2024')
    assert.equal(tl.timeline[1].soldValue, 210000, 'arremate do 2º leilão')
    assert.ok(tl.timeline[0].url.includes('/leiloes/'))

    // Fallback por endereço (sem matrícula), dois leilões do mesmo endereço
    const b1 = await mk({ title: 'end 2022', street: 'Rua das Flores', number: '250', minimumBid: 100000, auctionDate: new Date('2022-03-01') })
    const b2 = await mk({ title: 'end 2025', street: 'Rua das Flores', number: '250', minimumBid: 90000, auctionDate: new Date('2025-02-01') })
    const bid1 = await resolveAuctionIdentity(prisma, b1.id)
    const bid2 = await resolveAuctionIdentity(prisma, b2.id)
    assert.equal(bid1, bid2, 'mesmo endereço completo → mesma identidade (fallback)')

    // Batch vincula pendentes (idempotente — os já vinculados não repetem)
    const rb = await runAuctionIdentityBatch(prisma, 100)
    assert.ok(rb.processed >= 0)

    // Limpeza
    const ids = [id1, id3, bid1].filter(Boolean) as string[]
    await prisma.auction.deleteMany({ where: { externalId: { startsWith: tag } } })
    await prisma.auctionPropertyIdentity.deleteMany({ where: { id: { in: ids } } })
  } finally {
    await prisma.$disconnect()
  }
})
