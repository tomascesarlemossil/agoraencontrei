'use client'

/**
 * OnboardingChecklist — "Primeiros passos" para novos assinantes.
 *
 * Mostra um cartão com 3-4 passos iniciais (personalizar marca, publicar o
 * primeiro imóvel, conectar WhatsApp/IA, conhecer o CRM). O passo de imóvel
 * é concluído automaticamente quando a conta já tem imóveis; os demais são
 * marcados ao serem visitados. Some quando dispensado ou 100% concluído.
 *
 * Estado persistido em localStorage (sem backend), seguro contra SSR.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, CheckCircle2, X, ArrowRight,
  Palette, Building2, MessageCircle, Users,
} from 'lucide-react'

const DISMISS_KEY = 'ae_onboarding_dismissed'
const VISITED_KEY = 'ae_onboarding_visited'

type Step = {
  id: string
  label: string
  desc: string
  href: string
  icon: React.ReactNode
  auto?: boolean
}

export function OnboardingChecklist({ propertyCount = 0 }: { propertyCount?: number }) {
  const [mounted, setMounted] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [visited, setVisited] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
      const v = localStorage.getItem(VISITED_KEY)
      if (v) setVisited(JSON.parse(v))
    } catch {}
  }, [])

  const steps: Step[] = [
    {
      id: 'brand',
      label: 'Personalize seu site',
      desc: 'Cores, logo e identidade da sua marca',
      href: '/dashboard/settings?tab=sistema&panel=cores',
      icon: <Palette className="w-5 h-5" />,
    },
    {
      id: 'property',
      label: 'Publique seu primeiro imóvel',
      desc: 'Cadastre e divulgue no marketplace',
      href: '/dashboard/properties/new',
      icon: <Building2 className="w-5 h-5" />,
      auto: propertyCount > 0,
    },
    {
      id: 'whatsapp',
      label: 'Conecte WhatsApp e IA',
      desc: 'Atendimento automático com o Tomás',
      href: '/dashboard/settings?tab=integracoes',
      icon: <MessageCircle className="w-5 h-5" />,
    },
    {
      id: 'crm',
      label: 'Conheça seu CRM',
      desc: 'Acompanhe leads e negociações',
      href: '/dashboard/leads',
      icon: <Users className="w-5 h-5" />,
    },
  ]

  const isDone = (s: Step) => !!s.auto || visited.includes(s.id)
  const doneCount = steps.filter(isDone).length
  const allDone = doneCount === steps.length

  const markVisited = (id: string) => {
    setVisited(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try { localStorage.setItem(VISITED_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const dismiss = () => {
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  // Evita mismatch SSR/CSR e oculta quando dispensado ou tudo concluído.
  if (!mounted || dismissed || allDone) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] p-5 text-white">
      <button
        onClick={dismiss}
        aria-label="Dispensar primeiros passos"
        className="absolute right-3 top-3 text-white/50 transition-colors hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#C9A84C]" />
        <h2 className="text-lg font-bold">Primeiros passos</h2>
      </div>
      <p className="mb-4 text-sm text-white/60">
        Conclua a configuração para aproveitar todo o sistema — {doneCount} de {steps.length} feitos.
      </p>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-[#C9A84C] transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {steps.map(s => {
          const done = isDone(s)
          return (
            <Link
              key={s.id}
              href={s.href}
              onClick={() => markVisited(s.id)}
              className={`group flex items-center gap-3 rounded-xl border p-3 transition-all ${
                done
                  ? 'border-white/10 bg-white/5'
                  : 'border-[#C9A84C]/30 bg-white/10 hover:border-[#C9A84C] hover:bg-white/15'
              }`}
            >
              <div className={done ? 'text-[#C9A84C]' : 'text-white/80'}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${done ? 'text-white/50 line-through' : 'text-white'}`}>
                  {s.label}
                </p>
                {!done && <p className="text-xs leading-snug text-white/50">{s.desc}</p>}
              </div>
              {!done && (
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-white/40 transition-colors group-hover:text-[#C9A84C]" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
