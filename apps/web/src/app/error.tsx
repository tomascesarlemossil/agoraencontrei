'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#f8f6f1' }}
    >
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div
          className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#1B2B5B' }}
        >
          <AlertTriangle className="w-10 h-10" style={{ color: '#C9A84C' }} />
        </div>

        {/* Message */}
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
        >
          Algo deu errado
        </h1>
        <p className="text-sm mb-8" style={{ color: '#1B2B5B', opacity: 0.6 }}>
          Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#C9A84C' }}
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            <Home className="w-4 h-4" />
            Página Inicial
          </Link>
        </div>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="mt-8 text-xs" style={{ color: '#1B2B5B', opacity: 0.3 }}>
            Código: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
