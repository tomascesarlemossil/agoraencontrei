import type { Metadata } from 'next'
import Link from 'next/link'
import { Gavel, CheckCircle2, Phone, AlertTriangle, TrendingDown, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Leilão de Imóveis em Franca/SP — Arrematação | Imobiliária Lemos',
  description: 'Imóveis em leilão em Franca/SP. Arrematação judicial e extrajudicial, imóveis retomados por banco, oportunidades de compra abaixo do mercado. Imobiliária Lemos — CRECI 279051.',
  keywords: [
    'leilão de imóveis franca sp', 'imóvel em leilão franca sp', 'arrematação imóvel franca',
    'leilão judicial imóvel franca', 'leilão extrajudicial imóvel franca', 'imóvel leilão franca',
    'comprar imóvel leilão franca', 'arrematação leilão franca sp', 'leilão imóvel barato franca',
    'imóvel retomado banco franca sp', 'imóvel leilão caixa franca sp',
    'oportunidade imóvel franca sp', 'imóvel abaixo mercado franca',
  ].join(', '),
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/leilao-imoveis' },
  openGraph: {
    title: 'Leilão de Imóveis em Franca/SP — Arrematação',
    description: 'Imóveis em leilão judicial e extrajudicial em Franca/SP. Oportunidades abaixo do mercado.',
    url: 'https://www.agoraencontrei.com.br/servicos/leilao-imoveis',
    siteName: 'AgoraEncontrei | Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
  },
}

const faqItems = [
  { q: 'O que é leilão judicial de imóveis?', a: 'É a venda de imóveis determinada por ordem judicial, geralmente em processos de execução de dívidas. Os imóveis são vendidos abaixo do valor de mercado.' },
  { q: 'Posso comprar um imóvel em leilão com financiamento?', a: 'Sim, em alguns casos é possível financiar imóveis de leilão, especialmente os da Caixa Econômica Federal. Entre em contato para verificar as condições.' },
  { q: 'Quais são os riscos de comprar imóvel em leilão?', a: 'Os principais riscos incluem dívidas pendentes (IPTU, condomínio), ocupação do imóvel e questões jurídicas. Por isso é fundamental contar com assessoria especializada.' },
  { q: 'A Imobiliária Lemos oferece assessoria para leilões?', a: 'Sim! Oferecemos assessoria completa: análise do imóvel, verificação de dívidas, acompanhamento no leilão e suporte pós-arrematação.' },
]

export default function LeilaoImoveisPage() {
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
              <span className="text-yellow-400">Leilão de Imóveis</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-2xl mt-1">
                <Gavel className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  <span className="text-yellow-400">Leilão de Imóveis</span> em Franca/SP
                </h1>
                <p className="text-white/70 text-lg max-w-2xl">
                  Imóveis em leilão judicial e extrajudicial em Franca/SP. Oportunidades de compra
                  abaixo do valor de mercado com assessoria especializada.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <a href="https://wa.me/5516981010004?text=Olá! Gostaria de saber mais sobre imóveis em leilão em Franca/SP."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors">
                <Phone className="h-5 w-5" /> Consultar imóveis em leilão
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: TrendingDown, title: 'Abaixo do Mercado', desc: 'Imóveis em leilão podem ser adquiridos por 30% a 60% abaixo do valor de mercado.' },
              { icon: Shield, title: 'Assessoria Completa', desc: 'Acompanhamento jurídico e imobiliário em todo o processo de arrematação.' },
              { icon: AlertTriangle, title: 'Segurança', desc: 'Análise prévia de dívidas, ocupação e situação jurídica do imóvel antes do leilão.' },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <item.icon className="h-8 w-8 text-yellow-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Tipos de leilão que assessoramos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Leilão judicial (execução de dívidas)', 'Leilão extrajudicial',
                'Imóveis retomados pela Caixa', 'Imóveis retomados por bancos',
                'Leilão de inventário', 'Leilão de falência',
                'Imóveis da Prefeitura', 'Imóveis do Estado de SP',
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
