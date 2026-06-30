'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

const ROOT_ID = 'ae-root'

/**
 * Public-site light/dark toggle. The theme is a scoped class (`ae-light` /
 * `ae-dark`) on the public layout wrapper (#ae-root), set server-side + by a
 * no-flash inline script. This button flips that class and persists the choice
 * in a cookie (read on the next SSR pass) and localStorage. It deliberately
 * does NOT touch the dashboard, which owns its own always-dark `.dark` scope.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const root = document.getElementById(ROOT_ID)
    if (!root) {
      setMounted(true)
      return
    }
    // Re-assert the persisted theme on mount. On full page loads the inline
    // no-flash script already applied it; this also covers App Router soft
    // navigations (e.g. dashboard → public) where that script does not re-run.
    let saved: string | null = null
    const m = document.cookie.match(/(?:^|; )ae-theme=([^;]+)/)
    saved = m ? m[1] : null
    if (!saved) {
      try {
        saved = localStorage.getItem('ae-theme')
      } catch {
        /* storage blocked */
      }
    }
    if (!saved) {
      saved = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    const isDark = saved === 'dark'
    root.classList.toggle('ae-dark', isDark)
    root.classList.toggle('ae-light', !isDark)
    setDark(isDark)
    setMounted(true)
  }, [])

  const toggle = () => {
    const root = document.getElementById(ROOT_ID)
    if (!root) return
    const next = !root.classList.contains('ae-dark')
    root.classList.toggle('ae-dark', next)
    root.classList.toggle('ae-light', !next)
    try {
      document.cookie = `ae-theme=${next ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`
      localStorage.setItem('ae-theme', next ? 'dark' : 'light')
    } catch {
      /* storage blocked — class toggle alone still works for this session */
    }
    setDark(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={dark ? 'Modo claro' : 'Modo escuro'}
      className={
        className ??
        'flex items-center justify-center p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors'
      }
    >
      {/* Before mount we render the moon to match the light-default SSR output;
          after mount the icon reflects the real state. */}
      {mounted && dark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
    </button>
  )
}

export default ThemeToggle
