'use client'

import { useEffect, useState } from 'react'

export default function PropertyGallery({
  images,
  title,
  accentColor,
}: {
  images: string[]
  title: string
  accentColor: string
}) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const safe = images.filter(Boolean)

  if (safe.length === 0) {
    return <div className="w-full aspect-[16/10] rounded-xl bg-gradient-to-br from-gray-700 to-gray-800" />
  }

  return (
    <>
      <div className="space-y-3">
        <button
          onClick={() => setLightbox(true)}
          className="block w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-800 relative group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={safe[index]} alt={title} className="h-full w-full object-cover" />
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md">
            {index + 1}/{safe.length} • ampliar
          </span>
        </button>
        {safe.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 overscroll-contain">
            {safe.map((src, i) => (
              <button
                key={src}
                onClick={() => setIndex(i)}
                className={`shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition ${
                  i === index ? '' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                style={i === index ? { borderColor: accentColor } : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox
          images={safe}
          index={index}
          setIndex={setIndex}
          title={title}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  )
}

function Lightbox({
  images,
  index,
  setIndex,
  title,
  onClose,
}: {
  images: string[]
  index: number
  setIndex: (fn: (i: number) => number) => void
  title: string
  onClose: () => void
}) {
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose, setIndex])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      style={{ height: '100dvh' }}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-4 py-3 text-white shrink-0"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm truncate">{title}</p>
        <button
          onClick={onClose}
          className="ml-3 shrink-0 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-2 relative" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index]} alt={title} className="max-h-full max-w-full object-contain rounded-lg" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIndex(i => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl flex items-center justify-center"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              onClick={() => setIndex(i => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl flex items-center justify-center"
              aria-label="Próxima"
            >
              ›
            </button>
          </>
        )}
      </div>
      <p
        className="text-center text-white/70 text-xs py-3 shrink-0"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {index + 1} / {images.length}
      </p>
    </div>
  )
}
