'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const CONSENT_KEY = 'cookie_consent'

function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return false
    const consent = JSON.parse(raw)
    return consent?.analytics === true
  } catch {
    return false
  }
}

export function GoogleAnalytics() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    // Só carrega o GA4 após o consentimento de cookies analíticos (LGPD).
    const check = () => setAllowed(hasAnalyticsConsent())
    check()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) check()
    }
    window.addEventListener('storage', handleStorage)
    // Poll breve para captar o consentimento dado na mesma aba.
    const interval = setInterval(check, 2000)
    const timeout = setTimeout(() => clearInterval(interval), 30000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  if (!GA_ID || !allowed) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}
