import type { Metadata } from 'next'
import { Phone, TrendingUp, Users, Shield, Star, CheckCircle } from 'lucide-react'
import { AnunciarForm } from './AnunciarForm'

export const metadata: Metadata = {
  title: 'Anuncie seu Imóvel Grátis em Franca/SP | AgoraEncontrei',
  description: 'Cadastre seu imóvel para venda ou locação no AgoraEncontrei — marketplace da Imobiliária Lemos. Anúncio gratuito, ampla divulgação e CRECI 279051.',
  keywords: 'anunciar imóvel grátis, anunciar imóvel franca, cadastrar imóvel franca sp, vender casa franca, alugar imóvel franca, agoraencontrei anunciar, marketplace imobiliário franca',
  openGraph: {
    title: 'Anuncie seu Imóvel Grátis | AgoraEncontrei — Imobiliária Lemos',
    description: 'Cadastre seu imóvel gratuitamente no marketplace imobiliário de Franca/SP. Ampla divulgação e atendimento personalizado.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
}

const VANTAGENS = [
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Ampla Divulgação',
    desc: 'Seu imóvel divulgado em nosso portal e nos principais portais imobiliários do Brasil.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Equipe Especializada',
    desc: 'Corretores experientes e credenciados prontos para encontrar o comprador ideal.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Segurança Jurídica',
    desc: 'Processo seguro com documentação verificada e suporte jurídico especializado.',
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: 'Atendimento Premium',
    desc: 'Acompanhamento personalizado com relatórios de visitas e feedback constante.',
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: 'Avaliação Gratuita',
    desc: 'Avaliamos seu imóvel gratuitamente para determinar o melhor preço de mercado.',
  },
]

export default function AnunciarPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      {/* Hero */}
      <div className="py-14 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
        <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
          Imobiliária Lemos — CRECI 279051
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Anuncie seu Imóvel
        </h1>
        <p className="text-white/70 text-base max-w-2xl mx-auto mb-8">
          Há mais de 20 anos conectando proprietários aos melhores compradores e inquilinos de Franca e região.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://wa.me/5516981010004?text=Olá!%20Quero%20anunciar%20meu%20imóvel%20com%20a%20Imobiliária%20Lemos."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Falar no WhatsApp
          </a>
          <a
            href="tel:+551637230045"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Phone className="w-5 h-5" />
            (16) 3723-0045
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <AnunciarForm />
          </div>

          {/* Benefits sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#C9A84C' }}>
                Por que anunciar conosco?
              </p>
              <div className="space-y-4">
                {VANTAGENS.map((v, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                    >
                      {v.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>{v.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact card */}
            <div
              className="rounded-3xl p-6 text-white"
              style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}
            >
              <p className="text-sm font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Imobiliária Lemos</p>
              <p className="text-white/60 text-xs mb-4">Franca/SP — CRECI 279051</p>
              <div className="space-y-2">
                <a href="tel:1637230045" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> (16) 3723-0045
                </a>
                <a href="tel:16981010004" className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> (16) 98101-0004
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
