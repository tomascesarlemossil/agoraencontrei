/**
 * enrich-clients-from-univen-xls.js
 *
 * TASK 2: Enrich clients from Univen XLS
 * - Parse /Users/tomaslemos/Downloads/univen /univen-clientes_31-03-2026_16_03_22.xls
 * - Match by legacyId (Código column) to clients.legacyId
 * - Update: profession (from Profissão), notes (category if missing)
 */

'use strict'

const { PrismaClient } = require('/Users/tomaslemos/Downloads/squads/agoraencontrei/packages/database/node_modules/@prisma/client')
const XLSX = require('xlsx')

const DB_URL = 'postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require'
const COMPANY_ID = 'cmnhzieqf0000mx1cqcqgfv4n'
const XLS_PATH = '/Users/tomaslemos/Downloads/univen /univen-clientes_31-03-2026_16_03_22.xls'

const prisma = new PrismaClient({
  datasources: { db: { url: DB_URL } },
  log: ['error'],
})

async function run() {
  console.log('=== Enrich Clients from Univen XLS ===')

  // Parse XLS
  const wb = XLSX.readFile(XLS_PATH)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  const headers = rows[0]
  console.log(`XLS rows: ${rows.length - 1}`)
  // Col indices: 0=Código, 1=Nome, 17=Profissão, 23=Categoria

  // Build map: legacyId → { profession, category }
  const enrichMap = new Map()
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const code = row[0]
    const profession = row[17]
    const category = row[23]

    if (!code) continue

    const legacyId = String(code).trim()
    if (profession || category) {
      enrichMap.set(legacyId, {
        profession: profession ? String(profession).trim() : null,
        category:   category  ? String(category).trim()   : null,
      })
    }
  }

  console.log(`Enrichment map entries: ${enrichMap.size}`)

  // Process in batches
  let updated = 0
  let skipped = 0

  const legacyIds = [...enrichMap.keys()]

  // Process in chunks of 500
  const CHUNK = 500
  for (let i = 0; i < legacyIds.length; i += CHUNK) {
    const chunk = legacyIds.slice(i, i + CHUNK)

    // Find clients with these legacyIds
    const clients = await prisma.client.findMany({
      where: {
        companyId: COMPANY_ID,
        legacyId: { in: chunk }
      },
      select: { id: true, legacyId: true, profession: true, notes: true }
    })

    for (const client of clients) {
      const enrichData = enrichMap.get(client.legacyId)
      if (!enrichData) continue

      const updateData = {}

      // Only set profession if currently missing
      if (enrichData.profession && !client.profession) {
        updateData.profession = enrichData.profession
      }

      // Add category to notes if not already present
      if (enrichData.category && enrichData.category !== 'MIGRAÇÃO') {
        if (!client.notes) {
          updateData.notes = `Categoria: ${enrichData.category}`
        } else if (!client.notes.includes(enrichData.category)) {
          updateData.notes = `${client.notes} | Categoria: ${enrichData.category}`
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.client.update({
          where: { id: client.id },
          data: updateData
        }).catch(() => {})
        updated++
      } else {
        skipped++
      }
    }

    process.stdout.write(`\r  Progress: ${Math.min(i + CHUNK, legacyIds.length)}/${legacyIds.length} processed, ${updated} updated`)
  }

  console.log(`\n\nDone! Updated: ${updated}, Skipped (already had data): ${skipped}`)

  await prisma.$disconnect()
}

run().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
