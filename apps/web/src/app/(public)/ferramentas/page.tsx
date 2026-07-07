import type { Metadata } from 'next'
import Link from 'next/link'
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  Calculator,
  Camera,
  ClipboardCheck,
  FileSearch,
  Gavel,
  HeartHandshake,
  Landmark,
  Map,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ferramentas Imobiliarias | AgoraEncontrei',
  description:
    'Central de ferramentas do AgoraEncontrei para buscar, comparar, financiar, avaliar, documentar, reformar e contratar parceiros para o seu imovel.',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/ferramentas' },
  openGraph: {
    title: 'Ferramentas Imobiliarias | AgoraEncontrei',
    description:
      'Tudo para decidir melhor: busca inteligente, simuladores, documentacao, parceiros, leiloes e Tomas IA.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
}
const tools = [
  { title: 'Central do comprador', description: 'Jornada completa para buscar, comparar, financiar, visitar e comprar com seguranca.', href: '/central-do-comprador', icon: Search, tag: 'Compra' },
  { title: 'Central do proprietario', description: 'Avaliacao, fotos, documentos, anuncio e acompanhamento para vender ou alugar melhor.', href: '/central-do-proprietario', icon: BarChart3, tag: 'Venda' },
  { title: 'Tour inteligente por imagens', description: 'Visita guiada criada com fotos comuns, ambientes organizados e roteiro do Tomas.', href: '/servicos/tour-inteligente', icon: Camera, tag: 'Experiencia' },
  { title: 'Documentacao e cartorios', description: 'Checklist de compra, venda, matricula, escritura, registro, ITBI e certidoes.', href: '/servicos/documentacao-imobiliaria', icon: ClipboardCheck, tag: 'Seguranca' },
  { title: 'Simulacao de financiamento', description: 'Calcule entrada, parcela aproximada, custos de compra e renda estimada.', href: '/financiamentos', icon: Calculator, tag: 'Credito' },
  { title: 'Empresas parceiras', description: 'Arquitetos, engenheiros, reformas, seguros, despachantes e servicos locais.', href: '/empresas-parceiras', icon: HeartHandshake, tag: 'Parceiros' },
  { title: 'Guia de bairros', description: 'Conheca regioes, perfil do bairro, imoveis disponiveis e oportunidades locais.', href: '/bairros', icon: Map, tag: 'Cidade' },
  { title: 'Leiloes inteligentes', description: 'Analise desconto, risco, potencial de retorno e oportunidades de arrematacao.', href: '/leiloes', icon: Gavel, tag: 'Investimento' },
  { title: 'Alertas de oportunidades', description: 'Receba aviso quando surgir imovel no perfil, baixar preco ou entrar destaque.', href: '/alertas', icon: Bell, tag: 'Recorrencia' },
]

const journeys = [
  { title: 'Comprar com seguranca', icon: ShieldCheck, steps: ['Busca inteligente', 'Comparacao', 'Financiamento', 'Documentacao', 'Visita e proposta'] },
  { title: 'Vender melhor', icon: BarChart3, steps: ['Avaliacao', 'Checklist de fotos', 'Anuncio', 'Leads no CRM', 'Ajuste de preco'] },
  { title: 'Reformar ou construir', icon: Building2, steps: ['Diagnostico', 'Arquitetura', 'Engenharia', 'Orcamentos', 'Acompanhamento'] },
  { title: 'Investir em imoveis', icon: Landmark, steps: ['Yield', 'Leiloes', 'Bairros', 'Liquidez', 'Risco documental'] },
]

const integrations = [
  'WhatsApp Business e CRM',
  'Google Maps e camadas de bairro',
  'Cartorios, despachantes e certidoes',
  'Correspondentes bancarios',
  'Assinatura digital',
  'Meta Pixel, Analytics e Search Console',
  'Agenda de visitas',
  'Tomas IA contextual',
]

export default function FerramentasPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed]">
      <section className="bg-[#073d1f] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d2ad43]/40 bg-white/10 px-3 py-1 text-sm font-semibold text-[#f2d47a]">
              <Sparkles className="h-4 w-4" />
              Central de decisao imobiliaria
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>
              Ferramentas para resolver toda a jornada do imovel.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              Busca, financiamento, documentacao, parceiros, leiloes, bairros e Tomas IA em uma experiencia unica para compradores,
              proprietarios, investidores, corretores e empresas parceiras.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/imoveis" className="rounded-xl bg-[#d2ad43] px-5 py-3 text-center text-sm font-bold text-[#092715] transition hover:brightness-110">
                Buscar imoveis
              </Link>
              <Link href="/empresas-parceiras" className="rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10">
                Ver parceiros
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href} className="group flex h-full flex-col rounded-lg border border-[#e5ddcc] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#073d1f]/10 text-[#073d1f]">
                  <tool.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[#f2ead5] px-2.5 py-1 text-xs font-bold text-[#8a6a10]">{tool.tag}</span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>{tool.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{tool.description}</p>
              <span className="mt-4 text-sm font-bold text-[#0a7a3d] transition group-hover:text-[#073d1f]">Acessar ferramenta</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-[#e5ddcc] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-[#d2ad43]" />
              <h2 className="text-2xl font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>Tomas IA em cada decisao</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A proxima camada do AgoraEncontrei e fazer o Tomas entender onde o usuario esta: imovel, bairro, parceiro,
              financiamento, leilao ou documentacao. Assim cada pergunta vira orientacao, lead rastreavel e proxima acao no CRM.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['Esse imovel combina comigo?', 'Quanto preciso de entrada?', 'Preciso de arquiteto ou engenheiro?', 'Quais documentos faltam?'].map((prompt) => (
                <div key={prompt} className="rounded-lg bg-[#f7f4ed] px-4 py-3 text-sm font-semibold text-[#073d1f]">{prompt}</div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#e5ddcc] bg-[#073d1f] p-6 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <FileSearch className="h-6 w-6 text-[#f2d47a]" />
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Integracoes prioritarias</h2>
            </div>
            <div className="mt-5 grid gap-2">
              {integrations.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm">
                  <Scale className="h-4 w-4 text-[#f2d47a]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {journeys.map((journey) => (
            <div key={journey.title} className="rounded-lg border border-[#e5ddcc] bg-white p-5 shadow-sm">
              <journey.icon className="h-6 w-6 text-[#d2ad43]" />
              <h3 className="mt-3 text-lg font-bold text-[#073d1f]" style={{ fontFamily: 'Georgia, serif' }}>{journey.title}</h3>
              <ol className="mt-4 space-y-2">
                {journey.steps.map((step, index) => (
                  <li key={step} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#073d1f] text-xs font-bold text-white">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
