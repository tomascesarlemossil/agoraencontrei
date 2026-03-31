import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, setAuthToken, getAuthToken } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'corretor' | 'gerente'
  phone?: string
  avatar?: string
  creci?: string
  company?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  isAdmin: () => boolean
  isBroker: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      authApi.me()
        .then(data => setUser(data.user))
        .catch(() => setAuthToken(null))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  async function signIn(email: string, password: string) {
    const data = await authApi.login(email, password)
    setAuthToken(data.token)
    setUser(data.user)
  }

  function signOut() {
    setAuthToken(null)
    setUser(null)
  }

  async function updateProfile(updates: Partial<User>) {
    const data = await authApi.updateProfile(updates)
    setUser(prev => prev ? { ...prev, ...data.user } : null)
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      signIn, signOut, updateProfile,
      isAdmin: () => user?.role === 'admin',
      isBroker: () => ['admin', 'corretor', 'gerente'].includes(user?.role || ''),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isAuthenticated) {
    window.location.href = '/login'
    return null
  }
  return <>{children}</>
}
