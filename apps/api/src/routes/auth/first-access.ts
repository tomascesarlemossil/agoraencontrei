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
  // POST /esqueci-senha { identifier } — solicita link de redefinição de senha.
  // Aceita e-mail, CPF/CNPJ (via Specialist/Client) ou telefone. Por segurança,
  // NUNCA revela se existe uma conta: sempre responde 200 com mensagem genérica.
  app.post('/esqueci-senha', {
    schema: { tags: ['auth'], summary: 'Solicita link de redefinição de senha (e-mail/WhatsApp)' },
  }, async (req, reply) => {
    const GENERIC = {
      success: true,
      message: 'Se houver uma conta com esses dados, enviamos o link de redefinição por e-mail e WhatsApp.',
    }

    try {
      const identifier = String((req.body as any)?.identifier ?? '').trim()
      if (!identifier) return reply.send(GENERIC)

      const prisma = app.prisma as any
      let user: any = null

      if (identifier.includes('@')) {
        // E-mail (case-insensitive)
        const email = identifier.toLowerCase()
        user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
        }).catch(() => null)
      } else {
        const digits = identifier.replace(/\D/g, '')

        if (digits.length === 11 || digits.length === 14) {
          // CPF (11) ou CNPJ (14) — buscar o e-mail associado em Specialist/Client.
          let email: string | null = null

          const specialist = await prisma.specialist.findFirst({
            where: { cpfCnpj: digits },
          }).catch(() => null)
          if (specialist?.email) email = specialist.email

          if (!email) {
            // Client armazena o documento no campo `document`.
            const client = await prisma.client.findFirst({
              where: { document: digits, email: { not: null } },
            }).catch(() => null)
            if (client?.email) email = client.email
          }

          if (email) {
            user = await prisma.user.findFirst({
              where: { email: { equals: email.toLowerCase(), mode: 'insensitive' } },
            }).catch(() => null)
          }
        }

        // Telefone: 10 ou 11 dígitos (sem DDI). Compara apenas dígitos do phone.
        if (!user && (digits.length === 10 || digits.length === 11)) {
          const candidates = await prisma.user.findMany({
            where: { phone: { not: null } },
            select: { id: true, email: true, phone: true },
          }).catch(() => [])
          user = candidates.find((u: any) => (u.phone || '').replace(/\D/g, '').endsWith(digits)) || null
        }
      }

      if (!user?.email) return reply.send(GENERIC)

      // Gera token e monta o link para a página web de definição de senha.
      const token = await createPasswordSetupToken(prisma, user.email).catch(() => null)
      if (!token) return reply.send(GENERIC)

      const base = process.env.WEB_URL || 'https://agoraencontrei.com.br'
      const link = `${base}/definir-senha?token=${token}`

      // E-mail (best-effort)
      try {
        const { sendEmail, isEmailConfigured } = await import('../../services/email.service.js')
        if (isEmailConfigured()) {
          const html = `
            <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f8f6f1;color:#1B2B5B">
              <h1 style="color:#1B2B5B;margin:0 0 8px">Redefinição de senha</h1>
              <p style="margin:0 0 16px;color:#475569">Recebemos um pedido para redefinir a senha da sua conta no AgoraEncontrei.</p>
              <div style="text-align:center;margin:24px 0">
                <a href="${link}" style="display:inline-block;background:#C9A84C;color:#1B2B5B;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none">Definir nova senha →</a>
              </div>
              <p style="margin:16px 0;color:#475569">Ou copie e cole este link no navegador:</p>
              <p style="margin:0 0 16px;word-break:break-all"><a href="${link}" style="color:#C9A84C">${link}</a></p>
              <p style="margin:16px 0;color:#475569">O link expira em 7 dias. Se não foi você que solicitou, ignore este e-mail — sua senha continua a mesma.</p>
            </div>`
          await sendEmail({
            to: user.email,
            subject: 'Redefinição de senha — AgoraEncontrei',
            html,
          })
        }
      } catch (e: any) {
        app.log.error({ err: e }, '[esqueci-senha] email failed')
      }

      // WhatsApp (best-effort)
      if (user.phone) {
        try {
          const { sendWhatsappText } = await import('../../services/whatsapp-notify.service.js')
          const msg =
            `🔒 *AgoraEncontrei — Redefinição de senha*\n\n` +
            `Recebemos um pedido para redefinir a senha da sua conta.\n\n` +
            `*Defina uma nova senha:*\n${link}\n\n` +
            `(o link expira em 7 dias)\n\n` +
            `Se não foi você, ignore esta mensagem.`
          await sendWhatsappText(user.phone, msg)
        } catch (e: any) {
          app.log.error({ err: e }, '[esqueci-senha] whatsapp failed')
        }
      }

      return reply.send(GENERIC)
    } catch (e: any) {
      // Nunca vaza erro — resposta genérica sempre.
      app.log.error({ err: e }, '[esqueci-senha] unexpected error')
      return reply.send(GENERIC)
    }
  })

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
