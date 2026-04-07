/**
 * Reset Tomas password to Lemos2026 (argon2id)
 * Run: npx tsx scripts/reset-tomas-password.ts
 */
import * as argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'tomas@agoraencontrei.com.br'
  const newPassword = 'Lemos2026'

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`❌ User not found: ${email}`)
    process.exit(1)
  }

  const passwordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
  })

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  })

  console.log(`✅ Password reset for ${email}`)
  console.log(`   New password: ${newPassword}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
