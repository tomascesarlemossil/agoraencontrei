import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Imóveis em Batatais/SP | Imobiliária Lemos — Franca/SP',
  description: 'Encontre imóveis em Batatais/SP com a Imobiliária Lemos. Casas, apartamentos e terrenos à venda e para alugar em Batatais. Batatais/SP, cidade histórica a 60km de Franca, conhecida pelo turismo religioso e pela produção de café.',
  keywords: ["imóveis batatais sp", "casas à venda batatais", "apartamentos batatais sp", "terrenos batatais sp", "aluguel batatais sp", "imobiliária batatais sp", "comprar imóvel batatais"],
  openGraph: {
    title: 'Imóveis em Batatais/SP | Imobiliária Lemos',
    description: 'Casas, apartamentos e terrenos em Batatais/SP. Imobiliária Lemos — referência desde 2002.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/imoveis-batatais-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'Imobiliária Lemos — Imóveis em Batatais/SP',
  description: 'Encontre imóveis em Batatais/SP com a Imobiliária Lemos. Batatais/SP, cidade histórica a 60km de Franca, conhecida pelo turismo religioso e pela produção de café.',
  url: 'https://www.agoraencontrei.com.br/imoveis-batatais-sp',
  telephone: '+55-16-3723-0045',
  address: { '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP', addressCountry: 'BR' },
  areaServed: { '@type': 'City', name: 'Batatais', addressRegion: 'SP', addressCountry: 'BR' },
}

export default function ImoveisBatataisPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> Batatais/SP · 60km de Franca · Imobiliária Lemos
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis em Batatais/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            Casas, apartamentos e terrenos à venda e para alugar em Batatais/SP. Imobiliária Lemos — referência desde 2002 em Franca e região.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis/em/batatais"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Imóveis em Batatais
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Tenho interesse em imóveis em Batatais/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Falar com Corretor
            </a>
          </div>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border space-y-6">
          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Imóveis em Batatais/SP — Imobiliária Lemos
          </h2>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Por que comprar imóvel em Batatais?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Batatais/SP é uma excelente opção para quem busca qualidade de vida no interior paulista. Batatais/SP, cidade histórica a 60km de Franca, conhecida pelo turismo religioso e pela produção de café. A Imobiliária Lemos, com mais de 22 anos de experiência em Franca e região, oferece as melhores opções de imóveis em Batatais.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Tipos de imóveis disponíveis em Batatais</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Em Batatais/SP você encontra casas à venda, apartamentos, terrenos, chácaras e imóveis comerciais. Nossa equipe especializada está pronta para ajudá-lo a encontrar o imóvel ideal de acordo com seu perfil e orçamento.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Como a Imobiliária Lemos pode ajudar</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              A Imobiliária Lemos atende toda a região de Franca, incluindo Batatais e cidades vizinhas. Nossa equipe conhece profundamente o mercado imobiliário local e pode oferecer as melhores oportunidades de compra, venda e locação.
            </p>
          </div>
        </div>
      </section>

      {/* LINKS */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Explore Imóveis na Região de Franca/SP
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/imoveis/em/batatais', label: 'Todos os Imóveis em Batatais', icon: '🏠' },
            { href: '/imoveis?city=Franca&purpose=SALE', label: 'Imóveis à Venda em Franca', icon: '🔑' },
            { href: '/imoveis?city=Franca&purpose=RENT', label: 'Imóveis para Alugar em Franca', icon: '🏢' },
            { href: '/leilao-imoveis-franca-sp', label: 'Leilão de Imóveis — Caixa', icon: '🏷️' },
            { href: '/avaliacao-imoveis-franca-sp', label: 'Avaliação Gratuita de Imóvel', icon: '📊' },
            { href: '/financiamento-imovel-franca-sp', label: 'Financiamento Imobiliário', icon: '💰' },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-sm text-gray-800">{item.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Imobiliária Lemos — Franca/SP
          </h2>
          <p className="text-white/70 mb-5">22 anos de tradição · Atendemos Batatais e região</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href="tel:+551637230045"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
              <Phone className="w-4 h-4" /> (16) 3723-0045
            </a>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1B2B5B]"
              style={{ background: '#C9A84C' }}>
              <Home className="w-4 h-4" /> Página Inicial
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
