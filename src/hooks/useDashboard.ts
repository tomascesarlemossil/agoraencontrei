import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'

export function useDashboardStats() {
  return useQuery({ queryKey: ['dashboard-stats'], queryFn: dashboardApi.stats, staleTime: 1000 * 60 * 5 })
}

export function useNegotiationsByMonth() {
  return useQuery({ queryKey: ['negotiations-by-month'], queryFn: dashboardApi.negotiationsByMonth })
}

export function useLeadsByOrigin() {
  return useQuery({ queryKey: ['leads-by-origin'], queryFn: dashboardApi.leadsByOrigin })
}

export function useRecentActivity() {
  return useQuery({ queryKey: ['activity'], queryFn: dashboardApi.activity })
}

export function useTodayAgenda() {
  return useQuery({ queryKey: ['agenda-today'], queryFn: dashboardApi.agendaToday })
}
