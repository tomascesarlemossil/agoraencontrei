'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

// Deterministic gradient palette per user name
const GRADIENTS = [
  ['#1a1a2e', '#16213e'],   // deep navy
  ['#0d3b66', '#1e6091'],   // ocean blue
  ['#1b4332', '#2d6a4f'],   // deep green
  ['#3d0c02', '#7b2d00'],   // burgundy
  ['#2d1b69', '#4a2c91'],   // violet
  ['#7b3f00', '#b05a00'],   // copper
  ['#1c1c1c', '#3a3a3a'],   // charcoal
  ['#0d1b2a', '#1a3550'],   // midnight
]

function getGradient(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface UserAvatarProps {
  name?: string | null
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showRing?: boolean
}

const SIZES = {
  xs: { container: 'h-6 w-6',  text: 'text-[9px]',  ring: 'ring-1' },
  sm: { container: 'h-8 w-8',  text: 'text-[10px]', ring: 'ring-1' },
  md: { container: 'h-10 w-10', text: 'text-xs',    ring: 'ring-2' },
  lg: { container: 'h-14 w-14', text: 'text-base',  ring: 'ring-2' },
  xl: { container: 'h-20 w-20', text: 'text-xl',    ring: 'ring-2' },
}

export function UserAvatar({ name, avatarUrl, size = 'sm', className, showRing = false }: UserAvatarProps) {
  const sz = SIZES[size]
  const displayName = name || 'Usuário'
  const initials = getInitials(displayName)
  const [from, to] = getGradient(displayName)

  return (
    <div
      className={cn(
        'relative rounded-full flex-shrink-0 overflow-hidden select-none',
        sz.container,
        showRing && `${sz.ring} ring-white/20`,
        className,
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {/* Subtle inner shine */}
          <div className="absolute inset-0 rounded-full" style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15) 0%, transparent 60%)'
          }} />
          <span
            className={cn('relative font-bold tracking-wide text-white', sz.text)}
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.08em' }}
          >
            {initials}
          </span>
        </div>
      )}
      {/* Subtle border */}
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
    </div>
  )
}
