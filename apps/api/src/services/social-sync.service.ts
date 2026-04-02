/**
 * Social Media Sync Service
 * Syncs Instagram posts and YouTube videos to the blog.
 *
 * Instagram accounts: @imobiliarialemos, @tomaslemosbr
 * YouTube channel: @imobiliarialemos
 *
 * Uses the Instagram Basic Display API and YouTube Data API v3
 * (or RSS feeds as fallback if no API keys configured)
 */

import { PrismaClient } from '@prisma/client'

interface InstagramMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
  username?: string
}

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  publishedAt: string
  videoId: string
  channelTitle: string
}

function slugify(text: string): string {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

function extractHashtags(caption: string): string {
  const tags = caption.match(/#[\w]+/g) ?? []
  return tags.map(t => t.slice(1)).join(', ')
}

function captionToExcerpt(caption: string, maxLen = 200): string {
  const clean = caption.replace(/#\w+/g, '').replace(/\n{2,}/g, '\n').trim()
  return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean
}

/**
 * Fetch Instagram posts via Basic Display API
 * Requires INSTAGRAM_ACCESS_TOKEN env var
 */
export async function fetchInstagramPosts(accessToken: string, limit = 20): Promise<InstagramMedia[]> {
  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username'
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Instagram API error: ${res.status}`)
    const data = await res.json()
    return data.data ?? []
  } catch (err) {
    console.error('[social-sync] Instagram fetch failed:', err)
    return []
  }
}

/**
 * Fetch YouTube videos via Data API v3
 * Requires YOUTUBE_API_KEY env var and channel ID/handle
 */
export async function fetchYouTubeVideos(apiKey: string, channelHandle: string, limit = 20): Promise<YouTubeVideo[]> {
  try {
    // First get channel ID from handle
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelHandle)}&type=channel&key=${apiKey}`
    const searchRes = await fetch(searchUrl)
    if (!searchRes.ok) throw new Error('YouTube channel search failed')
    const searchData = await searchRes.json()
    const channelId = searchData.items?.[0]?.id?.channelId
    if (!channelId) return []

    // Get recent videos
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${limit}&key=${apiKey}`
    const videosRes = await fetch(videosUrl)
    if (!videosRes.ok) throw new Error('YouTube videos fetch failed')
    const videosData = await videosRes.json()

    return (videosData.items ?? []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      publishedAt: item.snippet.publishedAt,
      videoId: item.id.videoId,
      channelTitle: item.snippet.channelTitle,
    }))
  } catch (err) {
    console.error('[social-sync] YouTube fetch failed:', err)
    return []
  }
}

/**
 * Sync Instagram posts to blog
 */
export async function syncInstagramToBlog(
  prisma: PrismaClient,
  companyId: string,
  accessToken: string,
  account: string,
): Promise<number> {
  const posts = await fetchInstagramPosts(accessToken)
  let synced = 0

  for (const post of posts) {
    if (post.media_type === 'VIDEO' || post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM') {
      const caption = post.caption ?? ''
      const title = caption.split('\n')[0]?.slice(0, 100) || `Post do Instagram — ${new Date(post.timestamp).toLocaleDateString('pt-BR')}`
      const excerpt = captionToExcerpt(caption)
      const tags = extractHashtags(caption)
      const baseSlug = slugify(title) || `instagram-${post.id}`

      // Check if already synced
      const existing = await prisma.blogPost.findFirst({
        where: { companyId, sourceUrl: post.permalink },
      })
      if (existing) continue

      // Find unique slug
      let slug = baseSlug
      let i = 1
      while (await prisma.blogPost.findFirst({ where: { companyId, slug } })) {
        slug = `${baseSlug}-${i++}`
      }

      await prisma.blogPost.create({
        data: {
          companyId,
          title,
          slug,
          excerpt,
          content: `<p>${caption.replace(/\n/g, '<br />')}</p>\n<p><a href="${post.permalink}" target="_blank" rel="noopener">Ver no Instagram @${account}</a></p>`,
          coverImage: post.media_type === 'VIDEO' ? (post.thumbnail_url ?? null) : (post.media_url ?? null),
          category: 'noticias',
          tags: tags ? `${tags}, instagram, imobiliária lemos` : 'instagram, imobiliária lemos',
          source: `Instagram @${account}`,
          sourceUrl: post.permalink,
          isAutoImported: true,
          published: true,
          publishedAt: new Date(post.timestamp),
          featured: false,
          authorName: `@${account}`,
          seoTitle: title.slice(0, 60),
          seoDescription: excerpt.slice(0, 155),
          seoKeywords: `imóveis franca, ${tags}`,
        },
      })
      synced++
    }
  }

  return synced
}

/**
 * Sync YouTube videos to blog
 */
export async function syncYouTubeToBlog(
  prisma: PrismaClient,
  companyId: string,
  apiKey: string,
  channelHandle: string,
): Promise<number> {
  const videos = await fetchYouTubeVideos(apiKey, channelHandle)
  let synced = 0

  for (const video of videos) {
    // Check if already synced
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`
    const existing = await prisma.blogPost.findFirst({
      where: { companyId, sourceUrl: youtubeUrl },
    })
    if (existing) continue

    const title = video.title.slice(0, 100)
    const excerpt = video.description.slice(0, 200) + (video.description.length > 200 ? '...' : '')
    const baseSlug = slugify(title) || `youtube-${video.videoId}`
    let slug = baseSlug
    let i = 1
    while (await prisma.blogPost.findFirst({ where: { companyId, slug } })) {
      slug = `${baseSlug}-${i++}`
    }

    await prisma.blogPost.create({
      data: {
        companyId,
        title,
        slug,
        excerpt,
        content: `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:16px"><iframe src="https://www.youtube.com/embed/${video.videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>\n<p>${video.description.replace(/\n/g, '<br />')}</p>`,
        coverImage: video.thumbnailUrl || null,
        category: 'noticias',
        tags: 'youtube, video, imobiliária lemos, imóveis franca',
        source: `YouTube — ${video.channelTitle}`,
        sourceUrl: youtubeUrl,
        isAutoImported: true,
        published: true,
        publishedAt: new Date(video.publishedAt),
        featured: false,
        authorName: video.channelTitle,
        seoTitle: title.slice(0, 60),
        seoDescription: excerpt.slice(0, 155),
        seoKeywords: 'imóveis franca, imobiliária lemos, video',
      },
    })
    synced++
  }

  return synced
}
