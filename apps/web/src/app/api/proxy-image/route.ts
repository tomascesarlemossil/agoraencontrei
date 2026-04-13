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

// Whitelist de hosts de imagens externas. IMPORTANTE: não incluir hosts
// internos (localhost, 127.0.0.1, *.internal, 10.*, 172.16-31.*, 192.168.*)
// para evitar SSRF de rede privada.
//
// Cobre os provedores de storage usados pelo sistema:
// - AWS S3 (qualquer região) via .amazonaws.com
// - Cloudinary via .cloudinary.com
// - AWS CloudFront via .cloudfront.net
// - Supabase Storage (legacy) via .supabase.co / .supabase.in
// - Google Cloud Storage via storage.googleapis.com
// - Google Photos / avatars via lh3.googleusercontent.com
// - CDN próprio / parceiro (cdnuso.com, cdn2.uso.com.br)
// - Logos/imagens hospedadas em agoraencontrei.com.br
const ALLOWED_HOSTS = [
  '.amazonaws.com',
  '.cloudinary.com',
  '.cloudfront.net',
  '.supabase.co',
  '.supabase.in',
  'res.cloudinary.com',
  'storage.googleapis.com',
  'agoraencontrei.com.br',
  '.agoraencontrei.com.br',
  'cdnuso.com',
  'cdn2.uso.com.br',
  'lh3.googleusercontent.com',
]

const MAX_SIZE = 15 * 1024 * 1024 // 15MB

// Bloqueia ranges privados / loopback / link-local — defesa SSRF adicional,
// mesmo que a whitelist já proteja (defense in depth).
function isPrivateOrLoopback(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '0.0.0.0') return true
  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return true
  // IPv4
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [, a, b] = ipv4.map(Number)
    if (a === 10) return true
    if (a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 0) return true
  }
  // IPv6 loopback / link-local
  if (hostname === '::1' || hostname.startsWith('[::1') || hostname.startsWith('[fc') || hostname.startsWith('[fd') || hostname.startsWith('[fe80')) return true
  return false
}

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

  // Só HTTP(S) — bloqueia file:, gopher:, etc
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Protocol not allowed' }, { status: 400 })
  }

  // Bloqueia ranges privados / loopback antes mesmo de olhar a whitelist
  if (isPrivateOrLoopback(parsed.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
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
