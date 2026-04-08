import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Star, Zap, Crown, ArrowRight, MessageCircle, TrendingUp, MapPin, Users, Building2, Shield } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Seja Parceiro | AgoraEncontrei — Leads Qualificados de Imóveis em Franca/SP',
  description: 'Apareça para quem acabou de comprar um imóvel em Franca/SP. Gere leads qualificados de reforma, engenharia e corretagem todos os dias. Planos a partir de R$ 0.',
  keywords: [
    'parceiro imobiliário franca sp',
    'arquiteto leads franca',
    'engenheiro leads imóveis franca',
    'corretor parceiro franca sp',
    'anunciar serviços imobiliários franca',
  ],
  openGraph: {
    title: 'Seja Parceiro | AgoraEncontrei',
    description: 'Apareça para quem acabou de comprar um imóvel em Franca/SP. Leads qualificados todos os dias.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/seja-parceiro' },
}

async function fetchAuctionCount() {
  try {
    const res = await fetch(`${API_URL}/api/v1/auctions/stats`, { next: { revalidate: 1800 } })
    if (!res.ok) return 0
    const data = await res.json()
    return data.total ?? 0
  } catch {
    return 0
  }
}

const PLANS = [
  {
    id: 'START',
    name: 'Free',
    price: 'R$ 0',
    period: '/mês',
    subtitle: 'Para começar a aparecer',
    highlight: false,
    badge: null,
    features: [
      { text: '01 anúncio grátis', included: true },
      { text: 'Acesso básico ao mapa', included: true },
      { text: 'Perfil público no AgoraEncontrei', included: true },
      { text: 'Foto de perfil e bio', included: true },
      { text: 'Link de WhatsApp direto', included: false },
      { text: 'Selo Verificado ✓', included: false },
      { text: 'I.A. de ROI e alertas', included: false },
      { text: 'Edição de fotos com I.A.', included: false },
    ],
    cta: 'Criar perfil gratuito',
    ctaHref: '/parceiros/cadastro',
    ctaStyle: 'border-2 border-[#1B2B5B] text-[#1B2B5B] hover:bg-[#1B2B5B] hover:text-white',
  },
  {
    id: 'PRIME',
    name: 'Lite',
    price: 'R$ 79',
    priceDecimals: ',90',
    period: '/mês',
    subtitle: 'Para corretores autônomos',
    highlight: false,
    badge: null,
    features: [
      { text: 'Até 10 anúncios ativos', included: true },
      { text: 'Filtros de busca avançados', included: true },
      { text: 'Selo Verificado ✓', included: true },
      { text: 'Link de WhatsApp direto', included: true },
      { text: 'Topo das buscas por bairro/edifício', included: true },
      { text: 'I.A. de ROI e alertas', included: false },
      { text: 'Edição de fotos com I.A.', included: false },
      { text: 'Destaque no mapa de busca', included: false },
    ],
    cta: 'Assinar Lite',
    ctaHref: '/parceiros/cadastro?plan=PRIME',
    ctaStyle: 'bg-[#C9A84C] text-[#1B2B5B] hover:bg-[#b8943d]',
    ctaCheckout: true,
  },
  {
    id: 'MODERADO',
    name: 'Moderado',
    price: 'R$ 279',
    period: '/mês',
    subtitle: 'Para investidores e pequenas imobiliárias',
    highlight: true,
    badge: 'Mais Popular',
    features: [
      { text: 'Até 30 anúncios ativos', included: true },
      { text: 'I.A. de ROI (10 análises/mês)', included: true },
      { text: 'Alertas de oportunidades', included: true },
      { text: 'Selo Verificado ✓', included: true },
      { text: 'Topo das buscas por bairro/edifício', included: true },
      { text: 'Link de WhatsApp direto', included: true },
      { text: 'Edição de fotos com I.A.', included: false },
      { text: 'Banner exclusivo em condomínios de luxo', included: false },
    ],
    cta: 'Assinar Moderado',
    ctaHref: '/parceiros/cadastro?plan=MODERADO',
    ctaStyle: 'bg-[#C9A84C] text-[#1B2B5B] hover:bg-[#b8943d]',
    ctaCheckout: true,
  },
  {
    id: 'VIP',
    name: 'Pro',
    price: 'R$ 499',
    period: '/mês',
    subtitle: 'Para imobiliárias de elite',
    highlight: false,
    badge: 'Exclusivo',
    features: [
      { text: 'Até 100 anúncios ativos', included: true },
      { text: 'I.A. Ilimitada (ROI + Fotos + Dossiês)', included: true },
      { text: 'Edição de fotos profissional com I.A.', included: true },
      { text: 'Alertas de oportunidades em tempo real', included: true },
      { text: 'Selo Verificado ✓', included: true },
      { text: 'Banner exclusivo em condomínios de luxo', included: true },
      { text: 'Destaque no mapa de busca', included: true },
      { text: 'Relatórios mensais de desempenho', included: true },
    ],
    cta: 'Assinar Pro',
    ctaHref: '/parceiros/cadastro?plan=VIP',
    ctaStyle: 'bg-[#1B2B5B] text-white hover:bg-[#162247]',
    ctaCheckout: true,
  },
]

const TESTIMONIALS = [
  {
    name: 'Marcos Oliveira',
    role: 'Arquiteto · Franca/SP',
    text: 'Em 3 semanas de cadastro já recebi 4 contatos de clientes que compraram apartamentos em condomínios que eu listei. ROI imediato.',
    rating: 5,
  },
  {
    name: 'Ana Paula Costa',
    role: 'Engenheira Civil · Franca/SP',
    text: 'O AgoraEncontrei me coloca exatamente na frente de quem precisa de mim: pessoas que acabaram de comprar um imóvel e precisam reformar.',
    rating: 5,
  },
  {
    name: 'Ricardo Fernandes',
    role: 'Corretor de Imóveis · CRECI-SP',
    text: 'Meu perfil aparece nas páginas dos condomínios onde já trabalhei. Os leads chegam com contexto — eles já sabem quem sou.',
    rating: 5,
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Cadastre seu perfil',
    desc: 'Crie seu perfil em minutos. Selecione os condomínios e bairros onde você já trabalhou.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Apareça onde importa',
    desc: 'Seu perfil aparece nas páginas dos condomínios selecionados e nas buscas por bairro.',
    icon: MapPin,
  },
  {
    step: '03',
    title: 'Receba leads qualificados',
    desc: 'Clientes que acabaram de comprar um imóvel te encontram e entram em contato direto.',
    icon: TrendingUp,
  },
]

export default async function SejaParceiroPage() {
  const auctionCount = await fetchAuctionCount()

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Contador de leilões — prova de demanda */}
          {auctionCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
              🔥 <span><strong>{auctionCount} imóveis em leilão</strong> ativos agora em Franca/SP — cada um é um futuro cliente de reforma</span>
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Apareça para quem acabou de{' '}
            <span style={{ color: '#C9A84C' }}>comprar um imóvel</span>{' '}
            em Franca/SP.
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto">
            Gere leads qualificados de reforma, engenharia, arquitetura e corretagem todos os dias.
            Seu perfil aparece exatamente quando o cliente mais precisa de você.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/parceiros/planos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              Ver planos e dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/parceiros/cadastro"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
              Criar perfil gratuito
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-white/60 text-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">300+</div>
              <div>Condomínios mapeados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">1.011+</div>
              <div>Imóveis ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5.000+</div>
              <div>Famílias atendidas</div>
            </div>
            {auctionCount > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{auctionCount}+</div>
                <div>Leilões ativos</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1B2B5B] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Como funciona
          </h2>
          <p className="text-gray-500">Em 3 passos simples você começa a receber leads</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="bg-white rounded-2xl p-6 border text-center shadow-sm">
              <div className="w-12 h-12 bg-[#1B2B5B]/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-[#1B2B5B]" />
              </div>
              <div className="text-xs font-bold text-[#C9A84C] mb-2">PASSO {step.step}</div>
              <h3 className="font-bold text-[#1B2B5B] text-lg mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROVA DE DEMANDA — LEILÕES */}
      {auctionCount > 0 && (
        <section className="bg-red-50 border-y border-red-100 py-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-4xl mb-3">🔥</div>
            <h2 className="text-2xl font-bold text-red-700 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              {auctionCount} imóveis em leilão ativos em Franca/SP agora
            </h2>
            <p className="text-red-600 mb-4">
              Cada imóvel arrematado é um futuro cliente de reforma, arquitetura ou engenharia.
              Esteja visível quando eles precisarem de você.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/leilao-imoveis-franca-sp"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
                Ver leilões ativos <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/parceiros/planos"
                className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
                Aparecer para esses clientes
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* TABELA DE PREÇOS */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1B2B5B] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Planos e Preços
          </h2>
          <p className="text-gray-500">Comece grátis. Escale conforme seus resultados.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-8 shadow-sm ${
                plan.highlight
                  ? 'border-[#C9A84C] shadow-lg shadow-[#C9A84C]/10 scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
                  plan.highlight ? 'bg-[#C9A84C] text-[#1B2B5B]' : 'bg-[#1B2B5B] text-white'
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  {plan.id === 'START' && <Zap className="w-5 h-5 text-gray-400" />}
                  {plan.id === 'PRIME' && <Star className="w-5 h-5 text-[#C9A84C]" />}
                  {plan.id === 'VIP' && <Crown className="w-5 h-5 text-[#1B2B5B]" />}
                  <h3 className="text-xl font-bold text-[#1B2B5B]">Plano {plan.name}</h3>
                </div>
                <p className="text-gray-500 text-sm mb-4">{plan.subtitle}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#1B2B5B]">{plan.price}</span>
                  {'priceDecimals' in plan && plan.priceDecimals && <span className="text-xl font-bold text-[#1B2B5B]">{plan.priceDecimals}</span>}
                  <span className="text-gray-500">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${feature.included ? 'text-gray-700' : 'text-gray-300 line-through'}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${feature.included ? 'text-green-500' : 'text-gray-200'}`} />
                    {feature.text}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors ${plan.ctaStyle}`}
              >
                {plan.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Sem fidelidade. Cancele quando quiser. Pagamento via PIX, cartão ou boleto.
        </p>
      </section>

      {/* DEPOIMENTOS */}
      <section className="bg-white border-y py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#1B2B5B] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              O que dizem nossos parceiros
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#f8f6f1] rounded-2xl p-6 border">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#C9A84C] text-[#C9A84C]" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-[#1B2B5B] text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS DE PARCEIROS */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1B2B5B] mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Para quem é o AgoraEncontrei Parceiros?
          </h2>
          <p className="text-gray-500">Qualquer profissional que atende o mercado imobiliário</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '🏗️', label: 'Engenheiros Civis' },
            { icon: '🎨', label: 'Arquitetos' },
            { icon: '🛋️', label: 'Designers de Interiores' },
            { icon: '📸', label: 'Fotógrafos' },
            { icon: '🎬', label: 'Videomakers' },
            { icon: '⚖️', label: 'Advogados Imobiliários' },
            { icon: '🏠', label: 'Corretores' },
            { icon: '📋', label: 'Avaliadores' },
          ].map((cat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border text-center hover:border-[#C9A84C] transition-colors cursor-default">
              <div className="text-3xl mb-2">{cat.icon}</div>
              <p className="text-sm font-medium text-[#1B2B5B]">{cat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-3xl mx-auto">
          <Shield className="w-10 h-10 mx-auto mb-4" style={{ color: '#C9A84C' }} />
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Comece hoje. É gratuito.
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Crie seu perfil em 5 minutos e apareça para quem acabou de comprar um imóvel em Franca/SP.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/parceiros/planos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              Ver planos e dashboard <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/parceiros/cadastro"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
              Criar meu perfil gratuito
            </Link>
            <Link href="/meu-painel"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
              <Building2 className="w-5 h-5" /> Já sou parceiro — Acessar painel
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
