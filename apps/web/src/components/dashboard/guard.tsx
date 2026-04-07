'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, accessToken, refreshToken, isAuthenticated, isTokenExpired, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    async function check() {
      // Se não tem token no localStorage, NÃO tenta silent refresh
      // Isso evita login automático após logout
      if (!accessToken && !refreshToken) {
        router.replace('/login')
        return
      }

      if (!isAuthenticated()) {
        // Só tenta refresh se tem refreshToken salvo localmente
        if (refreshToken) {
          try {
            const data = await authApi.refresh(refreshToken)
            setAuth(data.user as any, data.accessToken, data.expiresIn, data.refreshToken)
          } catch {
            clearAuth()
            router.replace('/login')
          }
        } else {
          router.replace('/login')
        }
        return
      }

      if (isTokenExpired()) {
        if (refreshToken) {
          try {
            const data = await authApi.refresh(refreshToken)
            setAuth(data.user as any, data.accessToken, data.expiresIn, data.refreshToken)
          } catch {
            clearAuth()
            router.replace('/login')
          }
        } else {
          clearAuth()
          router.replace('/login')
        }
      }
    }

    check()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
