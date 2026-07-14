import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import {
  archiveAuctionDocuments,
  runAuctionArchiveBatch,
  classifyDocType,
  extractRegistryInfo,
  type ArchiveDeps,
} from '../src/services/auction-archive.service.js'

// ── Puros (sempre rodam, sem banco) ─────────────────────────────────────────
test('classifyDocType classifica por URL', () => {
  assert.equal(classifyDocType('https://x/edital-leilao.pdf'), 'EDITAL')
  assert.equal(classifyDocType('https://x/matricula-90123.pdf'), 'MATRICULA')
  assert.equal(classifyDocType('https://x/laudo-avaliacao.pdf'), 'LAUDO')
  assert.equal(classifyDocType('https://x/auto-de-arrematacao.pdf'), 'ATA')
  assert.equal(classifyDocType('https://x/planta.png'), 'OUTRO')
})

test('extractRegistryInfo extrai matrícula, cartório e processo', () => {
  const t = 'Imóvel objeto da Matrícula nº 90.123 do 2º Cartório de Registro de Imóveis de Franca, ' +
    'oriundo do processo 1234567-89.2024.8.26.0196.'
  const i = extractRegistryInfo(t)
  assert.equal(i.registryNumber, '90123')
  assert.match(i.registryOffice!, /Registro de Im[óo]veis/i)
  assert.equal(i.processNumber, '1234567-89.2024.8.26.0196')
})

// ── Integração (requer TEST_DATABASE_URL) ───────────────────────────────────
const DB = process.env.TEST_DATABASE_URL

test('arquivamento: download → S3 → AuctionDocument + extração', { skip: DB ? false : 'defina TEST_DATABASE_URL' }, async () => {
  const prisma = new PrismaClient({ datasourceUrl: DB })
  const EDITAL = 'https://leiloeiro.test/edital.html'
  const LAUDO = 'https://leiloeiro.test/laudo.pdf'
  const PDF_EDITAL = 'https://leiloeiro.test/edital.pdf'
  const html = '<html><body>Matrícula nº 90.123 do 2º Cartório de Registro de Imóveis de Franca. ' +
    'Processo 1234567-89.2024.8.26.0196.</body></html>'

  // Gera um PDF mínimo válido com uma linha de texto (para testar extração real).
  const makePdf = (line: string): Buffer => {
    const o = [
      '<</Type/Catalog/Pages 2 0 R>>',
      '<</Type/Pages/Kids[3 0 R]/Count 1>>',
      '<</Type/Page/Parent 2 0 R/MediaBox[0 0 2000 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>',
    ]
    const s = `BT /F1 12 Tf 20 120 Td (${line}) Tj ET`
    o.push(`<</Length ${s.length}>>\nstream\n${s}\nendstream`)
    o.push('<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>')
    let p = '%PDF-1.4\n'; const off: number[] = []
    o.forEach((x, i) => { off.push(p.length); p += `${i + 1} 0 obj\n${x}\nendobj\n` })
    const xr = p.length
    p += `xref\n0 ${o.length + 1}\n0000000000 65535 f \n`
    off.forEach(f => { p += String(f).padStart(10, '0') + ' 00000 n \n' })
    p += `trailer\n<</Size ${o.length + 1}/Root 1 0 R>>\nstartxref\n${xr}\n%%EOF`
    return Buffer.from(p, 'latin1')
  }
  const pdfEdital = makePdf('Imovel objeto da Matricula no 55.777 do 1o Oficio de Registro de Imoveis. Processo 7654321-01.2023.8.26.0196')

  const uploads: { key: string; size: number }[] = []
  const s3Ok: ArchiveDeps['s3'] = {
    isConfigured: () => true,
    upload: async (key, body) => { uploads.push({ key, size: body.length }); return `https://bucket.s3/${key}` },
  }
  const fetchImpl = (async (url: any) => {
    if (url === EDITAL) return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
    if (url === LAUDO) return new Response(new Uint8Array([1, 2, 3, 4, 5]), { status: 200, headers: { 'content-type': 'application/pdf' } })
    if (url === PDF_EDITAL) return new Response(pdfEdital, { status: 200, headers: { 'content-type': 'application/pdf' } })
    return new Response('', { status: 404 })
  }) as typeof fetch

  const mk = async (externalId: string, data: any = {}) => {
    await prisma.auction.deleteMany({ where: { externalId, source: 'LEILOEIRO' as any } })
    return prisma.auction.create({
      data: { externalId, source: 'LEILOEIRO' as any, title: 'Teste arq', slug: `arq-${externalId}-${Math.round(performance.now())}`, ...data },
    })
  }

  try {
    // 1) Arquivamento completo com S3 configurado
    const a1 = await mk('IT-ARQ-1', { editalUrl: EDITAL, documentsUrls: [LAUDO] })
    const r1 = await archiveAuctionDocuments(prisma, a1.id, { fetchImpl, s3: s3Ok })
    assert.equal(r1.archived, 2, 'arquiva 2 documentos')
    assert.equal(uploads.length, 2, '2 uploads ao S3')

    const docs = await prisma.auctionDocument.findMany({ where: { auctionId: a1.id }, orderBy: { type: 'asc' } })
    assert.equal(docs.length, 2)
    const edital = docs.find(d => d.type === 'EDITAL')!
    const laudo = docs.find(d => d.type === 'LAUDO')!
    assert.ok(edital.sha256 && edital.s3Url && edital.status === 'ARCHIVED', 'edital arquivado com sha256+s3Url')
    assert.match(edital.extractedText || '', /Matrícula/, 'texto extraído do HTML')
    assert.equal(edital.mimeType, 'text/html')
    assert.equal(laudo.extractedText, null, 'PDF não vira texto (sem parser)')
    assert.ok(laudo.s3Key?.endsWith('.pdf'), 's3Key do laudo com extensão .pdf')

    // Extração preencheu o leilão
    const a1b = (await prisma.auction.findUnique({ where: { id: a1.id } }))!
    assert.equal(a1b.registryNumber, '90123', 'matrícula preenchida')
    assert.match(a1b.registryOffice || '', /Registro de Im[óo]veis/i, 'cartório preenchido')
    assert.equal(a1b.processNumber, '1234567-89.2024.8.26.0196', 'processo preenchido')

    // 2) Idempotência: re-arquivar não duplica nem re-sobe
    const r2 = await archiveAuctionDocuments(prisma, a1.id, { fetchImpl, s3: s3Ok })
    assert.equal(r2.archived, 0, 're-run não arquiva nada novo')
    assert.equal(uploads.length, 2, 'nenhum upload adicional (dedup por sha256)')
    assert.equal(await prisma.auctionDocument.count({ where: { auctionId: a1.id } }), 2, 'sem linhas duplicadas')

    // 3) Sem S3 configurado → registro fica PENDING (mas texto/hash preservados)
    const noS3: ArchiveDeps['s3'] = { isConfigured: () => false, upload: async () => { throw new Error('n/a') } }
    const a2 = await mk('IT-ARQ-2', { editalUrl: EDITAL })
    await archiveAuctionDocuments(prisma, a2.id, { fetchImpl, s3: noS3 })
    const d2 = (await prisma.auctionDocument.findFirst({ where: { auctionId: a2.id } }))!
    assert.equal(d2.status, 'PENDING', 'sem S3 → PENDING')
    assert.equal(d2.s3Key, null, 'sem S3 → s3Key nulo')
    assert.ok(d2.extractedText && d2.sha256, 'texto e hash preservados mesmo sem S3')

    // 4) Batch pega leilão pendente e o arquiva
    const a3 = await mk('IT-ARQ-3', { editalUrl: EDITAL })
    const rb = await runAuctionArchiveBatch(prisma, 20, { fetchImpl, s3: s3Ok })
    assert.ok(rb.processed >= 1, 'batch processa ao menos 1 leilão pendente')
    assert.ok((await prisma.auctionDocument.count({ where: { auctionId: a3.id } })) >= 1, 'a3 arquivado pelo batch')

    // 5) Edital em PDF → extrai matrícula/cartório/processo do texto do PDF
    const a4 = await mk('IT-ARQ-4', { editalUrl: PDF_EDITAL })
    await archiveAuctionDocuments(prisma, a4.id, { fetchImpl, s3: s3Ok })
    const d4 = (await prisma.auctionDocument.findFirst({ where: { auctionId: a4.id } }))!
    assert.match(d4.extractedText || '', /Matricula/, 'texto extraído do PDF (unpdf)')
    assert.equal(d4.type, 'EDITAL')
    const a4b = (await prisma.auction.findUnique({ where: { id: a4.id } }))!
    assert.equal(a4b.registryNumber, '55777', 'matrícula extraída do PDF')
    assert.equal(a4b.processNumber, '7654321-01.2023.8.26.0196', 'processo extraído do PDF')

    // Limpeza
    for (const id of [a1.id, a2.id, a3.id, a4.id]) {
      await prisma.auctionDocument.deleteMany({ where: { auctionId: id } })
      await prisma.auction.deleteMany({ where: { id } })
    }
  } finally {
    await prisma.$disconnect()
  }
})
