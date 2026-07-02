import type { FastifyRequest, FastifyReply } from 'fastify'
import { randomBytes } from 'node:crypto'
import { safeStringEqual } from '../../utils/crypto-safe.js'

/**
 * Autorização do painel do especialista.
 *
 * O especialista NÃO usa a senha/JWT da plataforma. Ele acessa os próprios
 * dados via magic-link: um `accessToken` (rotacionável) entregue por e-mail
 * e WhatsApp. Esta função libera o acesso quando UMA das condições vale:
 *
 *  1. a requisição traz `?token=` que bate (comparação constante) com o
 *     `accessToken` salvo do especialista; OU
 *  2. o chamador é um usuário autenticado da plataforma com papel
 *     ADMIN / SUPER_ADMIN / MANAGER (suporte/moderação).
 *
 * Em caso de negação, envia a resposta (401/403) e retorna `false`; o
 * handler deve apenas `return` sem enviar nada.
 */
export async function specialistTokenOrAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
  storedToken: string | null | undefined,
): Promise<boolean> {
  const token = (req.query as any)?.token as string | undefined
  if (token && safeStringEqual(String(token), storedToken ?? null)) {
    return true
  }

  // Sem token válido — tenta autenticar como admin da plataforma.
  try {
    await (req as any).jwtVerify()
  } catch {
    reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Link de acesso inválido/expirado. Solicite um novo link ou faça login.',
    })
    return false
  }

  const role = (req as any).user?.role
  if (['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
    return true
  }

  reply.status(403).send({ error: 'FORBIDDEN' })
  return false
}

/**
 * Gera um novo token de acesso opaco (32 bytes → 64 hex chars). Rotaciona a
 * cada pedido de link, invalidando links antigos.
 */
export function generateSpecialistAccessToken(): string {
  return randomBytes(32).toString('hex')
}
