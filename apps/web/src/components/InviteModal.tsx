'use client'

import { useState, useEffect } from 'react'
import { X, Share2, Gift, Users } from 'lucide-react'

const STORAGE_KEY = 'ae_invite_modal_dismissed'
const DISMISS_DAYS = 7

interface InviteModalProps {
  isLoggedIn?: boolean
  userSlug?: string
}

export function InviteModal({ isLoggedIn, userSlug }: InviteModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return

    // Check if dismissed recently
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
      if (daysSince < DISMISS_DAYS) return
    }

    // Show after 30 seconds on page
    const timer = setTimeout(() => setVisible(true), 30000)
    return () => clearTimeout(timer)
  }, [isLoggedIn])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setVisible(false)
  }

  const inviteUrl = userSlug
    ? `https://www.agoraencontrei.com.br/anunciar-gratis?ref=${userSlug}`
    : 'https://www.agoraencontrei.com.br/anunciar-gratis'

  function share() {
    const text = `Conheço alguém vendendo imóvel em Franca? Anuncie grátis com destaque por 30 dias no AgoraEncontrei! ${inviteUrl}`
    if (navigator.share) {
      navigator.share({ title: 'AgoraEncontrei — Anúncio Grátis', text, url: inviteUrl })
    } else {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        alert('Link copiado! Compartilhe com quem está vendendo imóvel.')
      })
    }
    dismiss()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in slide-in-from-bottom-4 duration-300">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-[#1B2B5B] to-[#2d4a8a] rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-[#1B2B5B] mb-2">
          Conhece alguém vendendo imóvel?
        </h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          Indique para anunciar <strong>grátis com destaque por 30 dias</strong> no AgoraEncontrei.
          Você ganha visibilidade extra no seu perfil por cada indicação!
        </p>

        {/* Benefit badge */}
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-3 mb-5 flex items-center gap-3">
          <Gift className="w-5 h-5 text-[#C9A84C] flex-shrink-0" />
          <p className="text-sm text-[#1B2B5B] font-medium">
            Cada indicação = +7 dias de destaque no seu perfil
          </p>
        </div>

        {/* URL preview */}
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{inviteUrl}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={share}
            className="flex-1 bg-[#1B2B5B] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#2d4a8a] transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar link
          </button>
          <button
            onClick={dismiss}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
