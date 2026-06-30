import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { buildColors, ThemeColors } from '../utils/theme'
import { getToken, setToken as persistToken, Auth } from '../services/api'
import { t as translate, TKey } from '../utils/i18n'

type User = { id: string; name?: string; email: string; role?: string } | null

type AppContextType = {
  ready: boolean
  isDarkMode: boolean
  toggleDarkMode: () => void
  colors: ThemeColors
  language: string
  changeLanguage: (lang: string) => void
  t: (key: TKey) => string
  notificationsEnabled: boolean
  toggleNotifications: () => void
  user: User
  signIn: (token: string, user: User) => Promise<void>
  signOut: () => Promise<void>
  favorites: string[]
  isFavorite: (id: string | number) => boolean
  toggleFavorite: (id: string | number) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const system = useColorScheme()
  const [ready, setReady] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(system === 'dark')
  const [language, setLanguage] = useState('pt-BR')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [user, setUser] = useState<User>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    (async () => {
      try {
        const [theme, lang, token, favs] = await Promise.all([
          AsyncStorage.getItem('@theme'),
          AsyncStorage.getItem('@lang'),
          getToken(),
          AsyncStorage.getItem('@favorites'),
        ])
        if (theme) setIsDarkMode(theme === 'dark')
        if (lang) setLanguage(lang)
        if (favs) { try { setFavorites(JSON.parse(favs)) } catch { /* noop */ } }
        if (token) {
          // Restaura sessão validando o token contra o MESMO backend da web.
          try { const me: any = await Auth.me(); setUser(me?.user || me || null) } catch { await persistToken(null) }
        }
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((d) => { AsyncStorage.setItem('@theme', !d ? 'dark' : 'light'); return !d })
  }, [])
  const changeLanguage = useCallback((lang: string) => {
    setLanguage(lang); AsyncStorage.setItem('@lang', lang)
  }, [])
  const toggleNotifications = useCallback(() => setNotificationsEnabled((n) => !n), [])

  const signIn = useCallback(async (token: string, u: User) => {
    await persistToken(token); setUser(u)
  }, [])
  const signOut = useCallback(async () => {
    await persistToken(null); setUser(null)
  }, [])

  const isFavorite = useCallback((id: string | number) => favorites.includes(String(id)), [favorites])
  const toggleFavorite = useCallback((id: string | number) => {
    setFavorites((prev) => {
      const key = String(id)
      const next = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
      AsyncStorage.setItem('@favorites', JSON.stringify(next))
      return next
    })
  }, [])

  const colors = buildColors(isDarkMode)
  const t = useCallback((key: TKey) => translate(language, key), [language])

  return (
    <AppContext.Provider value={{
      ready, isDarkMode, toggleDarkMode, colors, language, changeLanguage, t,
      notificationsEnabled, toggleNotifications, user, signIn, signOut,
      favorites, isFavorite, toggleFavorite,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
