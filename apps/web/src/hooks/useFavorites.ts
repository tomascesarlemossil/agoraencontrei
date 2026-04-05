'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'property_favorites'
const MAX_FAVORITES = 50

function readFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeFavorites(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage full or unavailable
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    setFavorites(readFavorites())
    setHydrated(true)
  }, [])

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setFavorites(readFavorites())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      let next: string[]
      if (prev.includes(id)) {
        next = prev.filter(fid => fid !== id)
      } else {
        if (prev.length >= MAX_FAVORITES) {
          // Remove oldest (first) to make room
          next = [...prev.slice(1), id]
        } else {
          next = [...prev, id]
        }
      }
      writeFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  )

  const getFavorites = useCallback(() => favorites, [favorites])

  const clearFavorites = useCallback(() => {
    setFavorites([])
    writeFavorites([])
  }, [])

  return { favorites, hydrated, toggleFavorite, isFavorite, getFavorites, clearFavorites }
}
