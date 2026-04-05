'use client'

import { Columns2 } from 'lucide-react'
import { useCompare } from '@/hooks/useCompare'

interface CompareButtonProps {
  propertyId: string
  className?: string
}

export function CompareButton({ propertyId, className = '' }: CompareButtonProps) {
  const { isComparing, toggleCompare, hydrated } = useCompare()

  const comparing = hydrated && isComparing(propertyId)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleCompare(propertyId)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={comparing ? 'Remover da comparacao' : 'Adicionar a comparacao'}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
        text-xs font-medium transition-all duration-200 hover:scale-105
        shadow-md backdrop-blur-sm
        ${comparing
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-white/90 text-gray-600 hover:bg-white hover:text-gray-800'
        }
        ${className}
      `}
    >
      <Columns2 className="w-3.5 h-3.5" />
      <span>Comparar</span>
    </button>
  )
}
