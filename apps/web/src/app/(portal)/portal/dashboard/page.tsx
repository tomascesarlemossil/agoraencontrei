'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, Receipt, BarChart3, FolderOpen, ClipboardCheck,
  LogOut, Loader2, ChevronRight, Clock,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface PortalUser {
  name: string
  cpf: string
  [key: string]: unknown
}

interface PortalData {
  contratos?: number
  boletos?: number
  extratos?: number
  documentos?: number
  vistorias?: number
  [key: string]: unknown
}

const PORTAL_SECTIONS = [
  {
    id: 'contratos',
    label: 'Meus Contratos',
    icon: FileText,
    href: '/portal/contratos',
    description: 'Contratos de locação e compra e venda',
    color: '#1B2B5B',
    bg: '#EEF2FF',
  },
  {
    id: 'boletos',
    label: 'Boletos Pendentes',
    icon: Receipt,
    href: '/portal/boletos',
    description: 'Aluguéis, taxas e cobranças',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    id: 'extratos',
    label: 'Extratos',
    icon: BarChart3,
    href: '/portal/extratos',
    description: 'Histórico de pagamentos e repasses',
    color: '#059669',
    bg: '#D1FAE5',
  },
  {
    id: 'documentos',
    label: 'Documentos',
    icon: FolderOpen,
    href: '/portal/documentos',
    description: 'Laudos, recibos e certidões',
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    id: 'vistorias',
    label: 'Vistorias',
    icon: ClipboardCheck,
    href: '/portal/vistorias',
    description: 'Laudos de entrada e saída',
    color: '#DB2777',
    bg: '#FCE7F3',
  },
]

export default function PortalDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<PortalUser | null>(null)
  const [portalData, setPortalData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check auth
    const stored = localStorage.getItem('portal_auth')
    if (!stored) {
      router.push('/portal/login')
      return
    }

    try {
      const auth = JSON.parse(stored)
      // Check token expiry
      if (auth.expiresAt && Date.now() > auth.expiresAt) {
        localStorage.removeItem('portal_auth')
        router.push('/portal/login')
        return
      }
      setUser(auth.user)

      // Fetch portal data
      fetch(`${API_URL}/api/v1/portal/dashboard`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setPortalData(data)
        })
        .catch(() => {
          // Portal API not yet implemented — use placeholders
        })
        .finally(() => setLoading(false))
    } catch {
      router.push('/portal/login')
    }
  }, [router])

  function handleLogout() {
    localStorage.removeItem('portal_auth')
    router.push('/portal/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: '#C9A84C' }} />
          <p className="text-sm text-gray-500">Carregando seu portal...</p>
        </div>
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] ?? 'Cliente'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Bem-vindo, {firstName}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Acesse seus documentos, boletos e informações do contrato.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-all"
          style={{ borderColor: '#ddd9d0' }}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      {/* Notice if no portal data (API not yet implemented) */}
      {!portalData && (
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-2xl"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}
        >
          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Portal em implantação</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Estamos integrando os dados do seu contrato. Em breve todas as informações estarão disponíveis aqui.
              Para dúvidas, ligue: <a href="tel:1637230045" className="font-bold underline">(16) 3723-0045</a>.
            </p>
          </div>
        </div>
      )}

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PORTAL_SECTIONS.map(section => {
          const Icon = section.icon
          const count = portalData?.[section.id]
          return (
            <a
              key={section.id}
              href={section.href}
              className="group bg-white rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ border: '1px solid #ddd9d0' }}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
                style={{ backgroundColor: section.bg }}
              >
                <Icon className="h-5 w-5" style={{ color: section.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-gray-800">{section.label}</h2>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{section.description}</p>
                {count !== undefined ? (
                  <p className="text-xs font-semibold mt-2" style={{ color: section.color }}>
                    {count} {section.id === 'boletos' ? 'pendente(s)' : 'disponível(is)'}
                  </p>
                ) : (
                  <p className="text-xs text-gray-300 mt-2">Em breve</p>
                )}
              </div>
            </a>
          )
        })}
      </div>

      {/* Contact card */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: '#1B2B5B', border: '1px solid #1B2B5B' }}
      >
        <h3 className="text-white font-bold text-base mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Precisa de ajuda?
        </h3>
        <p className="text-white/60 text-sm mb-4">
          Nossa equipe está disponível para te atender.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="tel:1637230045"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
          >
            (16) 3723-0045
          </a>
          <a
            href="https://wa.me/5516981010004"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
