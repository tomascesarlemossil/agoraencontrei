/**
 * Script: create-legal-cases-from-docs.ts
 * Cria processos jurídicos automaticamente a partir dos 226 documentos migrados.
 * Cada subpasta de JURIDICO 20256/ vira um processo, com os documentos vinculados.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Inferir tipo do processo pelo nome dos documentos
function inferCaseType(docNames: string[]): string {
  const all = docNames.join(' ').toUpperCase()
  if (all.includes('DESPEJO') || all.includes('DESOCUPAÇÃO') || all.includes('DESOCUPACAO')) return 'DESPEJO'
  if (all.includes('AÇÃO') || all.includes('ACAO') || all.includes('PROCESSO')) return 'ACAO_JUDICIAL'
  if (all.includes('NOTIFICAÇÃO') || all.includes('NOTIFICACAO')) return 'NOTIFICACAO'
  if (all.includes('CONFISSÃO') || all.includes('CONFISSAO') || all.includes('DIVIDA')) return 'CONFISSAO_DIVIDA'
  if (all.includes('INADIMPL')) return 'INADIMPLENCIA'
  if (all.includes('RESCISÃO') || all.includes('RESCISAO')) return 'RESCISAO'
  if (all.includes('EXCLUSÃO') || all.includes('EXCLUSAO') || all.includes('ACIF')) return 'NEGATIVACAO'
  return 'OUTROS'
}

// Inferir status pelo tipo e conteúdo
function inferStatus(caseType: string, docNames: string[]): string {
  const all = docNames.join(' ').toUpperCase()
  if (all.includes('ACORDO') || all.includes('QUITAÇÃO') || all.includes('QUITACAO')) return 'ENCERRADO'
  if (caseType === 'DESPEJO') return 'EM_ANDAMENTO'
  if (caseType === 'ACAO_JUDICIAL') return 'EM_ANDAMENTO'
  return 'ABERTO'
}

async function main() {
  console.log('=== CRIANDO PROCESSOS JURÍDICOS A PARTIR DOS DOCUMENTOS ===\n')

  // Buscar todos os documentos jurídicos agrupados por subpasta (réu)
  const docs = await prisma.document.findMany({
    where: { category: 'juridico' },
    select: {
      id: true,
      name: true,
      legacyRef: true,
      clientId: true,
      contractId: true,
    },
    orderBy: { legacyRef: 'asc' }
  })

  console.log(`Total de documentos jurídicos: ${docs.length}`)

  // Agrupar por subpasta (nome da pessoa/réu)
  const groups = new Map<string, typeof docs>()
  for (const doc of docs) {
    if (!doc.legacyRef) continue
    const parts = doc.legacyRef.split('/')
    // Formato: JURIDICO 20256/NOME DA PESSOA/arquivo.pdf
    // Ou: JURIDICO 20256/arquivo.pdf (sem subpasta)
    const key = parts.length >= 3 ? parts[1] : '_SEM_PASTA'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(doc)
  }

  console.log(`Grupos (processos a criar): ${groups.size}\n`)

  // Verificar se já existem processos criados
  const existingCount = await prisma.$queryRaw<[{count: bigint}]>`
    SELECT COUNT(*) FROM legal_cases
  `
  const existing = Number(existingCount[0].count)
  if (existing > 0) {
    console.log(`⚠ Já existem ${existing} processos no banco. Pulando criação duplicada.`)
    console.log('  Para recriar, execute: DELETE FROM legal_cases;')
    await prisma.$disconnect()
    return
  }

  // Buscar companyId da primeira empresa
  const company = await prisma.company.findFirst({ select: { id: true } })
  if (!company) throw new Error('Nenhuma empresa encontrada no banco')

  let created = 0
  let skipped = 0

  for (const [personName, personDocs] of groups) {
    if (personName === '_SEM_PASTA') {
      skipped += personDocs.length
      continue
    }

    const docNames = personDocs.map(d => d.name)
    const caseType = inferCaseType(docNames)
    const status = inferStatus(caseType, docNames)

    // Pegar clientId do primeiro documento que tiver
    const clientId = personDocs.find(d => d.clientId)?.clientId || null

    // Título do processo
    const title = `${caseType.replace(/_/g, ' ')} — ${personName}`

    // Criar o processo
    const legalCase = await prisma.$queryRaw<[{id: string}]>`
      INSERT INTO legal_cases (
        id, title, "caseType", status, "defendantName",
        "companyId", "clientId", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text,
        ${title},
        ${caseType},
        ${status},
        ${personName},
        ${company.id},
        ${clientId},
        NOW(), NOW()
      )
      RETURNING id
    `

    const caseId = legalCase[0].id

    // Vincular todos os documentos ao processo
    for (const doc of personDocs) {
      await prisma.$executeRaw`
        UPDATE documents
        SET "legalCaseId" = ${caseId}
        WHERE id = ${doc.id}
      `
    }

    console.log(`  ✓ [${caseType}] ${personName} — ${personDocs.length} docs vinculados`)
    created++
  }

  console.log(`\n=== RESULTADO ===`)
  console.log(`✓ Processos criados: ${created}`)
  console.log(`- Documentos sem subpasta (ignorados): ${skipped}`)
  console.log(`✓ Total de documentos vinculados a processos: ${docs.length - skipped}`)

  await prisma.$disconnect()
}

main().catch(e => {
  console.error('Erro:', e.message)
  process.exit(1)
})
