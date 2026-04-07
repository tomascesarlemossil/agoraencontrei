'use client'

import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  videoUrl: string | null
  bannerUrl: string | null
  bannerLink: string | null
  title: string | null
  subtitle: string | null
}

export function PresentationSection({ videoUrl, bannerUrl, bannerLink, title, subtitle }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false) // começa com som ligado

  // Tenta autoplay com som; se bloqueado pelo browser, cai para muted
  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    el.volume = 0.15 // volume baixo (15%)
    el.muted = false

    const tryPlay = async () => {
      try {
        await el.play()
        setPlaying(true)
        setMuted(false)
      } catch {
        // Browser bloqueou autoplay com som — tenta muted
        el.muted = true
        setMuted(true)
        try {
          await el.play()
          setPlaying(true)
        } catch {
          setPlaying(false)
        }
      }
    }

    // Intersection Observer — só reproduz quando visível
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tryPlay()
        } else {
          el.pause()
          setPlaying(false)
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) }
    else { el.pause(); setPlaying(false) }
  }

  const toggleMute = () => {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    if (!el.muted) el.volume = 0.15
    setMuted(el.muted)
  }

  // ── Banner mode ─────────────────────────────────────────────────────────────
  if (bannerUrl && !videoUrl) {
    const inner = (
      <div
        className="relative w-full overflow-hidden rounded-2xl shadow-xl"
        style={{
          border: '4px solid #C9A84C',
          boxShadow: '0 0 0 2px #8B6914, 0 8px 32px rgba(201,168,76,0.35)',
        }}
      >
        <Image
          src={bannerUrl}
          alt={title ?? 'Banner Imobiliária Lemos'}
          width={1280}
          height={480}
          className="w-full object-cover"
          priority
        />
        {(title || subtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center px-6">
            {title && (
              <h2 className="text-2xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {title}
              </h2>
            )}
            {subtitle && <p className="text-sm sm:text-base text-white/80 max-w-xl">{subtitle}</p>}
          </div>
        )}
      </div>
    )
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {bannerLink ? (
          <Link href={bannerLink} target="_blank" rel="noopener noreferrer">
            {inner}
          </Link>
        ) : inner}
      </section>
    )
  }

  // ── Video mode ──────────────────────────────────────────────────────────────
  if (!videoUrl) return null

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#C9A84C' }}>
          Imobiliária Lemos
        </p>
        <h2 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          {title ?? 'Conheça o nosso novo site'}
        </h2>
        {subtitle && (
          <p className="text-gray-500 text-sm mt-1 max-w-xl mx-auto">{subtitle}</p>
        )}
        {!subtitle && (
          <p className="text-gray-500 text-sm mt-1">
            Veja como ficou a nossa nova plataforma e tudo que preparamos para você
          </p>
        )}
      </div>

      {/* Video container — borda dourada igual ao ícone dos corretores */}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-black"
        style={{
          aspectRatio: '16/9',
          border: '4px solid #C9A84C',
          boxShadow: '0 0 0 2px #8B6914, 0 12px 40px rgba(201,168,76,0.4), 0 4px 20px rgba(0,0,0,0.3)',
          borderRadius: '20px',
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          playsInline
          className="w-full h-full object-cover"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onVolumeChange={() => {
            const el = videoRef.current
            if (el) setMuted(el.muted)
          }}
        />

        {/* Gradient overlay (bottom) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
        />

        {/* Controls */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/35 transition-colors"
            aria-label={playing ? 'Pausar' : 'Reproduzir'}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMute}
            className="flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-sm text-white transition-colors"
            style={{
              backgroundColor: muted ? 'rgba(255,255,255,0.2)' : 'rgba(201,168,76,0.75)',
            }}
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
            title={muted ? 'Clique para ativar o som' : 'Som ativo — clique para silenciar'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {muted && (
            <span className="text-white/80 text-xs backdrop-blur-sm bg-black/30 px-2 py-0.5 rounded-full">
              Toque para ativar o som
            </span>
          )}
        </div>

        {/* Lemos badge */}
        <div
          className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(201,168,76,0.9)', color: '#1B2B5B' }}
        >
          Imobiliária Lemos
        </div>
      </div>

      {/* CTA below video */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        <a
          href="https://wa.me/5516981010004?text=Olá! Vi o vídeo do novo site e gostaria de saber mais."
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
          style={{ backgroundColor: '#25D366', color: 'white' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Falar com um corretor
        </a>
        <Link
          href="/imoveis"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold border-2 transition-all hover:bg-[#1B2B5B] hover:text-white"
          style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
        >
          Ver imóveis disponíveis
        </Link>
      </div>
    </section>
  )
}
