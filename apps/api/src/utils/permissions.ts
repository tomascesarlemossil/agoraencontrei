/**
 * Permissões granulares por módulo (complementa UserRole).
 *
 * Modelo "opt-in progressivo":
 *   • SUPER_ADMIN / ADMIN / MANAGER → acesso total (bypass).
 *   • Usuário SEM nenhuma permissão cadastrada → liberado (mantém o
 *     comportamento atual; permissões só passam a valer quando configuradas).
 *   • Usuário COM permissões cadastradas → exige a flag do módulo/ação;
 *     ausência da linha do módulo ou flag falsa → 403.
 */

import type { FastifyReply, FastifyRequest } from 'fastify'

export type PermAction = 'view' | 'edit' | 'delete'

const BYPASS_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MANAGER'])

const FIELD: Record<PermAction, 'canView' | 'canEdit' | 'canDelete'> = {
  view: 'canView',
  edit: 'canEdit',
  delete: 'canDelete',
}

export function requirePermission(module: string, action: PermAction) {
  return async function permissionGuard(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' })
    if (BYPASS_ROLES.has(user.role)) return

    const prisma = (req.server as any).prisma
    const perms = await prisma.userModulePermission.findMany({
      where: { userId: user.sub },
      select: { module: true, canView: true, canEdit: true, canDelete: true },
    })
    // Sem permissões cadastradas → não há enforcement (opt-in).
    if (!perms || perms.length === 0) return

    const p = perms.find((x: any) => x.module === module)
    if (!p || !p[FIELD[action]]) {
      return reply.status(403).send({ error: 'FORBIDDEN', module, action })
    }
  }
}
