import type { Metadata } from 'next'
import { CheckCircle, TrendingUp, Clock, Shield, Star, MapPin, Phone } from 'lucide-react'
import { AvaliacaoForm } from './AvaliacaoForm'

export const metadata: Metadata = {
  title: 'Avaliação Profissional de Imóvel com Dados em Tempo Real | AgoraEncontrei',
  description: 'Avaliação profissional do seu imóvel com dados em tempo real. 3 métodos (comparativo, custo SINAPI e capitalização de renda), detecção de anomalias e laudo instantâneo. 1a avaliação gratuita.',
  keywords: 'avaliação imóvel profissional, avaliação imóvel franca, laudo imobiliário, quanto vale meu imóvel, avaliação casa franca sp, avaliação inteligente, método comparativo, método custo sinapi, capitalização de renda, valor de mercado imóvel, avaliação dados tempo real',
  openGraph: {
    title: 'Avaliação Profissional de Imóvel com Dados em Tempo Real | AgoraEncontrei',
    description: 'Descubra o valor real do seu imóvel com 3 métodos profissionais e dados em tempo real. 1a avaliação gratuita.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: {
    canonical: 'https://agoraencontrei.com.br/avaliacao',
  },
}

// Schema.org structured data
const avaliacaoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Avaliador Profissional de Imóveis com Dados em Tempo Real',
  description: 'Ferramenta profissional de avaliação de imóveis com dados em tempo real, 3 métodos (comparativo, custo SINAPI, capitalização de renda), detecção de anomalias de preço e estratégia de precificação.',
  url: 'https://agoraencontrei.com.br/avaliacao',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL', description: '1a avaliação gratuita por CPF, demais R$200' },
  provider: {
    '@type': 'RealEstateAgent',
    name: 'AgoraEncontrei — Imobiliária Lemos',
    url: 'https://agoraencontrei.com.br',
    telephone: '+55-16-98101-0004',
    address: { '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP', addressCountry: 'BR' },
  },
  featureList: [
    'Método Comparativo de Dados de Mercado',
    'Método de Custo (SINAPI/CUB)',
    'Capitalização de Renda',
    'Detecção de Anomalias de Preço',
    'Estratégia de Precificação com cenários',
    'Score de Confiabilidade',
    '3 Valores: Mercado, Bancário, Venda Rápida',
    'Comparáveis com scoring de similaridade',
  ],
}

const BENEFICIOS = [
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: '1a Avaliação Gratuita',
    desc: 'Sua primeira avaliação por CPF é totalmente gratuita. Demais avaliações por apenas R$ 200.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Dados em Tempo Real',
    desc: 'Análise com 3 métodos profissionais, comparativos do mercado local e tendências atualizadas.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Laudo Instantâneo',
    desc: 'Resultado imediato com valor de mercado, valor bancário e valor de venda rápida.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Score de Confiança',
    desc: 'Cada avaliação inclui score de confiabilidade, detecção de anomalias e estratégia de preço.',
  },
]

const DEPOIMENTOS = [
  {
    name: 'Carlos M.',
    text: 'A avaliação foi surpreendentemente precisa. Vendemos o imóvel pelo valor estimado em menos de 30 dias.',
    stars: 5,
  },
  {
    name: 'Ana P.',
    text: 'Fiz a avaliação sem compromisso e fiquei impressionada com o profissionalismo e rapidez.',
    stars: 5,
  },
  {
    name: 'Roberto S.',
    text: 'Excelente serviço. O corretor conhece muito bem o mercado de Franca e região.',
    stars: 5,
  },
]

export default function AvaliacaoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(avaliacaoJsonLd) }}
      />
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        className="relative py-20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1c3a 0%, #1B2B5B 60%, #1e3568 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 20% 80%, #4a6cb5 0%, transparent 40%)',
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
            style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            <Star className="w-3 h-3 fill-current" />
            Avaliação profissional com dados em tempo real
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Quanto vale o
            <br />
            <span style={{ color: '#C9A84C' }}>seu imóvel?</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-3">
            Descubra o valor real de mercado do seu imóvel com dados em tempo real.
            3 métodos profissionais, detecção de anomalias e laudo instantâneo.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {[
              { value: '22+', label: 'Anos de experiência' },
              { value: '5.000+', label: 'Avaliações realizadas' },
              { value: '24h', label: 'Prazo de resposta' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{s.value}</p>
                <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: '#f8f6f1' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

            {/* Form — left/main */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                    Avaliação Profissional com Dados em Tempo Real
                  </h2>
                  <p className="text-gray-500 text-sm">Preencha os dados do seu imóvel e receba o laudo instantâneo.</p>
                </div>
                <AvaliacaoForm />
              </div>
            </div>

            {/* Sidebar — right */}
            <div className="lg:col-span-2 space-y-6">
              {/* Benefícios */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#C9A84C' }}>
                  Por que avaliar conosco?
                </h3>
                <div className="space-y-4">
                  {BENEFICIOS.map(b => (
                    <div key={b.title} className="flex gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                      >
                        {b.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>{b.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contato direto */}
              <div
                className="rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #1B2B5B, #152347)' }}
              >
                <p className="text-white font-semibold text-sm mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                  Prefere falar diretamente?
                </p>
                <div className="space-y-2">
                  <a
                    href="https://wa.me/5516981010004?text=Olá! Gostaria de solicitar uma avaliação gratuita do meu imóvel."
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                    style={{ backgroundColor: '#25D366', color: '#fff' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp: (16) 98101-0004
                  </a>
                  <a
                    href="tel:1637230045"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <Phone className="w-4 h-4" />
                    Fixo: (16) 3723-0045
                  </a>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-white/40" />
                  <p className="text-white/40 text-xs">Franca — SP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ──────────────────────────────────────────────── */}
      <section className="py-14" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2
            className="text-xl font-bold text-center mb-10"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            O que dizem nossos clientes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {DEPOIMENTOS.map(d => (
              <div
                key={d.name}
                className="rounded-2xl p-5"
                style={{ backgroundColor: '#f8f6f1', border: '1px solid rgba(201,168,76,0.15)' }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: d.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#C9A84C' }} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">&ldquo;{d.text}&rdquo;</p>
                <p className="text-xs font-semibold" style={{ color: '#1B2B5B' }}>{d.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#1B2B5B' }} className="py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-2xl font-bold text-white mb-3"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Pronto para descobrir o valor do seu imóvel?
          </h2>
          <p className="text-white/50 text-sm mb-6">
            Preencha o formulário acima ou entre em contato pelo WhatsApp. 1a avaliação gratuita por CPF.
          </p>
          <a
            href="/avaliacao"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            Avaliar meu imóvel agora
          </a>
        </div>
      </section>
    </>
  )
}
