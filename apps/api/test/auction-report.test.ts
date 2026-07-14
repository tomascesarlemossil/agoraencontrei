import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import { buildAuctionReport, queryAuctions } from '../src/services/auction-report.service.js'
import { executeTool } from '../src/services/tomas.service.js'

const DB = process.env.TEST_DATABASE_URL

test('relatório de leilões por localização/tipo/valor + tool do Tomás', { skip: DB ? false : 'defina TEST_DATABASE_URL' }, async () => {
  const prisma = new PrismaClient({ datasourceUrl: DB })
  const tag = `RPT-${Math.round(performance.now())}`

  const mk = (o: any) => prisma.auction.create({
    data: {
      source: (o.source || 'LEILOEIRO') as any, status: (o.status || 'OPEN') as any,
      title: o.title, slug: `${tag}-${o.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      externalId: `${tag}-${o.title}`,
      city: o.city, neighborhood: o.neighborhood, state: o.state,
      propertyType: (o.propertyType || 'HOUSE') as any, category: (o.category || 'RESIDENTIAL') as any,
      appraisalValue: o.appraisalValue, minimumBid: o.minimumBid, soldValue: o.soldValue,
      discountPercent: o.discountPercent, totalArea: o.totalArea,
    },
  })

  try {
    // Franca/Centro — 2 residenciais arrematados + 1 comercial aberto
    await mk({ title: 'casa centro', city: 'Franca', neighborhood: 'Centro', state: 'SP', propertyType: 'HOUSE', category: 'RESIDENTIAL', status: 'SOLD', appraisalValue: 400000, minimumBid: 200000, soldValue: 250000, discountPercent: 50, totalArea: 100 })
    await mk({ title: 'apto centro', city: 'Franca', neighborhood: 'Centro', state: 'SP', propertyType: 'APARTMENT', category: 'RESIDENTIAL', status: 'SOLD', appraisalValue: 300000, minimumBid: 150000, soldValue: 180000, discountPercent: 50, totalArea: 60 })
    await mk({ title: 'loja centro', city: 'Franca', neighborhood: 'Centro', state: 'SP', propertyType: 'STORE', category: 'COMMERCIAL', status: 'OPEN', appraisalValue: 900000, minimumBid: 500000 })
    // ruído que deve ser excluído: cancelado no Centro + imóvel em outra cidade
    await mk({ title: 'cancelado centro', city: 'Franca', neighborhood: 'Centro', state: 'SP', category: 'RESIDENTIAL', status: 'CANCELLED', minimumBid: 999 })
    await mk({ title: 'casa sp', city: 'São Paulo', neighborhood: 'Centro', state: 'SP', category: 'RESIDENTIAL', status: 'SOLD', soldValue: 999999 })

    // Relatório: residenciais no Centro de Franca
    const rep: any = await buildAuctionReport(prisma, { city: 'Franca', neighborhood: 'Centro', category: 'RESIDENTIAL' })
    assert.equal(rep.total, 2, 'só as 2 residenciais do Centro/Franca (comercial, cancelado e outra cidade fora)')
    assert.equal(rep.values.soldValue.count, 2)
    assert.equal(rep.values.soldValue.min, 180000)
    assert.equal(rep.values.soldValue.max, 250000)
    assert.equal(rep.values.soldValue.median, 215000, 'mediana dos arremates')
    assert.equal(rep.values.soldValue.avg, 215000)
    assert.equal(rep.counts.byPropertyType.HOUSE, 1)
    assert.equal(rep.counts.byPropertyType.APARTMENT, 1)
    assert.equal(rep.counts.sold, 2)
    assert.equal(rep.topNeighborhoods[0].neighborhood, 'Centro')
    assert.ok(rep.values.pricePerM2 && rep.values.pricePerM2.count === 2, 'preço/m² calculado')

    // soldOnly + fonte + janela
    const repSold: any = await buildAuctionReport(prisma, { city: 'Franca', soldOnly: true })
    assert.equal(repSold.total, 2, 'soldOnly traz só arrematados')

    // Listagem
    const list = await queryAuctions(prisma, { city: 'Franca', neighborhood: 'Centro', soldOnly: true }, 10)
    assert.equal(list.length, 2)
    assert.ok(list[0].url.includes('/leiloes/'), 'inclui link público')
    assert.ok(list.every(a => a.soldValue != null), 'arrematados têm valor')

    // Tool do Tomás end-to-end (cérebro marketplace, anônimo → policy libera)
    const raw = await executeTool(prisma, 'relatorio_leiloes',
      { city: 'Franca', neighborhood: 'Centro', category: 'RESIDENTIAL' },
      undefined, 'site', { brain: 'marketplace', roleRank: 0 })
    const parsed = JSON.parse(raw)
    assert.equal(parsed.total, 2, 'tool retorna o relatório')
    assert.ok(!parsed.error, 'policy não bloqueou (dado público, anônimo)')

    const rawList = await executeTool(prisma, 'buscar_leiloes',
      { city: 'Franca', soldOnly: true }, undefined, 'site', { brain: 'marketplace', roleRank: 0 })
    assert.equal(JSON.parse(rawList).found, 2, 'buscar_leiloes retorna listagem')

    // Limpeza
    await prisma.auction.deleteMany({ where: { externalId: { startsWith: tag } } })
  } finally {
    await prisma.$disconnect()
  }
})
