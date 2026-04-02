import type { FastifyInstance } from 'fastify'

export default async function auditLogsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET /api/v1/audit-logs ─────────────────────────────────────────────────
  // Listar todas as alterações com filtros opcionais (apenas ADMIN/MANAGER)
  app.get('/', async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const q = req.query as {
      page?:       string
      limit?:      string
      resource?:   string
      resourceId?: string
      userId?:     string
      action?:     string
      from?:       string
      to?:         string
    }

    const page  = Math.max(1, parseInt(q.page  || '1'))
    const limit = Math.min(100, parseInt(q.limit || '30'))
    const skip  = (page - 1) * limit

    const where: any = { companyId: req.user.cid }
    if (q.resource)   where.resource   = q.resource
    if (q.resourceId) where.resourceId = q.resourceId
    if (q.userId)     where.userId     = q.userId
    if (q.action)     where.action     = { contains: q.action, mode: 'insensitive' }
    if (q.from || q.to) {
      where.createdAt = {}
      if (q.from) where.createdAt.gte = new Date(q.from)
      if (q.to)   where.createdAt.lte = new Date(q.to)
    }

    const [total, items] = await Promise.all([
      app.prisma.auditLog.count({ where }),
      app.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ])

    // Enrich with user name/avatar
    const userIds = Array.from(new Set(items.map(i => i.userId).filter(Boolean))) as string[]
    const usersData = userIds.length
      ? await app.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, avatarUrl: true },
        })
      : []
    const userMap = Object.fromEntries(usersData.map(u => [u.id, u]))

    const data = items.map(log => ({
      ...log,
      user: log.userId ? (userMap[log.userId] ?? { id: log.userId, name: 'Usuário removido', avatarUrl: null }) : null,
    }))

    return reply.send({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  // ── GET /api/v1/audit-logs/:resourceType/:resourceId ─────────────────────
  // Histórico de um registro específico (ex: /audit-logs/contract/cmnXXX)
  app.get('/:resourceType/:resourceId', async (req, reply) => {
    const { resourceType, resourceId } = req.params as { resourceType: string; resourceId: string }

    const items = await app.prisma.auditLog.findMany({
      where: {
        companyId:  req.user.cid,
        resource:   resourceType,
        resourceId: resourceId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const userIds = Array.from(new Set(items.map(i => i.userId).filter(Boolean))) as string[]
    const usersData = userIds.length
      ? await app.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, avatarUrl: true },
        })
      : []
    const userMap = Object.fromEntries(usersData.map(u => [u.id, u]))

    return reply.send(
      items.map(log => ({
        ...log,
        user: log.userId ? (userMap[log.userId] ?? { id: log.userId, name: 'Usuário removido', avatarUrl: null }) : null,
      }))
    )
  })
}
