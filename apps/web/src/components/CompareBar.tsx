'use client'

import { useRouter } from 'next/navigation'
import { Columns2, X } from 'lucide-react'
import { useCompare } from '@/hooks/useCompare'

export function CompareBar() {
  const { compareIds, hydrated, clearCompare } = useCompare()
  const router = useRouter()

  if (!hydrated || compareIds.length < 2) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl border-t"
      style={{ backgroundColor: '#1B2B5B', borderColor: 'rgba(201, 168, 76, 0.3)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Columns2 className="w-5 h-5 flex-shrink-0" style={{ color: '#C9A84C' }} />
          <span className="text-white text-sm font-medium">
            {compareIds.length} {compareIds.length === 1 ? 'imovel selecionado' : 'imoveis selecionados'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearCompare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
          <button
            onClick={() => router.push('/comparar')}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            Comparar agora
          </button>
        </div>
      </div>
    </div>
  )
}
