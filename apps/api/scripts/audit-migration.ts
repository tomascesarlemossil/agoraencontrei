/**
 * Auditoria Completa da Integração do Backup
 * Verifica: URLs de arquivos, vinculações clientes/contratos/documentos, boletos
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cid = process.env.COMPANY_ID
  if (!cid) throw new Error('COMPANY_ID env var required')

  console.log('\n════════════════════════════════════════════════════')
  console.log('  AUDITORIA COMPLETA DA INTEGRAÇÃO DO BACKUP')
  console.log('════════════════════════════════════════════════════\n')

  // ── 1. Contagens gerais ─────────────────────────────────────────────────
  const [clients, properties, contracts, documents, rentals, legalCases] = await Promise.all([
    prisma.client.count({ where: { companyId: cid } }),
    prisma.property.count({ where: { companyId: cid } }),
    prisma.contract.count({ where: { companyId: cid } }),
    prisma.document.count({ where: { companyId: cid } }),
    prisma.rental.count({ where: { contract: { companyId: cid } } }),
    prisma.legalCase.count({ where: { companyId: cid } }).catch(() => 0),
  ])

  console.log('📊 CONTAGENS GERAIS:')
  console.log(`  Clientes:    ${clients}`)
  console.log(`  Imóveis:     ${properties}`)
  console.log(`  Contratos:   ${contracts}`)
  console.log(`  Documentos:  ${documents}`)
  console.log(`  Cobranças:   ${rentals}`)
  console.log(`  Processos:   ${legalCases}`)

  // ── 2. Documentos sem URL pública ───────────────────────────────────────
  const docsNoUrl = await prisma.document.count({
    where: { companyId: cid, publicUrl: null }
  })
  const docsWithUrl = await prisma.document.count({
    where: { companyId: cid, publicUrl: { not: null } }
  })
  console.log(`\n📁 DOCUMENTOS:`)
  console.log(`  Com URL pública:    ${docsWithUrl}`)
  console.log(`  Sem URL pública:    ${docsNoUrl}`)

  // ── 3. Documentos sem cliente vinculado ─────────────────────────────────
  const docsNoClient = await prisma.document.count({
    where: { companyId: cid, clientId: null }
  })
  const docsWithClient = await prisma.document.count({
    where: { companyId: cid, clientId: { not: null } }
  })
  console.log(`  Com cliente:        ${docsWithClient}`)
  console.log(`  Sem cliente:        ${docsNoClient}`)

  // ── 4. Documentos sem contrato vinculado ────────────────────────────────
  const docsNoContract = await prisma.document.count({
    where: { companyId: cid, contractId: null }
  })
  const docsWithContract = await prisma.document.count({
    where: { companyId: cid, contractId: { not: null } }
  })
  console.log(`  Com contrato:       ${docsWithContract}`)
  console.log(`  Sem contrato:       ${docsNoContract}`)

  // ── 5. Distribuição por tipo de documento ───────────────────────────────
  const byType = await prisma.document.groupBy({
    by: ['type'],
    where: { companyId: cid },
    _count: true,
    orderBy: { _count: { type: 'desc' } },
  })
  console.log(`\n📋 DISTRIBUIÇÃO POR TIPO:`)
  byType.forEach(t => console.log(`  ${t.type}: ${t._count}`))

  // ── 6. Distribuição por categoria ───────────────────────────────────────
  const byCategory = await prisma.document.groupBy({
    by: ['category'],
    where: { companyId: cid },
    _count: true,
    orderBy: { _count: { category: 'desc' } },
  })
  console.log(`\n📂 DISTRIBUIÇÃO POR CATEGORIA:`)
  byCategory.forEach(c => console.log(`  ${c.category ?? 'sem_categoria'}: ${c._count}`))

  // ── 7. Contratos sem inquilino vinculado ────────────────────────────────
  const contractsNoTenant = await prisma.contract.count({
    where: { companyId: cid, tenantId: null }
  })
  const contractsWithTenant = await prisma.contract.count({
    where: { companyId: cid, tenantId: { not: null } }
  })
  console.log(`\n📝 CONTRATOS:`)
  console.log(`  Com inquilino (DB): ${contractsWithTenant}`)
  console.log(`  Sem inquilino (DB): ${contractsNoTenant} (podem ter tenantName)`)

  // ── 8. Contratos ativos ─────────────────────────────────────────────────
  const contractsByStatus = await prisma.contract.groupBy({
    by: ['status'],
    where: { companyId: cid },
    _count: true,
  })
  console.log(`\n  Status dos contratos:`)
  contractsByStatus.forEach(s => console.log(`    ${s.status}: ${s._count}`))

  // ── 9. Cobranças por status ─────────────────────────────────────────────
  const rentalsByStatus = await prisma.rental.groupBy({
    by: ['status'],
    where: { contract: { companyId: cid } },
    _count: true,
    orderBy: { _count: { status: 'desc' } },
  })
  console.log(`\n💰 COBRANÇAS POR STATUS:`)
  rentalsByStatus.forEach(s => console.log(`  ${s.status}: ${s._count}`))

  // ── 10. Cobranças com Asaas ─────────────────────────────────────────────
  const rentalsWithAsaas = await prisma.rental.count({
    where: { contract: { companyId: cid }, asaasChargeId: { not: null } }
  })
  const rentalsNoAsaas = await prisma.rental.count({
    where: { contract: { companyId: cid }, asaasChargeId: null }
  })
  console.log(`\n🏦 COBRANÇAS ASAAS:`)
  console.log(`  Com ID Asaas:  ${rentalsWithAsaas}`)
  console.log(`  Sem ID Asaas:  ${rentalsNoAsaas}`)

  // ── 11. Clientes com CPF/CNPJ ───────────────────────────────────────────
  const clientsWithDoc = await prisma.client.count({
    where: { companyId: cid, OR: [{ cpf: { not: null } }, { cnpj: { not: null } }] }
  })
  const clientsNoDoc = await prisma.client.count({
    where: { companyId: cid, cpf: null, cnpj: null }
  })
  console.log(`\n👤 CLIENTES:`)
  console.log(`  Com CPF/CNPJ:  ${clientsWithDoc}`)
  console.log(`  Sem CPF/CNPJ:  ${clientsNoDoc}`)

  // ── 12. Clientes com Asaas ID ───────────────────────────────────────────
  const clientsWithAsaas = await prisma.client.count({
    where: { companyId: cid, asaasId: { not: null } }
  })
  const clientsNoAsaas = await prisma.client.count({
    where: { companyId: cid, asaasId: null }
  })
  console.log(`  Com Asaas ID:  ${clientsWithAsaas}`)
  console.log(`  Sem Asaas ID:  ${clientsNoAsaas}`)

  // ── 13. Imóveis com condomínio ──────────────────────────────────────────
  const propsWithCondo = await prisma.property.count({
    where: { companyId: cid, condoName: { not: null } }
  })
  const propsNoCondo = await prisma.property.count({
    where: { companyId: cid, condoName: null }
  })
  console.log(`\n🏢 IMÓVEIS:`)
  console.log(`  Com condoName: ${propsWithCondo}`)
  console.log(`  Sem condoName: ${propsNoCondo}`)

  // ── 14. Top 10 documentos recentes ─────────────────────────────────────
  const recentDocs = await prisma.document.findMany({
    where: { companyId: cid, publicUrl: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, name: true, type: true, publicUrl: true, clientId: true, contractId: true, createdAt: true }
  })
  console.log(`\n📄 ÚLTIMOS 5 DOCUMENTOS COM URL:`)
  recentDocs.forEach(d => {
    const url = d.publicUrl?.slice(0, 60) + (d.publicUrl && d.publicUrl.length > 60 ? '...' : '')
    console.log(`  [${d.type}] ${d.name} | cliente:${d.clientId ? '✓' : '✗'} contrato:${d.contractId ? '✓' : '✗'}`)
    console.log(`    URL: ${url}`)
  })

  // ── 15. Resumo de problemas ─────────────────────────────────────────────
  console.log(`\n════════════════════════════════════════════════════`)
  console.log('  RESUMO DE PENDÊNCIAS')
  console.log('════════════════════════════════════════════════════')
  if (docsNoUrl > 0) console.log(`  ⚠️  ${docsNoUrl} documentos sem URL pública`)
  if (docsNoClient > 0) console.log(`  ⚠️  ${docsNoClient} documentos sem cliente vinculado`)
  if (docsNoContract > 0) console.log(`  ℹ️  ${docsNoContract} documentos sem contrato (normal para docs de cliente)`)
  if (contractsNoTenant > 0) console.log(`  ℹ️  ${contractsNoTenant} contratos com inquilino apenas por nome (legado)`)
  if (clientsNoAsaas > 0) console.log(`  ℹ️  ${clientsNoAsaas} clientes sem ID Asaas (criado na 1ª cobrança)`)
  if (rentalsNoAsaas > 0) console.log(`  ℹ️  ${rentalsNoAsaas} cobranças sem ID Asaas (enviar via automação)`)
  console.log(`\n  ✅ Auditoria concluída!\n`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
