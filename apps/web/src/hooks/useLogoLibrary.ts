'use client'

/**
 * useLogoLibrary — client hook for the multi-logo watermark library.
 *
 * Talks to `/api/v1/photo-editor/logos/*` on the backend (which proxies
 * to the FastAPI image-processor). Exposes the full CRUD the Settings UI
 * and the MediaEditorModal need:
 *   list      - GET  /logos
 *   upload    - POST /logos (multipart: file + optional name)
 *   rename    - PATCH /logos/:id { name }
 *   setDefault- PATCH /logos/:id { is_default: true }
 *   remove    - DELETE /logos/:id
 *
 * Every mutation refreshes the list so the UI stays in sync with the
 * backend without manual re-fetching from callers.
 */
import { useCallback, useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export interface LogoRecord {
  id: string
  name: string
  mime: string
  originalMime: string | null
  width: number | null
  height: number | null
  bytes: number | null
  isDefault: boolean
  createdAt: string
  /** Relative URL served by the API proxy. Prefix with API_URL for <img src>. */
  url: string
}

export interface UseLogoLibrary {
  logos: LogoRecord[]
  defaultLogo: LogoRecord | undefined
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  upload: (file: File, name?: string) => Promise<LogoRecord>
  rename: (id: string, newName: string) => Promise<void>
  setDefault: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  /** Absolute URL for an <img src> — useful inside Canvas editors. */
  fileUrl: (id: string) => string
}

/** Absolute URL for the raw PNG bytes of a logo, used as <img src>. */
function buildFileUrl(id: string): string {
  return `${API_URL}/api/v1/photo-editor/logos/${encodeURIComponent(id)}/file`
}

export function useLogoLibrary(token: string | null | undefined): UseLogoLibrary {
  const [logos, setLogos] = useState<LogoRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authHeaders = useCallback((extra?: Record<string, string>): Record<string, string> => {
    const headers: Record<string, string> = { ...(extra || {}) }
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }, [token])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/v1/photo-editor/logos`, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(detail || `HTTP ${res.status}`)
      }
      const data = await res.json() as { logos: LogoRecord[] }
      setLogos(Array.isArray(data?.logos) ? data.logos : [])
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar logos')
      setLogos([])
    } finally {
      setLoading(false)
    }
  }, [authHeaders])

  useEffect(() => { refresh() }, [refresh])

  const upload = useCallback(async (file: File, name?: string): Promise<LogoRecord> => {
    const form = new FormData()
    form.append('file', file, file.name)
    if (name) form.append('name', name)
    const res = await fetch(`${API_URL}/api/v1/photo-editor/logos`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
    if (!res.ok) {
      // Surface server error detail (e.g. "Formato nao suportado") so the
      // UI can tell the user exactly what went wrong.
      const payload = await res.json().catch(() => ({})) as { detail?: string; error?: string }
      throw new Error(payload?.detail || payload?.error || `HTTP ${res.status}`)
    }
    const rec = await res.json() as LogoRecord
    await refresh()
    return rec
  }, [authHeaders, refresh])

  const patch = useCallback(async (id: string, body: Record<string, unknown>): Promise<void> => {
    const res = await fetch(`${API_URL}/api/v1/photo-editor/logos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({})) as { detail?: string; error?: string }
      throw new Error(payload?.detail || payload?.error || `HTTP ${res.status}`)
    }
    await refresh()
  }, [authHeaders, refresh])

  const rename = useCallback((id: string, newName: string) => patch(id, { name: newName }), [patch])
  const setDefault = useCallback((id: string) => patch(id, { is_default: true }), [patch])

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/v1/photo-editor/logos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({})) as { detail?: string; error?: string }
      throw new Error(payload?.detail || payload?.error || `HTTP ${res.status}`)
    }
    await refresh()
  }, [authHeaders, refresh])

  const defaultLogo = logos.find(l => l.isDefault)

  return {
    logos,
    defaultLogo,
    loading,
    error,
    refresh,
    upload,
    rename,
    setDefault,
    remove,
    fileUrl: buildFileUrl,
  }
}

/**
 * Returns the absolute URL of a logo id so non-hook callers (e.g. utility
 * functions inside MediaEditorModal) can still build `<img src>` for canvas.
 */
export function logoFileUrl(id: string): string {
  return buildFileUrl(id)
}
