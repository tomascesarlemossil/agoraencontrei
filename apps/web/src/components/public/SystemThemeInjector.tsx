'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

/**
 * Fetches saved system config colors from the public API and injects them as
 * CSS custom properties on :root so that the public layout and all pages can
 * reference them via var(--site-primary-color) etc.
 *
 * Falls back gracefully: if the fetch fails the hardcoded defaults in the
 * layout's inline styles remain in effect.
 */
export function SystemThemeInjector() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return

    fetch(`${API_URL}/api/v1/public/site-settings`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return

        const vars: Record<string, string> = {}

        if (data.primaryColor)       vars['--site-primary-color']        = data.primaryColor
        if (data.accentColor)        vars['--site-accent-color']         = data.accentColor
        if (data.backgroundColor)    vars['--site-background-color']     = data.backgroundColor
        if (data.textColor)          vars['--site-text-color']           = data.textColor
        if (data.buttonPrimaryColor) vars['--site-button-primary-color'] = data.buttonPrimaryColor
        if (data.buttonTextColor)    vars['--site-button-text-color']    = data.buttonTextColor
        if (data.buttonBorderRadius != null)
          vars['--site-button-border-radius'] = `${data.buttonBorderRadius}px`
        if (data.designPrimaryColor) vars['--site-design-primary-color'] = data.designPrimaryColor
        if (data.designAccentColor)  vars['--site-design-accent-color']  = data.designAccentColor

        const root = document.documentElement
        for (const [key, value] of Object.entries(vars)) {
          root.style.setProperty(key, value)
        }
      })
      .catch(() => {
        // Silently fail — fallback colors in inline styles remain
      })
      .finally(() => setLoaded(true))
  }, [loaded])

  return null
}
