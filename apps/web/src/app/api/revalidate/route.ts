import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// On-demand ISR revalidation endpoint
// Called by dashboard after photo/settings/property changes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paths, secret } = body

    // Validate secret to prevent unauthorized revalidation
    const expectedSecret = process.env.REVALIDATION_SECRET || 'agoraencontrei-revalidate-2026'
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'paths array required' }, { status: 400 })
    }

    // Revalidate each path
    const revalidated: string[] = []
    for (const path of paths) {
      if (typeof path === 'string' && path.startsWith('/')) {
        revalidatePath(path)
        revalidated.push(path)
      }
    }

    return NextResponse.json({
      revalidated: true,
      paths: revalidated,
      timestamp: Date.now(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
