/**
 * AI Marketing Routes — Geração automática de conteúdo
 *
 * POST /api/v1/ai-marketing/generate      — Gera conteúdo marketing para imóvel
 * POST /api/v1/ai-marketing/analyze-images — Analisa fotos via visão computacional
 * POST /api/v1/ai-marketing/publish-social — Publica nas redes sociais
 * GET  /api/v1/ai-marketing/image-presets  — Lista presets de imagem disponíveis
 * POST /api/v1/ai-marketing/process-images — Processa lote de imagens com preset
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { generateMarketingContent, analyzePropertyImages } from '../../services/ai-marketing.service.js'
import { getOptimizedImageUrl, processBatchImages, getAllImageVariants, type ImagePreset } from '../../services/cloudinary.service.js'
import { publishToAllPlatforms, getNextBestPostingTime } from '../../services/social-publisher.service.js'
import { createAuditLog } from '../../services/audit.service.js'

export default async function aiMarketingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /generate — Gera conteúdo de marketing completo para um imóvel
  app.post('/generate', {
    schema: { tags: ['ai-marketing'], summary: 'Generate marketing content for a property' },
  }, async (req, reply) => {
    const body = z.object({
      propertyId: z.string().optional(),
      title: z.string(),
      type: z.string().default('HOUSE'),
      purpose: z.string().default('SALE'),
      city: z.string().default('Franca'),
      state: z.string().default('SP'),
      neighborhood: z.string().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      parkingSpaces: z.number().optional(),
      totalArea: z.number().optional(),
      builtArea: z.number().optional(),
      price: z.number().optional(),
      priceRent: z.number().optional(),
      features: z.array(z.string()).optional(),
      description: z.string().optional(),
      images: z.array(z.string()).optional(),
    }).parse(req.body)

    const content = await generateMarketingContent(body)

    // If propertyId is provided, update the property with generated content
    if (body.propertyId) {
      await app.prisma.property.update({
        where: { id: body.propertyId },
        data: {
          metaTitle: content.seoTitle,
          metaDescription: content.seoDescription,
          metaKeywords: content.seoKeywords,
        },
      }).catch(() => {}) // Non-critical: don't fail if property not found

      await createAuditLog({
        prisma: app.prisma as any, req,
        action: 'automation.run' as any,
        resource: 'property',
        resourceId: body.propertyId,
        meta: { type: 'ai_marketing.content_generated' },
      })
    }

    return reply.send({ success: true, data: content })
  })

  // POST /analyze-images — Analisa fotos via visão computacional
  app.post('/analyze-images', {
    schema: { tags: ['ai-marketing'], summary: 'Analyze property images using AI vision' },
  }, async (req, reply) => {
    const body = z.object({
      imageUrls: z.array(z.string().url()).min(1).max(10),
      city: z.string().default('Franca'),
    }).parse(req.body)

    const analysis = await analyzePropertyImages(body.imageUrls, body.city)

    return reply.send({ success: true, data: analysis })
  })

  // POST /publish-social — Publica nas redes sociais
  app.post('/publish-social', {
    schema: { tags: ['ai-marketing'], summary: 'Publish property to social media' },
  }, async (req, reply) => {
    const body = z.object({
      propertyId: z.string(),
      caption: z.string(),
      hashtags: z.string().default(''),
      imageUrls: z.array(z.string()).min(1).max(10),
      link: z.string().url().optional(),
      platforms: z.array(z.enum(['instagram', 'facebook', 'tiktok', 'linkedin'])).min(1),
      scheduleForBestTime: z.boolean().default(false),
    }).parse(req.body)

    const scheduledAt = body.scheduleForBestTime ? getNextBestPostingTime() : undefined

    const results = await publishToAllPlatforms({
      caption: body.caption,
      hashtags: body.hashtags,
      imageUrls: body.imageUrls,
      link: body.link,
      platforms: body.platforms,
      scheduledAt,
    })

    // Update property publication status
    await app.prisma.property.update({
      where: { id: body.propertyId },
      data: {
        portalDescriptions: {
          ...((await app.prisma.property.findUnique({
            where: { id: body.propertyId },
            select: { portalDescriptions: true },
          }))?.portalDescriptions as any || {}),
          socialPostResults: results,
          lastSocialPostAt: new Date().toISOString(),
        },
      },
    }).catch(() => {})

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'automation.run' as any,
      resource: 'property',
      resourceId: body.propertyId,
      meta: { type: 'ai_marketing.social_published', platforms: body.platforms },
    })

    return reply.send({
      success: true,
      data: {
        results,
        scheduledAt: scheduledAt?.toISOString() || null,
      },
    })
  })

  // GET /image-presets — Lista presets disponíveis
  app.get('/image-presets', {
    schema: { tags: ['ai-marketing'], summary: 'List available image presets' },
  }, async (_req, reply) => {
    return reply.send({
      presets: [
        { id: 'moderno', name: 'Moderno', description: 'Cores vibrantes, nitidez alta. Ideal para imóveis novos.' },
        { id: 'luxo', name: 'Luxo', description: 'Tons sóbrios e elegantes. Ideal para alto padrão.' },
        { id: 'vibrant', name: 'Vibrante', description: 'Cores intensas e saturadas. Ideal para redes sociais.' },
        { id: 'clean', name: 'Clean', description: 'Ajuste sutil, look natural. Ideal para site e portais.' },
      ],
      formats: [
        { id: 'feed', name: 'Feed Instagram', dimensions: '1080x1080' },
        { id: 'stories', name: 'Stories/Reels', dimensions: '1080x1920' },
        { id: 'thumb', name: 'Miniatura', dimensions: '600x400' },
        { id: 'site', name: 'Site Full', dimensions: '1920x1080' },
        { id: 'og', name: 'Open Graph', dimensions: '1200x630' },
      ],
    })
  })

  // POST /process-images — Processa lote de imagens com preset
  app.post('/process-images', {
    schema: { tags: ['ai-marketing'], summary: 'Process batch of images with preset' },
  }, async (req, reply) => {
    const body = z.object({
      imageUrls: z.array(z.string()).min(1).max(50),
      preset: z.enum(['moderno', 'luxo', 'vibrant', 'clean']).default('moderno'),
      withLogo: z.boolean().default(true),
    }).parse(req.body)

    const processed = processBatchImages(body.imageUrls, body.preset as ImagePreset, body.withLogo)

    return reply.send({ success: true, data: processed })
  })

  // POST /generate-for-property/:id — Gera tudo automaticamente a partir do ID do imóvel
  app.post('/generate-for-property/:id', {
    schema: { tags: ['ai-marketing'], summary: 'Auto-generate all marketing content for a property' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const property = await app.prisma.property.findFirst({
      where: { id, companyId: req.user.cid },
      select: {
        id: true, title: true, type: true, purpose: true,
        city: true, state: true, neighborhood: true,
        bedrooms: true, bathrooms: true, parkingSpaces: true,
        totalArea: true, builtArea: true, price: true, priceRent: true,
        features: true, description: true, images: true, coverImage: true,
        slug: true,
      },
    })

    if (!property) {
      return reply.status(404).send({ error: 'PROPERTY_NOT_FOUND' })
    }

    // 1. Generate marketing content
    const content = await generateMarketingContent({
      title: property.title,
      type: property.type,
      purpose: property.purpose,
      city: property.city || 'Franca',
      state: property.state || 'SP',
      neighborhood: property.neighborhood || undefined,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parkingSpaces,
      totalArea: property.totalArea || undefined,
      builtArea: property.builtArea || undefined,
      price: property.price ? Number(property.price) : undefined,
      priceRent: property.priceRent ? Number(property.priceRent) : undefined,
      features: property.features,
      description: property.description || undefined,
    })

    // 2. Process images with presets
    const allImages = property.images.length > 0 ? property.images : (property.coverImage ? [property.coverImage] : [])
    const imageVariants = allImages.length > 0
      ? processBatchImages(allImages.slice(0, 10), 'moderno', true)
      : []

    // 3. Analyze images if available
    let imageAnalysis = null
    if (allImages.length > 0) {
      try {
        imageAnalysis = await analyzePropertyImages(allImages.slice(0, 5), property.city || 'Franca')
      } catch {
        // Non-critical
      }
    }

    // 4. Update property with generated content
    await app.prisma.property.update({
      where: { id },
      data: {
        metaTitle: content.seoTitle,
        metaDescription: content.seoDescription,
        metaKeywords: content.seoKeywords,
        portalDescriptions: {
          ...((property as any).portalDescriptions || {}),
          ai_generated: {
            instagramCaption: content.instagramCaption,
            facebookCaption: content.facebookCaption,
            tiktokCaption: content.tiktokCaption,
            whatsappMessage: content.whatsappMessage,
            propertyHighlights: content.propertyHighlights,
            imageAnalysis,
            generatedAt: new Date().toISOString(),
          },
        },
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'automation.run' as any,
      resource: 'property',
      resourceId: id,
      meta: { type: 'ai_marketing.auto_generated' },
    })

    return reply.send({
      success: true,
      data: {
        marketing: content,
        imageVariants,
        imageAnalysis,
        propertyUrl: `https://www.agoraencontrei.com.br/imoveis/${property.slug}`,
      },
    })
  })
}
