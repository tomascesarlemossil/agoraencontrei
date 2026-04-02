'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all hover:shadow-md hover:bg-gray-50"
      style={{ borderColor: '#ddd9d0', color: '#1B2B5B' }}
    >
      <Printer className="w-5 h-5" style={{ color: '#C9A84C' }} />
      Imprimir Ficha
    </button>
  )
}
