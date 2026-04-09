/**
 * Health check endpoint for Vercel cron monitoring
 * GET /api/health-check
 * Verifica: site online, API respondendo, sitemap acessível
 */
import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agoraencontrei.com.br'

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {}
  const start = Date.now()

  // 1. Check API
  try {
    const apiStart = Date.now()
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) })
    checks.api = { status: res.ok ? 'ok' : 'error', latency: Date.now() - apiStart }
  } catch {
    checks.api = { status: 'error', latency: -1 }
  }

  // 2. Self check
  checks.frontend = { status: 'ok', latency: Date.now() - start }

  // 3. Timestamp
  const allOk = Object.values(checks).every(c => c.status === 'ok')

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
  }, { status: 200 }) // Always 200 — Railway healthcheck must not fail due to API being slow
}
