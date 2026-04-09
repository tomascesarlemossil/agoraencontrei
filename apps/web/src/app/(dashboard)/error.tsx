'use client'

import { useEffect } from 'react'
import { RefreshCw, AlertTriangle, Home } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold mb-3 text-white">
          Erro no Dashboard
        </h1>
        <p className="text-sm mb-8 text-gray-400">
          Ocorreu um erro ao carregar esta página. Tente novamente ou volte ao painel.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Voltar ao Painel
          </a>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-gray-600">
            Código: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
