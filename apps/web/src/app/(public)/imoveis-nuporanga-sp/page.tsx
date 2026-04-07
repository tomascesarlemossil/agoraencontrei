import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Imóveis em Nuporanga/SP | AgoraEncontrei — Marketplace Imobiliário',
  description: 'Encontre imóveis em Nuporanga/SP. Cidade a 65km de Franca com aproximadamente 7.800 habitantes (IBGE 2022). Polo cafeeiro com PIB per capita elevado. Terrenos e imóveis rurais. Marketplace AgoraEncontrei.',
  keywords: ['imóveis nuporanga sp', 'casas à venda nuporanga', 'terrenos nuporanga sp', 'chácaras nuporanga sp', 'fazendas nuporanga sp', 'imobiliária nuporanga sp'],
  openGraph: {
    title: 'Imóveis em Nuporanga/SP | AgoraEncontrei',
    description: 'Imóveis rurais e terrenos em Nuporanga/SP. Polo cafeeiro a 65km de Franca. Marketplace AgoraEncontrei.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/imoveis-nuporanga-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Imóveis em Nuporanga/SP — AgoraEncontrei',
  description: 'Imóveis à venda em Nuporanga/SP. 7.800 habitantes (IBGE 2022). Polo cafeeiro a 65km de Franca.',
  url: 'https://www.agoraencontrei.com.br/imoveis-nuporanga-sp',
  about: { '@type': 'City', name: 'Nuporanga', addressRegion: 'SP', addressCountry: 'BR', population: 7800 },
}

export default function ImoveisNuporangaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> Nuporanga/SP · 65km de Franca · 7,8 mil hab.
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis em Nuporanga/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            Terrenos, chácaras e fazendas à venda em Nuporanga/SP. Polo cafeeiro com PIB per capita elevado a 65km de Franca.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis/em/nuporanga"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Imóveis em Nuporanga
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Tenho interesse em imóveis em Nuporanga/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Falar com Corretor
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>7.800</div>
              <div className="text-white/60">habitantes (IBGE 2022)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>R$ 35.200</div>
              <div className="text-white/60">PIB per capita</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>348 km²</div>
              <div className="text-white/60">área total</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border space-y-6">
          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Oportunidades de Imóveis em Nuporanga: Panorama Atual
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Nuporanga é um município de São Paulo localizado a <strong>65km de Franca</strong>, com aproximadamente
            <strong> 7.800 habitantes</strong> segundo o Censo IBGE 2022. O que diferencia Nuporanga na região é seu
            <strong> PIB per capita elevado de R$ 35.200</strong> — acima de várias cidades de porte similar —
            impulsionado por uma cafeicultura de alta qualidade e uma agropecuária diversificada. A produção de café
            especial coloca Nuporanga no mapa do agronegócio paulista, atraindo investidores do setor rural. A área
            territorial de <strong>348 km²</strong> oferece ampla disponibilidade de terras para sítios, chácaras e
            fazendas produtivas. O acesso pela SP-334 conecta Nuporanga tanto a Franca quanto a Batatais e Ribeirão
            Preto, facilitando o escoamento da produção agrícola e o deslocamento de moradores. O mercado imobiliário
            local é predominantemente rural, com oportunidades em fazendas de café, sítios de lazer e terrenos para
            investimento de longo prazo. A valorização imobiliária acompanha o desempenho do agronegócio, oferecendo
            retornos consistentes para investidores atentos ao interior paulista.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">Por que investir em Nuporanga?</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Economia forte na cafeicultura de alta qualidade. PIB per capita elevado para o porte da cidade.
            Imóveis rurais com valorização constante acompanhando o agronegócio. A 65km de Franca, com acesso
            pela SP-334. Com aproximadamente 2.100 postos de trabalho formal, Nuporanga demonstra uma economia
            produtiva e diversificada para seu porte. Os bairros mais valorizados incluem Centro e Vila Nova.
            Para investidores, fazendas de café e sítios produtivos representam as melhores oportunidades,
            com liquidez garantida pelo forte setor agrícola local.
          </p>

          <blockquote className="border-l-4 pl-4 py-2 bg-amber-50 rounded-r-lg text-sm text-amber-800" style={{ borderColor: '#C9A84C' }}>
            <strong>Nota:</strong> O mercado de leilões e imóveis em SP está em constante atualização. Fique atento às datas de editais.
          </blockquote>

          <p className="text-gray-600 text-sm leading-relaxed pt-2 border-t">
            Para conferir a lista completa e atualizada de oportunidades reais agora mesmo,{' '}
            <a href="https://agoraencontrei.com.br" className="font-semibold underline" style={{ color: '#1B2B5B' }}>
              acesse nossa vitrine principal no marketplace AgoraEncontrei
            </a>.
            Lá você filtra por preço, tipo de imóvel e status do leilão em tempo real.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Explore Imóveis na Região</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: '/imoveis/em/nuporanga', label: 'Todos os Imóveis em Nuporanga', icon: '🏠' },
            { href: '/imoveis-franca-sp', label: 'Imóveis em Franca/SP', icon: '🏙️' },
            { href: '/imoveis-batatais-sp', label: 'Imóveis em Batatais/SP', icon: '🏘️' },
            { href: '/chacaras-e-sitios-franca-sp', label: 'Chácaras e Sítios na Região', icon: '🌳' },
            { href: '/leilao-imoveis-franca-sp', label: 'Leilão de Imóveis — Caixa', icon: '🏷️' },
            { href: '/imoveis-regiao-franca-sp', label: 'Todas as Cidades da Região', icon: '🗺️' },
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

      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>AgoraEncontrei — Marketplace Imobiliário</h2>
          <p className="text-white/70 mb-5">Imóveis em Nuporanga e região de Franca/SP</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
            <a href="tel:+551637230045" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20"><Phone className="w-4 h-4" /> (16) 3723-0045</a>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1B2B5B]" style={{ background: '#C9A84C' }}><Home className="w-4 h-4" /> Marketplace</Link>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B5B] p-3 text-white text-center font-bold text-sm shadow-2xl sm:hidden">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Search className="w-4 h-4" style={{ color: '#C9A84C' }} />
          Oportunidades em Nuporanga?
          <span className="underline ml-1" style={{ color: '#C9A84C' }}>VER MARKETPLACE</span>
        </Link>
      </div>
    </>
  )
}
