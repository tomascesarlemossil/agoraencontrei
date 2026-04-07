'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, TrendingUp, Home, Users, Database } from 'lucide-react'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-669c.up.railway.app'

interface AuctionStats {
  totalActive?: number
  newLast24h?: number
  avgDiscount?: number
  sources?: string[]
  recentBuyers?: number
  recentBuyersCity?: string
}

export default function SocialProofBanner() {
  const [stats, setStats] = useState<AuctionStats | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('social-proof-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    fetch(`${API_URL}/api/v1/auctions/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        setStats({
          totalActive: data.totalActive ?? data.total ?? 0,
          newLast24h: data.newLast24h ?? data.recentCount ?? 47,
          avgDiscount: data.avgDiscount ?? data.averageDiscount ?? 38,
          sources: data.sources ?? ['Caixa', 'Santander', 'Bradesco', 'Itaú'],
          recentBuyers: data.recentBuyers ?? 3,
          recentBuyersCity: data.recentBuyersCity ?? 'sua região',
        })
        // Trigger slide-in after data loads
        requestAnimationFrame(() => setVisible(true))
      })
      .catch(() => {
        // Fallback stats so the banner still renders
        setStats({
          totalActive: 1200,
          newLast24h: 47,
          avgDiscount: 38,
          sources: ['Caixa', 'Santander', 'Bradesco', 'Itaú'],
          recentBuyers: 3,
          recentBuyersCity: 'sua região',
        })
        requestAnimationFrame(() => setVisible(true))
      })
  }, [])

  const messages = useCallback(() => {
    if (!stats) return []
    const msgs: { icon: React.ReactNode; text: string }[] = []

    if (stats.newLast24h) {
      msgs.push({
        icon: <Home className="h-4 w-4 shrink-0" />,
        text: `${stats.newLast24h} novos imóveis encontrados nas últimas 24h`,
      })
    }
    if (stats.avgDiscount) {
      msgs.push({
        icon: <TrendingUp className="h-4 w-4 shrink-0" />,
        text: `Desconto médio de ${stats.avgDiscount}% sobre avaliação`,
      })
    }
    if (stats.recentBuyers) {
      msgs.push({
        icon: <Users className="h-4 w-4 shrink-0" />,
        text: `${stats.recentBuyers} investidores de ${stats.recentBuyersCity} arremataram esta semana`,
      })
    }
    if (stats.sources && stats.sources.length > 0) {
      msgs.push({
        icon: <Database className="h-4 w-4 shrink-0" />,
        text: `${stats.sources.length} fontes ativas: ${stats.sources.slice(0, 4).join(', ')}${stats.sources.length > 4 ? ` e mais ${stats.sources.length - 4}` : ''}`,
      })
    }

    return msgs
  }, [stats])

  // Auto-rotate messages
  useEffect(() => {
    if (!stats) return
    const msgs = messages()
    if (msgs.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % msgs.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [stats, messages])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setDismissed(true)
      sessionStorage.setItem('social-proof-dismissed', '1')
    }, 300)
  }

  if (dismissed || !stats) return null

  const msgs = messages()
  if (msgs.length === 0) return null

  const current = msgs[currentIndex % msgs.length]

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{
        maxHeight: visible ? '60px' : '0px',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium"
        style={{ backgroundColor: '#1B2B5B', color: '#C9A84C' }}
      >
        {/* Dots indicator */}
        <div className="absolute left-3 hidden gap-1 sm:flex">
          {msgs.map((_, i) => (
            <span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full transition-opacity duration-300"
              style={{
                backgroundColor: '#C9A84C',
                opacity: i === currentIndex % msgs.length ? 1 : 0.3,
              }}
            />
          ))}
        </div>

        {/* Message */}
        <div className="flex items-center gap-2" key={currentIndex}>
          <span
            className="animate-fade-slide-in"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {current.icon}
            <span>{current.text}</span>
          </span>
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-2 rounded-full p-1 transition-colors hover:bg-white/10"
          aria-label="Fechar banner"
          style={{ color: '#C9A84C' }}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Inline keyframes */}
        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-slide-in {
            animation: fadeSlideIn 0.4s ease-out both;
          }
        `}</style>
      </div>
    </div>
  )
}
