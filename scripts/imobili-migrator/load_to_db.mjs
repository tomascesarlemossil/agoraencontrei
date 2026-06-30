/**
 * Carregador: import_payload.json → banco da plataforma (Prisma), idempotente.
 *
 * ⚠️ ESCREVE no banco. Exige confirmação explícita + credenciais. Sem `--confirm`
 * só faz uma simulação (conta o que faria). Rode o dry-run (build_import.py) antes.
 *
 *   DATABASE_URL=... node load_to_db.mjs --company <companyId> --user <userId> [--confirm]
 *
 * Idempotência:
 *   - Client:   busca por (companyId, document) → update senão create; guarda legacyId.
 *   - Property: busca por (companyId, reference=legacyId) → update senão create.
 *   - Contract: upsert por @@unique(companyId, legacyId).
 *
 * Observação: na PRIMEIRA execução, valide com uma amostra pequena (--limit) antes
 * de carregar tudo. Os nomes de campo seguem o schema atual de Property/Client/Contract.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function arg(name, def = undefined) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return def
  const v = process.argv[i + 1]
  return v && !v.startsWith('--') ? v : true
}

const COMPANY = arg('company')
const USER = arg('user')
const CONFIRM = !!arg('confirm')
const LIMIT = arg('limit') ? Number(arg('limit')) : null
const PAYLOAD = arg('payload', path.join(__dirname, 'export', 'import_payload.json'))

if (!COMPANY || !USER) {
  console.error('Uso: DATABASE_URL=... node load_to_db.mjs --company <id> --user <id> [--confirm] [--limit N]')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(PAYLOAD, 'utf8'))
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
const num = (v) => (v == null || v === '' ? null : Number(v))
const dt = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d }

const TYPE = { Residencial: 'HOUSE', Comercial: 'COMMERCIAL', Industrial: 'WAREHOUSE', Terreno: 'LAND' }

async function main() {
  const slice = (arr) => (LIMIT ? arr.slice(0, LIMIT) : arr)
  const clients = slice(data.clients)
  const properties = slice(data.properties)
  const contracts = slice(data.contracts)

  console.log(`Payload: ${clients.length} clients · ${properties.length} properties · ${contracts.length} contracts`)
  if (!CONFIRM) {
    console.log('\n[SIMULAÇÃO] Sem --confirm: nada será gravado.')
    console.log('Reveja o dry-run (build_import.py) e rode novamente com --confirm para carregar.')
    return
  }

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  const legacyToClient = new Map()
  const legacyToProperty = new Map()
  let cC = 0, cP = 0, cK = 0

  // 1) Clients (idempotente por companyId+document; sem document, cria)
  for (const c of clients) {
    const where = c.document ? { companyId_document: { companyId: COMPANY, document: c.document } } : null
    const base = {
      companyId: COMPANY, name: c.name || 'Sem nome', document: c.document, rg: c.rg,
      profession: c.profession, maritalStatus: c.maritalStatus, nationality: c.nationality,
      email: c.email, phone: c.phone, phoneMobile: c.phoneMobile, phoneWork: c.phoneWork,
      address: c.address, addressComplement: c.addressComplement, neighborhood: c.neighborhood,
      city: c.city, state: c.state, zipCode: c.zipCode, spouseName: c.spouseName,
      spouseDocument: c.spouseDocument, bankName: c.bankName, bankBranch: c.bankBranch,
      bankAccount: c.bankAccount, roles: c.roles, birthDate: dt(c.birthDate),
      legacyId: c.legacyId, importSource: 'uniloc',
    }
    let row
    if (where) row = await prisma.client.upsert({ where, update: base, create: base })
    else row = await prisma.client.create({ data: base })
    legacyToClient.set(`${c.roles[0]}:${c.legacyId}`, row.id)
    cC++
  }

  // 2) Properties (idempotente por companyId+reference=legacyId)
  for (const p of properties) {
    const base = {
      companyId: COMPANY, userId: USER, reference: p.legacyId, externalId: p.legacyId,
      title: `${p.type} — ${p.address || 'imóvel'}`.slice(0, 120), slug: slug(`${p.legacyId}-${p.address}`),
      type: TYPE[p.type] || 'HOUSE', purpose: 'RENT',
      street: p.address, complement: p.addressComplement, neighborhood: p.neighborhood,
      city: p.city, state: p.state, zipCode: p.zipCode,
    }
    const existing = await prisma.property.findFirst({ where: { companyId: COMPANY, reference: p.legacyId } })
    const row = existing
      ? await prisma.property.update({ where: { id: existing.id }, data: base })
      : await prisma.property.create({ data: base })
    legacyToProperty.set(p.legacyId, row.id)
    cP++
  }

  // 3) Contracts (upsert por companyId+legacyId)
  for (const k of contracts) {
    const landlordId = legacyToClient.get(`LANDLORD:${k.landlordLegacyId}`)
    const tenantId = legacyToClient.get(`TENANT:${k.tenantLegacyId}`)
    const guarantorId = (k.guarantorLegacyIds || []).map(g => legacyToClient.get(`GUARANTOR:${g}`)).find(Boolean)
    const base = {
      companyId: COMPANY, propertyId: legacyToProperty.get(k.propertyLegacyId) || null,
      landlordId, tenantId, guarantorId,
      startDate: dt(k.startDate), duration: num(k.duration), rentValue: num(k.rentValue),
      initialValue: num(k.initialValue), tenantDueDay: num(k.tenantDueDay),
      landlordDueDay: num(k.landlordDueDay), penalty: num(k.penalty), commission: num(k.commission),
      adjustmentIndex: k.adjustmentIndex, rescissionDate: dt(k.rescissionDate),
      guaranteeType: k.guaranteeType, isActive: !!k.isActive,
      status: k.isActive ? 'ACTIVE' : 'FINISHED', legacyId: k.legacyId,
    }
    await prisma.contract.upsert({
      where: { companyId_legacyId: { companyId: COMPANY, legacyId: k.legacyId } },
      update: base, create: base,
    })
    cK++
  }

  await prisma.$disconnect()
  console.log(`\n✅ Importado: ${cC} clients · ${cP} properties · ${cK} contracts`)
}

main().catch((e) => { console.error('Falha na importação:', e); process.exit(1) })
