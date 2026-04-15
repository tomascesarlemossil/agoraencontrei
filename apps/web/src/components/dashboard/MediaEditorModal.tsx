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
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  X, Upload, Wand2, Image as ImageIcon, Video, Loader2,
  CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  Layers, Star, Trash2, Play, Pause, Film,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogoLibrary, type LogoRecord } from '@/hooks/useLogoLibrary'

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

/**
 * Load an image for canvas operations, bypassing CORS issues.
 * Uses /api/proxy-image to serve external images as same-origin.
 */
async function loadImageForCanvas(url: string): Promise<HTMLImageElement> {
  // If it's already a data URL or blob URL, load directly
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem local'))
      img.src = url
    })
  }

  // For external URLs, proxy through our server to avoid CORS canvas tainting
  // Try proxy first, then direct with crossOrigin as fallback
  async function tryProxy(): Promise<HTMLImageElement> {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Proxy retornou ${res.status}: ${detail.slice(0, 100)}`)
    }
    const blob = await res.blob()
    if (blob.size < 100) throw new Error('Imagem vazia recebida do proxy')
    const objectUrl = URL.createObjectURL(blob)
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => { URL.revokeObjectURL(objectUrl); resolve(img) }
      img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Falha ao decodificar imagem do proxy')) }
      img.src = objectUrl
    })
  }

  async function tryDirect(): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem diretamente'))
      img.src = url
    })
  }

  try {
    return await tryProxy()
  } catch (proxyErr) {
    // Fallback: try direct load with crossOrigin (works if CDN has CORS headers)
    try {
      return await tryDirect()
    } catch {
      // Re-throw the proxy error which has more detail
      throw proxyErr
    }
  }
}

interface LogoOverlayOptions {
  url: string | null | undefined
  position: string
  /** Largura alvo do logo como % da menor dimensão da foto. Range 2-25. */
  sizePercent: number
  /** Opacidade do logo (0-1). */
  opacity: number
  /** Mostrar o retângulo branco atrás do logo. */
  showBackdrop: boolean
}

/**
 * Converte uma data URL em Blob manualmente via atob().
 *
 * Substitui o padrão `await fetch(dataUrl).then(r => r.blob())`, que
 * é elegante mas quebra em alguns navegadores para data URLs grandes
 * (>~2 MB) com um TypeError genérico — a foto de um imóvel a 1200 px
 * JPEG já estoura esse limite com frequência. A implementação manual
 * não tem o mesmo limite e deixa claro *por que* falhou.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl)
  if (!match) throw new Error('data URL inválida')
  const mime = match[1]
  const b64 = match[2]
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

async function applyPhotoEffects(
  imageUrl: string,
  filterId: string,
  applyLogo: boolean,
  logoOpts: LogoOverlayOptions,
  outputWidth = 1200,
): Promise<string> {
  const img = await loadImageForCanvas(imageUrl)

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
  if (applyLogo && logoOpts.url) {
    try {
      const logo = await loadImageForCanvas(logoOpts.url)
      // Clamp size percent to the same 2-25% range the backend accepts.
      const sizePercent = Math.max(2, Math.min(25, logoOpts.sizePercent))
      const minDim = Math.min(w, h)
      const targetSize = Math.max(20, Math.round(minDim * sizePercent / 100))
      const logoRatio = Math.min(targetSize / logo.naturalWidth, targetSize / logo.naturalHeight)
      const lw = Math.round(logo.naturalWidth * logoRatio)
      const lh = Math.round(logo.naturalHeight * logoRatio)
      const margin = Math.max(8, Math.round(minDim * 0.02))

      let x = 0, y = 0
      switch (logoOpts.position) {
        case 'top-left':     x = margin;          y = margin; break
        case 'top-right':    x = w - lw - margin; y = margin; break
        case 'bottom-left':  x = margin;          y = h - lh - margin; break
        case 'bottom-right': x = w - lw - margin; y = h - lh - margin; break
        case 'center':       x = (w - lw) / 2;   y = (h - lh) / 2; break
        default:             x = w - lw - margin; y = h - lh - margin
      }

      // Subtle white background behind logo (rounded rect) — optional,
      // off by default so PDF/transparent logos don't get a white plate
      // where it isn't wanted.
      if (logoOpts.showBackdrop) {
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
      }

      // Actual logo draw — respects the configured opacity.
      ctx.globalAlpha = Math.max(0, Math.min(1, logoOpts.opacity))
      ctx.drawImage(logo, x, y, lw, lh)
      ctx.globalAlpha = 1.0
    } catch {
      // Logo failed to load — continue without logo (graceful degradation)
    }
  }

  return canvas.toDataURL('image/jpeg', 0.92)
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

  // ── Logo library ────────────────────────────────────────────────────────
  // Replaces the old single-logo flow. The user can now pick ANY logo from
  // the library configured in Settings and adjust size/opacity/position.
  const logoLib = useLogoLibrary(token)
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null)
  const [logoSizePercent, setLogoSizePercent] = useState(8)       // 2-25
  const [logoOpacity, setLogoOpacity] = useState(0.85)            // 0-1
  const [logoShowBackdrop, setLogoShowBackdrop] = useState(false) // white plate behind logo

  // When the library loads, pre-select the user's default. If no library
  // is configured yet but the legacy `logoUrl` prop is present, fall back
  // to the old single-logo behaviour — the toggle "aplicar logo" stays
  // meaningful in both cases.
  useEffect(() => {
    if (!selectedLogoId && logoLib.defaultLogo) {
      setSelectedLogoId(logoLib.defaultLogo.id)
    }
  }, [logoLib.defaultLogo, selectedLogoId])

  const hasLogoSource = logoLib.logos.length > 0 || !!logoUrl
  const [applyLogo, setApplyLogo] = useState<boolean>(hasLogoSource)

  // Auto-disable the toggle when there's nothing to apply.
  useEffect(() => {
    if (!hasLogoSource) setApplyLogo(false)
  }, [hasLogoSource])

  const selectedLogoRecord: LogoRecord | undefined = useMemo(
    () => logoLib.logos.find(l => l.id === selectedLogoId),
    [logoLib.logos, selectedLogoId],
  )

  // Resolves the URL the canvas should actually load. Priority:
  //   1) Selected library logo → /api/v1/photo-editor/logos/:id/file
  //   2) Legacy logoUrl prop (Company.logoUrl)
  const activeLogoUrl = useMemo<string | null>(() => {
    if (selectedLogoRecord) return logoLib.fileUrl(selectedLogoRecord.id)
    return logoUrl ?? null
  }, [selectedLogoRecord, logoUrl, logoLib])

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

  // Single source of truth for the watermark config — every call to
  // applyPhotoEffects (preview, apply-single, apply-all) reads from here.
  const logoOpts = useMemo(() => ({
    url: activeLogoUrl,
    position: logoPosition,
    sizePercent: logoSizePercent,
    opacity: logoOpacity,
    showBackdrop: logoShowBackdrop,
  }), [activeLogoUrl, logoPosition, logoSizePercent, logoOpacity, logoShowBackdrop])

  // Gerar preview quando filtro/logo/posição/tamanho/opacidade muda
  const generatePreview = useCallback(async () => {
    if (!currentPhoto) return
    setLoadingPreview(true)
    setError(null)
    try {
      const result = await applyPhotoEffects(currentPhoto, selectedFilter, applyLogo, logoOpts)
      setPreviewDataUrl(result)
    } catch (e: any) {
      const msg = e?.message ?? 'desconhecido'
      // Provide actionable error messages
      if (msg.includes('Proxy retornou') || msg.includes('proxy')) {
        setError('Erro ao carregar imagem — o servidor de proxy não conseguiu buscar a imagem. Tente novamente.')
      } else if (msg.includes('carregar') || msg.includes('decodificar')) {
        setError('Não foi possível carregar a imagem para o editor. A imagem pode estar corrompida ou inacessível.')
      } else {
        setError('Erro ao gerar preview: ' + msg)
      }
    } finally {
      setLoadingPreview(false)
    }
  }, [currentPhoto, selectedFilter, applyLogo, logoOpts])

  useEffect(() => {
    if (activeTab === 'photos' && currentPhoto) {
      generatePreview()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- generatePreview is stable via useCallback
  }, [selectedFilter, applyLogo, logoOpts, previewIndex, activeTab, generatePreview])

  // Upload de arquivo processado para S3 (via same-origin proxy to avoid CORS)
  // Estratégia: tenta o proxy same-origin até 3x com backoff (resiste a cold-start
  // de serverless, 502 transitório, rede flaky). Se tudo falhar, tenta direto
  // contra a API como último recurso — diagnóstico claro para o usuário.
  const uploadProcessed = useCallback(async (dataUrl: string, filename: string): Promise<string> => {
    // Convert dataUrl (produced by canvas.toDataURL) to a Blob.
    // We used to do `fetch(dataUrl).then(r => r.blob())`, which is
    // elegant but fails with a cryptic TypeError on large data URLs
    // (>~2 MB) on Chrome/Safari — the user saw "Não foi possível
    // preparar a imagem processada" for a perfectly normal 2560x1920
    // photo. The manual atob path below is slower but has no size
    // limit and surfaces a real reason when it does fail.
    let blob: Blob
    try {
      blob = dataUrlToBlob(dataUrl)
    } catch (e: any) {
      throw new Error(
        `Não foi possível preparar a imagem processada: ${e?.message ?? 'formato inválido'}. ` +
        `Tente reduzir o tamanho da foto ou gravar uma nova.`,
      )
    }

    const buildFormData = () => {
      const fd = new FormData()
      fd.append('file', blob, filename)
      return fd
    }

    // ── Attempt 1-3: same-origin /api/upload-proxy com retry ─────────────────
    // Retry resolve: cold-start Vercel (timeout 1ª req), 502 gateway transitório,
    // e TypeError "Failed to fetch" por jitter de rede móvel.
    const MAX_RETRIES = 3
    let lastError: any = null
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch('/api/upload-proxy', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: buildFormData(),
          signal: AbortSignal.timeout(45000),
        })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          if (data && data.url) return data.url
          lastError = new Error('Resposta inválida do servidor de upload.')
        } else {
          const err = await res.json().catch(() => ({ error: 'unknown' }))
          // 5xx é transitório → retry. 4xx é erro do cliente → não retry.
          if (res.status >= 500 && attempt < MAX_RETRIES) {
            lastError = new Error(err.message || err.details || `Upload falhou (${res.status})`)
            await new Promise(r => setTimeout(r, 400 * attempt))
            continue
          }
          throw new Error(err.message || err.details || `Upload falhou (${res.status})`)
        }
      } catch (networkErr: any) {
        lastError = networkErr
        // AbortError / TypeError → retry com backoff
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 400 * attempt))
          continue
        }
      }
    }

    // ── Último recurso: direto contra a API (cross-origin). Se upload-proxy
    // estiver indisponível por deploy/config, isso ainda sobe a foto.
    try {
      const res = await fetch(`${API_URL}/api/v1/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: buildFormData(),
        signal: AbortSignal.timeout(45000),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'unknown' }))
        throw new Error(err.message || err.details || `Upload falhou (${res.status})`)
      }
      const data = await res.json().catch(() => null)
      if (!data || !data.url) throw new Error('Resposta inválida do servidor de upload.')
      return data.url
    } catch (directErr: any) {
      // Surface proxy error if it's more informative, else the direct error
      const msg = lastError?.message || directErr?.message || 'Falha de conexão'
      throw new Error(
        `Falha ao enviar foto após ${MAX_RETRIES} tentativas: ${msg}. Verifique sua internet e tente novamente.`,
      )
    }
  }, [token])

  // Aplicar efeito em 1 foto
  const handleApplyOne = useCallback(async () => {
    if (!currentPhoto || (selectedFilter === 'none' && !applyLogo)) return
    setProcessing(true)
    setError(null)
    try {
      const result = await applyPhotoEffects(currentPhoto, selectedFilter, applyLogo, logoOpts)
      try {
        const url = await uploadProcessed(result, `edited_${Date.now()}.jpg`)
        const newPhotos = [...localPhotos]
        newPhotos[previewIndex] = url
        setLocalPhotos(newPhotos)
        setPreviewDataUrl(null)
        setDone(true)
      } catch (uploadErr: any) {
        setError('Erro ao salvar imagem: ' + (uploadErr.message || 'Verifique sua conexão e tente novamente.'))
      }
    } catch (e: any) {
      setError('Erro ao processar imagem: ' + (e.message || 'desconhecido'))
    } finally {
      setProcessing(false)
    }
  }, [currentPhoto, selectedFilter, applyLogo, logoOpts, localPhotos, previewIndex, uploadProcessed])

  // Aplicar efeito em todas as fotos
  // Estratégia de resiliência: processa uma de cada vez, commita cada sucesso
  // no estado antes de seguir. Se falhar no meio, o usuário mantém o progresso
  // parcial (fotos já processadas ficam salvas) e vê mensagem clara indicando
  // qual foto falhou, podendo tentar novamente só as restantes.
  const handleApplyAll = useCallback(async () => {
    if (localPhotos.length === 0) return
    setProcessing(true)
    setProcessedCount(0)
    setError(null)
    const working = [...localPhotos]
    let failedIndex = -1
    let failureMessage = ''
    try {
      for (let i = 0; i < localPhotos.length; i++) {
        try {
          const result = await applyPhotoEffects(localPhotos[i], selectedFilter, applyLogo, logoOpts)
          const url = await uploadProcessed(result, `edited_${Date.now()}_${i}.jpg`)
          working[i] = url
          setProcessedCount(i + 1)
          // Commit progressivo — se falhar depois, o que já subiu não se perde.
          setLocalPhotos([...working])
        } catch (stepErr: any) {
          failedIndex = i
          failureMessage = stepErr?.message ?? 'desconhecido'
          break
        }
      }

      if (failedIndex >= 0) {
        const successCount = failedIndex
        const totalCount = localPhotos.length
        const prefix =
          failureMessage.includes('Upload') || failureMessage.includes('salvar')
            ? 'Erro ao salvar foto'
            : 'Erro ao processar foto'
        setError(
          `${prefix} ${failedIndex + 1} de ${totalCount}: ${failureMessage}. ` +
            `${successCount} foto${successCount === 1 ? '' : 's'} já ${successCount === 1 ? 'foi salva' : 'foram salvas'} — você pode tentar novamente nas restantes.`,
        )
      } else {
        setPreviewDataUrl(null)
        setDone(true)
      }
    } catch (e: any) {
      // Fallback defensivo — não deveria chegar aqui já que o inner try captura tudo
      setError('Erro inesperado: ' + (e?.message ?? 'desconhecido'))
    } finally {
      setProcessing(false)
    }
  }, [localPhotos, selectedFilter, applyLogo, logoOpts, uploadProcessed])

  // Aplicar logo em 1 vídeo (overlay via canvas frame-by-frame — client-side)
  const handleApplyLogoToVideo = useCallback(async (videoUrl: string, idx: number) => {
    if (!hasLogoSource) {
      setError('Nenhum logo configurado. Configure o logo nas Configurações do sistema.')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      // Para vídeos, usamos o endpoint do photo-editor (microserviço) se disponível.
      // Repassa todas as opções novas (logo_id, size_percent, opacity) para
      // que o vídeo use o mesmo logo configurado no painel.
      const res = await fetch(`${API_URL}/api/v1/photo-editor/process/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: videoUrl,
          apply_logo: true,
          logo_id: selectedLogoId ?? undefined,
          logo_position: logoPosition,
          logo_size_percent: logoSizePercent,
          logo_opacity: logoOpacity,
        }),
      })
      if (res.ok) {
        const { url: processedUrl } = await res.json()
        const newVideos = [...localVideos]
        newVideos[idx] = processedUrl
        setLocalVideos(newVideos)
        setDone(true)
      } else {
        setError('Processamento de vídeo requer o microserviço de imagens (porta 3200). O vídeo foi salvo sem o logo.')
        setDone(true)
      }
    } catch {
      setError('Microserviço de vídeo indisponível. O vídeo foi salvo sem o logo.')
      setDone(true)
    } finally {
      setProcessing(false)
    }
  }, [hasLogoSource, selectedLogoId, logoPosition, logoSizePercent, logoOpacity, token, localVideos])

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
      <div className="bg-[#1a2744] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[95dvh] overflow-hidden flex flex-col">

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
                  {!hasLogoSource ? (
                    // No library entry AND no legacy URL — guide the user to Settings
                    <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg p-3">
                      <p className="text-yellow-400/90 text-xs font-semibold mb-1">Nenhum logo cadastrado</p>
                      <p className="text-white/50 text-[11px] leading-relaxed">
                        Envie um logo em <span className="text-yellow-400/80">Configurações → Empresa → Logotipos</span>.
                        Aceita PDF, PNG, JPG, WEBP e outros.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Master on/off — same UX as before */}
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
                          {/* Selector — lists every logo from the library.
                              The legacy single-URL logo still shows up as a
                              non-removable fallback entry so existing users
                              don't lose the feature before migrating. */}
                          {logoLib.logos.length > 0 ? (
                            <div className="mb-2">
                              <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1">
                                Qual logo usar
                              </label>
                              <select
                                value={selectedLogoId ?? ''}
                                onChange={(e) => setSelectedLogoId(e.target.value || null)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-yellow-400/50"
                              >
                                {logoLib.logos.map((l) => (
                                  <option key={l.id} value={l.id} className="bg-zinc-800">
                                    {l.name}{l.isDefault ? ' (padrão)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : logoUrl ? (
                            <div className="mb-2 text-[10px] text-white/40">
                              Usando logo legado configurado como URL. Envie para a biblioteca em Configurações para ter mais controle.
                            </div>
                          ) : null}

                          {/* Live preview of the selected logo (checkered bg
                              so transparent PNGs stay visible) + its name,
                              so the user knows *which* logo is being baked
                              into the watermark. Fixes the "minha foto de
                              perfil apareceu como logo" confusion — if the
                              wrong file is selected the name makes it
                              immediately obvious. */}
                          {activeLogoUrl && (
                            <div className="mb-2">
                              <div
                                className="rounded-lg p-2 flex items-center justify-center"
                                style={{
                                  backgroundImage:
                                    'linear-gradient(45deg,#222 25%,transparent 25%),linear-gradient(-45deg,#222 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#222 75%),linear-gradient(-45deg,transparent 75%,#222 75%)',
                                  backgroundSize: '12px 12px',
                                  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                                  backgroundColor: '#222',
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element -- API-gated bytes, next/image can't proxy */}
                                <img src={activeLogoUrl} alt="Logo" className="h-10 object-contain" />
                              </div>
                              <p className="text-[10px] text-white/50 text-center mt-1 truncate">
                                Usando: <span className="text-white/80 font-medium">{selectedLogoRecord?.name ?? 'Logo legado (URL)'}</span>
                              </p>
                            </div>
                          )}

                          {/* Position */}
                          <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1">Posição</label>
                          <div className="grid grid-cols-2 gap-1 mb-3">
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

                          {/* Size slider — % of min(width, height) */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-white/50 uppercase tracking-wider">Tamanho</label>
                              <span className="text-[10px] text-white/70 font-mono">{logoSizePercent.toFixed(1)}%</span>
                            </div>
                            <input
                              type="range"
                              min={2}
                              max={25}
                              step={0.5}
                              value={logoSizePercent}
                              onChange={(e) => setLogoSizePercent(parseFloat(e.target.value))}
                              className="w-full accent-yellow-400"
                            />
                          </div>

                          {/* Opacity slider */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-white/50 uppercase tracking-wider">Opacidade</label>
                              <span className="text-[10px] text-white/70 font-mono">{Math.round(logoOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={logoOpacity}
                              onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                              className="w-full accent-yellow-400"
                            />
                          </div>

                          {/* Optional white backdrop — useful for dark logos
                              over busy photos, but off by default so crisp
                              transparent logos don't get a plate they don't
                              need. */}
                          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-white/60 mt-1">
                            <input
                              type="checkbox"
                              checked={logoShowBackdrop}
                              onChange={(e) => setLogoShowBackdrop(e.target.checked)}
                              className="accent-yellow-400"
                            />
                            Fundo branco atrás do logo
                          </label>
                        </>
                      )}
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
                            disabled={processing || !hasLogoSource}
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
