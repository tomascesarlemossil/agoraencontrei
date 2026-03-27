import { useEffect } from 'react'
import type { SEOConfig } from '@/utils/seo'
import { defaultSEO } from '@/utils/seo'

// ============================================================
// HELPERS
// ============================================================

function setMetaTag(
  selector: string,
  attribute: string,
  value: string,
  content: string
): void {
  let el = document.querySelector<HTMLMetaElement>(selector)

  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, value)
    document.head.appendChild(el)
  }

  el.setAttribute('content', content)
}

function setLinkTag(rel: string, href: string): void {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)

  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }

  el.setAttribute('href', href)
}

function removeLinkTag(rel: string): void {
  const el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (el) el.remove()
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * Headless SEO component — renders nothing in the DOM but keeps
 * `<head>` meta tags in sync with the current page props.
 *
 * @example
 * <SEO
 *   title="Casa 3 Quartos - Centro - Franca | Imobiliária Lemos"
 *   description="Casa para venda no Centro de Franca..."
 * />
 */
export function SEO({
  title,
  description,
  keywords,
  ogImage,
  canonical,
  noindex,
}: SEOConfig) {
  useEffect(() => {
    const appName = import.meta.env.VITE_APP_NAME ?? 'Imobiliária Lemos'
    const appUrl = import.meta.env.VITE_APP_URL ?? 'https://www.imobiliarialemos.com.br'
    const resolvedOgImage = ogImage ?? defaultSEO.ogImage ?? `${appUrl}/og-image.jpg`

    // ── Page title ──────────────────────────────────────────
    document.title = title

    // ── Standard meta ───────────────────────────────────────
    setMetaTag('meta[name="description"]', 'name', 'description', description)

    if (keywords?.length) {
      setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords.join(', '))
    }

    if (noindex) {
      setMetaTag('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow')
    } else {
      setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow')
    }

    // ── Open Graph ──────────────────────────────────────────
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title)
    setMetaTag(
      'meta[property="og:description"]',
      'property',
      'og:description',
      description
    )
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', appName)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', resolvedOgImage)
    setMetaTag(
      'meta[property="og:image:alt"]',
      'property',
      'og:image:alt',
      `${appName} - Imóveis em Franca SP`
    )

    if (canonical) {
      setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    }

    // ── Twitter Card ────────────────────────────────────────
    setMetaTag(
      'meta[name="twitter:card"]',
      'name',
      'twitter:card',
      'summary_large_image'
    )
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMetaTag(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      description
    )
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedOgImage)

    // ── Canonical ───────────────────────────────────────────
    if (canonical) {
      setLinkTag('canonical', canonical)
    } else {
      removeLinkTag('canonical')
    }
  }, [title, description, keywords, ogImage, canonical, noindex])

  return null
}
