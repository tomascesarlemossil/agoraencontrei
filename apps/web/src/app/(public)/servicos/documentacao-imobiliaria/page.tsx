import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle2, ClipboardList, FileCheck2, Landmark, Scale, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentacao Imobiliaria e Cartorios | AgoraEncontrei',
  description: 'Checklist de documentos, custos de cartorio, ITBI, escritura, registro e apoio para regularizacao de imoveis.',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/documentacao-imobiliaria' },
}

const checklists = [
  { title: 'Compra', items: ['Matricula atualizada', 'Certidoes do vendedor', 'Contrato', 'ITBI', 'Escritura e registro'] },
  { title: 'Venda', items: ['Documentos pessoais', 'IPTU', 'Habite-se quando aplicavel', 'Certidoes', 'Dados bancarios e proposta'] },
  { title: 'Financiamento', items: ['Renda comprovada', 'Entrada', 'Analise bancaria', 'Laudo do imovel', 'Registro do contrato'] },
]

const partners = ['Cartorio', 'Despachante', 'Advogado imobiliario', 'Topografia', 'Engenharia', 'Correspondente bancario']

export default function DocumentacaoImobiliariaPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed]">
      <section className="bg-[#073d1f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-[#f2d47a]"><ShieldCheck className="h-4 w-4" /> Central documental</span>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>Documentacao, cartorio e regularizacao em um so caminho.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">Organize documentos, custos e parceiros para comprar, vender, financiar ou regularizar imoveis com mais seguranca.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {checklists.map((list) => (
            <div key={list.title} className="rounded-lg border border-[#e5ddcc] bg-white p-6 shadow-sm">
              <ClipboardList className="h-6 w-6 text-[#d2ad43]" />
              <h2 className="mt-3 text-xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Checklist de {list.title}</h2>
              <div className="mt-5 space-y-2">
                {list.items.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="h-4 w-4 text-[#0a7a3d]" />{item}</div>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-lg border border-[#e5ddcc] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><FileCheck2 className="h-6 w-6 text-[#d2ad43]" /><h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Status documental do imovel</h2></div>
            <p className="mt-3 text-sm leading-6 text-slate-600">A estrutura fica pronta para marcar cada imovel como documentacao ok, pendente, em analise, aceita financiamento ou precisa regularizar.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['Documentacao ok', 'Pendente', 'Em analise', 'Aceita financiamento'].map((item) => <div key={item} className="rounded-lg bg-[#f7f4ed] px-4 py-3 text-sm font-bold text-[#073d1f]">{item}</div>)}
            </div>
          </div>
          <div className="rounded-lg border border-[#e5ddcc] bg-[#073d1f] p-6 text-white shadow-sm">
            <div className="flex items-center gap-3"><Scale className="h-6 w-6 text-[#f2d47a]" /><h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Parceiros integraveis</h2></div>
            <div className="mt-5 grid gap-2">
              {partners.map((item) => <div key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"><Landmark className="h-4 w-4 text-[#f2d47a]" />{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-lg bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><Building2 className="mt-1 h-6 w-6 text-[#d2ad43]" /><div><h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Transforme duvida em lead qualificado.</h2><p className="mt-2 text-sm text-slate-600">Cada solicitacao documental pode ir para CRM, corretor, despachante ou advogado parceiro.</p></div></div>
          <Link href="/contato" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#073d1f] px-5 py-3 text-sm font-bold text-white sm:mt-0">Solicitar analise <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  )
}
