'use client'

import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications'

export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  useRealTimeNotifications()
  return <>{children}</>
}
