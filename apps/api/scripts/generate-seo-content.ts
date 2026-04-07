/**
 * SEO Content Generation — Batch Script
 *
 * Gera conteúdo IA para páginas SEO que ainda não têm conteúdo.
 * Chama POST /api/v1/seo/pages/publish-ai em loop com throttling.
 *
 * Uso:
 *   cd apps/api
 *   npx tsx scripts/generate-seo-content.ts
 *
 * Variáveis de ambiente:
 *   API_URL       — URL da API (default: http://localhost:3100)
 *   BATCH_SIZE    — Páginas por batch (default: 50)
 *   DELAY_MS      — Delay entre batches em ms (default: 2000)
 *   MAX_BATCHES   — Máximo de batches (default: 0 = ilimitado)
 */

const API_URL = process.env.API_URL || 'http://localhost:3100'
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '50', 10)
const DELAY_MS = parseInt(process.env.DELAY_MS || '2000', 10)
const MAX_BATCHES = parseInt(process.env.MAX_BATCHES || '0', 10)

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface Stats {
  paginas_total: number
  paginas_publicadas: number
  paginas_rascunho: number
}

interface PublishResult {
  ok: boolean
  total: number
  errors?: string[]
  message?: string
}

async function getStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/v1/seo/stats`)
  if (!res.ok) throw new Error(`Stats failed: ${res.status}`)
  return res.json()
}

async function publishBatch(limit: number): Promise<PublishResult> {
  const res = await fetch(`${API_URL}/api/v1/seo/pages/publish-ai?limit=${limit}`, {
    method: 'POST',
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Publish failed: ${res.status} — ${err}`)
  }
  return res.json()
}

async function countPagesWithoutContent(): Promise<number> {
  // Use the pages list endpoint to check how many rascunho pages exist
  const res = await fetch(`${API_URL}/api/v1/seo/pages?limit=1&status=rascunho`)
  if (!res.ok) return 0
  const data = await res.json()
  return data.meta?.total || 0
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  AgoraEncontrei — SEO Content Generation (Batch)')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  API:        ${API_URL}`)
  console.log(`  Batch size: ${BATCH_SIZE}`)
  console.log(`  Delay:      ${DELAY_MS}ms`)
  console.log(`  Max:        ${MAX_BATCHES || 'unlimited'}`)
  console.log('')

  // Check API health
  try {
    const health = await fetch(`${API_URL}/health`)
    if (!health.ok) throw new Error('API not healthy')
    console.log('✅ API is running')
  } catch (e: any) {
    console.error(`❌ API not reachable at ${API_URL}: ${e.message}`)
    console.error('   Start the API first: cd apps/api && pnpm dev')
    process.exit(1)
  }

  // Get initial stats
  const initialStats = await getStats()
  console.log(`📊 Total pages: ${initialStats.paginas_total.toLocaleString()}`)
  console.log(`   Published:   ${initialStats.paginas_publicadas.toLocaleString()}`)
  console.log(`   Rascunho:    ${initialStats.paginas_rascunho.toLocaleString()}`)

  const remaining = await countPagesWithoutContent()
  if (remaining === 0 && initialStats.paginas_rascunho === 0) {
    console.log('\n✅ All pages already have content! Nothing to do.')
    return
  }

  console.log(`\n🚀 Starting generation...\n`)

  let totalGenerated = 0
  let totalErrors = 0
  let batchNum = 0
  const startTime = Date.now()

  while (true) {
    batchNum++

    if (MAX_BATCHES > 0 && batchNum > MAX_BATCHES) {
      console.log(`\n⏹️  Reached max batches (${MAX_BATCHES}). Stopping.`)
      break
    }

    try {
      const result = await publishBatch(BATCH_SIZE)

      if (result.total === 0) {
        console.log(`\n✅ No more pages to process. Done!`)
        break
      }

      totalGenerated += result.total
      if (result.errors) totalErrors += result.errors.length

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      const rate = (totalGenerated / (Number(elapsed) || 1) * 60).toFixed(1)

      console.log(
        `  Batch #${batchNum}: ${result.total} pages generated ` +
        `| Total: ${totalGenerated.toLocaleString()}/${initialStats.paginas_total.toLocaleString()} ` +
        `| ${rate}/min | ${elapsed}s elapsed` +
        (result.errors?.length ? ` | ${result.errors.length} errors` : '')
      )

      if (result.errors && result.errors.length > 0) {
        for (const err of result.errors.slice(0, 3)) {
          console.log(`    ⚠️  ${err}`)
        }
      }

      // Throttle between batches
      await sleep(DELAY_MS)
    } catch (e: any) {
      console.error(`\n❌ Batch #${batchNum} failed: ${e.message}`)
      totalErrors++

      if (totalErrors > 10) {
        console.error('Too many errors. Stopping.')
        break
      }

      // Wait longer on error
      await sleep(DELAY_MS * 3)
    }
  }

  // Final stats
  const finalStats = await getStats()
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0)

  console.log('\n═══════════════════════════════════════════════════')
  console.log('  RESULTADO FINAL')
  console.log('═══════════════════════════════════════════════════')
  console.log(`  Geradas:     ${totalGenerated.toLocaleString()} paginas`)
  console.log(`  Erros:       ${totalErrors}`)
  console.log(`  Tempo:       ${totalTime}s`)
  console.log(`  Publicadas:  ${finalStats.paginas_publicadas.toLocaleString()}`)
  console.log(`  Rascunho:    ${finalStats.paginas_rascunho.toLocaleString()}`)
  console.log('═══════════════════════════════════════════════════')
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
