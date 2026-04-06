'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, MessageCircle, Phone, Building, TrendingUp, Users, DollarSign, BarChart3, Star, Crown, Clock, ArrowRight } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(v)
}

interface PartnerStats {
  partner: { name: string; email: string; plan: string; isFounder: boolean; planPrice: number; condos: string[]; whatsappClicks: number; profileViews: number } | null
  monthly: { profileViews: number; whatsappClicks: number; phoneClicks: number; condoImpressions: number; condosAppeared: number; uniqueVisitors: number; costPerLead: number | null }
  allTime: { totalEvents: number; totalWhatsapp: number; totalViews: number }
  recentEvents: { event: string; condoName: string; pageUrl: string; createdAt: string }[]
}

const eventLabels: Record<string, string> = {
  whatsapp_click: '📱 WhatsApp',
  phone_click: '📞 Ligação',
  profile_view: '👁️ Visualização',
  condo_impression: '🏢 Impressão',
}

export default function MeuPainelPage() {
  const [partnerId, setPartnerId] = useState('')
  const [email, setEmail] = useState('')
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadStats = async () => {
    if (!partnerId && !email) return
    setLoading(true)
    setError('')

    try {
      const id = partnerId || email
      const res = await fetch(`${API_URL}/api/v1/public/partner-stats/${encodeURIComponent(id)}`)
      if (res.ok) {
        setStats(await res.json())
      } else {
        setError('Parceiro não encontrado. Verifique seu ID ou email.')
      }
    } catch {
      setError('Erro ao carregar dados. Tente novamente.')
    }
    setLoading(false)
  }

  // Login simples por ID na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (id) {
      setPartnerId(id)
      setTimeout(() => {
        fetch(`${API_URL}/api/v1/public/partner-stats/${encodeURIComponent(id)}`)
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d) setStats(d) })
          .catch(() => {})
      }, 100)
    }
  }, [])

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0ece4' }}>
              <BarChart3 className="w-8 h-8 text-[#C9A84C]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Meu Painel</h1>
            <p className="text-gray-500 text-sm mt-1">Acesse suas métricas de performance</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Seu email de parceiro</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#C9A84C]" />
            </div>
            <button onClick={loadStats} disabled={(!email && !partnerId) || loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ backgroundColor: '#1B2B5B' }}>
              {loading ? 'Carregando...' : 'Acessar Painel'}
            </button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </div>

          <div className="mt-6 text-center">
            <Link href="/parceiros/cadastro" className="text-sm text-[#C9A84C] hover:underline">
              Ainda não é parceiro? Cadastre-se gratuitamente
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const p = stats.partner
  const m = stats.monthly
  const now = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2d4a8a] text-white px-4 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              {p?.isFounder && <Crown className="w-5 h-5 text-[#C9A84C]" />}
              Olá, {p?.name?.split(' ')[0]}!
            </h1>
            <p className="text-white/60 text-sm">
              Plano: <strong className="text-[#C9A84C]">{p?.plan === 'FOUNDER' ? 'Membro Fundador' : p?.plan || 'Gratuito'}</strong>
              {p?.condos?.length ? ` · ${p.condos.length} edifícios` : ''}
            </p>
          </div>
          <Link href="/parceiros/membro-fundador" className="px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}>
            Upgrade
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Monthly Stats */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9A84C]" />
            Performance em {monthName}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-gray-800">{m.profileViews}</div>
              <div className="text-xs text-gray-500">Visualizações</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <MessageCircle className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-gray-800">{m.whatsappClicks}</div>
              <div className="text-xs text-gray-500">WhatsApp</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <Phone className="w-5 h-5 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-gray-800">{m.phoneClicks}</div>
              <div className="text-xs text-gray-500">Ligações</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <Building className="w-5 h-5 mx-auto mb-2 text-[#C9A84C]" />
              <div className="text-2xl font-bold text-gray-800">{m.condosAppeared}</div>
              <div className="text-xs text-gray-500">Edifícios</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <Users className="w-5 h-5 mx-auto mb-2 text-indigo-500" />
              <div className="text-2xl font-bold text-gray-800">{m.uniqueVisitors}</div>
              <div className="text-xs text-gray-500">Visitantes Únicos</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border">
              <DollarSign className="w-5 h-5 mx-auto mb-2 text-emerald-500" />
              <div className="text-2xl font-bold text-emerald-600">
                {m.costPerLead ? fmt(m.costPerLead) : '—'}
              </div>
              <div className="text-xs text-gray-500">Custo/Lead</div>
            </div>
          </div>
        </div>

        {/* ROI Card */}
        {p?.planPrice && Number(p.planPrice) > 0 && m.whatsappClicks > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Seu ROI este mês
            </h3>
            <p className="text-sm text-green-700">
              Investimento: <strong>{fmt(Number(p.planPrice))}/mês</strong> ·
              Leads gerados: <strong>{m.whatsappClicks}</strong> ·
              Custo por lead: <strong>{fmt(m.costPerLead || 0)}</strong>
            </p>
            <p className="text-sm text-green-600 mt-1">
              Um lead de arquitetura no Google Ads custa em média R$ 50-80. Você está pagando
              <strong> {((m.costPerLead || 0) / 65 * 100).toFixed(0)}% do preço do Google Ads</strong>.
            </p>
          </div>
        )}

        {/* Recent Events */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" /> Atividade Recente
            </h3>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {stats.recentEvents.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">
                Nenhuma atividade registrada ainda. Seu perfil começará a gerar dados em breve.
              </div>
            ) : stats.recentEvents.map((e, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span>{eventLabels[e.event] || e.event}</span>
                  {e.condoName && <span className="text-xs text-gray-400">em {e.condoName}</span>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(e.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Condos where appearing */}
        {p?.condos && p.condos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Building className="w-5 h-5 text-[#C9A84C]" /> Edifícios onde seu perfil aparece
            </h3>
            <div className="flex flex-wrap gap-2">
              {p.condos.map((c: string, i: number) => (
                <Link key={i} href={`/condominios/franca/condominio-${c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition">
                  {c}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
