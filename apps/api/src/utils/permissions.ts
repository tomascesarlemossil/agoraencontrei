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

/**
 * preHandler que exige SUPER_ADMIN (super-admin da PLATAFORMA AgoraEncontrei).
 * Use nas rotas exclusivas de plataforma (master, tenants, afiliados, repasses,
 * saas-finance, system-events, outgoing-webhooks, outbound). Espelha o padrão
 * de `routes/master/index.ts` (403 + auditLog `admin.access_denied`).
 *
 * IMPORTANTE: assume que `app.authenticate` já rodou antes (req.user populado).
 */
export function requireSuperAdmin() {
  return async function superAdminGuard(req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).user
    if (!user) return reply.status(401).send({ error: 'UNAUTHORIZED' })
    if (user.role !== 'SUPER_ADMIN') {
      const prisma = (req.server as any).prisma
      await prisma?.auditLog
        ?.create({
          data: {
            companyId: 'platform',
            userId: user.sub ?? 'unknown',
            action: 'admin.access_denied' as any,
            resource: 'platform',
            resourceId: req.url,
            payload: { role: user.role, method: req.method, url: req.url, ip: req.ip } as any,
          },
        })
        .catch(() => {})
      return reply
        .status(403)
        .send({ error: 'FORBIDDEN', message: 'SUPER_ADMIN access required' })
    }
  }
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
