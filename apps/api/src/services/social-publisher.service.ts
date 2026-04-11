/**
 * Social Media Auto-Publisher Service
 * Publica imóveis automaticamente no Instagram, Facebook e TikTok
 * usando a API do Meta (Graph API) para Instagram/Facebook
 * e integração com Ayrshare para distribuição multicanal.
 *
 * Fluxo: Imóvel aprovado → Fotos com preset → Legenda IA → Post automático
 */

import { env } from '../utils/env.js'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SocialPost {
  caption: string
  hashtags: string
  imageUrls: string[]        // URLs das fotos já processadas (com logo)
  link?: string              // Link do imóvel no site
  platforms: SocialPlatform[]
  scheduledAt?: Date         // Se não informado, posta imediatamente
}

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'

export interface PostResult {
  platform: SocialPlatform
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
}

export interface PublishingSchedule {
  day: number        // 0-6 (domingo-sábado)
  hours: number[]    // Horários ideais para postagem
}

// ── Best Posting Times (Franca/SP audience) ─────────────────────────────────

const BEST_POSTING_TIMES: PublishingSchedule[] = [
  { day: 1, hours: [8, 12, 18] },   // Segunda
  { day: 2, hours: [8, 12, 18] },   // Terça
  { day: 3, hours: [8, 12, 19] },   // Quarta
  { day: 4, hours: [8, 12, 18] },   // Quinta
  { day: 5, hours: [9, 13, 17] },   // Sexta
  { day: 6, hours: [10, 15] },      // Sábado
  { day: 0, hours: [10, 16] },      // Domingo
]

// ── Instagram/Facebook Publishing (Meta Graph API) ──────────────────────────

/**
 * Publica um carrossel no Instagram via Graph API.
 * Requer: INSTAGRAM_BUSINESS_ACCOUNT_ID e INSTAGRAM_PAGE_ACCESS_TOKEN
 */
export async function publishToInstagram(post: SocialPost): Promise<PostResult> {
  const accountId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  const accessToken = env.INSTAGRAM_PAGE_ACCESS_TOKEN

  if (!accountId || !accessToken) {
    return { platform: 'instagram', success: false, error: 'Instagram credentials not configured' }
  }

  try {
    const fullCaption = `${post.caption}\n\n${post.hashtags}`

    if (post.imageUrls.length === 1) {
      // Single image post
      const createRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: post.imageUrls[0],
            caption: fullCaption,
            access_token: accessToken,
          }),
        },
      )
      const createData = await createRes.json() as any
      if (!createData.id) throw new Error(createData.error?.message || 'Failed to create media')

      // Publish
      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: createData.id,
            access_token: accessToken,
          }),
        },
      )
      const publishData = await publishRes.json() as any

      return {
        platform: 'instagram',
        success: !!publishData.id,
        postId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}`,
      }
    }

    // Carousel post (multiple images)
    const containerIds: string[] = []
    for (const imageUrl of post.imageUrls.slice(0, 10)) {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            is_carousel_item: true,
            access_token: accessToken,
          }),
        },
      )
      const data = await res.json() as any
      if (data.id) containerIds.push(data.id)
    }

    if (containerIds.length === 0) {
      throw new Error('No carousel items created')
    }

    // Create carousel container
    const carouselRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: containerIds,
          caption: fullCaption,
          access_token: accessToken,
        }),
      },
    )
    const carouselData = await carouselRes.json() as any

    // Publish carousel
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: carouselData.id,
          access_token: accessToken,
        }),
      },
    )
    const publishData = await publishRes.json() as any

    return {
      platform: 'instagram',
      success: !!publishData.id,
      postId: publishData.id,
    }
  } catch (error: any) {
    return { platform: 'instagram', success: false, error: error.message }
  }
}

/**
 * Publica no Facebook via Page API.
 */
export async function publishToFacebook(post: SocialPost): Promise<PostResult> {
  const pageId = env.FACEBOOK_PAGE_ID
  const accessToken = env.INSTAGRAM_PAGE_ACCESS_TOKEN  // Same token for Page

  if (!pageId || !accessToken) {
    return { platform: 'facebook', success: false, error: 'Facebook credentials not configured' }
  }

  try {
    const fullMessage = `${post.caption}\n\n${post.link ? `🔗 ${post.link}` : ''}\n\n${post.hashtags}`

    if (post.imageUrls.length === 1) {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: post.imageUrls[0],
            message: fullMessage,
            access_token: accessToken,
          }),
        },
      )
      const data = await res.json() as any
      return {
        platform: 'facebook',
        success: !!data.id,
        postId: data.id,
        postUrl: `https://www.facebook.com/${data.id}`,
      }
    }

    // Multiple photos
    const photoIds: string[] = []
    for (const url of post.imageUrls.slice(0, 10)) {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            published: false,
            access_token: accessToken,
          }),
        },
      )
      const data = await res.json() as any
      if (data.id) photoIds.push(data.id)
    }

    // Create post with multiple photos
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: fullMessage,
          attached_media: photoIds.map(id => ({ media_fbid: id })),
          access_token: accessToken,
        }),
      },
    )
    const data = await res.json() as any

    return {
      platform: 'facebook',
      success: !!data.id,
      postId: data.id,
    }
  } catch (error: any) {
    return { platform: 'facebook', success: false, error: error.message }
  }
}

// ── Multi-Platform Publishing ───────────────────────────────────────────────

/**
 * Publica em todas as plataformas solicitadas.
 */
export async function publishToAllPlatforms(post: SocialPost): Promise<PostResult[]> {
  const results: PostResult[] = []

  for (const platform of post.platforms) {
    switch (platform) {
      case 'instagram':
        results.push(await publishToInstagram(post))
        break
      case 'facebook':
        results.push(await publishToFacebook(post))
        break
      default:
        results.push({
          platform,
          success: false,
          error: `Platform ${platform} not yet integrated`,
        })
    }
  }

  return results
}

/**
 * Calcula o próximo melhor horário para postagem baseado na audiência.
 */
export function getNextBestPostingTime(): Date {
  const now = new Date()
  const currentDay = now.getDay()
  const currentHour = now.getHours()

  // Check today's remaining slots
  const todaySchedule = BEST_POSTING_TIMES.find(s => s.day === currentDay)
  if (todaySchedule) {
    const nextHour = todaySchedule.hours.find(h => h > currentHour)
    if (nextHour !== undefined) {
      const next = new Date(now)
      next.setHours(nextHour, 0, 0, 0)
      return next
    }
  }

  // Find next day with available slots
  for (let i = 1; i <= 7; i++) {
    const targetDay = (currentDay + i) % 7
    const schedule = BEST_POSTING_TIMES.find(s => s.day === targetDay)
    if (schedule && schedule.hours.length > 0) {
      const next = new Date(now)
      next.setDate(now.getDate() + i)
      next.setHours(schedule.hours[0], 0, 0, 0)
      return next
    }
  }

  // Fallback: tomorrow at 10am
  const fallback = new Date(now)
  fallback.setDate(now.getDate() + 1)
  fallback.setHours(10, 0, 0, 0)
  return fallback
}
