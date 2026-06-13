import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import argon2 from 'argon2'

/**
 * Fluxo de definição de senha por token (1º acesso / esqueci a senha),
 * reusando o model PasswordReset — sem migração nova.
 *
 * Substitui o envio de senha em texto puro por e-mail/WhatsApp: agora o
 * parceiro recebe um link com token e define a própria senha.
 */

/** Cria um token de definição de senha e retorna o token cru (vai no link). */
export async function createPasswordSetupToken(prisma: any, email: string, ttlDays = 7): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)
  await prisma.passwordReset.create({
    data: { email: email.toLowerCase().trim(), token, expiresAt },
  })
  return token
}

export default async function firstAccessRoutes(app: FastifyInstance) {
  // GET /definir-senha/validar?token= — valida o token (para a UX do frontend)
  app.get('/definir-senha/validar', {
    schema: { tags: ['auth'], summary: 'Valida um token de definição de senha' },
  }, async (req, reply) => {
    const token = String((req.query as any)?.token ?? '')
    if (!token) return reply.send({ valid: false })
    const pr = await app.prisma.passwordReset.findUnique({ where: { token } }).catch(() => null)
    if (!pr || pr.usedAt || pr.expiresAt < new Date()) return reply.send({ valid: false })
    return reply.send({ valid: true, email: pr.email })
  })

  // POST /definir-senha { token, password } — define a senha e queima o token
  app.post('/definir-senha', {
    schema: { tags: ['auth'], summary: 'Define a senha via token de 1º acesso' },
  }, async (req, reply) => {
    const body = z.object({
      token: z.string().min(16),
      password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
    }).parse(req.body)

    const pr = await app.prisma.passwordReset.findUnique({ where: { token: body.token } }).catch(() => null)
    if (!pr || pr.usedAt || pr.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'TOKEN_INVALIDO', message: 'Link inválido ou expirado. Solicite um novo.' })
    }

    const user = await app.prisma.user.findFirst({ where: { email: pr.email } })
    if (!user) return reply.status(404).send({ error: 'USER_NOT_FOUND', message: 'Usuário não encontrado.' })

    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id })

    // Define a senha, queima o token e derruba sessões antigas (refresh tokens).
    await app.prisma.$transaction([
      app.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      app.prisma.passwordReset.update({ where: { id: pr.id }, data: { usedAt: new Date() } }),
      app.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ])

    return reply.send({ success: true })
  })
}
