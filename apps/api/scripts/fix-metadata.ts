import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  console.log('=== CORRIGINDO METADATA DOS DOCUMENTOS ===')
  const [{ total }] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COUNT(*)::int as total FROM documents WHERE metadata->>'publicUrl' IS NULL AND metadata->>'storageUrl' IS NOT NULL`
  )
  console.log('Documentos a corrigir:', total)
  if (total === 0) { console.log('Nenhum a corrigir.'); return }
  let fixed = 0
  while (true) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, metadata FROM documents WHERE metadata->>'publicUrl' IS NULL AND metadata->>'storageUrl' IS NOT NULL LIMIT 500`
    )
    if (rows.length === 0) break
    for (const row of rows) {
      const m = typeof row.metadata === 'object' ? row.metadata : JSON.parse(row.metadata || '{}')
      const newMeta = { publicUrl: m.storageUrl, storageKey: m.storagePath, originalPath: m.originalPath, storageBucket: m.storageBucket, uploadedAt: m.uploadedAt }
      await prisma.$executeRawUnsafe(`UPDATE documents SET metadata = $1::jsonb, "updatedAt" = NOW() WHERE id = $2`, JSON.stringify(newMeta), row.id)
      fixed++
    }
    process.stdout.write('\r  Corrigidos: ' + fixed + '/' + total)
  }
  console.log('\nConcluido! ' + fixed + ' documentos corrigidos.')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
