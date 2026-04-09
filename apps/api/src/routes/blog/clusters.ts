import type { FastifyInstance } from 'fastify'

function slugify(text: string) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export default async function blogClusterRoutes(app: FastifyInstance) {
  // PUBLIC: list active clusters
  app.get('/', async (req, reply) => {
    const q = req.query as Record<string, string>
    const companyId = q.companyId ?? process.env.PUBLIC_COMPANY_ID
    if (!companyId) return reply.status(400).send({ error: 'COMPANY_REQUIRED' })

    const clusters = await app.prisma.blogCluster.findMany({
      where: { companyId, status: 'active' },
      orderBy: { name: 'asc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { posts: { where: { published: true } } } },
      },
    })
    return reply.send({ data: clusters })
  })

  // PUBLIC: single cluster by slug with posts
  app.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const q = req.query as Record<string, string>
    const companyId = q.companyId ?? process.env.PUBLIC_COMPANY_ID
    if (!companyId) return reply.status(400).send({ error: 'COMPANY_REQUIRED' })

    const cluster = await app.prisma.blogCluster.findFirst({
      where: { slug, companyId, status: 'active' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        posts: {
          where: { published: true },
          orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
          take: 50,
          select: {
            id: true, slug: true, title: true, excerpt: true,
            coverImage: true, coverImageAlt: true, tags: true,
            authorName: true, publishedAt: true, views: true, featured: true,
            cidade: true, bairro: true, tipoImovel: true,
          },
        },
        _count: { select: { posts: { where: { published: true } } } },
      },
    })
    if (!cluster) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(cluster)
  })

  // ADMIN: list all clusters
  app.get('/admin/all', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid = req.user.cid
    const clusters = await app.prisma.blogCluster.findMany({
      where: { companyId: cid },
      orderBy: { name: 'asc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { posts: true } },
      },
    })
    return reply.send({ data: clusters })
  })

  // CREATE cluster
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as any
    const slug = body.slug || slugify(body.name)
    const cluster = await app.prisma.blogCluster.create({
      data: {
        companyId: cid,
        name: body.name,
        slug,
        description: body.description ?? null,
        categoryId: body.categoryId ?? null,
        pillarPostId: body.pillarPostId ?? null,
        seoTitle: body.seoTitle ?? null,
        metaDescription: body.metaDescription ?? null,
        status: body.status ?? 'active',
      },
    })
    return reply.status(201).send(cluster)
  })

  // UPDATE cluster
  app.patch('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const cid = req.user.cid
    const body = req.body as any
    const existing = await app.prisma.blogCluster.findFirst({ where: { id, companyId: cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const cluster = await app.prisma.blogCluster.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.pillarPostId !== undefined && { pillarPostId: body.pillarPostId }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription }),
        ...(body.status !== undefined && { status: body.status }),
      },
    })
    return reply.send(cluster)
  })

  // DELETE cluster
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const cid = req.user.cid
    const existing = await app.prisma.blogCluster.findFirst({ where: { id, companyId: cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    await app.prisma.blogCluster.delete({ where: { id } })
    return reply.send({ deleted: true })
  })
}
