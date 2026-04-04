/**
 * migrate-contracts-to-asaas.ts
 *
 * Script de migração: cadastra todos os contratos ativos no Asaas
 * - Cruza dados do banco local com Asaas (CPF, contrato, inquilino)
 * - Valida integridade antes de criar qualquer cobrança
 * - Cria customers no Asaas para cada inquilino
 * - Gera a primeira cobrança (boleto) do mês atual
 * - Salva asaasId na invoice vinculada ao contrato
 *
 * USO: npx tsx scripts/migrate-contracts-to-asaas.ts [--dry-run] [--month YYYY-MM]
 *
 * Imobiliária Lemos — Multa: 10% | Juros: 1% ao mês
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

// Carrega .env da API (apps/api/.env)
config({ path: resolve(__dirname, '../apps/api/.env') })
config({ path: resolve(__dirname, '../.env') })

const ASAAS_BASE = 'https://api.asaas.com/v3'
const ASAAS_KEY = process.env.ASAAS_API_KEY ?? ''
const DRY_RUN = process.argv.includes('--dry-run')
const MONTH_ARG = process.argv.find((_, i, arr) => arr[i - 1] === '--month')

if (!ASAAS_KEY) {
  console.error('❌ ASAAS_API_KEY não configurada no .env')
  process.exit(1)
}

const prisma = new PrismaClient()

// ── Asaas API helpers ─────────────────────────────────────────────────────────
async function asaasRequest(method: string, path: string, body?: any): Promise<any> {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    method,
    headers: { 'access_token': ASAAS_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Asaas ${method} ${path}: ${JSON.stringify(data)}`)
  return data
}

async function findOrCreateAsaasCustomer(tenant: {
  id: string; name: string; document: string | null;
  email: string | null; phoneMobile: string | null; phone: string | null;
}): Promise<{ customerId: string; isNew: boolean }> {
  const cpf = (tenant.document ?? '').replace(/\D/g, '')
  if (!cpf || cpf.length < 11) {
    throw new Error(`CPF inválido: "${tenant.document}"`)
  }

  // Buscar pelo CPF no Asaas
  const existing = await asaasRequest('GET', `/customers?cpfCnpj=${cpf}`)
  if (existing.data?.length > 0) {
    return { customerId: existing.data[0].id, isNew: false }
  }

  // Buscar por externalReference (nosso ID interno)
  const byRef = await asaasRequest('GET', `/customers?externalReference=${tenant.id}`)
  if (byRef.data?.length > 0) {
    return { customerId: byRef.data[0].id, isNew: false }
  }

  // Criar novo
  const customer = await asaasRequest('POST', '/customers', {
    name: tenant.name,
    cpfCnpj: cpf,
    email: tenant.email ?? undefined,
    mobilePhone: (tenant.phoneMobile ?? tenant.phone ?? '').replace(/\D/g, '') || undefined,
    externalReference: tenant.id,
  })
  return { customerId: customer.id, isNew: true }
}

// ── Validação de dados ────────────────────────────────────────────────────────
interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

function validateContract(contract: any): ValidationResult {
  const result: ValidationResult = { valid: true, warnings: [], errors: [] }
  const tenant = contract.tenant

  // Validações críticas (impedem criação)
  if (!tenant) {
    result.errors.push('Inquilino não vinculado ao contrato')
    result.valid = false
  } else {
    const cpf = (tenant.document ?? '').replace(/\D/g, '')
    if (!cpf || cpf.length < 11) {
      result.errors.push(`CPF inválido: "${tenant.document}"`)
      result.valid = false
    }
    if (cpf.length === 11 && new Set(cpf.split('')).size === 1) {
      result.errors.push(`CPF com dígitos repetidos: ${cpf}`)
      result.valid = false
    }
    if (!tenant.name || tenant.name.trim().length < 3) {
      result.errors.push(`Nome do inquilino muito curto: "${tenant.name}"`)
      result.valid = false
    }
  }

  const rentValue = Number(contract.rentValue ?? 0)
  if (rentValue <= 0) {
    result.errors.push(`Valor do aluguel inválido: R$ ${rentValue}`)
    result.valid = false
  }
  if (rentValue > 50000) {
    result.warnings.push(`Valor muito alto: R$ ${rentValue.toFixed(2)} — verificar`)
  }

  if (!contract.propertyAddress && !contract.property?.street) {
    result.warnings.push('Sem endereço do imóvel')
  }

  // Validar datas
  if (contract.startDate) {
    const start = new Date(contract.startDate)
    if (start > new Date()) {
      result.warnings.push(`Contrato inicia no futuro: ${start.toLocaleDateString('pt-BR')}`)
    }
  }

  if (contract.rescissionDate) {
    result.warnings.push(`Contrato tem data de rescisão: ${new Date(contract.rescissionDate).toLocaleDateString('pt-BR')}`)
  }

  // Dia de vencimento
  const dueDay = contract.tenantDueDay ?? 5
  if (dueDay < 1 || dueDay > 28) {
    result.warnings.push(`Dia de vencimento incomum: ${dueDay}`)
  }

  return result
}

// ── Função principal ──────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║  MIGRAÇÃO DE CONTRATOS ATIVOS → ASAAS                          ║')
  console.log('║  Imobiliária Lemos — Multa: 10% | Juros: 1% ao mês            ║')
  console.log('║  Com validação e cruzamento de dados                           ║')
  console.log('╚══════════════════════════════════════════════════════════════════╝')
  console.log()

  if (DRY_RUN) console.log('🔍 MODO DRY-RUN: nenhuma alteração será feita\n')

  // Mês de referência
  const now = new Date()
  const [refYear, refMonth] = MONTH_ARG
    ? MONTH_ARG.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  console.log(`📅 Mês de referência: ${String(refMonth).padStart(2, '0')}/${refYear}`)

  // ── FASE 1: Buscar e validar dados ──────────────────────────────────────────
  console.log('\n═══ FASE 1: CARREGAMENTO E VALIDAÇÃO ═══\n')

  const contracts = await prisma.contract.findMany({
    where: { status: 'ACTIVE', isActive: true, rentValue: { not: null }, tenantId: { not: null } },
    include: {
      tenant: { select: { id: true, name: true, document: true, email: true, phoneMobile: true, phone: true } },
      landlord: { select: { id: true, name: true, document: true } },
      property: { select: { id: true, reference: true, street: true, neighborhood: true, city: true, condoFee: true, iptu: true } },
    },
    orderBy: [{ legacyId: 'asc' }],
  })

  console.log(`📋 Total de contratos ativos: ${contracts.length}`)

  // Verificar duplicatas de inquilino (mesmo CPF em contratos diferentes)
  const cpfMap = new Map<string, { contractIds: string[]; name: string }>()
  for (const c of contracts) {
    const cpf = (c.tenant?.document ?? '').replace(/\D/g, '')
    if (cpf) {
      const existing = cpfMap.get(cpf)
      if (existing) {
        existing.contractIds.push(c.legacyId ?? c.id)
      } else {
        cpfMap.set(cpf, { contractIds: [c.legacyId ?? c.id], name: c.tenant!.name })
      }
    }
  }

  // Exibir inquilinos com múltiplos contratos (não é erro, apenas informativo)
  const multipleContracts = [...cpfMap.entries()].filter(([, v]) => v.contractIds.length > 1)
  if (multipleContracts.length > 0) {
    console.log(`\n⚠ ${multipleContracts.length} inquilino(s) com múltiplos contratos ativos:`)
    for (const [cpf, { contractIds, name }] of multipleContracts) {
      console.log(`  ${name} (CPF: ${cpf}) → Contratos: ${contractIds.join(', ')}`)
    }
  }

  // Validar todos os contratos
  const validContracts: typeof contracts = []
  const invalidContracts: { contract: typeof contracts[0]; errors: string[] }[] = []
  const warningContracts: { contract: typeof contracts[0]; warnings: string[] }[] = []

  for (const c of contracts) {
    const validation = validateContract(c)
    if (!validation.valid) {
      invalidContracts.push({ contract: c, errors: validation.errors })
    } else {
      validContracts.push(c)
      if (validation.warnings.length > 0) {
        warningContracts.push({ contract: c, warnings: validation.warnings })
      }
    }
  }

  console.log(`\n✅ Contratos válidos: ${validContracts.length}`)
  console.log(`❌ Contratos inválidos (serão pulados): ${invalidContracts.length}`)
  console.log(`⚠ Contratos com avisos (serão processados): ${warningContracts.length}`)

  if (invalidContracts.length > 0) {
    console.log('\n── CONTRATOS INVÁLIDOS ──')
    for (const { contract: c, errors } of invalidContracts) {
      console.log(`  ${c.legacyId ?? c.id} | ${c.tenant?.name ?? 'SEM INQUILINO'} | ${errors.join('; ')}`)
    }
  }

  if (warningContracts.length > 0) {
    console.log('\n── CONTRATOS COM AVISOS ──')
    for (const { contract: c, warnings } of warningContracts) {
      console.log(`  ${c.legacyId ?? c.id} | ${c.tenant?.name ?? '?'} | ${warnings.join('; ')}`)
    }
  }

  // ── FASE 2: Verificar cobranças existentes no Asaas ─────────────────────────
  console.log('\n═══ FASE 2: CRUZAMENTO COM ASAAS ═══\n')

  // Buscar cobranças já existentes no mês no Asaas
  let existingAsaasCharges = 0
  const existingInvoices = await prisma.invoice.findMany({
    where: {
      companyId: contracts[0]?.companyId,
      dueDate: { gte: new Date(refYear, refMonth - 1, 1), lt: new Date(refYear, refMonth, 1) },
      asaasId: { not: null },
    },
    select: { contractId: true, asaasId: true },
  })
  const invoicedContractIds = new Set(existingInvoices.map(i => i.contractId))
  existingAsaasCharges = existingInvoices.length

  console.log(`📊 Cobranças Asaas já existentes no mês: ${existingAsaasCharges}`)
  console.log(`📊 Contratos a processar: ${validContracts.length - existingAsaasCharges}`)

  // ── FASE 3: Processamento ───────────────────────────────────────────────────
  console.log('\n═══ FASE 3: PROCESSAMENTO ═══\n')

  const results = {
    total: validContracts.length,
    customersCreated: 0,
    customersExisting: 0,
    chargesCreated: 0,
    chargesSkipped: 0,
    errors: [] as string[],
    created: [] as { contractId: string; chargeId: string; value: number; tenant: string }[],
  }

  for (let i = 0; i < validContracts.length; i++) {
    const contract = validContracts[i]
    const tenant = contract.tenant!
    const landlord = contract.landlord
    const rentValue = Number(contract.rentValue ?? 0)
    const dueDay = contract.tenantDueDay ?? 5
    const dueDayFixed = Math.min(Math.max(dueDay, 1), 28)
    const dueDate = `${refYear}-${String(refMonth).padStart(2, '0')}-${String(dueDayFixed).padStart(2, '0')}`

    // Calcular encargos adicionais
    const bankFee = Number((contract as any).bankFee ?? 3.50)
    const iptuAnnual = Number((contract as any).iptuAnnual ?? (contract as any).property?.iptu ?? 0)
    const iptuParcels = Number((contract as any).iptuParcels ?? (iptuAnnual > 0 ? 8 : 0))
    let iptuAmount = 0
    let iptuParcela = ''
    if (iptuAnnual > 0 && iptuParcels > 0 && refMonth <= iptuParcels) {
      iptuAmount = Math.round((iptuAnnual / iptuParcels) * 100) / 100
      iptuParcela = `${refMonth}/${iptuParcels}`
    }
    const condoFee = Number((contract as any).property?.condoFee ?? 0)
    const totalValue = rentValue + iptuAmount + bankFee + condoFee

    const contractRef = contract.legacyId ?? contract.id.slice(0, 8)

    console.log(`[${i + 1}/${validContracts.length}] Contrato: ${contractRef}`)
    console.log(`  Inquilino: ${tenant.name} | CPF: ${tenant.document}`)
    console.log(`  Proprietário: ${landlord?.name ?? 'N/A'}`)
    console.log(`  Imóvel: ${contract.propertyAddress ?? contract.property?.street ?? 'N/A'}`)
    console.log(`  Aluguel: R$ ${rentValue.toFixed(2)}${iptuAmount > 0 ? ` + IPTU ${iptuParcela}: R$ ${iptuAmount.toFixed(2)}` : ''}${condoFee > 0 ? ` + Cond: R$ ${condoFee.toFixed(2)}` : ''} + Tx: R$ ${bankFee.toFixed(2)} = R$ ${totalValue.toFixed(2)}`)
    console.log(`  Vencimento: dia ${dueDayFixed} → ${dueDate}`)

    // Já tem cobrança no mês?
    if (invoicedContractIds.has(contract.id)) {
      console.log(`  ⏭ Já possui cobrança Asaas neste mês`)
      results.chargesSkipped++
      continue
    }

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] OK — criaria customer + cobrança R$ ${totalValue.toFixed(2)}`)
      results.chargesSkipped++
      continue
    }

    try {
      // 1. Criar/buscar customer no Asaas (cruza por CPF e por ID interno)
      const { customerId, isNew } = await findOrCreateAsaasCustomer(tenant)
      if (isNew) {
        console.log(`  + Customer criado: ${customerId}`)
        results.customersCreated++
      } else {
        console.log(`  ✓ Customer existente: ${customerId}`)
        results.customersExisting++
      }

      // 2. Verificar se já existe cobrança no Asaas com nosso externalReference
      const existingCharge = await asaasRequest('GET', `/payments?externalReference=${contract.id}&limit=1`)
      if (existingCharge.data?.length > 0) {
        const existing = existingCharge.data[0]
        const existingDue = existing.dueDate
        if (existingDue?.startsWith(`${refYear}-${String(refMonth).padStart(2, '0')}`)) {
          console.log(`  ⏭ Cobrança já existe no Asaas: ${existing.id} (${existingDue})`)
          // Salvar no banco local se não existir
          const localInvoice = await prisma.invoice.findFirst({ where: { asaasId: existing.id } })
          if (!localInvoice) {
            await prisma.invoice.create({
              data: {
                companyId: contract.companyId, contractId: contract.id,
                dueDate: new Date(existingDue), issueDate: new Date(), amount: existing.value,
                asaasId: existing.id, asaasStatus: existing.status,
                asaasBankSlipUrl: existing.bankSlipUrl ?? existing.invoiceUrl ?? null,
                cedente: 'IMOBILIARIA LEMOS', nossoNumero: existing.nossoNumero ?? null,
              },
            })
            console.log(`  + Invoice local criada (sincronizada do Asaas)`)
          }
          results.chargesSkipped++
          continue
        }
      }

      // 3. Montar descrição com lançamentos detalhados (padrão Lemos)
      const endereco = contract.propertyAddress ?? contract.property?.street ?? 'Imóvel'
      const mesRef = `${String(refMonth).padStart(2, '0')}/${refYear}`
      const descLines = [
        `Aluguel — ${endereco}`,
        `Contrato: ${contractRef} | Inquilino: ${tenant.name}`,
        `Proprietário: ${landlord?.name ?? 'N/A'}`,
        `ALUGUEL ${mesRef}: R$ ${rentValue.toFixed(2)}`,
      ]
      if (iptuAmount > 0) descLines.push(`IPTU PARCELA ${iptuParcela}: R$ ${iptuAmount.toFixed(2)}`)
      if (condoFee > 0) descLines.push(`CONDOMÍNIO: R$ ${condoFee.toFixed(2)}`)
      if (bankFee > 0) descLines.push(`Tx Bancária: R$ ${bankFee.toFixed(2)}`)
      descLines.push(
        'NAO RECEBER APOS 5 DIAS DO VENCIMENTO',
        `Apos o vencto cobrar multa de : R$ ${(totalValue * 0.10).toFixed(2)}`,
        `Apos o vencto cobrar juros de mora de R$: ${(totalValue * 0.01 / 30).toFixed(2)} ao dia`,
      )

      // 4. Criar cobrança no Asaas
      const charge = await asaasRequest('POST', '/payments', {
        customer: customerId,
        billingType: 'BOLETO',
        value: totalValue,
        dueDate,
        description: descLines.join('\n'),
        externalReference: contract.id,
        fine: { value: 10 },
        interest: { value: 1 },
      })

      console.log(`  ✅ Cobrança: ${charge.id} | Boleto: ${charge.bankSlipUrl}`)

      // 5. Criar invoice no banco local
      await prisma.invoice.create({
        data: {
          companyId: contract.companyId, contractId: contract.id,
          dueDate: new Date(dueDate), issueDate: new Date(), amount: totalValue,
          asaasId: charge.id, asaasStatus: charge.status,
          asaasBankSlipUrl: charge.bankSlipUrl ?? charge.invoiceUrl ?? null,
          cedente: 'IMOBILIARIA LEMOS', nossoNumero: charge.nossoNumero ?? null,
          mensagem: descLines.join('\n'),
          instrucoes: 'NAO RECEBER APOS 5 DIAS DO VENCIMENTO',
        },
      })

      // 6. Criar rental com todos os lançamentos
      const existingRental = await prisma.rental.findFirst({
        where: {
          contractId: contract.id,
          dueDate: { gte: new Date(refYear, refMonth - 1, 1), lt: new Date(refYear, refMonth, 1) },
        },
      })
      if (!existingRental) {
        await prisma.rental.create({
          data: {
            companyId: contract.companyId, contractId: contract.id,
            dueDate: new Date(dueDate),
            rentAmount:     rentValue,
            condoAmount:    condoFee > 0 ? condoFee : null,
            iptuAmount:     iptuAmount > 0 ? iptuAmount : null,
            iptuParcela:    iptuParcela || null,
            bankFeeAmount:  bankFee > 0 ? bankFee : null,
            totalAmount:    totalValue,
            status: new Date(dueDate) < new Date() ? 'LATE' : 'PENDING',
          },
        })
      }

      results.chargesCreated++
      results.created.push({ contractId: contractRef, chargeId: charge.id, value: totalValue, tenant: tenant.name })

      // Rate limiting
      await new Promise(r => setTimeout(r, 1200))

    } catch (err: any) {
      console.error(`  ❌ ERRO: ${err.message}`)
      results.errors.push(`Contrato ${contractRef} (${tenant.name}): ${err.message}`)
    }
  }

  // ── RELATÓRIO FINAL ─────────────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(66))
  console.log('  RELATÓRIO FINAL DA MIGRAÇÃO')
  console.log('═'.repeat(66))
  console.log(`  Mês de referência:          ${String(refMonth).padStart(2, '0')}/${refYear}`)
  console.log(`  Total de contratos ativos:  ${contracts.length}`)
  console.log(`  Contratos válidos:          ${validContracts.length}`)
  console.log(`  Contratos inválidos:        ${invalidContracts.length}`)
  console.log('─'.repeat(66))
  console.log(`  Customers criados (novos):  ${results.customersCreated}`)
  console.log(`  Customers existentes:       ${results.customersExisting}`)
  console.log(`  Cobranças criadas:          ${results.chargesCreated}`)
  console.log(`  Cobranças puladas:          ${results.chargesSkipped}`)
  console.log(`  Erros:                      ${results.errors.length}`)
  console.log('─'.repeat(66))

  if (results.created.length > 0) {
    const totalFaturado = results.created.reduce((s, c) => s + c.value, 0)
    console.log(`  💰 TOTAL FATURADO:          R$ ${totalFaturado.toFixed(2)}`)
  }

  console.log('═'.repeat(66))

  if (results.errors.length > 0) {
    console.log('\n❌ ERROS DETALHADOS:')
    results.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`))
  }

  if (invalidContracts.length > 0) {
    console.log('\n📋 CONTRATOS NÃO MIGRADOS (corrigir dados):')
    for (const { contract: c, errors } of invalidContracts) {
      console.log(`  • ${c.legacyId ?? c.id} | ${c.tenant?.name ?? 'SEM INQUILINO'} | ${errors.join('; ')}`)
    }
  }

  if (DRY_RUN) {
    console.log('\n🔍 Modo DRY-RUN: nenhuma alteração foi feita.')
    console.log('   Rode sem --dry-run para executar de verdade.')
  } else if (results.chargesCreated > 0) {
    console.log(`\n✅ Migração concluída com sucesso!`)
    console.log(`   ${results.chargesCreated} cobranças criadas no Asaas.`)
    console.log(`   Acesse https://www.asaas.com para verificar.`)
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Erro fatal:', e)
  await prisma.$disconnect()
  process.exit(1)
})
