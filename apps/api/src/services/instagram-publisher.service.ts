/**
 * Instagram Graph API Publisher
 * Posts property images to Instagram Business account
 *
 * Requires:
 * - INSTAGRAM_BUSINESS_ACCOUNT_ID: Instagram Business Account ID (not page ID)
 * - INSTAGRAM_PAGE_ACCESS_TOKEN: Long-lived Page Access Token with instagram_content_publish scope
 *
 * How to get Instagram Business Account ID:
 * GET https://graph.facebook.com/v25.0/me/accounts?access_token={token}
 * Then: GET https://graph.facebook.com/v25.0/{page-id}?fields=instagram_business_account&access_token={token}
 */

import { env } from '../utils/env.js'

const FB_API = 'https://graph.facebook.com/v25.0'

interface PublishResult {
  success: boolean
  postId?: string
  permalink?: string
  error?: string
}

/**
 * Step 1: Create a media container
 */
async function createMediaContainer(
  igUserId: string,
  token: string,
  imageUrl: string,
  caption: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: token,
  })
  const res = await fetch(`${FB_API}/${igUserId}/media`, {
    method: 'POST',
    body: params,
  })
  const data = await res.json()
  if (!res.ok || !data.id) {
    throw new Error(`Container creation failed: ${JSON.stringify(data)}`)
  }
  return data.id
}

/**
 * Step 2: Publish the container
 */
async function publishContainer(
  igUserId: string,
  token: string,
  containerId: string,
): Promise<string> {
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: token,
  })
  const res = await fetch(`${FB_API}/${igUserId}/media_publish`, {
    method: 'POST',
    body: params,
  })
  const data = await res.json()
  if (!res.ok || !data.id) {
    throw new Error(`Publish failed: ${JSON.stringify(data)}`)
  }
  return data.id
}

/**
 * Get post permalink
 */
async function getPermalink(mediaId: string, token: string): Promise<string> {
  const res = await fetch(`${FB_API}/${mediaId}?fields=permalink&access_token=${token}`)
  const data = await res.json()
  return data.permalink ?? ''
}

/**
 * Get Instagram Business Account ID from a Page Access Token + Facebook Page ID
 */
export async function getInstagramBusinessAccountId(pageAccessToken: string, facebookPageId: string): Promise<string | null> {
  try {
    const res = await fetch(`${FB_API}/${facebookPageId}?fields=instagram_business_account&access_token=${pageAccessToken}`)
    const data = await res.json()
    return data.instagram_business_account?.id ?? null
  } catch {
    return null
  }
}

/**
 * Main publish function
 * Posts a single image with caption to Instagram
 */
export async function publishPropertyToInstagram(
  imageUrl: string,
  fullCaption: string, // caption + hashtags
  igUserId: string,
  token: string,
): Promise<PublishResult> {
  try {
    // 1. Create media container
    const containerId = await createMediaContainer(igUserId, token, imageUrl, fullCaption)
    if (!containerId) throw new Error('No container ID returned')

    // 2. Wait 5 seconds (Instagram recommends a brief delay)
    await new Promise(r => setTimeout(r, 5000))

    // 3. Publish
    const mediaId = await publishContainer(igUserId, token, containerId)

    // 4. Get permalink
    const permalink = await getPermalink(mediaId, token)

    return { success: true, postId: mediaId, permalink }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Carousel post (multiple images)
 */
export async function publishCarouselToInstagram(
  imageUrls: string[],
  fullCaption: string,
  igUserId: string,
  token: string,
): Promise<PublishResult> {
  try {
    if (imageUrls.length < 2) {
      return publishPropertyToInstagram(imageUrls[0], fullCaption, igUserId, token)
    }

    // Create containers for each image (max 10)
    const urls = imageUrls.slice(0, 10)
    const containerIds: string[] = []

    for (const url of urls) {
      const params = new URLSearchParams({
        image_url: url,
        is_carousel_item: 'true',
        access_token: token,
      })
      const res = await fetch(`${FB_API}/${igUserId}/media`, { method: 'POST', body: params })
      const data = await res.json()
      if (data.id) containerIds.push(data.id)
    }

    if (containerIds.length < 2) throw new Error('Not enough valid images for carousel')

    // Create carousel container
    const carouselParams = new URLSearchParams({
      media_type: 'CAROUSEL',
      children: containerIds.join(','),
      caption: fullCaption,
      access_token: token,
    })
    const carouselRes = await fetch(`${FB_API}/${igUserId}/media`, { method: 'POST', body: carouselParams })
    const carouselData = await carouselRes.json()
    if (!carouselData.id) throw new Error(`Carousel creation failed: ${JSON.stringify(carouselData)}`)

    await new Promise(r => setTimeout(r, 5000))

    const mediaId = await publishContainer(igUserId, token, carouselData.id)
    const permalink = await getPermalink(mediaId, token)

    return { success: true, postId: mediaId, permalink }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// Re-export env for convenience (used in routes)
export { env }
