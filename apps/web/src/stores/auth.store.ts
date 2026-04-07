import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '@/lib/api'

interface AuthState {
  user: (User & { company: Company }) | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  setAuth: (user: User & { company: Company }, token: string, expiresIn: number, refreshToken?: string) => void
  updateUser: (user: Partial<User & { company: Company }>) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,

      setAuth: (user, token, expiresIn, refreshToken) =>
        set({
          user,
          accessToken: token,
          expiresAt: Date.now() + expiresIn * 1000,
          ...(refreshToken !== undefined && { refreshToken }),
        }),

      updateUser: (partial) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...partial } : null,
        })),

      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, expiresAt: null }),

      isAuthenticated: () => {
        const { user, accessToken } = get()
        return !!(user && accessToken)
      },

      isTokenExpired: () => {
        const { expiresAt } = get()
        if (!expiresAt) return true
        return Date.now() >= expiresAt - 60_000 // 60s buffer
      },
    }),
    {
      name: 'auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        expiresAt: s.expiresAt,
      }),
    },
  ),
)
