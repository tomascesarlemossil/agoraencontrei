/**
 * Next.js Middleware — Subdomain/Custom Domain Routing for Multi-tenant SaaS
 *
 * Detects tenant subdomains (e.g., parceiro.agoraencontrei.com.br) and
 * custom domains, rewriting requests to /_tenant/[slug] pages.
 * The main domain (www / naked / Vercel preview) passes through normally.
 */

import { NextRequest, NextResponse } from 'next/server'

const BASE_DOMAIN = 'agoraencontrei.com.br'

// Hosts that should always render the main site (not tenant)
const MAIN_HOSTS = [
  'agoraencontrei.com.br',
  'www.agoraencontrei.com.br',
  'localhost',
  'localhost:3000',
]

// Host suffixes that should pass through (Vercel previews, Railway, etc.)
const PASSTHROUGH_SUFFIXES = [
  '.vercel.app',
  '.vercel.sh',
  '.railway.app',
  '.netlify.app',
  '.ngrok.io',
  '.ngrok-free.app',
]

// Subdomains that should NOT be treated as tenants
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'app', 'mail', 'smtp', 'ftp', 'ns1', 'ns2',
  'dashboard', 'portal', 'blog', 'help', 'support', 'docs', 'status',
  'staging', 'dev', 'test', 'demo',
]

// Paths that should never be intercepted by tenant routing
const BYPASS_PATHS = [
  '/api/',
  '/_next/',
  '/_tenant/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap',
  '/health',
  '/images/',
  '/manifest.json',
]

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Skip static assets, API routes, and internal paths
  if (BYPASS_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const hostWithoutPort = hostname.split(':')[0]

  // Main domain — pass through to render main AgoraEncontrei site
  if (MAIN_HOSTS.includes(hostname) || MAIN_HOSTS.includes(hostWithoutPort)) {
    return NextResponse.next()
  }

  // Vercel preview, Railway, and other platform domains — pass through
  if (PASSTHROUGH_SUFFIXES.some(suffix => hostWithoutPort.endsWith(suffix))) {
    return NextResponse.next()
  }

  // Check for subdomain pattern: {slug}.agoraencontrei.com.br
  if (hostWithoutPort.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostWithoutPort.replace(`.${BASE_DOMAIN}`, '')
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
      const url = request.nextUrl.clone()
      url.pathname = `/_tenant/${subdomain}${pathname === '/' ? '' : pathname}`
      return NextResponse.rewrite(url)
    }
    // Reserved subdomain — pass through to main site
    return NextResponse.next()
  }

  // If host doesn't contain our base domain at all, it could be a custom domain
  // registered by a tenant. Rewrite to domain resolver.
  if (!hostWithoutPort.includes(BASE_DOMAIN)) {
    const url = request.nextUrl.clone()
    url.pathname = `/_tenant/_domain${pathname}`
    url.searchParams.set('__host', hostWithoutPort)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
