/**
 * Seed — Ligia Giani Imóveis (parceira de demonstração)
 *
 * Popula o sistema real com:
 *   - Company  "Ligia Giani Imóveis"
 *   - User     parceira (login: ligiagiani@agoraencontrei.com.br / senha: muitasvendas)
 *   - Tenant   ligiagiani.agoraencontrei.com.br (tema luxury_gold, plano PRO)
 *   - 11 imóveis reais (com fotos) do acervo atual da corretora
 *
 * Idempotente: pode ser rodado várias vezes.
 *
 *   pnpm --filter @agoraencontrei/database seed:ligia
 *   # ou na raiz:  pnpm db:seed:ligia
 *
 * Os dados de imóveis são compartilhados com a página de apresentação
 * (apps/web/src/lib/demo/ligia-giani-data.ts) — fonte única de verdade.
 */

import { PrismaClient } from '../generated/client/index.js'
import * as argon2 from 'argon2'
import { LIGIA_COMPANY, LIGIA_PROPERTIES } from '../../../apps/web/src/lib/demo/ligia-giani-data'

const prisma = new PrismaClient()

const IMPORT_SOURCE = 'ligiagiani_demo'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  console.log('🌱 Seed Ligia Giani Imóveis...')
  const c = LIGIA_COMPANY

  // ── Company ──────────────────────────────────────────────────────────────
  let company = await prisma.company.findFirst({ where: { name: c.name } })
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: c.name,
        tradeName: c.tradeName,
        creci: c.creci,
        phone: c.phone,
        email: c.email,
        website: c.website,
        city: c.city,
        state: c.state,
        zipCode: c.zipCode,
        plan: 'professional',
        settings: {
          isTenant: true,
          layoutType: c.tenant.theme,
          primaryColor: '#fbbf24',
          instagram: c.instagram,
          facebook: c.facebook,
          address: c.address,
          agent: c.agent,
        },
        isActive: true,
      },
    })
  }
  console.log('✅ Company:', company.name, company.id)

  // ── Usuário parceira (admin da empresa) ──────────────────────────────────
  const passwordHash = await argon2.hash(c.tenant.password, { type: argon2.argon2id })
  const user = await prisma.user.upsert({
    where: { email: c.tenant.login },
    update: { companyId: company.id, status: 'ACTIVE', passwordHash },
    create: {
      companyId: company.id,
      name: c.agent,
      email: c.tenant.login,
      phone: c.phone,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      creciNumber: c.creci,
      emailVerifiedAt: new Date(),
    },
  })
  console.log('✅ Parceira:', user.email, '/ senha:', c.tenant.password)

  // ── Tenant (site) ────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: c.tenant.subdomain },
    update: {
      name: c.name,
      companyId: company.id,
      ownerId: user.id,
      layoutType: c.tenant.theme,
      primaryColor: '#fbbf24',
      plan: c.tenant.plan,
      planStatus: 'ACTIVE',
      isActive: true,
    },
    create: {
      name: c.name,
      subdomain: c.tenant.subdomain,
      domainType: 'subdomain',
      layoutType: c.tenant.theme,
      primaryColor: '#fbbf24',
      plan: c.tenant.plan,
      planStatus: 'ACTIVE',
      companyId: company.id,
      ownerId: user.id,
      activatedAt: new Date(),
      settings: {
        agent: c.agent,
        creci: c.creci,
        phone: c.phone,
        whatsapp: c.whatsapp,
        email: c.email,
        address: c.address,
        about: c.about,
        instagram: c.instagram,
        facebook: c.facebook,
      },
    },
  })
  console.log('✅ Tenant:', `${tenant.subdomain}.agoraencontrei.com.br`)

  // ── Imóveis (idempotente) ─────────────────────────────────────────────────
  const removed = await prisma.property.deleteMany({
    where: { companyId: company.id, importSource: IMPORT_SOURCE },
  })
  if (removed.count) console.log(`   ↻ ${removed.count} imóveis antigos removidos`)

  for (const p of LIGIA_PROPERTIES) {
    await prisma.property.create({
      data: {
        companyId: company.id,
        userId: user.id,
        reference: p.reference,
        title: p.title,
        slug: `${slugify(p.title)}-${p.reference.toLowerCase()}`,
        description: p.description,
        type: p.type,
        purpose: 'SALE',
        category: 'RESIDENTIAL',
        status: 'ACTIVE',
        price: p.price ?? null,
        valueUnderConsultation: p.price == null,
        condoFee: p.condoFee ?? null,
        city: p.city,
        state: p.state,
        neighborhood: p.neighborhood,
        condoName: p.condoName ?? null,
        bedrooms: p.bedrooms,
        suites: p.suites,
        bathrooms: p.bathrooms,
        parkingSpaces: p.parkingSpaces,
        totalArea: p.area,
        coverImage: p.images[0],
        images: p.images,
        features: p.features,
        authorizedPublish: true,
        isFeatured: !!p.isFeatured,
        publishedAt: new Date(),
        importSource: IMPORT_SOURCE,
        importedAt: new Date(),
      },
    })
  }
  console.log(`✅ ${LIGIA_PROPERTIES.length} imóveis criados`)

  console.log('\n🎉 Seed Ligia Giani completo!')
  console.log(`   Site:  https://${tenant.subdomain}.agoraencontrei.com.br`)
  console.log(`   Login: ${user.email} / ${c.tenant.password}`)
  console.log(`   Demo:  /apresentacao/ligia-giani`)
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
