import { NextResponse } from 'next/server'

/**
 * Direct /health endpoint for Railway healthcheck.
 * Returns 200 OK immediately — no proxy, no external dependency.
 */
export async function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'web', timestamp: new Date().toISOString() },
    { status: 200 }
  )
}
