'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User, Star, Crown, Zap, CheckCircle, ArrowRight, Building2,
  MessageCircle, TrendingUp, Eye, Edit3, Share2, AlertCircle,
  ExternalLink, Camera, FileText, MapPin, Award, Shield, Lock,
  BarChart2, Phone, MousePointer
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Specialist {
  id: string
  name: string
  email: string
  slug: string
  plan: 'START' | 'PRIME' | 'VIP'
  planStatus: string
  planExpiresAt?: string
  category: string
  status: string
  photoUrl?: string
  bio?: string
  whatsapp?: string
  instagram?: string
  website?: string
  buildings: Array<{ building: { name: string; slug: string } }>
}

const PLAN_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  START: { label: 'Start (Gratuito)', color: 'text-gray-500', icon: Zap },
  PRIME: { label: 'Prime', color: 'text-[#C9A84C]', icon: Star },
  VIP:   { label: 'VIP', color: 'text-[#1B2B5B]', icon: Crown },
}

const PORTFOLIO_STEPS = [
  {
    id: 1,
    title: 'Adicione uma foto profissional',
    desc: 'Perfis com foto recebem 3x mais contatos. Use uma foto de qualidade, fundo neutro.',
    icon: Camera,
    field: 'photoUrl',
  },
  {
    id: 2,
    title: 'Escreva uma bio completa',
    desc: 'Descreva sua especialidade, anos de experiência e diferenciais. Mínimo 100 caracteres.',
    icon: FileText,
    field: 'bio',
  },
  {
    id: 3,
    title: 'Selecione os condomínios onde trabalhou',
    desc: 'Cada condomínio selecionado cria um link do seu perfil na página do edifício.',
    icon: Building2,
    field: 'buildings',
  },
  {
    id: 4,
    title: 'Adicione seu WhatsApp',
    desc: 'Disponível no Plano Prime. Clientes entram em contato direto com você.',
    icon: MessageCircle,
    field: 'whatsapp',
    requiresPrime: true,
  },
  {
    id: 5,
    title: 'Adicione seu Instagram',
    desc: 'Mostre seu portfólio visual. Aumenta a confiança dos clientes.',
    icon: Share2,
    field: 'instagram',
  },
]

export default function MeuPainelPage() {
  const [specialist, setSpecialist] = useState<Specialist | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [error, setError] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [territories, setTerritories] = useState<any[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Buscar especialista pelo email (autenticação simples por email)
  const handleEmailSearch = async () => {
    if (!emailInput.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/v1/specialists/by-email/${encodeURIComponent(emailInput.trim())}`)
      if (!res.ok) {
        setError('Nenhum perfil encontrado com este e-mail. Verifique ou cadastre-se.')
        setSpecialist(null)
      } else {
        const data = await res.json()
        setSpecialist(data)
        setEmail(emailInput.trim())
        localStorage.setItem('specialist_email', emailInput.trim())
      }
    } catch {
      setError('Erro ao buscar perfil. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Carregar analytics e territórios quando specialist carrega
  useEffect(() => {
    if (!specialist?.id) return
    setLoadingAnalytics(true)
    Promise.all([
      fetch(`${API_URL}/api/v1/public/partner-stats/${specialist.id}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_URL}/api/v1/territory/my/${specialist.id}`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([analyticsData, territoryData]) => {
      if (analyticsData) setAnalytics(analyticsData)
      if (territoryData?.territories) setTerritories(territoryData.territories)
    }).finally(() => setLoadingAnalytics(false))
  }, [specialist?.id])

  // Verificar email salvo no localStorage
  useEffect(() => {
    const saved = localStorage.getItem('specialist_email')
    if (saved) {
      setEmailInput(saved)
      setEmail(saved)
      fetch(`${API_URL}/api/v1/specialists/by-email/${encodeURIComponent(saved)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setSpecialist(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleUpgrade = async (plan: 'PRIME' | 'VIP') => {
    if (!specialist) return
    setUpgrading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/specialists/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialistId: specialist.id, plan, billingType: 'PIX' }),
      })
      const data = await res.json()
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank')
        setUpgradeSuccess(true)
      }
    } catch {
      setError('Erro ao processar upgrade. Tente novamente ou entre em contato.')
    } finally {
      setUpgrading(false)
    }
  }

  const getProfileCompleteness = (s: Specialist) => {
    let score = 0
    if (s.photoUrl) score += 25
    if (s.bio && s.bio.length >= 100) score += 25
    if (s.buildings && s.buildings.length > 0) score += 25
    if (s.instagram || s.website) score += 15
    if (s.whatsapp) score += 10
    return score
  }

  const getStepCompleted = (s: Specialist, field: string) => {
    if (field === 'photoUrl') return !!s.photoUrl
    if (field === 'bio') return !!(s.bio && s.bio.length >= 100)
    if (field === 'buildings') return !!(s.buildings && s.buildings.length > 0)
    if (field === 'whatsapp') return !!s.whatsapp
    if (field === 'instagram') return !!(s.instagram || s.website)
    return false
  }

  // Estado: não logado
  if (!loading && !specialist) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border shadow-sm p-8 max-w-md w-full text-center">
          <User className="w-12 h-12 text-[#1B2B5B] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1B2B5B] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Meu Painel de Parceiro
          </h1>
          <p className="text-gray-500 mb-6 text-sm">
            Digite o e-mail cadastrado para acessar seu painel
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <input
            type="email"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailSearch()}
            placeholder="seu@email.com"
            className="w-full border rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1B2B5B]"
          />
          <button
            onClick={handleEmailSearch}
            className="w-full bg-[#1B2B5B] text-white rounded-xl py-3 font-bold text-sm hover:bg-[#162247] transition-colors"
          >
            Acessar meu painel
          </button>
          <p className="text-gray-400 text-xs mt-4">
            Ainda não tem perfil?{' '}
            <Link href="/parceiros/cadastro" className="text-[#C9A84C] font-medium hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1B2B5B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando seu painel...</p>
        </div>
      </div>
    )
  }

  if (!specialist) return null

  const completeness = getProfileCompleteness(specialist)
  const planInfo = PLAN_LABELS[specialist.plan] || PLAN_LABELS.START
  const PlanIcon = planInfo.icon
  const profileUrl = `https://www.agoraencontrei.com.br/especialistas/${specialist.slug}`

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* Header */}
      <div className="bg-[#1B2B5B] text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {specialist.photoUrl ? (
                <img src={specialist.photoUrl} alt={specialist.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#C9A84C]" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-white/60" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{specialist.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <PlanIcon className={`w-4 h-4 ${planInfo.color}`} />
                  <span className={`text-sm font-medium ${planInfo.color}`}>Plano {planInfo.label}</span>
                  {specialist.status === 'PENDING' && (
                    <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full">Aguardando aprovação</span>
                  )}
                  {specialist.status === 'ACTIVE' && (
                    <span className="text-xs bg-green-400/20 text-green-300 px-2 py-0.5 rounded-full">Ativo</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <a href={profileUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <Eye className="w-4 h-4" /> Ver perfil público
              </a>
              <Link href={`/parceiros/editar/${specialist.id}`}
                className="inline-flex items-center gap-2 bg-[#C9A84C] text-[#1B2B5B] px-4 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-[#b8943d]">
                <Edit3 className="w-4 h-4" /> Editar perfil
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Alerta de aprovação pendente */}
        {specialist.status === 'PENDING' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Perfil aguardando aprovação</p>
              <p className="text-yellow-700 text-sm mt-1">
                Nossa equipe está revisando seu cadastro. Você receberá um e-mail em até 24 horas.
                Enquanto isso, complete seu portfólio abaixo para acelerar a aprovação.
              </p>
            </div>
          </div>
        )}

        {/* Upgrade success */}
        {upgradeSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Link de pagamento aberto!</p>
              <p className="text-green-700 text-sm mt-1">
                Complete o pagamento na nova aba. Seu plano será ativado automaticamente após a confirmação.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Completude do perfil */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#1B2B5B]">Completude do Perfil</h2>
                <span className="text-2xl font-bold text-[#1B2B5B]">{completeness}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${completeness}%`,
                    background: completeness >= 75 ? '#22c55e' : completeness >= 50 ? '#C9A84C' : '#1B2B5B'
                  }}
                />
              </div>
              <div className="space-y-3">
                {PORTFOLIO_STEPS.map((step) => {
                  const completed = getStepCompleted(specialist, step.field)
                  const locked = step.requiresPrime && specialist.plan === 'START'
                  return (
                    <div key={step.id} className={`flex items-start gap-3 p-3 rounded-xl ${completed ? 'bg-green-50' : locked ? 'bg-gray-50 opacity-60' : 'bg-[#f8f6f1]'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${completed ? 'bg-green-100' : 'bg-white border'}`}>
                        {completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <step.icon className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${completed ? 'text-green-700' : 'text-gray-700'}`}>
                          {step.title}
                          {locked && <span className="ml-2 text-xs text-[#C9A84C] font-normal">— Plano Prime</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Analytics em tempo real */}
            {specialist.plan !== 'START' && (
              <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[#1B2B5B] flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#C9A84C]" /> Performance do Mês
                  </h2>
                  {loadingAnalytics && <div className="w-4 h-4 border-2 border-[#1B2B5B] border-t-transparent rounded-full animate-spin" />}
                </div>
                {analytics ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#f8faff] rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-[#1B2B5B]">{analytics.monthly?.profileViews ?? 0}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Visualizações</div>
                    </div>
                    <div className="bg-[#f8faff] rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{analytics.monthly?.whatsappClicks ?? 0}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</div>
                    </div>
                    <div className="bg-[#f8faff] rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-[#C9A84C]">{analytics.monthly?.condoImpressions ?? 0}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Building2 className="w-3 h-3" /> Impressões</div>
                    </div>
                    <div className="bg-[#f8faff] rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600">{analytics.monthly?.phoneClicks ?? 0}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> Ligações</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    {loadingAnalytics ? 'Carregando métricas...' : 'Nenhum dado disponível ainda'}
                  </div>
                )}
                {analytics?.monthly && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                    <span>Custo por lead: <strong className="text-[#1B2B5B]">
                      {analytics.monthly.whatsappClicks > 0
                        ? `R$ ${((analytics.partner?.planPrice || 0) / analytics.monthly.whatsappClicks).toFixed(0)}`
                        : '—'}
                    </strong></span>
                    <span>Total histórico: <strong className="text-[#1B2B5B]">{analytics.allTime?.totalContacts ?? 0} contatos</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Sentinela de Território */}
            {specialist.plan !== 'START' && (
              <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[#1B2B5B] flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#C9A84C]" /> Sentinela de Território
                  </h2>
                  <span className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2 py-1 rounded-full font-medium">
                    {territories.length} território{territories.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {territories.length > 0 ? (
                  <div className="space-y-2">
                    {territories.map((t: any) => (
                      <div key={t.id} className="flex items-center gap-3 p-3 bg-[#f8f6f1] rounded-xl">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          t.isExclusive ? 'bg-[#C9A84C]/20' : 'bg-gray-100'
                        }`}>
                          {t.isExclusive
                            ? <Shield className="w-4 h-4 text-[#C9A84C]" />
                            : <MapPin className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1B2B5B] truncate">
                            {t.buildingName || t.neighborhood || t.city}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t.isExclusive ? '🛡️ Exclusivo' : 'Compartilhado'} · {t.territoryType === 'BUILDING' ? 'Condomínio' : t.territoryType === 'NEIGHBORHOOD' ? 'Bairro' : 'Cidade'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{t.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-500 mb-3">Nenhum território reivindicado ainda.</p>
                    <p className="text-xs text-gray-400 mb-3">Reivindique exclusividade em condomínios e bairros para aparecer em destaque.</p>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t text-center">
                  <Link href={`/parceiros/editar/${specialist.id}`}
                    className="text-[#C9A84C] text-sm font-medium hover:underline">
                    Gerenciar territórios →
                  </Link>
                </div>
              </div>
            )}

            {/* Condomínios vinculados */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#1B2B5B]">Condomínios Vinculados</h2>
                <span className="text-sm text-gray-500">{specialist.buildings?.length || 0} edifícios</span>
              </div>
              {specialist.buildings && specialist.buildings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {specialist.buildings.map((sb, i) => (
                    <Link key={i} href={`/condominios/franca/${sb.building.slug}`}
                      className="flex items-center gap-2 p-3 bg-[#f8f6f1] rounded-xl hover:bg-[#ede9df] transition-colors text-sm">
                      <Building2 className="w-4 h-4 text-[#1B2B5B] flex-shrink-0" />
                      <span className="text-[#1B2B5B] font-medium truncate">{sb.building.name}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum condomínio vinculado ainda</p>
                  <Link href={`/parceiros/editar/${specialist.id}`}
                    className="text-[#C9A84C] text-sm font-medium hover:underline mt-1 inline-block">
                    Adicionar condomínios
                  </Link>
                </div>
              )}
            </div>

            {/* Compartilhar perfil */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <h2 className="font-bold text-[#1B2B5B] mb-3">Compartilhe seu Perfil</h2>
              <p className="text-gray-500 text-sm mb-4">
                Compartilhe este link nas suas redes sociais, WhatsApp e e-mail para receber mais contatos.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={profileUrl}
                  className="flex-1 border rounded-xl px-3 py-2 text-sm bg-[#f8f6f1] text-gray-600"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(profileUrl)}
                  className="bg-[#1B2B5B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162247] transition-colors"
                >
                  Copiar
                </button>
              </div>
              <div className="flex gap-3 mt-3">
                <a href={`https://wa.me/?text=Veja meu perfil no AgoraEncontrei: ${profileUrl}`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 text-center bg-[#25D366] text-white py-2 rounded-xl text-sm font-medium">
                  WhatsApp
                </a>
                <a href={`https://www.instagram.com/`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl text-sm font-medium">
                  Instagram
                </a>
              </div>
            </div>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-6">

            {/* Card do plano atual */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <h2 className="font-bold text-[#1B2B5B] mb-4">Seu Plano</h2>
              <div className={`flex items-center gap-2 mb-4 p-3 rounded-xl ${
                specialist.plan === 'VIP' ? 'bg-[#1B2B5B]/5' :
                specialist.plan === 'PRIME' ? 'bg-[#C9A84C]/10' : 'bg-gray-50'
              }`}>
                <PlanIcon className={`w-6 h-6 ${planInfo.color}`} />
                <div>
                  <p className="font-bold text-[#1B2B5B]">Plano {planInfo.label}</p>
                  {specialist.planExpiresAt && (
                    <p className="text-xs text-gray-500">
                      Renova em {new Date(specialist.planExpiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {specialist.plan === 'START' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 mb-3">
                    Faça upgrade para desbloquear WhatsApp direto, Selo Verificado e topo das buscas.
                  </p>
                  <button
                    onClick={() => handleUpgrade('PRIME')}
                    disabled={upgrading}
                    className="w-full bg-[#C9A84C] text-[#1B2B5B] py-3 rounded-xl font-bold text-sm hover:bg-[#b8943d] transition-colors flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    {upgrading ? 'Processando...' : 'Assinar Prime — R$ 197/mês'}
                  </button>
                  <button
                    onClick={() => handleUpgrade('VIP')}
                    disabled={upgrading}
                    className="w-full bg-[#1B2B5B] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#162247] transition-colors flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    {upgrading ? 'Processando...' : 'Assinar VIP — R$ 497/mês'}
                  </button>
                </div>
              )}

              {specialist.plan === 'PRIME' && (
                <button
                  onClick={() => handleUpgrade('VIP')}
                  disabled={upgrading}
                  className="w-full bg-[#1B2B5B] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#162247] transition-colors flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  {upgrading ? 'Processando...' : 'Fazer upgrade para VIP'}
                </button>
              )}

              {specialist.plan === 'VIP' && (
                <div className="text-center py-2">
                  <Award className="w-8 h-8 text-[#C9A84C] mx-auto mb-2" />
                  <p className="text-sm font-medium text-[#1B2B5B]">Você está no topo!</p>
                  <p className="text-xs text-gray-500">Plano VIP ativo</p>
                </div>
              )}
            </div>

            {/* Benefícios do plano */}
            <div className="bg-white rounded-2xl border p-6 shadow-sm">
              <h2 className="font-bold text-[#1B2B5B] mb-4">Benefícios do Plano</h2>
              <ul className="space-y-2">
                {[
                  { text: 'Perfil público', available: true },
                  { text: 'Listagem em condomínios', available: true },
                  { text: 'WhatsApp direto', available: specialist.plan !== 'START' },
                  { text: 'Selo Verificado', available: specialist.plan !== 'START' },
                  { text: 'Topo das buscas', available: specialist.plan !== 'START' },
                  { text: 'Banner em condomínios de luxo', available: specialist.plan === 'VIP' },
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-2 text-sm ${item.available ? 'text-gray-700' : 'text-gray-300'}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${item.available ? 'text-green-500' : 'text-gray-200'}`} />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suporte */}
            <div className="bg-[#1B2B5B] rounded-2xl p-6 text-white text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <p className="font-bold mb-2">Precisa de ajuda?</p>
              <p className="text-white/70 text-xs mb-4">Nossa equipe está disponível para ajudar você a maximizar seus resultados.</p>
              <a href="https://wa.me/5516981010004?text=Olá! Sou parceiro do AgoraEncontrei e preciso de ajuda."
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-medium">
                <MessageCircle className="w-4 h-4" /> Falar com suporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
