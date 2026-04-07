'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'property_compare'
const MAX_COMPARE = 4

function readCompare(): string[] {
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

function writeCompare(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage full or unavailable
  }
}

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    setCompareIds(readCompare())
    setHydrated(true)
  }, [])

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setCompareIds(readCompare())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggleCompare = useCallback((id: string) => {
    setCompareIds(prev => {
      let next: string[]
      if (prev.includes(id)) {
        next = prev.filter(cid => cid !== id)
      } else {
        if (prev.length >= MAX_COMPARE) {
          // Already at max, don't add
          return prev
        }
        next = [...prev, id]
      }
      writeCompare(next)
      return next
    })
  }, [])

  const isComparing = useCallback(
    (id: string) => compareIds.includes(id),
    [compareIds],
  )

  const getCompareIds = useCallback(() => compareIds, [compareIds])

  const clearCompare = useCallback(() => {
    setCompareIds([])
    writeCompare([])
  }, [])

  return { compareIds, hydrated, toggleCompare, isComparing, getCompareIds, clearCompare }
}
