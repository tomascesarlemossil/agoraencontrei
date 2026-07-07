import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, CheckCircle, Star, Search,
  TrendingUp, BarChart3, Globe, MessageCircle, Sparkles, ShieldCheck,
} from 'lucide-react'
import {
  AD_PLANS, DIVULGUE_CATEGORIES, CATEGORY_GROUPS, RESULT_PILLARS,
  SEO_STRATEGY, PROOF_STATS, formatBRL,
} from '@/lib/divulgue-catalog'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Divulgue seu Negócio | AgoraEncontrei — Landing page + Google por R$ 39,90/mês',
  description:
    'Coloque sua empresa ou serviço no maior marketplace imobiliário de Franca e região. Landing page pronta, otimização de SEO no Google e leads qualificados por R$ 39,90/mês.',
  keywords: [
    'divulgar empresa franca sp',
    'anunciar serviços franca',
    'landing page para empresa',
    'seo google prestador de serviço',
    'marketing para reforma e construção franca',
  ],
  openGraph: {
    title: 'Divulgue seu Negócio | AgoraEncontrei',
    description: 'Landing page pronta + SEO no Google + leads qualificados por R$ 39,90/mês.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/divulgue' },
}

const HOW_IT_WORKS = [
  { step: '01', icon: Search, title: 'Escolha seu segmento', desc: 'Selecione o tipo do seu negócio e os serviços que você entrega — cada segmento tem seu próprio catálogo.' },
  { step: '02', icon: Sparkles, title: 'Monte sua landing page', desc: 'Adicione fotos, vídeos, preços, endereço e logo. Use um modelo pronto ou personalize do seu jeito.' },
  { step: '03', icon: MessageCircle, title: 'Ative sua divulgação', desc: 'Assine por R$ 39,90/mês. Sua página entra no ar e começa a ser indexada no Google.' },
  { step: '04', icon: BarChart3, title: 'Receba e acompanhe leads', desc: 'Entre no painel para editar sua página e ver visualizações, cliques no WhatsApp e contatos recebidos.' },
]

const TESTIMONIALS = [
  { text: 'Coloquei minha empresa de reformas e em duas semanas já apareci no Google quando buscavam reforma no meu bairro. Fechei 3 orçamentos.', name: 'Carlos Mendes', role: 'Reformas · Franca/SP', rating: 5 },
  { text: 'A landing page ficou linda e eu mesmo edito pelo celular. O botão de WhatsApp direto mudou meu jogo.', name: 'Juliana Reis', role: 'Designer de Interiores · Franca/SP', rating: 5 },
  { text: 'Pago menos que um lanche por semana e apareço para quem acabou de comprar um imóvel e precisa de eletricista.', name: 'Anderson Silva', role: 'Eletricista · Franca/SP', rating: 5 },
]

const FAQ = [
  { q: 'Qual a diferença entre "Divulgue seu Negócio" e "Seja um Parceiro"?', a: 'Divulgue seu Negócio é para quem quer aparecer na lista de empresas e prestadores de serviço do AgoraEncontrei com uma landing page própria, por R$ 39,90/mês. Seja um Parceiro é para quem quer contratar um site próprio, o CRM/sistema ou versões offline — outra linha de produtos.' },
  { q: 'Preciso saber montar site?', a: 'Não. Você escolhe um modelo pronto, adiciona suas fotos, serviços e contato, e a página fica no ar. Depois é só editar pelo painel quando quiser.' },
  { q: 'Como isso me ajuda a aparecer no Google?', a: 'Sua página é otimizada para SEO, tem endereço estruturado e é interligada a páginas de bairros, condomínios e imóveis do marketplace que já recebem muito tráfego. Isso aumenta suas chances de ser encontrado em buscas locais.' },
  { q: 'Tem fidelidade ou taxa de adesão?', a: 'Não. É uma mensalidade simples, sem taxa de adesão e sem fidelidade. Você cancela quando quiser.' },
  { q: 'Como recebo os contatos?', a: 'Os clientes falam com você direto pelo botão de WhatsApp ou telefone na sua página. No painel você acompanha quantas pessoas viram seu perfil e clicaram para falar com você.' },
]

export default function DivulguePage() {
  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white py-20 px-4" style={{ background: 'linear-gradient(135deg, #143A1F 0%, #0E2A15 55%, #0f1c3a 100%)' }}>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            <Sparkles className="w-3.5 h-3.5" /> Divulgue seu Negócio
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Sua empresa encontrada por quem{' '}
            <span style={{ color: '#C9A84C' }}>precisa dela agora</span>
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto">
            Uma landing page profissional para o seu negócio, otimizada para o Google e no maior
            marketplace imobiliário de Franca e região. Comece a divulgar por{' '}
            <strong className="text-white">R$ 39,90/mês</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/parceiros/cadastro" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg" style={{ background: '#C9A84C', color: '#143A1F' }}>
              Criar minha página <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#planos" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
              Ver planos
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
            {PROOF_STATS.map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{s.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── O QUE É / RESULTADO ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>Por que dá resultado</p>
          <h2 className="text-3xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>
            Marketing que trabalha por você
          </h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Não é só um anúncio parado. É uma máquina de ser encontrado — no Google e por quem está
            comprando, alugando ou reformando um imóvel na sua região.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {RESULT_PILLARS.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="text-3xl mb-3">{p.emoji}</div>
              <h3 className="font-bold text-[#143A1F] mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ESTRATÉGIA DE SEO ────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#f0ece4' }} className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-[#143A1F] mb-2">
              <Globe className="w-5 h-5" style={{ color: '#C9A84C' }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C9A84C' }}>Plano de marketing e SEO</p>
            </div>
            <h2 className="text-3xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>
              Como potencializamos você no Google
            </h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
              Uma estratégia em 5 frentes para transformar buscas em clientes. Tudo já embutido na sua divulgação.
            </p>
          </div>
          <div className="space-y-4">
            {SEO_STRATEGY.map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold" style={{ backgroundColor: 'rgba(20,58,31,0.06)', color: '#143A1F' }}>
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-[#143A1F] mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 p-5 rounded-2xl border bg-white" style={{ borderColor: 'rgba(201,168,76,0.4)' }}>
            <TrendingUp className="w-6 h-6 flex-shrink-0" style={{ color: '#C9A84C' }} />
            <p className="text-sm text-gray-600">
              <strong className="text-[#143A1F]">Importante:</strong> SEO é um jogo de médio prazo. Trabalhamos
              para melhorar seu posicionamento mês após mês — quanto mais completa sua página (fotos,
              serviços, vídeos e depoimentos), mais rápido você sobe.
            </p>
          </div>
        </div>
      </section>

      {/* ── PLANO ────────────────────────────────────────────────────────── */}
      <section id="planos" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>Plano de divulgação</p>
          <h2 className="text-3xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>
            Um preço simples, tudo incluído
          </h2>
          <p className="text-gray-500 mt-2">Sem taxa de adesão. Sem fidelidade. Cancele quando quiser.</p>
        </div>

        <div className="max-w-md mx-auto">
          {AD_PLANS.map((plan) => (
            <div key={plan.id} className="relative bg-white rounded-2xl border-2 border-[#C9A84C] shadow-lg shadow-[#C9A84C]/10 p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-[#C9A84C] text-[#143A1F]">
                Preço único
              </div>
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-[#C9A84C]" />
                  <h3 className="text-xl font-bold text-[#143A1F]">{plan.name}</h3>
                </div>
                <p className="text-gray-500 text-sm mb-4">{plan.tagline}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-[#143A1F]">{formatBRL(plan.price)}</span>
                  <span className="text-gray-500">/mês</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/parceiros/cadastro" className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-[#C9A84C] text-[#143A1F] hover:brightness-105 transition-all">
                Criar minha página <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-400 text-xs mt-6">
          Pagamento via PIX, cartão ou boleto · Seguro via Asaas (regulado pelo Banco Central)
        </p>
      </section>

      {/* ── COMO FUNCIONA ────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #143A1F, #0E2A15)' }} className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Do cadastro à primeira lead</h2>
            <p className="text-white/60 mt-2">Em 4 passos simples, no seu tempo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
                  <s.icon className="w-6 h-6" style={{ color: '#C9A84C' }} />
                </div>
                <div className="text-xs font-bold mb-1" style={{ color: '#C9A84C' }}>PASSO {s.step}</div>
                <h3 className="font-bold text-white text-sm mb-2">{s.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEGMENTOS ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>Para todo tipo de negócio do imóvel</h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Cada segmento tem seu próprio catálogo de serviços. Escolha o seu e monte sua oferta.
          </p>
        </div>
        <div className="space-y-8">
          {CATEGORY_GROUPS.filter(g => g !== 'Outros').map((group) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-3">{group}</p>
              <div className="flex flex-wrap gap-2">
                {DIVULGUE_CATEGORIES.filter(c => c.group === group).map((c) => (
                  <span key={c.value} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm text-[#143A1F]">
                    <span>{c.emoji}</span> {c.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEPOIMENTOS ──────────────────────────────────────────────────── */}
      <section className="bg-white border-y py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>Quem divulga, recomenda</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[#f8f6f1] rounded-2xl p-6 border">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#C9A84C] text-[#C9A84C]" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4 italic">&quot;{t.text}&quot;</p>
                <div>
                  <p className="font-bold text-[#143A1F] text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>Perguntas frequentes</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border p-5 shadow-sm">
              <h3 className="font-bold text-[#143A1F] text-sm mb-2">{item.q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 text-center" style={{ background: 'linear-gradient(135deg, #143A1F, #0f1c3a)' }}>
        <div className="max-w-3xl mx-auto">
          <ShieldCheck className="w-10 h-10 mx-auto mb-4" style={{ color: '#C9A84C' }} />
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Comece a divulgar hoje por R$ 39,90
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Monte sua landing page em minutos e apareça para quem precisa do seu serviço em Franca e região.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/parceiros/cadastro" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg" style={{ background: '#C9A84C', color: '#143A1F' }}>
              Criar minha página <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/meu-painel" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
              Já divulgo — Acessar painel
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
