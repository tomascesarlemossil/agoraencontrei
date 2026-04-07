import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Imóveis em Jeriquara/SP | AgoraEncontrei — Marketplace Imobiliário',
  description: 'Encontre imóveis em Jeriquara/SP. Cidade a apenas 25km de Franca com aproximadamente 3.500 habitantes (IBGE 2022). Sítios, chácaras e terrenos a preços acessíveis. Marketplace AgoraEncontrei.',
  keywords: ['imóveis jeriquara sp', 'casas à venda jeriquara', 'sítios jeriquara sp', 'chácaras jeriquara sp', 'terrenos jeriquara sp', 'imobiliária jeriquara sp'],
  openGraph: {
    title: 'Imóveis em Jeriquara/SP | AgoraEncontrei',
    description: 'Sítios, chácaras e terrenos em Jeriquara/SP a 25km de Franca. Marketplace AgoraEncontrei.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/imoveis-jeriquara-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Imóveis em Jeriquara/SP — AgoraEncontrei',
  description: 'Imóveis à venda em Jeriquara/SP. 3.500 habitantes (IBGE 2022). A 25km de Franca.',
  url: 'https://www.agoraencontrei.com.br/imoveis-jeriquara-sp',
  about: { '@type': 'City', name: 'Jeriquara', addressRegion: 'SP', addressCountry: 'BR', population: 3500 },
}

export default function ImoveisJeriquaraPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> Jeriquara/SP · 25km de Franca · 3,5 mil hab.
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis em Jeriquara/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            Sítios, chácaras e terrenos à venda em Jeriquara/SP. Uma das cidades mais próximas de Franca, com preços acessíveis e qualidade de vida.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis/em/jeriquara"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Imóveis em Jeriquara
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Tenho interesse em imóveis em Jeriquara/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Falar com Corretor
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>3.500</div>
              <div className="text-white/60">habitantes (IBGE 2022)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>R$ 25.100</div>
              <div className="text-white/60">PIB per capita</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>204 km²</div>
              <div className="text-white/60">área total</div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border space-y-6">
          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Oportunidades de Imóveis em Jeriquara: Panorama Atual
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Jeriquara é o menor município da região geográfica imediata de Franca, com aproximadamente <strong>3.500
            habitantes</strong> segundo o Censo IBGE 2022. Localizada a <strong>apenas 25km de Franca</strong>, é uma
            das cidades mais próximas do polo regional, o que a torna estratégica para quem busca imóveis rurais —
            sítios, chácaras e fazendas — a preços muito abaixo dos praticados em Franca e cidades maiores. A área
            territorial de <strong>204 km²</strong> oferece ampla disponibilidade de terras, e a economia local se
            baseia na agropecuária, com destaque para a pecuária leiteira e a cafeicultura. A curta distância até
            Franca (menos de 20 minutos de carro) permite que moradores de Jeriquara acessem toda a infraestrutura
            de saúde, educação, comércio e serviços da cidade maior, mantendo o custo de vida significativamente
            reduzido. O mercado imobiliário local oferece oportunidades de terrenos rurais e urbanos a preços que
            vêm atraindo investidores atentos ao potencial de valorização de municípios na zona de influência direta
            de Franca. Chácaras de lazer, em particular, têm demanda crescente de famílias francanas que buscam
            refúgio no fim de semana.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">Por que investir em Jeriquara?</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Menor cidade da região imediata de Franca, a apenas 25km. Sítios e chácaras a preços muito acessíveis.
            Vocação agropecuária e leiteira consolidada. Com PIB per capita de R$ 25.100 e cerca de 600 postos de
            trabalho formal, Jeriquara mantém uma economia enxuta mas estável. A proximidade extrema com Franca é o
            grande diferencial: moradores e investidores podem usufruir da tranquilidade rural sem abrir mão do acesso
            rápido a um polo regional completo. Para investidores, o foco são chácaras de lazer e sítios produtivos,
            que apresentam valorização constante impulsionada pela demanda de famílias da região de Franca.
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
            { href: '/imoveis/em/jeriquara', label: 'Todos os Imóveis em Jeriquara', icon: '🏠' },
            { href: '/imoveis-franca-sp', label: 'Imóveis em Franca/SP', icon: '🏙️' },
            { href: '/chacaras-e-sitios-franca-sp', label: 'Chácaras e Sítios na Região', icon: '🌳' },
            { href: '/terrenos-a-venda-franca-sp', label: 'Terrenos à Venda na Região', icon: '📐' },
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
          <p className="text-white/70 mb-5">Imóveis em Jeriquara e região de Franca/SP</p>
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
          Oportunidades em Jeriquara?
          <span className="underline ml-1" style={{ color: '#C9A84C' }}>VER MARKETPLACE</span>
        </Link>
      </div>
    </>
  )
}
