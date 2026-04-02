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
 * Uses uploads playlist pagination to retrieve ALL videos from the channel.
 *
 * Fallback: YouTube RSS feed (free, no key required, ~15 most recent videos)
 */
export async function fetchYouTubeVideos(apiKeyOrNull: string | null, channelId: string, limit = 500): Promise<YouTubeVideo[]> {
  // Primary: YouTube Data API v3 — uploads playlist with full pagination
  if (apiKeyOrNull) {
    try {
      // Step 1: Get uploads playlist ID
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKeyOrNull}`
      )
      if (!channelRes.ok) throw new Error(`YouTube channels API error: ${channelRes.status}`)
      const channelData = await channelRes.json()
      if (channelData.error) throw new Error(channelData.error.message)
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
      if (!uploadsPlaylistId) throw new Error('Could not find uploads playlist')

      // Step 2: Paginate through the uploads playlist (50 per page)
      const videos: YouTubeVideo[] = []
      let pageToken: string | undefined

      do {
        const pageParam = pageToken ? `&pageToken=${pageToken}` : ''
        const playlistRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50${pageParam}&key=${apiKeyOrNull}`
        )
        if (!playlistRes.ok) throw new Error(`YouTube playlistItems API error: ${playlistRes.status}`)
        const playlistData = await playlistRes.json()
        if (playlistData.error) throw new Error(playlistData.error.message)

        for (const item of playlistData.items ?? []) {
          const snippet = item.snippet
          const videoId = snippet?.resourceId?.videoId
          if (!videoId) continue
          videos.push({
            id: videoId,
            title: snippet.title ?? '',
            description: snippet.description ?? '',
            thumbnailUrl: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            publishedAt: snippet.publishedAt ?? new Date().toISOString(),
            videoId,
            channelTitle: snippet.videoOwnerChannelTitle ?? 'Imobiliária Lemos',
          })
          if (videos.length >= limit) break
        }

        pageToken = videos.length < limit ? playlistData.nextPageToken : undefined
      } while (pageToken)

      console.log(`[social-sync] YouTube API fetched ${videos.length} videos`)
      return videos
    } catch (err) {
      console.error('[social-sync] YouTube API failed, falling back to RSS:', err)
    }
  }

  // Fallback: YouTube RSS feed (free, no key required, limited to ~15 videos)
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const rssRes = await fetch(rssUrl, { headers: { 'Accept': 'application/atom+xml,application/xml,text/xml' } })
    if (!rssRes.ok) throw new Error(`RSS fetch error: ${rssRes.status}`)
    const xml = await rssRes.text()

    // Parse XML entries manually (lightweight, no dependency)
    const entries: YouTubeVideo[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match
    while ((match = entryRegex.exec(xml)) !== null && entries.length < limit) {
      const entry = match[1]
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? ''
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? new Date().toISOString()
      const description = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1]?.slice(0, 500) ?? ''
      const thumbnail = entry.match(/url="(https:\/\/i\.ytimg\.com[^"]+)"/)?.[1] ?? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      const channelTitle = xml.match(/<author>\s*<name>(.*?)<\/name>/)?.[1] ?? 'Imobiliária Lemos'
      if (videoId) {
        entries.push({ id: videoId, title, description, thumbnailUrl: thumbnail, publishedAt: published, videoId, channelTitle })
      }
    }
    return entries
  } catch (err) {
    console.error('[social-sync] YouTube RSS fallback failed:', err)
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
 * apiKey is optional — falls back to RSS feed (channel_id=UCKpTcdWhQZIPMX8EF_nNckw)
 */
export async function syncYouTubeToBlog(
  prisma: PrismaClient,
  companyId: string,
  apiKey: string | null,
  channelId: string,
): Promise<number> {
  const videos = await fetchYouTubeVideos(apiKey, channelId)
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
