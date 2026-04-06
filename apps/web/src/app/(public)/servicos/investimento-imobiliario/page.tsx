import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, CheckCircle2, Phone, DollarSign, Shield, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Investimento Imobiliário em Franca/SP — Renda Passiva | Imobiliária Lemos',
  description: 'Invista em imóveis em Franca/SP com segurança e rentabilidade. Imóveis para renda passiva, comprar para alugar, imóveis comerciais e loteamentos. Imobiliária Lemos — CRECI 279051.',
  keywords: [
    'investimento imobiliário franca sp', 'investir em imóveis franca sp',
    'imóvel para investimento franca', 'renda passiva imóveis franca sp',
    'imóvel para renda franca sp', 'retorno investimento imóvel franca',
    'imóvel comercial para investir franca', 'comprar imóvel para alugar franca',
    'imóvel rentabilidade franca sp', 'investimento seguro imóvel franca',
    'imóvel como investimento franca sp', 'melhor investimento franca sp',
    'imóvel renda passiva franca', 'investir imóvel franca sp',
  ].join(', '),
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/investimento-imobiliario' },
  openGraph: {
    title: 'Investimento Imobiliário em Franca/SP — Renda Passiva',
    description: 'Invista em imóveis em Franca/SP com segurança e rentabilidade. Assessoria especializada.',
    url: 'https://www.agoraencontrei.com.br/servicos/investimento-imobiliario',
    siteName: 'AgoraEncontrei | Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
  },
}

const faqItems = [
  { q: 'Qual é o retorno médio de imóveis para aluguel em Franca/SP?', a: 'O retorno médio de imóveis para locação em Franca/SP varia entre 0,4% e 0,7% ao mês, dependendo do tipo e localização do imóvel.' },
  { q: 'Qual é o melhor tipo de imóvel para investir em Franca?', a: 'Apartamentos próximos a universidades (UNIFRAN, UNIFACEF) e imóveis comerciais no centro têm alta demanda. Terrenos em condomínios fechados também são ótimas opções.' },
  { q: 'Vocês administram o imóvel após a compra?', a: 'Sim! A Imobiliária Lemos oferece administração completa: seleção de inquilinos, cobrança de aluguel, manutenção e gestão de contratos.' },
  { q: 'Qual o valor mínimo para investir em imóveis em Franca?', a: 'É possível encontrar imóveis para investimento a partir de R$ 150.000. Entre em contato e apresentaremos as melhores oportunidades para o seu perfil.' },
]

export default function InvestimentoImobiliarioPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <main className="min-h-screen bg-[#0f1a35]">
        <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1a35] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-400/70 text-sm mb-4">
              <Link href="/" className="hover:text-yellow-400">Início</Link>
              <span>/</span>
              <Link href="/servicos" className="hover:text-yellow-400">Serviços</Link>
              <span>/</span>
              <span className="text-yellow-400">Investimento Imobiliário</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-2xl mt-1">
                <TrendingUp className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  <span className="text-yellow-400">Investimento Imobiliário</span> em Franca/SP
                </h1>
                <p className="text-white/70 text-lg max-w-2xl">
                  Invista em imóveis em Franca/SP com segurança, rentabilidade e assessoria especializada.
                  Renda passiva, valorização e patrimônio sólido.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <a href="https://wa.me/5516981010004?text=Olá! Gostaria de saber mais sobre investimento imobiliário em Franca/SP."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors">
                <Phone className="h-5 w-5" /> Consultar oportunidades
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: DollarSign, title: 'Renda Passiva', desc: 'Imóveis para locação gerando renda mensal de 0,4% a 0,7% do valor investido.' },
              { icon: TrendingUp, title: 'Valorização', desc: 'Franca/SP apresenta valorização imobiliária consistente, especialmente em condomínios fechados.' },
              { icon: Shield, title: 'Segurança', desc: 'Imóvel é o investimento mais seguro: não desvaloriza, protege contra inflação e gera renda.' },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <item.icon className="h-8 w-8 text-yellow-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Melhores opções de investimento em Franca/SP</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Apartamentos próximos a universidades', 'Imóveis comerciais no centro',
                'Terrenos em condomínios fechados', 'Casas para locação familiar',
                'Imóveis para locação por temporada', 'Galpões e barracões industriais',
                'Lotes em loteamentos novos', 'Imóveis em leilão abaixo do mercado',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-white/70 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Perguntas Frequentes</h2>
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <div key={i} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <h3 className="text-white font-semibold mb-2">{item.q}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
