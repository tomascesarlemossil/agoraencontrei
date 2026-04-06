import type { Metadata } from 'next'
import Link from 'next/link'
import { Wrench, CheckCircle, Phone, MessageCircle, ArrowRight, Home, Paintbrush, Hammer, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reforma de Imóveis em Franca/SP — Compre e Reforme | Imobiliária Lemos',
  description: 'Reforma residencial e comercial em Franca/SP. Compre e reforme com nossa assessoria completa. Orçamento gratuito, mão de obra qualificada e materiais de qualidade. Imobiliária Lemos — CRECI 279051.',
  keywords: 'reforma imóveis franca sp, reforma residencial franca, reforma comercial franca, comprar e reformar imóvel franca, reforma casa franca sp, reforma apartamento franca, construção civil franca, mão de obra franca sp, orçamento reforma franca',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/reforma-imoveis' },
  openGraph: {
    title: 'Reforma de Imóveis em Franca/SP — Compre e Reforme',
    description: 'Reforma residencial e comercial em Franca/SP com assessoria completa. Orçamento gratuito.',
    type: 'website',
  },
}

const SERVICES = [
  { icon: Home, title: 'Reforma Residencial', desc: 'Reforma completa de casas e apartamentos em Franca/SP.' },
  { icon: Paintbrush, title: 'Pintura e Acabamento', desc: 'Pintura interna e externa, texturas, grafiato e revestimentos.' },
  { icon: Hammer, title: 'Alvenaria e Estrutura', desc: 'Ampliações, demolições, paredes e estruturas em geral.' },
  { icon: Zap, title: 'Instalações Elétricas e Hidráulicas', desc: 'Elétrica, hidráulica, gás e ar-condicionado.' },
]

export default function ReformaImoveisPage() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f7f4 0%, #fff 100%)' }}>
      {/* Hero */}
      <section className="py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: 'rgba(201,168,76,0.2)' }}>
            <Wrench className="w-8 h-8" style={{ color: '#C9A84C' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Reforma de Imóveis em Franca/SP
          </h1>
          <p className="text-blue-200 text-lg mb-8">
            Compre e reforme com nossa assessoria completa. Transforme seu imóvel com qualidade e segurança.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5516981010004?text=Olá!%20Gostaria%20de%20um%20orçamento%20para%20reforma%20de%20imóvel%20em%20Franca/SP."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
            >
              <MessageCircle className="w-4 h-4" /> Solicitar Orçamento Gratuito
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Nossos Serviços de Reforma
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'rgba(201,168,76,0.1)' }}>
                  <Icon className="w-6 h-6" style={{ color: '#C9A84C' }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#1B2B5B' }}>{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border shadow-sm p-8" style={{ borderColor: '#e8e4dc' }}>
          <h2 className="text-xl font-bold mb-3" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Quer reformar seu imóvel em Franca/SP?
          </h2>
          <p className="text-gray-500 text-sm mb-6">Entre em contato e receba um orçamento gratuito sem compromisso.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5516981010004?text=Olá!%20Gostaria%20de%20um%20orçamento%20para%20reforma%20de%20imóvel."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <Link
              href="/imoveis"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-all hover:shadow-sm"
              style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
            >
              Ver imóveis para reformar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
