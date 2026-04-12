'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock'

interface LightboxProps {
  images: string[]
  startIndex: number
  title?: string
  onClose: () => void
}

export function PropertyImageLightbox({ images, startIndex, title, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, onClose])

  // Mounted only when open — lock unconditionally while mounted
  useBodyScrollLock(true)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) dx < 0 ? next() : prev()
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
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-black/50">
        {title && <p className="text-white/70 text-sm truncate max-w-[60vw]">{title}</p>}
        <div className="flex items-center gap-4 ml-auto">
          <span className="text-white/50 text-sm tabular-nums">{current + 1} / {images.length}</span>
          <button onClick={onClose} className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-4 py-2">
        {images.length > 1 && (
          <button onClick={prev} className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full text-white bg-black/40 hover:bg-black/70 transition-all backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
        <div className="relative w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current}
            src={images[current]}
            alt={`Foto ${current + 1}`}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
        {images.length > 1 && (
          <button onClick={next} className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full text-white bg-black/40 hover:bg-black/70 transition-all backdrop-blur-sm">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden transition-all ${
                  i === current ? 'ring-2 ring-[#C9A84C] ring-offset-1 ring-offset-black' : 'opacity-40 hover:opacity-70'
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
