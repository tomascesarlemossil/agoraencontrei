/**
 * fix-document-types.ts
 * Corrige os tipos e categorias dos documentos baseado no legacyRef (pasta de origem)
 *
 * Mapeamento das pastas raiz → tipo + categoria do sistema:
 *   LOCAÇAO 2026         → CONTRATO   / locacao
 *   RECEPÇÃO - 2026      → DOCUMENTO  / locacao
 *   FINANCEIRO 2026      → FINANCEIRO / financeiro
 *   VISTORIAS DE IMÓVEIS → VISTORIA   / vistoria
 *   VENDAS 2026          → CONTRATO   / vendas
 *   ARQUIVO MORTO 2025   → DOCUMENTO  / arquivo_morto
 *   JURIDICO 20256       → JURIDICO   / juridico
 *   IPTU 2026            → FINANCEIRO / financeiro
 *   RESCISÃO 2026        → RESCISAO   / rescisao
 *   CONT. PRESTAÇAO...   → CONTRATO   / prestacao_servico
 *   ADITIVO 2026         → ADITIVO    / aditivo
 *   FOLDER SEGURO 2026   → DOCUMENTO  / seguro
 *
 * Uso: npx tsx scripts/fix-document-types.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapeamento: prefixo da pasta → { type, category }
const FOLDER_MAP: Record<string, { type: string; category: string }> = {
  'LOCAÇAO 2026':               { type: 'CONTRATO',   category: 'locacao' },
  'LOCACAO 2026':               { type: 'CONTRATO',   category: 'locacao' },
  'RECEPÇÃO - 2026':            { type: 'DOCUMENTO',  category: 'locacao' },
  'RECEPCAO - 2026':            { type: 'DOCUMENTO',  category: 'locacao' },
  'FINANCEIRO 2026':            { type: 'FINANCEIRO', category: 'financeiro' },
  'VISTORIAS DE IMÓVEIS':       { type: 'VISTORIA',   category: 'vistoria' },
  'VISTORIAS DE IMOVEIS':       { type: 'VISTORIA',   category: 'vistoria' },
  'VENDAS 2026':                { type: 'CONTRATO',   category: 'vendas' },
  'ARQUIVO MORTO 2025':         { type: 'DOCUMENTO',  category: 'arquivo_morto' },
  'JURIDICO 20256':             { type: 'JURIDICO',   category: 'juridico' },
  'JURIDICO 2026':              { type: 'JURIDICO',   category: 'juridico' },
  'IPTU 2026':                  { type: 'FINANCEIRO', category: 'financeiro' },
  'RESCISÃO 2026':              { type: 'RESCISAO',   category: 'rescisao' },
  'RESCISAO 2026':              { type: 'RESCISAO',   category: 'rescisao' },
  'CONT. PRESTAÇAO SERVIÇO 2026': { type: 'CONTRATO', category: 'prestacao_servico' },
  'CONT. PRESTACAO SERVICO 2026': { type: 'CONTRATO', category: 'prestacao_servico' },
  'ADITIVO 2026':               { type: 'ADITIVO',    category: 'aditivo' },
  'FOLDER SEGURO 2026':         { type: 'DOCUMENTO',  category: 'seguro' },
}

// Normaliza string removendo acentos para comparação fuzzy
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
}

function getMapping(legacyRef: string): { type: string; category: string } | null {
  const folder = legacyRef.split('/')[0]?.trim() ?? ''

  // Tentativa 1: match exato
  if (FOLDER_MAP[folder]) return FOLDER_MAP[folder]

  // Tentativa 2: match normalizado
  const normFolder = normalize(folder)
  for (const [key, val] of Object.entries(FOLDER_MAP)) {
    if (normalize(key) === normFolder) return val
  }

  // Tentativa 3: match por prefixo normalizado
  for (const [key, val] of Object.entries(FOLDER_MAP)) {
    const normKey = normalize(key)
    if (normFolder.startsWith(normKey.substring(0, 8)) || normKey.startsWith(normFolder.substring(0, 8))) {
      return val
    }
  }

  return null
}

async function main() {
  console.log('=== CORRIGINDO TIPOS E CATEGORIAS DOS DOCUMENTOS ===\n')

  // Buscar todos os documentos com legacyRef
  const docs = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, type, category, "legacyRef" FROM documents WHERE "legacyRef" IS NOT NULL ORDER BY "legacyRef"`
  )

  console.log(`Documentos com legacyRef: ${docs.length}`)

  let corrected = 0
  let skipped = 0
  let unmapped = 0
  const unmappedFolders = new Set<string>()

  // Processar em lotes de 100
  const BATCH = 100
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH)

    for (const doc of batch) {
      const mapping = getMapping(doc.legacyRef)
      if (!mapping) {
        unmapped++
        unmappedFolders.add(doc.legacyRef.split('/')[0]?.trim() ?? 'UNKNOWN')
        continue
      }

      // Só atualiza se tipo ou categoria estiver diferente
      if (doc.type === mapping.type && doc.category === mapping.category) {
        skipped++
        continue
      }

      await prisma.$executeRawUnsafe(
        `UPDATE documents SET type = $1, category = $2, "updatedAt" = NOW() WHERE id = $3`,
        mapping.type, mapping.category, doc.id
      )
      corrected++
    }

    if ((i + BATCH) % 500 === 0 || i + BATCH >= docs.length) {
      process.stdout.write(`\r  Processados: ${Math.min(i + BATCH, docs.length)}/${docs.length} | Corrigidos: ${corrected}`)
    }
  }

  console.log('\n')

  // Documentos sem legacyRef — manter como estão mas logar
  const noRef = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COUNT(*)::int as n FROM documents WHERE "legacyRef" IS NULL`
  )
  console.log(`Documentos sem legacyRef (não alterados): ${noRef[0].n}`)

  // Resultado final
  console.log('\n=== RESULTADO ===')
  console.log(`✓ Corrigidos:  ${corrected}`)
  console.log(`→ Já corretos: ${skipped}`)
  console.log(`✗ Sem mapeamento: ${unmapped}`)

  if (unmappedFolders.size > 0) {
    console.log('\nPastas sem mapeamento:')
    for (const f of unmappedFolders) {
      console.log(`  - "${f}"`)
    }
  }

  // Verificação final
  const finalTypes = await prisma.$queryRawUnsafe<any[]>(
    `SELECT type, COUNT(*)::int as n FROM documents GROUP BY type ORDER BY n DESC`
  )
  console.log('\nDistribuição final por tipo:')
  for (const r of finalTypes) {
    console.log(`  ${r.type}: ${r.n}`)
  }

  await prisma.$disconnect()
  console.log('\n✅ Concluído!')
}

main().catch(err => {
  console.error('Erro:', err)
  process.exit(1)
})
