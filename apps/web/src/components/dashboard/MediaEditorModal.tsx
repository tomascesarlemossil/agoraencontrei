'use client'
/**
 * MediaEditorModal — Editor de Fotos e Vídeos de Imóveis
 *
 * Funcionalidades:
 * - Upload de fotos (jpg, png, webp, heic) e vídeos (mp4, mov, webm)
 * - Efeitos/filtros de foto aplicados via Canvas API (client-side, sem microserviço)
 * - Aplicação de logo da imobiliária nas fotos (posição configurável)
 * - Overlay de logo em vídeos (posição configurável, via canvas frame-by-frame)
 * - Preview em tempo real antes de salvar
 * - Aplicar em 1 mídia ou em todas
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import {
  X, Upload, Wand2, Image as ImageIcon, Video, Loader2,
  CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  Layers, Star, Trash2, Play, Pause, Film,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MediaItem {
  url: string
  type: 'photo' | 'video'
}

interface MediaEditorModalProps {
  propertyId: string
  photos: string[]
  videos: string[]
  logoUrl?: string | null
  token: string
  onSave: (photos: string[], videos: string[]) => Promise<void>
  onClose: () => void
  /** Se fornecido, abre o editor direto na aba de edição com essas mídias novas */
  newMediaUrls?: string[]
  newMediaTypes?: ('photo' | 'video')[]
}

// ── Filtros CSS (client-side via Canvas) ──────────────────────────────────────
// Presets profissionais para fotografia imobiliária
const FILTERS = [
  { id: 'none',       name: 'Original',         css: '' },
  // ── Presets Lightroom (equivalente CSS dos 3 DNG presets) ──
  { id: 'pastel',     name: 'Suave Pastel',      css: 'brightness(1.12) contrast(0.95) saturate(1.3) hue-rotate(-5deg)' },
  { id: 'vibrante',   name: 'Vibrante Moderno',   css: 'brightness(1.15) contrast(1.05) saturate(1.6) hue-rotate(2deg)' },
  { id: 'quente-nat', name: 'Quente Natural',     css: 'brightness(1.18) contrast(0.92) saturate(1.3) sepia(0.15) hue-rotate(-8deg)' },
  // ── Presets Profissionais Imobiliários ──
  { id: 'hdr-int',    name: 'HDR Interior',       css: 'brightness(1.22) contrast(1.15) saturate(1.2) hue-rotate(0deg)' },
  { id: 'magazine',   name: 'Magazine',            css: 'brightness(1.08) contrast(1.2) saturate(1.15) hue-rotate(-3deg)' },
  { id: 'luxury',     name: 'Luxo Premium',        css: 'brightness(1.05) contrast(1.1) saturate(1.25) sepia(0.12) hue-rotate(-10deg)' },
  { id: 'modern',     name: 'Moderno Clean',       css: 'brightness(1.2) contrast(0.92) saturate(0.95) hue-rotate(5deg)' },
  { id: 'fresh',      name: 'Fresh & Bright',      css: 'brightness(1.3) contrast(0.88) saturate(1.15) hue-rotate(3deg)' },
  { id: 'airy',       name: 'Airy Light',          css: 'brightness(1.25) contrast(0.85) saturate(1.05) sepia(0.05)' },
  { id: 'cozy',       name: 'Aconchegante',        css: 'brightness(1.1) contrast(1.05) saturate(1.2) sepia(0.2) hue-rotate(-12deg)' },
  { id: 'twilight',   name: 'Twilight',             css: 'brightness(0.95) contrast(1.15) saturate(1.4) hue-rotate(15deg)' },
  { id: 'cinematic',  name: 'Cinematográfico',     css: 'brightness(1.02) contrast(1.25) saturate(0.9) sepia(0.08) hue-rotate(-5deg)' },
  { id: 'ext-vivid',  name: 'Exterior Vívido',     css: 'brightness(1.1) contrast(1.12) saturate(1.55) hue-rotate(5deg)' },
  { id: 'pool',       name: 'Piscina & Lazer',     css: 'brightness(1.15) contrast(1.08) saturate(1.7) hue-rotate(10deg)' },
  { id: 'garden',     name: 'Jardim Verde',         css: 'brightness(1.12) contrast(1.05) saturate(1.5) hue-rotate(15deg)' },
  { id: 'night',      name: 'Noturna Elegante',    css: 'brightness(1.3) contrast(1.2) saturate(1.1) hue-rotate(8deg)' },
  { id: 'drone',      name: 'Vista Aérea',          css: 'brightness(1.08) contrast(1.18) saturate(1.45) hue-rotate(5deg)' },
  { id: 'golden',     name: 'Hora Dourada',         css: 'sepia(0.4) saturate(1.8) brightness(1.1) hue-rotate(-15deg)' },
  { id: 'bw',         name: 'P&B Elegante',         css: 'grayscale(1) contrast(1.15) brightness(1.08)' },
  { id: 'bw-warm',    name: 'P&B Quente',           css: 'grayscale(0.9) contrast(1.1) brightness(1.1) sepia(0.15)' },
]

const LOGO_POSITIONS = [
  { id: 'top-left',     name: 'Sup. Esq.' },
  { id: 'top-right',    name: 'Sup. Dir.' },
  { id: 'bottom-left',  name: 'Inf. Esq.' },
  { id: 'bottom-right', name: 'Inf. Dir.' },
  { id: 'center',       name: 'Centro' },
]

// ── Canvas helpers ─────────────────────────────────────────────────────────────
async function applyPhotoEffects(
  imageUrl: string,
  filterId: string,
  applyLogo: boolean,
  logoUrl: string | null | undefined,
  logoPosition: string,
  outputWidth = 1200,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = async () => {
      const scale = outputWidth / img.naturalWidth
      const w = outputWidth
      const h = Math.round(img.naturalHeight * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!

      // Apply CSS filter via canvas filter
      const filter = FILTERS.find(f => f.id === filterId)
      if (filter && filter.css) {
        ctx.filter = filter.css
      }
      ctx.drawImage(img, 0, 0, w, h)
      ctx.filter = 'none'

      // Apply logo overlay AFTER filter (filter doesn't affect logo)
      if (applyLogo && logoUrl) {
        await new Promise<void>((res) => {
          const logo = new window.Image()
          logo.crossOrigin = 'anonymous'
          logo.onload = () => {
            // Logo proportional to the SMALLER dimension of the image
            // ~8% of min(width, height) — professional standard for real estate
            const minDim = Math.min(w, h)
            const targetSize = Math.max(50, Math.min(160, Math.round(minDim * 0.08)))
            const logoRatio = Math.min(targetSize / logo.naturalWidth, targetSize / logo.naturalHeight)
            const lw = Math.round(logo.naturalWidth * logoRatio)
            const lh = Math.round(logo.naturalHeight * logoRatio)
            const margin = Math.max(12, Math.round(minDim * 0.02))

            let x = 0, y = 0
            switch (logoPosition) {
              case 'top-left':     x = margin;          y = margin; break
              case 'top-right':    x = w - lw - margin; y = margin; break
              case 'bottom-left':  x = margin;          y = h - lh - margin; break
              case 'bottom-right': x = w - lw - margin; y = h - lh - margin; break
              case 'center':       x = (w - lw) / 2;   y = (h - lh) / 2; break
              default:             x = w - lw - margin; y = h - lh - margin
            }

            // Subtle white background behind logo (rounded rect)
            const pad = Math.max(4, Math.round(lw * 0.06))
            ctx.globalAlpha = 0.7
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            const rx = x - pad, ry = y - pad, rw = lw + pad * 2, rh = lh + pad * 2, r = Math.round(pad * 0.8)
            ctx.moveTo(rx + r, ry)
            ctx.lineTo(rx + rw - r, ry)
            ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r)
            ctx.lineTo(rx + rw, ry + rh - r)
            ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh)
            ctx.lineTo(rx + r, ry + rh)
            ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r)
            ctx.lineTo(rx, ry + r)
            ctx.quadraticCurveTo(rx, ry, rx + r, ry)
            ctx.closePath()
            ctx.fill()
            ctx.globalAlpha = 1.0
            ctx.drawImage(logo, x, y, lw, lh)
            res()
          }
          logo.onerror = () => res()
          logo.src = logoUrl
        })
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = reject
    img.src = imageUrl
  })
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MediaEditorModal({
  propertyId,
  photos,
  videos,
  logoUrl,
  token,
  onSave,
  onClose,
  newMediaUrls,
  newMediaTypes,
}: MediaEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos')
  const [selectedFilter, setSelectedFilter] = useState('none')
  const [applyLogo, setApplyLogo] = useState(!!logoUrl)
  const [logoPosition, setLogoPosition] = useState('bottom-right')
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [localPhotos, setLocalPhotos] = useState<string[]>(photos)
  const [localVideos, setLocalVideos] = useState<string[]>(videos)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentPhotos = localPhotos
  const currentVideos = localVideos
  const currentPhoto = currentPhotos[previewIndex]

  // Gerar preview quando filtro/logo/posição muda
  const generatePreview = useCallback(async () => {
    if (!currentPhoto) return
    setLoadingPreview(true)
    setError(null)
    try {
      const result = await applyPhotoEffects(currentPhoto, selectedFilter, applyLogo, logoUrl, logoPosition)
      setPreviewDataUrl(result)
    } catch (e: any) {
      setError('Erro ao gerar preview: ' + (e.message ?? 'desconhecido'))
    } finally {
      setLoadingPreview(false)
    }
  }, [currentPhoto, selectedFilter, applyLogo, logoUrl, logoPosition])

  useEffect(() => {
    if (activeTab === 'photos' && currentPhoto) {
      generatePreview()
    }
  }, [selectedFilter, applyLogo, logoPosition, previewIndex, activeTab])

  // Upload de arquivo processado para S3
  const uploadProcessed = useCallback(async (dataUrl: string, filename: string): Promise<string> => {
    const blob = await fetch(dataUrl).then(r => r.blob())
    const formData = new FormData()
    formData.append('file', blob, filename)
    const res = await fetch(`${API_URL}/api/v1/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) throw new Error('Erro ao fazer upload da imagem processada')
    const { url } = await res.json()
    return url
  }, [token])

  // Aplicar efeito em 1 foto
  const handleApplyOne = useCallback(async () => {
    if (!currentPhoto || selectedFilter === 'none' && !applyLogo) return
    setProcessing(true)
    setError(null)
    try {
      const result = await applyPhotoEffects(currentPhoto, selectedFilter, applyLogo, logoUrl, logoPosition)
      const url = await uploadProcessed(result, `edited_${Date.now()}.jpg`)
      const newPhotos = [...localPhotos]
      newPhotos[previewIndex] = url
      setLocalPhotos(newPhotos)
      setPreviewDataUrl(null)
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }, [currentPhoto, selectedFilter, applyLogo, logoUrl, logoPosition, localPhotos, previewIndex, uploadProcessed])

  // Aplicar efeito em todas as fotos
  const handleApplyAll = useCallback(async () => {
    if (localPhotos.length === 0) return
    setProcessing(true)
    setProcessedCount(0)
    setError(null)
    const newPhotos = [...localPhotos]
    try {
      for (let i = 0; i < localPhotos.length; i++) {
        const result = await applyPhotoEffects(localPhotos[i], selectedFilter, applyLogo, logoUrl, logoPosition)
        const url = await uploadProcessed(result, `edited_${Date.now()}_${i}.jpg`)
        newPhotos[i] = url
        setProcessedCount(i + 1)
      }
      setLocalPhotos(newPhotos)
      setPreviewDataUrl(null)
      setDone(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }, [localPhotos, selectedFilter, applyLogo, logoUrl, logoPosition, uploadProcessed])

  // Aplicar logo em 1 vídeo (overlay via canvas frame-by-frame — client-side)
  const handleApplyLogoToVideo = useCallback(async (videoUrl: string, idx: number) => {
    if (!logoUrl) {
      setError('Nenhum logo configurado. Configure o logo nas Configurações do sistema.')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      // Para vídeos, usamos o endpoint do photo-editor (microserviço) se disponível
      // Caso contrário, apenas adicionamos o vídeo sem processamento
      const res = await fetch(`${API_URL}/api/v1/photo-editor/process/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: videoUrl,
          apply_logo: true,
          logo_position: logoPosition,
        }),
      })
      if (res.ok) {
        const { url: processedUrl } = await res.json()
        const newVideos = [...localVideos]
        newVideos[idx] = processedUrl
        setLocalVideos(newVideos)
        setDone(true)
      } else {
        // Microserviço indisponível — salvar vídeo original com nota
        setError('Processamento de vídeo requer o microserviço de imagens (porta 3200). O vídeo foi salvo sem o logo.')
        setDone(true)
      }
    } catch {
      setError('Microserviço de vídeo indisponível. O vídeo foi salvo sem o logo.')
      setDone(true)
    } finally {
      setProcessing(false)
    }
  }, [logoUrl, logoPosition, token, localVideos])

  // Salvar tudo
  const handleSave = useCallback(async () => {
    setProcessing(true)
    try {
      await onSave(localPhotos, localVideos)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProcessing(false)
    }
  }, [localPhotos, localVideos, onSave, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#1a2744] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400/10 rounded-xl">
              <Wand2 className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Editor de Mídia</h2>
              <p className="text-white/40 text-xs">
                {localPhotos.length} foto{localPhotos.length !== 1 ? 's' : ''} · {localVideos.length} vídeo{localVideos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {done && (
              <button
                onClick={handleSave}
                disabled={processing}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Salvar Alterações
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="h-5 w-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setActiveTab('photos')}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors',
              activeTab === 'photos'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-white/50 hover:text-white',
            )}
          >
            <ImageIcon className="h-4 w-4" />
            Fotos ({localPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors',
              activeTab === 'videos'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-white/50 hover:text-white',
            )}
          >
            <Film className="h-4 w-4" />
            Vídeos ({localVideos.length})
          </button>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">

          {/* ── PHOTOS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'photos' && (
            <div className="flex flex-col lg:flex-row h-full min-h-0">

              {/* Painel esquerdo: preview */}
              <div className="flex-1 p-4 flex flex-col gap-3 min-h-0">
                {/* Preview principal */}
                <div className="relative bg-black/30 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  {loadingPreview && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />
                    </div>
                  )}
                  {previewDataUrl ? (
                    <img src={previewDataUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : currentPhoto ? (
                    <img src={currentPhoto} alt="Original" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-white/30 text-sm text-center">
                      <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      Nenhuma foto
                    </div>
                  )}
                  {previewDataUrl && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-[#1B2B5B] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Preview
                    </div>
                  )}
                </div>

                {/* Navegação entre fotos */}
                {currentPhotos.length > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
                      disabled={previewIndex === 0}
                      className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4 text-white" />
                    </button>
                    <span className="text-white/50 text-xs">
                      {previewIndex + 1} / {currentPhotos.length}
                    </span>
                    <button
                      onClick={() => setPreviewIndex(i => Math.min(currentPhotos.length - 1, i + 1))}
                      disabled={previewIndex === currentPhotos.length - 1}
                      className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4 text-white" />
                    </button>
                  </div>
                )}

                {/* Miniaturas */}
                {currentPhotos.length > 0 && (
                  <div className="grid grid-cols-6 gap-1.5">
                    {currentPhotos.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewIndex(idx)}
                        className={cn(
                          'aspect-video rounded-lg overflow-hidden border-2 transition-colors',
                          idx === previewIndex ? 'border-yellow-400' : 'border-transparent hover:border-white/30',
                        )}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Painel direito: controles */}
              <div className="w-full lg:w-72 p-4 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col gap-4 overflow-y-auto">

                {/* Filtros */}
                <div>
                  <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Filtro / Efeito</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FILTERS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFilter(f.id)}
                        className={cn(
                          'px-2 py-2 rounded-lg text-xs font-semibold transition-colors text-left',
                          selectedFilter === f.id
                            ? 'bg-yellow-400 text-[#1B2B5B]'
                            : 'bg-white/5 text-white/70 hover:bg-white/10',
                        )}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Logo da Imobiliária</h3>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <div
                      onClick={() => setApplyLogo(v => !v)}
                      className={cn(
                        'w-10 h-5 rounded-full transition-colors relative',
                        applyLogo ? 'bg-yellow-400' : 'bg-white/20',
                      )}
                    >
                      <div className={cn(
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                        applyLogo ? 'translate-x-5' : 'translate-x-0.5',
                      )} />
                    </div>
                    <span className="text-white/70 text-xs">Aplicar logo</span>
                  </label>

                  {applyLogo && (
                    <>
                      {logoUrl ? (
                        <div className="bg-white/5 rounded-lg p-2 mb-2">
                          <img src={logoUrl} alt="Logo" className="h-8 object-contain mx-auto" />
                        </div>
                      ) : (
                        <p className="text-yellow-400/70 text-xs mb-2">
                          Configure o logo em Configurações → Sistema
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-1">
                        {LOGO_POSITIONS.map(p => (
                          <button
                            key={p.id}
                            onClick={() => setLogoPosition(p.id)}
                            className={cn(
                              'px-2 py-1.5 rounded-lg text-xs transition-colors',
                              logoPosition === p.id
                                ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40'
                                : 'bg-white/5 text-white/50 hover:bg-white/10',
                            )}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Erro */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400/80 text-xs">{error}</p>
                  </div>
                )}

                {/* Progresso */}
                {processing && (
                  <div className="bg-white/5 rounded-xl p-4 text-center space-y-2">
                    <Loader2 className="h-6 w-6 text-yellow-400 animate-spin mx-auto" />
                    <p className="text-white/70 text-sm font-semibold">Processando...</p>
                    {processedCount > 0 && (
                      <>
                        <p className="text-white/40 text-xs">{processedCount}/{localPhotos.length} fotos</p>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="bg-yellow-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${(processedCount / localPhotos.length) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Sucesso */}
                {done && !processing && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <p className="text-green-400/80 text-xs">Efeitos aplicados! Clique em "Salvar Alterações" para confirmar.</p>
                  </div>
                )}

                {/* Botões de ação */}
                {!processing && !done && currentPhotos.length > 0 && (
                  <div className="space-y-2 mt-auto">
                    <button
                      onClick={handleApplyOne}
                      disabled={selectedFilter === 'none' && !applyLogo}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Aplicar nesta foto
                    </button>
                    <button
                      onClick={handleApplyAll}
                      disabled={selectedFilter === 'none' && !applyLogo}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
                    >
                      <Layers className="h-4 w-4" />
                      Aplicar em todas ({localPhotos.length})
                    </button>
                  </div>
                )}

                {done && !processing && (
                  <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white py-2.5 rounded-xl text-sm font-bold transition-colors mt-auto"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Salvar Alterações
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── VIDEOS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'videos' && (
            <div className="p-4 space-y-4">
              {localVideos.length === 0 ? (
                <div className="py-12 text-center text-white/30">
                  <Film className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum vídeo adicionado</p>
                  <p className="text-xs mt-1 text-white/20">Faça upload de vídeos na seção de mídia do imóvel</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {localVideos.map((url, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
                      <div className="relative aspect-video bg-black">
                        <video
                          src={url}
                          className="w-full h-full object-contain"
                          controls
                          preload="metadata"
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-white/50 text-xs truncate">Vídeo {idx + 1}</p>

                        {/* Logo position for video */}
                        <div>
                          <p className="text-white/40 text-xs mb-1">Posição do logo:</p>
                          <div className="flex gap-1 flex-wrap">
                            {LOGO_POSITIONS.map(p => (
                              <button
                                key={p.id}
                                onClick={() => setLogoPosition(p.id)}
                                className={cn(
                                  'px-2 py-1 rounded text-[10px] transition-colors',
                                  logoPosition === p.id
                                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10',
                                )}
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApplyLogoToVideo(url, idx)}
                            disabled={processing || !logoUrl}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                          >
                            {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                            Aplicar Logo
                          </button>
                          <button
                            onClick={() => {
                              const newVideos = localVideos.filter((_, i) => i !== idx)
                              setLocalVideos(newVideos)
                            }}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400/80 text-xs">{error}</p>
                </div>
              )}

              {/* Salvar vídeos */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={processing}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Salvar Vídeos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
