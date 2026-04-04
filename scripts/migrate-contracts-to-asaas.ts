/**
 * migrate-contracts-to-asaas.ts
 *
 * Script de migração: cadastra todos os contratos ativos no Asaas
 * - Cria customers no Asaas para cada inquilino
 * - Gera a primeira cobrança (boleto) do mês atual
 * - Salva asaasCustomerId no client e asaasId na invoice
 *
 * USO: npx tsx scripts/migrate-contracts-to-asaas.ts [--dry-run] [--month YYYY-MM]
 *
 * Imobiliária Lemos — Multa: 10% | Juros: 1% ao mês
 */

import { PrismaClient } from '@prisma/client'

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
    headers: {
      'access_token': ASAAS_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Asaas ${method} ${path} failed: ${JSON.stringify(data)}`)
  }
  return data
}

async function findOrCreateAsaasCustomer(tenant: {
  id: string; name: string; document: string | null;
  email: string | null; phoneMobile: string | null; phone: string | null;
}): Promise<string> {
  const cpf = (tenant.document ?? '').replace(/\D/g, '')
  if (!cpf || cpf.length < 11) {
    throw new Error(`CPF inválido para ${tenant.name}: "${tenant.document}"`)
  }

  // Buscar customer existente pelo CPF
  const existing = await asaasRequest('GET', `/customers?cpfCnpj=${cpf}`)
  if (existing.data?.length > 0) {
    console.log(`  ✓ Cliente já existe no Asaas: ${existing.data[0].id} (${tenant.name})`)
    return existing.data[0].id
  }

  // Criar novo customer
  const customer = await asaasRequest('POST', '/customers', {
    name: tenant.name,
    cpfCnpj: cpf,
    email: tenant.email ?? undefined,
    mobilePhone: (tenant.phoneMobile ?? tenant.phone ?? '').replace(/\D/g, '') || undefined,
    externalReference: tenant.id,
  })
  console.log(`  + Cliente criado no Asaas: ${customer.id} (${tenant.name})`)
  return customer.id
}

async function createAsaasCharge(params: {
  customerId: string
  value: number
  dueDate: string
  description: string
  externalReference: string
}): Promise<any> {
  return asaasRequest('POST', '/payments', {
    customer: params.customerId,
    billingType: 'BOLETO',
    value: params.value,
    dueDate: params.dueDate,
    description: params.description,
    externalReference: params.externalReference,
    fine: { value: 10 },     // 10% multa (padrão Imobiliária Lemos)
    interest: { value: 1 },  // 1% ao mês juros de mora
  })
}

// ── Função principal ──────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  MIGRAÇÃO DE CONTRATOS ATIVOS → ASAAS                      ║')
  console.log('║  Imobiliária Lemos — Multa: 10% | Juros: 1% ao mês        ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  if (DRY_RUN) {
    console.log('🔍 MODO DRY-RUN: nenhuma alteração será feita\n')
  }

  // Determinar mês de referência
  const now = new Date()
  const [refYear, refMonth] = MONTH_ARG
    ? MONTH_ARG.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  console.log(`📅 Mês de referência: ${String(refMonth).padStart(2, '0')}/${refYear}\n`)

  // Buscar contratos ativos com inquilino
  const contracts = await prisma.contract.findMany({
    where: {
      status: 'ACTIVE',
      isActive: true,
      rentValue: { not: null },
      tenantId: { not: null },
    },
    include: {
      tenant: {
        select: {
          id: true, name: true, document: true,
          email: true, phoneMobile: true, phone: true,
        },
      },
      landlord: { select: { id: true, name: true } },
      property: { select: { id: true, reference: true, street: true, neighborhood: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  console.log(`📋 Encontrados ${contracts.length} contratos ativos com inquilino\n`)

  const results = {
    total: contracts.length,
    customersCreated: 0,
    customersExisting: 0,
    chargesCreated: 0,
    chargesSkipped: 0,
    errors: [] as string[],
  }

  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i]
    const tenant = contract.tenant!
    const rentValue = Number(contract.rentValue ?? 0)
    const dueDay = contract.tenantDueDay ?? 5
    const dueDate = `${refYear}-${String(refMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

    console.log(`\n[${i + 1}/${contracts.length}] Contrato: ${contract.legacyId ?? contract.id}`)
    console.log(`  Inquilino: ${tenant.name} | CPF: ${tenant.document ?? 'N/A'}`)
    console.log(`  Imóvel: ${contract.propertyAddress ?? 'N/A'}`)
    console.log(`  Valor: R$ ${rentValue.toFixed(2)} | Vencimento: ${dueDate}`)

    if (rentValue <= 0) {
      console.log(`  ⏭ Pulado: valor zero`)
      results.chargesSkipped++
      continue
    }

    try {
      // 1. Criar/buscar customer no Asaas
      if (DRY_RUN) {
        console.log(`  [DRY-RUN] Criaria customer para ${tenant.name}`)
        console.log(`  [DRY-RUN] Criaria cobrança R$ ${rentValue.toFixed(2)} vencendo ${dueDate}`)
        results.chargesSkipped++
        continue
      }

      let asaasCustomerId: string
      try {
        asaasCustomerId = await findOrCreateAsaasCustomer(tenant)
      } catch (err: any) {
        console.log(`  ⚠ Sem CPF válido, pulando: ${err.message}`)
        results.errors.push(`${tenant.name}: ${err.message}`)
        results.chargesSkipped++
        continue
      }

      // 2. Verificar se já existe cobrança para este mês
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          contractId: contract.id,
          dueDate: {
            gte: new Date(refYear, refMonth - 1, 1),
            lt: new Date(refYear, refMonth, 1),
          },
          asaasId: { not: null },
        },
      })

      if (existingInvoice) {
        console.log(`  ⏭ Cobrança Asaas já existe para este mês: ${existingInvoice.asaasId}`)
        results.chargesSkipped++
        continue
      }

      // 3. Montar descrição detalhada
      const descLines = [
        `Aluguel — ${contract.propertyAddress ?? 'Imóvel'}`,
        `ALUGUEL ${String(refMonth).padStart(2, '0')}/${refYear}: R$ ${rentValue.toFixed(2)}`,
        'NAO RECEBER APOS 5 DIAS DO VENCIMENTO',
        'Apos o vencto cobrar multa de 10%',
        'Apos o vencto cobrar juros de mora de 1% ao mes',
      ]

      // 4. Criar cobrança no Asaas
      const charge = await createAsaasCharge({
        customerId: asaasCustomerId,
        value: rentValue,
        dueDate,
        description: descLines.join('\n'),
        externalReference: contract.id,
      })

      console.log(`  ✅ Cobrança criada: ${charge.id} | Boleto: ${charge.bankSlipUrl}`)

      // 5. Criar invoice no banco local
      await prisma.invoice.create({
        data: {
          companyId: contract.companyId,
          contractId: contract.id,
          dueDate: new Date(dueDate),
          issueDate: new Date(),
          amount: rentValue,
          asaasId: charge.id,
          asaasStatus: charge.status,
          asaasBankSlipUrl: charge.bankSlipUrl ?? charge.invoiceUrl ?? null,
          cedente: 'IMOBILIARIA LEMOS',
          nossoNumero: charge.nossoNumero ?? null,
          mensagem: descLines.join('\n'),
          instrucoes: 'NAO RECEBER APOS 5 DIAS DO VENCIMENTO',
        },
      })

      // 6. Verificar se existe rental para o mês, se não, criar
      const existingRental = await prisma.rental.findFirst({
        where: {
          contractId: contract.id,
          dueDate: {
            gte: new Date(refYear, refMonth - 1, 1),
            lt: new Date(refYear, refMonth, 1),
          },
        },
      })

      if (!existingRental) {
        await prisma.rental.create({
          data: {
            companyId: contract.companyId,
            contractId: contract.id,
            dueDate: new Date(dueDate),
            rentAmount: rentValue,
            totalAmount: rentValue,
            status: new Date(dueDate) < new Date() ? 'LATE' : 'PENDING',
          },
        })
        console.log(`  + Rental criado para o mês`)
      }

      results.customersCreated++
      results.chargesCreated++

      // Rate limiting: 1 segundo entre chamadas
      await new Promise(r => setTimeout(r, 1000))

    } catch (err: any) {
      console.error(`  ❌ ERRO: ${err.message}`)
      results.errors.push(`${contract.legacyId ?? contract.id}: ${err.message}`)
    }
  }

  // ── Relatório final ─────────────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(60))
  console.log('RELATÓRIO DA MIGRAÇÃO')
  console.log('═'.repeat(60))
  console.log(`Total de contratos:       ${results.total}`)
  console.log(`Cobranças criadas:        ${results.chargesCreated}`)
  console.log(`Cobranças puladas:        ${results.chargesSkipped}`)
  console.log(`Erros:                    ${results.errors.length}`)
  console.log('═'.repeat(60))

  if (results.errors.length > 0) {
    console.log('\nERROS DETALHADOS:')
    results.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`))
  }

  if (DRY_RUN) {
    console.log('\n🔍 Modo DRY-RUN: nenhuma alteração foi feita.')
    console.log('   Rode sem --dry-run para executar de verdade.')
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('Erro fatal:', e)
  await prisma.$disconnect()
  process.exit(1)
})
