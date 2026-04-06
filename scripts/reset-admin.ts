/**
 * Script para resetar o role do Tomás para SUPER_ADMIN
 * Uso: DATABASE_URL="..." npx tsx scripts/reset-admin.ts
 */
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const email = 'tomas@agoraencontrei.com.br'

  // Buscar usuário
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.log(`❌ Usuário ${email} não encontrado.`)

    // Listar todos os usuários
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, status: true },
      take: 20,
    })
    console.log('\nUsuários existentes:')
    allUsers.forEach(u => console.log(`  ${u.email} — ${u.role} — ${u.status}`))
    return
  }

  console.log(`Encontrado: ${user.name} (${user.email})`)
  console.log(`  Role atual: ${user.role}`)
  console.log(`  Status atual: ${user.status}`)

  // Resetar para SUPER_ADMIN e ACTIVE
  await prisma.user.update({
    where: { email },
    data: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  })

  console.log(`\n✅ ${user.name} atualizado para SUPER_ADMIN + ACTIVE`)

  // Se quiser resetar a senha, descomentar:
  // const newPassword = 'AgoraEncontrei2026!'
  // const bcrypt = await import('bcryptjs')
  // const hash = await bcrypt.hash(newPassword, 10)
  // await prisma.user.update({ where: { email }, data: { passwordHash: hash } })
  // console.log(`🔑 Senha resetada para: ${newPassword}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
