/**
 * Daily Social Post Job
 * Every day at 9:00 AM, automatically picks 1-2 featured or recent properties
 * with images and posts them to Instagram
 */
import type { FastifyInstance } from 'fastify'
import { generatePropertyCaption } from '../services/caption-generator.service.js'
import { publishPropertyToInstagram } from '../services/instagram-publisher.service.js'
import { env } from '../utils/env.js'

export async function runDailySocialPost(app: FastifyInstance): Promise<void> {
  const token = env.INSTAGRAM_PAGE_ACCESS_TOKEN
  const igUserId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID

  if (!token || !igUserId) {
    app.log.info('[daily-social] Skipping — Instagram not configured')
    return
  }

  const companyId = env.PUBLIC_COMPANY_ID
  if (!companyId) return

  // Get 2 featured or recent properties with images that haven't been posted recently
  const recentlyPosted = await app.prisma.blogPost.findMany({
    where: {
      companyId,
      isAutoImported: false,
      publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: { sourceUrl: true },
  })
  const recentSlugs = recentlyPosted
    .map(p => p.sourceUrl?.split('/imoveis/')[1])
    .filter(Boolean) as string[]

  const properties = await app.prisma.property.findMany({
    where: {
      companyId,
      status: 'ACTIVE',
      coverImage: { not: null },
      slug: { notIn: recentSlugs },
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take: 2,
    select: {
      id: true, title: true, type: true, purpose: true, city: true, neighborhood: true,
      bedrooms: true, bathrooms: true, parkingSpaces: true, totalArea: true, builtArea: true,
      price: true, priceRent: true, features: true, description: true, reference: true, slug: true,
      coverImage: true,
    },
  })

  for (const property of properties) {
    if (!property.coverImage) continue
    try {
      const { caption, hashtags } = await generatePropertyCaption(property as any)
      const result = await publishPropertyToInstagram(
        property.coverImage,
        `${caption}\n\n${hashtags}`,
        igUserId,
        token,
      )

      if (result.success) {
        app.log.info({ slug: property.slug, permalink: result.permalink }, '[daily-social] Posted property to Instagram')
        // Save to blog
        await app.prisma.blogPost.create({
          data: {
            companyId,
            title: `Instagram: ${property.title}`,
            slug: `post-ig-daily-${property.slug}-${Date.now()}`,
            excerpt: caption.slice(0, 200),
            content: `<p>${caption.replace(/\n/g, '<br />')}</p>`,
            coverImage: property.coverImage,
            tags: 'instagram, imóveis franca, imobiliária lemos',
            source: 'Instagram @imobiliarialemos',
            sourceUrl: result.permalink ?? null,
            isAutoImported: false,
            published: true,
            publishedAt: new Date(),
            featured: false,
          },
        }).catch(() => {})
        // Wait 60 seconds between posts
        await new Promise(r => setTimeout(r, 60000))
      }
    } catch (err) {
      app.log.warn({ err, slug: property.slug }, '[daily-social] Failed to post')
    }
  }
}
