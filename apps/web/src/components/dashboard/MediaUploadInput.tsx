'use client'

/**
 * MediaUploadInput — reusable upload + URL-paste combo for any media
 * field in the dashboard (Hero de fundo, Apresentação, capas, etc.).
 *
 * Accepts BOTH flows:
 *   1. Upload direto — arrasta ou clica, envia para POST /api/v1/upload
 *      (o mesmo endpoint S3/base64 que já usa na edição de fotos).
 *   2. Colar URL — funciona como antes, útil para YouTube ou links
 *      externos.
 *
 * Aceita por padrão qualquer imagem ou vídeo, com cap de 100 MB — o
 * que o backend aceita. Lista ajustável via `accept` prop.
 *
 * Surface intencionalmente pequena: props combinam bem com o estado
 * "value" de qualquer form (string url) — plug-and-play.
 */
import { useCallback, useRef, useState } from 'react'
import { UploadCloud, Link as LinkIcon, Loader2, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export type MediaKind = 'image' | 'video' | 'any'

interface Props {
  label?: string
  hint?: string
  value: string
  onChange: (url: string) => void
  /** Tipo aceito. 'any' = image/* + video/*. */
  kind?: MediaKind
  /** Token JWT para autenticar o upload. */
  token: string | null | undefined
  /** Opcional: callback quando o arquivo real (com mime) terminar de subir. */
  onUploaded?: (info: { url: string; contentType: string; size: number }) => void
  /** Texto do input quando vazio. */
  placeholder?: string
  /** Dark theme (casa com o SystemConfigPanel). Default true. */
  dark?: boolean
}

const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  image: 'image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp,image/tiff',
  video: 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska',
  any: 'image/*,video/*',
}

function isVideoUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('data:video/')) return true
  // YouTube/Vimeo são "vídeo" mas o Hero trata via iframe separado.
  return /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(url)
}

export function MediaUploadInput({
  label,
  hint,
  value,
  onChange,
  kind = 'any',
  token,
  onUploaded,
  placeholder = 'Cole uma URL ou envie um arquivo',
  dark = true,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file, file.name)
      const res = await fetch(`${API_URL}/api/v1/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { message?: string; error?: string }
        throw new Error(payload.message || payload.error || `HTTP ${res.status}`)
      }
      const data = await res.json() as { url: string; contentType: string; size: number }
      onChange(data.url)
      onUploaded?.(data)
    } catch (e: any) {
      setUploadError(e?.message || 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [token, onChange, onUploaded])

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }, [handleFile])

  const clear = () => {
    onChange('')
    setUploadError(null)
  }

  const hasValue = !!value
  const previewKind = hasValue && isVideoUrl(value) ? 'video' : 'image'

  const inputCls = dark
    ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-yellow-400/50'
    : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400'
  const dropCls = dark
    ? (dragActive ? 'border-yellow-400/70 bg-yellow-400/10' : 'border-white/15 hover:border-white/30 bg-white/5')
    : (dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50')

  return (
    <div className="space-y-2">
      {label && (
        <label className={cn('block text-xs font-semibold mb-1', dark ? 'text-white/70' : 'text-gray-600')}>
          {label}
        </label>
      )}

      {/* Linha de URL + botão de upload */}
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <LinkIcon className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
            dark ? 'text-white/40' : 'text-gray-400',
          )} />
          <input
            type="url"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition',
              inputCls,
            )}
          />
          {hasValue && (
            <button
              type="button"
              onClick={clear}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition',
                dark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
              )}
              aria-label="Limpar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex items-center gap-1.5 px-3 rounded-xl text-sm font-medium transition flex-shrink-0',
            dark
              ? 'bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200',
            uploading && 'opacity-60 cursor-not-allowed',
          )}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          {uploading ? 'Enviando…' : 'Enviar arquivo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_BY_KIND[kind]}
          className="hidden"
          onChange={onFileInputChange}
        />
      </div>

      {/* Drag & drop area — aparece só quando não há valor, pra não
          atrapalhar o preview quando já tem. */}
      {!hasValue && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition',
            dropCls,
          )}
        >
          <UploadCloud className={cn('w-6 h-6 mx-auto mb-1', dark ? 'text-white/50' : 'text-gray-400')} />
          <div className={cn('text-xs', dark ? 'text-white/60' : 'text-gray-500')}>
            Arraste um arquivo aqui ou clique para escolher
          </div>
          <div className={cn('text-[10px] mt-0.5', dark ? 'text-white/40' : 'text-gray-400')}>
            {kind === 'image'
              ? 'PNG, JPG, WEBP, AVIF, GIF, BMP, TIFF'
              : kind === 'video'
              ? 'MP4, WEBM, MOV, AVI, MKV'
              : 'Imagens (PNG/JPG/WEBP/…) ou vídeos (MP4/WEBM/MOV/…)'}
          </div>
        </div>
      )}

      {/* Preview — respeita image vs video */}
      {hasValue && (
        <div className={cn('rounded-xl overflow-hidden border', dark ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-gray-50')}>
          {previewKind === 'video' ? (
            <video
              src={value}
              className="w-full max-h-48 object-cover bg-black"
              controls
              muted
              playsInline
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={value}
              alt="Preview"
              className="w-full max-h-48 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
      )}

      {uploadError && (
        <div className={cn(
          'flex items-start gap-2 text-xs rounded-lg px-3 py-2',
          dark ? 'bg-red-500/10 border border-red-500/30 text-red-300' : 'bg-red-50 border border-red-200 text-red-700',
        )}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {hint && (
        <p className={cn('text-[10px]', dark ? 'text-white/40' : 'text-gray-400')}>{hint}</p>
      )}
    </div>
  )
}
