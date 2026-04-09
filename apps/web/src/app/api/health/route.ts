import { NextResponse } from 'next/server'

/** Simple health endpoint for Railway healthcheck — always returns 200 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
