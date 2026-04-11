'use client'

import { useEffect } from 'react'
import { RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
  module: string
  backHref?: string
  backLabel?: string
}

export default function ErrorBoundaryFallback({
  error,
  reset,
  module,
  backHref = '/dashboard',
  backLabel = 'Voltar ao Painel',
}: Props) {
  useEffect(() => {
    console.error(`[${module}] Error:`, error)
  }, [error, module])

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h2 className="text-xl font-bold mb-2 text-white">
          Erro em {module}
        </h2>
        <p className="text-sm mb-6 text-gray-400">
          Ocorreu um erro ao carregar este módulo. Tente novamente ou volte à página anterior.
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
            href={backHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </a>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-600">
            Código: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
