import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import { BaseScraper, type ScrapedAuction } from '../src/services/scrapers/base-scraper.js'

// Teste de integração do arquivo histórico de leilões (ciclo de vida + snapshots).
// Requer um Postgres real com o schema aplicado. Auto-pula sem TEST_DATABASE_URL
// para não quebrar o `pnpm test` em ambientes sem banco.
//
//   createdb agora_test && \
//   DATABASE_URL=postgres://... pnpm --filter @agoraencontrei/database db:push && \
//   TEST_DATABASE_URL=postgres://.../agora_test pnpm --filter @agoraencontrei/api test
const DB = process.env.TEST_DATABASE_URL

test('arquivo histórico: ciclo de vida + snapshots do BaseScraper', { skip: DB ? false : 'defina TEST_DATABASE_URL' }, async (t) => {
  const prisma = new PrismaClient({ datasourceUrl: DB })
  const externalId = 'IT-SNAP-A1'
  const src = 'LEILOEIRO'

  class TestScraper extends BaseScraper {
    items: ScrapedAuction[] = []
    constructor() { super(prisma, src, 'http://test.local') }
    async scrape(): Promise<ScrapedAuction[]> { return this.items }
  }
  // Hermético: sem city/neighborhood (pula geocode), com coverImage (pula street view)
  const baseItem = (o: Partial<ScrapedAuction> = {}): ScrapedAuction => ({
    externalId, source: src, title: 'Casa teste snapshot',
    coverImage: 'http://img.local/x.jpg', appraisalValue: 500000, minimumBid: 300000,
    status: 'OPEN', auctionDate: new Date('2026-09-01T12:00:00Z'), ...o,
  })
  const find = () => prisma.auction.findFirst({ where: { externalId, source: src as any } })
  const snaps = (auctionId: string) => prisma.auctionSnapshot.count({ where: { auctionId } })

  const cleanup = async () => {
    const rows = await prisma.auction.findMany({ where: { externalId, source: src as any }, select: { id: true } })
    for (const r of rows) await prisma.auctionSnapshot.deleteMany({ where: { auctionId: r.id } })
    await prisma.auction.deleteMany({ where: { externalId, source: src as any } })
  }

  try {
    await cleanup()
    const scraper = new TestScraper()

    // 1) Criação
    scraper.items = [baseItem()]
    const r1 = await scraper.run()
    assert.equal(r1.created, 1, 'run#1 deve criar 1 leilão')
    const a1 = (await find())!
    assert.ok(a1.firstSeenAt, 'firstSeenAt setado no create')
    assert.ok(a1.lastSeenAt, 'lastSeenAt setado no create')
    assert.equal(a1.disappearedAt, null, 'disappearedAt nulo no create')
    assert.equal(await snaps(a1.id), 1, '1 snapshot após create')
    const firstSeen0 = a1.firstSeenAt!.getTime()
    const lastSeen0 = a1.lastSeenAt!.getTime()

    // 2) Re-scrape idêntico (hash inalterado): bump de lastSeenAt, sem novo snapshot
    await new Promise((r) => setTimeout(r, 25))
    scraper.items = [baseItem()]
    const r2 = await scraper.run()
    assert.equal(r2.created, 0)
    assert.equal(r2.updated, 0)
    const a2 = (await find())!
    assert.equal(a2.firstSeenAt!.getTime(), firstSeen0, 'firstSeenAt inalterado')
    assert.ok(a2.lastSeenAt!.getTime() >= lastSeen0, 'lastSeenAt bumpado')
    assert.equal(await snaps(a2.id), 1, 'sem novo snapshot quando hash não muda')

    // 3) Reaparecimento limpa disappearedAt
    await prisma.auction.update({ where: { id: a2.id }, data: { disappearedAt: new Date(), status: 'SUSPENDED' } })
    scraper.items = [baseItem()]
    await scraper.run()
    const a3 = (await find())!
    assert.equal(a3.disappearedAt, null, 'disappearedAt limpo ao reaparecer')
    assert.equal(await snaps(a3.id), 1, 'ainda 1 snapshot (hash inalterado)')

    // 4) Mudança de conteúdo (novo hash) gera 2º snapshot
    scraper.items = [baseItem({ minimumBid: 250000 })]
    const r4 = await scraper.run()
    assert.equal(r4.updated, 1, 'run#4 deve atualizar')
    const a4 = (await find())!
    assert.equal(Number(a4.minimumBid), 250000, 'minimumBid atualizado')
    assert.equal(a4.firstSeenAt!.getTime(), firstSeen0, 'firstSeenAt inalterado após update')
    assert.equal(a4.disappearedAt, null, 'disappearedAt segue nulo')
    assert.equal(await snaps(a4.id), 2, '2 snapshots após mudança de hash')
    const latest = await prisma.auctionSnapshot.findFirst({ where: { auctionId: a4.id }, orderBy: { capturedAt: 'desc' } })
    assert.equal(Number(latest!.minimumBid), 250000, 'último snapshot reflete novo minimumBid')

    await cleanup()
  } finally {
    await prisma.$disconnect()
  }
})
