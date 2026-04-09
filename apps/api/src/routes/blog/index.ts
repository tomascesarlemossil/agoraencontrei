import type { FastifyInstance } from 'fastify'
import { createAuditLog } from '../../services/audit.service.js'
import blogCategoryRoutes from './categories.js'
import blogClusterRoutes from './clusters.js'

function slugify(text: string) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

// Convert markdown to basic HTML
function markdownToHtml(md: string): string {
  if (!md) return ''
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Paragraphs - wrap non-tag lines
    .split('\n\n')
    .map(block => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (/^<[hulo]/.test(trimmed)) return trimmed
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

const POST_PUBLIC_SELECT = {
  id: true, slug: true, title: true, subtitle: true, excerpt: true,
  coverImage: true, coverImageAlt: true, tags: true,
  authorName: true, publishedAt: true, views: true, featured: true,
  cidade: true, bairro: true, tipoImovel: true,
  category: { select: { id: true, name: true, slug: true } },
  cluster: { select: { id: true, name: true, slug: true } },
  schemaType: true, intencaoBusca: true, estagioFunil: true,
}

export default async function blogRoutes(app: FastifyInstance) {
  // Register sub-routes
  await app.register(blogCategoryRoutes, { prefix: '/categories' })
  await app.register(blogClusterRoutes, { prefix: '/clusters' })

  // ─── PUBLIC ROUTES ────────────────────────────────────────────

  // GET /api/v1/blog — list published posts
  app.get('/', async (req, reply) => {
    const q = req.query as Record<string, string>
    const page    = parseInt(q.page  ?? '1',  10)
    const limit   = parseInt(q.limit ?? '12', 10)
    const companyId = q.companyId ?? process.env.PUBLIC_COMPANY_ID
    const category  = q.category
    const categorySlug = q.categorySlug
    const clusterSlug = q.clusterSlug
    const tag       = q.tag
    const featured  = q.featured === 'true'
    const search    = q.search
    const cidade    = q.cidade
    const bairro    = q.bairro
    const tipoImovel = q.tipoImovel

    if (!companyId) return reply.status(400).send({ error: 'COMPANY_REQUIRED' })

    const where: any = {
      companyId,
      published: true,
      ...(category && { category: { slug: category } }),
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(clusterSlug && { cluster: { slug: clusterSlug } }),
      ...(featured && { featured: true }),
      ...(tag && { tags: { contains: tag } }),
      ...(cidade && { cidade: { contains: cidade, mode: 'insensitive' } }),
      ...(bairro && { bairro: { contains: bairro, mode: 'insensitive' } }),
      ...(tipoImovel && { tipoImovel }),
      ...(search && {
        OR: [
          { title:   { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { tags:    { contains: search, mode: 'insensitive' } },
          { keywordPrincipal: { contains: search, mode: 'insensitive' } },
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
        select: POST_PUBLIC_SELECT,
      }),
    ])

    return reply.send({ data: posts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/blog/:slug — single post (increments views)
  app.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const q = req.query as Record<string, string>
    const companyId = q.companyId ?? process.env.PUBLIC_COMPANY_ID

    if (!companyId) return reply.status(400).send({ error: 'COMPANY_REQUIRED' })

    const post = await app.prisma.blogPost.findFirst({
      where: { slug, companyId, published: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        cluster: {
          select: {
            id: true, name: true, slug: true, pillarPostId: true,
            posts: {
              where: { published: true, slug: { not: slug } },
              take: 6,
              orderBy: { publishedAt: 'desc' },
              select: { id: true, slug: true, title: true, coverImage: true, coverImageAlt: true, excerpt: true },
            },
          },
        },
      },
    })
    if (!post) return reply.status(404).send({ error: 'NOT_FOUND' })

    // increment views async
    app.prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {})

    // Fetch related posts by category (different from cluster posts)
    let relatedPosts: any[] = []
    if (post.categoryId) {
      relatedPosts = await app.prisma.blogPost.findMany({
        where: {
          companyId, published: true,
          categoryId: post.categoryId,
          id: { not: post.id },
        },
        take: 4,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, slug: true, title: true, coverImage: true, coverImageAlt: true, excerpt: true },
      })
    }

    return reply.send({ ...post, relatedByCategory: relatedPosts })
  })

  // ─── AUTHENTICATED ROUTES ─────────────────────────────────────

  // GET /api/v1/blog/admin/posts — all posts (admin)
  app.get('/admin/posts', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid = req.user.cid
    const q = req.query as Record<string, string>
    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '50', 10)
    const where: any = {
      companyId: cid,
      ...(q.published !== undefined && { published: q.published === 'true' }),
      ...(q.status && { status: q.status }),
      ...(q.categoryId && { categoryId: q.categoryId }),
      ...(q.clusterId && { clusterId: q.clusterId }),
      ...(q.search && {
        OR: [
          { title: { contains: q.search, mode: 'insensitive' } },
          { slug: { contains: q.search, mode: 'insensitive' } },
        ],
      }),
    }
    const [total, posts] = await Promise.all([
      app.prisma.blogPost.count({ where }),
      app.prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          cluster: { select: { id: true, name: true, slug: true } },
        },
      }),
    ])
    return reply.send({ data: posts, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // POST /api/v1/blog — create post
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid  = req.user.cid
    const body = req.body as any

    const baseSlug = body.slug ? body.slug.replace(/^\//, '') : slugify(body.title)
    let slug = baseSlug
    let i = 1
    while (await app.prisma.blogPost.findFirst({ where: { companyId: cid, slug } })) {
      slug = `${baseSlug}-${i++}`
    }

    // Convert markdown to HTML if provided
    const content = body.content || (body.bodyMarkdown ? markdownToHtml(body.bodyMarkdown) : '')
    const isPublished = body.published ?? body.status === 'published'

    const post = await app.prisma.blogPost.create({
      data: {
        companyId:     cid,
        title:         body.title,
        subtitle:      body.subtitle ?? null,
        slug,
        excerpt:       body.excerpt ?? null,
        content,
        bodyMarkdown:  body.bodyMarkdown ?? null,
        coverImage:    body.coverImage ?? null,
        coverImageAlt: body.coverImageAlt ?? null,
        coverImageCaption: body.coverImageCaption ?? null,
        galleryImages: body.galleryImages ?? [],
        videoUrl:      body.videoUrl ?? null,
        videoEmbed:    body.videoEmbed ?? null,
        categoryId:    body.categoryId ?? null,
        clusterId:     body.clusterId ?? null,
        tags:          body.tags ?? null,
        seoTitle:      body.seoTitle ?? body.title,
        seoDescription: body.seoDescription ?? body.excerpt ?? null,
        seoKeywords:   body.seoKeywords ?? null,
        keywordPrincipal: body.keywordPrincipal ?? null,
        keywordsSecundarias: body.keywordsSecundarias ?? null,
        canonicalUrl:  body.canonicalUrl ?? null,
        noindex:       body.noindex ?? false,
        ogTitle:       body.ogTitle ?? null,
        ogDescription: body.ogDescription ?? null,
        ogImage:       body.ogImage ?? null,
        twitterTitle:  body.twitterTitle ?? null,
        twitterDescription: body.twitterDescription ?? null,
        twitterImage:  body.twitterImage ?? null,
        schemaType:    body.schemaType ?? 'BlogPosting',
        breadcrumbLabel: body.breadcrumbLabel ?? null,
        intencaoBusca: body.intencaoBusca ?? null,
        estagioFunil:  body.estagioFunil ?? null,
        ctaFinal:      body.ctaFinal ?? null,
        faq:           body.faq ?? [],
        linksInternos: body.linksInternos ?? [],
        postsRelacionados: body.postsRelacionados ?? [],
        cidade:        body.cidade ?? null,
        bairro:        body.bairro ?? null,
        tipoImovel:    body.tipoImovel ?? null,
        seoPriority:   body.seoPriority ?? 0,
        commercialPriority: body.commercialPriority ?? 0,
        editorialNotes: body.editorialNotes ?? null,
        cannibalizationNotes: body.cannibalizationNotes ?? null,
        source:        body.source ?? null,
        sourceUrl:     body.sourceUrl ?? null,
        isAutoImported: body.isAutoImported ?? false,
        status:        body.status ?? (isPublished ? 'published' : 'draft'),
        published:     isPublished,
        publishedAt:   isPublished ? new Date() : null,
        scheduledAt:   body.scheduledAt ? new Date(body.scheduledAt) : null,
        featured:      body.featured ?? false,
        authorName:    body.authorName ?? 'Equipe AgoraEncontrei',
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

  // BULK IMPORT: POST /api/v1/blog/import — import many posts
  app.post('/import', { preHandler: [app.authenticate] }, async (req, reply) => {
    const cid  = req.user.cid
    const { posts: postsData } = req.body as { posts: any[] }
    if (!Array.isArray(postsData)) return reply.status(400).send({ error: 'POSTS_ARRAY_REQUIRED' })

    const results = { created: 0, updated: 0, errors: [] as string[] }

    for (const body of postsData) {
      try {
        const baseSlug = body.slug ? body.slug.replace(/^\//, '') : slugify(body.title)
        const existing = await app.prisma.blogPost.findFirst({ where: { companyId: cid, slug: baseSlug } })

        const content = body.content || (body.bodyMarkdown ? markdownToHtml(body.bodyMarkdown) : '')
        const isPublished = body.published ?? body.status === 'published'

        const data: any = {
          title: body.title,
          subtitle: body.subtitle ?? null,
          excerpt: body.excerpt ?? null,
          content,
          bodyMarkdown: body.bodyMarkdown ?? null,
          coverImage: body.coverImage ?? null,
          coverImageAlt: body.coverImageAlt ?? null,
          galleryImages: body.galleryImages ?? [],
          videoUrl: body.videoUrl ?? null,
          videoEmbed: body.videoEmbed ?? null,
          categoryId: body.categoryId ?? null,
          clusterId: body.clusterId ?? null,
          tags: body.tags ?? null,
          seoTitle: body.seoTitle ?? body.title,
          seoDescription: body.seoDescription ?? body.excerpt ?? null,
          keywordPrincipal: body.keywordPrincipal ?? null,
          keywordsSecundarias: body.keywordsSecundarias ?? null,
          schemaType: body.schemaType ?? 'BlogPosting',
          intencaoBusca: body.intencaoBusca ?? null,
          estagioFunil: body.estagioFunil ?? null,
          ctaFinal: body.ctaFinal ?? null,
          faq: body.faq ?? [],
          linksInternos: body.linksInternos ?? [],
          postsRelacionados: body.postsRelacionados ?? [],
          cidade: body.cidade ?? null,
          bairro: body.bairro ?? null,
          tipoImovel: body.tipoImovel ?? null,
          editorialNotes: body.editorialNotes ?? null,
          cannibalizationNotes: body.cannibalizationNotes ?? null,
          status: body.status ?? (isPublished ? 'published' : 'draft'),
          published: isPublished,
          publishedAt: isPublished ? new Date() : null,
          featured: body.featured ?? false,
          authorName: body.authorName ?? 'Equipe AgoraEncontrei',
        }

        if (existing) {
          await app.prisma.blogPost.update({ where: { id: existing.id }, data })
          results.updated++
        } else {
          await app.prisma.blogPost.create({ data: { companyId: cid, slug: baseSlug, ...data } })
          results.created++
        }
      } catch (err: any) {
        results.errors.push(`${body.slug ?? body.title}: ${err.message}`)
      }
    }

    return reply.send(results)
  })

  // PATCH /api/v1/blog/:id — update post
  app.patch('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const cid  = req.user.cid
    const body = req.body as any
    const existing = await app.prisma.blogPost.findFirst({ where: { id, companyId: cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    const wasPublished = existing.published
    const nowPublished = body.published ?? (body.status === 'published') ?? existing.published

    // If bodyMarkdown changed, regenerate content
    let contentUpdate: any = {}
    if (body.bodyMarkdown !== undefined) {
      contentUpdate.bodyMarkdown = body.bodyMarkdown
      contentUpdate.content = markdownToHtml(body.bodyMarkdown)
    }
    if (body.content !== undefined) {
      contentUpdate.content = body.content
    }

    const post = await app.prisma.blogPost.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
        ...(body.slug !== undefined && { slug: body.slug.replace(/^\//, '') }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
        ...contentUpdate,
        ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
        ...(body.coverImageAlt !== undefined && { coverImageAlt: body.coverImageAlt }),
        ...(body.coverImageCaption !== undefined && { coverImageCaption: body.coverImageCaption }),
        ...(body.galleryImages !== undefined && { galleryImages: body.galleryImages }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl }),
        ...(body.videoEmbed !== undefined && { videoEmbed: body.videoEmbed }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.clusterId !== undefined && { clusterId: body.clusterId }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.seoTitle !== undefined && { seoTitle: body.seoTitle }),
        ...(body.seoDescription !== undefined && { seoDescription: body.seoDescription }),
        ...(body.seoKeywords !== undefined && { seoKeywords: body.seoKeywords }),
        ...(body.keywordPrincipal !== undefined && { keywordPrincipal: body.keywordPrincipal }),
        ...(body.keywordsSecundarias !== undefined && { keywordsSecundarias: body.keywordsSecundarias }),
        ...(body.canonicalUrl !== undefined && { canonicalUrl: body.canonicalUrl }),
        ...(body.noindex !== undefined && { noindex: body.noindex }),
        ...(body.ogTitle !== undefined && { ogTitle: body.ogTitle }),
        ...(body.ogDescription !== undefined && { ogDescription: body.ogDescription }),
        ...(body.ogImage !== undefined && { ogImage: body.ogImage }),
        ...(body.twitterTitle !== undefined && { twitterTitle: body.twitterTitle }),
        ...(body.twitterDescription !== undefined && { twitterDescription: body.twitterDescription }),
        ...(body.twitterImage !== undefined && { twitterImage: body.twitterImage }),
        ...(body.schemaType !== undefined && { schemaType: body.schemaType }),
        ...(body.breadcrumbLabel !== undefined && { breadcrumbLabel: body.breadcrumbLabel }),
        ...(body.intencaoBusca !== undefined && { intencaoBusca: body.intencaoBusca }),
        ...(body.estagioFunil !== undefined && { estagioFunil: body.estagioFunil }),
        ...(body.ctaFinal !== undefined && { ctaFinal: body.ctaFinal }),
        ...(body.faq !== undefined && { faq: body.faq }),
        ...(body.linksInternos !== undefined && { linksInternos: body.linksInternos }),
        ...(body.postsRelacionados !== undefined && { postsRelacionados: body.postsRelacionados }),
        ...(body.cidade !== undefined && { cidade: body.cidade }),
        ...(body.bairro !== undefined && { bairro: body.bairro }),
        ...(body.tipoImovel !== undefined && { tipoImovel: body.tipoImovel }),
        ...(body.seoPriority !== undefined && { seoPriority: body.seoPriority }),
        ...(body.commercialPriority !== undefined && { commercialPriority: body.commercialPriority }),
        ...(body.editorialNotes !== undefined && { editorialNotes: body.editorialNotes }),
        ...(body.cannibalizationNotes !== undefined && { cannibalizationNotes: body.cannibalizationNotes }),
        ...(body.published !== undefined && { published: body.published }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.featured !== undefined && { featured: body.featured }),
        ...(body.authorName !== undefined && { authorName: body.authorName }),
        ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
        ...(!wasPublished && nowPublished && { publishedAt: new Date() }),
      },
    })
    const action = !wasPublished && nowPublished ? 'blog.publish' : 'blog.update'
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
