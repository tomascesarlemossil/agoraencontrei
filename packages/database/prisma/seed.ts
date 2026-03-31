import { PrismaClient } from '../generated/client/index.js'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Imobiliária Lemos
  const company = await prisma.company.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'Imobiliária Lemos',
      tradeName: 'Lemos Imóveis',
      cnpj: '00.000.000/0001-00',
      creci: '12345-J',
      phone: '(16) 3723-0045',
      email: 'contato@imobiliarialemos.com.br',
      website: 'https://www.agoraencontrei.com.br',
      city: 'Franca',
      state: 'SP',
      plan: 'professional',
    },
  })

  console.log('✅ Company:', company.name)

  // Create admin user
  const passwordHash = await argon2.hash('Lemos2024', { type: argon2.argon2id })

  const admin = await prisma.user.upsert({
    where: { email: 'tomas@agoraencontrei.com.br' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Tomás César Lemos Silva',
      email: 'tomas@agoraencontrei.com.br',
      phone: '(16) 98101-0004',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  })

  console.log('✅ Admin:', admin.email)

  // Create sample broker
  const broker = await prisma.user.upsert({
    where: { email: 'corretor@imobiliarialemos.com.br' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Corretor Lemos',
      email: 'corretor@imobiliarialemos.com.br',
      passwordHash: await argon2.hash('corretor123', { type: argon2.argon2id }),
      role: 'BROKER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  })

  console.log('✅ Broker:', broker.email)
  console.log('\n🎉 Seed complete!')
  console.log('  Admin login:  tomas@agoraencontrei.com.br / Lemos2024')
  console.log('  Broker login: corretor@imobiliarialemos.com.br / corretor123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
