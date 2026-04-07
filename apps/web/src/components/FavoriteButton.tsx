'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'

interface FavoriteButtonProps {
  propertyId: string
  className?: string
}

export function FavoriteButton({ propertyId, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, hydrated } = useFavorites()
  const [animating, setAnimating] = useState(false)

  const favorited = hydrated && isFavorite(propertyId)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    toggleFavorite(propertyId)
    setTimeout(() => setAnimating(false), 300)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`
        inline-flex items-center justify-center w-9 h-9 rounded-full
        transition-all duration-200 hover:scale-110
        ${favorited
          ? 'bg-red-50 hover:bg-red-100'
          : 'bg-white/90 hover:bg-white'
        }
        shadow-md backdrop-blur-sm
        ${animating ? 'scale-125' : ''}
        ${className}
      `}
      style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <Heart
        className={`w-5 h-5 transition-colors duration-200 ${
          favorited ? 'text-red-500 fill-red-500' : 'text-gray-600'
        }`}
      />
    </button>
  )
}
