/**
 * populate-contract-fields.ts
 *
 * Preenche os novos campos dos contratos com dados do backup Uniloc:
 * - adjustmentMonth: calculado a partir de startDate (mês do aniversário do contrato)
 * - iptuAnnual: valor do IPTU anual do imóvel vinculado (Property.iptu)
 * - iptuParcels: padrão 8 parcelas (Franca/SP)
 * - bankFee: padrão R$ 3,50 (taxa bancária Sicredi/Asaas)
 * - adminFeePercent: da comissão do contrato (Contract.commission)
 * - condoIncluded/waterIncluded/electricIncluded/iptuIncluded: mantém os valores existentes
 *
 * USO: npx tsx scripts/populate-contract-fields.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../apps/api/.env') })
config({ path: resolve(__dirname, '../.env') })

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  POPULAR CAMPOS NOVOS DOS CONTRATOS COM DADOS DO BACKUP    ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  if (DRY_RUN) console.log('🔍 MODO DRY-RUN\n')

  // 1. Buscar contratos ativos com propriedade vinculada
  const contracts = await prisma.contract.findMany({
    where: { status: 'ACTIVE', isActive: true },
    include: {
      property: { select: { id: true, iptu: true, condoFee: true } },
    },
  })

  console.log(`📋 Contratos ativos: ${contracts.length}\n`)

  let updated = 0
  let skipped = 0
  const changes: string[] = []

  for (const contract of contracts) {
    const updates: Record<string, any> = {}
    const log: string[] = []

    // adjustmentMonth — mês do aniversário do contrato (para reajuste anual)
    if (!contract.adjustmentMonth && contract.startDate) {
      const month = contract.startDate.getMonth() + 1 // 1-12
      updates.adjustmentMonth = month
      log.push(`adjustmentMonth=${month}`)
    }

    // iptuAnnual — do imóvel vinculado
    if (!contract.iptuAnnual && contract.property?.iptu) {
      const iptu = Number(contract.property.iptu)
      if (iptu > 0) {
        updates.iptuAnnual = iptu
        updates.iptuParcels = contract.iptuParcels ?? 8 // padrão Franca: 8 parcelas
        log.push(`iptuAnnual=R$${iptu.toFixed(2)} (${updates.iptuParcels}x)`)
      }
    }

    // bankFee — padrão R$ 3,50
    if (!contract.bankFee) {
      updates.bankFee = 3.50
      log.push('bankFee=R$3,50')
    }

    // adminFeePercent — da comissão do contrato
    if (!contract.adminFeePercent && contract.commission) {
      const comm = Number(contract.commission)
      if (comm > 0) {
        updates.adminFeePercent = comm
        log.push(`adminFeePercent=${comm}%`)
      }
    }

    if (Object.keys(updates).length === 0) {
      skipped++
      continue
    }

    const ref = contract.legacyId ?? contract.id.slice(0, 8)
    console.log(`[${ref}] ${contract.tenantName ?? 'N/A'}: ${log.join(' | ')}`)

    if (!DRY_RUN) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: updates,
      })
    }

    updated++
    changes.push(`${ref}: ${log.join(', ')}`)
  }

  // 2. Buscar dados do FinancialForecast (histórico Uniloc) para contratos sem IPTU
  console.log('\n\n═══ FASE 2: IPTU do FinancialForecast (Uniloc) ═══\n')

  const contractsWithoutIptu = await prisma.contract.findMany({
    where: { status: 'ACTIVE', isActive: true, iptuAnnual: DRY_RUN ? undefined : null },
    select: { id: true, legacyId: true, tenantName: true, tenantId: true },
  })

  let iptuFromForecast = 0

  for (const c of contractsWithoutIptu) {
    if (!c.tenantId) continue

    // Buscar valorIptu do forecast mais recente
    const forecast = await prisma.financialForecast.findFirst({
      where: { tenantId: c.tenantId, valorIptu: { not: null, gt: 0 } },
      orderBy: { dueDate: 'desc' },
      select: { valorIptu: true, month: true, year: true },
    })

    if (forecast?.valorIptu) {
      const iptuMensal = Number(forecast.valorIptu)
      const iptuAnual = Math.round(iptuMensal * 8 * 100) / 100 // 8 parcelas estimativas
      const ref = c.legacyId ?? c.id.slice(0, 8)
      console.log(`[${ref}] ${c.tenantName}: IPTU mensal R$${iptuMensal.toFixed(2)} → anual R$${iptuAnual.toFixed(2)} (estimado 8x)`)

      if (!DRY_RUN) {
        await prisma.contract.update({
          where: { id: c.id },
          data: { iptuAnnual: iptuAnual, iptuParcels: 8 },
        })
      }
      iptuFromForecast++
    }
  }

  // 3. Relatório
  console.log('\n\n' + '═'.repeat(60))
  console.log('  RELATÓRIO')
  console.log('═'.repeat(60))
  console.log(`  Contratos atualizados:          ${updated}`)
  console.log(`  Contratos sem alteração:         ${skipped}`)
  console.log(`  IPTU recuperado do forecast:     ${iptuFromForecast}`)
  console.log('═'.repeat(60))

  if (DRY_RUN) {
    console.log('\n🔍 Modo DRY-RUN. Rode sem --dry-run para aplicar.')
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Erro:', e)
  await prisma.$disconnect()
  process.exit(1)
})
