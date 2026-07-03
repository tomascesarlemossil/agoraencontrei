import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createReadStream, readFileSync } from 'fs'
import { createInterface } from 'readline'
import { createGunzip } from 'zlib'
import path from 'path'
import {
  slugify,
  textToHtml,
  excerptFrom,
  buildPostData,
  CATEGORIES,
  type SeoRecord,
} from '../prisma/seo-transform'

const ROOT = path.join(__dirname, '..')
const DATA = path.join(ROOT, 'data/seo-posts/franca-seo-posts.ndjson.gz')
const SCHEMA = path.join(ROOT, 'prisma/schema.prisma')

function blogPostFields(): Set<string> {
  const block = readFileSync(SCHEMA, 'utf8').match(/model BlogPost \{([\s\S]*?)\n\}/)![1]
  const fields = new Set<string>()
  for (const raw of block.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('//') || line.startsWith('@@')) continue
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+\S/)
    if (m) fields.add(m[1])
  }
  return fields
}

const rec = (over: Partial<SeoRecord> = {}): SeoRecord => ({
  extId: 'AE-001', slug: 'x', tema: 'Leilões de Imóveis', categoria: 'leilao-de-imoveis',
  cidade: 'Franca', uf: 'SP', bairro: 'Centro', titulo: 'Título',
  keywords: 'a, b; c', metaDesc: 'meta', conteudo: 'Frase um. Frase dois! Frase três?', ...over,
})

// ── slugify ──────────────────────────────────────────────────────────────
test('slugify: remove acentos, minúsculo, hífens', () => {
  assert.equal(slugify('Leilão no Jardim São Sebastião'), 'leilao-no-jardim-sao-sebastiao')
})
test('slugify: sem hífen no início/fim e sem duplicados', () => {
  assert.equal(slugify('  --Olá  Mundo--  '), 'ola-mundo')
})
test('slugify: respeita maxlen', () => {
  assert.ok(slugify('a'.repeat(200)).length <= 100)
})

// ── textToHtml ───────────────────────────────────────────────────────────
test('textToHtml: envolve em <p> e agrupa ~2 frases', () => {
  const html = textToHtml('Uma frase. Duas frases. Três frases. Quatro frases.')
  assert.equal((html.match(/<p>/g) ?? []).length, 2)
  assert.ok(html.startsWith('<p>'))
})
test('textToHtml: vazio -> string vazia', () => {
  assert.equal(textToHtml('   '), '')
})
test('textToHtml: texto sem pontuação vira um <p>', () => {
  assert.equal(textToHtml('sem pontuacao final'), '<p>sem pontuacao final</p>')
})

// ── excerptFrom ──────────────────────────────────────────────────────────
test('excerptFrom: usa metaDesc quando presente', () => {
  assert.equal(excerptFrom(rec({ metaDesc: 'resumo curto' })), 'resumo curto')
})
test('excerptFrom: trunca em 220 com reticências', () => {
  const long = 'x'.repeat(400)
  const out = excerptFrom(rec({ metaDesc: long }))
  assert.ok(out.length <= 220)
  assert.ok(out.endsWith('…'))
})
test('excerptFrom: cai no conteúdo quando metaDesc vazio', () => {
  assert.equal(excerptFrom(rec({ metaDesc: '', conteudo: 'do corpo' })), 'do corpo')
})

// ── buildPostData ────────────────────────────────────────────────────────
test('buildPostData: sempre draft/noindex e rastreável', () => {
  const d = buildPostData(rec(), 'co1', { 'leilao-de-imoveis': 'catX' })
  assert.equal(d.status, 'draft')
  assert.equal(d.published, false)
  assert.equal(d.noindex, true)
  assert.equal(d.source, 'seo-programmatic')
  assert.equal(d.sourceUrl, 'seo:AE-001')
  assert.equal(d.companyId, 'co1')
  assert.equal(d.categoryId, 'catX')
  assert.equal(d.keywordPrincipal, 'a')
})
test('buildPostData: categoria desconhecida cai em seo-local', () => {
  const d = buildPostData(rec({ categoria: 'inexistente' }), 'co1', { 'seo-local': 'fallback' })
  assert.equal(d.categoryId, 'fallback')
})
test('buildPostData: tags trocam ; por ,', () => {
  const d = buildPostData(rec({ keywords: 'a;b;c' }), 'co1', {})
  assert.equal(d.tags, 'a,b,c')
})

// ── Varredura do dataset REAL inteiro ───────────────────────────────────
test('dataset: todos os posts geram colunas válidas, slug único e conteúdo não-vazio', async () => {
  const fields = blogPostFields()
  const catSlugs = new Set(CATEGORIES.map((c) => c.slug))
  const catMap: Record<string, string> = {}
  for (const c of CATEGORIES) catMap[c.slug] = `cat_${c.slug}`

  const rl = createInterface({
    input: createReadStream(DATA).pipe(createGunzip()),
    crlfDelay: Infinity,
  })

  const slugs = new Set<string>()
  let n = 0, dupSlug = 0, emptyContent = 0, emptyTitle = 0, badKey = 0, badCat = 0, unmappedCat = 0

  for await (const line of rl) {
    if (!line.trim()) continue
    const r = JSON.parse(line) as SeoRecord
    const d = buildPostData(r, 'co1', catMap)
    n++
    if (slugs.has(d.slug)) dupSlug++; else slugs.add(d.slug)
    if (!d.content || d.content.length < 10) emptyContent++
    if (!d.title) emptyTitle++
    for (const k of Object.keys(d)) if (!fields.has(k)) badKey++
    if (!catSlugs.has(r.categoria)) badCat++
    if (d.categoryId === null) unmappedCat++
  }

  console.log(`      posts=${n} slugs únicos=${slugs.size} dupSlug=${dupSlug} ` +
    `emptyContent=${emptyContent} emptyTitle=${emptyTitle} badKey=${badKey} ` +
    `categoriaForaDoMapa=${badCat} categoryIdNull=${unmappedCat}`)

  assert.ok(n > 52000, `esperado >52k posts, veio ${n}`)
  assert.equal(dupSlug, 0, 'slugs devem ser únicos')
  assert.equal(emptyContent, 0, 'nenhum conteúdo vazio')
  assert.equal(emptyTitle, 0, 'nenhum título vazio')
  assert.equal(badKey, 0, 'nenhuma chave fora do schema BlogPost')
  assert.equal(badCat, 0, 'toda categoria do dataset existe no mapa')
  assert.equal(unmappedCat, 0, 'todo post recebe categoryId')
})
