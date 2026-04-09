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

export default async function blogCategoryRoutes(app: FastifyInstance) {
  // PUBLIC: list active categories
  app.get('/', async (req, reply) => {
    const q = req.query as Record<string, string>
    const companyId = q.companyId ?? process.env.PUBLIC_COMPANY_ID
    if (!companyId) return reply.status(400).send({ error: 'COMPANY_REQUIRED' })

    const categories = await app.prisma.blogCategory.findMany({
      where: { companyId, status: 'active' },
      orderBy: { ordem: 'asc' },
      include: { _count: { select: { posts: { where: { published: true } } } } },
    })
    return reply.send({ data: categories })
  })

  // PUBLIC: single category by slug
  app.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const q = req.query as Record<string, string>
    const companyId = q.companyId ?? process.env.PUBLIC_COMPANY_ID
    if (!companyId) return reply.status(400).send({ error: 'COMPANY_REQUIRED' })

    const category = await app.prisma.blogCategory.findFirst({
      where: { slug, companyId, status: 'active' },
      include: {
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
    if (!category) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(category)
  })

  // ADMIN: list all categories
  app.get('/admin/all', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid = req.user.cid
    const categories = await app.prisma.blogCategory.findMany({
      where: { companyId: cid },
      orderBy: { ordem: 'asc' },
      include: { _count: { select: { posts: true } } },
    })
    return reply.send({ data: categories })
  })

  // CREATE category
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid = req.user.cid
    const body = req.body as any
    const slug = body.slug || slugify(body.name)
    const cat = await app.prisma.blogCategory.create({
      data: {
        companyId: cid,
        name: body.name,
        slug,
        description: body.description ?? null,
        image: body.image ?? null,
        seoTitle: body.seoTitle ?? null,
        metaDescription: body.metaDescription ?? null,
        ordem: body.ordem ?? 0,
        status: body.status ?? 'active',
      },
    })
    return reply.status(201).send(cat)
  })

  // UPDATE category
  app.patch('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const cid = req.user.cid
    const body = req.body as any
    const existing = await app.prisma.blogCategory.findFirst({ where: { id, companyId: cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const cat = await app.prisma.blogCategory.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription }),
        ...(body.ordem !== undefined && { ordem: body.ordem }),
        ...(body.status !== undefined && { status: body.status }),
      },
    })
    return reply.send(cat)
  })

  // DELETE category
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const cid = req.user.cid
    const existing = await app.prisma.blogCategory.findFirst({ where: { id, companyId: cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    await app.prisma.blogCategory.delete({ where: { id } })
    return reply.send({ deleted: true })
  })
}
