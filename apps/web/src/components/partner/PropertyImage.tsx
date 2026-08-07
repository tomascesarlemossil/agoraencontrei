'use client'

import { useEffect, useRef, useState } from 'react'

interface PropertyImageProps {
  src?: string | null
  alt: string
  /** Classes aplicadas tanto na <img> quanto no fallback (ex.: "w-full h-full object-cover"). */
  className?: string
  /** Gradiente/estilo do fallback. Default: cinza neutro. */
  fallbackStyle?: React.CSSProperties
}

/**
 * Imagem de imóvel resiliente: se a URL de capa estiver quebrada (404, host morto,
 * import legado com link inválido), troca por um placeholder premium em vez de
 * mostrar o ícone de imagem quebrada / texto alternativo. Client component só por
 * causa do onError — o resto do card continua sendo server-rendered.
 */
export default function PropertyImage({ src, alt, className = '', fallbackStyle }: PropertyImageProps) {
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // A <img> renderizada no servidor pode ter falhado (404) ANTES da hidratação —
  // nesse caso o evento nativo `error` já disparou e o onError do React nunca roda.
  // No mount, detectamos a imagem já quebrada (complete + naturalWidth 0) e trocamos.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth === 0) setFailed(true)
  }, [src])

  if (!src || failed) {
    return (
      <div
        className={`${className} flex items-center justify-center`}
        style={fallbackStyle ?? { background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' }}
        aria-label={alt}
        role="img"
      >
        <span className="text-4xl opacity-25 select-none">🏡</span>
      </div>
    )
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
