/**
 * Rota: /{estado}/{cidade}/servicos/{cluster}
 * Páginas de fornecedores/serviços (arquiteto, engenheiro, pedreiro, etc.)
 * Ex: /sp/franca/servicos/arquiteto
 *     /go/anapolis/servicos/engenheiro-civil
 * ISR: revalidate 86400
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Search, Star } from 'lucide-react'
import { IBGE_CITY_BY_SLUG, IBGE_CITIES_152, getIbgeCitySnippet } from '@/data/seo-ibge-cities-expanded'
import { limitSeoStaticItems } from '@/lib/ssg-runtime'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://agoraencontrei.com.br'

const SERVICOS: Record<string, { label: string; desc: string; icon: string; faq: string[] }> = {
  'arquiteto':              { label: 'Arquiteto',              icon: '📐', desc: 'Encontre arquitetos qualificados em {cidade} para projetos residenciais, comerciais e interiores.',  faq: ['Quanto custa um arquiteto em {cidade}?', 'Como contratar um arquiteto?', 'O que faz um arquiteto?'] },
  'engenheiro-civil':       { label: 'Engenheiro Civil',       icon: '🏗️', desc: 'Engenheiros civis em {cidade} para projetos estruturais, laudos e acompanhamento de obras.',        faq: ['Quanto custa um engenheiro civil?', 'Quando preciso de engenheiro?', 'Diferença entre arquiteto e engenheiro'] },
  'pedreiro':               { label: 'Pedreiro',               icon: '🧱', desc: 'Pedreiros experientes em {cidade} para construção, reforma e acabamento.',                           faq: ['Quanto custa um pedreiro em {cidade}?', 'Como contratar pedreiro?', 'Pedreiro por empreitada ou diária?'] },
  'empreiteira':            { label: 'Empreiteira',            icon: '🏚️', desc: 'Empreiteiras em {cidade} para obras completas, reformas e construções.',                             faq: ['Como escolher empreiteira?', 'Contrato com empreiteira', 'Empreiteira vs construção própria'] },
  'construtora':            { label: 'Construtora',            icon: '🏢', desc: 'Construtoras em {cidade} para construção de casas, prédios e empreendimentos.',                      faq: ['Como escolher construtora?', 'Garantia de construtora', 'Construtora vs empreiteira'] },
  'avaliacao-de-imovel':    { label: 'Avaliação de Imóvel',    icon: '📊', desc: 'Avaliação profissional de imóveis em {cidade}. Laudos PTAM e pareceres técnicos.',                  faq: ['Quanto custa avaliação de imóvel?', 'Para que serve avaliação?', 'Quem pode avaliar imóvel?'] },
  'vistoria-de-imovel':     { label: 'Vistoria de Imóvel',     icon: '🔍', desc: 'Vistoria técnica de imóveis em {cidade} para compra, venda e locação.',                              faq: ['O que é vistoria de imóvel?', 'Quando fazer vistoria?', 'Quanto custa vistoria?'] },
  'topografia':             { label: 'Topografia',             icon: '🗺️', desc: 'Serviços de topografia em {cidade} para levantamentos, georreferenciamento e demarcação.',           faq: ['O que é topografia?', 'Quando preciso de topógrafo?', 'Quanto custa topografia?'] },
  'regularizacao-de-imovel':{ label: 'Regularização de Imóvel',icon: '📋', desc: 'Regularização de imóveis em {cidade}. Habite-se, escritura e registro.',                            faq: ['Como regularizar imóvel?', 'O que é habite-se?', 'Quanto custa regularização?'] },
  'fotografia-de-imovel':   { label: 'Fotografia de Imóvel',   icon: '📸', desc: 'Fotografia profissional de imóveis em {cidade} para venda e aluguel.',                               faq: ['Importância da fotografia?', 'Quanto custa foto profissional?', 'Drone para imóveis'] },
  'drone':                  { label: 'Drone para Imóveis',     icon: '🚁', desc: 'Filmagem e fotografia com drone em {cidade} para imóveis, obras e terrenos.',                        faq: ['Quanto custa drone?', 'Drone é obrigatório?', 'Vantagens do drone'] },
  'decoracao-de-interiores':{ label: 'Decoração de Interiores',icon: '🛋️', desc: 'Decoradores de interiores em {cidade} para projetos residenciais e comerciais.',                     faq: ['Quanto custa decorador?', 'Arquiteto vs decorador?', 'Como decorar sem gastar muito?'] },

  // ── Grupo E — Avaliação & Inteligência de Preço ──────────────────────────
  'avaliacao-online-de-imovel': { label: 'Avaliação Online de Imóvel', icon: '💻', desc: 'Avaliação online e gratuita de imóveis em {cidade} com inteligência artificial e dados reais de mercado.', faq: ['Como avaliar meu imóvel online em {cidade}?', 'A avaliação online é confiável?', 'Quanto tempo leva a avaliação?'] },
  'quanto-vale-meu-imovel':     { label: 'Quanto Vale Meu Imóvel',     icon: '💰', desc: 'Descubra quanto vale seu imóvel em {cidade} com avaliação por IA baseada em preços reais da região.', faq: ['Como saber quanto vale meu imóvel em {cidade}?', 'O que influencia o valor?', 'A avaliação é grátis?'] },
  'preco-do-metro-quadrado':    { label: 'Preço do Metro Quadrado',    icon: '📈', desc: 'Preço do metro quadrado em {cidade} atualizado, por bairro e tipo de imóvel.', faq: ['Qual o preço do m² em {cidade}?', 'O m² varia por bairro?', 'Como o m² é calculado?'] },

  // ── Grupo E — Imagens, Mídia & IA Visual ─────────────────────────────────
  'fotos-de-imovel-com-ia':     { label: 'Fotos de Imóvel com IA',     icon: '🤖', desc: 'Fotos profissionais de imóveis em {cidade} aprimoradas com inteligência artificial: luz, céu e qualidade.', faq: ['Como funciona a foto com IA em {cidade}?', 'Quanto custa?', 'A foto com IA vende mais rápido?'] },
  'tour-virtual-360':           { label: 'Tour Virtual 360°',          icon: '🕶️', desc: 'Tour virtual 360° de imóveis em {cidade}. Visita imersiva online a qualquer hora.', faq: ['O que é tour virtual 360° em {cidade}?', 'Como criar um tour 360°?', 'Tour virtual aumenta visitas?'] },
  'home-staging-virtual':       { label: 'Home Staging Virtual',       icon: '🛋️', desc: 'Home staging virtual em {cidade}: ambientes mobiliados digitalmente por IA para valorizar o anúncio.', faq: ['O que é home staging virtual?', 'Quanto custa em {cidade}?', 'Vale a pena mobiliar virtualmente?'] },
  'video-com-drone':            { label: 'Vídeo com Drone',            icon: '🚁', desc: 'Vídeo e fotografia aérea com drone para imóveis, terrenos e obras em {cidade}.', faq: ['Quanto custa vídeo com drone em {cidade}?', 'Preciso de autorização?', 'Drone vale a pena para imóveis?'] },
  'planta-humanizada':          { label: 'Planta Humanizada',          icon: '📐', desc: 'Plantas humanizadas e renders 3D de imóveis em {cidade} para venda na planta.', faq: ['O que é planta humanizada?', 'Quanto custa em {cidade}?', 'Ajuda a vender na planta?'] },

  // ── Grupo E — Anúncio, Portais & Captação ────────────────────────────────
  'anuncio-de-imovel-com-ia':   { label: 'Anúncio de Imóvel com IA',   icon: '📝', desc: 'Crie anúncios de imóveis em {cidade} com textos otimizados por inteligência artificial para vender mais.', faq: ['Como criar anúncio com IA em {cidade}?', 'O texto da IA é único?', 'Anúncio com IA ranqueia melhor?'] },
  'divulgar-imovel-nos-portais':{ label: 'Divulgar Imóvel nos Portais',icon: '📡', desc: 'Divulgue seu imóvel em {cidade} em todos os portais (ZAP, VivaReal, OLX, Facebook) com um clique.', faq: ['Em quais portais meu imóvel aparece?', 'Quanto custa divulgar em {cidade}?', 'É automático?'] },
  'anunciar-imovel-gratis':     { label: 'Anunciar Imóvel Grátis',     icon: '📢', desc: 'Anuncie seu imóvel em {cidade} gratuitamente no AgoraEncontrei e alcance milhares de compradores.', faq: ['Como anunciar imóvel grátis em {cidade}?', 'Tem limite de anúncios?', 'Preciso ser corretor?'] },
  'captacao-de-imoveis':        { label: 'Captação de Imóveis',        icon: '🎯', desc: 'Captação de imóveis para venda e locação em {cidade}. Ferramentas e parceria para corretores.', faq: ['Como captar imóveis em {cidade}?', 'Como funciona a parceria?', 'Quanto ganho por captação?'] },

  // ── Grupo E — CRM, Automação & IA de Atendimento ─────────────────────────
  'crm-imobiliario':            { label: 'CRM Imobiliário',            icon: '🗂️', desc: 'CRM imobiliário completo para corretores e imobiliárias em {cidade}. Leads, funil e automações em um só lugar.', faq: ['O que é CRM imobiliário?', 'Quanto custa em {cidade}?', 'Funciona para corretor autônomo?'] },
  'automacao-de-leads':         { label: 'Automação de Leads',         icon: '⚙️', desc: 'Automação de leads imobiliários em {cidade}: captura, distribuição e follow-up automático 24h.', faq: ['Como automatizar leads em {cidade}?', 'Reduz o tempo de resposta?', 'Integra com WhatsApp?'] },
  'atendimento-com-ia':         { label: 'Atendimento com IA',         icon: '🤖', desc: 'Atendimento com IA (assistente Tomás) para imobiliárias em {cidade}. Responde e qualifica leads 24 horas.', faq: ['Como funciona o atendimento com IA?', 'A IA fecha negócio em {cidade}?', 'Atende no WhatsApp?'] },
  'whatsapp-imobiliario':       { label: 'WhatsApp Imobiliário',       icon: '💬', desc: 'WhatsApp imobiliário automático em {cidade}: respostas, agendamentos e disparos para sua carteira.', faq: ['Como automatizar o WhatsApp em {cidade}?', 'É a API oficial da Meta?', 'Posso disparar para minha base?'] },
  'funil-de-vendas-imobiliario':{ label: 'Funil de Vendas Imobiliário',icon: '📊', desc: 'Funil de vendas imobiliário em {cidade} com etapas, automações e IA para converter mais leads.', faq: ['O que é funil de vendas imobiliário?', 'Como montar em {cidade}?', 'Aumenta a conversão?'] },
  'lead-scoring':               { label: 'Lead Scoring com IA',        icon: '🎯', desc: 'Lead scoring com IA em {cidade}: a inteligência artificial prioriza os leads mais quentes da sua carteira.', faq: ['O que é lead scoring?', 'Como a IA pontua leads em {cidade}?', 'Vale a pena?'] },

  // ── Grupo E — Gestão de Locação & Financeiro ─────────────────────────────
  'software-para-imobiliaria':  { label: 'Software para Imobiliária',  icon: '💻', desc: 'Software completo para imobiliárias em {cidade}: CRM, financeiro, locação, contratos e portais.', faq: ['Qual o melhor software para imobiliária em {cidade}?', 'Quanto custa?', 'Tem teste grátis?'] },
  'gestao-de-aluguel':          { label: 'Gestão de Aluguel',          icon: '🔑', desc: 'Sistema de gestão de aluguel em {cidade}: contratos, boletos, repasses e reajustes automáticos.', faq: ['Como gerenciar aluguéis em {cidade}?', 'Emite boleto e repasse?', 'Calcula reajuste automático?'] },
  'gestao-de-locacao':          { label: 'Gestão de Carteira de Locação', icon: '📁', desc: 'Gestão de carteira de locação em {cidade}: proprietários, inquilinos, IPTU, seguros e rescisões.', faq: ['Como administrar carteira de locação em {cidade}?', 'Controla IPTU e seguro?', 'Quanto custa?'] },
  'repasse-ao-proprietario':    { label: 'Repasse ao Proprietário',    icon: '💸', desc: 'Repasse automático ao proprietário em {cidade}: cálculo de comissão, descontos e extrato mensal.', faq: ['Como funciona o repasse ao proprietário?', 'É automático em {cidade}?', 'Gera extrato?'] },
  'cobranca-de-aluguel':        { label: 'Cobrança de Aluguel',        icon: '🧾', desc: 'Cobrança de aluguel por boleto em {cidade}: emissão automática, régua de cobrança e baixa automática.', faq: ['Como cobrar aluguel por boleto em {cidade}?', 'Tem cobrança automática?', 'Qual a taxa do boleto?'] },
  'contrato-digital':           { label: 'Contrato Digital',           icon: '✍️', desc: 'Contrato digital com assinatura eletrônica em {cidade}. Validade jurídica via Clicksign.', faq: ['Contrato digital tem validade jurídica?', 'Como assinar em {cidade}?', 'Quanto custa por contrato?'] },
  'administracao-de-imoveis':   { label: 'Administração de Imóveis',   icon: '🏢', desc: 'Administração de imóveis em {cidade} para proprietários: locação, manutenção, cobrança e repasse.', faq: ['Quanto custa administrar um imóvel em {cidade}?', 'O que está incluso?', 'Vale a pena terceirizar?'] },

  // ── Grupo E — Planos, Assinaturas & Parceiros ────────────────────────────
  'plano-para-corretor':        { label: 'Plano para Corretor',        icon: '🎖️', desc: 'Planos para corretores de imóveis em {cidade}: anúncios, CRM, IA e divulgação nos portais.', faq: ['Qual o melhor plano para corretor em {cidade}?', 'Quanto custa?', 'Tem plano gratuito?'] },
  'assinatura-corretor':        { label: 'Assinatura Corretor Autônomo', icon: '📨', desc: 'Assinatura para o corretor autônomo em {cidade}: tudo para vender mais sem depender de imobiliária.', faq: ['Vale a pena para corretor autônomo em {cidade}?', 'O que vem na assinatura?', 'Posso cancelar quando quiser?'] },
  'plano-para-imobiliaria':     { label: 'Plano para Imobiliária',     icon: '🏢', desc: 'Planos para imobiliárias em {cidade}: equipe, carteira de locação, financeiro e portais integrados.', faq: ['Qual plano para imobiliária em {cidade}?', 'Quantos usuários inclui?', 'Migra meus dados?'] },
  'site-para-corretor':         { label: 'Site para Corretor',         icon: '🌐', desc: 'Site profissional para corretor de imóveis em {cidade} com domínio próprio, vitrine e IA.', faq: ['Como ter um site de corretor em {cidade}?', 'Tem domínio próprio?', 'Quanto custa?'] },
  'programa-de-afiliados':      { label: 'Programa de Afiliados',      icon: '🤝', desc: 'Programa de afiliados imobiliário em {cidade}: indique e ganhe comissão recorrente.', faq: ['Como ser afiliado em {cidade}?', 'Quanto ganho por indicação?', 'A comissão é recorrente?'] },
  'seja-um-parceiro':           { label: 'Seja um Parceiro',           icon: '🤝', desc: 'Seja um parceiro AgoraEncontrei em {cidade}: tecnologia, leads e suporte para crescer suas vendas.', faq: ['Como ser parceiro em {cidade}?', 'Quais os benefícios?', 'Tem custo de adesão?'] },
}

export async function generateStaticParams() {
  const params: { estado: string; cidade: string; cluster: string }[] = []
  const cities = limitSeoStaticItems(
    [...IBGE_CITIES_152].sort((a, b) => b.populacao - a.populacao),
    'SEO_STATIC_SERVICE_CITY_LIMIT',
    10
  )
  const services = limitSeoStaticItems(
    Object.keys(SERVICOS),
    'SEO_STATIC_SERVICE_LIMIT',
    8
  )
  for (const city of cities) {
    for (const cluster of services) {
      params.push({ estado: city.stateSlug, cidade: city.slug, cluster })
    }
  }
  return params
}

export async function generateMetadata(props: { params: Promise<{ estado: string; cidade: string; cluster: string }> }): Promise<Metadata> {
  const params = await props.params
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) return {}
  const servico = SERVICOS[params.cluster]
  if (!servico) return {}

  const label = servico.label
  const desc = servico.desc.replace(/\{cidade\}/g, city.name)

  return {
    title: `${label} em ${city.name}/${city.state} | AgoraEncontrei`,
    description: desc,
    openGraph: {
      title: `${label} em ${city.name}/${city.state} | AgoraEncontrei`,
      description: desc,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/${params.estado}/${params.cidade}/servicos/${params.cluster}`,
    },
  }
}

export const revalidate = 86400

export default async function ServicoCidadePage(props: { params: Promise<{ estado: string; cidade: string; cluster: string }> }) {
  const params = await props.params
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) notFound()
  const servico = SERVICOS[params.cluster]
  if (!servico) notFound()

  const label = servico.label
  const desc = servico.desc.replace(/\{cidade\}/g, city.name)
  const faq = servico.faq.map(q => q.replace(/\{cidade\}/g, city.name))
  const pop = city.populacao.toLocaleString('pt-BR')
  const pib = city.pibPerCapita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${label} em ${city.name}/${city.state}`,
    url: `${WEB_URL}/${params.estado}/${params.cidade}/servicos/${params.cluster}`,
    description: desc,
    areaServed: { '@type': 'City', name: city.name },
    provider: { '@type': 'Organization', name: 'AgoraEncontrei', url: WEB_URL },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(q => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Encontre ${label.toLowerCase()} em ${city.name} no AgoraEncontrei. ${desc}`,
      },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#143A1F] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/${params.estado}/${params.cidade}`} className="hover:text-white">{city.name}/{city.state}</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Serviços</span>
            <ChevronRight className="w-3 h-3" />
            <span>{label}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="text-3xl mr-2">{servico.icon}</span>
            {label} em <span style={{ color: '#C9A84C' }}>{city.name}/{city.state}</span>
          </h1>
          <p className="text-white/70 text-lg mb-6">{desc}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/seja-parceiro"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#143A1F' }}
            >
              <Star className="w-4 h-4" /> Seja um Parceiro
            </Link>
            <Link
              href={`/${params.estado}/${params.cidade}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20"
            >
              Ver {city.name}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Dados IBGE contextuais */}
        <section className="bg-gray-50 rounded-2xl border p-6">
          <h2 className="text-lg font-bold text-[#143A1F] mb-3">
            Mercado de {label} em {city.name}/{city.state}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {city.name} é um município com <strong>{pop} habitantes</strong> e
            PIB per capita de <strong>{pib}</strong>, o que representa um
            mercado robusto para serviços de {label.toLowerCase()}. A demanda
            por profissionais qualificados cresce junto com o desenvolvimento
            imobiliário da cidade.
          </p>
        </section>

        {/* FAQ com Schema */}
        <section>
          <h2 className="text-xl font-bold text-[#143A1F] mb-5">
            Perguntas Frequentes sobre {label} em {city.name}
          </h2>
          <div className="space-y-4">
            {faq.map((q, i) => (
              <div key={i} className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-800 mb-2">{q}</h3>
                <p className="text-sm text-gray-600">
                  Encontre {label.toLowerCase()} em {city.name} no AgoraEncontrei.
                  Conectamos você aos melhores profissionais da região com
                  avaliações verificadas e orçamentos gratuitos.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Outros serviços */}
        <section>
          <h2 className="text-lg font-bold text-[#143A1F] mb-4">
            Outros Serviços em {city.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(SERVICOS)
              .filter(([k]) => k !== params.cluster)
              .slice(0, 8)
              .map(([k, v]) => (
                <Link
                  key={k}
                  href={`/${params.estado}/${params.cidade}/servicos/${k}`}
                  className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition"
                >
                  <span className="text-xl">{v.icon}</span>
                  <p className="text-xs text-gray-700 mt-1 font-medium">{v.label}</p>
                </Link>
              ))}
          </div>
        </section>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 text-center sm:text-left">
            {servico.icon} Precisa de <strong>{label}</strong> em <strong>{city.name}</strong>?
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/5516999999999?text=Olá! Preciso de ${label.toLowerCase()} em ${city.name}/${city.state}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-white text-center"
              style={{ background: '#25D366' }}
            >
              WhatsApp
            </a>
            <Link
              href="/seja-parceiro"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-center"
              style={{ background: '#C9A84C', color: '#143A1F' }}
            >
              Seja Parceiro
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
