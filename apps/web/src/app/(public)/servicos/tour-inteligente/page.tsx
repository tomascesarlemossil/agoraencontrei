import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bot, Camera, CheckCircle2, Images, MessageCircle, Play, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tour Inteligente por Imagens | AgoraEncontrei',
  description: 'Crie uma visita guiada do imovel usando fotos comuns, roteiro do Tomas IA, ambientes organizados e CTAs de atendimento.',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/tour-inteligente' },
}

const flow = [
  'Fotos do imovel entram no cadastro',
  'Ambientes sao organizados por fachada, sala, cozinha, quartos e lazer',
  'O Tomas cria uma narrativa segura sem inventar dados',
  'O visitante navega em tela cheia e chama o corretor no momento certo',
]

const features = [
  'Sequencia guiada por ambiente',
  'Legendas comerciais revisaveis',
  'Botao para perguntar ao Tomas sobre o imovel',
  'WhatsApp e agendamento de visita dentro do tour',
  'Fallback bonito quando ha poucas imagens',
  'Preparado para evoluir para video curto e narração',
]

export default function TourInteligentePage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed]">
      <section className="bg-[#073d1f] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-[#f2d47a]"><Sparkles className="h-4 w-4" /> Visita Guiada pelo Tomas</span>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>Tour virtual criado apenas com imagens.</h1>
            <p className="mt-5 text-base leading-7 text-white/80">Transforme fotos comuns em uma experiencia de visita organizada, com narrativa, proximo ambiente e captura de lead sem exigir camera 360.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/imoveis" className="rounded-xl bg-[#d2ad43] px-5 py-3 text-center text-sm font-bold text-[#092715]">Ver imoveis</Link>
              <Link href="/seja-parceiro" className="rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-bold text-white">Oferecer no meu site</Link>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-4 shadow-2xl">
            <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-[#193f2a] via-[#0b2818] to-[#d2ad43] p-5">
              <div className="flex h-full flex-col justify-between rounded-lg border border-white/15 bg-black/20 p-4">
                <div className="flex items-center justify-between text-sm font-bold"><span>Sala integrada</span><span>1 / 8</span></div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20"><Play className="h-9 w-9 text-white" /></div>
                <div className="rounded-lg bg-white/90 p-3 text-sm font-semibold text-[#073d1f]">Ambiente amplo, ideal para receber familia e avaliar iluminacao natural.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-[#e5ddcc] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Images className="h-6 w-6 text-[#d2ad43]" /><h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Fluxo de criacao</h2></div>
            <ol className="mt-5 space-y-3">
              {flow.map((item, index) => <li key={item} className="flex gap-3 text-sm text-slate-700"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#073d1f] text-xs font-bold text-white">{index + 1}</span>{item}</li>)}
            </ol>
          </div>
          <div className="rounded-lg border border-[#e5ddcc] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Bot className="h-6 w-6 text-[#d2ad43]" /><h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Recursos previstos</h2></div>
            <div className="mt-5 grid gap-2">
              {features.map((item) => <div key={item} className="flex items-center gap-2 rounded-lg bg-[#f7f4ed] px-3 py-2 text-sm font-medium text-[#073d1f]"><CheckCircle2 className="h-4 w-4 text-[#0a7a3d]" />{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-lg bg-[#073d1f] p-6 text-white sm:flex sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Pronto para virar diferencial comercial.</h2><p className="mt-2 text-sm text-white/75">Corretores e parceiros podem vender melhor sem custo de producao 360 no primeiro momento.</p></div>
          <Link href="/servicos/edicao-fotos" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d2ad43] px-5 py-3 text-sm font-bold text-[#092715] sm:mt-0">Preparar fotos <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  )
}
