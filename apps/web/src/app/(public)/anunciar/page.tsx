import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, MessageCircle, Star, Shield, TrendingUp, Users, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Anuncie seu Imóvel | Imobiliária Lemos — Franca e Região',
  description: 'Anuncie seu imóvel com a Imobiliária Lemos. Atendimento personalizado, ampla divulgação e CRECI 279051. Fale conosco agora.',
}

const VANTAGENS = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Ampla Divulgação',
    desc: 'Seu imóvel anunciado em nosso portal, redes sociais e nos principais portais imobiliários do Brasil.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Equipe Especializada',
    desc: 'Corretores experientes e credenciados prontos para encontrar o comprador ou inquilino certo.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Segurança Jurídica',
    desc: 'Todo o processo com documentação verificada e suporte jurídico especializado em imóveis.',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Atendimento Premium',
    desc: 'Acompanhamento personalizado do início ao fim, com relatórios de visitas e feedback constante.',
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: 'Avaliação Gratuita',
    desc: 'Avaliamos seu imóvel gratuitamente para determinar o melhor preço de mercado.',
  },
]

export default function AnunciarPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f5ef' }}>
      {/* Hero */}
      <div className="py-16 px-4 text-center" style={{ backgroundColor: '#1B2B5B' }}>
        <h1
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Anuncie seu Imóvel
        </h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
          Mais de 30 anos conectando proprietários aos melhores compradores e inquilinos de Franca e região.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://wa.me/5516999999999?text=Olá!%20Quero%20anunciar%20meu%20imóvel%20com%20a%20Imobiliária%20Lemos."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
            style={{ backgroundColor: '#25D366', color: 'white' }}
          >
            <MessageCircle className="w-5 h-5" />
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

      {/* Vantagens */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2
          className="text-2xl font-bold text-center mb-10"
          style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
        >
          Por que anunciar com a Imobiliária Lemos?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VANTAGENS.map((v, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#f0ece4', color: '#1B2B5B' }}>
                {v.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{v.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-white rounded-3xl p-8 shadow-sm text-center">
          <h3 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Pronto para anunciar?
          </h3>
          <p className="text-gray-500 mb-6 text-sm">
            Entre em contato agora e um de nossos corretores irá atendê-lo pessoalmente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5516999999999?text=Olá!%20Quero%20anunciar%20meu%20imóvel%20com%20a%20Imobiliária%20Lemos."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
              style={{ backgroundColor: '#25D366', color: 'white' }}
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </a>
            <Link
              href="/avaliacao"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110"
              style={{ backgroundColor: '#1B2B5B', color: 'white' }}
            >
              Solicitar Avaliação Gratuita
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
