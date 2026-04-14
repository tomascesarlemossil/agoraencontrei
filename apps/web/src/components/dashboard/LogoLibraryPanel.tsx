'use client'

/**
 * LogoLibraryPanel — Settings UI for the multi-logo watermark library.
 *
 * Capabilities (matches the user's requirements):
 *   • Aceita qualquer formato (PNG, JPG, JPEG, WEBP, AVIF, BMP, TIFF,
 *     GIF, PDF) — o backend normaliza para PNG-RGBA.
 *   • Múltiplos logos. Upload drag-and-drop ou clique.
 *   • Grid com preview real (usa /logos/:id/file).
 *   • Renomear, definir como padrão, deletar.
 *   • Aviso quando não há logo cadastrado ainda.
 *
 * Dark theme, matches the SystemConfigPanel look.
 */
import { useCallback, useRef, useState } from 'react'
import { UploadCloud, Star, StarOff, Pencil, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogoLibrary, type LogoRecord } from '@/hooks/useLogoLibrary'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/avif,image/bmp,image/tiff,image/gif,application/pdf'
const ACCEPT_LABEL = 'PNG, JPG, WEBP, AVIF, BMP, TIFF, GIF ou PDF'

function formatBytes(n: number | null | undefined): string {
  if (!n) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

interface Props {
  token: string
}

export function LogoLibraryPanel({ token }: Props) {
  const lib = useLogoLibrary(token)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadOk, setUploadOk] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadError(null)
    setUploadOk(null)
    setUploading(true)
    let ok = 0
    try {
      // Sequencial — evita rate-limit do processor e facilita isolar qual
      // arquivo falhou quando o usuário arrasta vários de uma vez.
      for (const file of Array.from(files)) {
        try {
          await lib.upload(file, file.name.replace(/\.[^/.]+$/, ''))
          ok++
        } catch (e: any) {
          setUploadError(`Falha em "${file.name}": ${e?.message || 'erro desconhecido'}`)
          break
        }
      }
      if (ok > 0) setUploadOk(`${ok} logo${ok === 1 ? '' : 's'} enviado${ok === 1 ? '' : 's'} com sucesso`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [lib])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const startRename = (logo: LogoRecord) => {
    setRenamingId(logo.id)
    setRenameValue(logo.name)
  }

  const commitRename = useCallback(async () => {
    if (!renamingId) return
    const newName = renameValue.trim()
    const current = lib.logos.find(l => l.id === renamingId)
    setRenamingId(null)
    if (!newName || !current || newName === current.name) return
    setBusyId(current.id)
    try {
      await lib.rename(current.id, newName)
    } catch (e: any) {
      setUploadError(`Erro ao renomear: ${e?.message || 'desconhecido'}`)
    } finally {
      setBusyId(null)
    }
  }, [renamingId, renameValue, lib])

  const handleSetDefault = useCallback(async (id: string) => {
    setBusyId(id)
    try {
      await lib.setDefault(id)
    } catch (e: any) {
      setUploadError(`Erro ao definir padrão: ${e?.message || 'desconhecido'}`)
    } finally {
      setBusyId(null)
    }
  }, [lib])

  const handleRemove = useCallback(async (logo: LogoRecord) => {
    // eslint-disable-next-line no-alert -- destructive op benefits from explicit confirm
    if (!confirm(`Remover o logo "${logo.name}"?`)) return
    setBusyId(logo.id)
    try {
      await lib.remove(logo.id)
    } catch (e: any) {
      setUploadError(`Erro ao remover: ${e?.message || 'desconhecido'}`)
    } finally {
      setBusyId(null)
    }
  }, [lib])

  return (
    <div className="space-y-4">
      {/* Upload area — drag & drop OR click */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition',
          dragActive
            ? 'border-yellow-400/80 bg-yellow-400/10'
            : 'border-white/15 hover:border-white/30 bg-white/5',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <UploadCloud className="w-8 h-8 mx-auto mb-2 text-white/60" />
        <div className="text-sm font-semibold text-white">
          {uploading ? 'Enviando…' : 'Arraste arquivos aqui ou clique para selecionar'}
        </div>
        <div className="text-xs text-white/50 mt-1">
          Formatos aceitos: {ACCEPT_LABEL}. Você pode enviar vários de uma vez.
        </div>
      </div>

      {uploadError && (
        <div className="flex gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}
      {uploadOk && (
        <div className="flex gap-2 text-xs text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{uploadOk}</span>
        </div>
      )}

      {/* Library listing */}
      {lib.loading && lib.logos.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-white/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando logos…
        </div>
      ) : lib.error && lib.logos.length === 0 ? (
        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-3">
          Erro ao carregar biblioteca: {lib.error}
        </div>
      ) : lib.logos.length === 0 ? (
        <div className="text-sm text-white/50 text-center py-6">
          Nenhum logo cadastrado ainda. Envie o primeiro acima — ele será definido como padrão automaticamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {lib.logos.map((logo) => (
            <div
              key={logo.id}
              className={cn(
                'relative rounded-xl border bg-white/5 p-3 transition',
                logo.isDefault
                  ? 'border-yellow-400/60 shadow-[0_0_0_2px_rgba(250,204,21,0.12)]'
                  : 'border-white/10 hover:border-white/25',
              )}
            >
              {/* Preview — checkered background so transparent logos stay visible */}
              <div
                className="aspect-video rounded-lg overflow-hidden flex items-center justify-center"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg,#222 25%,transparent 25%),linear-gradient(-45deg,#222 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#222 75%),linear-gradient(-45deg,transparent 75%,#222 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                  backgroundColor: '#333',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- intentional <img>; next/image can't serve auth-gated API routes */}
                <img
                  src={lib.fileUrl(logo.id)}
                  alt={logo.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Name / edit */}
              <div className="mt-2 flex items-center gap-1.5">
                {renamingId === logo.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none"
                  />
                ) : (
                  <>
                    <span className="flex-1 text-xs font-medium text-white truncate">
                      {logo.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => startRename(logo)}
                      className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
                      title="Renomear"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>

              {/* Meta + actions */}
              <div className="mt-1 flex items-center justify-between text-[10px] text-white/40">
                <span>
                  {logo.width && logo.height ? `${logo.width}×${logo.height}` : ''} · {formatBytes(logo.bytes)}
                </span>
                {logo.isDefault && (
                  <span className="text-yellow-400 font-semibold uppercase tracking-wider">
                    Padrão
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                {!logo.isDefault && (
                  <button
                    type="button"
                    disabled={busyId === logo.id}
                    onClick={() => handleSetDefault(logo.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-[11px] font-medium text-white/70 hover:text-yellow-300 bg-white/5 hover:bg-yellow-400/10 border border-white/10 hover:border-yellow-400/40 rounded py-1.5 transition"
                    title="Definir como padrão"
                  >
                    {busyId === logo.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                    Padrão
                  </button>
                )}
                {logo.isDefault && (
                  <span className="flex-1 flex items-center justify-center gap-1 text-[11px] text-yellow-400/80 bg-yellow-400/10 border border-yellow-400/30 rounded py-1.5">
                    <StarOff className="w-3 h-3" /> Atual
                  </span>
                )}
                <button
                  type="button"
                  disabled={busyId === logo.id}
                  onClick={() => handleRemove(logo)}
                  className="px-2 py-1.5 text-red-300 hover:text-red-200 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/40 rounded transition"
                  title="Remover"
                >
                  {busyId === logo.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-white/40 leading-relaxed">
        Os logos são aplicados como marca d&apos;água nas fotos dos imóveis através do editor
        (dashboard {`>`} Imóveis {`>`} editar fotos). Você pode escolher qual logo usar e ajustar
        tamanho e opacidade em tempo real.
      </p>
    </div>
  )
}
