import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, Home, Award, Shield, Eye, Heart, Building2, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre Nós | Imobiliária Lemos — Franca/SP',
  description:
    'Conheça a Imobiliária Lemos, fundada em 2002 em Franca/SP por Noêmia Pires Lemos. Mais de 20 anos de experiência, 1.000+ imóveis administrados e equipe de 10+ profissionais. CRECI 279051.',
  keywords: [
    'Imobiliária Lemos',
    'sobre nós',
    'Franca SP',
    'CRECI 279051',
    'Noêmia Pires Lemos',
    'imobiliária Franca',
    'história imobiliária',
  ],
  openGraph: {
    title: 'Sobre Nós | Imobiliária Lemos — Franca/SP',
    description:
      'Fundada em 2002, a Imobiliária Lemos é referência em Franca/SP com mais de 1.000 imóveis administrados.',
    type: 'website',
    locale: 'pt_BR',
  },
}

const VALUES = [
  {
    icon: Shield,
    title: 'Confiança',
    description:
      'Construímos relações sólidas e duradouras com nossos clientes, baseadas em honestidade e compromisso.',
  },
  {
    icon: Eye,
    title: 'Transparência',
    description:
      'Todas as informações são compartilhadas de forma clara, desde a documentação até os valores envolvidos.',
  },
  {
    icon: Award,
    title: 'Profissionalismo',
    description:
      'Nossa equipe é capacitada e atualizada, garantindo um atendimento de excelência em cada negociação.',
  },
]

const STATS = [
  { value: '20+', label: 'Anos de experiência' },
  { value: '1.000+', label: 'Imóveis administrados' },
  { value: '10+', label: 'Profissionais na equipe' },
  { value: '2002', label: 'Ano de fundação' },
]

export default function SobrePage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
      {/* Hero */}
      <section
        className="py-20 text-white text-center"
        style={{
          background:
            'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#C9A84C' }}
          >
            Imobiliária Lemos — Franca/SP
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Sobre Nós
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Desde 2002 ajudando famílias a encontrar o lar ideal em Franca e
            região, com confiança, transparência e profissionalismo.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-600 transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-gray-600 font-medium">Sobre</span>
        </nav>
      </div>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl shadow-md p-6 text-center border"
              style={{ borderColor: '#ddd9d0' }}
            >
              <p
                className="text-3xl font-bold"
                style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}
              >
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* History */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#C9A84C' }}
            >
              Nossa História
            </p>
            <h2
              className="text-3xl font-bold mb-6"
              style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
            >
              Mais de duas décadas dedicadas ao mercado imobiliário
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                A <strong>Imobiliária Lemos</strong> foi fundada em{' '}
                <strong>2002</strong> na cidade de <strong>Franca/SP</strong> por{' '}
                <strong>Noêmia Pires Lemos</strong>, profissional com mais de 20
                anos de experiência no mercado imobiliário, registrada no{' '}
                <strong>CRECI sob o número 279051</strong>.
              </p>
              <p>
                Com visão empreendedora e um profundo conhecimento do mercado
                local, Noêmia construiu uma empresa sólida, reconhecida pela
                qualidade no atendimento e pelo compromisso com cada cliente.
              </p>
              <p>
                Ao lado de <strong>Nilton Lemos</strong>, co-fundador responsável
                pelas áreas de construção, investimentos e reformas, a empresa
                se consolidou como referência na região, oferecendo um serviço
                completo que vai desde a avaliação do imóvel até a concretização
                do negócio.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Founder card */}
            <div
              className="bg-white rounded-2xl border shadow-sm p-6"
              style={{ borderColor: '#ddd9d0' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  NP
                </div>
                <div>
                  <p
                    className="font-bold text-lg"
                    style={{ color: '#1B2B5B' }}
                  >
                    Noêmia Pires Lemos
                  </p>
                  <p className="text-sm" style={{ color: '#C9A84C' }}>
                    Diretora Fundadora · CRECI 279051-F
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Com mais de 20 anos de atuação, Noêmia lidera a equipe com
                dedicação, profissionalismo e uma verdadeira paixão por ajudar
                famílias a realizarem o sonho da casa própria.
              </p>
            </div>

            {/* Co-founder card */}
            <div
              className="bg-white rounded-2xl border shadow-sm p-6"
              style={{ borderColor: '#ddd9d0' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  NL
                </div>
                <div>
                  <p
                    className="font-bold text-lg"
                    style={{ color: '#1B2B5B' }}
                  >
                    Nilton Lemos
                  </p>
                  <p className="text-sm" style={{ color: '#C9A84C' }}>
                    Co-Fundador · Construção, Investimentos e Reformas
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Responsável pela gestão de obras, investimentos imobiliários e
                reformas, Nilton traz experiência prática e visão estratégica
                para cada projeto da imobiliária.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section
        className="py-16"
        style={{
          background:
            'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <Heart className="w-10 h-10 mx-auto mb-4" style={{ color: '#C9A84C' }} />
          <h2
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Nossa Missão
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Ajudar famílias a encontrar o lar ideal, oferecendo um serviço
            imobiliário completo, humano e transparente. Acreditamos que cada
            imóvel carrega uma história, e nosso papel é conectar pessoas aos
            espaços onde criarão suas melhores memórias.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-2"
            style={{ color: '#C9A84C' }}
          >
            O que nos guia
          </p>
          <h2
            className="text-3xl font-bold"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            Nossos Valores
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="bg-white rounded-2xl border shadow-sm p-8 text-center"
              style={{ borderColor: '#ddd9d0' }}
            >
              <div
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: '#f0ebe0' }}
              >
                <value.icon className="w-7 h-7" style={{ color: '#C9A84C' }} />
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
              >
                {value.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div
          className="bg-white rounded-2xl border shadow-sm p-10 text-center"
          style={{ borderColor: '#ddd9d0' }}
        >
          <Users className="w-10 h-10 mx-auto mb-4" style={{ color: '#C9A84C' }} />
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            Conheça Nossa Equipe
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            Contamos com uma equipe de mais de 10 profissionais especializados,
            prontos para ajudar você em cada etapa da compra, venda ou locação
            do seu imóvel.
          </p>
          <Link
            href="/corretores"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            <Building2 className="w-5 h-5" />
            Ver Equipe Completa
          </Link>
        </div>
      </section>
    </main>
  )
}
