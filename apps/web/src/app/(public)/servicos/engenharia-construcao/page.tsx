import type { Metadata } from 'next'
import Link from 'next/link'
import { HardHat, MessageCircle, ArrowRight, Building2, FileText, Ruler, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Engenharia e Construção em Franca/SP | Imobiliária Lemos',
  description: 'Projetos de engenharia civil, construção residencial e comercial em Franca/SP. Assessoria completa: projetos, laudos, ART e execução de obras. Imobiliária Lemos.',
  keywords: 'engenharia civil franca sp, construção residencial franca, construção comercial franca, projeto engenharia franca, laudo técnico franca, ART franca sp, construção imóvel franca, engenheiro franca sp, obra franca sp',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/engenharia-construcao' },
  openGraph: {
    title: 'Engenharia e Construção em Franca/SP',
    description: 'Projetos de engenharia civil e construção residencial e comercial em Franca/SP.',
    type: 'website',
  },
}

const SERVICES = [
  { icon: Ruler, title: 'Projetos de Engenharia', desc: 'Projetos estruturais, hidrossanitários e elétricos para obras residenciais e comerciais.' },
  { icon: Building2, title: 'Construção de Imóveis', desc: 'Construção completa de casas, sobrados, prédios e galpões em Franca/SP.' },
  { icon: FileText, title: 'Laudos e ART', desc: 'Laudos técnicos, ART (Anotação de Responsabilidade Técnica) e documentação de obras.' },
  { icon: ShieldCheck, title: 'Vistoria e Perícia', desc: 'Vistoria técnica de imóveis, perícia de danos e avaliação estrutural.' },
]

export default function EngenhariaConstrucaoPage() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f7f4 0%, #fff 100%)' }}>
      {/* Hero */}
      <section className="py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: 'rgba(201,168,76,0.2)' }}>
            <HardHat className="w-8 h-8" style={{ color: '#C9A84C' }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Engenharia e Construção em Franca/SP
          </h1>
          <p className="text-blue-200 text-lg mb-8">
            Projetos, laudos e execução de obras com profissionais qualificados e experiência no mercado imobiliário de Franca.
          </p>
          <a
            href="https://wa.me/5516981010004?text=Olá!%20Gostaria%20de%20informações%20sobre%20engenharia%20e%20construção%20em%20Franca/SP."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
          >
            <MessageCircle className="w-4 h-4" /> Falar com Engenheiro
          </a>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Serviços de Engenharia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'rgba(27,43,91,0.08)' }}>
                  <Icon className="w-6 h-6" style={{ color: '#1B2B5B' }} />
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
            Precisa de um engenheiro em Franca/SP?
          </h2>
          <p className="text-gray-500 text-sm mb-6">Entre em contato e receba orientação especializada sem compromisso.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/5516981010004?text=Olá!%20Preciso%20de%20engenharia%20em%20Franca/SP."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <Link
              href="/servicos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border transition-all hover:shadow-sm"
              style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
            >
              Ver todos os serviços <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
