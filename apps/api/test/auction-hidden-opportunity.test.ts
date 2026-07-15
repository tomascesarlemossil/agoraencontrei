import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildHiddenOpportunities } from '../src/services/auction-hidden-opportunity.service.js'

function fakePrisma(rows: any[]) {
  return { auction: { findMany: async () => rows } } as any
}

const now = new Date('2026-07-15T12:00:00Z')

test('buildHiddenOpportunities: rankeia e explica oportunidades ocultas', async () => {
  const rows = [
    // Forte: 2ª praça, republicado, preço/m² muito abaixo, sem lance
    {
      slug: 'oculta-1', title: 'Casa republicada', city: 'Franca', state: 'SP', neighborhood: 'Centro',
      status: 'SECOND_ROUND', source: 'CAIXA', auctioneerName: null, coverImage: null,
      minimumBid: 100000, appraisalValue: 300000, discountPercent: 45, totalArea: 100, views: 0,
      currentBid: null, auctionEndDate: null, identity: { auctionCount: 3 },
    },
    // Referências de mercado (preço/m² alto → puxa a mediana pra cima)
    { slug: 'ref-1', title: 'Ref 1', city: 'Franca', state: 'SP', neighborhood: 'Centro', status: 'OPEN', source: 'CAIXA', auctioneerName: null, coverImage: null, minimumBid: 400000, appraisalValue: 450000, discountPercent: 10, totalArea: 100, views: 50, currentBid: 5000, auctionEndDate: null, identity: { auctionCount: 1 } },
    { slug: 'ref-2', title: 'Ref 2', city: 'Franca', state: 'SP', neighborhood: 'Centro', status: 'OPEN', source: 'CAIXA', auctioneerName: null, coverImage: null, minimumBid: 380000, appraisalValue: 420000, discountPercent: 8, totalArea: 100, views: 40, currentBid: 3000, auctionEndDate: null, identity: { auctionCount: 1 } },
    { slug: 'ref-3', title: 'Ref 3', city: 'Franca', state: 'SP', neighborhood: 'Centro', status: 'OPEN', source: 'CAIXA', auctioneerName: null, coverImage: null, minimumBid: 420000, appraisalValue: 460000, discountPercent: 9, totalArea: 100, views: 60, currentBid: 7000, auctionEndDate: null, identity: { auctionCount: 1 } },
  ]
  const res = await buildHiddenOpportunities(fakePrisma(rows), { city: 'Franca' }, now)
  assert.ok(res.items.length >= 1)
  const top = res.items[0]
  assert.equal(top.slug, 'oculta-1')
  assert.ok(top.hiddenIndex >= 50, `índice alto esperado, veio ${top.hiddenIndex}`)
  assert.ok(top.reasons.some((r) => /republicado/i.test(r)))
  assert.ok(top.reasons.some((r) => /abaixo da mediana/i.test(r)))
})

test('buildHiddenOpportunities: base vazia não quebra', async () => {
  const res = await buildHiddenOpportunities(fakePrisma([]), {}, now)
  assert.equal(res.total, 0)
  assert.deepEqual(res.items, [])
})

test('buildHiddenOpportunities: imóvel comum (sem sinais) não entra no radar', async () => {
  const rows = Array.from({ length: 6 }, (_, i) => ({
    slug: `comum-${i}`, title: `Comum ${i}`, city: 'Franca', state: 'SP', neighborhood: 'Centro',
    status: 'OPEN', source: 'CAIXA', auctioneerName: null, coverImage: null,
    minimumBid: 400000, appraisalValue: 450000, discountPercent: 10, totalArea: 100, views: 50,
    currentBid: 5000, auctionEndDate: null, identity: { auctionCount: 1 },
  }))
  const res = await buildHiddenOpportunities(fakePrisma(rows), {}, now)
  assert.equal(res.total, 0)
})
