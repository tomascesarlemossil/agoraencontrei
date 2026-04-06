import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera, Star, CheckCircle2, Phone, ArrowRight, Image, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Fotografia Profissional de Imóveis em Franca/SP | Imobiliária Lemos',
  description: 'Fotografia profissional de imóveis em Franca/SP. Fotos de alta qualidade, edição profissional, tratamento de imagens e entrega rápida. Venda seu imóvel mais rápido com fotos profissionais. Imobiliária Lemos.',
  keywords: [
    'fotografia de imóveis franca sp', 'fotos profissionais imóveis franca',
    'fotógrafo de imóveis franca sp', 'fotografia imobiliária franca',
    'fotos para vender imóvel franca', 'edição de fotos imóveis franca sp',
    'tratamento de fotos imóveis franca', 'fotos de qualidade imóveis franca',
    'fotografia residencial franca sp', 'foto imóvel franca sp',
    'imagens profissionais imóveis franca', 'edição de imagens imóveis franca',
    'fotografia comercial imóveis franca', 'fotos imóveis franca',
    'serviço de fotografia imóveis franca sp',
  ].join(', '),
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/fotos-imoveis' },
  openGraph: {
    title: 'Fotografia Profissional de Imóveis em Franca/SP',
    description: 'Fotos profissionais que vendem mais rápido. Edição, tratamento e entrega em 24h.',
    url: 'https://www.agoraencontrei.com.br/servicos/fotos-imoveis',
    siteName: 'AgoraEncontrei | Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
  },
}

const faqItems = [
  { q: 'Quanto custa a fotografia profissional de imóveis?', a: 'Entre em contato para um orçamento personalizado. Oferecemos pacotes para todos os tipos de imóveis, desde apartamentos até fazendas.' },
  { q: 'Em quanto tempo recebo as fotos editadas?', a: 'As fotos editadas são entregues em até 24 horas após a sessão fotográfica.' },
  { q: 'Vocês fazem edição de fotos que já tenho?', a: 'Sim! Oferecemos serviço de edição e tratamento de fotos existentes. Acesse nossa página de edição de fotos online.' },
  { q: 'A fotografia profissional realmente ajuda a vender mais rápido?', a: 'Sim. Estudos mostram que imóveis com fotos profissionais vendem até 32% mais rápido e por valores até 11% maiores.' },
]

export default function FotosImoveisPage() {
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Fotografia Profissional de Imóveis',
    description: 'Serviço de fotografia profissional para imóveis em Franca/SP',
    provider: {
      '@type': 'RealEstateAgent',
      name: 'Imobiliária Lemos',
      telephone: '+5516981010004',
      address: { '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP' },
    },
    areaServed: { '@type': 'City', name: 'Franca', containedIn: { '@type': 'State', name: 'São Paulo' } },
    serviceType: 'Fotografia Imobiliária',
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
              <span className="text-yellow-400">Fotografia de Imóveis</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-2xl mt-1">
                <Camera className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Fotografia Profissional de <span className="text-yellow-400">Imóveis em Franca/SP</span>
                </h1>
                <p className="text-white/70 text-lg max-w-2xl">
                  Fotos profissionais que valorizam seu imóvel e aceleram a venda ou locação.
                  Edição, tratamento e entrega em até 24 horas.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="https://wa.me/5516981010004?text=Olá! Gostaria de saber mais sobre fotografia profissional de imóveis."
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors">
                <Phone className="h-5 w-5" /> Solicitar orçamento
              </a>
              <Link href="/servicos/edicao-fotos"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20">
                <Image className="h-5 w-5" /> Editar fotos online (R$10)
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Camera, title: 'Fotos Profissionais', desc: 'Equipamentos de alta qualidade, iluminação profissional e composição especializada para imóveis.' },
              { icon: Zap, title: 'Entrega em 24h', desc: 'Fotos editadas e tratadas entregues em até 24 horas após a sessão fotográfica.' },
              { icon: Star, title: 'Mais Vendas', desc: 'Imóveis com fotos profissionais vendem até 32% mais rápido e por valores mais altos.' },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <item.icon className="h-8 w-8 text-yellow-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">O que está incluído no serviço</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Sessão fotográfica no imóvel', 'Edição e tratamento profissional',
                'Correção de cores e iluminação', 'Remoção de objetos indesejados',
                'Fotos de ambientes internos', 'Fotos de fachada e área externa',
                'Fotos de detalhes e acabamentos', 'Entrega em alta resolução',
                'Fotos otimizadas para web', 'Até 30 fotos por sessão',
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
            <h2 className="text-xl font-bold text-white mb-2">Pronto para valorizar seu imóvel?</h2>
            <p className="text-white/60 mb-4">Entre em contato e solicite um orçamento sem compromisso.</p>
            <a href="https://wa.me/5516981010004?text=Olá! Gostaria de saber mais sobre fotografia profissional de imóveis."
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
