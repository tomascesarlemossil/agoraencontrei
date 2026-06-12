import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Bot, Globe, BarChart3, Gavel, Megaphone, Image as ImageIcon,
  Share2, Banknote, Workflow, CheckCircle2, XCircle, ArrowRight,
  Clock, Sparkles, ShieldCheck, TrendingUp,
} from 'lucide-react'
import { ALL_PLANS } from '@/lib/site-factory/plan-registry'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Sistema para Imobiliárias e Corretores | AgoraEncontrei — CRM + IA + Site + Leilões',
  description:
    'O sistema tudo-em-um do mercado imobiliário: vendedor com IA que atende 24/7 (Tomás), site próprio no ar em 24h, CRM completo, inteligência de leilões com ROI, financeiro e marketing automático. A partir de R$ 97/mês.',
  keywords: [
    'sistema para imobiliária', 'crm imobiliário', 'site para corretor',
    'crm com inteligência artificial', 'software imobiliário', 'crm imóveis brasil',
  ],
  openGraph: {
    title: 'Sistema para Imobiliárias | AgoraEncontrei',
    description: 'CRM + IA + Site + Leilões num lugar só. A partir de R$ 97/mês.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/sistema' },
}

const NAVY = '#1B2B5B'
const GOLD = '#C9A84C'

const DORES = [
  { icon: Clock, t: 'Lead esfria', d: 'Você responde horas depois — e o concorrente já fechou.' },
  { icon: Workflow, t: 'Ferramentas soltas', d: 'CRM num lugar, site noutro, financeiro numa planilha.' },
  { icon: Banknote, t: 'Custo somado', d: 'Paga CRM + site + IA + cobrança separadamente.' },
  { icon: Bot, t: 'Ninguém atende 22h', d: 'O cliente chama no WhatsApp à noite e fica sem resposta.' },
  { icon: Gavel, t: 'Leilão é caixa-preta', d: 'Sabe que tem oportunidade, mas não calcula ROI nem risco.' },
  { icon: BarChart3, t: 'Sem previsibilidade', d: 'Não sabe de onde vem o lead nem o que converte.' },
]

const FERRAMENTAS = [
  { icon: Bot, t: 'Tomás — Vendedor com IA', d: 'Atende e qualifica leads 24/7 no WhatsApp e no site, manda o imóvel certo e agenda a visita — sozinho.', star: true },
  { icon: Globe, t: 'Site próprio em 24h', d: 'Site profissional com seu domínio, white-label e 5 temas premium. Ainda aparece no nosso marketplace.' },
  { icon: BarChart3, t: 'CRM completo', d: 'Leads, funil, negócios, comissões, lead scoring e follow-up automático. Nenhum contato perdido.' },
  { icon: Gavel, t: 'Inteligência de leilões', d: 'Caixa, Santander, BB e leiloeiros com calculadora de ROI, score de oportunidade e alertas. Exclusivo.', star: true },
  { icon: Megaphone, t: 'Marketing & SEO automático', d: 'SEO programático por bairro/cidade, blog e posts sociais. O Google te traz lead orgânico.' },
  { icon: ImageIcon, t: 'IA visual de foto e vídeo', d: 'Edição, marca d’água e otimização de imagens e vídeos sem contratar fotógrafo.' },
  { icon: Share2, t: 'Sincronização de portais', d: 'Publica em ZAP, VivaReal, OLX e Facebook. Cadastra uma vez, aparece em todo lugar.' },
  { icon: Banknote, t: 'LemosBank — Financeiro', d: 'Boletos, cobranças, repasses, notas fiscais e assinatura digital de contrato (PIX/boleto).' },
  { icon: Workflow, t: 'Automações & WhatsApp', d: 'Motor de regras (gatilho → ação) e WhatsApp oficial. O sistema trabalha enquanto você dorme.' },
]

const COMPARATIVO = [
  { f: 'Vendedor com IA 24/7 (Tomás)', nos: true, crm: false, site: false },
  { f: 'Inteligência de leilões + ROI', nos: true, crm: false, site: false },
  { f: 'Site próprio em 24h + white-label', nos: true, crm: 'parcial', site: true },
  { f: 'Marketplace com tráfego', nos: true, crm: false, site: false },
  { f: 'Sincronização de portais', nos: true, crm: true, site: 'parcial' },
  { f: 'Financeiro (boleto/repasse/NF)', nos: true, crm: 'parcial', site: false },
  { f: 'SEO programático', nos: true, crm: false, site: 'parcial' },
  { f: 'IA visual de foto/vídeo', nos: true, crm: false, site: false },
]

const FAQ = [
  { q: 'Está caro?', a: 'Caro é pagar CRM + site + IA + financeiro separados (R$ 900+ por mês). Aqui é R$ 297 com tudo integrado. Um imóvel a mais no ano já pagou anos de assinatura.' },
  { q: 'Já tenho um sistema.', a: 'Ótimo — mas qual deles atende seu lead às 22h e calcula o ROI de um leilão? Fazemos a migração para você. Nenhum concorrente junta IA de atendimento + inteligência de leilões.' },
  { q: 'Não confio em IA atendendo meu cliente.', a: 'O Tomás qualifica e te entrega o lead quente — você assume quando quiser. Ele só garante que ninguém fique sem resposta.' },
  { q: 'Sou corretor autônomo, não é demais para mim?', a: 'Começa no plano Simples por R$ 97/mês. Você cresce quando quiser, sem fidelidade.' },
  { q: 'E se eu não gostar?', a: 'Sem fidelidade. Você fica porque funciona, não porque está preso a um contrato.' },
]

function Cell({ v }: { v: boolean | 'parcial' }) {
  if (v === true) return <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
  if (v === 'parcial') return <span className="text-xs font-medium text-amber-600">parcial</span>
  return <XCircle className="mx-auto h-5 w-5 text-gray-300" />
}

export default function SistemaPage() {
  return (
    <div className="bg-[#f8f6f1]">
      {/* HERO */}
      <section className="px-4 py-16 text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, #0f1c3a)` }}>
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold" style={{ color: GOLD }}>
            <Sparkles className="h-3.5 w-3.5" /> O sistema tudo-em-um do mercado imobiliário
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>
            Um vendedor com IA que <span style={{ color: GOLD }}>nunca dorme</span>.<br />
            Mais site, CRM, leilões e financeiro num lugar só.
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
            O AgoraEncontrei junta tudo que uma imobiliária moderna precisa — por menos do que você
            gasta hoje em ferramentas separadas. A partir de <strong style={{ color: GOLD }}>R$ 97/mês</strong>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/parceiros/planos" className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-black shadow-lg transition hover:opacity-90" style={{ backgroundColor: GOLD }}>
              Ver planos e começar <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contato" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
              Falar com um especialista
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Sem fidelidade</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> Site no ar em 24h</span>
            <span className="inline-flex items-center gap-1.5"><Bot className="h-4 w-4" /> IA inclusa no Premium</span>
          </div>
        </div>
      </section>

      {/* DORES */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
          Vender imóvel hoje é estar espalhado em 6 ferramentas que não conversam
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-gray-500">E é por isso que lead escapa todo dia. Soa familiar?</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DORES.map((d) => (
            <div key={d.t} className="rounded-2xl border border-gray-100 bg-white p-5">
              <d.icon className="mb-3 h-6 w-6" style={{ color: GOLD }} />
              <h3 className="mb-1 font-bold" style={{ color: NAVY }}>{d.t}</h3>
              <p className="text-sm text-gray-500">{d.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FERRAMENTAS */}
      <section className="px-4 py-16" style={{ backgroundColor: '#fff' }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
            Tudo num login só
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-gray-500">
            O AgoraEncontrei substitui de 5 a 7 ferramentas. Veja o que vem dentro:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FERRAMENTAS.map((f) => (
              <div key={f.t} className={`relative rounded-2xl border p-5 ${f.star ? 'border-[#C9A84C]/40 bg-[#C9A84C]/5' : 'border-gray-100 bg-[#f8f6f1]'}`}>
                {f.star && (
                  <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold text-black" style={{ backgroundColor: GOLD }}>
                    EXCLUSIVO
                  </span>
                )}
                <f.icon className="mb-3 h-7 w-7" style={{ color: NAVY }} />
                <h3 className="mb-1 font-bold" style={{ color: NAVY }}>{f.t}</h3>
                <p className="text-sm text-gray-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
          Por que não é "só mais um CRM"
        </h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ backgroundColor: NAVY }}>
                <th className="p-3 text-left font-semibold">Recurso</th>
                <th className="p-3 text-center font-semibold" style={{ color: GOLD }}>AgoraEncontrei</th>
                <th className="p-3 text-center font-semibold">CRM tradicional</th>
                <th className="p-3 text-center font-semibold">Construtor de site</th>
              </tr>
            </thead>
            <tbody>
              {COMPARATIVO.map((row, i) => (
                <tr key={row.f} className={i % 2 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-3 font-medium text-gray-700">{row.f}</td>
                  <td className="p-3"><Cell v={row.nos} /></td>
                  <td className="p-3"><Cell v={row.crm as boolean | 'parcial'} /></td>
                  <td className="p-3"><Cell v={row.site as boolean | 'parcial'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CONTA DE ECONOMIA */}
      <section className="px-4 py-16 text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, #0f1c3a)` }}>
        <div className="mx-auto max-w-3xl text-center">
          <TrendingUp className="mx-auto mb-4 h-10 w-10" style={{ color: GOLD }} />
          <h2 className="mb-6 text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'Georgia, serif' }}>
            A conta que faz dizer "sim"
          </h2>
          <div className="mb-6 grid grid-cols-2 gap-4 text-left">
            <div className="rounded-2xl bg-white/5 p-6">
              <p className="mb-2 text-xs uppercase tracking-widest text-white/50">Comprando separado</p>
              <p className="text-sm text-white/70">CRM + site + IA + portais + financeiro + marketing</p>
              <p className="mt-3 text-3xl font-bold text-white/80 line-through">~R$ 900<span className="text-base">/mês</span></p>
            </div>
            <div className="rounded-2xl p-6" style={{ backgroundColor: GOLD, color: '#000' }}>
              <p className="mb-2 text-xs uppercase tracking-widest opacity-70">No AgoraEncontrei</p>
              <p className="text-sm opacity-80">Tudo integrado, num login só</p>
              <p className="mt-3 text-3xl font-bold">R$ 297<span className="text-base">/mês</span></p>
            </div>
          </div>
          <p className="text-white/70">Economia de <strong style={{ color: GOLD }}>R$ 600+ por mês</strong> — e um único imóvel vendido a mais no ano paga anos de assinatura.</p>
        </div>
      </section>

      {/* PLANOS */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
          Escolha seu plano
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-gray-500">Sem fidelidade. Comece hoje, cresça quando quiser.</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {ALL_PLANS.map((p) => (
            <div key={p.key} className={`relative flex flex-col rounded-2xl border bg-white p-6 ${p.highlighted ? 'border-[#C9A84C] shadow-xl ring-2 ring-[#C9A84C]/30' : 'border-gray-200'}`}>
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold text-black" style={{ backgroundColor: GOLD }}>
                  MAIS ESCOLHIDO
                </span>
              )}
              <h3 className="text-lg font-bold" style={{ color: NAVY }}>{p.name}</h3>
              <p className="mb-3 text-xs text-gray-500">{p.tagline}</p>
              <p className="mb-4 text-3xl font-bold" style={{ color: NAVY }}>{p.price}</p>
              <ul className="mb-6 flex-1 space-y-2">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" /> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/parceiros/planos" className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${p.highlighted ? 'text-black hover:opacity-90' : 'text-white hover:opacity-90'}`} style={{ backgroundColor: p.highlighted ? GOLD : NAVY }}>
                Começar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ / OBJEÇÕES */}
      <section className="px-4 py-16" style={{ backgroundColor: '#fff' }}>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
            Perguntas frequentes
          </h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-2xl border border-gray-100 bg-[#f8f6f1] p-5">
                <h3 className="mb-1 font-bold" style={{ color: NAVY }}>{item.q}</h3>
                <p className="text-sm text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 py-20 text-center text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, #0f1c3a)` }}>
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-2xl font-bold sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>
            Pare de perder lead às 22h
          </h2>
          <p className="mb-8 text-lg text-white/70">
            Tenha um vendedor de IA trabalhando por você, um site no ar amanhã e tudo num lugar só — por R$ 297/mês.
          </p>
          <Link href="/parceiros/planos" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-black shadow-lg transition hover:opacity-90" style={{ backgroundColor: GOLD }}>
            Começar agora <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
