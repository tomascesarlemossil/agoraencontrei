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

  // Block users with pending verification
  if (user.status === 'PENDING_VERIFICATION') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold">Verificação pendente</h1>
          <p className="text-muted-foreground">
            Sua conta ainda não foi verificada. Verifique seu e-mail para ativar o acesso ao painel.
          </p>
          <button
            onClick={() => { clearAuth(); router.replace('/login') }}
            className="text-sm text-primary underline"
          >
            Voltar para login
          </button>
        </div>
      </div>
    )
  }

  // Block suspended/inactive users
  if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-red-600">Acesso bloqueado</h1>
          <p className="text-muted-foreground">
            Sua conta está {user.status === 'SUSPENDED' ? 'suspensa' : 'inativa'}. Contate o administrador.
          </p>
          <button
            onClick={() => { clearAuth(); router.replace('/login') }}
            className="text-sm text-primary underline"
          >
            Voltar para login
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
