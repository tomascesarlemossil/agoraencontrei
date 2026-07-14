'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api'
import { isPlatformOnly, isPlatformAdmin } from '@/lib/platform-routes'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, accessToken, refreshToken, isAuthenticated, isTokenExpired, setAuth, clearAuth } = useAuthStore()
  // O middleware do Zustand só existe no navegador. Durante o prerender do
  // Next.js ele pode estar ausente, então a leitura precisa acontecer no efeito.
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const persistence = useAuthStore.persist
    if (!persistence) {
      setHasHydrated(true)
      return
    }

    const unsubscribe = persistence.onFinishHydration(() => {
      setHasHydrated(true)
    })

    // A persistência pode ter terminado entre a inicialização do estado e o
    // registro do listener. Esta segunda leitura elimina essa janela de corrida.
    if (persistence.hasHydrated()) setHasHydrated(true)

    return unsubscribe
  }, [])

  // Defesa em profundidade: rotas exclusivas da plataforma só para super-admin.
  // Um parceiro que tentar acessar por URL direta é redirecionado ao dashboard.
  const blockedPlatformRoute = !!user && isPlatformOnly(pathname) && !isPlatformAdmin(user)
  useEffect(() => {
    if (blockedPlatformRoute) router.replace('/dashboard')
  }, [blockedPlatformRoute, router])

  useEffect(() => {
    if (!hasHydrated) return

    async function check() {
      // No tokens at all → redirect to login immediately
      if (!accessToken && !refreshToken) {
        clearAuth()
        router.replace('/login')
        return
      }

      if (!isAuthenticated()) {
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

    // Safety: if still no user after 5s, force redirect to login
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().user) {
        useAuthStore.getState().clearAuth()
        router.replace('/login')
      }
    }, 5000)
    return () => clearTimeout(timeout)
  }, [hasHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasHydrated || !user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Block users with pending verification
  if (user.status === 'PENDING_VERIFICATION') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4">
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
      <div className="min-h-[100dvh] flex items-center justify-center px-4">
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

  // Enquanto redireciona uma rota de plataforma bloqueada, não renderiza o conteúdo.
  if (blockedPlatformRoute) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
