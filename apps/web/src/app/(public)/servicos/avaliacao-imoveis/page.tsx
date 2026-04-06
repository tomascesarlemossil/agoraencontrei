import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, CheckCircle2, Phone, Star, Shield, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Avaliação de Imóveis em Franca/SP — Gratuita | Imobiliária Lemos',
  description: 'Avaliação gratuita de imóveis em Franca/SP. Saiba quanto vale sua casa, apartamento, terreno ou imóvel comercial. Laudo de avaliação imobiliária com CRECI 279051. Imobiliária Lemos — mais de 20 anos de experiência.',
  keywords: [
    'avaliação de imóvel franca sp', 'avaliação imobiliária franca', 'avaliar imóvel franca sp',
    'quanto vale meu imóvel franca', 'laudo de avaliação imóvel franca', 'avaliação gratuita imóvel franca',
    'perito avaliador imóveis franca', 'valor de mercado imóvel franca', 'preço imóvel franca sp',
    'avaliação de terreno franca sp', 'avaliação de apartamento franca sp', 'avaliação de casa franca sp',
    'serviço de avaliação imobiliária franca', 'avaliação de propriedade franca',
    'avaliação imóvel comercial franca sp',
  ].join(', '),
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/avaliacao-imoveis' },
  openGraph: {
    title: 'Avaliação Gratuita de Imóveis em Franca/SP',
    description: 'Saiba quanto vale seu imóvel gratuitamente. Avaliação profissional com CRECI 279051.',
    url: 'https://www.agoraencontrei.com.br/servicos/avaliacao-imoveis',
    siteName: 'AgoraEncontrei | Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
  },
}

const faqItems = [
  { q: 'A avaliação de imóvel é realmente gratuita?', a: 'Sim! A Imobiliária Lemos oferece avaliação gratuita para imóveis em Franca e região. Entre em contato e agende sua avaliação.' },
  { q: 'Quanto tempo leva para avaliar meu imóvel?', a: 'A avaliação é realizada em até 48 horas após a visita ao imóvel. Você recebe um relatório completo com o valor de mercado.' },
  { q: 'O laudo de avaliação tem validade jurídica?', a: 'Nosso laudo é emitido por profissional credenciado pelo CRECI e pode ser utilizado para fins de inventário, partilha, financiamento e outros processos.' },
  { q: 'Vocês avaliam imóveis rurais (sítios, fazendas)?', a: 'Sim! Avaliamos todos os tipos de imóveis: residenciais, comerciais, rurais (sítios, chácaras, fazendas) e terrenos.' },
]

export default function AvaliacaoImoveisPage() {
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Avaliação de Imóveis',
    description: 'Serviço gratuito de avaliação imobiliária em Franca/SP',
    provider: { '@type': 'RealEstateAgent', name: 'Imobiliária Lemos', telephone: '+5516981010004' },
    areaServed: { '@type': 'City', name: 'Franca' },
    serviceType: 'Avaliação Imobiliária',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL', description: 'Avaliação gratuita' },
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
              <span className="text-yellow-400">Avaliação de Imóveis</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-2xl mt-1">
                <BarChart3 className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Avaliação <span className="text-yellow-400">Gratuita</span> de Imóveis em Franca/SP
                </h1>
                <p className="text-white/70 text-lg max-w-2xl">
                  Saiba quanto vale seu imóvel com uma avaliação profissional e gratuita.
                  Mais de 20 anos de experiência no mercado imobiliário de Franca.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="https://wa.me/5516981010004?text=Olá! Gostaria de uma avaliação gratuita do meu imóvel."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors">
                <Phone className="h-5 w-5" /> Solicitar avaliação gratuita
              </a>
              <Link href="/anunciar"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20">
                Anunciar meu imóvel
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Star, title: 'Gratuita', desc: 'Avaliação 100% gratuita e sem compromisso para todos os tipos de imóveis em Franca e região.' },
              { icon: Shield, title: 'Profissional', desc: 'Avaliação realizada por profissional credenciado pelo CRECI com mais de 20 anos de experiência.' },
              { icon: TrendingUp, title: 'Precisa', desc: 'Análise comparativa de mercado com dados reais de vendas recentes na mesma região.' },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <item.icon className="h-8 w-8 text-yellow-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Tipos de imóveis que avaliamos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Casas residenciais', 'Apartamentos', 'Terrenos urbanos',
                'Imóveis comerciais', 'Galpões e barracões', 'Sítios e chácaras',
                'Fazendas e propriedades rurais', 'Lotes em condomínio',
                'Imóveis em inventário', 'Imóveis para financiamento',
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
        </section>
      </main>
    </>
  )
}
