/**
 * backfill-repasse-beneficiaries.ts
 *
 * Popula RepasseBeneficiary (rateio de repasse) a partir dos dados JÁ
 * existentes no AgoraEncontrei: para cada contrato ativo cujo imóvel tem
 * MAIS DE UM proprietário (PropertyOwner com percentual), cria um beneficiário
 * por proprietário com o respectivo %.
 *
 * Seguro por padrão:
 *   • Dry-run por padrão — só imprime o que faria. Use --apply para gravar.
 *   • Idempotente — pula contratos que já têm beneficiários cadastrados.
 *   • Escopo por empresa — exige --company <companyId>.
 *   • Só grava se a soma dos percentuais do imóvel for ~100%.
 *
 * Uso:
 *   npx tsx scripts/backfill-repasse-beneficiaries.ts --company <id>            (dry-run)
 *   npx tsx scripts/backfill-repasse-beneficiaries.ts --company <id> --apply    (grava)
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const APPLY = process.argv.includes('--apply')
const COMPANY_ID = arg('company')

async function main() {
  if (!COMPANY_ID) {
    console.error('ERRO: informe --company <companyId>')
    process.exit(1)
  }
  console.log(`[backfill-rateio] empresa=${COMPANY_ID} modo=${APPLY ? 'APLICAR' : 'DRY-RUN'}`)

  // Contratos ativos com imóvel vinculado.
  const contracts = await prisma.contract.findMany({
    where: { companyId: COMPANY_ID, propertyId: { not: null } },
    select: { id: true, propertyId: true, landlordName: true },
  })

  let created = 0, skippedExisting = 0, skippedSingle = 0, skippedSum = 0

  for (const c of contracts) {
    // Já tem rateio? pula (idempotente).
    const existing = await (prisma as any).repasseBeneficiary.count({ where: { contractId: c.id } })
    if (existing > 0) { skippedExisting++; continue }

    const owners = await prisma.propertyOwner.findMany({
      where: { propertyId: c.propertyId! },
      include: { contact: { select: { name: true } } },
    })
    // Só interessa rateio quando há 2+ proprietários.
    if (owners.length < 2) { skippedSingle++; continue }

    const sum = owners.reduce((s, o) => s + Number(o.percentage), 0)
    if (Math.abs(sum - 100) > 0.01) {
      skippedSum++
      console.warn(`  ! contrato ${c.id}: % do imóvel soma ${sum.toFixed(2)} (≠100) — pulado`)
      continue
    }

    const rows = owners.map((o) => ({
      companyId: COMPANY_ID!,
      contractId: c.id,
      clientId: null as string | null, // PropertyOwner liga a Contact, não Client — destino fica no fallback
      name: o.contact?.name ?? 'Proprietário',
      percentage: Number(o.percentage),
      role: 'OWNER',
    }))

    console.log(`  + contrato ${c.id}: ${rows.length} beneficiários (${rows.map(r => `${r.name} ${r.percentage}%`).join(', ')})`)
    if (APPLY) {
      await (prisma as any).repasseBeneficiary.createMany({ data: rows })
    }
    created += rows.length
  }

  console.log(`\n[backfill-rateio] resumo:`)
  console.log(`  beneficiários ${APPLY ? 'criados' : 'a criar'}: ${created}`)
  console.log(`  contratos pulados (já tinham rateio): ${skippedExisting}`)
  console.log(`  contratos pulados (imóvel com 1 dono): ${skippedSingle}`)
  console.log(`  contratos pulados (% ≠ 100): ${skippedSum}`)
  if (!APPLY) console.log(`\n  DRY-RUN — nada foi gravado. Rode novamente com --apply para aplicar.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
