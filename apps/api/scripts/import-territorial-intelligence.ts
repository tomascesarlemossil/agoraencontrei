import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { importTerritorialRows, linkPropertiesToTerritory, type TerritorialImportRow } from '../src/services/territorial-ingestion.service.js'

const [fileArg, sourceSlug, companyId] = process.argv.slice(2)
if (!fileArg || !sourceSlug) {
  throw new Error('Uso: tsx scripts/import-territorial-intelligence.ts <arquivo.json> <source-slug> [company-id]')
}

const prisma = new PrismaClient()
try {
  const rows = JSON.parse(await readFile(resolve(fileArg), 'utf8')) as TerritorialImportRow[]
  if (!Array.isArray(rows)) throw new Error('O arquivo deve conter um array JSON.')
  const imported = await importTerritorialRows(prisma, { sourceSlug, rows })
  if (!imported.imported) throw new Error(`Importação bloqueada: ${imported.reason}`)
  const linked = await linkPropertiesToTerritory(prisma, { companyId })
  console.log(JSON.stringify({ imported, linked }, null, 2))
} finally {
  await prisma.$disconnect()
}
