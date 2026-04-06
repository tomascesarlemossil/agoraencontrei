import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terrenos à Venda em Franca/SP | Imobiliária Lemos Franca/SP — CRECI 279051',
  description: 'Encontre terrenos à venda em Franca/SP com a Imobiliária Lemos. Lotes residenciais, comerciais e industriais em todos os bairros. Financiamento disponível. CRECI 279051.',
  keywords: ["terrenos à venda franca sp", "terreno à venda franca", "comprar terreno franca sp", "lote franca sp", "loteamento franca sp", "terreno residencial franca sp", "terreno comercial franca sp", "terreno industrial franca sp", "lote barato franca sp", "terreno condomínio franca sp"],
  openGraph: {
    title: 'Terrenos à Venda em Franca/SP | Imobiliária Lemos Franca/SP',
    description: 'Encontre terrenos à venda em Franca/SP com a Imobiliária Lemos. Lotes residenciais, comerciais e industriais em todos os bairros. Financiamento disponível. CRECI 279051.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/terrenos-a-venda-franca-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.agoraencontrei.com.br/terrenos-a-venda-franca-sp',
  name: 'Imobiliária Lemos — Terrenos à Venda em Franca/SP',
  description: 'Encontre terrenos à venda em Franca/SP com a Imobiliária Lemos. Lotes residenciais, comerciais e industriais em todos os bairros. Financiamento disponível. CRECI 279051.',
  url: 'https://www.agoraencontrei.com.br/terrenos-a-venda-franca-sp',
  telephone: '+55-16-3723-0045',
  address: {
    '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP',
    postalCode: '14400-000', addressCountry: 'BR',
  },
  geo: { '@type': 'GeoCoordinates', latitude: -20.5386, longitude: -47.4008 },
  openingHours: 'Mo-Fr 08:00-18:00, Sa 08:00-12:00',
  sameAs: ['https://www.instagram.com/imobiliarialemos/', 'https://www.facebook.com/imobiliarialemos/'],
}

export default function TemaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> Franca/SP · Imobiliária Lemos · CRECI 279051
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Terrenos à Venda
em Franca/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">Mais de 400 terrenos disponíveis em Franca/SP. Lotes residenciais, comerciais e industriais em todos os bairros.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?city=Franca&type=LAND"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Todos os Terrenos
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Preciso de ajuda com Terrenos à Venda em Franca/SP em Franca/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Falar com Especialista
            </a>
          </div>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border space-y-6">
          
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Terrenos residenciais em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Franca/SP tem uma grande oferta de terrenos residenciais em loteamentos novos e bairros consolidados. Lotes a partir de 200m² em bairros como Jardim Califórnia, Jardim Europa e Residencial Amazonas. Ideal para construir sua casa com o projeto que você sempre quis.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Loteamentos em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Os principais loteamentos de Franca/SP incluem Residencial Amazonas, Villa Toscana, Residencial Olivito, Samello Woods e Núcleo Agrícola Alpha. Cada loteamento tem características únicas de infraestrutura, tamanho dos lotes e localização.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Terrenos comerciais e industriais em Franca</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Para quem busca terrenos comerciais ou industriais em Franca/SP, a cidade oferece opções na Vila Industrial, Parque Progresso e ao longo das principais avenidas. Ideal para construir galpões, lojas, consultórios e outros empreendimentos comerciais.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Financiamento de terrenos em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">É possível financiar terrenos em Franca/SP pela Caixa Econômica Federal e outros bancos, desde que o loteamento seja regularizado e o terreno tenha matrícula individual. A Imobiliária Lemos orienta você sobre as opções de financiamento disponíveis.</p>
            </div>
        </div>
      </section>

      {/* LINKS PARA O SITE */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Explore Nosso Portfólio de Imóveis em Franca/SP
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/imoveis?city=Franca&type=HOUSE&purpose=SALE', label: 'Casas à Venda em Franca', icon: '🏠' },
            { href: '/imoveis?city=Franca&type=HOUSE&purpose=RENT', label: 'Casas para Alugar em Franca', icon: '🔑' },
            { href: '/imoveis?city=Franca&type=APARTMENT', label: 'Apartamentos em Franca', icon: '🏢' },
            { href: '/imoveis?city=Franca&type=LAND', label: 'Terrenos em Franca', icon: '📐' },
            { href: '/imoveis?city=Franca&type=WAREHOUSE', label: 'Galpões e Comerciais', icon: '🏭' },
            { href: '/imoveis?city=Franca&type=FARM', label: 'Chácaras e Sítios', icon: '🌳' },
          ].map((item: any) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-sm text-gray-800">{item.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
            </Link>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Imobiliária Lemos — Franca/SP
          </h2>
          <p className="text-white/70 mb-5">CRECI 279051 · 22 anos de tradição · Atendimento personalizado</p>
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
