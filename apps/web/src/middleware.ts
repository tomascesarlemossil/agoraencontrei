/**
 * Next.js Middleware — Subdomain/Custom Domain Routing for Multi-tenant SaaS
 *
 * Detects tenant subdomains (e.g., parceiro.agoraencontrei.com.br) and
 * custom domains, rewriting requests to /_tenant/[slug] pages.
 * The main domain (www / naked) passes through normally.
 */

import { NextRequest, NextResponse } from 'next/server'

const MAIN_HOSTS = [
  'agoraencontrei.com.br',
  'www.agoraencontrei.com.br',
  'localhost',
  'localhost:3000',
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

  // Skip static assets and API routes
  if (BYPASS_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check if this is a subdomain of agoraencontrei.com.br
  const baseDomain = 'agoraencontrei.com.br'
  const hostWithoutPort = hostname.split(':')[0]

  // Main domain — pass through normally
  if (MAIN_HOSTS.includes(hostname) || MAIN_HOSTS.includes(hostWithoutPort)) {
    return NextResponse.next()
  }

  let tenantSlug: string | null = null

  // Check for subdomain pattern: {slug}.agoraencontrei.com.br
  if (hostWithoutPort.endsWith(`.${baseDomain}`)) {
    const subdomain = hostWithoutPort.replace(`.${baseDomain}`, '')
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
      tenantSlug = subdomain
    }
  }

  // If no subdomain match, this might be a custom domain
  // Custom domains are resolved by the /_tenant/[slug] page via API lookup
  if (!tenantSlug && !hostWithoutPort.includes(baseDomain)) {
    // Custom domain — rewrite to tenant resolver with the full hostname
    const url = request.nextUrl.clone()
    url.pathname = `/_tenant/_domain${pathname}`
    url.searchParams.set('__host', hostWithoutPort)
    return NextResponse.rewrite(url)
  }

  // Subdomain match — rewrite to tenant pages
  if (tenantSlug) {
    const url = request.nextUrl.clone()
    url.pathname = `/_tenant/${tenantSlug}${pathname === '/' ? '' : pathname}`
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
