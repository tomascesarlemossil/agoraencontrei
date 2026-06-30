'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

/**
 * Fetches saved system config colors from the public API and injects them as
 * CSS custom properties on :root so that the public layout and all pages can
 * reference them via var(--site-primary-color) etc.
 *
 * Also injects a <style> tag to override Tailwind arbitrary-value classes
 * (e.g. text-[#143A1F], bg-[#C9A84C]) that can't use CSS variables directly.
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

        // Inject dynamic <style> to override Tailwind arbitrary-value classes
        // that reference the default hardcoded colors.
        injectDynamicOverrides(data)
      })
      .catch(() => {
        // Silently fail — fallback colors in inline styles remain
      })
      .finally(() => setLoaded(true))
  }, [loaded])

  return null
}

/**
 * Injects a <style> element that overrides Tailwind arbitrary-value classes
 * referencing the default hardcoded hex colors (#143A1F, #C9A84C, etc.)
 * with the dynamic config values. This covers classes like:
 *   text-[#143A1F], bg-[#143A1F], border-[#C9A84C], hover:bg-[#143A1F], etc.
 */
function injectDynamicOverrides(data: {
  primaryColor?: string
  accentColor?: string
}) {
  const primary = data.primaryColor
  const accent  = data.accentColor

  const rules: string[] = []

  // Primary color overrides (#143A1F -> dynamic)
  if (primary && primary.toLowerCase() !== '#143A1F') {
    rules.push(`
      .text-\\[\\#143A1F\\], .text-\\[\\#143A1F\\] { color: ${primary} !important; }
      .bg-\\[\\#143A1F\\], .bg-\\[\\#143A1F\\] { background-color: ${primary} !important; }
      .border-\\[\\#143A1F\\], .border-\\[\\#143A1F\\] { border-color: ${primary} !important; }
      .hover\\:text-\\[\\#143A1F\\]:hover, .hover\\:text-\\[\\#143A1F\\]:hover { color: ${primary} !important; }
      .hover\\:bg-\\[\\#143A1F\\]:hover, .hover\\:bg-\\[\\#143A1F\\]:hover { background-color: ${primary} !important; }
      .hover\\:border-\\[\\#143A1F\\]:hover, .hover\\:border-\\[\\#143A1F\\]:hover { border-color: ${primary} !important; }
      .group-hover\\:text-\\[\\#143A1F\\]:is(:where(.group):hover *) { color: ${primary} !important; }
      .group-hover\\:text-\\[\\#143A1F\\]:is(:where(.group):hover *) { color: ${primary} !important; }
      .focus\\:ring-\\[\\#143A1F\\]:focus, .focus\\:ring-\\[\\#143A1F\\]:focus { --tw-ring-color: ${primary} !important; }
      .peer-checked\\:bg-\\[\\#143A1F\\]:is(:where(.peer):checked ~ *) { background-color: ${primary} !important; }
      .peer-checked\\:border-\\[\\#143A1F\\]:is(:where(.peer):checked ~ *) { border-color: ${primary} !important; }
      .accent-\\[\\#143A1F\\], .accent-\\[\\#143A1F\\] { accent-color: ${primary} !important; }
    `)
  }

  // Accent color overrides (#C9A84C -> dynamic)
  if (accent && accent.toLowerCase() !== '#c9a84c') {
    rules.push(`
      .text-\\[\\#C9A84C\\], .text-\\[\\#c9a84c\\] { color: ${accent} !important; }
      .bg-\\[\\#C9A84C\\], .bg-\\[\\#c9a84c\\] { background-color: ${accent} !important; }
      .border-\\[\\#C9A84C\\], .border-\\[\\#c9a84c\\] { border-color: ${accent} !important; }
      .hover\\:text-\\[\\#C9A84C\\]:hover, .hover\\:text-\\[\\#c9a84c\\]:hover { color: ${accent} !important; }
      .hover\\:bg-\\[\\#C9A84C\\]:hover, .hover\\:bg-\\[\\#c9a84c\\]:hover { background-color: ${accent} !important; }
      .hover\\:border-\\[\\#C9A84C\\]:hover, .hover\\:border-\\[\\#c9a84c\\]:hover { border-color: ${accent} !important; }
      .group-hover\\:text-\\[\\#C9A84C\\]:is(:where(.group):hover *) { color: ${accent} !important; }
      .group-hover\\:text-\\[\\#c9a84c\\]:is(:where(.group):hover *) { color: ${accent} !important; }
      .focus\\:ring-\\[\\#C9A84C\\]:focus, .focus\\:ring-\\[\\#c9a84c\\]:focus { --tw-ring-color: ${accent} !important; }
      .accent-\\[\\#C9A84C\\], .accent-\\[\\#c9a84c\\] { accent-color: ${accent} !important; }
    `)
  }

  if (rules.length === 0) return

  const existingStyle = document.getElementById('system-theme-overrides')
  if (existingStyle) existingStyle.remove()

  const style = document.createElement('style')
  style.id = 'system-theme-overrides'
  style.textContent = rules.join('\n')
  document.head.appendChild(style)
}
