/**
 * Image Proxy — serves external images as same-origin for Canvas operations.
 *
 * The MediaEditorModal uses Canvas to apply filters and logo overlays.
 * Canvas requires images to be same-origin or served with CORS headers.
 * S3/Cloudinary images often lack proper CORS, causing "Load failed".
 * This proxy fetches the image server-side and returns it, making it same-origin.
 *
 * GET /api/proxy-image?url=https://...
 */
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = [
  '.amazonaws.com',
  '.cloudinary.com',
  '.cloudfront.net',
  'res.cloudinary.com',
  'agoraencontrei.com.br',
  'localhost',
]

const MAX_SIZE = 15 * 1024 * 1024 // 15MB

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Only allow known image hosts
  const isAllowed = ALLOWED_HOSTS.some(h => parsed.hostname.endsWith(h) || parsed.hostname === h)
  if (!isAllowed) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'image/*' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 })
    }

    const contentType = res.headers.get('Content-Type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 })
    }

    const contentLength = Number(res.headers.get('Content-Length') || 0)
    if (contentLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch image', details: err.message },
      { status: 502 },
    )
  }
}
