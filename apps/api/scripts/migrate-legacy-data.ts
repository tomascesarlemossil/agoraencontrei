/**
 * Script ETL: Migração de dados legados para PostgreSQL
 * Fontes: Planilhas XLS (Inquilinos, Proprietários, Fiadores, Contratos, Favorecidos)
 * Destino: Tabelas clients, contracts do banco PostgreSQL (Neon)
 *
 * Uso:
 *   cd apps/api
 *   npx tsx scripts/migrate-legacy-data.ts [--dry-run] [--step=A,B,C,D]
 *
 * Passos:
 *   A — Clientes XLS (Inquilinos, Proprietários, Fiadores, Favorecidos, Secundários)
 *   B — Contratos XLS (lista_contrato.xls)
 *   C — DBF files (ALUGUEL, BOLETOS, CAIXA) — quando disponíveis
 *   D — Planilhas Financeiras (PREVISAO) — quando disponíveis
 */

import 'dotenv/config'
import { createRequire } from 'node:module'
const require2 = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const XLSX = require2('xlsx') as any
import * as path from 'node:path'
import * as fs from 'node:fs'
import { PrismaClient, type Prisma, ClientRole } from '@prisma/client'

// ── Config ──────────────────────────────────────────────────────────────────

const CHUNK_SIZE   = 100
const DRY_RUN      = process.argv.includes('--dry-run')
const STEPS_ARG    = process.argv.find(a => a.startsWith('--step='))
const STEPS        = STEPS_ARG ? STEPS_ARG.replace('--step=', '').toUpperCase().split(',') : ['A', 'B', 'C', 'D']

// Adjust this path to wherever the XLS files are stored
const DATA_DIR = process.env.LEGACY_DATA_DIR
  ?? path.resolve(process.env.HOME ?? '', 'Downloads/arquivos para projeto completo')

const prisma = new PrismaClient()

// ── Helpers ─────────────────────────────────────────────────────────────────

function cleanStr(v: unknown): string | undefined {
  if (v == null) return undefined
  const s = String(v).trim()
  return s === '' || s === '-   -' || s === '0' ? undefined : s
}

function parseDate(v: unknown): Date | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!s || s === '-   -' || s === '0' || s === '00-00-0000') return null

  // Excel serial number (date)
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    try {
      const d = XLSX.SSF.parse_date_code(Number(s))
      if (d && d.y > 1900) return new Date(d.y, d.m - 1, d.d)
    } catch { /* ignore */ }
  }

  // Strings like "18-Feb-33", "01-Feb-08"
  const parsed = new Date(s)
  if (!isNaN(parsed.getTime())) return parsed

  return null
}

function cleanDoc(v: unknown): string | undefined {
  const s = cleanStr(v)
  if (!s) return undefined
  const digits = s.replace(/\D/g, '')
  return digits.length >= 8 ? digits : undefined
}

async function resolveCompanyId(): Promise<string> {
  const id = process.env.PUBLIC_COMPANY_ID
  if (id) return id
  const c = await prisma.company.findFirst({ where: { isActive: true } })
  if (!c) throw new Error('Nenhuma empresa encontrada. Crie uma empresa antes de migrar.')
  return c.id
}

function readXLS(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  Arquivo não encontrado: ${filePath}`)
    return []
  }
  const wb = XLSX.readFile(filePath, { codepage: 1252, cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { defval: '', raw: false }) as Record<string, unknown>[]
}

async function upsertClients(
  rows: Record<string, unknown>[],
  role: ClientRole,
  companyId: string,
  label: string,
) {
  let created = 0, updated = 0, skipped = 0

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)

    await Promise.all(chunk.map(async (row, idx) => {
      const name = cleanStr(row['nome'])
      if (!name) { skipped++; return }

      const document = cleanDoc(row['documento'] ?? row['rg'])
      const birthDate = parseDate(row['nascimento'])

      const data: Prisma.ClientCreateInput = {
        company:          { connect: { id: companyId } },
        legacyId:         String(i + idx + 1),
        name,
        document,
        rg:               cleanStr(row['rg']),
        profession:       cleanStr(row['profissao']),
        birthDate:        birthDate ?? undefined,
        email:            cleanStr(row['email']),
        phone:            cleanStr(row['tel_res']),
        phoneMobile:      cleanStr(row['celular']),
        phoneWork:        cleanStr(row['tel_com'] ?? row['fone_emp']),
        address:          cleanStr(row['endereco']),
        addressComplement: cleanStr(row['compleme']),
        neighborhood:     cleanStr(row['bairro']),
        city:             cleanStr(row['cidade']),
        state:            cleanStr(row['uf']),
        zipCode:          cleanStr(row['cep']),
        roles:            [role],
      }

      if (DRY_RUN) { created++; return }

      try {
        if (document) {
          // Upsert por CPF/CNPJ — pode ser inquilino E fiador
          const existing = await prisma.client.findUnique({
            where: { companyId_document: { companyId, document } },
          })
          if (existing) {
            const newRoles = Array.from(new Set([...existing.roles, role]))
            await prisma.client.update({
              where: { id: existing.id },
              data:  { roles: newRoles },
            })
            updated++
          } else {
            await prisma.client.create({ data })
            created++
          }
        } else {
          // Sem documento: insert simples (não dá pra deduplicar)
          await prisma.client.create({ data: { ...data, document: undefined } })
          created++
        }
      } catch (err: any) {
        if (err.code === 'P2002') { updated++; return } // unique já existe
        console.error(`  ✗ Linha ${i + idx + 2} (${name}):`, err.message)
        skipped++
      }
    }))

    process.stdout.write(`\r  ${label}: ${i + chunk.length}/${rows.length}`)
  }

  console.log(`\n  ✓ ${label} — criados: ${created}, atualizados: ${updated}, ignorados: ${skipped}`)
}

// ── Passo A: Clientes (Inquilinos, Proprietários, Fiadores, etc.) ────────────

async function stepA(companyId: string) {
  console.log('\n═══ PASSO A: Clientes (XLS) ═══')

  const sources: Array<{ file: string; role: ClientRole; label: string }> = [
    { file: 'PROPRIETARIOS DESDE O INICIO.XLS', role: 'LANDLORD',    label: 'Proprietários' },
    { file: 'INQUILINOS  DESDE O INICIO.XLS',   role: 'TENANT',      label: 'Inquilinos'    },
    { file: 'FIADORES  DESDE O INICIO.XLS',     role: 'GUARANTOR',   label: 'Fiadores'      },
    { file: 'FAVORECIDOS  DESDE O INICIO.XLS',  role: 'BENEFICIARY', label: 'Favorecidos'   },
    { file: 'SECUNDARIOS  DESDE O INICIO.XLS',  role: 'SECONDARY',   label: 'Secundários'   },
  ]

  for (const src of sources) {
    const rows = readXLS(path.join(DATA_DIR, src.file))
    if (rows.length === 0) continue
    await upsertClients(rows, src.role, companyId, src.label)
  }
}

// ── Passo B: Contratos (lista_contrato.xls) ──────────────────────────────────

async function stepB(companyId: string) {
  console.log('\n═══ PASSO B: Contratos (lista_contrato.xls) ═══')

  const rows = readXLS(path.join(DATA_DIR, 'lista_contrato.xls'))
  if (rows.length === 0) { console.log('  ⚠  Arquivo não encontrado'); return }

  let created = 0, skipped = 0

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)

    await Promise.all(chunk.map(async (row) => {
      const legacyId = cleanStr(row['c_codcon'])
      if (!legacyId) { skipped++; return }

      // Resolve tenant/landlord by name (best-effort lookup)
      const tenantName   = cleanStr(row['inquilino'])
      const landlordName = cleanStr(row['locador'])

      let tenantId:   string | undefined
      let landlordId: string | undefined

      if (!DRY_RUN) {
        if (tenantName) {
          const t = await prisma.client.findFirst({
            where: { companyId, name: { contains: tenantName.split(' ')[0], mode: 'insensitive' } },
          })
          tenantId = t?.id
        }
        if (landlordName) {
          const l = await prisma.client.findFirst({
            where: { companyId, name: { contains: landlordName.split(' ')[0], mode: 'insensitive' }, roles: { has: 'LANDLORD' } },
          })
          landlordId = l?.id
        }
      }

      const startDate = parseDate(row['c_inicio'])
      const rescission = parseDate(row['c_rescisao'])
      const isActive = cleanStr(row['c_ativo'])?.toUpperCase() !== 'NÃO'

      const rentValue = parseFloat(String(row['c_valor'] ?? '0').replace(',', '.')) || undefined
      const initialValue = parseFloat(String(row['c_val_ini'] ?? '0').replace(',', '.')) || undefined
      const commission = parseFloat(String(row['c_comissao'] ?? '0').replace(',', '.')) || undefined
      const penalty = parseFloat(String(row['c_multa'] ?? '0').replace(',', '.')) || undefined
      const adjustBase = parseFloat(String(row['c_database'] ?? '0').replace(',', '.')) || undefined
      const adjustPct = parseFloat(String(row['reaj_perce'] ?? '0').replace(',', '.')) || undefined
      const duration = parseInt(String(row['c_contra'] ?? '0')) || undefined
      const tenantDueDay = parseInt(String(row['c_venc_inq'] ?? '0')) || undefined
      const landlordDueDay = parseInt(String(row['c_venc_pro'] ?? '0')) || undefined

      const data: Prisma.ContractCreateInput = {
        company:            { connect: { id: companyId } },
        legacyId,
        legacyPropertyCode: cleanStr(row['c_codimo']),
        propertyAddress:    cleanStr(row['i_endereco']),
        iptuCode:           cleanStr(row['i_num_iptu']),
        landlordName,
        tenantName,
        ...(landlordId && { landlord: { connect: { id: landlordId } } }),
        ...(tenantId   && { tenant:   { connect: { id: tenantId } } }),
        startDate:          startDate ?? undefined,
        duration,
        rentValue,
        initialValue,
        commission,
        tenantDueDay,
        landlordDueDay,
        penalty,
        adjustmentBase:     adjustBase,
        adjustmentIndex:    cleanStr(row['c_reajuste']),
        adjustmentPercent:  adjustPct,
        rescissionDate:     rescission ?? undefined,
        unit:               cleanStr(row['c_unidade']),
        status:             isActive ? 'ACTIVE' : 'FINISHED',
        isActive,
      }

      if (DRY_RUN) { created++; return }

      try {
        await prisma.contract.upsert({
          where:  { companyId_legacyId: { companyId, legacyId } },
          create: data,
          update: {
            rentValue,
            isActive,
            status: isActive ? 'ACTIVE' : 'FINISHED',
            tenantId:   tenantId ?? undefined,
            landlordId: landlordId ?? undefined,
          },
        })
        created++
      } catch (err: any) {
        console.error(`  ✗ Contrato ${legacyId}:`, err.message)
        skipped++
      }
    }))

    process.stdout.write(`\r  Contratos: ${i + chunk.length}/${rows.length}`)
  }

  console.log(`\n  ✓ Contratos — criados/atualizados: ${created}, ignorados: ${skipped}`)
}

// ── Passo C: DBF files (ALUGUEL → rentals, CAIXA → transactions) ─────────────

const DBF_DIR = process.env.DBF_DATA_DIR ?? '/tmp'
const FORCE   = process.argv.includes('--force')

const TIPOLAN_CATEGORY: Record<string, string> = {
  C: 'Cobrança',
  N: 'Normal',
  R: 'Rescisão',
  P: 'Pagamento',
  E: 'Eventual',
  S: 'Seguro',
  U: 'Devolução',
  X: 'Extra',
  L: 'Laudo',
  I: 'IPTU',
}

async function stepC(companyId: string) {
  console.log('\n═══ PASSO C: Arquivos DBF (Aluguéis + Caixa) ═══')
  console.log(`   DBF_DIR: ${DBF_DIR}`)

  // Pre-load contracts for linking
  const contracts = await prisma.contract.findMany({
    where:  { companyId },
    select: { id: true, legacyId: true },
  })
  const contractMap = new Map(
    contracts.filter(c => c.legacyId).map(c => [c.legacyId!, c.id]),
  )
  console.log(`   Contratos carregados: ${contractMap.size}`)

  // ── C1: Aluguéis ──────────────────────────────────────────────────────────
  const aluguelPath = path.join(DBF_DIR, 'aluguel.json')
  if (!fs.existsSync(aluguelPath)) {
    console.log(`  ℹ  ${aluguelPath} não encontrado.`)
    console.log('  ℹ  Gere com: python3 -c "..." (ver script de conversão)')
  } else {
    const existingRentals = await prisma.rental.count({ where: { companyId } })
    if (existingRentals > 0 && !FORCE) {
      console.log(`  ℹ  ${existingRentals.toLocaleString('pt-BR')} aluguéis já migrados. Use --force para re-migrar.`)
    } else {
      if (FORCE && existingRentals > 0) {
        console.log(`  🗑  Removendo ${existingRentals.toLocaleString('pt-BR')} aluguéis existentes...`)
        if (!DRY_RUN) await prisma.rental.deleteMany({ where: { companyId } })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recs: any[] = JSON.parse(fs.readFileSync(aluguelPath, 'utf-8'))
      const today = new Date()
      let created = 0, skipped = 0

      for (let i = 0; i < recs.length; i += CHUNK_SIZE) {
        const chunk = recs.slice(i, i + CHUNK_SIZE)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = []
        for (const r of chunk) {
          const legacyContractId = r.A_CODCON?.trim()
          const contractId = legacyContractId ? (contractMap.get(legacyContractId) ?? null) : null

          const dueDate     = r.A_VENCIALU ? new Date(r.A_VENCIALU) : null
          const paymentDate = r.A_DATAPAG  ? new Date(r.A_DATAPAG)  : null
          const rentAmount  = r.A_VALOR    != null ? Number(r.A_VALOR)    : null
          const paidAmount  = r.A_VALREC   != null ? Number(r.A_VALREC)   : null
          const penaltyAmt  = r.A_VAL_MUL  != null ? Number(r.A_VAL_MUL)  : null
          const totalAmount = r.A_VAL_DOC  != null ? Number(r.A_VAL_DOC)  : rentAmount

          let status: 'PENDING' | 'PAID' | 'LATE' = 'PENDING'
          if (r.A_SITUP === 'P') status = 'PAID'
          else if (dueDate && dueDate < today) status = 'LATE'

          rows.push({
            companyId,
            legacyId:     r.A_MOVIME?.trim() || null,
            contractId,
            dueDate,
            rentAmount,
            paidAmount,
            paymentDate,
            penaltyAmount: penaltyAmt || null,
            totalAmount,
            status,
          })
        }

        if (!DRY_RUN) {
          await prisma.rental.createMany({ data: rows })
        }
        created += rows.length
        process.stdout.write(`\r  Aluguéis: ${i + chunk.length}/${recs.length}`)
      }

      console.log(`\n  ✓ Aluguéis — inseridos: ${created.toLocaleString('pt-BR')}, ignorados: ${skipped}`)
    }
  }

  // ── C2: Caixa ─────────────────────────────────────────────────────────────
  const caixaPath = path.join(DBF_DIR, 'caixa.json')
  if (!fs.existsSync(caixaPath)) {
    console.log(`  ℹ  ${caixaPath} não encontrado.`)
  } else {
    const existingTx = await prisma.transaction.count({ where: { companyId } })
    if (existingTx > 0 && !FORCE) {
      console.log(`  ℹ  ${existingTx.toLocaleString('pt-BR')} transações já migradas. Use --force para re-migrar.`)
    } else {
      if (FORCE && existingTx > 0) {
        console.log(`  🗑  Removendo ${existingTx.toLocaleString('pt-BR')} transações existentes...`)
        if (!DRY_RUN) await prisma.transaction.deleteMany({ where: { companyId } })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recs2: any[] = JSON.parse(fs.readFileSync(caixaPath, 'utf-8'))
      let created2 = 0, skipped2 = 0

      for (let i = 0; i < recs2.length; i += CHUNK_SIZE) {
        const chunk = recs2.slice(i, i + CHUNK_SIZE)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = []

        for (const r of chunk) {
          const dateStr = String(r.DATALAN ?? '').trim()
          if (!dateStr || dateStr.length < 8) { skipped2++; continue }

          const y = parseInt(dateStr.slice(0, 4), 10)
          const m = parseInt(dateStr.slice(4, 6), 10)
          const d = parseInt(dateStr.slice(6, 8), 10)
          if (!y || !m || !d) { skipped2++; continue }
          const transactionDate = new Date(y, m - 1, d)
          if (isNaN(transactionDate.getTime())) { skipped2++; continue }

          const amount = parseFloat(String(r.VALOR ?? '0').trim() || '0')
          if (!amount) { skipped2++; continue }

          const debcred    = String(r.DEBCRED ?? '').trim()
          const type       = debcred === 'C' ? 'INCOME' : 'EXPENSE'
          const codcon     = String(r.CODCON ?? '').trim()
          const contractId = codcon ? (contractMap.get(codcon) ?? null) : null
          const desc       = [String(r.DESCRICAO ?? '').trim(), String(r.NOTA ?? '').trim()].filter(Boolean).join(' — ') || null
          const tipolanStr = String(r.TIPOLAN ?? '').trim()
          const category   = TIPOLAN_CATEGORY[tipolanStr] ?? tipolanStr ?? null

          rows.push({
            companyId,
            legacyId:        String(r.CODLAN ?? '').trim() || null,
            transactionDate,
            amount,
            type,
            description:     desc,
            category,
            contractId,
          })
        }

        if (!DRY_RUN && rows.length > 0) {
          // Reconecta a cada 2000 registros para evitar timeout do Neon
          if (i > 0 && i % 2000 === 0) {
            await prisma.$disconnect()
            await prisma.$connect()
          }
          await prisma.transaction.createMany({ data: rows })
        }
        created2 += rows.length
        process.stdout.write(`\r  Transações: ${i + chunk.length}/${recs2.length}`)
      }

      console.log(`\n  ✓ Transações — inseridas: ${created2.toLocaleString('pt-BR')}, ignoradas: ${skipped2}`)
    }
  }
}

// ── Passo D: Planilhas Financeiras ───────────────────────────────────────────

async function stepD(_companyId: string) {
  console.log('\n═══ PASSO D: Planilhas Financeiras (PREVISAO) ═══')

  // Busca todos arquivos que contenham "PREVISAO" ou "FINANCEIRO" no nome
  const files = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter(f => /previsao|financeiro/i.test(f))
    : []

  if (files.length === 0) {
    console.log('  ℹ  Nenhuma planilha de previsão encontrada.')
    console.log('  ℹ  Coloque arquivos com "PREVISAO" ou "FINANCEIRO" no nome na pasta de dados.')
    return
  }

  console.log(`  Encontrados: ${files.join(', ')}`)
  // TODO: mapear quando os arquivos forem disponibilizados
}

// ── Passo E: Boletos (BOLETOS.DBF → invoices) ────────────────────────────────

async function stepE(companyId: string) {
  console.log('\n═══ PASSO E: Boletos (BOLETOS.DBF) ═══')
  console.log(`   DBF_DIR: ${DBF_DIR}`)

  const boletosPath = path.join(DBF_DIR, 'boletos.json')
  if (!fs.existsSync(boletosPath)) {
    console.log(`  ℹ  ${boletosPath} não encontrado.`)
    return
  }

  const existingCount = await prisma.invoice.count({ where: { companyId } })
  if (existingCount > 0 && !FORCE) {
    console.log(`  ℹ  ${existingCount.toLocaleString('pt-BR')} boletos já migrados. Use --force para re-migrar.`)
    return
  }

  if (FORCE && existingCount > 0) {
    console.log(`  🗑  Removendo ${existingCount.toLocaleString('pt-BR')} boletos existentes...`)
    if (!DRY_RUN) await prisma.invoice.deleteMany({ where: { companyId } })
  }

  // Pre-load contracts
  const contracts = await prisma.contract.findMany({
    where:  { companyId },
    select: { id: true, legacyId: true },
  })
  const contractMap = new Map(
    contracts.filter(c => c.legacyId).map(c => [c.legacyId!, c.id]),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recs: any[] = JSON.parse(fs.readFileSync(boletosPath, 'utf-8'))
  let created = 0, skipped = 0

  for (let i = 0; i < recs.length; i += CHUNK_SIZE) {
    const chunk = recs.slice(i, i + CHUNK_SIZE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = []

    for (const r of chunk) {
      const legacyContractCode = r.U_CODCON?.trim() || null
      const contractId = legacyContractCode ? (contractMap.get(legacyContractCode) ?? null) : null

      const issueDate = r.U_DATADOC ? new Date(r.U_DATADOC) : null
      const dueDate   = r.U_VENCTO  ? new Date(r.U_VENCTO)  : null
      const amount    = r.U_VALOR   != null ? Number(r.U_VALOR) : null

      if (!amount) { skipped++; continue }

      rows.push({
        companyId,
        legacyId:          r.U_MOVIME?.trim() || null,
        contractId,
        legacyContractCode,
        legacyTenantCode:  r.U_CODINQ?.trim() || null,
        cedente:           r.U_CEDENTE?.trim() || null,
        numBoleto:         r.U_NUMBOL?.trim() || null,
        banco:             r.U_NBANCO?.trim() || r.U_BANCO?.trim() || null,
        carteira:          r.U_CARTEIRA?.trim() || null,
        codigoBarras:      r.U_NCODBAR?.trim() || null,
        linhaDigitavel:    r.U_LINHADIG?.trim() || null,
        nossoNumero:       r.U_NOSSONUM?.trim() || null,
        issueDate:         issueDate && !isNaN(issueDate.getTime()) ? issueDate : null,
        dueDate:           dueDate   && !isNaN(dueDate.getTime())   ? dueDate   : null,
        amount,
        mensagem:          r.U_MENSAGEM?.trim() || null,
        instrucoes:        r.U_INSTRUCO?.trim() || null,
      })
    }

    if (!DRY_RUN && rows.length > 0) {
      if (i > 0 && i % 2000 === 0) {
        await prisma.$disconnect()
        await prisma.$connect()
      }
      await prisma.invoice.createMany({ data: rows })
    }
    created += rows.length
    process.stdout.write(`\r  Boletos: ${i + chunk.length}/${recs.length}`)
  }

  console.log(`\n  ✓ Boletos — inseridos: ${created.toLocaleString('pt-BR')}, ignorados: ${skipped}`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Migração de Dados Legados — AgoraEncontrei')
  console.log(`   Pasta de dados: ${DATA_DIR}`)
  console.log(`   Modo: ${DRY_RUN ? '🔍 DRY-RUN (sem escrita)' : '✏️  ESCRITA REAL'}`)
  console.log(`   Passos: ${STEPS.join(', ')}`)
  console.log()

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`✗ Pasta de dados não encontrada: ${DATA_DIR}`)
    console.error('  Defina LEGACY_DATA_DIR=<caminho> ou ajuste DATA_DIR no script.')
    process.exit(1)
  }

  const companyId = await resolveCompanyId()
  console.log(`   Empresa: ${companyId}`)

  if (STEPS.includes('A')) await stepA(companyId)
  if (STEPS.includes('B')) await stepB(companyId)
  if (STEPS.includes('C')) await stepC(companyId)
  if (STEPS.includes('D')) await stepD(companyId)
  if (STEPS.includes('E')) await stepE(companyId)

  console.log('\n✅ Migração concluída!')
}

main()
  .catch(err => { console.error('✗ Erro fatal:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
