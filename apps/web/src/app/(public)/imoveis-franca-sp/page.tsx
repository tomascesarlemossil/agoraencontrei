import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Search, TrendingUp, Building2, Users, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Imóveis em Franca/SP — Casas, Apartamentos, Terrenos e Leilões | AgoraEncontrei',
  description: 'Encontre imóveis em Franca/SP. 352 mil habitantes (IBGE 2022), 20ª maior cidade de SP. Casas, apartamentos, terrenos, leilões e investimentos. Capital do Calçado com infraestrutura completa e 97% de saneamento. Marketplace AgoraEncontrei.',
  keywords: [
    'imóveis franca sp', 'imóveis à venda franca sp', 'casas franca sp', 'apartamentos franca sp',
    'terrenos franca sp', 'leilão imóveis franca sp', 'imobiliária franca sp', 'aluguel franca sp',
    'investimento imobiliário franca sp', 'condomínio fechado franca sp', 'loteamento franca sp',
    'imóveis capital do calçado', 'comprar imóvel franca sp 2026',
  ],
  openGraph: {
    title: 'Imóveis em Franca/SP | AgoraEncontrei — Marketplace Imobiliário',
    description: 'Casas, apartamentos, terrenos e leilões em Franca/SP. 352 mil habitantes, PIB per capita R$ 40.777. Oportunidades reais no marketplace AgoraEncontrei.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/imoveis-franca-sp' },
  robots: { index: true, follow: true },
}

const SCHEMA_WEBPAGE = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Imóveis em Franca/SP — AgoraEncontrei',
  description: 'Marketplace imobiliário com imóveis à venda, para alugar e em leilão em Franca/SP. Dados do IBGE: 352.536 habitantes, PIB per capita R$ 40.777,87.',
  url: 'https://www.agoraencontrei.com.br/imoveis-franca-sp',
  inLanguage: 'pt-BR',
  about: {
    '@type': 'City',
    name: 'Franca',
    addressRegion: 'SP',
    addressCountry: 'BR',
    population: 352536,
  },
  provider: {
    '@type': 'Organization',
    name: 'AgoraEncontrei',
    url: 'https://www.agoraencontrei.com.br',
  },
}

const BAIRROS_DESTAQUE = [
  'Jardim Califórnia', 'Jardim Europa', 'Centro', 'Vila Lemos',
  'Jardim Paulista', 'Parque Universitário', 'Jardim América', 'Residencial Florença',
  'Jardim Piratininga', 'Vila Totoli', 'Jardim Aeroporto', 'Vila Real',
  'Residencial Zanetti', 'City Petrópolis', 'Jardim Noêmia', 'Jardim Lima',
]

const CIDADES_REGIAO = [
  { nome: 'Batatais', slug: '/imoveis-batatais-sp', dist: '60km', pop: '62 mil' },
  { nome: 'Brodowski', slug: '/imoveis-brodowski-sp', dist: '70km', pop: '24 mil' },
  { nome: 'Cristais Paulista', slug: '/imoveis-cristais-paulista-sp', dist: '30km', pop: '8 mil' },
  { nome: 'Pedregulho', slug: '/imoveis-pedregulho-sp', dist: '50km', pop: '16 mil' },
  { nome: 'Patrocínio Paulista', slug: '/imoveis-patrocinio-paulista-sp', dist: '35km', pop: '14 mil' },
  { nome: 'Altinópolis', slug: '/imoveis-altinopolis-sp', dist: '80km', pop: '16 mil' },
  { nome: 'Rifaina', slug: '/imoveis-rifaina-sp', dist: '55km', pop: '4 mil' },
  { nome: 'Itirapuã', slug: '/imoveis-itirapua-sp', dist: '40km', pop: '6 mil' },
  { nome: 'Restinga', slug: '/imoveis-restinga-sp', dist: '45km', pop: '7 mil' },
  { nome: 'Jeriquara', slug: '/imoveis-jeriquara-sp', dist: '25km', pop: '3,5 mil' },
]

const LINKS_INTERNOS = [
  { href: '/casas-a-venda-franca-sp', label: 'Casas à Venda em Franca', icon: '🏠' },
  { href: '/apartamentos-a-venda-franca-sp', label: 'Apartamentos à Venda', icon: '🏢' },
  { href: '/terrenos-a-venda-franca-sp', label: 'Terrenos à Venda', icon: '📐' },
  { href: '/casas-para-alugar-franca-sp', label: 'Casas para Alugar', icon: '🔑' },
  { href: '/apartamentos-para-alugar-franca-sp', label: 'Apartamentos para Alugar', icon: '🏨' },
  { href: '/leilao-imoveis-franca-sp', label: 'Leilão de Imóveis — Caixa', icon: '🏷️' },
  { href: '/condominio-fechado-franca-sp', label: 'Condomínios Fechados', icon: '🏘️' },
  { href: '/chacaras-e-sitios-franca-sp', label: 'Chácaras e Sítios', icon: '🌳' },
  { href: '/imoveis-comerciais-franca-sp', label: 'Imóveis Comerciais', icon: '🏭' },
  { href: '/investimento-imobiliario-franca-sp', label: 'Investimento Imobiliário', icon: '💰' },
  { href: '/financiamento-imovel-franca-sp', label: 'Financiamento Imobiliário', icon: '🏦' },
  { href: '/avaliacao-imoveis-franca-sp', label: 'Avaliação de Imóvel', icon: '📊' },
]

export default function ImoveisFrancaSPPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_WEBPAGE) }} />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> Franca/SP · 352 mil hab. · Capital do Calçado
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis em Franca/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            Casas, apartamentos, terrenos, leilões e oportunidades de investimento em Franca — a 20ª maior cidade de São Paulo. Marketplace AgoraEncontrei.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?city=Franca"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Imóveis em Franca
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Tenho interesse em imóveis em Franca/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Falar com Corretor
            </a>
          </div>

          {/* Stats IBGE */}
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>352.536</div>
              <div className="text-white/60">habitantes (IBGE 2022)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>R$ 40.777</div>
              <div className="text-white/60">PIB per capita</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>126.557</div>
              <div className="text-white/60">empregos formais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>97,7%</div>
              <div className="text-white/60">saneamento</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTEÚDO SEO PRINCIPAL ── */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border space-y-6">

          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Oportunidades de Imóveis em Franca: Panorama Atual
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Franca consolida-se em 2026 como um dos mercados imobiliários mais promissores do interior paulista. Com população estimada
            em <strong>365.494 habitantes</strong> segundo projeções do IBGE para 2025 e um <strong>PIB per capita de R$ 40.777,87</strong>,
            a cidade atravessa um momento de forte dinamismo econômico. O polo calçadista — que rendeu a Franca o título de Capital Nacional
            do Calçado Masculino — segue sendo o motor industrial da região, mas a diversificação econômica avança: novos empreendimentos
            residenciais e comerciais ganham corpo em bairros como <strong>Jardim Califórnia</strong>, <strong>Residencial Florença</strong>
            e <strong>City Petrópolis</strong>, impulsionados pela estabilidade do mercado local. A presença de mais de <strong>126 mil postos
            de trabalho formal</strong> sustenta uma demanda sólida por moradia, locação e investimento, enquanto o setor de leilões de imóveis
            na região cresce com editais frequentes da Caixa Econômica Federal, oferecendo descontos de até 40% sobre o valor de avaliação.
            Para quem busca terrenos, chácaras ou imóveis rurais, as cidades vizinhas — como Cristais Paulista (30km), Jeriquara (25km) e
            Pedregulho (50km) — oferecem alternativas ainda mais acessíveis, com valorização crescente por estarem na zona de influência direta de Franca.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">Por que investir em Franca?</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Franca reúne fundamentos que poucas cidades de porte médio no Brasil conseguem igualar. Com <strong>97,74% de esgotamento sanitário
            adequado</strong> — a 48ª melhor taxa do país e superior a muitas capitais —, a cidade entrega infraestrutura urbana de primeiro nível.
            A área urbanizada de <strong>82,34 km²</strong> conta com pavimentação consolidada, rede hospitalar completa (Santa Casa, Hospital Regional
            e clínicas especializadas), três universidades (Uni-FACEF, UNIFRAN e Unesp em articulação regional), e um comércio robusto no Centro e nos
            eixos viários da Avenida Champagnat e Major Nicácio. A taxa de escolarização de <strong>98,98%</strong> entre 6 e 14 anos e o IDEB de
            <strong> 7,0 nos anos iniciais</strong> colocam Franca entre as melhores cidades paulistas em educação. Do ponto de vista imobiliário, a
            combinação de terrenos acessíveis nos bairros em expansão (Jardim Piratininga, Vila Totoli, Parque Universitário) com condomínios de alto
            padrão (Residencial Florença, Zanetti, Village Damha) torna Franca atrativa tanto para quem busca a primeira casa quanto para investidores
            focados em renda com aluguel. O salário médio formal de <strong>2,2 salários mínimos</strong> e a forte base de comércio e serviços garantem
            liquidez constante para locação, com taxas de vacância historicamente baixas nos bairros centrais.
          </p>

          <blockquote className="border-l-4 pl-4 py-2 bg-amber-50 rounded-r-lg text-sm text-amber-800" style={{ borderColor: '#C9A84C' }}>
            <strong>Nota:</strong> O mercado de leilões e imóveis em SP está em constante atualização. Fique atento às datas de editais. Novos
            leilões da Caixa Econômica Federal são publicados periodicamente com imóveis em Franca e toda a região.
          </blockquote>

          {/* Dados IBGE em cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {[
              { icon: <Users className="w-4 h-4" />, label: 'População', value: '352.536', sub: 'Censo IBGE 2022' },
              { icon: <BarChart3 className="w-4 h-4" />, label: 'PIB per capita', value: 'R$ 40.777', sub: 'IBGE 2023' },
              { icon: <Building2 className="w-4 h-4" />, label: 'Área urbana', value: '82,34 km²', sub: '12ª do estado' },
              { icon: <TrendingUp className="w-4 h-4" />, label: 'Empregos', value: '126.557', sub: '18º do estado' },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                  {stat.icon} {stat.label}
                </div>
                <div className="text-base font-bold" style={{ color: '#1B2B5B' }}>{stat.value}</div>
                <div className="text-[10px] text-gray-400">{stat.sub}</div>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-gray-800 mb-2 pt-2">Infraestrutura e qualidade de vida</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            A densidade demográfica de <strong>582 habitantes por km²</strong> indica uma urbanização equilibrada, sem os problemas de
            superlotação típicos de grandes metrópoles. Franca ocupa a <strong>75ª posição nacional em população</strong>, mas se destaca acima
            da média em indicadores de qualidade de vida: saneamento (48ª no país), escolarização e urbanização de vias públicas (277ª, com
            56,7% de vias com bueiro, calçada, pavimentação e meio-fio). O acesso rodoviário pela SP-334 (Rodovia Cândido Portinari) conecta
            Franca a Ribeirão Preto (90km), e o aeroporto municipal recebe voos regionais. Para quem busca imóveis na região, Franca funciona
            como polo centralizador: é a maior cidade da sua região geográfica imediata, concentrando serviços de saúde, educação, comércio
            e judiciário que atendem também Batatais, Pedregulho, Patrocínio Paulista, Rifaina e mais 6 municípios vizinhos.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">Mercado imobiliário em Franca: o que esperar em 2026</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            O crescimento populacional projetado — de 352 mil para 365 mil habitantes entre 2022 e 2025 — mantém a pressão de demanda sobre
            o mercado residencial. Novos loteamentos nas regiões norte e leste da cidade expandem a malha urbana, enquanto o Centro e bairros
            tradicionais como Vila Lemos e Jardim Paulista concentram valorização por oferta limitada de terrenos. O setor de leilões segue
            como porta de entrada para investidores: imóveis retomados pela Caixa frequentemente aparecem com descontos expressivos,
            especialmente em apartamentos e casas nos bairros periféricos. Para locação, o público universitário (Uni-FACEF, UNIFRAN) e
            profissionais do polo calçadista mantêm demanda constante por kitinets e apartamentos de 1-2 quartos nos arredores do Centro.
          </p>

          {/* CTA de fechamento */}
          <p className="text-gray-600 text-sm leading-relaxed pt-2 border-t">
            Para conferir a lista completa e atualizada de oportunidades reais agora mesmo,{' '}
            <a href="https://agoraencontrei.com.br" className="font-semibold underline" style={{ color: '#1B2B5B' }}>
              acesse nossa vitrine principal no marketplace AgoraEncontrei
            </a>.
            Lá você filtra por preço, tipo de imóvel e status do leilão em tempo real.
          </p>
        </div>
      </section>

      {/* ── BAIRROS DE FRANCA ── */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Imóveis por Bairro em Franca/SP
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {BAIRROS_DESTAQUE.map(bairro => {
            const slug = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            return (
              <Link key={bairro} href={`/imoveis/em/franca/${slug}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all text-sm text-gray-700 hover:text-[#1B2B5B]">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                {bairro}
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── LINKS INTERNOS — TIPOS DE IMÓVEL ── */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Explore Imóveis em Franca/SP
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LINKS_INTERNOS.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-sm text-gray-800">{item.label}</span>
              <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── CIDADES DA REGIÃO ── */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Imóveis na Região de Franca/SP
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CIDADES_REGIAO.map((cidade) => (
            <Link key={cidade.slug} href={cidade.slug}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
              <div>
                <span className="font-semibold text-sm text-gray-800">{cidade.nome}/SP</span>
                <span className="block text-xs text-gray-400">{cidade.dist} de Franca · {cidade.pop} hab.</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            AgoraEncontrei — Marketplace Imobiliário
          </h2>
          <p className="text-white/70 mb-5">Imóveis em Franca e toda a região · Leilões, venda e locação</p>
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
              <Home className="w-4 h-4" /> Ver Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* ── FLOATING CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B5B] p-3 text-white text-center font-bold text-sm shadow-2xl sm:hidden">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Search className="w-4 h-4" style={{ color: '#C9A84C' }} />
          Procurando oportunidades em Franca?
          <span className="underline ml-1" style={{ color: '#C9A84C' }}>VER LISTA NO MARKETPLACE</span>
        </Link>
      </div>
    </>
  )
}
