'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Images, ZoomIn } from 'lucide-react'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'

interface PropertyGalleryProps {
  images: string[]
  title: string
  purpose?: string
  type?: string
  purposeLabel?: string
  typeLabel?: string
}

// ── Lightbox ───────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  startIndex,
  title,
  onClose,
}: {
  images: string[]
  startIndex: number
  title: string
  onClose: () => void
}) {
  const [current, setCurrent] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  // Lightbox is mounted only when open — lock unconditionally while mounted
  useBodyScrollLock(true)

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? next() : prev()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ backgroundColor: 'rgba(0,0,0,0.97)' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <p className="text-white/70 text-sm font-medium truncate max-w-[60vw]">{title}</p>
        <div className="flex items-center gap-4">
          <span className="text-white/50 text-sm tabular-nums">{current + 1} / {images.length}</span>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-4 py-2">
        {/* Prev button */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full text-white bg-black/40 hover:bg-black/70 transition-all backdrop-blur-sm"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        <div className="relative w-full h-full">
          <Image
            key={current}
            src={images[current]}
            alt={`${title} — foto ${current + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
            quality={85}
          />
        </div>

        {/* Next button */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full text-white bg-black/40 hover:bg-black/70 transition-all backdrop-blur-sm"
            aria-label="Próxima foto"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-start">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`flex-shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden transition-all ${
                  i === current
                    ? 'ring-2 ring-[#C9A84C] ring-offset-1 ring-offset-black opacity-100'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Public Gallery (property detail page) ─────────────────────────────────────

export function PropertyGallery({
  images,
  title,
  purposeLabel,
  typeLabel,
}: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div
        className="rounded-2xl h-64 flex flex-col items-center justify-center gap-3"
        style={{ backgroundColor: '#f0ece4' }}
      >
        <span className="text-5xl opacity-30">🏠</span>
        <p className="text-sm text-gray-500">Sem fotos disponíveis</p>
      </div>
    )
  }

  const main = images[0]
  const thumbs = images.slice(1, 5)
  const remaining = images.length - 5

  return (
    <>
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#e8e4dc' }}>
        {/* Main image */}
        <div
          className="relative cursor-zoom-in"
          style={{ height: 'clamp(240px, 45vw, 480px)' }}
          onClick={() => setLightboxIndex(0)}
        >
          <Image
            src={main}
            alt={title}
            fill
            className="object-cover hover:scale-[1.02] transition-transform duration-500"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
            quality={85}
          />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
            {purposeLabel && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full shadow"
                style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
              >
                {purposeLabel}
              </span>
            )}
            {typeLabel && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full shadow"
                style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: '#1B2B5B' }}
              >
                {typeLabel}
              </span>
            )}
          </div>

          {/* "Ver todas as fotos" button */}
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4">
              <button
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl backdrop-blur-sm transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: '#1B2B5B' }}
                onClick={e => { e.stopPropagation(); setLightboxIndex(0) }}
              >
                <Images className="w-3.5 h-3.5" />
                Ver {images.length} fotos
              </button>
            </div>
          )}

          {/* Zoom hint overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-black/30 rounded-full p-3 backdrop-blur-sm">
              <ZoomIn className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Thumbnail grid */}
        {thumbs.length > 0 && (
          <div className={`grid gap-1 p-1 ${thumbs.length === 1 ? 'grid-cols-1' : thumbs.length === 2 ? 'grid-cols-2' : thumbs.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {thumbs.map((img, i) => (
              <div
                key={i}
                className="relative rounded-lg overflow-hidden cursor-zoom-in group"
                style={{ height: 'clamp(64px, 8vw, 96px)' }}
                onClick={() => setLightboxIndex(i + 1)}
              >
                <Image
                  src={img}
                  alt={`${title} — foto ${i + 2}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="25vw"
                  quality={85}
                />
                {/* Last thumbnail — show remaining count */}
                {i === 3 && remaining > 0 && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold"
                    style={{ backgroundColor: 'rgba(27,43,91,0.75)' }}
                  >
                    <span className="text-lg leading-none">+{remaining}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">fotos</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          startIndex={lightboxIndex}
          title={title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
