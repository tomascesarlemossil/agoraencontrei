import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Investimento Imobiliário em Franca/SP | Imobiliária Lemos Franca/SP — CRECI 279051',
  description: 'Invista em imóveis em Franca/SP com a Imobiliária Lemos. Rentabilidade, valorização e segurança. Casas, apartamentos, terrenos e comerciais para investidores. CRECI 279051.',
  keywords: ["investimento imobiliário franca sp", "investir em imóveis franca sp", "rentabilidade imóvel franca sp", "comprar para alugar franca sp", "imóvel investimento franca", "valorização imóvel franca sp", "renda passiva imóvel franca sp", "flipping imóvel franca sp", "imóvel renda franca sp", "investidor imobiliário franca sp"],
  openGraph: {
    title: 'Investimento Imobiliário em Franca/SP | Imobiliária Lemos Franca/SP',
    description: 'Invista em imóveis em Franca/SP com a Imobiliária Lemos. Rentabilidade, valorização e segurança. Casas, apartamentos, terrenos e comerciais para investidores. CRECI 279051.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/investimento-imobiliario-franca-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.agoraencontrei.com.br/investimento-imobiliario-franca-sp',
  name: 'Imobiliária Lemos — Investimento Imobiliário em Franca/SP',
  description: 'Invista em imóveis em Franca/SP com a Imobiliária Lemos. Rentabilidade, valorização e segurança. Casas, apartamentos, terrenos e comerciais para investidores. CRECI 279051.',
  url: 'https://www.agoraencontrei.com.br/investimento-imobiliario-franca-sp',
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
            Investimento Imobiliário
em Franca/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">Rentabilidade, valorização e segurança. Invista em imóveis em Franca/SP com a expertise da Imobiliária Lemos.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?city=Franca&purpose=SALE"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Oportunidades de Investimento
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Preciso de ajuda com Investimento Imobiliário em Franca/SP em Franca/SP."
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
              <h3 className="font-semibold text-gray-800 mb-2">Por que investir em imóveis em Franca/SP?</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Franca/SP é uma cidade economicamente sólida, com PIB diversificado (calçados, agronegócio, serviços e comércio). O mercado imobiliário local tem apresentado valorização consistente, com rentabilidade de aluguel entre 0,5% e 0,8% ao mês sobre o valor do imóvel.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Comprar para alugar em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">A estratégia de comprar para alugar é muito popular em Franca/SP, especialmente com a presença da UNESP e de empresas do setor calçadista. Apartamentos próximos à universidade e casas em bairros nobres têm alta demanda e baixa vacância.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Valorização imobiliária em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Os bairros com maior valorização em Franca/SP nos últimos anos incluem Residencial Amazonas, Villa Toscana, Jardim Califórnia e Jardim Europa. Novos loteamentos como Samello Woods e Residencial Olivito também têm apresentado forte valorização.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Flipping imobiliário em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">O flipping (comprar, reformar e vender) é uma estratégia de investimento crescente em Franca/SP. Imóveis antigos em bairros valorizados, adquiridos por preços abaixo do mercado, reformados e revendidos com lucro de 20% a 50%. A Imobiliária Lemos identifica as melhores oportunidades.</p>
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
