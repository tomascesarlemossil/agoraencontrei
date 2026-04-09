import type { FastifyInstance } from 'fastify'
import { env } from '../../utils/env.js'
import { generatePropertyCaption } from '../../services/caption-generator.service.js'
import { publishPropertyToInstagram, publishCarouselToInstagram } from '../../services/instagram-publisher.service.js'

export default async function socialPostRoutes(app: FastifyInstance) {

  // POST /api/v1/social/post/property/:id — post a specific property to Instagram
  app.post('/property/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { account = 'lemos', useCarousel = false } = (req.body as any) ?? {}

    const property = await app.prisma.property.findFirst({
      where: { id, companyId: req.user.cid },
      select: {
        id: true, title: true, type: true, purpose: true, city: true, neighborhood: true,
        bedrooms: true, bathrooms: true, parkingSpaces: true, totalArea: true, builtArea: true,
        price: true, priceRent: true, features: true, description: true, reference: true, slug: true,
        coverImage: true, images: true,
      },
    })
    if (!property) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (!property.coverImage) return reply.status(400).send({ error: 'NO_IMAGE', message: 'Property has no cover image' })

    // Generate caption
    const { caption, hashtags } = await generatePropertyCaption(property as any)
    const fullCaption = `${caption}\n\n${hashtags}`

    // Select token and IG user ID - read from company settings first, fallback to env
    const company = await app.prisma.company.findUnique({ where: { id: req.user.cid }, select: { settings: true } })
    const cs = (company?.settings as any) ?? {}

    const token = account === 'tomas'
      ? (cs.instagramTokenTomas || env.INSTAGRAM_TOKEN_TOMAS)
      : (cs.instagramTokenLemos || cs.instagramPageAccessToken || env.INSTAGRAM_TOKEN_LEMOS || env.INSTAGRAM_PAGE_ACCESS_TOKEN)

    const igUserId = cs.instagramBusinessAccountId || env.INSTAGRAM_BUSINESS_ACCOUNT_ID

    if (!token || !igUserId) {
      return reply.status(503).send({
        error: 'NOT_CONFIGURED',
        message: 'INSTAGRAM_PAGE_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID must be set in Railway',
        preview: { caption, hashtags, fullCaption },
      })
    }

    // Publish
    let result
    const images = (property.images as string[] | null) ?? []
    if (useCarousel && images.length >= 2) {
      result = await publishCarouselToInstagram([property.coverImage, ...images.slice(0, 9)], fullCaption, igUserId, token)
    } else {
      result = await publishPropertyToInstagram(property.coverImage, fullCaption, igUserId, token)
    }

    if (result.success) {
      // Save to blog as well
      const companyId = req.user.cid
      const title = property.title ?? `Imóvel ${property.reference}`
      const baseSlug = property.slug ? `post-ig-${property.slug}` : `post-ig-${property.id}`
      await app.prisma.blogPost.create({
        data: {
          companyId,
          title: `Instagram: ${title}`,
          slug: baseSlug,
          excerpt: caption.slice(0, 200),
          content: `<p>${caption.replace(/\n/g, '<br />')}</p>`,
          coverImage: property.coverImage,
          category: 'imoveis',
          tags: hashtags.split(' ').slice(0, 10).join(', '),
          source: `Instagram @${account === 'tomas' ? 'tomaslemosbr' : 'imobiliarialemos'}`,
          sourceUrl: result.permalink ?? null,
          isAutoImported: false,
          published: true,
          publishedAt: new Date(),
          featured: false,
          seoTitle: title,
          seoKeywords: hashtags.replace(/#/g, '').replace(/\s+/g, ', ').slice(0, 200),
        },
      }).catch(() => {})
    }

    return reply.send({ ...result, caption, hashtags })
  })

  // POST /api/v1/social/post/batch — post multiple properties
  app.post('/batch', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { propertyIds, account = 'lemos', delayMs = 30000 } = req.body as any

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return reply.status(400).send({ error: 'INVALID_PAYLOAD' })
    }

    // Return immediately — run in background
    reply.send({ message: `Queuing ${propertyIds.length} posts. Check /api/v1/social/status for progress.` })

    // Fire and forget
    ;(async () => {
      for (const id of propertyIds) {
        try {
          const property = await app.prisma.property.findFirst({
            where: { id, companyId: req.user.cid },
            select: {
              id: true, title: true, type: true, purpose: true, city: true, neighborhood: true,
              bedrooms: true, bathrooms: true, parkingSpaces: true, totalArea: true, builtArea: true,
              price: true, priceRent: true, features: true, description: true, reference: true, slug: true,
              coverImage: true, images: true,
            },
          })
          if (!property?.coverImage) continue

          const { caption, hashtags } = await generatePropertyCaption(property as any)
          const fullCaption = `${caption}\n\n${hashtags}`

          const token = account === 'tomas' ? env.INSTAGRAM_TOKEN_TOMAS : env.INSTAGRAM_PAGE_ACCESS_TOKEN
          const igUserId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID
          if (!token || !igUserId) continue

          await publishPropertyToInstagram(property.coverImage, fullCaption, igUserId, token)

          // Respect Instagram rate limits — wait between posts
          await new Promise(r => setTimeout(r, delayMs))
        } catch (err) {
          app.log.warn({ err, id }, '[social-batch] Failed to post property')
        }
      }
    })()
  })

  // GET /api/v1/social/post/preview/:id — preview caption without posting
  app.get('/preview/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const property = await app.prisma.property.findFirst({
      where: { id, companyId: req.user.cid },
      select: {
        id: true, title: true, type: true, purpose: true, city: true, neighborhood: true,
        bedrooms: true, bathrooms: true, parkingSpaces: true, totalArea: true, builtArea: true,
        price: true, priceRent: true, features: true, description: true, reference: true, slug: true,
        coverImage: true,
      },
    })
    if (!property) return reply.status(404).send({ error: 'NOT_FOUND' })

    const { caption, hashtags } = await generatePropertyCaption(property as any)
    return reply.send({
      caption,
      hashtags,
      fullCaption: `${caption}\n\n${hashtags}`,
      charCount: `${caption}\n\n${hashtags}`.length,
      coverImage: property.coverImage,
      canPost: !!(env.INSTAGRAM_BUSINESS_ACCOUNT_ID && (env.INSTAGRAM_PAGE_ACCESS_TOKEN || env.INSTAGRAM_TOKEN_TOMAS)),
    })
  })
}
