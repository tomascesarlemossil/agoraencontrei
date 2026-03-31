import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { negotiationsApi } from '@/lib/api'

export function useNegotiationsKanban() {
  return useQuery({ queryKey: ['negotiations-kanban'], queryFn: () => negotiationsApi.kanban() })
}

export function useNegotiations(filters = {}) {
  return useQuery({ queryKey: ['negotiations', filters], queryFn: () => negotiationsApi.list(filters) })
}

export function useCreateNegotiation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: negotiationsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['negotiations'] }),
  })
}

export function useUpdateNegotiationStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => negotiationsApi.updateStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['negotiations-kanban'] }),
  })
}
