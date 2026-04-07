import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Condomínio Fechado em Franca/SP | Imobiliária Lemos Franca/SP',
  description: 'Condomínios fechados em Franca/SP: casas e terrenos em condomínios com segurança 24h. Villa Toscana, Residencial Amazonas, Samello Woods e muito mais. Imobiliária Lemos.',
  keywords: ["condomínio fechado franca sp", "casa condomínio franca sp", "condomínio franca sp", "villa toscana franca sp", "residencial amazonas franca sp", "samello woods franca sp", "condomínio segurança franca sp", "lote condomínio franca sp", "condomínio alto padrão franca sp", "condomínio residencial franca sp"],
  openGraph: {
    title: 'Condomínio Fechado em Franca/SP | Imobiliária Lemos Franca/SP',
    description: 'Condomínios fechados em Franca/SP: casas e terrenos em condomínios com segurança 24h. Villa Toscana, Residencial Amazonas, Samello Woods e muito mais. Imobiliária Lemos.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/condominio-fechado-franca-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.agoraencontrei.com.br/condominio-fechado-franca-sp',
  name: 'Imobiliária Lemos — Condomínio Fechado em Franca/SP',
  description: 'Condomínios fechados em Franca/SP: casas e terrenos em condomínios com segurança 24h. Villa Toscana, Residencial Amazonas, Samello Woods e muito mais. Imobiliária Lemos.',
  url: 'https://www.agoraencontrei.com.br/condominio-fechado-franca-sp',
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
            <MapPin className="w-3.5 h-3.5" /> Franca/SP · Imobiliária Lemos
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Condomínio Fechado
em Franca/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">Casas e terrenos em condomínios fechados em Franca/SP. Segurança 24h, infraestrutura completa e qualidade de vida.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?city=Franca&closedCondo=true"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Condomínios Fechados
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Preciso de ajuda com Condomínio Fechado em Franca/SP em Franca/SP."
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
              <h3 className="font-semibold text-gray-800 mb-2">Principais condomínios fechados de Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Os principais condomínios fechados de Franca/SP incluem: Villa Toscana (alto padrão, casas e terrenos), Residencial Amazonas (médio padrão, ampla infraestrutura), Samello Woods (condomínio de chácaras), Residencial Olivito e Residencial Baldassari. Cada um tem características únicas de segurança, lazer e localização.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Vantagens de morar em condomínio fechado em Franca</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Condomínios fechados em Franca/SP oferecem segurança 24h com portaria, câmeras e controle de acesso. Além disso, têm infraestrutura de lazer (piscina, quadras, playground), manutenção das áreas comuns e convívio social com vizinhos. Ideal para famílias com crianças.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Preços de casas em condomínio fechado em Franca</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Os preços de casas em condomínios fechados em Franca/SP variam de R$ 350.000 (padrão médio) a R$ 2.000.000 (alto padrão). Terrenos em condomínio fechado custam de R$ 80.000 a R$ 500.000, dependendo da localização e do tamanho.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Taxa de condomínio em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">As taxas de condomínio em Franca/SP variam de R$ 300 a R$ 1.500 por mês, dependendo do condomínio e dos serviços oferecidos. Condomínios com portaria 24h, piscina e academia têm taxas mais altas, mas oferecem mais segurança e comodidade.</p>
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
          <p className="text-white/70 mb-5">22 anos de tradição · Atendimento personalizado</p>
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
