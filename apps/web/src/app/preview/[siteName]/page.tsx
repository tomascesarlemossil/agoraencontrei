'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { previewApi } from '@/lib/api'
import {
  Globe, Home, MessageCircle, BarChart3, Share2,
  Smartphone, Eye, Sparkles, Building, MapPin,
  BedDouble, DollarSign, ChevronRight, Phone, Zap,
  Shield, TrendingUp, Users, Clock, Star, ArrowRight,
} from 'lucide-react'

const TYPE_ICONS: Record<string, typeof Home> = {
  HOUSE: Home, APARTMENT: Building, LAND: MapPin, COMMERCIAL: Building,
}

const SEGMENT_CTA: Record<string, { primary: string; secondary: string; hero: string }> = {
  corretor: {
    primary: 'Ativar Meu Portal',
    secondary: 'Falar com Tom\u00e1s',
    hero: 'Seu portal imobili\u00e1rio inteligente',
  },
  imobiliaria: {
    primary: 'Ativar Plataforma',
    secondary: 'Solicitar Demo',
    hero: 'Tecnologia que gera clientes todos os dias',
  },
  loteadora: {
    primary: 'Solicitar Proposta',
    secondary: 'Falar com Consultor',
    hero: 'Apresente seu empreendimento com padr\u00e3o de gigante',
  },
  construtora: {
    primary: 'Ativar Portal Premium',
    secondary: 'Ver Planos Enterprise',
    hero: 'Seu ativo digital vendendo 24h por dia',
  },
}

export default function PreviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const siteName = params.siteName as string
  const theme = searchParams.get('theme') || undefined
  const segment = searchParams.get('segment') || undefined

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!siteName) return
    setLoading(true)
    previewApi.generate(siteName, { theme, segment })
      .then(res => { setData(res.data); setError(null); setExpired(false) })
      .catch((err) => {
        if (err?.message?.includes('expirado')) {
          setExpired(true)
        }
        setError('Erro ao gerar preview')
      })
      .finally(() => setLoading(false))
  }, [siteName, theme, segment])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Gerando preview...</p>
        </div>
      </div>
    )
  }

  // Expired state
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Este preview expirou</h1>
          <p className="text-gray-500 mb-6">Previews t\u00eam validade de 72 horas. Posso gerar outro para voc\u00ea.</p>
          <a href="https://agoraencontrei.com.br" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
            <MessageCircle className="h-4 w-4" /> Falar com Tom\u00e1s
          </a>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{error || 'Preview n\u00e3o dispon\u00edvel'}</p>
        </div>
      </div>
    )
  }

  const primaryColor = data.theme?.primaryColor || '#3b82f6'
  const secondaryColor = data.theme?.secondaryColor || '#1a1a2e'
  const seg = data.segment || 'corretor'
  const cta = SEGMENT_CTA[seg] || SEGMENT_CTA.corretor
  const isHighTicket = seg === 'loteadora' || seg === 'construtora'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
        <p className="text-xs sm:text-sm text-yellow-800 flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium">Modo Preview</span> — Demonstra&ccedil;&atilde;o personalizada para <strong>{data.name}</strong>
          {data.expiresAt && <span className="text-yellow-600 text-xs">&middot; Expira em 72h</span>}
        </p>
      </div>

      {/* Hero Section */}
      <header
        className="relative px-4 sm:px-6 py-14 sm:py-24 text-center text-white overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})` }}
      >
        <div className="relative z-10 max-w-3xl mx-auto">
          {isHighTicket && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-sm mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>{data.theme?.style || 'Premium'}</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">{data.name}</h1>
          <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-2xl mx-auto">{data.slogan}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              className="px-8 py-3.5 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all text-sm sm:text-base w-full sm:w-auto shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {cta.primary}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="px-8 py-3.5 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all text-sm sm:text-base w-full sm:w-auto backdrop-blur-sm flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {cta.secondary}
            </button>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: `radial-gradient(circle, white, transparent)` }} />
      </header>

      {/* Trust Badges */}
      <div className="bg-white border-b border-gray-100 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
          {[
            { icon: Shield, text: 'SSL Seguro' },
            { icon: Zap, text: 'IA Integrada' },
            { icon: Smartphone, text: 'Mobile-First' },
            { icon: TrendingUp, text: 'SEO Autom\u00e1tico' },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-1.5">
              <b.icon className="h-3.5 w-3.5" style={{ color: primaryColor }} />
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="px-4 sm:px-6 py-10 sm:py-14 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">O que voc\u00ea recebe</h2>
          <p className="text-sm text-gray-500">Tudo incluso na sua plataforma</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data.features || []).map((f: string, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                <ChevronRight className="h-4 w-4" style={{ color: primaryColor }} />
              </div>
              <span className="text-sm text-gray-700 leading-snug">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mock Properties */}
      <section className="px-4 sm:px-6 py-10 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Im\u00f3veis em Destaque</h2>
            <p className="text-sm text-gray-500">Exemplo de como seus im\u00f3veis aparecem</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data.mockProperties || []).map((p: any, i: number) => {
              const TypeIcon = TYPE_ICONS[p.type] ?? Home
              return (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="h-40 sm:h-48 flex items-center justify-center relative" style={{ backgroundColor: `${primaryColor}08` }}>
                    <TypeIcon className="h-14 w-14 transition-transform group-hover:scale-110" style={{ color: `${primaryColor}50` }} />
                    {p.area && <span className="absolute bottom-2 right-2 text-xs bg-white/90 px-2 py-0.5 rounded-full text-gray-500">{p.area}m&sup2;</span>}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-gray-900 text-sm mb-2">{p.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold" style={{ color: primaryColor }}>{p.price}</span>
                      {p.bedrooms > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <BedDouble className="h-3 w-3" /> {p.bedrooms} quartos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="px-4 sm:px-6 py-10 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '3.000+', label: 'Im\u00f3veis na plataforma', icon: Building },
            { value: '500+', label: 'Corretores ativos', icon: Users },
            { value: '24h', label: 'Atendimento IA', icon: MessageCircle },
            { value: '10+', label: 'Portais integrados', icon: Globe },
          ].map(s => (
            <div key={s.label} className="text-center p-4">
              <s.icon className="h-6 w-6 mx-auto mb-2" style={{ color: primaryColor }} />
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}15)` }}>
        <div className="max-w-2xl mx-auto text-center">
          <Star className="h-8 w-8 mx-auto mb-4" style={{ color: primaryColor }} />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Gostou do que viu?</h2>
          <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-lg mx-auto">
            {isHighTicket
              ? 'Esse portal pode ser do seu empreendimento em minutos. Fale com nosso time para uma proposta personalizada.'
              : 'Esse site pode ser seu em minutos. Ative agora e comece a captar leads automaticamente.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              className="px-8 py-3.5 text-white font-bold rounded-xl text-sm sm:text-base shadow-lg hover:shadow-xl transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {cta.primary}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 text-sm sm:text-base w-full sm:w-auto flex items-center justify-center gap-2 hover:bg-gray-50">
              <Phone className="h-4 w-4" />
              Receber Proposta
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 bg-gray-900 text-center">
        <p className="text-sm text-gray-400 mb-1">
          Preview gerado por <strong className="text-gray-300">AgoraEncontrei</strong>
        </p>
        <p className="text-xs text-gray-500 mb-3">
          {data.subdomain}.agoraencontrei.com.br &middot; Tema: {data.theme?.name} &middot; {data.segment}
        </p>
        <p className="text-xs text-gray-600">
          Plataforma imobili&aacute;ria inteligente com IA, CRM, portais e automa&ccedil;&atilde;o
        </p>
      </footer>
    </div>
  )
}
