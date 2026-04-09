'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { Sparkles } from 'lucide-react'

const DEFAULT_MESSAGE = 'Olá {nome}, está preparado para vender muito? Agora com a experiência da AgoraEncontrei você tem tudo na palma da sua mão e automatizado, não se esqueça disso. Boas Vendas!!!'
const DEFAULT_DURATION = 6000 // 6 seconds
const SESSION_KEY = 'welcome_toast_shown'

export function WelcomeToast() {
  const user = useAuthStore(s => s.user)
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!user?.name) return

    // Only show once per session
    const shown = sessionStorage.getItem(SESSION_KEY)
    if (shown) return

    // Small delay for dashboard to load first
    const showTimer = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem(SESSION_KEY, '1')
    }, 800)

    return () => clearTimeout(showTimer)
  }, [user?.name])

  useEffect(() => {
    if (!visible) return

    // Get custom duration from user settings or use default
    const settings = (user as any)?.settings ?? {}
    const duration = settings.welcomeDuration ?? DEFAULT_DURATION

    const fadeTimer = setTimeout(() => setFading(true), duration - 500)
    const hideTimer = setTimeout(() => setVisible(false), duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [visible, user])

  if (!visible || !user?.name) return null

  // Get custom message from user settings or use default
  const settings = (user as any)?.settings ?? {}
  const template = settings.welcomeMessage ?? DEFAULT_MESSAGE
  const message = template.replace(/\{nome\}/g, user.name.split(' ')[0])

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <div
        className="pointer-events-auto max-w-lg mx-4 rounded-2xl p-8 text-center shadow-2xl border"
        style={{
          background: 'linear-gradient(135deg, #1B2B5B 0%, #0f1c3a 100%)',
          borderColor: 'rgba(201,168,76,0.3)',
        }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
            <Sparkles className="w-7 h-7" style={{ color: '#C9A84C' }} />
          </div>
        </div>
        <p className="text-white text-base leading-relaxed font-medium" style={{ fontFamily: 'Georgia, serif' }}>
          {message}
        </p>
        <div className="mt-4 h-1 rounded-full overflow-hidden bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: '#C9A84C',
              animation: `shrink ${(settings.welcomeDuration ?? DEFAULT_DURATION) / 1000}s linear forwards`,
            }}
          />
        </div>
        <style>{`@keyframes shrink { from { width: 100% } to { width: 0% } }`}</style>
      </div>
    </div>
  )
}
