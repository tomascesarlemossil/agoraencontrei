'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

const DEFAULT_VIDEO_ID = 'tET8AYkIxgw'

function extractYouTubeId(url: string): string {
  if (!url) return DEFAULT_VIDEO_ID
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : (url.length === 11 ? url : DEFAULT_VIDEO_ID)
}

interface Props {
  videoUrl?: string | null
  videoType?: string | null
  imageUrl?: string | null
}

export function HeroBackground({ videoUrl, videoType, imageUrl }: Props) {
  const isUpload = videoType === 'upload'
  const isImage = videoType === 'image'
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.volume = 0.15
    el.muted = false
    el.play().catch(() => {
      el.muted = true
      el.play().catch(() => {})
    })
  }, [])

  // ── Modo imagem (padrão quando não há vídeo configurado) ──────────────────
  // Prioridade: videoUrl (quando tipo=image) > imageUrl (fallback do admin) > hero-banner.jpg (local)
  const heroBannerSrc = (isImage && videoUrl) ? videoUrl : (imageUrl || '/hero-banner.jpg')
  const useImageBg = isImage || (!videoUrl && !isUpload)

  if (useImageBg) {
    // Imagem padrão local: serve uma versão bem mais leve (~12KB vs ~60KB) em
    // telas pequenas via <picture>/<source> — puramente CSS/HTML, sem depender
    // do pipeline de otimização do Next (que exigiria liberar qualquer host
    // externo que o admin configure para heroImageUrl). Uploads customizados
    // do admin continuam servidos como estão, sem essa otimização adicional.
    const isDefaultHero = heroBannerSrc === '/hero-banner.jpg'
    const imgStyle: CSSProperties = {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      // No mobile: foca no lado direito (onde a mulher está posicionada na imagem)
      objectPosition: isMobile ? '80% center' : 'center center',
    }
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Imagem de fundo — object-position otimizado para mobile */}
        {isDefaultHero ? (
          <picture>
            <source media="(max-width: 767px)" srcSet="/hero-banner-mobile.jpg" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero-banner.jpg" alt="AgoraEncontrei Marketplace Imobiliário" style={imgStyle} loading="eager" fetchPriority="high" />
          </picture>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroBannerSrc} alt="AgoraEncontrei Marketplace Imobiliário" style={imgStyle} loading="eager" fetchPriority="high" />
        )}
        {/* Overlay gradiente — mais escuro no mobile para legibilidade */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isMobile
              ? 'linear-gradient(180deg, rgba(10,20,45,0.82) 0%, rgba(10,20,45,0.58) 35%, rgba(10,20,45,0.88) 100%)'
              : 'linear-gradient(135deg, rgba(10,20,45,0.72) 0%, rgba(15,28,58,0.55) 40%, rgba(10,20,45,0.65) 100%)',
          }}
        />
      </div>
    )
  }

  // ── Modo vídeo ─────────────────────────────────────────────────────────────
  const videoId = extractYouTubeId(videoUrl ?? '')
  const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&playsinline=1&enablejsapi=0`
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 'max(100vw, calc(100vh * 16 / 9))',
          height: 'max(100vh, calc(100vw * 9 / 16))',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {isUpload && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted={false}
            loop
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : isMobile ? (
          // No mobile: thumbnail do YouTube (evita iframe pesado)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt="Imobiliária Lemos"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '80% center' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            }}
          />
        ) : (
          <iframe
            src={embedSrc}
            allow="autoplay; fullscreen"
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
            title="Imobiliária Lemos"
          />
        )}
      </div>
      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isMobile
            ? 'linear-gradient(180deg, rgba(15,28,58,0.84) 0%, rgba(15,28,58,0.62) 45%, rgba(15,28,58,0.90) 100%)'
            : 'linear-gradient(135deg, rgba(15,28,58,0.82) 0%, rgba(20,58,31,0.78) 50%, rgba(30,53,104,0.80) 100%)',
        }}
      />
    </div>
  )
}
