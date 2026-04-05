'use client'

import { useEffect, useRef, useState } from 'react'

const DEFAULT_VIDEO_ID = 'tET8AYkIxgw'

function extractYouTubeId(url: string): string {
  if (!url) return DEFAULT_VIDEO_ID
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : (url.length === 11 ? url : DEFAULT_VIDEO_ID)
}

interface Props {
  videoUrl?: string | null
  videoType?: string | null
}

export function HeroBackground({ videoUrl, videoType }: Props) {
  const isUpload = videoType === 'upload'
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Detect mobile/tablet — YouTube iframe autoplay blocked on iOS
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
    setIsMobile(mobile)
  }, [])

  // Autoplay with sound; fallback to muted if browser blocks unmuted autoplay
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.volume = 0.15
    el.muted = false
    el.play().catch(() => {
      // Browser blocked unmuted autoplay — retry muted
      el.muted = true
      el.play().catch(() => {})
    })
  }, [])

  const videoId = extractYouTubeId(videoUrl ?? '')
  const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&playsinline=1&enablejsapi=0`
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          width: 'max(100vw, calc(100vh * 16 / 9))',
          height: 'max(100vh, calc(100vw * 9 / 16))',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {isUpload && videoUrl ? (
          // Direct video upload — always works on mobile with autoPlay muted
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            muted={false}
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : isMobile ? (
          // Mobile: use static thumbnail image (YouTube iframe autoplay blocked on iOS)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt="Imobiliária Lemos"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
          />
        ) : (
          // Desktop: YouTube iframe with autoplay+mute
          <iframe
            src={embedSrc}
            allow="autoplay; fullscreen"
            className="w-full h-full"
            style={{ border: 'none', pointerEvents: 'none' }}
            title="Imobiliária Lemos"
          />
        )}
      </div>
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(15,28,58,0.82) 0%, rgba(27,43,91,0.78) 50%, rgba(30,53,104,0.80) 100%)' }}
      />
    </div>
  )
}
