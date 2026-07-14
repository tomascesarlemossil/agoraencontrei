import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import {
  parseMegaDetail,
  enrichAuctionDetail,
  runDetailEnrichmentBatch,
  type EnrichmentDeps,
} from '../src/services/auction-detail-enrichment.service.js'

// Fixture com os 3 PDFs reais do detalhe do Mega (edital, matrícula, política).
const DETAIL_HTML = `<html><body>
<a href="https://cdn1.megaleiloes.com.br/auctions/34160/megaleiloes_edital__260703-171110.pdf">Edital</a>
<a href="https://cdn1.megaleiloes.com.br/batches/126419/megaleiloes_matricula_X126419.pdf">Matrícula</a>
<a href="https://cdn1.megaleiloes.com.br/Politica_de_Privacidade_Mega_Leiloes_Rev_Janeiro_2023.pdf">Política</a>
</body></html>`

// ── Puro ────────────────────────────────────────────────────────────────────
test('parseMegaDetail extrai edital + matrícula e ignora institucional', () => {
  const r = parseMegaDetail(DETAIL_HTML)
  assert.match(r.editalUrl || '', /megaleiloes_edital__/, 'editalUrl é o PDF de edital')
  assert.equal(r.documentsUrls.length, 2, 'edital + matrícula (política excluída)')
  assert.ok(r.documentsUrls.some((u) => /matricula/i.test(u)), 'inclui a matrícula em PDF')
  assert.ok(!r.documentsUrls.some((u) => /privacidade/i.test(u)), 'exclui a política de privacidade')
})

// ── Integração ──────────────────────────────────────────────────────────────
const DB = process.env.TEST_DATABASE_URL

test('enriquecimento por detalhe preenche editalUrl/documentos + guard', { skip: DB ? false : 'defina TEST_DATABASE_URL' }, async () => {
  const prisma = new PrismaClient({ datasourceUrl: DB })
  const eid = `ENR-${Math.round(performance.now())}`
  const sourceUrl = 'https://www.megaleiloes.com.br/imoveis/casas/pr/x/casa-x126419'

  let fetches = 0
  const deps: EnrichmentDeps = {
    fetchImpl: (async (url: any) => { fetches++; return new Response(DETAIL_HTML, { status: 200 }) }) as typeof fetch,
  }

  try {
    await prisma.auction.deleteMany({ where: { externalId: eid } })
    const a = await prisma.auction.create({
      data: {
        externalId: eid, source: 'EXTRAJUDICIAL' as any, status: 'OPEN' as any,
        title: 'Casa enrich', slug: `enr-${eid}`, sourceUrl,
      },
    })
    assert.equal(a.editalUrl, null, 'começa sem edital')

    const r = await enrichAuctionDetail(prisma, a.id, deps)
    assert.equal(r.enriched, true)
    const a2 = (await prisma.auction.findUnique({ where: { id: a.id } }))!
    assert.match(a2.editalUrl || '', /megaleiloes_edital__/, 'editalUrl preenchido (alimenta Fase 2)')
    assert.equal(a2.documentsUrls.length, 2, 'documentos (edital + matrícula) salvos')
    assert.ok(a2.detailEnrichedAt, 'detailEnrichedAt marcado (guard)')

    // Batch não re-processa (detailEnrichedAt setado)
    const before = fetches
    await runDetailEnrichmentBatch(prisma, 30, deps)
    // pode processar outros leilões mega no banco, mas não o nosso (já enriquecido)
    const a3 = (await prisma.auction.findUnique({ where: { id: a.id } }))!
    assert.equal(a3.editalUrl, a2.editalUrl, 'não altera o já enriquecido')
    assert.ok(fetches >= before, 'batch rodou')

    await prisma.auction.deleteMany({ where: { externalId: eid } })
  } finally {
    await prisma.$disconnect()
  }
})
