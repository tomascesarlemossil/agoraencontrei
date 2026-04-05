'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Link copiado!' : 'Copiar link'}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 border-2"
      style={{
        borderColor: copied ? '#22c55e' : '#ddd9d0',
        color: copied ? '#22c55e' : '#6b7280',
        backgroundColor: copied ? '#f0fdf4' : 'transparent',
      }}
    >
      {copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
    </button>
  )
}
