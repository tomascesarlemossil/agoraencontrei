'use client'

/**
 * PropertyPicker — reusable selector that lets the operator pick an
 * existing property by typing its reference code, address or title,
 * and then pick one (or several) of the photos already published on
 * that property.
 *
 * Replaces flows that used to ask the user to paste the property cuid
 * and each photo URL by hand, e.g. in /dashboard/ai-visual.
 *
 * Props:
 *   - token          JWT (obtained via useAuth().getValidToken())
 *   - multiple       false (default) → onPick(property, [singlePhoto])
 *                    true            → user can tick multiple photos
 *   - allowNoPhoto   when true the component renders the property list
 *                    only, without requiring a photo choice (handy for
 *                    flows that only need the property id).
 *   - onPick         called with { property, photoUrls[] }
 *   - onClose        called when the user dismisses the picker
 *
 * Search hits /api/v1/properties?search=<q> — the same endpoint used by
 * the properties grid, so nothing else needs to change server-side.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, X, Check, Loader2, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface PropertyLite {
  id: string
  title?: string | null
  reference?: string | null
  slug?: string | null
  city?: string | null
  neighborhood?: string | null
  street?: string | null
  number?: string | null
  type?: string | null
  status?: string | null
  coverImage?: string | null
  images?: string[] | null
  photos?: string[] | null
}

interface PropertyDetail extends PropertyLite {
  images?: string[] | null
  photos?: string[] | null
}

interface Props {
  token: string | null | undefined
  multiple?: boolean
  allowNoPhoto?: boolean
  onPick: (payload: { property: PropertyLite; photoUrls: string[] }) => void
  onClose?: () => void
  /** Texto do botão de ação (default "Usar"). */
  confirmLabel?: string
}

export function PropertyPicker({
  token, multiple = false, allowNoPhoto = false, onPick, onClose, confirmLabel = 'Usar',
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PropertyLite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<PropertyLite | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [photos, setPhotos] = useState<string[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  const authHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {}
    if (token) h.Authorization = `Bearer ${token}`
    return h
  }, [token])

  // Debounced search so every keystroke doesn't hit the API.
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return }
    const handle = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ search: query.trim(), limit: '20' })
        const res = await fetch(`${API_URL}/api/v1/properties?${params}`, { headers: authHeaders })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const list: PropertyLite[] = data?.data ?? data?.items ?? []
        setResults(list)
      } catch (e: any) {
        setError(e?.message || 'Erro ao buscar')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [query, authHeaders])

  // When a property is selected, fetch the detailed view (has the full
  // photo array; the list endpoint usually only returns `coverImage`).
  const loadPhotos = useCallback(async (prop: PropertyLite) => {
    setLoadingPhotos(true)
    setPhotos([])
    setSelectedPhotos(new Set())
    try {
      const res = await fetch(`${API_URL}/api/v1/properties/by-id/${prop.id}`, { headers: authHeaders })
      if (res.ok) {
        const detail = await res.json() as PropertyDetail
        const list = (detail.images?.length ? detail.images : detail.photos) || []
        const merged = Array.from(new Set([
          ...(prop.coverImage ? [prop.coverImage] : []),
          ...list,
        ])).filter(Boolean)
        setPhotos(merged)
      } else if (prop.coverImage) {
        setPhotos([prop.coverImage])
      }
    } catch {
      if (prop.coverImage) setPhotos([prop.coverImage])
    } finally {
      setLoadingPhotos(false)
    }
  }, [authHeaders])

  const handleSelectProperty = (prop: PropertyLite) => {
    setSelected(prop)
    loadPhotos(prop)
  }

  const togglePhoto = (url: string) => {
    setSelectedPhotos(prev => {
      const next = new Set(prev)
      if (multiple) {
        if (next.has(url)) next.delete(url)
        else next.add(url)
      } else {
        next.clear()
        next.add(url)
      }
      return next
    })
  }

  const canConfirm = !!selected && (allowNoPhoto || selectedPhotos.size > 0)

  const handleConfirm = () => {
    if (!selected) return
    onPick({
      property: selected,
      photoUrls: Array.from(selectedPhotos),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-semibold text-white">Selecionar imóvel</h3>
            <p className="text-xs text-white/50 mt-0.5">
              Busca por código, endereço, bairro, cidade ou título.
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/50 hover:text-white p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ex: REF-001, Jardim América, Rua Voluntários, casa com piscina…"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-yellow-400/50"
            />
          </div>
          {error && (
            <p className="text-xs text-red-300 mt-2">{error}</p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* If a property is selected, show the photo grid. Else, show the search results. */}
          {selected ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40">Imóvel selecionado</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {selected.reference && <span className="text-yellow-400 mr-2">{selected.reference}</span>}
                    {selected.title ?? 'Sem título'}
                  </p>
                  <p className="text-xs text-white/50">
                    {[selected.street, selected.number, selected.neighborhood, selected.city].filter(Boolean).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => { setSelected(null); setPhotos([]); setSelectedPhotos(new Set()) }}
                  className="text-xs text-white/60 hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/30"
                >
                  Trocar
                </button>
              </div>

              {allowNoPhoto && selectedPhotos.size === 0 && (
                <p className="text-[11px] text-white/40">
                  Clique em &quot;{confirmLabel}&quot; se só precisar do imóvel; selecione fotos abaixo se quiser aplicar a ação em mídias específicas.
                </p>
              )}

              {loadingPhotos ? (
                <div className="flex items-center justify-center py-8 text-white/50 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando fotos…
                </div>
              ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-white/40 text-xs gap-2">
                  <ImageOff className="w-8 h-8" />
                  <p>Este imóvel ainda não tem fotos publicadas.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {photos.map(url => {
                      const isSelected = selectedPhotos.has(url)
                      return (
                        <button
                          key={url}
                          type="button"
                          onClick={() => togglePhoto(url)}
                          className={cn(
                            'relative aspect-square rounded-lg overflow-hidden border-2 transition',
                            isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/40' : 'border-white/10 hover:border-white/30',
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-yellow-400 text-black rounded-full p-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-white/40 mt-1">
                    {multiple
                      ? `${selectedPhotos.size} foto${selectedPhotos.size === 1 ? '' : 's'} selecionada${selectedPhotos.size === 1 ? '' : 's'}`
                      : 'Clique em uma foto para selecioná-la.'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-white/50 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Buscando…
                </div>
              ) : query.trim().length < 2 ? (
                <p className="text-sm text-white/40 text-center py-8">
                  Digite pelo menos 2 caracteres para começar a buscar.
                </p>
              ) : results.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-8">
                  Nenhum imóvel encontrado para &quot;{query}&quot;.
                </p>
              ) : (
                <ul className="space-y-2">
                  {results.map(r => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectProperty(r)}
                        className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg p-2.5 text-left transition"
                      >
                        <div className="w-14 h-14 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                          {r.coverImage ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={r.coverImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                              <ImageOff className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {r.reference && (
                              <span className="text-[11px] text-yellow-400 font-mono">{r.reference}</span>
                            )}
                            {r.status && (
                              <span className="text-[10px] uppercase tracking-wider text-white/40">{r.status}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white truncate">
                            {r.title ?? 'Sem título'}
                          </p>
                          <p className="text-xs text-white/50 truncate">
                            {[r.street, r.number, r.neighborhood, r.city].filter(Boolean).join(', ') || '—'}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-white/10">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-white/70 hover:text-white rounded border border-white/10 hover:border-white/30"
            >
              Cancelar
            </button>
          )}
          <button
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded transition',
              canConfirm
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : 'bg-white/10 text-white/40 cursor-not-allowed',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
