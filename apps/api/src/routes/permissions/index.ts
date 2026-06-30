/**
 * Permissions Routes — Permissões granulares por módulo (Uniloc U_MODULO*)
 *
 *   GET  /api/v1/permissions/users/:userId  — permissões de um usuário
 *   PUT  /api/v1/permissions/users/:userId  — substitui as permissões do usuário
 *   GET  /api/v1/permissions/modules         — módulos disponíveis
 *
 * Apenas ADMIN/SUPER_ADMIN podem gerenciar permissões.
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

/** Módulos conhecidos do sistema (para a UI de permissões). */
export const MODULES = [
  'properties', 'contracts', 'clients', 'leads', 'finance', 'payables',
  'repasse', 'rescission', 'agreements', 'reconciliation', 'notices',
  'reports', 'settings', 'users',
] as const

export default async function permissionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)
  const db = () => app.prisma as any

  function isAdmin(role: string) {
    return role === 'SUPER_ADMIN' || role === 'ADMIN'
  }

  // GET /modules — lista de módulos conhecidos
  app.get('/modules', { schema: { tags: ['permissions'], summary: 'List known modules' } }, async (_req, reply) => {
    return reply.send({ success: true, data: MODULES })
  })

  // GET /users/:userId — permissões do usuário (escopo da empresa)
  app.get('/users/:userId', { schema: { tags: ['permissions'], summary: 'Get user permissions' } }, async (req, reply) => {
    if (!isAdmin(req.user.role)) return reply.status(403).send({ error: 'FORBIDDEN' })
    const { userId } = req.params as { userId: string }
    const user = await app.prisma.user.findFirst({ where: { id: userId, companyId: req.user.cid }, select: { id: true } })
    if (!user) return reply.status(404).send({ error: 'USER_NOT_FOUND' })
    const perms = await db().userModulePermission.findMany({ where: { userId, companyId: req.user.cid } })
    return reply.send({ success: true, data: perms })
  })

  // PUT /users/:userId — substitui o conjunto de permissões do usuário
  app.put('/users/:userId', { schema: { tags: ['permissions'], summary: 'Replace user permissions' } }, async (req, reply) => {
    if (!isAdmin(req.user.role)) return reply.status(403).send({ error: 'FORBIDDEN' })
    const { userId } = req.params as { userId: string }
    const user = await app.prisma.user.findFirst({ where: { id: userId, companyId: req.user.cid }, select: { id: true } })
    if (!user) return reply.status(404).send({ error: 'USER_NOT_FOUND' })

    const b = z.object({
      permissions: z.array(z.object({
        module: z.string().min(1),
        canView: z.boolean().default(true),
        canEdit: z.boolean().default(false),
        canDelete: z.boolean().default(false),
      })),
    }).parse(req.body)

    const saved = await app.prisma.$transaction(async (tx: any) => {
      await tx.userModulePermission.deleteMany({ where: { userId, companyId: req.user.cid } })
      if (b.permissions.length === 0) return []
      await tx.userModulePermission.createMany({
        data: b.permissions.map((p) => ({
          companyId: req.user.cid,
          userId,
          module: p.module,
          canView: p.canView,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
        })),
      })
      return tx.userModulePermission.findMany({ where: { userId, companyId: req.user.cid } })
    })
    return reply.send({ success: true, data: saved })
  })
}
