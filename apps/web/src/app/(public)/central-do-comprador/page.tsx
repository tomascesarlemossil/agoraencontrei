import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bell, Bot, Calculator, CheckCircle2, ClipboardCheck, Columns2, Home, Map, MessageCircle, Search, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Central do Comprador | AgoraEncontrei',
  description: 'Uma jornada completa para buscar, comparar, financiar, visitar, documentar e comprar imoveis com apoio do Tomas IA.',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/central-do-comprador' },
}

const steps = [
  { title: 'Definir perfil', text: 'Cidade, bairro, entrada, parcela, tipo de imovel e rotina da familia.', icon: Search, href: '/imoveis' },
  { title: 'Comparar opcoes', text: 'Compare preco, metragem, bairro, garagem, IPTU, condominio e custo-beneficio.', icon: Columns2, href: '/comparar' },
  { title: 'Simular custos', text: 'Entrada, financiamento, ITBI, escritura, registro e custo total de compra.', icon: Calculator, href: '/financiamentos' },
  { title: 'Visitar com roteiro', text: 'Perguntas certas para visita, pontos de atencao e apoio do corretor.', icon: Home, href: '/imoveis' },
  { title: 'Checar documentos', text: 'Matricula, certidoes, contrato, financiamento e regularizacao.', icon: ClipboardCheck, href: '/servicos/documentacao-imobiliaria' },
  { title: 'Fechar com seguranca', text: 'Proposta, negociacao, contrato, cartorio e acompanhamento ate a entrega.', icon: ShieldCheck, href: '/contato' },
]

const prompts = [
  'Tenho 80 mil de entrada e posso pagar 2.500 por mes. O que consigo comprar?',
  'Compare estes imoveis e me diga qual tem melhor custo-beneficio.',
  'Quais documentos preciso pedir antes de fazer proposta?',
  'Esse bairro combina com familia e escola perto?',
]

export default function CentralDoCompradorPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed]">
      <section className="bg-[#073d1f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-[#f2d47a]"><CheckCircle2 className="h-4 w-4" /> Jornada do comprador</span>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>Compre melhor, com dados, comparacao e apoio do Tomas.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">A Central do Comprador organiza todos os passos: busca inteligente, comparador, financiamento, visita, documentacao e proposta.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/imoveis" className="rounded-xl bg-[#d2ad43] px-5 py-3 text-center text-sm font-bold text-[#092715]">Buscar imoveis</Link>
            <Link href="/comparar" className="rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-bold text-white">Comparar favoritos</Link>
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
            <div className="flex items-center gap-3"><Bot className="h-6 w-6 text-[#d2ad43]" /><h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Pergunte ao Tomas como comprador</h2></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {prompts.map((prompt) => <div key={prompt} className="rounded-lg bg-[#f7f4ed] px-4 py-3 text-sm font-semibold text-[#073d1f]">{prompt}</div>)}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5ddcc] bg-[#073d1f] p-6 text-white shadow-sm">
            <Map className="h-6 w-6 text-[#f2d47a]" />
            <h2 className="mt-3 text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Alertas que trazem o usuario de volta</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">Salve buscas e avise quando entrar imovel no perfil, baixar preco, surgir destaque no bairro ou aparecer oportunidade de leilao.</p>
            <Link href="/alertas" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d2ad43] px-5 py-3 text-sm font-bold text-[#092715]"><Bell className="h-4 w-4" /> Criar alerta</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-lg bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><MessageCircle className="mt-1 h-6 w-6 text-[#d2ad43]" /><div><h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Cada duvida vira lead qualificado.</h2><p className="mt-2 text-sm text-slate-600">Origem, bairro, faixa de preco e imoveis comparados devem alimentar o CRM.</p></div></div>
          <Link href="/contato" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073d1f] px-5 py-3 text-sm font-bold text-white sm:mt-0">Falar com especialista <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  )
}
