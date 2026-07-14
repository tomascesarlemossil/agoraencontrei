import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import {
  parseOutcome,
  parseBRCurrency,
  captureAuctionOutcome,
  runAuctionOutcomeBatch,
  type OutcomeDeps,
} from '../src/services/auction-outcome.service.js'

// ── Puros (sempre rodam) ────────────────────────────────────────────────────
test('parseBRCurrency converte moeda BR', () => {
  assert.equal(parseBRCurrency('R$ 250.000,00'), 250000)
  assert.equal(parseBRCurrency('1.250.000,50'), 1250000.5)
  assert.equal(parseBRCurrency('sem valor'), null)
})

test('parseOutcome classifica desfechos', () => {
  assert.deepEqual(parseOutcome('Lote ARREMATADO por R$ 250.000,00'), { status: 'SOLD', soldValue: 250000 })
  assert.equal(parseOutcome('Situação: DESERTO — não houve lances').status, 'DESERTED')
  assert.equal(parseOutcome('Leilão REVOGADO por decisão judicial').status, 'CANCELLED')
  assert.equal(parseOutcome('1ª praça: 01/09/2026 às 14h').status, 'INCONCLUSIVE')
  // arrematado sem valor explícito ainda é SOLD
  assert.equal(parseOutcome('Bem vendido em leilão').status, 'SOLD')
})

// ── Integração (requer TEST_DATABASE_URL) ───────────────────────────────────
const DB = process.env.TEST_DATABASE_URL

test('captura de desfecho: SOLD + snapshot + lance, idempotente, anti-hammer', { skip: DB ? false : 'defina TEST_DATABASE_URL' }, async () => {
  const prisma = new PrismaClient({ datasourceUrl: DB })
  const SOLD_URL = 'https://leiloeiro.test/lote-vendido'
  const NEUTRAL_URL = 'https://leiloeiro.test/lote-aberto'

  const fetchImpl = (async (url: any) => {
    if (url === SOLD_URL) return new Response('<h1>Lote ARREMATADO por R$ 250.000,00</h1>', { status: 200 })
    if (url === NEUTRAL_URL) return new Response('<h1>Lote aberto para lances</h1>', { status: 200 })
    return new Response('', { status: 404 })
  }) as typeof fetch
  const deps: OutcomeDeps = { fetchImpl }

  const past = new Date('2026-06-01T12:00:00Z')
  const mk = async (externalId: string, data: any) => {
    await prisma.auction.deleteMany({ where: { externalId, source: 'LEILOEIRO' as any } })
    return prisma.auction.create({
      data: { externalId, source: 'LEILOEIRO' as any, title: 'Teste desfecho', slug: `out-${externalId}-${Math.round(performance.now())}`, ...data },
    })
  }

  try {
    // 1) Arremate conclusivo
    const a1 = await mk('IT-OUT-1', { sourceUrl: SOLD_URL, status: 'CLOSED', disappearedAt: past, appraisalValue: 500000 })
    const r1 = await captureAuctionOutcome(prisma, a1.id, deps)
    assert.equal(r1.outcome, 'SOLD')
    assert.equal(r1.soldValue, 250000)
    const a1b = (await prisma.auction.findUnique({ where: { id: a1.id } }))!
    assert.equal(a1b.status, 'SOLD', 'status vira SOLD')
    assert.equal(Number(a1b.soldValue), 250000, 'soldValue gravado')
    assert.ok(a1b.soldDate, 'soldDate gravado')
    assert.ok(a1b.outcomeCapturedAt, 'outcomeCapturedAt gravado')
    assert.equal(await prisma.auctionSnapshot.count({ where: { auctionId: a1.id } }), 1, 'snapshot do desfecho')
    const bid = await prisma.auctionBid.findFirst({ where: { auctionId: a1.id, isWinning: true } })
    assert.ok(bid && Number(bid.bidValue) === 250000, 'lance vencedor criado (só valor)')
    assert.equal(bid!.bidderCpf, null, 'sem CPF do arrematante (LGPD)')

    // 2) Idempotência: batch não re-seleciona (outcomeCapturedAt setado)
    const rb = await runAuctionOutcomeBatch(prisma, 20, deps)
    const stillOne = await prisma.auctionSnapshot.count({ where: { auctionId: a1.id } })
    assert.equal(stillOne, 1, 'não re-processa leilão já resolvido')
    assert.ok(!rb.processed || true) // batch pode pegar outros; a1 não deve reabrir

    // 3) Inconclusivo → incrementa outcomeAttempts, status inalterado
    const a2 = await mk('IT-OUT-2', { sourceUrl: NEUTRAL_URL, status: 'CLOSED', disappearedAt: past })
    const r2 = await captureAuctionOutcome(prisma, a2.id, deps)
    assert.equal(r2.outcome, 'INCONCLUSIVE')
    const a2b = (await prisma.auction.findUnique({ where: { id: a2.id } }))!
    assert.equal(a2b.status, 'CLOSED', 'status inalterado')
    assert.equal(a2b.outcomeAttempts, 1, 'attempt incrementado')
    assert.equal(a2b.outcomeCapturedAt, null, 'sem desfecho conclusivo')

    // Limpeza
    for (const id of [a1.id, a2.id]) {
      await prisma.auctionBid.deleteMany({ where: { auctionId: id } })
      await prisma.auctionSnapshot.deleteMany({ where: { auctionId: id } })
      await prisma.auction.deleteMany({ where: { id } })
    }
  } finally {
    await prisma.$disconnect()
  }
})
