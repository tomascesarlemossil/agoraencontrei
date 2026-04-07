import type { FastifyInstance } from 'fastify'
import { createAuditLog } from '../../services/audit.service.js'

function slugify(text: string) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

export default async function blogRoutes(app: FastifyInstance) {
  // PUBLIC: GET /api/v1/blog — list published posts
  app.get('/', async (req, reply) => {
    const q = req.query as Record<string, string>
    const page    = parseInt(q.page  ?? '1',  10)
    const limit   = parseInt(q.limit ?? '12', 10)
    const companyId = q.companyId ?? process.env.PUBLIC_COMPANY_ID
    const category  = q.category
    const tag       = q.tag
    const featured  = q.featured === 'true'
    const search    = q.search

    if (!companyId) return reply.status(400).send({ error: 'COMPANY_REQUIRED' })

    const where: any = {
      companyId,
      published: true,
      ...(category && { category }),
      ...(featured && { featured: true }),
      ...(tag && { tags: { contains: tag } }),
      ...(search && {
        OR: [
          { title:   { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { tags:    { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [total, posts] = await Promise.all([
      app.prisma.blogPost.count({ where }),
      app.prisma.blogPost.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
        skip:  (page - 1) * limit,
        take:  limit,
        select: {
          id: true, slug: true, title: true, excerpt: true,
          coverImage: true, category: true, tags: true,
          authorName: true, publishedAt: true, views: true, featured: true,
          source: true,
        },
      }),
    ])

    return reply.send({ data: posts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // PUBLIC: GET /api/v1/blog/:slug — single post (increments views)
  app.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const q = req.query as Record<string, string>
    const companyId = q.companyId ?? process.env.PUBLIC_COMPANY_ID

    if (!companyId) return reply.status(400).send({ error: 'COMPANY_REQUIRED' })

    const post = await app.prisma.blogPost.findFirst({
      where: { slug, companyId, published: true },
    })
    if (!post) return reply.status(404).send({ error: 'NOT_FOUND' })

    // increment views async
    app.prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {})

    return reply.send(post)
  })

  // ─── AUTHENTICATED ROUTES ─────────────────────────────────────

  // GET /api/v1/blog/admin/posts — all posts (admin)
  app.get('/admin/posts', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '20', 10)
    const where: any = {
      companyId: cid,
      ...(q.published !== undefined && { published: q.published === 'true' }),
      ...(q.category && { category: q.category }),
    }
    const [total, posts] = await Promise.all([
      app.prisma.blogPost.count({ where }),
      app.prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])
    return reply.send({ data: posts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // POST /api/v1/blog — create post
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid  = req.user.cid
    const body = req.body as any
    const baseSlug = slugify(body.title)
    let slug = baseSlug
    let i = 1
    while (await app.prisma.blogPost.findFirst({ where: { companyId: cid, slug } })) {
      slug = `${baseSlug}-${i++}`
    }
    const post = await app.prisma.blogPost.create({
      data: {
        companyId:     cid,
        title:         body.title,
        slug,
        excerpt:       body.excerpt ?? null,
        content:       body.content ?? '',
        coverImage:    body.coverImage ?? null,
        seoTitle:      body.seoTitle ?? body.title,
        seoDescription: body.seoDescription ?? body.excerpt ?? null,
        seoKeywords:   body.seoKeywords ?? null,
        category:      body.category ?? null,
        tags:          body.tags ?? null,
        published:     body.published ?? false,
        publishedAt:   body.published ? new Date() : null,
        featured:      body.featured ?? false,
        authorName:    body.authorName ?? 'Equipe Imobiliária Lemos',
        source:        body.source ?? null,
        sourceUrl:     body.sourceUrl ?? null,
      },
    })
    await createAuditLog({
      prisma: app.prisma, req,
      action: 'blog.create',
      resource: 'blog', resourceId: post.id,
      after: { title: post.title, published: post.published } as any,
    })
    return reply.status(201).send(post)
  })
  // PATCH /api/v1/blog/:id — update postt
  app.patch('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const cid  = req.user.cid
    const body = req.body as any
    const existing = await app.prisma.blogPost.findFirst({ where: { id, companyId: cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    const wasPublished = existing.published
    const nowPublished = body.published ?? existing.published

    const post = await app.prisma.blogPost.update({
      where: { id },
      data: {
        ...(body.title        !== undefined && { title: body.title }),
        ...(body.excerpt      !== undefined && { excerpt: body.excerpt }),
        ...(body.content      !== undefined && { content: body.content }),
        ...(body.coverImage   !== undefined && { coverImage: body.coverImage }),
        ...(body.seoTitle     !== undefined && { seoTitle: body.seoTitle }),
        ...(body.seoDescription !== undefined && { seoDescription: body.seoDescription }),
        ...(body.seoKeywords  !== undefined && { seoKeywords: body.seoKeywords }),
        ...(body.category     !== undefined && { category: body.category }),
        ...(body.tags         !== undefined && { tags: body.tags }),
        ...(body.published    !== undefined && { published: body.published }),
        ...(body.featured     !== undefined && { featured: body.featured }),
        ...(body.authorName   !== undefined && { authorName: body.authorName }),
        ...(!wasPublished && nowPublished && { publishedAt: new Date() }),
      },
    })
     const action = !wasPublished && (body.published ?? false) ? 'blog.publish' : 'blog.update'
    await createAuditLog({
      prisma: app.prisma, req,
      action,
      resource: 'blog', resourceId: id,
      before: { title: existing.title, published: existing.published } as any,
      after: { title: post.title, published: post.published } as any,
    })
    return reply.send(post)
  })
  // DELETE /api/v1/blog/:id
  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await app.prisma.blogPost.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    await app.prisma.blogPost.delete({ where: { id } })
    await createAuditLog({
      prisma: app.prisma, req,
      action: 'blog.delete',
      resource: 'blog', resourceId: id,
      before: { title: existing.title, published: existing.published } as any,
    })
    return reply.send({ deleted: true })
  })
}
