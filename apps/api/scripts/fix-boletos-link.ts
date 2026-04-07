/**
 * fix-boletos-link.ts
 *
 * Vincula boletos/reajustes/extratos a contratos ativos usando fuzzy match
 * do nome do inquilino extraído do legacyRef contra clients.name
 *
 * Uso: npx tsx scripts/fix-boletos-link.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Normaliza string para comparação: minúsculas, sem acentos, sem pontuação
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extrai nome do inquilino do legacyRef
// Padrão: "FINANCEIRO 2026/INQUILINOS/BOLETOS 2026/MM.AAAA - Nome Inquilino/arquivo.pdf"
function extractNameFromRef(legacyRef: string): string | null {
  const parts = legacyRef.split('/')
  // A pasta com o nome é a 4ª parte (índice 3): "MM.AAAA - Nome"
  const folder = parts[3] ?? ''
  const dashIdx = folder.indexOf(' - ')
  if (dashIdx === -1) return null
  return folder.substring(dashIdx + 3).trim()
}

// Calcula similaridade de Jaccard entre dois conjuntos de palavras
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalize(a).split(' ').filter(w => w.length > 2))
  const setB = new Set(normalize(b).split(' ').filter(w => w.length > 2))
  if (setA.size === 0 || setB.size === 0) return 0
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return intersection.size / union.size
}

async function main() {
  console.log('=== VINCULAÇÃO DE BOLETOS A CONTRATOS (fuzzy match) ===\n')

  // Buscar todos os boletos/reajustes/extratos sem contractId
  const docs = await prisma.$queryRawUnsafe<any[]>(
    `SELECT d.id, d."legacyRef", d.type, d."clientId", d."contractId"
     FROM documents d
     WHERE d.type IN ('BOLETO', 'REAJUSTE', 'EXTRATO')
       AND d."contractId" IS NULL
       AND d."legacyRef" IS NOT NULL`
  )
  console.log(`Documentos financeiros sem contrato: ${docs.length}`)

  // Buscar todos os contratos ativos com o nome do inquilino
  const contracts = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c.id, c."tenantId", c."rentValue", c."isActive", c.status,
            cl.name as "tenantName"
     FROM contracts c
     LEFT JOIN clients cl ON cl.id = c."tenantId"
     WHERE c."isActive" = true OR c.status = 'ACTIVE'`
  )
  console.log(`Contratos ativos: ${contracts.length}`)

  // Indexar contratos por nome normalizado
  const contractsByName = new Map<string, any[]>()
  for (const c of contracts) {
    if (!c.tenantName) continue
    const key = normalize(c.tenantName)
    if (!contractsByName.has(key)) contractsByName.set(key, [])
    contractsByName.get(key)!.push(c)
  }

  let linked = 0
  let skipped = 0
  let noName = 0

  for (const doc of docs) {
    const extractedName = extractNameFromRef(doc.legacyRef)
    if (!extractedName) { noName++; continue }

    // Busca o melhor match
    let bestContract: any = null
    let bestScore = 0

    for (const [normName, contractList] of contractsByName) {
      const score = jaccardSimilarity(extractedName, normName)
      if (score > bestScore) {
        bestScore = score
        bestContract = contractList[0] // pega o primeiro (mais recente)
      }
    }

    // Threshold: score >= 0.4 para considerar match
    if (bestScore >= 0.4 && bestContract) {
      await prisma.$executeRawUnsafe(
        `UPDATE documents SET "contractId" = $1, "clientId" = $2, "updatedAt" = NOW() WHERE id = $3`,
        bestContract.id, bestContract.tenantId, doc.id
      )
      linked++
    } else {
      skipped++
    }
  }

  console.log(`\n✓ Vinculados: ${linked}`)
  console.log(`✗ Sem match suficiente: ${skipped}`)
  console.log(`- Sem nome no legacyRef: ${noName}`)

  // Relatório final de boletos
  const summary = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
       COUNT(*)::int as total,
       COUNT("contractId")::int as com_contrato,
       COUNT("clientId")::int as com_cliente
     FROM documents WHERE type = 'BOLETO'`
  )
  console.log(`\nBoletos: total=${summary[0].total} | com_contrato=${summary[0].com_contrato} | com_cliente=${summary[0].com_cliente}`)

  // Top contratos com mais boletos
  const topContracts = await prisma.$queryRawUnsafe<any[]>(
    `SELECT c.id, cl.name as tenant, COUNT(d.id)::int as boletos,
            c."rentValue"
     FROM documents d
     JOIN contracts c ON c.id = d."contractId"
     LEFT JOIN clients cl ON cl.id = c."tenantId"
     WHERE d.type = 'BOLETO'
     GROUP BY c.id, cl.name, c."rentValue"
     ORDER BY boletos DESC
     LIMIT 10`
  )
  console.log('\nTop 10 contratos com mais boletos:')
  for (const r of topContracts) {
    console.log(`  ${r.tenant ?? '(sem nome)'}: ${r.boletos} boletos | aluguel R$ ${r.rentValue}`)
  }

  await prisma.$disconnect()
  console.log('\n✅ Vinculação concluída!')
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
