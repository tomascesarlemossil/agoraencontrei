/**
 * Provisionamento oficial da parceira fundadora — IMOBILIÁRIA LEMOS
 * ==================================================================
 *
 * Cria/consolida, de forma IDEMPOTENTE e com DRY-RUN por padrão:
 *
 *   1. Plano interno "fundador" (R$0, ilimitado, todos os módulos, sem cobrança).
 *   2. Company  "Imobiliária Lemos"  (marcador estável settings.canonical).
 *   3. Usuário proprietário principal (imobiliarialemosfranca@gmail.com).
 *   4. Tenant   (site do parceiro, plano fundador, ACTIVE, isento de cobrança).
 *   5. Os 9 usuários da equipe (4 admins ADMIN + 5 corretores BROKER).
 *   6. Reatribuição dos imóveis (companyId + userId) da empresa/usuário de ORIGEM
 *      para a Company Lemos + o proprietário principal — EM LOTES, com guardas.
 *   7. Move os CONTATOS-PROPRIETÁRIOS (via PropertyOwner) dos imóveis movidos,
 *      exceto os compartilhados com imóveis fora da seleção.
 *   8. Revoga sessões/refresh tokens dos usuários provisionados (força novo login).
 *
 * SEGURANÇA DE SENHA:
 *   Cada usuário NOVO recebe uma senha ALEATÓRIA INDIVIDUAL, impressa UMA única
 *   vez ao final (nunca no snapshot). NÃO existe senha coletiva. Usuário que já
 *   existe NÃO tem a senha sobrescrita (salvo RESET_EXISTING_PASSWORDS=true).
 *   Todos ficam com settings.mustChangePassword = true.
 *
 * SNAPSHOT/ROLLBACK:
 *   Na execução real, o script grava um snapshot ANTES da primeira escrita
 *   (status "started" com o estado ANTERIOR completo), atualiza o progresso por
 *   lote e finaliza como "completed" (ou "failed" com o último lote concluído em
 *   caso de erro). O backup do banco (Neon) continua OBRIGATÓRIO.
 *
 * O que este script NÃO faz automaticamente (ver runbook):
 *   • NÃO move em massa dados operacionais só por companyId (leads, deals,
 *     contratos, locações, transações, contatos genéricos) — apenas REPORTA.
 *   • NÃO cancela cobranças/assinaturas Asaas existentes.
 *
 * ──────────────────────────────────────────────────────────────────
 * COMO RODAR (numa máquina/CI que enxergue o banco de PRODUÇÃO):
 *
 *   # 1) Pré-visualizar (NÃO grava nada). DRY_RUN é o padrão seguro.
 *   DATABASE_URL=... SOURCE_MODE=company SOURCE_COMPANY_ID=<id> \
 *   npx tsx scripts/provision-imobiliaria-lemos.ts
 *
 *   # 2) Executar de verdade (exige confirmação forte):
 *   DATABASE_URL=... SOURCE_MODE=company SOURCE_COMPANY_ID=<id> \
 *   DRY_RUN=false CONFIRM_PRODUCTION_MIGRATION=IMOBILIARIA_LEMOS \
 *   npx tsx scripts/provision-imobiliaria-lemos.ts
 *
 * VARIÁVEIS DE AMBIENTE:
 *   DATABASE_URL                 (obrigatória) conexão Postgres
 *   DRY_RUN                      default "true" — SÓ "false" (exato) executa
 *   CONFIRM_PRODUCTION_MIGRATION exija = "IMOBILIARIA_LEMOS" quando DRY_RUN=false
 *   SOURCE_MODE                  "company" | "user" | "company_and_user"
 *   SOURCE_COMPANY_ID            id da company de origem dos imóveis
 *   SOURCE_USER_EMAIL            e-mail do usuário dono atual dos imóveis
 *   SKIP_PROPERTIES              "true" — só provisiona estrutura, não mexe em imóveis
 *   EXPECTED_PROPERTY_COUNT      se definido, ABORTA se a seleção divergir
 *   MAX_MOVE                     limite de segurança (default 100000); aborta se exceder
 *   BATCH_SIZE                   lote de update de imóveis (default 200)
 *   RESET_EXISTING_PASSWORDS     "true" — redefine senha (aleatória individual) de já existentes
 *   FORCE_PASSWORD               força uma senha comum p/ NOVOS (NÃO recomendado)
 *   SUBDOMAIN                    subdomínio do tenant (default "lemos")
 */

import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import { randomBytes } from 'node:crypto'
import { writeFileSync, mkdirSync, readFileSync, chmodSync } from 'node:fs'
import { join } from 'node:path'

// ── Config / env (parsing estrito e seguro) ───────────────────────────────
const prisma = new PrismaClient()

// DRY_RUN estrito: qualquer valor != "false" permanece seguro (dry-run).
const DRY_RUN = process.env.DRY_RUN !== 'false'
const CONFIRM = process.env.CONFIRM_PRODUCTION_MIGRATION || ''
const SOURCE_MODE = (process.env.SOURCE_MODE || '').trim() // company | user | company_and_user
const SOURCE_COMPANY_ID = (process.env.SOURCE_COMPANY_ID || '').trim()
const SOURCE_USER_EMAIL = (process.env.SOURCE_USER_EMAIL || '').trim().toLowerCase()
const SKIP_PROPERTIES = process.env.SKIP_PROPERTIES === 'true'
const EXPECTED_PROPERTY_COUNT = process.env.EXPECTED_PROPERTY_COUNT
  ? Number(process.env.EXPECTED_PROPERTY_COUNT) : null
const MAX_MOVE = Number(process.env.MAX_MOVE || 100000)
const BATCH_SIZE = Math.max(1, Number(process.env.BATCH_SIZE || 200))
const RESET_EXISTING_PASSWORDS = process.env.RESET_EXISTING_PASSWORDS === 'true'
// Senha comum só se FORÇADA explicitamente. NÃO há fallback legado de senha coletiva.
const FORCE_PASSWORD = process.env.FORCE_PASSWORD || ''
const SUBDOMAIN = (process.env.SUBDOMAIN || 'lemos').toLowerCase().trim()

const CANONICAL = 'imobiliaria-lemos'
const MAIN_ADMIN_EMAIL = 'imobiliarialemosfranca@gmail.com'
const PLATFORM_SUPERADMIN_EMAIL = 'tomas@agoraencontrei.com.br'

const ADMINS = [
  { email: 'imobiliarialemosfranca@gmail.com', name: 'Imobiliária Lemos (Admin)' },
  { email: 'tomascesarlemossilva@gmail.com', name: 'Tomás César Lemos Silva' },
  { email: 'blognairalemos@gmail.com', name: 'Naira Lemos' },
  { email: 'noemialemos3@gmail.com', name: 'Noêmia Lemos' },
]
const BROKERS = [
  { email: 'lorensesso@gmail.com', name: 'Loren Sesso' },
  { email: 'lauraimobiliarialemos@gmail.com', name: 'Laura' },
  { email: 'kairoimobiliarialemos@gmail.com', name: 'Kairo' },
  { email: 'miriamimobiliarialemos@gmail.com', name: 'Miriam' },
  { email: 'lucasimobiliarialemos@gmail.com', name: 'Lucas' },
]

// Dados CANÔNICOS do plano fundador (fonte de verdade — aplicados via upsert).
const FUNDADOR_PLAN = {
  slug: 'fundador',
  name: 'Fundador',
  description: 'Plano interno da parceira fundadora — acesso total, sem cobrança.',
  priceMonthly: 0,
  priceYearly: 0,
  maxProperties: -1,
  maxLeadViews: -1,
  maxUsers: -1,
  maxAIRequests: -1,
  themes: ['all'],
  modules: ['site_basico', 'crm_basico', 'crm_avancado', 'ia_tomas', 'whatsapp', 'leiloes', 'dominio_proprio', 'split_pagamentos', 'video_editor'],
  features: ['Acesso completo e ilimitado', 'Isento de cobrança (parceira fundadora)'],
  isActive: true,
  sortOrder: 0,
  metadata: { internal: true, billingExempt: true, allModules: true, allThemes: true } as any,
}

// ── Utilitários ────────────────────────────────────────────────────────────
const log = (...a: any[]) => console.log(...a)
const norm = (e: string) => e.trim().toLowerCase()

function mergeSettings(existing: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const base = existing && typeof existing === 'object' && !Array.isArray(existing)
    ? (existing as Record<string, unknown>) : {}
  return { ...base, ...patch }
}
function dbHost(url: string): string { try { return new URL(url).host } catch { return '(não parseável)' } }
function abort(msg: string): never { console.error(`\n❌ ABORTADO: ${msg}\n`); process.exit(1) }
function genPassword(): string { return 'Lm-' + randomBytes(12).toString('base64url') }
function firstDuplicates(arr: string[]): string[] {
  const seen = new Set<string>(); const dup = new Set<string>()
  for (const v of arr) { if (seen.has(v)) dup.add(v); else seen.add(v) }
  return [...dup]
}

// ── Guardas de segurança ────────────────────────────────────────────────────
function preflight() {
  if (!process.env.DATABASE_URL) abort('DATABASE_URL não definida.')
  log('─'.repeat(70))
  log(`Banco de destino: ${dbHost(process.env.DATABASE_URL!)}`)
  log(`Modo:             ${DRY_RUN ? '🔍 DRY-RUN (não grava)' : '🚨 EXECUÇÃO REAL (grava)'}`)
  log(`SOURCE_MODE:      ${SOURCE_MODE || '(nenhum — não moverá imóveis)'}`)
  log(`SOURCE_COMPANY:   ${SOURCE_COMPANY_ID || '—'}`)
  log(`SOURCE_USER:      ${SOURCE_USER_EMAIL || '—'}`)
  log(`Subdomínio:       ${SUBDOMAIN}`)
  log('─'.repeat(70))

  if (!DRY_RUN && CONFIRM !== 'IMOBILIARIA_LEMOS') {
    abort('Execução real exige CONFIRM_PRODUCTION_MIGRATION=IMOBILIARIA_LEMOS.')
  }
  if (!SKIP_PROPERTIES && SOURCE_MODE) {
    const validModes = ['company', 'user', 'company_and_user']
    if (!validModes.includes(SOURCE_MODE)) abort(`SOURCE_MODE inválido: use ${validModes.join(' | ')}.`)
    if ((SOURCE_MODE === 'company' || SOURCE_MODE === 'company_and_user') && !SOURCE_COMPANY_ID)
      abort('SOURCE_MODE requer SOURCE_COMPANY_ID.')
    if ((SOURCE_MODE === 'user' || SOURCE_MODE === 'company_and_user') && !SOURCE_USER_EMAIL)
      abort('SOURCE_MODE requer SOURCE_USER_EMAIL.')
  }
}

// WHERE de seleção de imóveis, com semântica explícita (AND estrito no modo duplo).
async function buildPropertyWhere(): Promise<any | null> {
  if (SKIP_PROPERTIES || !SOURCE_MODE) return null
  const sourceUser = SOURCE_USER_EMAIL
    ? await prisma.user.findUnique({ where: { email: SOURCE_USER_EMAIL }, select: { id: true } })
    : null
  if ((SOURCE_MODE === 'user' || SOURCE_MODE === 'company_and_user') && !sourceUser)
    abort(`SOURCE_USER_EMAIL não encontrado: ${SOURCE_USER_EMAIL}`)
  if (SOURCE_MODE === 'company') return { companyId: SOURCE_COMPANY_ID }
  if (SOURCE_MODE === 'user') return { userId: sourceUser!.id }
  return { AND: [{ companyId: SOURCE_COMPANY_ID }, { userId: sourceUser!.id }] } // AND estrito
}

// ═══════════════════════════════════════════════════════════════════════════
// PASS 1 — build plan (SOMENTE LEITURAS; nenhuma escrita).
// Coleta o estado ANTERIOR completo para o snapshot pré-escrita.
// ═══════════════════════════════════════════════════════════════════════════
interface UserPlan { email: string; name: string; role: 'ADMIN' | 'BROKER'; existed: boolean; id: string | null; oldCompanyId: string | null; oldRole: string | null; hadPassword: boolean }
interface Plan {
  planExisted: boolean
  company: { existed: boolean; id: string | null }
  tenant: { existed: boolean; id: string | null; before: any | null }
  users: UserPlan[]
  properties: { id: string; oldCompanyId: string; oldUserId: string; slug: string; reference: string | null; title: string | null }[]
  movableOwners: { id: string; oldCompanyId: string }[]
  sharedOwners: string[]
}

async function buildPlan(): Promise<Plan> {
  const planExisted = !!(await prisma.planDefinition.findUnique({ where: { slug: 'fundador' }, select: { id: true } }).catch(() => null))

  const companyRow = await prisma.company.findFirst({
    where: { settings: { path: ['canonical'], equals: CANONICAL } }, select: { id: true },
  }).catch(() => null)
  const company = { existed: !!companyRow, id: companyRow?.id ?? null }

  // Guarda de subdomínio (colisão com outro tenant).
  const bySub = await prisma.tenant.findUnique({ where: { subdomain: SUBDOMAIN } }).catch(() => null)
  if (bySub) {
    const isOurs = (bySub.settings as any)?.canonical === CANONICAL || (company.id && bySub.companyId === company.id)
    if (!isOurs) abort(`Subdomínio "${SUBDOMAIN}" já pertence a outro tenant (${bySub.id}). Escolha outro SUBDOMAIN.`)
  }
  const tenant = { existed: !!bySub, id: bySub?.id ?? null, before: bySub ? { companyId: bySub.companyId, ownerId: bySub.ownerId, plan: bySub.plan, planStatus: bySub.planStatus } : null }

  // Usuários: estado anterior (idempotência por email normalizado; aborta duplicado).
  const users: UserPlan[] = []
  for (const u of [...ADMINS.map(a => ({ ...a, role: 'ADMIN' as const })), ...BROKERS.map(b => ({ ...b, role: 'BROKER' as const }))]) {
    const email = norm(u.email)
    const dupes = await prisma.user.count({ where: { email } })
    if (dupes > 1) abort(`Mais de um usuário com email ${u.email} — resolva a duplicidade antes.`)
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, companyId: true, role: true, passwordHash: true } })
    users.push({
      email, name: u.name, role: u.role, existed: !!existing, id: existing?.id ?? null,
      oldCompanyId: existing?.companyId ?? null, oldRole: existing?.role ?? null, hadPassword: !!existing?.passwordHash,
    })
  }

  // Imóveis + colisões + owners (movíveis vs compartilhados).
  let properties: Plan['properties'] = []
  let movableOwners: Plan['movableOwners'] = []
  let sharedOwners: string[] = []
  const where = await buildPropertyWhere()
  if (where) {
    const ids = await prisma.property.findMany({ where, select: { id: true, companyId: true, userId: true, slug: true, reference: true, title: true } })
    if (ids.length > MAX_MOVE) abort(`Seleção (${ids.length}) excede MAX_MOVE (${MAX_MOVE}). Confira o filtro.`)
    if (EXPECTED_PROPERTY_COUNT != null && ids.length !== EXPECTED_PROPERTY_COUNT)
      abort(`Contagem (${ids.length}) diverge de EXPECTED_PROPERTY_COUNT (${EXPECTED_PROPERTY_COUNT}). Revise o filtro.`)

    // Colisão de slug/reference dentro da seleção (só ocorre se origem multi-empresa).
    const dupSlugs = firstDuplicates(ids.map(p => p.slug))
    const dupRefs = firstDuplicates(ids.map(p => p.reference).filter(Boolean) as string[])
    if (dupSlugs.length) abort(`Colisão de slug dentro da seleção: ${dupSlugs.slice(0, 10).join(', ')}. Origem multi-empresa? Restrinja o filtro.`)
    if (dupRefs.length) abort(`Colisão de reference dentro da seleção: ${dupRefs.slice(0, 10).join(', ')}.`)
    // Colisão com imóveis já existentes na company de destino (se ela já existe).
    if (company.id && ids.length) {
      const selIds = ids.map(p => p.id)
      const clashSlug = await prisma.property.count({ where: { companyId: company.id, slug: { in: ids.map(p => p.slug) }, id: { notIn: selIds } } })
      const refs = ids.map(p => p.reference).filter(Boolean) as string[]
      const clashRef = refs.length ? await prisma.property.count({ where: { companyId: company.id, reference: { in: refs }, id: { notIn: selIds } } }) : 0
      if (clashSlug > 0 || clashRef > 0) abort(`Destino já possui imóveis com slug/reference em conflito (slug=${clashSlug}, ref=${clashRef}).`)
    }
    properties = ids.map(p => ({ id: p.id, oldCompanyId: p.companyId, oldUserId: p.userId, slug: p.slug, reference: p.reference, title: p.title }))

    // Owners via PropertyOwner: compartilhados (donos de imóveis fora da seleção) NÃO movem.
    const movedSet = new Set(ids.map(p => p.id))
    const owners = await prisma.propertyOwner.findMany({ where: { propertyId: { in: ids.map(p => p.id) } }, select: { contactId: true } })
    const ownerContactIds = [...new Set(owners.map(o => o.contactId))]
    const movableIds: string[] = []
    for (const cid of ownerContactIds) {
      const links = await prisma.propertyOwner.findMany({ where: { contactId: cid }, select: { propertyId: true } })
      if (links.some(l => !movedSet.has(l.propertyId))) sharedOwners.push(cid); else movableIds.push(cid)
    }
    movableOwners = movableIds.length
      ? (await prisma.contact.findMany({ where: { id: { in: movableIds } }, select: { id: true, companyId: true } })).map(c => ({ id: c.id, oldCompanyId: c.companyId }))
      : []
  }

  return { planExisted, company, tenant, users, properties, movableOwners, sharedOwners }
}

// ── Report (dry-run) ────────────────────────────────────────────────────────
function reportPlan(plan: Plan) {
  log('\n📋 PLANO (dry-run — nada será gravado):')
  log(`   • Plano fundador: ${plan.planExisted ? 'existe (será atualizado)' : 'será criado'}`)
  log(`   • Company Lemos: ${plan.company.existed ? `existe (${plan.company.id})` : 'será criada'}`)
  log(`   • Tenant "${SUBDOMAIN}": ${plan.tenant.existed ? `existe (${plan.tenant.id})` : 'será criado'}`)
  log(`   • Usuários: ${plan.users.length} (${plan.users.filter(u => u.existed).length} já existem → serão movidos/atualizados; ${plan.users.filter(u => !u.existed).length} novos)`)
  for (const u of plan.users) log(`       - ${u.email.padEnd(38)} ${u.role} ${u.existed ? `(existe: company=${u.oldCompanyId} role=${u.oldRole})` : '(novo)'}`)
  log(`   • Imóveis a mover: ${plan.properties.length}`)
  plan.properties.slice(0, 5).forEach(p => log(`       - ${p.id} | ${p.reference ?? '—'} | ${p.title?.slice(0, 40) ?? ''} | company=${p.oldCompanyId}`))
  log(`   • Contatos-proprietários: movíveis ${plan.movableOwners.length}, compartilhados/mantidos ${plan.sharedOwners.length}`)
}

async function reportRelatedData(propertyIds: string[], sourceCompanyId: string | null) {
  if (propertyIds.length === 0) return
  log('\n🔎 Dados relacionados (REPORTE — não são movidos automaticamente):')
  const idSet = { in: propertyIds }
  const safeCount = async (label: string, fn: () => Promise<number>) => {
    try { log(`   • ${label}: ${await fn()}`) } catch { log(`   • ${label}: (modelo indisponível)`) }
  }
  await safeCount('LeadProperty (leads↔imóvel)', () => (prisma as any).leadProperty.count({ where: { propertyId: idSet } }))
  await safeCount('DealProperty (deals↔imóvel)', () => (prisma as any).dealProperty.count({ where: { propertyId: idSet } }))
  await safeCount('PortalPublication', () => (prisma as any).portalPublication.count({ where: { propertyId: idSet } }))
  if (sourceCompanyId) {
    await safeCount('Contacts na company de origem (total)', () => prisma.contact.count({ where: { companyId: sourceCompanyId } }))
    await safeCount('Leads na company de origem (total)', () => prisma.lead.count({ where: { companyId: sourceCompanyId } }))
  }
  log('   → Migração relacional destes dados deve ser um passo revisado à parte (ver runbook).')
}

// ── Snapshot (pré-escrita, progresso, conclusão) ────────────────────────────
type SnapStatus = 'started' | 'completed' | 'failed'
interface Snapshot {
  status: SnapStatus
  error?: string
  sourceMode: string; sourceCompanyId: string | null; sourceUserEmail: string | null
  before: {
    planExisted: boolean
    company: { existed: boolean; id: string | null }
    tenant: { existed: boolean; id: string | null; before: any | null }
    users: { email: string; existed: boolean; id: string | null; oldCompanyId: string | null; oldRole: string | null }[]
    properties: { id: string; oldCompanyId: string; oldUserId: string }[]
    contacts: { id: string; oldCompanyId: string }[]
    sharedOwnersKept: string[]
  }
  progress: { propertiesTotal: number; propertiesDone: number; lastBatchIndex: number; contactsMoved: number; sessionsRevoked: number }
  targetCompanyId?: string | null
}
let SNAP_FILE = ''
function initSnapshot(plan: Plan): Snapshot {
  return {
    status: 'started',
    sourceMode: SOURCE_MODE, sourceCompanyId: SOURCE_COMPANY_ID || null, sourceUserEmail: SOURCE_USER_EMAIL || null,
    before: {
      planExisted: plan.planExisted,
      company: plan.company,
      tenant: plan.tenant,
      users: plan.users.map(u => ({ email: u.email, existed: u.existed, id: u.id, oldCompanyId: u.oldCompanyId, oldRole: u.oldRole })),
      properties: plan.properties.map(p => ({ id: p.id, oldCompanyId: p.oldCompanyId, oldUserId: p.oldUserId })),
      contacts: plan.movableOwners.map(c => ({ id: c.id, oldCompanyId: c.oldCompanyId })),
      sharedOwnersKept: plan.sharedOwners,
    },
    progress: { propertiesTotal: plan.properties.length, propertiesDone: 0, lastBatchIndex: -1, contactsMoved: 0, sessionsRevoked: 0 },
  }
}
// `required=true` → falha ao gravar ABORTA (impede modificar o banco sem um
// snapshot válido de rastreabilidade). `required=false` só loga (best-effort,
// usado apenas na gravação de status "failed" dentro do catch).
function writeSnapshot(snap: Snapshot, required = false) {
  try {
    if (!SNAP_FILE) {
      const dir = join(process.cwd(), '.migration-runs')
      mkdirSync(dir, { recursive: true })
      const stamp = process.env.RUN_STAMP || String(process.hrtime.bigint())
      SNAP_FILE = join(dir, `lemos-provision-${stamp}.json`)
    }
    writeFileSync(SNAP_FILE, JSON.stringify(snap, null, 2))
  } catch (e) {
    if (required) throw new Error(`Não foi possível gravar o snapshot obrigatório: ${(e as Error).message}`)
    log('⚠️  Falha ao gravar snapshot:', (e as Error).message)
  }
}

// Confirma que o snapshot inicial existe e tem conteúdo JSON válido antes de
// permitir QUALQUER escrita no banco. Aborta se não conseguir reler/parsear.
function assertSnapshotPersisted() {
  if (!SNAP_FILE) abort('Snapshot obrigatório não foi materializado (SNAP_FILE vazio).')
  try {
    const raw = readFileSync(SNAP_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.status !== 'started' || !parsed.before) {
      abort(`Snapshot inicial inválido em ${SNAP_FILE} (conteúdo inesperado).`)
    }
  } catch (e) {
    abort(`Não foi possível reler/validar o snapshot obrigatório (${SNAP_FILE}): ${(e as Error).message}`)
  }
}

// ── Execução real (writes) — snapshot já gravado como "started" ──────────────
async function ensureFundadorPlanUpsert() {
  // Upsert idempotente com os dados CANÔNICOS (garante metadata/módulos/temas/
  // limites/preços/isActive corretos mesmo que o plano já exista).
  await prisma.planDefinition.upsert({
    where: { slug: FUNDADOR_PLAN.slug },
    update: {
      name: FUNDADOR_PLAN.name, description: FUNDADOR_PLAN.description,
      priceMonthly: FUNDADOR_PLAN.priceMonthly, priceYearly: FUNDADOR_PLAN.priceYearly,
      maxProperties: FUNDADOR_PLAN.maxProperties, maxLeadViews: FUNDADOR_PLAN.maxLeadViews,
      maxUsers: FUNDADOR_PLAN.maxUsers, maxAIRequests: FUNDADOR_PLAN.maxAIRequests,
      themes: FUNDADOR_PLAN.themes, modules: FUNDADOR_PLAN.modules, features: FUNDADOR_PLAN.features,
      isActive: FUNDADOR_PLAN.isActive, sortOrder: FUNDADOR_PLAN.sortOrder, metadata: FUNDADOR_PLAN.metadata,
    },
    create: { ...FUNDADOR_PLAN },
  })
}

async function ensureCompany(plan: Plan): Promise<string> {
  if (plan.company.existed && plan.company.id) {
    const cur = await prisma.company.findUnique({ where: { id: plan.company.id }, select: { settings: true } })
    await prisma.company.update({
      where: { id: plan.company.id },
      data: { plan: 'fundador', isActive: true, settings: mergeSettings(cur?.settings, { canonical: CANONICAL, billingExempt: true }) as any },
    })
    return plan.company.id
  }
  const created = await prisma.company.create({
    data: {
      name: 'Imobiliária Lemos', tradeName: 'Imobiliária Lemos', creci: '279051-F',
      city: 'Franca', state: 'SP', email: 'contato@imobiliarialemos.com.br',
      website: 'https://www.imobiliarialemos.com.br', plan: 'fundador', isActive: true,
      settings: { canonical: CANONICAL, billingExempt: true } as any,
    },
  })
  return created.id
}

async function upsertUser(u: UserPlan, companyId: string, creds: { email: string; password: string }[]): Promise<string> {
  const settingsPatch: Record<string, unknown> = { mustChangePassword: true }
  if (u.role === 'ADMIN') settingsPatch.accessLevel = 'full'
  if (u.existed && u.id) {
    const cur = await prisma.user.findUnique({ where: { id: u.id }, select: { settings: true, emailVerifiedAt: true, passwordHash: true } })
    const data: any = {
      companyId, role: u.role, status: 'ACTIVE',
      emailVerifiedAt: cur?.emailVerifiedAt ?? new Date(),
      settings: mergeSettings(cur?.settings, settingsPatch) as any,
    }
    // NÃO sobrescreve senha de existente (salvo RESET_EXISTING_PASSWORDS ou sem senha).
    if (RESET_EXISTING_PASSWORDS || !cur?.passwordHash) {
      const pw = FORCE_PASSWORD || genPassword()
      data.passwordHash = await argon2.hash(pw, { type: argon2.argon2id })
      creds.push({ email: u.email, password: pw })
    }
    await prisma.user.update({ where: { id: u.id }, data })
    return u.id
  }
  const pw = FORCE_PASSWORD || genPassword()
  const created = await prisma.user.create({
    data: {
      companyId, email: u.email, name: u.name, role: u.role, status: 'ACTIVE',
      emailVerifiedAt: new Date(), passwordHash: await argon2.hash(pw, { type: argon2.argon2id }),
      settings: settingsPatch as any,
    },
  })
  creds.push({ email: u.email, password: pw })
  return created.id
}

async function ensureTenant(plan: Plan, companyId: string, ownerId: string) {
  if (plan.tenant.existed && plan.tenant.id) {
    const cur = await prisma.tenant.findUnique({ where: { id: plan.tenant.id }, select: { settings: true } })
    await prisma.tenant.update({
      where: { id: plan.tenant.id },
      data: {
        plan: 'fundador', planStatus: 'ACTIVE', planPrice: 0, splitPercent: 0, isActive: true,
        companyId, ownerId, settings: mergeSettings(cur?.settings, { canonical: CANONICAL, billingExempt: true }) as any,
      },
    })
    return
  }
  await prisma.tenant.create({
    data: {
      name: 'Imobiliária Lemos', subdomain: SUBDOMAIN, companyId, ownerId,
      plan: 'fundador', planStatus: 'ACTIVE', planPrice: 0, splitPercent: 0, isActive: true,
      activatedAt: new Date(), settings: { canonical: CANONICAL, billingExempt: true } as any,
    },
  })
}

async function executePlan(plan: Plan, snap: Snapshot, creds: { email: string; password: string }[]) {
  // 1) Plano (upsert canônico)
  await ensureFundadorPlanUpsert()
  // 2) Company
  const companyId = await ensureCompany(plan)
  snap.targetCompanyId = companyId; writeSnapshot(snap, true)
  // 3) Proprietário principal PRIMEIRO (resolve dependência circular do tenant)
  const mainPlan = plan.users.find(u => u.email === MAIN_ADMIN_EMAIL)!
  const mainUserId = await upsertUser(mainPlan, companyId, creds)
  // 4) Tenant (ownerId = proprietário principal)
  await ensureTenant(plan, companyId, mainUserId)
  // 5) Demais usuários
  for (const u of plan.users) { if (u.email !== MAIN_ADMIN_EMAIL) await upsertUser(u, companyId, creds) }
  log(`👥 Usuários provisionados: ${plan.users.length}`)

  // 6) Imóveis em lotes, atualizando progresso no snapshot
  const propIds = plan.properties.map(p => p.id)
  for (let i = 0; i < propIds.length; i += BATCH_SIZE) {
    const batch = propIds.slice(i, i + BATCH_SIZE)
    await prisma.property.updateMany({ where: { id: { in: batch } }, data: { companyId, userId: mainUserId } })
    snap.progress.propertiesDone += batch.length
    snap.progress.lastBatchIndex = Math.floor(i / BATCH_SIZE)
    writeSnapshot(snap, true)
    log(`   ...imóveis movidos ${snap.progress.propertiesDone}/${propIds.length}`)
  }
  // 7) Contatos-proprietários movíveis (não compartilhados)
  const movableIds = plan.movableOwners.map(c => c.id)
  if (movableIds.length) {
    await prisma.contact.updateMany({ where: { id: { in: movableIds } }, data: { companyId } })
    snap.progress.contactsMoved = movableIds.length; writeSnapshot(snap, true)
  }
  // 8) Revogar sessões dos usuários provisionados (inclui o gmail que perde SUPER_ADMIN)
  const provisionedIds = plan.users.map(u => u.id).filter(Boolean) as string[]
  // (ids de usuários novos foram materializados acima; recoleta por email para garantir)
  const allIds = (await prisma.user.findMany({ where: { email: { in: plan.users.map(u => u.email) } }, select: { id: true } })).map(x => x.id)
  const ids = [...new Set([...provisionedIds, ...allIds])]
  const s = await prisma.session.deleteMany({ where: { userId: { in: ids } } }).catch(() => ({ count: 0 }))
  const r = await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } }).catch(() => ({ count: 0 }))
  snap.progress.sessionsRevoked = s.count; writeSnapshot(snap, true)
  log(`🔒 Sessões revogadas: ${s.count} | refresh tokens: ${r.count}`)
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  preflight()

  const superAdmin = await prisma.user.findUnique({ where: { email: PLATFORM_SUPERADMIN_EMAIL }, select: { role: true } })
  if (!superAdmin) log(`⚠️  Aviso: super-admin da plataforma (${PLATFORM_SUPERADMIN_EMAIL}) não encontrado.`)
  else if (superAdmin.role !== 'SUPER_ADMIN') log(`⚠️  Aviso: ${PLATFORM_SUPERADMIN_EMAIL} existe mas não é SUPER_ADMIN (corrigido no boot da API).`)

  // PASS 1 — plano (somente leituras)
  const plan = await buildPlan()

  // DRY-RUN: reporta e SAI. Não grava NADA (nem snapshot).
  if (DRY_RUN) {
    reportPlan(plan)
    await reportRelatedData(plan.properties.map(p => p.id), SOURCE_COMPANY_ID || null)
    log('\n🔍 DRY-RUN concluído (nada foi gravado — nem snapshot).')
    log('   Revise os números e rode com DRY_RUN=false CONFIRM_PRODUCTION_MIGRATION=IMOBILIARIA_LEMOS.')
    return
  }

  // PASS 2 — execução real. Snapshot "started" ANTES da primeira escrita.
  // OBRIGATÓRIO: se não conseguir gravar/validar o snapshot, aborta SEM tocar o banco.
  const snap = initSnapshot(plan)
  writeSnapshot(snap, true)
  assertSnapshotPersisted()
  log(`\n🗂️  Snapshot pré-escrita gravado e validado (status=started): ${SNAP_FILE}`)
  const creds: { email: string; password: string }[] = []
  try {
    await executePlan(plan, snap, creds)
    snap.status = 'completed'; writeSnapshot(snap, true)
  } catch (e) {
    // best-effort: não mascara o erro original se a gravação de "failed" falhar.
    snap.status = 'failed'; snap.error = (e as Error).message; writeSnapshot(snap)
    log(`\n❌ Falha na execução — snapshot marcado como "failed" (último lote: ${snap.progress.lastBatchIndex}, imóveis movidos: ${snap.progress.propertiesDone}/${snap.progress.propertiesTotal}).`)
    throw e
  }

  await reportRelatedData(plan.properties.map(p => p.id), SOURCE_COMPANY_ID || null)

  if (plan.sharedOwners.length) log(`\n⚠️  ${plan.sharedOwners.length} proprietário(s) compartilhado(s) NÃO movidos (também possuem imóveis fora da seleção).`)

  if (creds.length > 0) {
    // Segurança: as senhas provisórias NÃO são logadas em claro por padrão
    // (CodeQL: clear-text logging). Vão para um arquivo LOCAL restrito (modo
    // 600) dentro de .migration-runs/ (git-ignorado) — nunca no snapshot JSON.
    // Correlacionamos o nome com o stamp do snapshot para rastreabilidade.
    const credFile = SNAP_FILE
      ? SNAP_FILE.replace(/lemos-provision-(.*)\.json$/, 'lemos-credentials-$1.txt')
      : join(process.cwd(), '.migration-runs', 'lemos-credentials.txt')
    const fileBody =
      '# Credenciais provisórias — Imobiliária Lemos\n' +
      '# Entregue cada uma ao respectivo usuário por canal seguro e APAGUE este arquivo depois.\n' +
      '# Todos os usuários têm mustChangePassword = true (trocam a senha no 1º acesso).\n' +
      '# Este arquivo NÃO é versionado (.migration-runs/ está no .gitignore).\n\n' +
      creds.map(c => `${c.email}\t${c.password}`).join('\n') + '\n'
    let credWritten = false
    try {
      writeFileSync(credFile, fileBody, { mode: 0o600 })
      try { chmodSync(credFile, 0o600) } catch { /* fs sem suporte a permissões POSIX */ }
      credWritten = true
    } catch (e) {
      log('⚠️  Falha ao gravar o arquivo de credenciais:', (e as Error).message)
    }

    // As senhas em claro NUNCA são impressas — existem apenas no arquivo restrito
    // acima (nenhum caminho de código as envia a log/console).
    log('\n' + '═'.repeat(70))
    log(`🔑 ${creds.length} credencial(is) provisória(s) gerada(s).`)
    if (credWritten) log(`   Arquivo (permissões 600): ${credFile}`)
    else log('   ⚠️  Não foi possível gravar o arquivo de credenciais — verifique o diretório .migration-runs/.')
    log('   Entregue cada uma ao respectivo usuário por CANAL SEGURO e apague o arquivo depois.')
    log('   Todos têm mustChangePassword = true (trocam a senha no 1º acesso).')
    log('═'.repeat(70))
  }

  log(`\n✅ Provisionamento concluído. Snapshot (status=completed): ${SNAP_FILE}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
