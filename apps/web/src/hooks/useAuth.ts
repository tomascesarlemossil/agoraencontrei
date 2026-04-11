import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api'

// Shared refresh lock — prevents concurrent refresh requests across all hook instances
let refreshPromise: Promise<string | null> | null = null

export function useAuth() {
  const router = useRouter()
  const { user, accessToken, refreshToken, setAuth, clearAuth, isAuthenticated, isTokenExpired } = useAuthStore()

  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!isTokenExpired()) return accessToken

    // If another refresh is already in flight, wait for it
    if (refreshPromise) return refreshPromise

    refreshPromise = (async () => {
      try {
        const data = await authApi.refresh(refreshToken)
        setAuth(data.user as any, data.accessToken, data.expiresIn, data.refreshToken)
        return data.accessToken
      } catch {
        clearAuth()
        return null
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }, [accessToken, refreshToken, isTokenExpired, setAuth, clearAuth])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password)
      setAuth(data.user as any, data.accessToken, data.expiresIn, data.refreshToken)
      router.push('/dashboard')
    },
    [setAuth, router],
  )

  const googleLogin = useCallback(
    async (credential: string) => {
      const data = await authApi.googleLogin(credential)
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
    // Forçar limpeza de cookies httpOnly no browser
    document.cookie = 'access_token=; Max-Age=0; path=/;'
    document.cookie = 'refresh_token=; Max-Age=0; path=/;'
    // Limpar qualquer vestígio de auth no localStorage
    try { localStorage.removeItem('auth') } catch {}
    router.push('/login')
  }, [clearAuth, router])

  return { user, accessToken, isAuthenticated, getValidToken, login, googleLogin, logout }
}
