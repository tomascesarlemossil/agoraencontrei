'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'cookie_consent'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true, marketing: true, date: new Date().toISOString() }))
    setShow(false)
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false, marketing: false, date: new Date().toISOString() }))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6">
      <div
        className="max-w-4xl mx-auto rounded-2xl shadow-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4"
        style={{ backgroundColor: '#1B2B5B', border: '1px solid rgba(201, 168, 76, 0.3)' }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 leading-relaxed">
            Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e analisar nosso tráfego.
            Ao clicar em &quot;Aceitar&quot;, você concorda com o uso de cookies conforme nossa{' '}
            <Link href="/politica-privacidade" className="underline text-yellow-300 hover:text-yellow-200">
              Política de Privacidade
            </Link>.
          </p>
          <p className="text-xs text-white/50 mt-1">
            Lei Geral de Proteção de Dados (LGPD) — Lei nº 13.709/2018
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            Rejeitar
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #d4b85c)' }}
          >
            Aceitar Cookies
          </button>
        </div>
      </div>
    </div>
  )
}
