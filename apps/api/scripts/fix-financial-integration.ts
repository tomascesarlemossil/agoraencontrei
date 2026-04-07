/**
 * fix-financial-integration.ts  (versão otimizada com SQL em lote)
 *
 * 1. Corrige tipos/categorias de todos os documentos via UPDATE em lote
 * 2. Corrige subtipos: IPTU dentro de boletos, reajustes, extratos
 * 3. Vincula boletos/reajustes a contratos ativos via clientId
 * 4. Atualiza month/year dos boletos pelo padrão MM.AAAA no legacyRef
 * 5. Gera relatório final
 *
 * Uso: npx tsx scripts/fix-financial-integration.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run(label: string, sql: string, ...params: any[]) {
  try {
    const result = await prisma.$executeRawUnsafe(sql, ...params)
    console.log(`  ✓ ${label}: ${result} linhas`)
    return result
  } catch (e: any) {
    console.error(`  ✗ ${label}: ${e.message}`)
    return 0
  }
}

async function query<T = any>(sql: string, ...params: any[]): Promise<T[]> {
  return prisma.$queryRawUnsafe<T>(sql, ...params)
}

async function main() {
  console.log('=== INTEGRAÇÃO FINANCEIRA DE DOCUMENTOS (v2 - lote) ===\n')

  // ── ETAPA 1: Corrigir tipos por pasta raiz ────────────────────────────────
  console.log('ETAPA 1: Corrigindo tipos por pasta raiz...')

  // LOCAÇÃO → CONTRATO/locacao
  await run('LOCAÇAO→CONTRATO',
    `UPDATE documents SET type='CONTRATO', category='locacao', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'LOCA%' AND (type != 'CONTRATO' OR category != 'locacao')`)

  // RECEPÇÃO → DOCUMENTO/locacao
  await run('RECEPÇÃO→DOCUMENTO',
    `UPDATE documents SET type='DOCUMENTO', category='locacao', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'RECEP%' AND (type != 'DOCUMENTO' OR category != 'locacao')`)

  // VISTORIAS → VISTORIA/vistoria
  await run('VISTORIAS→VISTORIA',
    `UPDATE documents SET type='VISTORIA', category='vistoria', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'VISTORIA%' AND (type != 'VISTORIA' OR category != 'vistoria')`)

  // VENDAS → CONTRATO/vendas
  await run('VENDAS→CONTRATO',
    `UPDATE documents SET type='CONTRATO', category='vendas', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'VENDAS%' AND (type != 'CONTRATO' OR category != 'vendas')`)

  // ARQUIVO MORTO → DOCUMENTO/arquivo_morto
  await run('ARQUIVO MORTO→DOCUMENTO',
    `UPDATE documents SET type='DOCUMENTO', category='arquivo_morto', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'ARQUIVO MORTO%' AND (type != 'DOCUMENTO' OR category != 'arquivo_morto')`)

  // JURIDICO → JURIDICO/juridico
  await run('JURIDICO→JURIDICO',
    `UPDATE documents SET type='JURIDICO', category='juridico', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'JURIDICO%' AND (type != 'JURIDICO' OR category != 'juridico')`)

  // IPTU 2026 → FINANCEIRO/iptu
  await run('IPTU 2026→FINANCEIRO/iptu',
    `UPDATE documents SET type='FINANCEIRO', category='iptu', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'IPTU 2026%' AND (type != 'FINANCEIRO' OR category != 'iptu')`)

  // RESCISÃO → RESCISAO/rescisao
  await run('RESCISÃO→RESCISAO',
    `UPDATE documents SET type='RESCISAO', category='rescisao', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'RESCIS%' AND (type != 'RESCISAO' OR category != 'rescisao')`)

  // ADITIVO → ADITIVO/aditivo
  await run('ADITIVO→ADITIVO',
    `UPDATE documents SET type='ADITIVO', category='aditivo', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'ADITIVO%' AND (type != 'ADITIVO' OR category != 'aditivo')`)

  // CONT. PRESTAÇÃO → CONTRATO/prestacao_servico
  await run('PRESTAÇÃO→CONTRATO',
    `UPDATE documents SET type='CONTRATO', category='prestacao_servico', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'CONT. PREST%' AND (type != 'CONTRATO' OR category != 'prestacao_servico')`)

  // FOLDER SEGURO → DOCUMENTO/seguro
  await run('SEGURO→DOCUMENTO',
    `UPDATE documents SET type='DOCUMENTO', category='seguro', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'FOLDER SEGURO%' AND (type != 'DOCUMENTO' OR category != 'seguro')`)

  // ── ETAPA 2: Corrigir subtipos dentro de FINANCEIRO 2026 ─────────────────
  console.log('\nETAPA 2: Corrigindo subtipos financeiros...')

  // BOLETOS dentro de FINANCEIRO/INQUILINOS/BOLETOS → BOLETO/financeiro
  await run('BOLETOS→BOLETO/financeiro',
    `UPDATE documents SET type='BOLETO', category='financeiro', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'FINANCEIRO 2026/INQUILINOS/BOLETOS%'
     AND (type != 'BOLETO' OR category != 'financeiro')`)

  // REAJUSTE ALUGUEL → REAJUSTE/financeiro
  await run('REAJUSTE→REAJUSTE/financeiro',
    `UPDATE documents SET type='REAJUSTE', category='financeiro', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'FINANCEIRO 2026/INQUILINOS/REAJUSTE%'
     AND (type != 'REAJUSTE' OR category != 'financeiro')`)

  // EXTRATO → EXTRATO/financeiro
  await run('EXTRATO→EXTRATO/financeiro',
    `UPDATE documents SET type='EXTRATO', category='financeiro', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'FINANCEIRO 2026/INQUILINOS/EXTRATO%'
     AND (type != 'EXTRATO' OR category != 'financeiro')`)

  // IPTU dentro de boletos (arquivo com "iptu" no nome) → FINANCEIRO/iptu
  await run('IPTU nos boletos→FINANCEIRO/iptu',
    `UPDATE documents SET type='FINANCEIRO', category='iptu', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'FINANCEIRO 2026/INQUILINOS/BOLETOS%'
     AND (LOWER(name) LIKE '%iptu%' OR LOWER("legacyRef") LIKE '%iptu%')
     AND (type != 'FINANCEIRO' OR category != 'iptu')`)

  // PROPRIETÁRIOS/IPTU → FINANCEIRO/iptu
  await run('PROPRIETÁRIOS IPTU→FINANCEIRO/iptu',
    `UPDATE documents SET type='FINANCEIRO', category='iptu', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'FINANCEIRO 2026/PROPRIETARIOS/IPTU%'
     AND (type != 'FINANCEIRO' OR category != 'iptu')`)

  // Genérico FINANCEIRO 2026 restante → FINANCEIRO/financeiro
  await run('FINANCEIRO genérico→FINANCEIRO/financeiro',
    `UPDATE documents SET type='FINANCEIRO', category='financeiro', "updatedAt"=NOW()
     WHERE "legacyRef" ILIKE 'FINANCEIRO 2026%'
     AND type NOT IN ('BOLETO','REAJUSTE','EXTRATO')
     AND category NOT IN ('iptu','financeiro')`)

  // ── ETAPA 3: Atualizar month/year dos boletos pelo padrão MM.AAAA ────────
  console.log('\nETAPA 3: Atualizando mês/ano dos boletos...')

  // Extrai MM.AAAA do legacyRef: ex "BOLETOS 2026/10.2026 - Nome/arquivo.pdf"
  await run('Boletos month/year',
    `UPDATE documents SET
       month = split_part(split_part("legacyRef", '/', 4), '.', 1),
       year  = CAST(split_part(split_part("legacyRef", '/', 4), '.', 2) AS INTEGER),
       "updatedAt" = NOW()
     WHERE type = 'BOLETO'
       AND "legacyRef" ILIKE 'FINANCEIRO 2026/INQUILINOS/BOLETOS%'
       AND split_part("legacyRef", '/', 4) ~ '^[0-9]{2}\\.[0-9]{4}'
       AND (month IS NULL OR year IS NULL OR year < 2020)`)

  // Reajustes: extrai mês/ano da subpasta MM.AAAA
  await run('Reajustes month/year',
    `UPDATE documents SET
       month = split_part(split_part("legacyRef", '/', 4), '.', 1),
       year  = CAST(split_part(split_part("legacyRef", '/', 4), '.', 2) AS INTEGER),
       "updatedAt" = NOW()
     WHERE type = 'REAJUSTE'
       AND "legacyRef" ILIKE 'FINANCEIRO 2026/INQUILINOS/REAJUSTE%'
       AND split_part("legacyRef", '/', 4) ~ '^[0-9]{2}\\.[0-9]{4}'
       AND (month IS NULL OR year IS NULL OR year < 2020)`)

  // ── ETAPA 4: Vincular boletos a contratos via clientId ───────────────────
  console.log('\nETAPA 4: Vinculando boletos a contratos...')

  // Boletos que já têm clientId mas não têm contractId — vincular ao contrato ativo do cliente
  await run('Boletos clientId→contractId',
    `UPDATE documents d SET
       "contractId" = c.id,
       "updatedAt" = NOW()
     FROM contracts c
     WHERE d.type = 'BOLETO'
       AND d."clientId" = c."tenantId"
       AND c."isActive" = true
       AND d."contractId" IS NULL
       AND d."clientId" IS NOT NULL`)

  // Reajustes que já têm clientId mas não têm contractId
  await run('Reajustes clientId→contractId',
    `UPDATE documents d SET
       "contractId" = c.id,
       "updatedAt" = NOW()
     FROM contracts c
     WHERE d.type = 'REAJUSTE'
       AND d."clientId" = c."tenantId"
       AND c."isActive" = true
       AND d."contractId" IS NULL
       AND d."clientId" IS NOT NULL`)

  // Extratos que já têm clientId mas não têm contractId
  await run('Extratos clientId→contractId',
    `UPDATE documents d SET
       "contractId" = c.id,
       "updatedAt" = NOW()
     FROM contracts c
     WHERE d.type = 'EXTRATO'
       AND d."clientId" = c."tenantId"
       AND c."isActive" = true
       AND d."contractId" IS NULL
       AND d."clientId" IS NOT NULL`)

  // ── ETAPA 5: Relatório final ─────────────────────────────────────────────
  console.log('\n=== RELATÓRIO FINAL ===')

  const types = await query<any>(
    `SELECT type, COUNT(*)::int as n FROM documents GROUP BY type ORDER BY n DESC`)
  console.log('\nDistribuição por tipo:')
  for (const r of types) console.log(`  ${r.type || '(null)'}: ${r.n}`)

  const cats = await query<any>(
    `SELECT category, COUNT(*)::int as n FROM documents GROUP BY category ORDER BY n DESC`)
  console.log('\nDistribuição por categoria:')
  for (const r of cats) console.log(`  ${r.category || '(null)'}: ${r.n}`)

  const linked = await query<any>(
    `SELECT
       COUNT(*)::int as total,
       COUNT("contractId")::int as com_contrato,
       COUNT("clientId")::int as com_cliente
     FROM documents WHERE type = 'BOLETO'`)
  console.log(`\nBoletos: total=${linked[0].total} | com_contrato=${linked[0].com_contrato} | com_cliente=${linked[0].com_cliente}`)

  const withUrl = await query<any>(
    `SELECT COUNT(*)::int as n FROM documents WHERE metadata->>'publicUrl' IS NOT NULL`)
  console.log(`Documentos com URL pública: ${withUrl[0].n}`)

  const activeContracts = await query<any>(
    `SELECT COUNT(*)::int as n FROM contracts WHERE "isActive" = true`)
  console.log(`Contratos ativos: ${activeContracts[0].n}`)

  const contractsWithDocs = await query<any>(
    `SELECT COUNT(DISTINCT "contractId")::int as n FROM documents WHERE "contractId" IS NOT NULL`)
  console.log(`Contratos com documentos vinculados: ${contractsWithDocs[0].n}`)

  await prisma.$disconnect()
  console.log('\n✅ Integração financeira concluída!')
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
