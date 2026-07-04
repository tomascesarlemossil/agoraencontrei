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
 *      para não deixar referência cross-tenant de dono.
 *   8. Revoga sessões/refresh tokens dos usuários provisionados (força novo login).
 *   9. Grava um arquivo de ROLLBACK (antes→depois) em ./.migration-runs/.
 *
 * O que este script NÃO faz automaticamente (por segurança — ver runbook):
 *   • NÃO move em massa dados operacionais só por companyId (leads, deals,
 *     contratos, locações, transações, contatos genéricos). Ele apenas REPORTA
 *     no dry-run quantos registros da origem referenciam os imóveis movidos, para
 *     você decidir uma migração relacional revisada em passo separado.
 *   • NÃO cancela cobranças/assinaturas Asaas existentes (apenas reporta IDs).
 *   • NÃO sobrescreve senha de usuário que já existe (a menos de RESET_EXISTING_PASSWORDS).
 *
 * ──────────────────────────────────────────────────────────────────
 * COMO RODAR (numa máquina/CI que enxergue o banco de PRODUÇÃO):
 *
 *   # 1) Pré-visualizar (NÃO grava nada). DRY_RUN é o padrão seguro.
 *   DATABASE_URL=... \
 *   SOURCE_MODE=company \
 *   SOURCE_COMPANY_ID=cmnhzieqf0000mx1cqcqgfv4n \
 *   npx tsx scripts/provision-imobiliaria-lemos.ts
 *
 *   # 2) Executar de verdade (exige confirmação forte):
 *   DATABASE_URL=... \
 *   SOURCE_MODE=company \
 *   SOURCE_COMPANY_ID=cmnhzieqf0000mx1cqcqgfv4n \
 *   DRY_RUN=false \
 *   CONFIRM_PRODUCTION_MIGRATION=IMOBILIARIA_LEMOS \
 *   npx tsx scripts/provision-imobiliaria-lemos.ts
 *
 * VARIÁVEIS DE AMBIENTE:
 *   DATABASE_URL                 (obrigatória) conexão Postgres
 *   DRY_RUN                      default "true" — SÓ "false" (exato) executa
 *   CONFIRM_PRODUCTION_MIGRATION exija = "IMOBILIARIA_LEMOS" quando DRY_RUN=false
 *   SOURCE_MODE                  "company" | "user" | "company_and_user" (obrigatória p/ mover imóveis)
 *   SOURCE_COMPANY_ID            id da company de origem dos imóveis
 *   SOURCE_USER_EMAIL            e-mail do usuário dono atual dos imóveis
 *   SKIP_PROPERTIES              "true" — só provisiona estrutura, não mexe em imóveis
 *   MAX_MOVE                     limite de segurança (default 100000); aborta se exceder
 *   BATCH_SIZE                   lote de update de imóveis (default 200)
 *   RESET_EXISTING_PASSWORDS     "true" — redefine senha de usuários já existentes p/ a padrão
 *   DEFAULT_PASSWORD             senha provisória (default "lemos2026")
 *   SUBDOMAIN                    subdomínio do tenant (default "lemos")
 */

import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import { randomBytes } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
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
const MAX_MOVE = Number(process.env.MAX_MOVE || 100000)
const BATCH_SIZE = Math.max(1, Number(process.env.BATCH_SIZE || 200))
const RESET_EXISTING_PASSWORDS = process.env.RESET_EXISTING_PASSWORDS === 'true'
// Contagem esperada de imóveis: se definida, o script ABORTA caso a seleção
// divirja (guarda anti-erro de filtro). Deixe vazio p/ não checar.
const EXPECTED_PROPERTY_COUNT = process.env.EXPECTED_PROPERTY_COUNT
  ? Number(process.env.EXPECTED_PROPERTY_COUNT) : null
// Senha: por padrão, cada usuário NOVO recebe uma senha ALEATÓRIA INDIVIDUAL
// (impressa uma única vez ao final). NÃO há mais senha coletiva. Um valor
// explícito em FORCE_PASSWORD só é usado se você quiser forçar uma senha comum.
const FORCE_PASSWORD = process.env.FORCE_PASSWORD || process.env.DEFAULT_PASSWORD || ''
const SUBDOMAIN = (process.env.SUBDOMAIN || 'lemos').toLowerCase().trim()

// Gera uma senha forte, aleatória e individual (impressa uma vez; nunca no snapshot).
function genPassword(): string {
  return 'Lm-' + randomBytes(12).toString('base64url')
}

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

// ── Utilitários ────────────────────────────────────────────────────────────
const log = (...a: any[]) => console.log(...a)
const norm = (e: string) => e.trim().toLowerCase()

function mergeSettings(existing: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const base = existing && typeof existing === 'object' && !Array.isArray(existing)
    ? (existing as Record<string, unknown>)
    : {}
  return { ...base, ...patch }
}

function dbHost(url: string): string {
  try { return new URL(url).host } catch { return '(não parseável)' }
}

function abort(msg: string): never {
  console.error(`\n❌ ABORTADO: ${msg}\n`)
  process.exit(1)
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

// Constrói o WHERE de seleção de imóveis a mover, com semântica explícita.
async function buildPropertyWhere(): Promise<any | null> {
  if (SKIP_PROPERTIES || !SOURCE_MODE) return null
  const sourceUser = SOURCE_USER_EMAIL
    ? await prisma.user.findUnique({ where: { email: SOURCE_USER_EMAIL }, select: { id: true, companyId: true } })
    : null
  if ((SOURCE_MODE === 'user' || SOURCE_MODE === 'company_and_user') && !sourceUser)
    abort(`SOURCE_USER_EMAIL não encontrado: ${SOURCE_USER_EMAIL}`)

  if (SOURCE_MODE === 'company') return { companyId: SOURCE_COMPANY_ID }
  if (SOURCE_MODE === 'user') return { userId: sourceUser!.id }
  // company_and_user → AND estrito (mais seguro)
  return { AND: [{ companyId: SOURCE_COMPANY_ID }, { userId: sourceUser!.id }] }
}

// ── Provisionamento estrutural (idempotente) ────────────────────────────────
async function ensureFundadorPlan() {
  const existing = await prisma.planDefinition.findUnique({ where: { slug: 'fundador' } })
  if (existing) return existing
  if (DRY_RUN) { log('• [dry] criaria PlanDefinition "fundador"'); return null }
  return prisma.planDefinition.create({
    data: {
      slug: 'fundador', name: 'Fundador',
      description: 'Plano interno da parceira fundadora — acesso total, sem cobrança.',
      priceMonthly: 0, priceYearly: 0,
      maxProperties: -1, maxLeadViews: -1, maxUsers: -1, maxAIRequests: -1,
      themes: ['all'], modules: ['site_basico', 'crm_basico', 'crm_avancado', 'ia_tomas', 'whatsapp', 'leiloes', 'dominio_proprio', 'split_pagamentos', 'video_editor'],
      features: ['Acesso completo e ilimitado', 'Isento de cobrança (parceira fundadora)'],
      isActive: true, sortOrder: 0,
      metadata: { internal: true, billingExempt: true, allModules: true, allThemes: true } as any,
    },
  })
}

async function ensureCompany() {
  const found = await prisma.company.findFirst({
    where: { settings: { path: ['canonical'], equals: CANONICAL } },
  }).catch(() => null)
  if (found) {
    if (!DRY_RUN) {
      await prisma.company.update({
        where: { id: found.id },
        data: { plan: 'fundador', isActive: true, settings: mergeSettings(found.settings, { canonical: CANONICAL, billingExempt: true }) as any },
      })
    }
    return found
  }
  if (DRY_RUN) { log('• [dry] criaria Company "Imobiliária Lemos"'); return null }
  return prisma.company.create({
    data: {
      name: 'Imobiliária Lemos', tradeName: 'Imobiliária Lemos',
      creci: '279051-F', city: 'Franca', state: 'SP',
      email: 'contato@imobiliarialemos.com.br', website: 'https://www.imobiliarialemos.com.br',
      plan: 'fundador', isActive: true,
      settings: { canonical: CANONICAL, billingExempt: true } as any,
    },
  })
}

// Cria/atualiza um usuário de forma idempotente por email (normalizado).
// `creds` acumula {email, password} das senhas geradas, p/ impressão única.
async function upsertUser(
  u: { email: string; name: string },
  role: 'ADMIN' | 'BROKER',
  companyId: string | null,
  creds: { email: string; password: string }[],
) {
  const email = norm(u.email)
  const existing = await prisma.user.findUnique({ where: { email } })
  const settingsPatch: Record<string, unknown> = { mustChangePassword: true }
  if (role === 'ADMIN') { settingsPatch.accessLevel = 'full' }

  if (existing) {
    const report = { email, action: 'update', wasCompanyId: existing.companyId, wasRole: existing.role }
    if (!DRY_RUN && companyId) {
      const data: any = {
        companyId, role, status: 'ACTIVE',
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        settings: mergeSettings(existing.settings, settingsPatch) as any,
      }
      // Usuário EXISTENTE: NÃO sobrescreve a senha (a menos de RESET_EXISTING_PASSWORDS
      // ou se ele não tem senha alguma — ex.: só login social).
      if (RESET_EXISTING_PASSWORDS || !existing.passwordHash) {
        const pw = FORCE_PASSWORD || genPassword()
        data.passwordHash = await argon2.hash(pw, { type: argon2.argon2id })
        creds.push({ email, password: pw })
      }
      await prisma.user.update({ where: { id: existing.id }, data })
    }
    return { ...report, id: existing.id }
  }

  // Usuário NOVO: senha ALEATÓRIA INDIVIDUAL (ou FORCE_PASSWORD se explicitado).
  const pw = FORCE_PASSWORD || genPassword()
  if (DRY_RUN || !companyId) { log(`• [dry] criaria user ${email} (${role})`); return { email, action: 'create', id: null, wasCompanyId: null, wasRole: null } }
  const created = await prisma.user.create({
    data: {
      companyId, email, name: u.name, role, status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      passwordHash: await argon2.hash(pw, { type: argon2.argon2id }),
      settings: settingsPatch as any,
    },
  })
  creds.push({ email, password: pw })
  return { email, action: 'create', id: created.id, wasCompanyId: null, wasRole: null }
}

async function ensureTenant(companyId: string | null, ownerId: string | null) {
  // Guarda contra colisão de subdomínio com outro tenant.
  const bySub = await prisma.tenant.findUnique({ where: { subdomain: SUBDOMAIN } }).catch(() => null)
  if (bySub) {
    const isOurs = (bySub.settings as any)?.canonical === CANONICAL || (companyId && bySub.companyId === companyId)
    if (!isOurs) abort(`Subdomínio "${SUBDOMAIN}" já pertence a outro tenant (${bySub.id}). Escolha outro SUBDOMAIN.`)
    if (!DRY_RUN) {
      await prisma.tenant.update({
        where: { id: bySub.id },
        data: {
          plan: 'fundador', planStatus: 'ACTIVE', planPrice: 0, splitPercent: 0, isActive: true,
          companyId: companyId ?? bySub.companyId, ownerId: ownerId ?? bySub.ownerId,
          settings: mergeSettings(bySub.settings, { canonical: CANONICAL, billingExempt: true }) as any,
        },
      })
    }
    return bySub
  }
  if (DRY_RUN || !companyId) { log(`• [dry] criaria Tenant "${SUBDOMAIN}"`); return null }
  return prisma.tenant.create({
    data: {
      name: 'Imobiliária Lemos', subdomain: SUBDOMAIN, companyId, ownerId,
      plan: 'fundador', planStatus: 'ACTIVE', planPrice: 0, splitPercent: 0, isActive: true,
      activatedAt: new Date(),
      settings: { canonical: CANONICAL, billingExempt: true } as any,
    },
  })
}

// ── Migração de imóveis (em lotes, com rollback) ────────────────────────────
async function migrateProperties(where: any, targetCompanyId: string | null, targetUserId: string | null) {
  const ids = await prisma.property.findMany({ where, select: { id: true, companyId: true, userId: true, reference: true, slug: true, title: true } })
  log(`\n📦 Imóveis selecionados para mover: ${ids.length}`)
  if (ids.length === 0) { log('   (nenhum imóvel corresponde ao filtro — nada a mover)'); return { moved: [], movedOwners: [], sharedOwners: [] } }
  if (ids.length > MAX_MOVE) abort(`Seleção (${ids.length}) excede MAX_MOVE (${MAX_MOVE}). Confira o filtro antes de prosseguir.`)
  // Guarda anti-erro: se a contagem esperada foi informada e diverge, aborta.
  if (EXPECTED_PROPERTY_COUNT != null && ids.length !== EXPECTED_PROPERTY_COUNT) {
    abort(`Contagem (${ids.length}) diverge de EXPECTED_PROPERTY_COUNT (${EXPECTED_PROPERTY_COUNT}). Revise o filtro.`)
  }

  // Amostra para conferência
  log('   Amostra (até 5):')
  ids.slice(0, 5).forEach(p => log(`     - ${p.id} | ${p.reference ?? '—'} | ${p.title?.slice(0, 50) ?? ''} | company=${p.companyId} user=${p.userId}`))
  const fromCompanies = [...new Set(ids.map(p => p.companyId))]
  log(`   Empresas de origem distintas: ${fromCompanies.length} → ${fromCompanies.join(', ')}`)

  // ── Detecção de colisão de slug/reference no destino ─────────────────────
  // Property tem @@unique([companyId, slug]) e @@unique([companyId, reference]).
  // (a) duplicados dentro da própria seleção (só ocorre se a origem for multi-empresa)
  const dupSlugs = firstDuplicates(ids.map(p => p.slug))
  const dupRefs = firstDuplicates(ids.map(p => p.reference).filter(Boolean) as string[])
  if (dupSlugs.length) abort(`Colisão de slug dentro da seleção: ${dupSlugs.slice(0, 10).join(', ')}. Origem multi-empresa? Restrinja o filtro.`)
  if (dupRefs.length) abort(`Colisão de reference dentro da seleção: ${dupRefs.slice(0, 10).join(', ')}.`)
  // (b) colisão com imóveis já existentes na company de destino
  if (targetCompanyId) {
    const clashSlug = await prisma.property.count({ where: { companyId: targetCompanyId, slug: { in: ids.map(p => p.slug) }, id: { notIn: ids.map(p => p.id) } } })
    const refs = ids.map(p => p.reference).filter(Boolean) as string[]
    const clashRef = refs.length ? await prisma.property.count({ where: { companyId: targetCompanyId, reference: { in: refs }, id: { notIn: ids.map(p => p.id) } } }) : 0
    if (clashSlug > 0 || clashRef > 0) abort(`Destino já possui imóveis com slug/reference em conflito (slug=${clashSlug}, ref=${clashRef}).`)
  }

  // ── Contatos-proprietários (via PropertyOwner) ───────────────────────────
  const movedSet = new Set(ids.map(p => p.id))
  const owners = await prisma.propertyOwner.findMany({
    where: { propertyId: { in: ids.map(p => p.id) } },
    select: { contactId: true },
  })
  const ownerContactIds = [...new Set(owners.map(o => o.contactId))]
  // Proprietário COMPARTILHADO: possui também imóvel FORA da seleção → NÃO mover
  // (senão o imóvel não-migrado passaria a referenciar contato de outra empresa).
  const sharedOwners: string[] = []
  const movableOwnerIds: string[] = []
  for (const cid of ownerContactIds) {
    const otherLinks = await prisma.propertyOwner.findMany({ where: { contactId: cid }, select: { propertyId: true } })
    const ownsOutside = otherLinks.some(l => !movedSet.has(l.propertyId))
    if (ownsOutside) sharedOwners.push(cid); else movableOwnerIds.push(cid)
  }
  log(`   Contatos-proprietários vinculados: ${ownerContactIds.length} (movíveis: ${movableOwnerIds.length}, compartilhados/mantidos: ${sharedOwners.length})`)
  if (sharedOwners.length) log(`   ⚠️  ${sharedOwners.length} proprietário(s) também possuem imóveis fora da seleção — NÃO serão movidos (evita ref cross-tenant).`)

  // Snapshot dos contatos movíveis (para rollback) ANTES de alterar.
  const movableOwners = movableOwnerIds.length
    ? await prisma.contact.findMany({ where: { id: { in: movableOwnerIds } }, select: { id: true, companyId: true } })
    : []

  if (DRY_RUN || !targetCompanyId || !targetUserId) {
    log('   [dry] NÃO gravou (dry-run ou destino ainda não materializado). Rode com DRY_RUN=false para aplicar.')
    return { moved: ids, movedOwners: movableOwners, sharedOwners }
  }

  // Aplica em lotes (evita transação gigante/locks longos).
  let done = 0
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE).map(p => p.id)
    await prisma.property.updateMany({
      where: { id: { in: batch } },
      data: { companyId: targetCompanyId, userId: targetUserId },
    })
    done += batch.length
    log(`   ...movidos ${done}/${ids.length}`)
  }
  // Move os contatos-proprietários (só os NÃO compartilhados) para a company Lemos.
  if (movableOwnerIds.length > 0) {
    await prisma.contact.updateMany({ where: { id: { in: movableOwnerIds } }, data: { companyId: targetCompanyId } })
  }
  return { moved: ids, movedOwners: movableOwners, sharedOwners }
}

// Retorna os valores que aparecem mais de uma vez em `arr`.
function firstDuplicates(arr: string[]): string[] {
  const seen = new Set<string>(); const dup = new Set<string>()
  for (const v of arr) { if (seen.has(v)) dup.add(v); else seen.add(v) }
  return [...dup]
}

// Reporta (sem mover) dados operacionais que referenciam os imóveis movidos.
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

// ── Revogação de sessões (força novo login após mudança de role/empresa) ────
async function revokeSessions(userIds: string[]) {
  if (userIds.length === 0 || DRY_RUN) { if (DRY_RUN) log('\n• [dry] revogaria sessões/refresh tokens dos usuários provisionados'); return }
  const s = await prisma.session.deleteMany({ where: { userId: { in: userIds } } }).catch(() => ({ count: 0 }))
  const r = await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } }).catch(() => ({ count: 0 }))
  log(`\n🔒 Sessões revogadas: ${s.count} | refresh tokens: ${r.count}`)
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  preflight()

  // Confirma que o super-admin da plataforma existe (aviso, não bloqueia).
  const superAdmin = await prisma.user.findUnique({ where: { email: PLATFORM_SUPERADMIN_EMAIL }, select: { id: true, role: true } })
  if (!superAdmin) log(`⚠️  Aviso: super-admin da plataforma (${PLATFORM_SUPERADMIN_EMAIL}) não encontrado.`)
  else if (superAdmin.role !== 'SUPER_ADMIN') log(`⚠️  Aviso: ${PLATFORM_SUPERADMIN_EMAIL} existe mas não é SUPER_ADMIN (será corrigido no boot da API).`)

  // Detecta conflito: emails duplicados (idempotência por email).
  for (const u of [...ADMINS, ...BROKERS]) {
    const dupes = await prisma.user.count({ where: { email: norm(u.email) } })
    if (dupes > 1) abort(`Mais de um usuário com email ${u.email} — resolva a duplicidade antes.`)
  }

  // 1) Plano fundador
  const plan = await ensureFundadorPlan()
  if (!DRY_RUN && !plan) abort('Falha ao garantir plano fundador.')

  // 2) Company
  const company = await ensureCompany()
  const companyId = company?.id ?? null
  if (!DRY_RUN && !companyId) abort('Falha ao garantir Company Lemos.')

  // creds acumula as senhas geradas (individuais) — impressas UMA vez ao final.
  const creds: { email: string; password: string }[] = []

  // 3) Proprietário principal PRIMEIRO (resolve dependência circular do tenant)
  const mainAdmin = ADMINS.find(a => norm(a.email) === MAIN_ADMIN_EMAIL)!
  const mainRep = await upsertUser(mainAdmin, 'ADMIN', companyId, creds)
  const mainUserId = mainRep.id

  // 4) Tenant (ownerId = proprietário principal)
  await ensureTenant(companyId, mainUserId)

  // 5) Demais usuários
  const userReports: any[] = [mainRep]
  for (const a of ADMINS) {
    if (norm(a.email) === MAIN_ADMIN_EMAIL) continue
    userReports.push(await upsertUser(a, 'ADMIN', companyId, creds))
  }
  for (const b of BROKERS) userReports.push(await upsertUser(b, 'BROKER', companyId, creds))
  log(`\n👥 Usuários provisionados: ${userReports.length} (${ADMINS.length} admins + ${BROKERS.length} corretores)`)

  // 6/7) Imóveis + proprietários vinculados
  let propReport: { moved: any[]; movedOwners: { id: string; companyId: string }[]; sharedOwners: string[] } = { moved: [], movedOwners: [], sharedOwners: [] }
  const where = await buildPropertyWhere()
  if (where) {
    // Seleciona e reporta sempre (mesmo em dry-run, quando a company ainda não existe);
    // só grava quando !DRY_RUN e os destinos estão materializados.
    propReport = await migrateProperties(where, companyId, mainUserId)
    await reportRelatedData(propReport.moved.map((p: any) => p.id), SOURCE_COMPANY_ID || null)
  } else if (!SKIP_PROPERTIES && !SOURCE_MODE) {
    log('\nℹ️  SOURCE_MODE não definido — imóveis NÃO foram tocados. Defina SOURCE_MODE para reatribuir.')
  }

  // 8) Revogar sessões dos usuários provisionados (inclui o gmail que perde SUPER_ADMIN)
  const provisionedIds = userReports.map(r => r.id).filter(Boolean) as string[]
  await revokeSessions(provisionedIds)

  // 9) Rollback file (antes→depois) — NÃO contém senhas.
  const rollback = {
    dryRun: DRY_RUN,
    sourceMode: SOURCE_MODE, sourceCompanyId: SOURCE_COMPANY_ID || null, sourceUserEmail: SOURCE_USER_EMAIL || null,
    targetCompanyId: companyId,
    // usuários movidos/criados: email, ação, empresa e papel ANTERIORES
    users: userReports,
    // imóveis: id + empresa/usuário ANTERIORES
    properties: propReport.moved.map((p: any) => ({ id: p.id, oldCompanyId: p.companyId, oldUserId: p.userId })),
    // contatos-proprietários alterados: id + empresa ANTERIOR
    contactsMoved: propReport.movedOwners.map(c => ({ id: c.id, oldCompanyId: c.companyId })),
    sharedOwnersKept: propReport.sharedOwners,
  }
  // DRY_RUN não grava NADA — nem o snapshot. Só a execução real gera o arquivo.
  if (DRY_RUN) {
    log('\n• [dry] snapshot/rollback NÃO gravado (dry-run não escreve nada em disco).')
  } else {
    try {
      const dir = join(process.cwd(), '.migration-runs')
      mkdirSync(dir, { recursive: true })
      // timestamp injetado por env p/ evitar Date.now() não-determinístico em alguns runners
      const stamp = process.env.RUN_STAMP || String(process.hrtime.bigint())
      const file = join(dir, `lemos-provision-${stamp}.json`)
      writeFileSync(file, JSON.stringify(rollback, null, 2))
      log(`\n🗂️  Rollback/snapshot salvo em: ${file}`)
    } catch (e) {
      log('⚠️  Não foi possível gravar o arquivo de rollback:', (e as Error).message)
    }
  }

  // Credenciais individuais — impressas UMA ÚNICA VEZ aqui (nunca no snapshot).
  if (!DRY_RUN && creds.length > 0) {
    log('\n' + '═'.repeat(70))
    log('🔑 SENHAS PROVISÓRIAS INDIVIDUAIS (copie AGORA — não serão exibidas de novo)')
    log('   Entregue cada uma ao respectivo usuário por canal seguro. Todos terão de')
    log('   trocar a senha no primeiro acesso (mustChangePassword).')
    log('─'.repeat(70))
    for (const c of creds) log(`   ${c.email.padEnd(38)} ${c.password}`)
    log('═'.repeat(70))
  }

  log(`\n${DRY_RUN ? '🔍 DRY-RUN concluído (nada foi gravado).' : '✅ Provisionamento concluído.'}`)
  if (DRY_RUN) log('   Revise os números acima e rode com DRY_RUN=false CONFIRM_PRODUCTION_MIGRATION=IMOBILIARIA_LEMOS para aplicar.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
