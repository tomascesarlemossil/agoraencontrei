import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsApi } from '@/lib/api'

export function useLeads(filters = {}) {
  return useQuery({ queryKey: ['leads', filters], queryFn: () => leadsApi.list(filters) })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => leadsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useConvertLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => leadsApi.convert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
