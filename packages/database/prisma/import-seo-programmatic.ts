/**
 * Importador de Conteúdo SEO Programático — AgoraEncontrei
 * -------------------------------------------------------------------------
 * Ingere o dataset gerado por scripts/seo-import/extract_seo_xlsx.py
 * (packages/database/data/seo-posts/franca-seo-posts.ndjson.gz) para o
 * modelo BlogPost.
 *
 * SEGURANÇA / ANTI-BAN:
 *   - Por padrão importa TUDO como `draft` (published=false). Nada vai ao ar.
 *   - A publicação é feita em ondas, deliberadamente, por outro script
 *     (publish-seo-wave.ts) — nunca despeje 52k posts vivos de uma vez:
 *     é o gatilho nº 1 de "scaled content abuse" do Google.
 *   - Idempotente: createMany({ skipDuplicates }) + @@unique([companyId, slug]).
 *
 * Uso:
 *   pnpm --filter @agoraencontrei/database run import:seo
 *   # opções:
 *   #   SEO_COMPANY_ID=<companyId>   (senão usa a 1ª company; use o mesmo
 *   #                                 valor de NEXT_PUBLIC_COMPANY_ID do web)
 *   #   SEO_DATA_FILE=/caminho/custom.ndjson.gz
 *   #   SEO_LIMIT=1000   (para testar com um subconjunto)
 */
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { createGunzip } from 'zlib'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DATA_FILE =
  process.env.SEO_DATA_FILE ??
  path.join(__dirname, '..', 'data', 'seo-posts', 'franca-seo-posts.ndjson.gz')
const COMPANY_ID = process.env.SEO_COMPANY_ID ?? null
const LIMIT = process.env.SEO_LIMIT ? parseInt(process.env.SEO_LIMIT, 10) : Infinity
const BATCH_SIZE = 500
const SOURCE_TAG = 'seo-programmatic'

interface SeoRecord {
  extId: string
  slug: string
  tema: string
  categoria: string
  cidade: string
  uf: string
  bairro: string
  titulo: string
  keywords: string
  metaDesc: string
  conteudo: string
}

// Categorias que os posts referenciam. As duas últimas não existem no
// seed-blog padrão e são criadas aqui.
const CATEGORIES = [
  { slug: 'financiamento-imobiliario', name: 'Financiamento Imobiliário', description: 'Guias e orientações sobre financiamento de imóveis.' },
  { slug: 'compra-de-imoveis', name: 'Compra de Imóveis', description: 'Processo de compra: documentação, avaliação, negociação.' },
  { slug: 'venda-de-imoveis', name: 'Venda de Imóveis', description: 'Como vender imóvel com estratégia.' },
  { slug: 'aluguel-de-imoveis', name: 'Aluguel de Imóveis', description: 'Locação residencial e comercial: contrato, garantias, vistoria.' },
  { slug: 'leilao-de-imoveis', name: 'Leilão de Imóveis', description: 'Como comprar imóveis em leilão com segurança.' },
  { slug: 'investimento-imobiliario', name: 'Investimento Imobiliário', description: 'ROI, yield, avaliação patrimonial e alto padrão.' },
  { slug: 'seo-local', name: 'Mercado Local', description: 'Mercado imobiliário local: bairros, planejamento e infraestrutura.' },
  { slug: 'reformas-e-arquitetura', name: 'Reformas e Arquitetura', description: 'Tendências de reforma, arquitetura, sustentabilidade e retrofit.' },
  { slug: 'regularizacao-e-documentacao', name: 'Regularização e Documentação', description: 'Regularização, tributação (ITBI/IPTU), vistorias e segurança jurídica.' },
]

function slugify(text: string, maxlen = 100): string {
  return String(text)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, maxlen).replace(/^-|-$/g, '')
}

/** Texto corrido -> HTML com parágrafos legíveis (sem inventar conteúdo). */
function textToHtml(text: string): string {
  const clean = String(text).replace(/\r/g, '').trim()
  if (!clean) return ''
  // Quebra em sentenças e agrupa ~2 por parágrafo para dar respiro visual.
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [clean]
  const paras: string[] = []
  for (let i = 0; i < sentences.length; i += 2) {
    paras.push(sentences.slice(i, i + 2).join('').trim())
  }
  return paras.filter(Boolean).map((p) => `<p>${p}</p>`).join('\n')
}

function excerptFrom(rec: SeoRecord): string {
  const base = rec.metaDesc || rec.conteudo
  const s = String(base).trim()
  return s.length > 220 ? s.slice(0, 217).trimEnd() + '…' : s
}

async function resolveCompanyId(): Promise<string> {
  if (COMPANY_ID) {
    const c = await prisma.company.findUnique({ where: { id: COMPANY_ID } })
    if (!c) throw new Error(`Company com id "${COMPANY_ID}" não encontrada`)
    return c.id
  }
  const c = await prisma.company.findFirst()
  if (!c) throw new Error('Nenhuma company encontrada. Crie uma primeiro.')
  return c.id
}

async function ensureCategories(companyId: string): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    const existing = await prisma.blogCategory.findFirst({ where: { companyId, slug: cat.slug } })
    if (existing) { map[cat.slug] = existing.id; continue }
    const created = await prisma.blogCategory.create({
      data: {
        companyId, name: cat.name, slug: cat.slug, description: cat.description,
        seoTitle: cat.name, metaDescription: cat.description,
      },
    })
    map[cat.slug] = created.id
  }
  return map
}

function buildPostData(rec: SeoRecord, companyId: string, categoryMap: Record<string, string>) {
  const keywords = rec.keywords || ''
  const keywordPrincipal = keywords.split(/[,;]/)[0]?.trim() || null
  return {
    companyId,
    title: rec.titulo,
    slug: rec.slug,
    excerpt: excerptFrom(rec),
    content: textToHtml(rec.conteudo),
    bodyMarkdown: rec.conteudo,
    categoryId: categoryMap[rec.categoria] ?? categoryMap['seo-local'] ?? null,
    tags: keywords ? keywords.replace(/;/g, ',') : null,
    seoTitle: rec.titulo,
    seoDescription: rec.metaDesc || null,
    seoKeywords: keywords || null,
    keywordPrincipal,
    schemaType: 'BlogPosting',
    cidade: rec.cidade || 'Franca',
    bairro: rec.bairro || null,
    tipoImovel: 'geral',
    // rastreabilidade p/ publicação em ondas e rollback
    source: SOURCE_TAG,
    sourceUrl: rec.extId ? `seo:${rec.extId}` : null,
    isAutoImported: true,
    editorialNotes: `[SEO programático] tema=${rec.tema} · id=${rec.extId}`,
    // SEGURANÇA: entra como rascunho, fora do índice.
    status: 'draft',
    published: false,
    noindex: true,
    featured: false,
    authorName: 'Equipe AgoraEncontrei',
  }
}

async function main() {
  console.log('🔧 Importação de SEO programático (draft-first)')
  console.log(`   dataset: ${DATA_FILE}`)

  const companyId = await resolveCompanyId()
  console.log(`📦 Company: ${companyId}`)

  console.log('📂 Garantindo categorias...')
  const categoryMap = await ensureCategories(companyId)
  console.log(`   ${Object.keys(categoryMap).length} categorias OK`)

  const rl = createInterface({
    input: createReadStream(DATA_FILE).pipe(createGunzip()),
    crlfDelay: Infinity,
  })

  let batch: ReturnType<typeof buildPostData>[] = []
  const stats = { read: 0, inserted: 0, skipped: 0, errors: 0 }

  async function flush() {
    if (batch.length === 0) return
    try {
      const res = await prisma.blogPost.createMany({ data: batch, skipDuplicates: true })
      stats.inserted += res.count
      stats.skipped += batch.length - res.count
    } catch (err: any) {
      stats.errors += batch.length
      console.error(`\n  ❌ Erro no batch: ${err.message}`)
    }
    batch = []
    process.stdout.write(`\r   lidos=${stats.read} inseridos=${stats.inserted} pulados=${stats.skipped} erros=${stats.errors}`)
  }

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (stats.read >= LIMIT) break
    let rec: SeoRecord
    try { rec = JSON.parse(trimmed) } catch { stats.errors++; continue }
    stats.read++
    batch.push(buildPostData(rec, companyId, categoryMap))
    if (batch.length >= BATCH_SIZE) await flush()
  }
  await flush()

  console.log('\n\n✅ Importação concluída (todos como DRAFT / noindex):')
  console.log(`   Lidos:     ${stats.read}`)
  console.log(`   Inseridos: ${stats.inserted}`)
  console.log(`   Pulados (já existiam): ${stats.skipped}`)
  console.log(`   Erros:     ${stats.errors}`)
  console.log('\n👉 Próximo passo: publicar em ondas com publish-seo-wave.ts')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
