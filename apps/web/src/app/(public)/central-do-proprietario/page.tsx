import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BarChart3, Bot, Camera, CheckCircle2, ClipboardCheck, FileText, Home, LineChart, Megaphone, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Central do Proprietario | AgoraEncontrei',
  description: 'Ferramentas para avaliar, preparar, anunciar, documentar e acompanhar a venda ou locacao do seu imovel.',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/central-do-proprietario' },
}

const steps = [
  { title: 'Avaliar o imovel', text: 'Estimativa inicial, avaliacao profissional e comparacao com imoveis parecidos.', icon: BarChart3, href: '/avaliacao' },
  { title: 'Preparar fotos', text: 'Checklist visual, edicao de fotos, video e tour inteligente para melhorar conversao.', icon: Camera, href: '/servicos/fotos-imoveis' },
  { title: 'Regularizar documentos', text: 'Organize matricula, IPTU, certidoes, habite-se e pendencias antes da proposta.', icon: ClipboardCheck, href: '/servicos/documentacao-imobiliaria' },
  { title: 'Anunciar gratis', text: 'Publique seu imovel e receba leads com rastreio de origem e interesse.', icon: Megaphone, href: '/anunciar-gratis' },
  { title: 'Escolher atendimento', text: 'Direcionar para corretor, imobiliaria, parceiro ou atendimento do Tomas.', icon: Users, href: '/corretores' },
  { title: 'Acompanhar resultado', text: 'Visualizacoes, contatos, propostas, ajustes de preco e proximas acoes no CRM.', icon: LineChart, href: '/meu-painel' },
]

const diagnostics = [
  'Preco acima, dentro ou abaixo da media do bairro',
  'Fotos que precisam melhorar antes de anunciar',
  'Documentos que podem travar financiamento',
  'Servicos parceiros para valorizar antes da venda',
]

export default function CentralDoProprietarioPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed]">
      <section className="bg-[#073d1f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-[#f2d47a]"><Sparkles className="h-4 w-4" /> Jornada do proprietario</span>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>Venda ou alugue com preco, apresentacao e documentos no lugar.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">A Central do Proprietario transforma avaliacao, anuncio, fotos, documentacao e acompanhamento em um fluxo simples e rastreavel.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/avaliacao" className="rounded-xl bg-[#d2ad43] px-5 py-3 text-center text-sm font-bold text-[#092715]">Avaliar meu imovel</Link>
            <Link href="/anunciar-gratis" className="rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-bold text-white">Anunciar gratis</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Link key={step.title} href={step.href} className="group rounded-lg border border-[#e5ddcc] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#073d1f]/10 text-[#073d1f]"><step.icon className="h-5 w-5" /></div>
                <span className="rounded-full bg-[#f2ead5] px-2.5 py-1 text-xs font-bold text-[#8a6a10]">{index + 1}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#0a7a3d]">Avancar <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-lg border border-[#e5ddcc] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Bot className="h-6 w-6 text-[#d2ad43]" /><h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Diagnostico do Tomas para vender melhor</h2></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {diagnostics.map((item) => <div key={item} className="flex items-start gap-2 rounded-lg bg-[#f7f4ed] px-4 py-3 text-sm font-semibold text-[#073d1f]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0a7a3d]" />{item}</div>)}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5ddcc] bg-[#073d1f] p-6 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6 text-[#f2d47a]" />
            <h2 className="mt-3 text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Lead e confianca no mesmo fluxo</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">Cada avaliacao, checklist, foto editada, documento e contato deve alimentar o CRM com origem e proxima acao.</p>
            <Link href="/servicos/documentacao-imobiliaria" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d2ad43] px-5 py-3 text-sm font-bold text-[#092715]"><FileText className="h-4 w-4" /> Ver documentos</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-lg bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><Home className="mt-1 h-6 w-6 text-[#d2ad43]" /><div><h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>O proprietario precisa enxergar progresso.</h2><p className="mt-2 text-sm text-slate-600">A proxima evolucao e um painel com visualizacoes, interessados, propostas e sugestoes de ajuste.</p></div></div>
          <Link href="/meu-painel" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073d1f] px-5 py-3 text-sm font-bold text-white sm:mt-0">Abrir painel <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  )
}
