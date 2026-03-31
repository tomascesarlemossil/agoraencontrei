import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api'

export function useAuth() {
  const router = useRouter()
  const { user, accessToken, refreshToken, setAuth, clearAuth, isAuthenticated, isTokenExpired } = useAuthStore()

  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!isTokenExpired()) return accessToken

    try {
      const data = await authApi.refresh(refreshToken)
      setAuth(data.user as any, data.accessToken, data.expiresIn, data.refreshToken)
      return data.accessToken
    } catch {
      clearAuth()
      return null
    }
  }, [accessToken, refreshToken, isTokenExpired, setAuth, clearAuth])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password)
      setAuth(data.user as any, data.accessToken, data.expiresIn, data.refreshToken)
      router.push('/dashboard')
    },
    [setAuth, router],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    clearAuth()
    router.push('/login')
  }, [clearAuth, router])

  return { user, accessToken, isAuthenticated, getValidToken, login, logout }
}
