/**
 * Script: seed-1m-urls.ts
 * Importa as URLs do CSV de 1M para a tabela seo_paginas do banco de dados
 *
 * Uso:
 *   cd apps/api
 *   BATCH_SIZE=500 DELAY_MS=100 npx tsx scripts/seed-1m-urls.ts
 *
 * Variáveis de ambiente:
 *   DATABASE_URL  — URL do banco PostgreSQL/MySQL
 *   CSV_PATH      — Caminho para o arquivo .csv.gz (default: ~/agoraencontrei_urls_1M.csv.gz)
 *   BATCH_SIZE    — Linhas por batch de INSERT (default: 500)
 *   DELAY_MS      — Delay entre batches em ms (default: 50)
 *   DRY_RUN       — Se "true", apenas conta sem inserir (default: false)
 *   FAMILIA       — Filtrar por família de URL (ex: "money pages")
 *   ESTADO        — Filtrar por estado (ex: "sp")
 */

import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'
import { createInterface } from 'readline'
import { Pool } from 'pg'

// ── Configuração ──────────────────────────────────────────────────────────────
const CSV_PATH = process.env.CSV_PATH || path.join(process.env.HOME || '/home/ubuntu', 'agoraencontrei_urls_1M.csv.gz')
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '500')
const DELAY_MS = parseInt(process.env.DELAY_MS || '50')
const DRY_RUN = process.env.DRY_RUN === 'true'
const FILTER_FAMILIA = process.env.FAMILIA || ''
const FILTER_ESTADO = process.env.ESTADO || ''

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
})

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface UrlRow {
  familia_url: string
  estado: string
  cidade: string
  bairro: string
  cluster: string
  intencao: string
  modificador: string
  publico_alvo: string
  tipo_pagina: string
  slug: string
  url: string
  titulo_seo: string
  h1: string
  meta_description: string
  priority: string
  indexar: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Leitura do CSV ────────────────────────────────────────────────────────────
async function* readCsvGz(filePath: string): AsyncGenerator<UrlRow> {
  const fileStream = fs.createReadStream(filePath)
  const gunzip = zlib.createGunzip()
  const rl = createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity })

  let headers: string[] = []
  let isFirst = true

  for await (const line of rl) {
    if (isFirst) {
      headers = line.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
      isFirst = false
      continue
    }
    if (!line.trim()) continue

    // Parse CSV simples (sem campos com vírgulas internas)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    yield row as UrlRow
  }
}

// ── Inserção em batch ─────────────────────────────────────────────────────────
async function insertBatch(rows: UrlRow[], client: any): Promise<number> {
  if (rows.length === 0) return 0

  const values: any[] = []
  const placeholders: string[] = []
  let idx = 1

  for (const row of rows) {
    const estado_slug = row.estado.toLowerCase()
    const cidade_slug = slugify(row.cidade)
    const cluster_slug = slugify(row.cluster)
    const modificador_slug = row.modificador ? slugify(row.modificador) : null
    const familia = row.familia_url
    const prioridade = parseInt(row.priority) || 5
    const indexar = row.indexar?.toLowerCase() !== 'false'

    placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`)
    values.push(
      row.slug,           // slug
      row.url,            // url_path
      row.titulo_seo,     // titulo
      row.h1,             // h1
      row.meta_description, // meta_description
      estado_slug,        // estado_slug
      cidade_slug,        // cidade_slug
      cluster_slug,       // cluster_slug
      modificador_slug,   // modificador_slug
      familia,            // familia_url
      prioridade,         // prioridade
      indexar,            // indexar
      'pending',          // status (pending = aguardando geração de conteúdo AI)
    )
  }

  const query = `
    INSERT INTO seo_paginas (
      slug, url_path, titulo, h1, meta_description,
      estado_slug, cidade_slug, cluster_slug, modificador_slug,
      familia_url, prioridade, indexar, status
    ) VALUES ${placeholders.join(', ')}
    ON CONFLICT (slug) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      h1 = EXCLUDED.h1,
      meta_description = EXCLUDED.meta_description,
      prioridade = EXCLUDED.prioridade,
      indexar = EXCLUDED.indexar,
      updated_at = NOW()
  `

  await client.query(query, values)
  return rows.length
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Seed de 1M URLs — AgoraEncontrei SEO')
  console.log(`📁 CSV: ${CSV_PATH}`)
  console.log(`📦 Batch size: ${BATCH_SIZE}`)
  console.log(`⏱️  Delay: ${DELAY_MS}ms`)
  console.log(`🔍 Dry run: ${DRY_RUN}`)
  if (FILTER_FAMILIA) console.log(`🔎 Filtro família: ${FILTER_FAMILIA}`)
  if (FILTER_ESTADO) console.log(`🔎 Filtro estado: ${FILTER_ESTADO}`)
  console.log()

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Arquivo não encontrado: ${CSV_PATH}`)
    console.error('   Defina CSV_PATH=<caminho> ou coloque o arquivo em ~/agoraencontrei_urls_1M.csv.gz')
    process.exit(1)
  }

  const client = await pool.connect()

  try {
    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'seo_paginas'
      )
    `)
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Tabela seo_paginas não encontrada. Execute as migrations primeiro.')
      process.exit(1)
    }

    let batch: UrlRow[] = []
    let total = 0
    let inserted = 0
    let skipped = 0
    const startTime = Date.now()

    for await (const row of readCsvGz(CSV_PATH)) {
      total++

      // Filtros
      if (FILTER_FAMILIA && row.familia_url !== FILTER_FAMILIA) { skipped++; continue }
      if (FILTER_ESTADO && row.estado.toLowerCase() !== FILTER_ESTADO.toLowerCase()) { skipped++; continue }

      batch.push(row)

      if (batch.length >= BATCH_SIZE) {
        if (!DRY_RUN) {
          await insertBatch(batch, client)
        }
        inserted += batch.length
        batch = []

        if (DELAY_MS > 0) await sleep(DELAY_MS)

        const elapsed = (Date.now() - startTime) / 1000
        const rate = Math.round(inserted / elapsed)
        const pct = ((total / 1000000) * 100).toFixed(1)
        process.stdout.write(`\r  ✅ ${inserted.toLocaleString()} inseridas | ${total.toLocaleString()} lidas (${pct}%) | ${rate}/s`)
      }
    }

    // Último batch
    if (batch.length > 0) {
      if (!DRY_RUN) {
        await insertBatch(batch, client)
      }
      inserted += batch.length
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log()
    console.log()
    console.log('═══════════════════════════════════════════')
    console.log(`✅ Seed concluído em ${elapsed}s`)
    console.log(`   Total lidas:    ${total.toLocaleString()}`)
    console.log(`   Inseridas:      ${inserted.toLocaleString()}`)
    console.log(`   Ignoradas:      ${skipped.toLocaleString()}`)
    console.log(`   Dry run:        ${DRY_RUN}`)
    console.log('═══════════════════════════════════════════')
    console.log()
    console.log('📋 Próximos passos:')
    console.log('   1. Gerar conteúdo AI para as páginas:')
    console.log('      POST /api/v1/seo/pages/publish-ai?limit=100&status=pending')
    console.log('   2. Verificar status:')
    console.log('      GET  /api/v1/seo/pages/stats')
    console.log()

  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
