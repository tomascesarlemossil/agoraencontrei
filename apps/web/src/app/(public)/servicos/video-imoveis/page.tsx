import type { Metadata } from 'next'
import Link from 'next/link'
import { Video, Plane, Star, CheckCircle2, Phone, Film } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Vídeo e Drone para Imóveis em Franca/SP | Imobiliária Lemos',
  description: 'Vídeos profissionais e filmagem com drone para imóveis em Franca/SP. Tour virtual, vídeo de apresentação, filmagem aérea com drone. Videomaker especializado em imóveis. Imobiliária Lemos — CRECI 279051.',
  keywords: [
    'vídeo de imóveis franca sp', 'drone imóveis franca sp', 'videomaker imóveis franca',
    'filmagem drone franca sp', 'vídeo profissional imóveis franca', 'tour virtual imóvel franca',
    'vídeo apresentação imóvel franca', 'fotos drone franca sp', 'filmagem aérea imóveis franca',
    'drone franca sp', 'vídeo drone franca sp', 'videomaker franca sp',
    'produção de vídeo imóveis franca', 'vídeo marketing imóvel franca',
    'fotografia aérea imóveis franca', 'imagens aéreas imóveis franca',
    'drone imobiliário franca', 'vídeo tour imóvel franca',
  ].join(', '),
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/video-imoveis' },
  openGraph: {
    title: 'Vídeo e Drone para Imóveis em Franca/SP',
    description: 'Vídeos profissionais e filmagem aérea com drone para imóveis em Franca/SP.',
    url: 'https://www.agoraencontrei.com.br/servicos/video-imoveis',
    siteName: 'AgoraEncontrei | Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
  },
}

const faqItems = [
  { q: 'Vocês fazem filmagem com drone em Franca/SP?', a: 'Sim! Realizamos filmagens aéreas com drone para imóveis residenciais, comerciais, rurais e loteamentos em Franca e região.' },
  { q: 'O que é um tour virtual de imóvel?', a: 'É um vídeo de apresentação completo do imóvel, mostrando todos os ambientes em sequência, como se o comprador estivesse visitando pessoalmente.' },
  { q: 'Em quanto tempo entregam o vídeo editado?', a: 'O vídeo editado é entregue em até 48 horas após a filmagem.' },
  { q: 'Vídeos de imóveis realmente fazem diferença nas vendas?', a: 'Sim! Imóveis com vídeo recebem até 403% mais consultas do que imóveis apenas com fotos.' },
]

export default function VideoImoveisPage() {
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Vídeo e Drone para Imóveis',
    description: 'Serviço de vídeo profissional e filmagem com drone para imóveis em Franca/SP',
    provider: { '@type': 'RealEstateAgent', name: 'Imobiliária Lemos', telephone: '+5516981010004' },
    areaServed: { '@type': 'City', name: 'Franca' },
    serviceType: 'Videomaker Imobiliário',
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <main className="min-h-screen bg-[#0f1a35]">
        <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1a35] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-400/70 text-sm mb-4">
              <Link href="/" className="hover:text-yellow-400">Início</Link>
              <span>/</span>
              <Link href="/servicos" className="hover:text-yellow-400">Serviços</Link>
              <span>/</span>
              <span className="text-yellow-400">Vídeo e Drone para Imóveis</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-2xl mt-1">
                <Plane className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Vídeo e <span className="text-yellow-400">Drone para Imóveis</span> em Franca/SP
                </h1>
                <p className="text-white/70 text-lg max-w-2xl">
                  Vídeos profissionais, tour virtual e filmagem aérea com drone para imóveis
                  residenciais, comerciais e rurais em Franca e região.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <a href="https://wa.me/5516981010004?text=Olá! Gostaria de saber mais sobre vídeo e drone para imóveis."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors">
                <Phone className="h-5 w-5" /> Solicitar orçamento
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Video, title: 'Vídeo Profissional', desc: 'Tour virtual completo mostrando todos os ambientes do imóvel com qualidade cinematográfica.' },
              { icon: Plane, title: 'Drone Aéreo', desc: 'Filmagem aérea com drone para mostrar a localização, entorno e área total do imóvel.' },
              { icon: Film, title: 'Vídeo Marketing', desc: 'Vídeo de apresentação para redes sociais, WhatsApp e portais imobiliários.' },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <item.icon className="h-8 w-8 text-yellow-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Nossos serviços de vídeo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Tour virtual do imóvel', 'Filmagem com drone (aérea)',
                'Vídeo de apresentação', 'Vídeo para redes sociais',
                'Vídeo para WhatsApp', 'Vídeo para portais imobiliários',
                'Edição profissional', 'Trilha sonora',
                'Legendas e textos', 'Entrega em 48h',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Perguntas Frequentes</h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <div key={i} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <h3 className="text-white font-semibold mb-2">{item.q}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#1B2B5B] to-[#243670] border border-yellow-400/20 rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Destaque seu imóvel com vídeo profissional</h2>
            <p className="text-white/60 mb-4">Solicite um orçamento e receba uma proposta personalizada.</p>
            <a href="https://wa.me/5516981010004?text=Olá! Gostaria de saber mais sobre vídeo e drone para imóveis."
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors">
              <Phone className="h-5 w-5" /> Falar no WhatsApp
            </a>
          </div>
        </section>
      </main>
    </>
  )
}
