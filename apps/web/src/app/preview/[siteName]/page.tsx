'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { previewApi } from '@/lib/api'
import {
  Globe, Home, MessageCircle, BarChart3, Share2,
  Smartphone, Eye, Sparkles, Building, MapPin,
  BedDouble, DollarSign, ChevronRight,
} from 'lucide-react'

const TYPE_ICONS: Record<string, typeof Home> = {
  HOUSE: Home, APARTMENT: Building, LAND: MapPin,
}

export default function PreviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const siteName = params.siteName as string
  const theme = searchParams.get('theme') || undefined

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!siteName) return
    setLoading(true)
    previewApi.generate(siteName, theme)
      .then(res => { setData(res.data); setError(null) })
      .catch(() => setError('Erro ao gerar preview'))
      .finally(() => setLoading(false))
  }, [siteName, theme])

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

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{error || 'Preview n\u00e3o dispon\u00edvel'}</p>
        </div>
      </div>
    )
  }

  const primaryColor = data.theme?.primaryColor || '#3b82f6'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
        <p className="text-xs sm:text-sm text-yellow-800 flex items-center justify-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium">Modo Preview</span> — Este \u00e9 um site de demonstra\u00e7\u00e3o
        </p>
      </div>

      {/* Hero Section */}
      <header
        className="relative px-4 sm:px-6 py-12 sm:py-20 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
            <Sparkles className="h-4 w-4" />
            {data.theme?.style}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-3">{data.name}</h1>
          <p className="text-lg sm:text-xl opacity-90 mb-6">{data.slogan}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors text-sm sm:text-base w-full sm:w-auto">
              Ver Im\u00f3veis
            </button>
            <button className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors text-sm sm:text-base w-full sm:w-auto flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Falar com Tom\u00e1s (IA)
            </button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="px-4 sm:px-6 py-8 sm:py-12 max-w-5xl mx-auto">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-6">O que voc\u00ea recebe</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {(data.features || []).map((f: string, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-start gap-2">
              <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
                <ChevronRight className="h-3.5 w-3.5" style={{ color: primaryColor }} />
              </div>
              <span className="text-sm text-gray-700">{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Mock Properties */}
      <section className="px-4 sm:px-6 py-8 sm:py-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-6">Im\u00f3veis em Destaque</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {(data.mockProperties || []).map((p: any, i: number) => {
              const TypeIcon = TYPE_ICONS[p.type] ?? Home
              return (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div
                    className="h-36 sm:h-44 flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <TypeIcon className="h-12 w-12" style={{ color: `${primaryColor}60` }} />
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="font-medium text-gray-900 text-sm">{p.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold" style={{ color: primaryColor }}>{p.price}</span>
                      {p.bedrooms > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <BedDouble className="h-3 w-3" /> {p.bedrooms}
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

      {/* CTA */}
      <section className="px-4 sm:px-6 py-10 sm:py-16 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05)` }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Gostou do que viu?</h2>
          <p className="text-gray-500 text-sm sm:text-base mb-6">
            Esse site pode ser seu em minutos. Ative agora e comece a captar leads.
          </p>
          <button
            className="px-8 py-3 text-white font-semibold rounded-xl text-sm sm:text-base transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Ativar Meu Site Agora
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-6 bg-gray-900 text-center">
        <p className="text-xs text-gray-400">
          Preview gerado por <strong className="text-gray-300">AgoraEncontrei</strong> — Plataforma imobili\u00e1ria inteligente
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {data.subdomain}.agoraencontrei.com.br &middot; Tema: {data.theme?.name}
        </p>
      </footer>
    </div>
  )
}
