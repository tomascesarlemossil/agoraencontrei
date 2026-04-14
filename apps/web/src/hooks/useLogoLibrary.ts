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

/**
 * Turn the raw `{error, detail}` payload the API proxy forwards from the
 * image-processor into something an operator can act on. Two scenarios
 * dominate in production:
 *   1. IMAGE_PROCESSOR_TOKEN not set on the Python service → 503.
 *   2. IMAGE_PROCESSOR_URL not set on the API → the Node fetch fails.
 * Both come back as 503/IMAGE_PROCESSOR_UNAVAILABLE; we inspect `detail`
 * to tell them apart.
 */
function humanizeProcessorError(status: number, payload: { error?: string; detail?: string }): string {
  const detail = (payload.detail || '').toString()
  const error = (payload.error || '').toString()

  if (detail.includes('IMAGE_PROCESSOR_TOKEN nao configurado') || detail.includes('IMAGE_PROCESSOR_TOKEN not configured')) {
    return 'O microserviço de imagens ainda não foi configurado no Railway (falta IMAGE_PROCESSOR_TOKEN). Peça ao admin para definir essa variável nos serviços api e image-processor.'
  }
  if (detail.includes('Token invalido') || detail.includes('Token inválido') || detail.includes('HTTP 401')) {
    return 'Os tokens do microserviço de imagens estão diferentes entre api e image-processor. Configure IMAGE_PROCESSOR_TOKEN com o MESMO valor nos dois serviços do Railway.'
  }
  if (detail.includes('ECONNREFUSED') || detail.includes('fetch failed') || detail.includes('localhost:3200')) {
    return 'A api não consegue alcançar o microserviço de imagens. Configure IMAGE_PROCESSOR_URL no Railway (ex: http://image-processor.railway.internal:3200).'
  }
  if (status === 401 || status === 403) {
    return 'Sessão expirada. Faça login novamente.'
  }
  if (error === 'IMAGE_PROCESSOR_UNAVAILABLE') {
    return `Microserviço de imagens indisponível: ${detail || 'causa desconhecida'}.`
  }
  return detail || error || `HTTP ${status}`
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
        // The API proxy forwards the underlying processor error as a JSON
        // body like `{"error":"IMAGE_PROCESSOR_UNAVAILABLE","detail":"..."}`.
        // Unpack it so the UI can show operators an actionable message
        // instead of a stringified object.
        const payload = await res.json().catch(async () => ({ error: await res.text() })) as { error?: string; detail?: string }
        throw new Error(humanizeProcessorError(res.status, payload))
      }
      const data = await res.json() as { logos: LogoRecord[] }
      setLogos(Array.isArray(data?.logos) ? data.logos : [])
    } catch (e: any) {
      // Network failures come through here as TypeError. Any Error we threw
      // above already has a user-friendly message — just propagate it.
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
      throw new Error(humanizeProcessorError(res.status, payload))
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
