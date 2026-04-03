/**
 * Migracao COMPLETA: Uniloc DBF -> PostgreSQL (Prisma)
 * Uso: cd apps/api && npx tsx scripts/migrate-uniloc-dbf.ts [--dry-run] [--force] [--step=1,2,3...]
 */
import 'dotenv/config'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { PrismaClient, ClientRole } from '@prisma/client'

const CHUNK = 80
const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const STEPS_ARG = process.argv.find(a => a.startsWith('--step='))
const STEPS = STEPS_ARG ? STEPS_ARG.replace('--step=', '').split(',') : null
const JSON_DIR = path.resolve(process.cwd(), '../../data/uniloc/json')


const prisma = new PrismaClient()

function loadJSON<T = any>(name: string): T[] {
  const p = path.join(JSON_DIR, name)
  if (!fs.existsSync(p)) { console.warn(`  WARN: ${name} not found`); return [] }
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}
function cleanStr(v: unknown): string | undefined {
  if (v == null) return undefined
  const s = String(v).trim()
  return s === '' || s === '0' || s === '-   -' ? undefined : s
}
function cleanDoc(v: unknown): string | undefined {
  const s = cleanStr(v)
  if (!s) return undefined
  const digits = s.replace(/\D/g, '')
  return digits.length >= 8 ? digits : undefined
}
function parseDate(v: unknown): Date | null {
  if (!v) return null
  const s = String(v).trim()
  if (!s || s === '0' || s.startsWith('0000')) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}
function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return isNaN(n) || n === 0 ? null : n
}
async function resolveCompanyId(): Promise<string> {
  const id = process.env.PUBLIC_COMPANY_ID
  if (id) return id
  const c = await prisma.company.findFirst({ where: { isActive: true } })
  if (!c) throw new Error('Nenhuma empresa encontrada.')
  return c.id
}
function shouldRun(step: string): boolean { return !STEPS || STEPS.includes(step) }

const clientByLegacy = new Map<string, string>()
const clientByDoc = new Map<string, string>()
const contractByLegacy = new Map<string, string>()

async function step1(companyId: string) {
  console.log('\n=== STEP 1: Clientes ===')
  const sources: { file: string; role: ClientRole; codeField: string; label: string }[] = [
    { file: 'locador.json', role: 'LANDLORD', codeField: 'CODLOC', label: 'Proprietarios' },
    { file: 'inquili.json', role: 'TENANT', codeField: 'CODINQ', label: 'Inquilinos' },
    { file: 'fiador.json', role: 'GUARANTOR', codeField: 'CODFIA', label: 'Fiadores' },
    { file: 'secunlo.json', role: 'SECONDARY', codeField: 'CODSEC', label: 'Secundarios' },
    { file: 'favore.json', role: 'BENEFICIARY', codeField: 'CODFAV', label: 'Favorecidos' },
  ]
  for (const src of sources) {
    const rows = loadJSON(src.file)
    if (!rows.length) continue
    let created = 0, updated = 0, skipped = 0
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK)
      for (const row of chunk) {
        const code = cleanStr((row as any)[src.codeField])
        const name = cleanStr((row as any).NOME)
        if (!name) { skipped++; continue }
        const doc = cleanDoc((row as any).CIC ?? (row as any).CGC)
        const legacyKey = `${src.role}:${code}`
        const data = {
          companyId, legacyId: code, name, document: doc,
          rg: cleanStr((row as any).RG),
          profession: cleanStr((row as any).PROFISSAO),
          birthDate: parseDate((row as any).NASCIMENTO) ?? undefined,
          email: cleanStr((row as any).EMAIL),
          phone: cleanStr((row as any).TEL_RES),
          phoneMobile: cleanStr((row as any).CELULAR),
          phoneWork: cleanStr((row as any).TEL_COM ?? (row as any).FONE_EMP),
          address: cleanStr((row as any).ENDERECO),
          addressComplement: cleanStr((row as any).COMPLEME),
          neighborhood: cleanStr((row as any).BAIRRO),
          city: cleanStr((row as any).CIDADE),
          state: cleanStr((row as any).UF),
          zipCode: cleanStr((row as any).CEP),
          roles: [src.role] as ClientRole[],
          notes: cleanStr((row as any).OBSERVE),
        }
        if (DRY_RUN) { created++; continue }
        try {
          if (doc) {
            const existing = await prisma.client.findUnique({ where: { companyId_document: { companyId, document: doc } } })
            if (existing) {
              const newRoles = Array.from(new Set([...existing.roles, src.role]))
              await prisma.client.update({ where: { id: existing.id }, data: { roles: newRoles } })
              clientByLegacy.set(legacyKey, existing.id); clientByDoc.set(doc, existing.id); updated++
            } else {
              const c = await prisma.client.create({ data })
              clientByLegacy.set(legacyKey, c.id); clientByDoc.set(doc, c.id); created++
            }
          } else {
            const c = await prisma.client.create({ data: { ...data, document: undefined } })
            clientByLegacy.set(legacyKey, c.id); created++
          }
        } catch (err: any) { if (err.code === 'P2002') { updated++; continue }; skipped++ }
      }
      process.stdout.write(`\r  ${src.label}: ${Math.min(i + CHUNK, rows.length)}/${rows.length}`)
    }
    console.log(`\n  OK ${src.label} — criados: ${created}, atualizados: ${updated}, ignorados: ${skipped}`)
  }
  if (!DRY_RUN) {
    const allClients = await prisma.client.findMany({ where: { companyId }, select: { id: true, legacyId: true, document: true, roles: true } })
    for (const c of allClients) {
      if (c.document) clientByDoc.set(c.document, c.id)
      if (c.legacyId) { for (const role of c.roles) { clientByLegacy.set(`${role}:${c.legacyId}`, c.id) } }
    }
    console.log(`  Mapa: ${clientByLegacy.size} entradas`)
  }
}

async function step2(companyId: string) {
  console.log('\n=== STEP 2: Contratos ===')
  const rows = loadJSON('contrato.json')
  if (!rows.length) return
  const contfiaRows = loadJSON('contfia.json')
  const fiaByContract = new Map<string, string>()
  for (const r of contfiaRows) { const a = cleanStr((r as any).CODCON), b = cleanStr((r as any).CODFIA); if (a && b) fiaByContract.set(a, b) }
  const imoveisRows = loadJSON('imovel.json')
  const imovelMap = new Map<string, any>()
  for (const im of imoveisRows) { const code = cleanStr((im as any).I_CODIMO); if (code) imovelMap.set(code, im) }
  let created = 0, skipped = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    for (const row of chunk) {
      const legacyId = cleanStr((row as any).C_CODCON)
      if (!legacyId) { skipped++; continue }
      const codloc = cleanStr((row as any).C_CODLOC), codinq = cleanStr((row as any).C_CODINQ)
      const codimo = cleanStr((row as any).C_CODIMO), codfia = fiaByContract.get(legacyId)
      const landlordId = codloc ? clientByLegacy.get(`LANDLORD:${codloc}`) : undefined
      const tenantId = codinq ? clientByLegacy.get(`TENANT:${codinq}`) : undefined
      const guarantorId = codfia ? clientByLegacy.get(`GUARANTOR:${codfia}`) : undefined
      const imovel = codimo ? imovelMap.get(codimo) : undefined
      const isActive = cleanStr((row as any).C_ATIVO)?.toUpperCase() !== 'NAO'
      const rescission = parseDate((row as any).C_RESCISAO)
      const data: any = {
        company: { connect: { id: companyId } }, legacyId, legacyPropertyCode: codimo,
        propertyAddress: imovel ? cleanStr(imovel.I_ENDERECO) : undefined,
        iptuCode: imovel ? cleanStr(imovel.I_NUM_IPTU) : undefined,
        ...(landlordId && { landlord: { connect: { id: landlordId } } }),
        ...(tenantId && { tenant: { connect: { id: tenantId } } }),
        ...(guarantorId && { guarantor: { connect: { id: guarantorId } } }),
        startDate: parseDate((row as any).C_INICIO) ?? undefined,
        duration: num((row as any).C_CONTRA) ?? undefined,
        rentValue: num((row as any).C_VALOR) ?? undefined,
        initialValue: num((row as any).C_VAL_INI) ?? undefined,
        commission: num((row as any).C_COMISSAO) ?? undefined,
        tenantDueDay: num((row as any).C_VENC_INQ) ?? undefined,
        landlordDueDay: num((row as any).C_VENC_PRO) ?? undefined,
        penalty: num((row as any).C_MULTA) ?? undefined,
        adjustmentIndex: cleanStr((row as any).C_REAJUSTE),
        adjustmentPercent: num((row as any).REAJ_PERCE) ?? undefined,
        rescissionDate: rescission ?? undefined,
        unit: cleanStr((row as any).C_UNIDADE),
        status: isActive ? 'ACTIVE' : 'FINISHED', isActive,
        guaranteeType: codfia ? 'fiador' : undefined,
      }
      if (DRY_RUN) { created++; continue }
      try {
        const contract = await prisma.contract.upsert({
          where: { companyId_legacyId: { companyId, legacyId } }, create: data,
          update: { rentValue: num((row as any).C_VALOR) ?? undefined, isActive, status: isActive ? 'ACTIVE' : 'FINISHED',
            ...(landlordId && { landlordId }), ...(tenantId && { tenantId }), ...(guarantorId && { guarantorId }) },
        })
        contractByLegacy.set(legacyId, contract.id); created++
      } catch { skipped++ }
    }
    process.stdout.write(`\r  Contratos: ${Math.min(i + CHUNK, rows.length)}/${rows.length}`)
  }
  console.log(`\n  OK Contratos — ${created} criados, ${skipped} ignorados`)
  if (!DRY_RUN) {
    const all = await prisma.contract.findMany({ where: { companyId }, select: { id: true, legacyId: true } })
    for (const c of all) { if (c.legacyId) contractByLegacy.set(c.legacyId, c.id) }
    console.log(`  Mapa contratos: ${contractByLegacy.size}`)
  }
}

async function step3(companyId: string) {
  console.log('\n=== STEP 3: Alugueis ===')
  const rows = loadJSON('aluguel.json')
  if (!rows.length) return
  const existing = await prisma.rental.count({ where: { companyId } })
  if (existing > 0 && !FORCE) { console.log(`  ${existing} ja existem. Use --force.`); return }
  if (FORCE && existing > 0 && !DRY_RUN) { await prisma.rental.deleteMany({ where: { companyId } }) }
  const today = new Date()
  let created = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const batch: any[] = []
    for (const r of chunk) {
      const codcon = cleanStr((r as any).A_CODCON)
      const dueDate = parseDate((r as any).A_VENCIALU)
      const paidAmount = num((r as any).A_VALREC)
      let status: 'PENDING' | 'PAID' | 'LATE' = 'PENDING'
      if ((r as any).A_SITUP === 'P' || paidAmount) status = 'PAID'
      else if (dueDate && new Date(dueDate) < today) status = 'LATE'
      batch.push({
        companyId, legacyId: cleanStr((r as any).A_MOVIME),
        contractId: codcon ? (contractByLegacy.get(codcon) ?? null) : null,
        dueDate, rentAmount: num((r as any).A_VALOR), paidAmount,
        paymentDate: parseDate((r as any).A_DATAPAG) ?? parseDate((r as any).A_DATAREC),
        penaltyAmount: num((r as any).A_VAL_MUL) || null,
        totalAmount: num((r as any).A_VAL_DOC) ?? num((r as any).A_VALOR), status,
      })
    }
    if (!DRY_RUN && batch.length > 0) {
      if (i > 0 && i % 2000 === 0) { await prisma.$disconnect(); await prisma.$connect() }
      await prisma.rental.createMany({ data: batch })
    }
    created += batch.length
    process.stdout.write(`\r  Alugueis: ${Math.min(i + CHUNK, rows.length)}/${rows.length}`)
  }
  console.log(`\n  OK Alugueis — ${created.toLocaleString()} inseridos`)
}

async function step4(companyId: string) {
  console.log('\n=== STEP 4: Transacoes ===')
  const existing = await prisma.transaction.count({ where: { companyId } })
  if (existing > 0 && !FORCE) { console.log(`  ${existing} ja existem. Use --force.`); return }
  if (FORCE && existing > 0 && !DRY_RUN) { await prisma.transaction.deleteMany({ where: { companyId } }) }
  const grupos = loadJSON('grupo.json')
  const grupoMap = new Map<string, string>()
  for (const g of grupos) { const c = cleanStr((g as any).CODGR), d = cleanStr((g as any).GRUPO); if (c && d) grupoMap.set(c, d) }
  let totalCreated = 0
  const movRows = loadJSON('movbanco.json')
  if (movRows.length) {
    let created = 0
    for (let i = 0; i < movRows.length; i += CHUNK) {
      const chunk = movRows.slice(i, i + CHUNK); const batch: any[] = []
      for (const r of chunk) {
        const txDate = parseDate((r as any).DATALAN); if (!txDate) continue
        const amount = num((r as any).VALOR); if (!amount) continue
        const codgr = cleanStr((r as any).CODGR)
        batch.push({
          companyId, legacyId: cleanStr((r as any).CODLAN), transactionDate: txDate, amount,
          type: cleanStr((r as any).DEBCRED) === 'C' ? 'INCOME' : 'EXPENSE',
          description: [cleanStr((r as any).DESCRICAO), cleanStr((r as any).NOTA)].filter(Boolean).join(' - ') || null,
          category: codgr ? (grupoMap.get(codgr) ?? codgr) : null,
          contractId: cleanStr((r as any).CODCON) ? (contractByLegacy.get(cleanStr((r as any).CODCON)!) ?? null) : null,
        })
      }
      if (!DRY_RUN && batch.length > 0) {
        if (i > 0 && i % 2000 === 0) { await prisma.$disconnect(); await prisma.$connect() }
        await prisma.transaction.createMany({ data: batch })
      }
      created += batch.length
      process.stdout.write(`\r  Mov. Bancaria: ${Math.min(i + CHUNK, movRows.length)}/${movRows.length}`)
    }
    console.log(`\n  OK Mov. Bancaria — ${created.toLocaleString()}`); totalCreated += created
  }
  const despRows = loadJSON('cadespe.json')
  if (despRows.length) {
    let created = 0
    for (let i = 0; i < despRows.length; i += CHUNK) {
      const chunk = despRows.slice(i, i + CHUNK); const batch: any[] = []
      for (const r of chunk) {
        const txDate = parseDate((r as any).DATA) ?? parseDate((r as any).VENCIMENTO); if (!txDate) continue
        const amount = num((r as any).VALOR); if (!amount) continue
        batch.push({
          companyId, legacyId: cleanStr((r as any).CODDES), transactionDate: txDate, amount,
          type: 'EXPENSE' as const,
          description: [cleanStr((r as any).FAVORECIDO), cleanStr((r as any).DESCRICAO)].filter(Boolean).join(' - ') || null,
          category: 'Despesa',
        })
      }
      if (!DRY_RUN && batch.length > 0) { await prisma.transaction.createMany({ data: batch }) }
      created += batch.length
    }
    console.log(`  OK Despesas — ${created.toLocaleString()}`); totalCreated += created
  }
  console.log(`  TOTAL: ${totalCreated.toLocaleString()}`)
}

async function step5(companyId: string) {
  console.log('\n=== STEP 5: Boletos ===')
  const rows = loadJSON('boletos.json'); if (!rows.length) return
  const existing = await prisma.invoice.count({ where: { companyId } })
  if (existing > 0 && !FORCE) { console.log(`  ${existing} ja existem.`); return }
  if (FORCE && existing > 0 && !DRY_RUN) { await prisma.invoice.deleteMany({ where: { companyId } }) }
  let created = 0, skipped = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK); const batch: any[] = []
    for (const r of chunk) {
      const amount = num((r as any).U_VALOR); if (!amount) { skipped++; continue }
      const codcon = cleanStr((r as any).U_CODCON)
      batch.push({
        companyId, legacyId: cleanStr((r as any).U_MOVIME),
        contractId: codcon ? (contractByLegacy.get(codcon) ?? null) : null,
        legacyContractCode: codcon, legacyTenantCode: cleanStr((r as any).U_CODINQ),
        cedente: cleanStr((r as any).U_CEDENTE), numBoleto: cleanStr((r as any).U_NUMBOL),
        banco: cleanStr((r as any).U_NBANCO) ?? cleanStr((r as any).U_BANCO),
        carteira: cleanStr((r as any).U_CARTEIRA), codigoBarras: cleanStr((r as any).U_NCODBAR),
        linhaDigitavel: cleanStr((r as any).U_LINHADIG), nossoNumero: cleanStr((r as any).U_NOSSONUM),
        issueDate: parseDate((r as any).U_DATADOC), dueDate: parseDate((r as any).U_VENCTO), amount,
        mensagem: cleanStr((r as any).U_MENSAGEM), instrucoes: cleanStr((r as any).U_INSTRUCO),
      })
    }
    if (!DRY_RUN && batch.length > 0) {
      if (i > 0 && i % 2000 === 0) { await prisma.$disconnect(); await prisma.$connect() }
      await prisma.invoice.createMany({ data: batch })
    }
    created += batch.length
    process.stdout.write(`\r  Boletos: ${Math.min(i + CHUNK, rows.length)}/${rows.length}`)
  }
  console.log(`\n  OK Boletos — ${created.toLocaleString()} inseridos, ${skipped} ignorados`)
}

async function step6(companyId: string) {
  console.log('\n=== STEP 6: Forecasts (Diversos + IPTU) ===')
  const existing = await prisma.financialForecast.count({ where: { companyId } })
  if (existing > 0 && !FORCE) { console.log(`  ${existing} ja existem.`); return }
  if (FORCE && existing > 0 && !DRY_RUN) { await prisma.financialForecast.deleteMany({ where: { companyId } }) }
  let totalCreated = 0
  for (const [file, prefix, dateField, valField, statusField] of [
    ['diversos.json', '', 'L_VENCIME', 'L_VALOR', 'L_SITUCRE'],
    ['lanciptu.json', 'IPTU:', 'LI_VENCIME', 'LI_VALOR', 'LI_SITUCRE'],
  ] as const) {
    const rows = loadJSON(file as string); if (!rows.length) continue
    let created = 0
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK); const batch: any[] = []
      for (const r of chunk) {
        const dueDate = parseDate((r as any)[dateField]); if (!dueDate) continue
        const amount = num((r as any)[valField]); if (!amount) continue
        const dt = new Date(dueDate)
        batch.push({
          companyId, legacyId: `${prefix}${i}`, dueDate, amount,
          month: dt.getMonth() + 1, year: dt.getFullYear(),
          source: (r as any)[statusField] === 'P' ? 'realized' : 'forecast',
          forecastStatus: (r as any)[statusField] === 'P' ? 'RECEBIDO' : 'PREVISTO',
        })
      }
      if (!DRY_RUN && batch.length > 0) {
        if (i > 0 && i % 2000 === 0) { await prisma.$disconnect(); await prisma.$connect() }
        await prisma.financialForecast.createMany({ data: batch })
      }
      created += batch.length
    }
    console.log(`  OK ${file} — ${created.toLocaleString()}`); totalCreated += created
  }
  console.log(`  TOTAL Forecasts: ${totalCreated.toLocaleString()}`)
}

async function step7(companyId: string) {
  console.log('\n=== STEP 7: Rescisoes e Metadados ===')
  const rescRows = loadJSON('rescisao.json'); let rescUpdated = 0
  for (const r of rescRows) {
    const codcon = cleanStr((r as any).CODCON); if (!codcon) continue
    const contractId = contractByLegacy.get(codcon); if (!contractId || DRY_RUN) continue
    try {
      await prisma.contract.update({ where: { id: contractId }, data: {
        rescissionDate: parseDate((r as any).DATASAIDA) ?? parseDate((r as any).DATARESC) ?? undefined,
        status: 'FINISHED', isActive: false,
      }}); rescUpdated++
    } catch {}
  }
  console.log(`  OK Rescisoes — ${rescUpdated} contratos atualizados`)
  console.log(`  OK Acordos — ${loadJSON('acordos.json').length} registros`)
  console.log(`  OK Seguros — ${loadJSON('incendio.json').length} registros`)
}

async function main() {
  console.log('MIGRACAO COMPLETA: Uniloc DBF -> AgoraEncontrei/Lemosbank')
  console.log(`  Modo: ${DRY_RUN ? 'DRY-RUN' : 'ESCRITA REAL'} | Force: ${FORCE}`)
  if (!fs.existsSync(JSON_DIR)) { console.error('Execute primeiro: python3 scripts/convert-dbf-to-json.py'); process.exit(1) }
  const companyId = await resolveCompanyId()
  console.log(`  Empresa: ${companyId}`)
  if (shouldRun('1')) await step1(companyId)
  if (shouldRun('2')) await step2(companyId)
  if (shouldRun('3')) await step3(companyId)
  if (shouldRun('4')) await step4(companyId)
  if (shouldRun('5')) await step5(companyId)
  if (shouldRun('6')) await step6(companyId)
  if (shouldRun('7')) await step7(companyId)
  console.log('\nMIGRACAO CONCLUIDA!')
  if (!DRY_RUN) {
    const s = { clientes: await prisma.client.count({ where: { companyId } }),
      contratos: await prisma.contract.count({ where: { companyId } }),
      alugueis: await prisma.rental.count({ where: { companyId } }),
      transacoes: await prisma.transaction.count({ where: { companyId } }),
      boletos: await prisma.invoice.count({ where: { companyId } }),
      previsoes: await prisma.financialForecast.count({ where: { companyId } }) }
    for (const [k, v] of Object.entries(s)) console.log(`  ${k}: ${v.toLocaleString()}`)
  }
}
main().catch(e => { console.error('ERRO:', e); process.exit(1) }).finally(() => prisma.$disconnect())
