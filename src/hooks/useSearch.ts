import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property, PropertyType, PropertyPurpose } from '@/types'

// ============================================================
// TYPES
// ============================================================

export interface SearchFilters {
  finalidade?: PropertyPurpose
  tipo?: PropertyType
  cidade?: string
  quartos_min?: number
  preco_min?: number
  preco_max?: number
}

export interface SearchState {
  query: string
  filters: SearchFilters
  results: Property[]
  suggestions: string[]
  correctedQuery: string | null
  isLoading: boolean
  error: string | null
  hasSearched: boolean
  totalCount: number
}

export interface UseSearchReturn extends SearchState {
  search: (query: string, filters?: SearchFilters) => void
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  reset: () => void
}

interface AISearchResponse {
  properties: Property[]
  correctedQuery?: string
  suggestions?: string[]
  totalCount: number
}

const DEBOUNCE_MS = 300

const initialState: SearchState = {
  query: '',
  filters: {},
  results: [],
  suggestions: [],
  correctedQuery: null,
  isLoading: false,
  error: null,
  hasSearched: false,
  totalCount: 0,
}

// ============================================================
// HOOK
// ============================================================

/**
 * Manages AI-powered search state for the Home and Search pages.
 *
 * - Debounces the query by 300 ms before calling the edge function.
 * - Calls the `ai-search` Supabase edge function with the query and filters.
 * - Returns results, loading state, suggestions, and a corrected query when applicable.
 *
 * @example
 * const { results, isLoading, suggestions, search, reset } = useSearch()
 * search('casa 3 quartos piscina franca')
 */
export function useSearch(): UseSearchReturn {
  const [state, setState] = useState<SearchState>(initialState)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortController = useRef<AbortController | null>(null)

  // Executes the actual search against the edge function
  const executeSearch = useCallback(async (query: string, filters: SearchFilters) => {
    if (query.trim().length < 3) {
      setState((prev) => ({
        ...prev,
        results: [],
        suggestions: [],
        correctedQuery: null,
        isLoading: false,
        error: null,
        hasSearched: false,
        totalCount: 0,
      }))
      return
    }

    // Cancel any in-flight request
    if (abortController.current) {
      abortController.current.abort()
    }
    abortController.current = new AbortController()

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const { data, error } = await supabase.functions.invoke<AISearchResponse>('ai-search', {
        body: { query: query.trim(), filters },
      })

      if (error) throw new Error(error.message)
      if (!data) throw new Error('Resposta vazia da busca')

      setState((prev) => ({
        ...prev,
        results: data.properties ?? [],
        suggestions: data.suggestions ?? [],
        correctedQuery: data.correctedQuery ?? null,
        totalCount: data.totalCount ?? 0,
        isLoading: false,
        hasSearched: true,
        error: null,
      }))
    } catch (err) {
      // Ignore abort errors — they are intentional
      if (err instanceof Error && err.name === 'AbortError') return

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido na busca',
        hasSearched: true,
      }))
    }
  }, [])

  // Debounced search triggered by query/filter state changes
  useEffect(() => {
    if (!state.hasSearched && state.query.trim().length < 3) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(() => {
      executeSearch(state.query, state.filters)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [state.query, state.filters, executeSearch, state.hasSearched])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (abortController.current) abortController.current.abort()
    }
  }, [])

  /**
   * Triggers an immediate search (used when the user submits the form).
   * Cancels the debounce timer and fires right away.
   */
  const search = useCallback(
    (query: string, filters?: SearchFilters) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)

      const nextFilters = filters ?? state.filters

      setState((prev) => ({
        ...prev,
        query,
        filters: nextFilters,
        isLoading: true,
        error: null,
      }))

      executeSearch(query, nextFilters)
    },
    [state.filters, executeSearch]
  )

  const setQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }))
  }, [])

  const setFilters = useCallback((filters: SearchFilters) => {
    setState((prev) => ({ ...prev, filters }))
  }, [])

  const reset = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (abortController.current) abortController.current.abort()
    setState(initialState)
  }, [])

  return {
    ...state,
    search,
    setQuery,
    setFilters,
    reset,
  }
}
