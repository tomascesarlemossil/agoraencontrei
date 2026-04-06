import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Arquitetura e Design de Interiores em Franca/SP | Imobiliária Lemos Franca/SP',
  description: 'Arquitetura residencial e comercial em Franca/SP. Projetos de design de interiores, decoração e reforma. Imobiliária Lemos conecta você aos melhores arquitetos de Franca. CRECI 279051.',
  keywords: ["arquitetura franca sp", "arquiteto franca sp", "design de interiores franca sp", "projeto arquitetônico franca", "decoração franca sp", "arquiteto residencial franca", "projeto casa franca sp", "CAU franca sp", "arquitetura residencial franca", "interiores franca sp"],
  openGraph: {
    title: 'Arquitetura e Design de Interiores em Franca/SP | Imobiliária Lemos Franca/SP',
    description: 'Arquitetura residencial e comercial em Franca/SP. Projetos de design de interiores, decoração e reforma. Imobiliária Lemos conecta você aos melhores arquitetos de Franca. CRECI 279051.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/arquitetura-franca-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.agoraencontrei.com.br/arquitetura-franca-sp',
  name: 'Imobiliária Lemos — Arquitetura e Design de Interiores em Franca/SP',
  description: 'Arquitetura residencial e comercial em Franca/SP. Projetos de design de interiores, decoração e reforma. Imobiliária Lemos conecta você aos melhores arquitetos de Franca. CRECI 279051.',
  url: 'https://www.agoraencontrei.com.br/arquitetura-franca-sp',
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
            Arquitetura e Design
em Franca/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">Projetos arquitetônicos residenciais e comerciais em Franca/SP. Design de interiores e decoração para seu imóvel ideal.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?city=Franca"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Encontrar Meu Imóvel
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Preciso de ajuda com Arquitetura e Design de Interiores em Franca/SP em Franca/SP."
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
              <h3 className="font-semibold text-gray-800 mb-2">Arquitetura residencial em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Franca/SP tem uma cena arquitetônica vibrante, com escritórios especializados em projetos residenciais, comerciais e industriais. Seja para construir uma casa nova, reformar um apartamento ou projetar um condomínio, a cidade conta com profissionais credenciados pelo CAU.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Design de interiores em Franca</h3>
              <p className="text-gray-600 text-sm leading-relaxed">O design de interiores em Franca/SP tem crescido significativamente, com profissionais especializados em decoração residencial, comercial e corporativa. Ao adquirir um imóvel pela Imobiliária Lemos, podemos indicar designers de interiores para personalizar seu novo lar.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Projetos de casas em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Para construir sua casa em Franca/SP, você precisará de um projeto arquitetônico aprovado pela Prefeitura. O projeto deve contemplar planta baixa, cortes, fachadas e memorial descritivo. Arquitetos credenciados pelo CAU garantem projetos seguros e dentro das normas municipais.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Tendências de arquitetura em Franca</h3>
              <p className="text-gray-600 text-sm leading-relaxed">As tendências arquitetônicas em Franca/SP incluem casas com integração de ambientes, uso de materiais sustentáveis, automação residencial e espaços de home office. Condomínios fechados como Villa Toscana e Residencial Amazonas exemplificam o alto padrão construtivo da cidade.</p>
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
