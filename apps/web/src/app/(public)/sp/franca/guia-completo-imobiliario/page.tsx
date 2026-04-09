/**
 * Mega-Page: /sp/franca/guia-completo-imobiliario
 * Guia definitivo do mercado imobiliário de Franca/SP — Content Hub SEO
 * Target: 3000+ words, 20+ internal links, Schema.org Article + FAQPage
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, TrendingUp, Home, Building2, Gavel, ChevronRight } from 'lucide-react'
import { BAIRROS_FRANCA } from '@/data/seo-bairros-franca'

const WEB = process.env.NEXT_PUBLIC_WEB_URL || 'https://agoraencontrei.com.br'
const YEAR = new Date().getFullYear()

export const metadata: Metadata = {
  title: `Guia Completo do Mercado Imobiliário de Franca/SP ${YEAR} | AgoraEncontrei`,
  description: `Guia definitivo de imóveis em Franca/SP. Preços por m², melhores bairros, leilões, investimentos, financiamento e tendências ${YEAR}. Dados atualizados.`,
  keywords: [
    'imóveis franca sp', 'mercado imobiliário franca', 'preço metro quadrado franca',
    'melhores bairros franca sp', 'leilão imóveis franca', 'investir imóveis franca',
    'casas à venda franca', 'apartamentos franca sp', 'guia imobiliário franca',
  ],
  openGraph: {
    title: `Guia Completo do Mercado Imobiliário de Franca/SP ${YEAR}`,
    description: `Tudo sobre imóveis em Franca/SP: preços, bairros, leilões e oportunidades de investimento.`,
    type: 'article',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
  alternates: {
    canonical: `${WEB}/sp/franca/guia-completo-imobiliario`,
  },
}

export const revalidate = 86400

export default function GuiaCompletoFrancaPage() {
  const bairrosNobres = BAIRROS_FRANCA.filter(b => b.zona === 'nobre').sort((a, b) => b.m2Venda - a.m2Venda)
  const bairrosPopulares = BAIRROS_FRANCA.filter(b => b.zona === 'popular').sort((a, b) => a.m2Venda - b.m2Venda)
  const bairrosExpansao = BAIRROS_FRANCA.filter(b => b.zona === 'expansao')
  const bairrosComLeilao = BAIRROS_FRANCA.filter(b => b.temLeiloes)
  const mediaM2 = Math.round(BAIRROS_FRANCA.reduce((s, b) => s + b.m2Venda, 0) / BAIRROS_FRANCA.length)

  const faqItems = [
    {
      q: `Qual o preço médio do metro quadrado em Franca/SP em ${YEAR}?`,
      a: `O preço médio do m² em Franca/SP em ${YEAR} é de aproximadamente R$ ${mediaM2.toLocaleString('pt-BR')}. Bairros nobres como ${bairrosNobres[0]?.name} chegam a R$ ${bairrosNobres[0]?.m2Venda.toLocaleString('pt-BR')}/m², enquanto bairros populares como ${bairrosPopulares[0]?.name} oferecem valores a partir de R$ ${bairrosPopulares[0]?.m2Venda.toLocaleString('pt-BR')}/m².`,
    },
    {
      q: 'Quais são os melhores bairros para morar em Franca/SP?',
      a: `Os melhores bairros de Franca para morar são: ${bairrosNobres.slice(0, 5).map(b => b.name).join(', ')}. Eles se destacam por infraestrutura, segurança e proximidade com comércio e serviços.`,
    },
    {
      q: 'Como funcionam os leilões de imóveis em Franca?',
      a: `Franca possui leilões judiciais e extrajudiciais com descontos de 30% a 50% sobre o valor de mercado. Bairros com mais oportunidades: ${bairrosComLeilao.slice(0, 5).map(b => b.name).join(', ')}. O AgoraEncontrei lista todos os leilões disponíveis com análise DCF e simulação Monte Carlo.`,
    },
    {
      q: 'Vale a pena investir em imóveis em Franca/SP?',
      a: `Sim! Franca é polo calçadista e universitário com mais de 360 mil habitantes. A cidade oferece leilões com alto desconto, demanda constante por aluguel (universitários e trabalhadores) e PIB per capita superior à média nacional.`,
    },
    {
      q: 'Quais bairros de Franca têm melhor valorização imobiliária?',
      a: `Bairros em zona de expansão como ${bairrosExpansao.slice(0, 3).map(b => b.name).join(', ')} apresentam alta valorização. Bairros nobres consolidados como ${bairrosNobres.slice(0, 3).map(b => b.name).join(', ')} mantêm valores estáveis com demanda constante.`,
    },
    {
      q: 'Qual o melhor bairro para investir em aluguel em Franca?',
      a: `Para aluguel, bairros próximos a universidades (UNIFRAN, UNESP) e ao centro são ideais. ${BAIRROS_FRANCA.filter(b => b.scoreComodidade >= 80).slice(0, 3).map(b => `${b.name} (R$ ${b.m2Aluguel}/m²)`).join(', ')} oferecem boa relação custo/retorno.`,
    },
  ]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Guia Completo do Mercado Imobiliário de Franca/SP ${YEAR}`,
    description: `Guia definitivo de imóveis em Franca/SP com preços por m², melhores bairros, leilões e oportunidades.`,
    author: { '@type': 'Organization', name: 'AgoraEncontrei — Imobiliária Lemos', url: WEB },
    publisher: { '@type': 'Organization', name: 'AgoraEncontrei', url: WEB, logo: { '@type': 'ImageObject', url: `${WEB}/logo-lemos-v2.png` } },
    datePublished: `${YEAR}-01-01`,
    dateModified: new Date().toISOString().split('T')[0],
    url: `${WEB}/sp/franca/guia-completo-imobiliario`,
    mainEntityOfPage: `${WEB}/sp/franca/guia-completo-imobiliario`,
    about: { '@type': 'City', name: 'Franca', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    wordCount: 3000,
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/sp/franca" className="hover:text-white">Franca/SP</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Guia Completo</span>
          </nav>
          <h1
            className="text-3xl sm:text-5xl font-bold mb-4 leading-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Guia Completo do Mercado Imobiliário de{' '}
            <span style={{ color: '#C9A84C' }}>Franca/SP</span>{' '}
            <span className="text-2xl sm:text-3xl">({YEAR})</span>
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-3xl">
            Tudo que você precisa saber sobre imóveis em Franca: preços atualizados por bairro,
            melhores regiões para morar e investir, leilões e oportunidades.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/imoveis?city=Franca&purpose=SALE"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              <Home className="w-4 h-4" /> Ver Imóveis à Venda
            </Link>
            <Link
              href="/sp/franca/investimentos/leilao-de-imoveis"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20"
            >
              <Gavel className="w-4 h-4" /> Ver Leilões
            </Link>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <nav className="bg-blue-50 border-b py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-[#1B2B5B] mb-3">Neste guia:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {[
              ['#panorama', 'Panorama Geral'],
              ['#precos', 'Preços por m²'],
              ['#melhores-bairros', 'Melhores Bairros'],
              ['#leiloes', 'Leilões e Investimentos'],
              ['#valorizacao', 'Zonas de Valorização'],
              ['#faq', 'Perguntas Frequentes'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-[#1B2B5B] hover:underline">
                {label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <article className="prose prose-lg max-w-none">
          {/* Panorama */}
          <section id="panorama" className="mb-12">
            <h2 className="text-2xl font-bold text-[#1B2B5B] mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-[#C9A84C]" />
              Panorama do Mercado Imobiliário em Franca
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Franca é um município do interior paulista com mais de <strong>360 mil habitantes</strong>,
              reconhecida como capital nacional do calçado masculino e polo universitário com
              instituições como UNIFRAN, UNESP e Uni-FACEF. A economia diversificada entre
              indústria calçadista, agronegócio, comércio e serviços gera demanda constante
              por imóveis residenciais e comerciais.
            </p>
            <p className="text-gray-700 leading-relaxed">
              O mercado imobiliário de Franca apresenta características únicas: preços competitivos
              em relação a Ribeirão Preto e São Paulo, oferta crescente de condomínios fechados,
              e um segmento de leilões judiciais particularmente ativo com descontos médios de
              35% a 50% sobre o valor de mercado.
            </p>
          </section>

          {/* Preços */}
          <section id="precos" className="mb-12">
            <h2 className="text-2xl font-bold text-[#1B2B5B] mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#C9A84C]" />
              Preços do Metro Quadrado em Franca ({YEAR})
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              O preço médio do m² em Franca é de <strong>R$ {mediaM2.toLocaleString('pt-BR')}</strong>,
              com variações significativas entre bairros. Confira a tabela atualizada:
            </p>

            <div className="not-prose overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1B2B5B] text-white">
                    <th className="p-3 text-left rounded-tl-lg">Bairro</th>
                    <th className="p-3 text-center">Zona</th>
                    <th className="p-3 text-right">m² Venda</th>
                    <th className="p-3 text-right">m² Aluguel</th>
                    <th className="p-3 text-center rounded-tr-lg">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {BAIRROS_FRANCA.sort((a, b) => b.m2Venda - a.m2Venda).slice(0, 15).map((b, i) => (
                    <tr key={b.slug} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-3 font-medium">
                        <Link href={`/bairros/franca/${b.slug}`} className="text-[#1B2B5B] hover:underline">
                          {b.name}
                        </Link>
                      </td>
                      <td className="p-3 text-center capitalize text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          b.zona === 'nobre' ? 'bg-amber-100 text-amber-800' :
                          b.zona === 'expansao' ? 'bg-green-100 text-green-800' :
                          b.zona === 'comercial' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {b.zona}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">R$ {b.m2Venda.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right">R$ {b.m2Aluguel}/m²</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${b.scoreComodidade >= 80 ? 'text-green-600' : b.scoreComodidade >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {b.scoreComodidade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              * Valores estimados com base em transações recentes. Score de comodidade considera
              proximidade a escolas, hospitais, comércio e transporte.
            </p>
          </section>

          {/* Melhores Bairros */}
          <section id="melhores-bairros" className="mb-12">
            <h2 className="text-2xl font-bold text-[#1B2B5B] mb-4 flex items-center gap-2">
              <Home className="w-6 h-6 text-[#C9A84C]" />
              Melhores Bairros para Morar em Franca
            </h2>

            <h3 className="text-xl font-semibold text-[#1B2B5B] mt-6 mb-3">Bairros Nobres</h3>
            <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {bairrosNobres.slice(0, 6).map(b => (
                <Link
                  key={b.slug}
                  href={`/bairros/franca/${b.slug}`}
                  className="bg-white rounded-xl border p-4 hover:border-[#C9A84C] hover:shadow-sm transition"
                >
                  <p className="font-bold text-[#1B2B5B]">{b.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{b.descricao}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span>R$ {b.m2Venda.toLocaleString('pt-BR')}/m²</span>
                    <span>Score: {b.scoreComodidade}/100</span>
                    <span>{b.distanciaCentroKm} km do centro</span>
                  </div>
                </Link>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-[#1B2B5B] mt-6 mb-3">Bairros com Melhor Custo-Benefício</h3>
            <p className="text-gray-700 leading-relaxed">
              Para quem busca boa infraestrutura sem pagar preço de bairro nobre,
              as opções incluem: {bairrosPopulares.filter(b => b.scoreComodidade >= 60).slice(0, 5).map(b =>
                `${b.name} (R$ ${b.m2Venda.toLocaleString('pt-BR')}/m²)`
              ).join(', ')}. Esses bairros oferecem acesso a comércio, escolas e transporte
              com preços significativamente menores.
            </p>
          </section>

          {/* Leilões e Investimentos */}
          <section id="leiloes" className="mb-12">
            <h2 className="text-2xl font-bold text-[#1B2B5B] mb-4 flex items-center gap-2">
              <Gavel className="w-6 h-6 text-[#C9A84C]" />
              Leilões e Oportunidades de Investimento
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Franca é uma das cidades com maior volume de leilões imobiliários no interior
              de São Paulo. Os principais tipos são:
            </p>
            <ul className="space-y-2 my-4">
              <li><strong>Leilão Judicial:</strong> Imóveis penhorados pela Justiça, com descontos de 40-60%.</li>
              <li><strong>Leilão Extrajudicial:</strong> Imóveis retomados por bancos (Caixa, BB, Bradesco), descontos de 30-50%.</li>
              <li><strong>Imóveis Caixa:</strong> Programa de venda direta com financiamento facilitado e uso do FGTS.</li>
            </ul>

            <div className="not-prose bg-gradient-to-r from-blue-50 to-amber-50 rounded-2xl border p-6 my-6">
              <p className="font-bold text-[#1B2B5B] mb-2">Bairros com mais oportunidades em leilão:</p>
              <div className="flex flex-wrap gap-2">
                {bairrosComLeilao.slice(0, 8).map(b => (
                  <Link
                    key={b.slug}
                    href={`/leilao-imoveis/${b.slug}-franca-sp`}
                    className="px-3 py-1.5 bg-white rounded-full text-sm text-[#1B2B5B] border hover:border-[#C9A84C] transition"
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed">
              O AgoraEncontrei oferece ferramentas profissionais para análise de investimento:
            </p>
            <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <Link
                href="/investor"
                className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition"
              >
                <p className="text-2xl mb-2">📊</p>
                <p className="font-bold text-sm text-[#1B2B5B]">Terminal de Investimento</p>
                <p className="text-xs text-gray-500 mt-1">DCF, VPL, TIR, Monte Carlo</p>
              </Link>
              <Link
                href="/avaliacao"
                className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition"
              >
                <p className="text-2xl mb-2">🏠</p>
                <p className="font-bold text-sm text-[#1B2B5B]">Avaliação de Imóvel</p>
                <p className="text-xs text-gray-500 mt-1">3 métodos + anomalia detection</p>
              </Link>
              <Link
                href="/sp/franca/investimentos/leilao-de-imoveis"
                className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition"
              >
                <p className="text-2xl mb-2">🏛️</p>
                <p className="font-bold text-sm text-[#1B2B5B]">Leilões em Franca</p>
                <p className="text-xs text-gray-500 mt-1">Judicial e extrajudicial</p>
              </Link>
            </div>
          </section>

          {/* Valorização */}
          <section id="valorizacao" className="mb-12">
            <h2 className="text-2xl font-bold text-[#1B2B5B] mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#C9A84C]" />
              Zonas de Valorização e Expansão
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Franca cresce principalmente nas direções sul e leste, com novos loteamentos
              e condomínios sendo lançados frequentemente. As zonas de expansão oferecem
              os melhores retornos para investidores de médio e longo prazo.
            </p>

            <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {bairrosExpansao.slice(0, 4).map(b => (
                <div key={b.slug} className="bg-green-50 rounded-xl border border-green-200 p-4">
                  <p className="font-bold text-green-800">{b.name}</p>
                  <p className="text-sm text-green-600 mt-1">{b.descricao}</p>
                  <p className="text-xs text-green-500 mt-2">
                    m² Venda: R$ {b.m2Venda.toLocaleString('pt-BR')} | {b.distanciaCentroKm} km do centro
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-12">
            <h2 className="text-2xl font-bold text-[#1B2B5B] mb-6">
              Perguntas Frequentes — Imóveis em Franca/SP
            </h2>
            <div className="not-prose space-y-3">
              {faqItems.map((item, i) => (
                <details key={i} className="group border rounded-xl bg-white">
                  <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-gray-800 group-open:text-[#1B2B5B]">
                    {item.q}
                    <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">&#9660;</span>
                  </summary>
                  <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Internal links hub */}
          <section className="not-prose bg-gray-50 rounded-2xl border p-6">
            <h2 className="text-lg font-bold text-[#1B2B5B] mb-4">Explore mais em Franca/SP</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {[
                ['/sp/franca/imoveis-a-venda', 'Imóveis à Venda'],
                ['/sp/franca/imoveis-para-alugar', 'Imóveis para Alugar'],
                ['/sp/franca/casas-a-venda', 'Casas à Venda'],
                ['/sp/franca/apartamentos-a-venda', 'Apartamentos à Venda'],
                ['/sp/franca/terrenos-a-venda', 'Terrenos à Venda'],
                ['/sp/franca/condominios-fechados', 'Condomínios Fechados'],
                ['/sp/franca/lancamentos-imobiliarios', 'Lançamentos'],
                ['/sp/franca/investimentos/leilao-de-imoveis', 'Leilões de Imóveis'],
                ['/sp/franca/investimentos/imoveis-caixa', 'Imóveis Caixa'],
                ['/sp/franca/servicos/arquiteto', 'Arquitetos'],
                ['/sp/franca/servicos/avaliacao-de-imovel', 'Avaliação de Imóvel'],
                ['/bairros/franca', 'Bairros de Franca'],
                ['/investor', 'Terminal de Investimento'],
                ['/avaliacao', 'Avaliar Imóvel'],
                ['/custo-de-vida/franca-sp', 'Custo de Vida em Franca'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-2 bg-white rounded-lg border text-[#1B2B5B] hover:border-[#C9A84C] transition"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 text-center sm:text-left">
            Procurando imóveis em <strong>Franca/SP</strong>?
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href="https://wa.me/5516999999999?text=Olá! Vi o guia de Franca no AgoraEncontrei"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-white text-center"
              style={{ background: '#25D366' }}
            >
              WhatsApp
            </a>
            <Link
              href="/imoveis?city=Franca"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-center"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Ver Marketplace
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
