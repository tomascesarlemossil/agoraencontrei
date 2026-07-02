/**
 * Smoke-test do pipeline de SEO programático — SEM banco.
 *
 * Roda a MESMA lógica pura da ingestão (seo-transform.ts) sobre os primeiros
 * N registros do dataset e valida que cada post gerado só contém colunas reais
 * do modelo BlogPost (lidas de schema.prisma). Serve para conferir a carga
 * antes de rodar o import:seo de verdade.
 *
 * Uso:  pnpm --filter @agoraencontrei/database exec tsx ../../scripts/seo-import/smoke-test.ts
 *   ou: node_modules/.bin/tsx scripts/seo-import/smoke-test.ts [N]
 */
import { createReadStream, readFileSync } from 'fs'
import { createInterface } from 'readline'
import { createGunzip } from 'zlib'
import path from 'path'
import { buildPostData, type SeoRecord } from '../../packages/database/prisma/seo-transform'

const N = parseInt(process.argv[2] ?? '5', 10)
const ROOT = path.join(__dirname, '..', '..')
const DATA = path.join(ROOT, 'packages/database/data/seo-posts/franca-seo-posts.ndjson.gz')
const SCHEMA = path.join(ROOT, 'packages/database/prisma/schema.prisma')

// Campos escalares reais do modelo BlogPost (parse simples do schema).
function blogPostFields(): Set<string> {
  const src = readFileSync(SCHEMA, 'utf8')
  const block = src.match(/model BlogPost \{([\s\S]*?)\n\}/)![1]
  const fields = new Set<string>()
  for (const raw of block.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('//') || line.startsWith('@@')) continue
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+\S/)
    if (m) fields.add(m[1])
  }
  return fields
}

async function main() {
  const fields = blogPostFields()
  const categoryMap: Record<string, string> = { 'seo-local': 'cat_fake_id' } // stub p/ teste
  const rl = createInterface({
    input: createReadStream(DATA).pipe(createGunzip()),
    crlfDelay: Infinity,
  })

  let count = 0
  const badKeys = new Set<string>()
  for await (const line of rl) {
    if (!line.trim() || count >= N) { if (count >= N) break; else continue }
    const rec = JSON.parse(line) as SeoRecord
    const data = buildPostData(rec, 'company_fake_id', categoryMap)
    for (const k of Object.keys(data)) if (!fields.has(k)) badKeys.add(k)
    count++
    console.log(`\n─── POST ${count} ─────────────────────────────`)
    console.log('slug        :', data.slug)
    console.log('categoria   :', rec.categoria, '→ categoryId', data.categoryId)
    console.log('cidade/bairro:', data.cidade, '/', data.bairro)
    console.log('title       :', data.title)
    console.log('status      :', data.status, '| noindex:', data.noindex, '| source:', data.source)
    console.log('excerpt     :', data.excerpt.slice(0, 90))
    console.log('content[0..160]:', data.content.slice(0, 160))
  }

  console.log('\n══════════════════════════════════════════════')
  console.log(`Posts gerados: ${count}`)
  if (badKeys.size) {
    console.error('❌ Chaves que NÃO existem em BlogPost:', [...badKeys])
    process.exit(1)
  }
  console.log('✅ Todas as chaves geradas são colunas reais de BlogPost.')
}

main().catch((e) => { console.error(e); process.exit(1) })
