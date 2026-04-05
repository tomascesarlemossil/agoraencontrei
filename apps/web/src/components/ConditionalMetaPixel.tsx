'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const META_PIXEL_ID = '932688306232065'
const CONSENT_KEY = 'cookie_consent'

function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    if (!raw) return false
    const consent = JSON.parse(raw)
    return consent?.marketing === true
  } catch {
    return false
  }
}

export function ConditionalMetaPixel() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    // Check consent on mount and on storage changes (when user accepts/rejects)
    const check = () => setAllowed(hasMarketingConsent())
    check()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) check()
    }
    window.addEventListener('storage', handleStorage)

    // Also poll briefly in case consent changes in same tab
    const interval = setInterval(check, 2000)
    const timeout = setTimeout(() => clearInterval(interval), 30000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  if (!allowed) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
