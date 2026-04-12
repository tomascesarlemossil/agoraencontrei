/**
 * Upload Proxy — forwards file uploads to the Fastify API server-side.
 *
 * The MediaEditorModal generates edited images via Canvas and needs to upload
 * them to S3. Direct browser→API uploads can fail with "Failed to fetch" due to
 * CORS, mixed content, or network configuration issues.
 *
 * This proxy accepts the file + auth token, forwards to the Fastify API
 * from the server side (same-origin from browser's perspective), and returns
 * the S3 URL.
 *
 * POST /api/upload-proxy
 * Headers: Authorization: Bearer <token>
 * Body: multipart/form-data with "file" field
 */
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const MAX_SIZE = 25 * 1024 * 1024 // 25MB (matches API limit)

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    // Forward to Fastify API
    const upstreamForm = new FormData()
    upstreamForm.append('file', file, file.name)

    const res = await fetch(`${API_URL}/api/v1/upload`, {
      method: 'POST',
      headers: { Authorization: authorization },
      body: upstreamForm,
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      return NextResponse.json(
        { error: 'Upload failed', status: res.status, details: errorBody.slice(0, 500) },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    const message = err?.message ?? 'Unknown error'
    return NextResponse.json(
      { error: 'Upload proxy error', message },
      { status: 502 },
    )
  }
}
