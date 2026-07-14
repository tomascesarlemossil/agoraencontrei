import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import { parseMegaListing, MegaLeiloesScraper } from '../src/services/scrapers/mega-scraper.js'

// Fixture espelhando o markup REAL do megaleiloes.com.br (2 cards).
const CARD = (o: {
  url: string; title: string; id: string; city: string; uf: string;
  modalidade: string; status: string; date: string; price: string;
}) => `
<div class="card"><div class="wrap">
  <a class="card-title" href="${o.url}?utm_source=megaleiloes&utm_medium=link" data-pjax="0">${o.title}</a>
  <div class="card-number pull-left">X${o.id}</div>
  <a class="card-locality" href="#" title="${o.city}, ${o.uf}" data-pjax="0">${o.city}, ${o.uf}</a>
</div>
<div class="card-instance"><div class="card-instance-title"><a href="#" data-pjax="0">${o.modalidade}</a>
  <div class="card-batch-number">Lote 1</div></div>
  <div class="card-instance-info"><div class="card-status">${o.status}</div>
  <span class="card-first-instance-date"><b>Data:</b> ${o.date} às 10:00</span></div>
</div>
<div class="card-price">R$ ${o.price}</div></div>`

const FIXTURE = `<html><body>
${CARD({ url: 'https://www.megaleiloes.com.br/imoveis/casas/pr/nova-prata-do-iguacu/casa-136-m2-x126419', title: 'Casa 136 m² - Nova Prata do Iguaçu - PR', id: '126419', city: 'Nova Prata Do Iguaçu', uf: 'PR', modalidade: 'Extrajudicial', status: 'Aberto para lances', date: '14/07/2026', price: '256.000,00' })}
${CARD({ url: 'https://www.megaleiloes.com.br/imoveis/apartamentos/ba/salvador/apartamento-74-m2-x126441', title: 'Apartamento 74 m² - Salvador - BA', id: '126441', city: 'Salvador', uf: 'BA', modalidade: 'Judicial', status: 'Arrematado', date: '01/03/2026', price: '180.000,00' })}
</body></html>`

// ── Puro ────────────────────────────────────────────────────────────────────
test('parseMegaListing extrai os cards do HTML real', () => {
  const items = parseMegaListing(FIXTURE)
  assert.equal(items.length, 2)

  const casa = items[0]
  assert.equal(casa.externalId, 'mega-126419')
  assert.equal(casa.source, 'EXTRAJUDICIAL', 'Extrajudicial → source EXTRAJUDICIAL')
  assert.equal(casa.auctioneerName, 'Mega Leilões')
  assert.equal(casa.propertyType, 'HOUSE')
  assert.equal(casa.city, 'Nova Prata Do Iguaçu')
  assert.equal(casa.state, 'PR')
  assert.equal(casa.status, 'OPEN')
  assert.equal(casa.minimumBid, 256000)
  assert.equal(casa.sourceUrl, 'https://www.megaleiloes.com.br/imoveis/casas/pr/nova-prata-do-iguacu/casa-136-m2-x126419', 'sourceUrl sem utm')
  assert.equal(casa.auctionDate?.toISOString().slice(0, 10), '2026-07-14')

  const apto = items[1]
  assert.equal(apto.externalId, 'mega-126441')
  assert.equal(apto.source, 'JUDICIAL', 'Judicial → source JUDICIAL')
  assert.equal(apto.propertyType, 'APARTMENT')
  assert.equal(apto.state, 'BA')
  assert.equal(apto.status, 'SOLD', 'Arrematado → SOLD')
  assert.equal(apto.minimumBid, 180000)
})

test('parseMegaListing tolera HTML vazio', () => {
  assert.deepEqual(parseMegaListing('<html></html>'), [])
})

// ── Integração: run() completo via BaseScraper (fetch mockado) ──────────────
const DB = process.env.TEST_DATABASE_URL

test('MegaLeiloesScraper.run() ingere os lotes e gera snapshots', { skip: DB ? false : 'defina TEST_DATABASE_URL' }, async () => {
  const prisma = new PrismaClient({ datasourceUrl: DB })
  const mockFetch = (async (url: any) => {
    if (String(url).includes('pagina=')) return new Response('<html></html>', { status: 200 })
    return new Response(FIXTURE, { status: 200 })
  }) as typeof fetch

  try {
    await prisma.auction.deleteMany({ where: { externalId: { in: ['mega-126419', 'mega-126441'] } } })
    const scraper = new MegaLeiloesScraper(prisma, 2, mockFetch)
    const r = await scraper.run()
    assert.equal(r.created, 2, 'ingere 2 lotes')

    const casa = await prisma.auction.findFirst({ where: { externalId: 'mega-126419' } })
    assert.ok(casa, 'lote persistido')
    assert.equal(casa!.source, 'EXTRAJUDICIAL')
    assert.equal(Number(casa!.minimumBid), 256000)
    assert.ok(casa!.sourceUrl?.includes('megaleiloes'), 'sourceUrl = página de detalhe (Fase 3 usa para desfecho)')
    assert.ok(casa!.firstSeenAt && casa!.lastSeenAt, 'ciclo de vida preenchido')
    const snaps = await prisma.auctionSnapshot.count({ where: { auctionId: casa!.id } })
    assert.equal(snaps, 1, 'snapshot inicial gravado (Fase 1)')

    // Limpeza
    for (const eid of ['mega-126419', 'mega-126441']) {
      const a = await prisma.auction.findFirst({ where: { externalId: eid }, select: { id: true } })
      if (a) { await prisma.auctionSnapshot.deleteMany({ where: { auctionId: a.id } }); await prisma.auction.delete({ where: { id: a.id } }) }
    }
  } finally {
    await prisma.$disconnect()
  }
})
