import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Financiamento Imobiliário em Franca/SP | Imobiliária Lemos Franca/SP — CRECI 279051',
  description: 'Financiamento imobiliário em Franca/SP: Caixa Econômica, FGTS, Minha Casa Minha Vida, SBPE. Imobiliária Lemos assessora você em todo o processo. CRECI 279051.',
  keywords: ["financiamento imóvel franca sp", "financiamento imobiliário franca", "caixa econômica franca sp", "minha casa minha vida franca sp", "FGTS imóvel franca sp", "financiamento casa franca", "crédito imobiliário franca sp", "simulação financiamento franca", "banco imóvel franca sp", "financiar apartamento franca sp"],
  openGraph: {
    title: 'Financiamento Imobiliário em Franca/SP | Imobiliária Lemos Franca/SP',
    description: 'Financiamento imobiliário em Franca/SP: Caixa Econômica, FGTS, Minha Casa Minha Vida, SBPE. Imobiliária Lemos assessora você em todo o processo. CRECI 279051.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/financiamento-imovel-franca-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://www.agoraencontrei.com.br/financiamento-imovel-franca-sp',
  name: 'Imobiliária Lemos — Financiamento Imobiliário em Franca/SP',
  description: 'Financiamento imobiliário em Franca/SP: Caixa Econômica, FGTS, Minha Casa Minha Vida, SBPE. Imobiliária Lemos assessora você em todo o processo. CRECI 279051.',
  url: 'https://www.agoraencontrei.com.br/financiamento-imovel-franca-sp',
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
            Financiamento Imobiliário
em Franca/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">Assessoria completa para financiamento de imóveis em Franca/SP. Caixa Econômica, FGTS, Minha Casa Minha Vida e muito mais.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?city=Franca&purpose=SALE"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Imóveis Financiáveis
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Preciso de ajuda com Financiamento Imobiliário em Franca/SP em Franca/SP."
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
              <h3 className="font-semibold text-gray-800 mb-2">Como financiar um imóvel em Franca/SP?</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Para financiar um imóvel em Franca/SP, você pode recorrer à Caixa Econômica Federal, Banco do Brasil, Bradesco, Itaú e outros bancos. O processo envolve análise de crédito, avaliação do imóvel e aprovação da documentação. A Imobiliária Lemos oferece assessoria completa em todo o processo.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Minha Casa Minha Vida em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">O programa Minha Casa Minha Vida (MCMV) oferece condições especiais para famílias de baixa e média renda comprarem imóveis em Franca/SP. Com subsídios do governo e taxas de juros reduzidas, é possível financiar uma casa ou apartamento com parcelas acessíveis.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Usar FGTS para comprar imóvel em Franca</h3>
              <p className="text-gray-600 text-sm leading-relaxed">O FGTS pode ser usado para dar entrada na compra de imóvel em Franca/SP, amortizar o saldo devedor ou pagar parcelas do financiamento. Para usar o FGTS, o imóvel deve ser residencial, estar localizado na cidade onde o comprador trabalha ou reside há pelo menos 1 ano.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Simulação de financiamento em Franca/SP</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Antes de escolher um imóvel, é importante simular o financiamento para saber o valor das parcelas e o total a pagar. A Imobiliária Lemos oferece simulação gratuita de financiamento com os principais bancos, ajudando você a escolher a melhor opção para seu perfil.</p>
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
