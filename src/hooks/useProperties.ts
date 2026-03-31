import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { propertiesApi, aiApi } from '@/lib/api'

export interface PropertyFilters {
  search?: string
  tipo?: string
  finalidade?: string
  cidade?: string
  preco_min?: number
  preco_max?: number
  quartos?: number
  page?: number
  limit?: number
  sort?: string
}

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertiesApi.list(filters),
    staleTime: 1000 * 60 * 5,
  })
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => propertiesApi.featured(),
    staleTime: 1000 * 60 * 10,
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getById(id),
    enabled: !!id,
  })
}

export function usePropertyCities() {
  return useQuery({
    queryKey: ['property-cities'],
    queryFn: () => propertiesApi.cities(),
    staleTime: 1000 * 60 * 60,
  })
}

export function usePropertySearch() {
  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [correctedQuery, setCorrectedQuery] = useState<string>()

  async function search(query: string, filters?: PropertyFilters) {
    setIsLoading(true)
    try {
      const data = await aiApi.search(query, filters)
      setResults(data.properties)
      setTotal(data.total)
      setCorrectedQuery(data.correctedQuery)
    } catch {
      const data = await propertiesApi.list({ search: query, ...filters })
      setResults(data.properties)
      setTotal(data.total)
    } finally {
      setIsLoading(false)
    }
  }

  return { results, total, isLoading, correctedQuery, search }
}

export function useCreateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: propertiesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  })
}

export function useUpdateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => propertiesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  })
}

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: propertiesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  })
}
