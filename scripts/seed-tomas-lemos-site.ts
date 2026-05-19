/**
 * Seed — Site parceiro "Tomás Lemos Imóveis"
 * ------------------------------------------------------------------
 * Cria, de forma idempotente, um tenant parceiro COMPLETO que serve de
 * site-modelo para a criação automática de sites do AgoraEncontrei:
 *
 *   • Company  "Tomás Lemos Imóveis"   (CRECI 279051-F)
 *   • User     parceiro ADMIN          (separado do admin da plataforma)
 *   • Tenant   subdomínio "tomas-lemos" — tema Signature Estate
 *   • Reatribui ao novo site todos os imóveis de CAPTAÇÃO DO TOMÁS
 *     (imóveis cujo dono atual é o usuário tomas@agoraencontrei.com.br)
 *
 * Como rodar (na máquina/CI que enxerga o banco de PRODUÇÃO):
 *
 *   # 1. Pré-visualizar sem gravar nada
 *   DRY_RUN=1 npx tsx scripts/seed-tomas-lemos-site.ts
 *
 *   # 2. Executar de verdade
 *   npx tsx scripts/seed-tomas-lemos-site.ts
 *
 * Variáveis de ambiente opcionais:
 *   DATABASE_URL        — conexão Postgres (obrigatória)
 *   DRY_RUN=1           — só mostra o que faria, não grava
 *   PARTNER_EMAIL       — e-mail de login do parceiro (default abaixo)
 *   PARTNER_PASSWORD    — senha do parceiro (obrigatória ao criar o usuário)
 *   TOMAS_SOURCE_EMAIL  — dono atual dos imóveis de captação
 *                         (default: tomas@agoraencontrei.com.br)
 *   SKIP_PROPERTIES=1   — não reatribui imóveis (só cria o site)
 *
 * O script NUNCA sobrescreve dados existentes: se o tenant já existe ele
 * apenas completa o que falta. Pode ser rodado quantas vezes quiser.
 */

import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'
const SKIP_PROPERTIES = process.env.SKIP_PROPERTIES === '1'
const PARTNER_EMAIL = (process.env.PARTNER_EMAIL || 'contato@tomaslemos.agoraencontrei.com.br').toLowerCase().trim()
const PARTNER_PASSWORD = process.env.PARTNER_PASSWORD || ''
const TOMAS_SOURCE_EMAIL = (process.env.TOMAS_SOURCE_EMAIL || 'tomas@agoraencontrei.com.br').toLowerCase().trim()

// ── Identidade visual & dados do parceiro ──────────────────────────────
const IDENTITY = {
  companyName: 'Tomás Lemos Imóveis',
  tradeName: 'Tomás Lemos Imóveis',
  creci: '279051-F',
  phoneFixo: '(16) 3723-0045',
  phoneCelular: '(16) 99311-6199',
  city: 'Franca',
  state: 'SP',
  subdomain: 'tomas-lemos',
  theme: 'signature_estate',
  primaryColor: '#9a7b4f',
  logoUrl: '/tenants/tomas-lemos-logo.svg',
  niche: 'imobiliaria',
  ownerName: 'Tomás Lemos',
  tagline: 'Curadoria imobiliária de alto padrão em Franca e região',
}

function log(msg: string) {
  console.log(`${DRY_RUN ? '[DRY-RUN] ' : ''}${msg}`)
}

async function main() {
  console.log('─'.repeat(64))
  console.log(`🏛  Seed — Site parceiro "${IDENTITY.companyName}"`)
  console.log(`   modo: ${DRY_RUN ? 'PRÉ-VISUALIZAÇÃO (nada será gravado)' : 'EXECUÇÃO REAL'}`)
  console.log('─'.repeat(64))

  // ── 1. Tenant já existe? ─────────────────────────────────────────────
  const existingTenant = await prisma.tenant.findUnique({
    where: { subdomain: IDENTITY.subdomain },
  })

  let companyId = existingTenant?.companyId ?? null
  let ownerId = existingTenant?.ownerId ?? null

  // ── 2. Company ───────────────────────────────────────────────────────
  if (companyId) {
    log(`✔ Company já existe (${companyId}) — reaproveitando.`)
  } else {
    log(`→ Criando Company "${IDENTITY.companyName}"...`)
    if (!DRY_RUN) {
      const company = await prisma.company.create({
        data: {
          name: IDENTITY.companyName,
          tradeName: IDENTITY.tradeName,
          creci: IDENTITY.creci,
          phone: IDENTITY.phoneFixo,
          email: PARTNER_EMAIL,
          logoUrl: IDENTITY.logoUrl,
          city: IDENTITY.city,
          state: IDENTITY.state,
          plan: 'enterprise',
          isActive: true,
          settings: {
            isTenant: true,
            layoutType: IDENTITY.theme,
            primaryColor: IDENTITY.primaryColor,
            nicheSlug: IDENTITY.niche,
            subdomain: IDENTITY.subdomain,
            isModelSite: true,
          },
        },
      })
      companyId = company.id
    }
    log(`  ✔ Company criada.`)
  }

  // ── 3. User parceiro (ADMIN, separado do admin da plataforma) ────────
  const existingUser = await prisma.user.findUnique({ where: { email: PARTNER_EMAIL } })
  let userCreated = false

  if (existingUser) {
    ownerId = existingUser.id
    log(`✔ Usuário parceiro já existe (${PARTNER_EMAIL}) — reaproveitando.`)
  } else {
    // A senha NUNCA é gerada/logada pelo script — o operador a define via
    // env PARTNER_PASSWORD e já a conhece, evitando vazá-la em logs.
    if (!PARTNER_PASSWORD && !DRY_RUN) {
      console.error('❌ Defina a variável PARTNER_PASSWORD para criar o usuário parceiro.')
      console.error('   Ex.: PARTNER_PASSWORD=\'SuaSenhaForte\' npx tsx scripts/seed-tomas-lemos-site.ts')
      process.exit(1)
    }
    userCreated = true
    log(`→ Criando usuário parceiro ADMIN "${PARTNER_EMAIL}"...`)
    if (!DRY_RUN && companyId) {
      const passwordHash = await argon2.hash(PARTNER_PASSWORD, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
      })
      const user = await prisma.user.create({
        data: {
          companyId,
          name: IDENTITY.ownerName,
          email: PARTNER_EMAIL,
          phone: IDENTITY.phoneCelular,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          creciNumber: IDENTITY.creci,
          bio: `${IDENTITY.ownerName} — ${IDENTITY.tagline}. CRECI ${IDENTITY.creci}.`,
          emailVerifiedAt: new Date(),
        },
      })
      ownerId = user.id
    }
    log(`  ✔ Usuário parceiro criado.`)
  }

  // ── 4. Tenant ────────────────────────────────────────────────────────
  if (existingTenant) {
    log(`✔ Tenant "${IDENTITY.subdomain}" já existe — garantindo configuração.`)
    if (!DRY_RUN) {
      await prisma.tenant.update({
        where: { id: existingTenant.id },
        data: {
          layoutType: IDENTITY.theme,
          primaryColor: IDENTITY.primaryColor,
          logoUrl: IDENTITY.logoUrl,
          isActive: true,
        },
      })
    }
  } else {
    log(`→ Criando Tenant subdomínio "${IDENTITY.subdomain}" (tema ${IDENTITY.theme})...`)
    if (!DRY_RUN && companyId && ownerId) {
      await prisma.tenant.create({
        data: {
          name: IDENTITY.companyName,
          subdomain: IDENTITY.subdomain,
          companyId,
          ownerId,
          layoutType: IDENTITY.theme,
          primaryColor: IDENTITY.primaryColor,
          logoUrl: IDENTITY.logoUrl,
          plan: 'ENTERPRISE',
          planStatus: 'ACTIVE',
          isActive: true,
          activatedAt: new Date(),
          settings: {
            nicheSlug: IDENTITY.niche,
            isModelSite: true,
            tagline: IDENTITY.tagline,
            identity: {
              creci: IDENTITY.creci,
              phoneFixo: IDENTITY.phoneFixo,
              phoneCelular: IDENTITY.phoneCelular,
              whatsapp: IDENTITY.phoneCelular,
              city: IDENTITY.city,
              state: IDENTITY.state,
              owner: IDENTITY.ownerName,
            },
          },
        },
      })
    }
    log(`  ✔ Tenant criado.`)
  }

  // ── 5. Reatribuir imóveis de captação do Tomás ───────────────────────
  if (SKIP_PROPERTIES) {
    log('⏭  Reatribuição de imóveis pulada (SKIP_PROPERTIES=1).')
  } else {
    const sourceUser = await prisma.user.findUnique({ where: { email: TOMAS_SOURCE_EMAIL } })
    if (!sourceUser) {
      log(`⚠ Usuário de origem "${TOMAS_SOURCE_EMAIL}" não encontrado — nenhum imóvel reatribuído.`)
    } else if (companyId && ownerId) {
      const props = await prisma.property.findMany({
        where: { userId: sourceUser.id },
        select: { id: true, title: true, reference: true },
      })
      log(`→ ${props.length} imóvel(is) de captação do Tomás encontrados.`)
      if (props.length > 0 && !DRY_RUN) {
        const result = await prisma.property.updateMany({
          where: { userId: sourceUser.id },
          data: { companyId, userId: ownerId, authorizedPublish: true },
        })
        log(`  ✔ ${result.count} imóvel(is) vinculado(s) ao site Tomás Lemos e autorizado(s) a publicar.`)
      } else if (props.length > 0) {
        props.slice(0, 10).forEach(p => log(`    • ${p.reference || p.id} — ${p.title}`))
        if (props.length > 10) log(`    … e mais ${props.length - 10}.`)
      }
    }
  }

  // ── Resumo ───────────────────────────────────────────────────────────
  console.log('─'.repeat(64))
  console.log('✅ Concluído.')
  console.log(`   Site:        https://${IDENTITY.subdomain}.agoraencontrei.com.br`)
  console.log(`   Login:       ${PARTNER_EMAIL}`)
  console.log(`   Senha:       ${userCreated ? 'a definida em PARTNER_PASSWORD' : '(usuário já existia — senha inalterada)'}`)
  console.log(`   CRECI:       ${IDENTITY.creci}`)
  console.log(`   Tema:        ${IDENTITY.theme} (Signature Estate)`)
  if (DRY_RUN) console.log('\n   ⚠ Isto foi uma PRÉ-VISUALIZAÇÃO. Rode sem DRY_RUN para gravar.')
  console.log('─'.repeat(64))
}

main()
  .catch(e => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
