import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Bot, Gavel, Globe, BarChart3, Banknote, Megaphone,
  ArrowRight, Sparkles, ChevronDown, CheckCircle2,
} from 'lucide-react'
import { ALL_PLANS } from '@/lib/site-factory/plan-registry'

export const metadata: Metadata = {
  title: 'AgoraEncontrei — Apresentação',
  description: 'O sistema tudo-em-um do mercado imobiliário: IA, site, CRM, leilões e financeiro.',
  robots: { index: false, follow: false },
}

const NAVY = '#143A1F'
const DARK = '#0f1c3a'
const GOLD = '#C9A84C'
const CREAM = '#f8f6f1'

const DORES = [
  'Você responde o lead horas depois — e o concorrente já fechou.',
  'CRM num lugar, site noutro, financeiro numa planilha.',
  'Paga CRM + site + IA + cobrança separadamente.',
  'O cliente chama às 22h no WhatsApp e ninguém responde.',
  'Sabe que o leilão tem oportunidade, mas não calcula ROI nem risco.',
]

const FERRAMENTAS = [
  { icon: Bot, t: 'Tomás — Vendedor com IA' },
  { icon: Globe, t: 'Site próprio em 24h' },
  { icon: BarChart3, t: 'CRM completo' },
  { icon: Gavel, t: 'Inteligência de leilões' },
  { icon: Megaphone, t: 'Marketing & SEO' },
  { icon: Banknote, t: 'Financeiro (LemosBank)' },
]

function SlideTag({ n }: { n: string }) {
  return <span className="absolute right-6 top-6 text-xs font-semibold tracking-widest opacity-40">{n}</span>
}

export default function PitchPage() {
  return (
    <main className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth">
      <Link
        href="/sistema"
        className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold shadow-lg backdrop-blur"
        style={{ color: NAVY }}
      >
        Ver planos →
      </Link>

      {/* 1 — CAPA */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, ${DARK})` }}>
        <SlideTag n="01" />
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold" style={{ color: GOLD }}>
          <Sparkles className="h-3.5 w-3.5" /> AgoraEncontrei
        </div>
        <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>
          O sistema que <span style={{ color: GOLD }}>vende por você</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/70">
          IA + Site + CRM + Leilões + Financeiro. Tudo num lugar só, nativo para o Brasil.
        </p>
        <ChevronDown className="absolute bottom-20 h-6 w-6 animate-bounce text-white/40" />
      </section>

      {/* 2 — PROBLEMA */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6" style={{ backgroundColor: CREAM }}>
        <SlideTag n="02" />
        <h2 className="mb-8 max-w-3xl text-center text-3xl font-bold sm:text-4xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
          Vender imóvel hoje é estar espalhado em 6 ferramentas que não conversam
        </h2>
        <ul className="max-w-2xl space-y-3">
          {DORES.map((d) => (
            <li key={d} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-gray-700">
              <span className="text-xl">⚠️</span> <span className="text-sm sm:text-base">{d}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 — SOLUÇÃO */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, ${DARK})` }}>
        <SlideTag n="03" />
        <h2 className="max-w-4xl text-3xl font-bold leading-snug sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>
          Um login. <span style={{ color: GOLD }}>Toda a operação.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-white/70">
          O AgoraEncontrei substitui de 5 a 7 ferramentas por uma só — mais barata que a soma das partes.
        </p>
      </section>

      {/* 4 — TOMÁS */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: CREAM }}>
        <SlideTag n="04" />
        <Bot className="mb-5 h-16 w-16" style={{ color: GOLD }} />
        <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Diferencial exclusivo</p>
        <h2 className="max-w-3xl text-3xl font-bold sm:text-5xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
          Um vendedor com IA que atende 24/7
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-gray-600">
          O Tomás qualifica o lead, manda o imóvel certo e agenda a visita — sozinho, enquanto você trabalha ou dorme.
        </p>
      </section>

      {/* 5 — LEILÕES */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, ${DARK})` }}>
        <SlideTag n="05" />
        <Gavel className="mb-5 h-16 w-16" style={{ color: GOLD }} />
        <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Ninguém mais tem</p>
        <h2 className="max-w-3xl text-3xl font-bold sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>
          Inteligência de leilões com ROI
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-white/70">
          Caixa, Santander, BB e leiloeiros num só lugar, com calculadora de retorno, score de oportunidade e alertas.
        </p>
      </section>

      {/* 6 — FERRAMENTAS */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6" style={{ backgroundColor: CREAM }}>
        <SlideTag n="06" />
        <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
          Tudo que vem dentro
        </h2>
        <div className="grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
          {FERRAMENTAS.map((f) => (
            <div key={f.t} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <f.icon className="h-8 w-8" style={{ color: NAVY }} />
              <span className="text-sm font-semibold" style={{ color: NAVY }}>{f.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7 — ECONOMIA */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, ${DARK})` }}>
        <SlideTag n="07" />
        <h2 className="mb-10 text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>A conta que faz dizer "sim"</h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <div className="rounded-2xl bg-white/5 px-8 py-6">
            <p className="text-xs uppercase tracking-widest text-white/50">Ferramentas avulsas</p>
            <p className="mt-2 text-4xl font-bold text-white/70 line-through">~R$ 900</p>
          </div>
          <ArrowRight className="h-8 w-8" style={{ color: GOLD }} />
          <div className="rounded-2xl px-8 py-6" style={{ backgroundColor: GOLD, color: '#000' }}>
            <p className="text-xs uppercase tracking-widest opacity-70">AgoraEncontrei</p>
            <p className="mt-2 text-4xl font-bold">R$ 297<span className="text-lg">/mês</span></p>
          </div>
        </div>
        <p className="mt-8 max-w-xl text-white/70">Um único imóvel vendido a mais no ano paga anos de assinatura.</p>
      </section>

      {/* 8 — PLANOS */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6" style={{ backgroundColor: CREAM }}>
        <SlideTag n="08" />
        <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>Planos</h2>
        <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {ALL_PLANS.map((p) => (
            <div key={p.key} className={`rounded-2xl border bg-white p-6 text-center ${p.highlighted ? 'border-[#C9A84C] ring-2 ring-[#C9A84C]/30' : 'border-gray-200'}`}>
              <h3 className="font-bold" style={{ color: NAVY }}>{p.name}</h3>
              <p className="my-2 text-2xl font-bold" style={{ color: NAVY }}>{p.price}</p>
              <p className="text-xs text-gray-500">{p.tagline}</p>
              {p.highlighted && (
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: GOLD }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mais escolhido
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9 — FECHAMENTO */}
      <section className="relative flex h-screen snap-start flex-col items-center justify-center px-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${NAVY}, ${DARK})` }}>
        <SlideTag n="09" />
        <h2 className="max-w-3xl text-4xl font-bold sm:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>
          Começamos <span style={{ color: GOLD }}>hoje?</span>
        </h2>
        <p className="mt-5 max-w-xl text-lg text-white/70">
          Pare de perder lead às 22h. Tenha um vendedor de IA trabalhando por você.
        </p>
        <Link href="/parceiros/planos" className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-black shadow-lg transition hover:opacity-90" style={{ backgroundColor: GOLD }}>
          Ver planos e começar <ArrowRight className="h-5 w-5" />
        </Link>
      </section>
    </main>
  )
}
