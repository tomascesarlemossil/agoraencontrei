import type { Metadata } from 'next'
import Link from 'next/link'
import { FRANCA_NEIGHBORHOODS_SEO } from '@/data/seo-locations'
import { MapPin, Home, Search, ArrowRight, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bairros de Franca/SP — Imóveis por Bairro | Imobiliária Lemos',
  description: 'Encontre imóveis à venda e para alugar em todos os bairros de Franca/SP. Casas, apartamentos, terrenos e imóveis comerciais em mais de 300 bairros. Imobiliária Lemos.',
  keywords: [
    'bairros franca sp', 'imóveis por bairro franca sp', 'bairros de franca sp',
    'imóveis franca bairros', 'casas por bairro franca', 'apartamentos por bairro franca',
    'imobiliária franca sp bairros', 'todos os bairros de franca sp',
    'mapa de bairros franca sp', 'bairros residenciais franca sp',
  ].join(', '),
  alternates: {
    canonical: 'https://www.agoraencontrei.com.br/bairros/franca',
  },
  openGraph: {
    title: 'Bairros de Franca/SP — Imóveis por Bairro | Imobiliária Lemos',
    description: 'Encontre imóveis à venda e para alugar em todos os bairros de Franca/SP.',
    url: 'https://www.agoraencontrei.com.br/bairros/franca',
    siteName: 'AgoraEncontrei | Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
  },
}

// Agrupar bairros por letra inicial
function groupByLetter(items: typeof FRANCA_NEIGHBORHOODS_SEO) {
  const groups: Record<string, typeof FRANCA_NEIGHBORHOODS_SEO> = {}
  for (const item of items) {
    const letter = item.name[0].toUpperCase()
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(item)
  }
  return groups
}

export default function FrancaNeighborhoodsPage() {
  const sorted = [...FRANCA_NEIGHBORHOODS_SEO].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const groups = groupByLetter(sorted)
  const letters = Object.keys(groups).sort()

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Bairros de Franca/SP',
    description: 'Lista de todos os bairros de Franca/SP com imóveis disponíveis',
    numberOfItems: sorted.length,
    itemListElement: sorted.slice(0, 50).map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: n.name,
      url: `https://www.agoraencontrei.com.br/bairros/${n.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <main className="min-h-screen bg-[#0f1a35]">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1a35] py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-400/70 text-sm mb-4">
              <Link href="/" className="hover:text-yellow-400">Início</Link>
              <span>/</span>
              <span className="text-yellow-400">Bairros de Franca/SP</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-2xl mt-1">
                <MapPin className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Imóveis por Bairro em <span className="text-yellow-400">Franca/SP</span>
                </h1>
                <p className="text-white/70 text-lg max-w-3xl">
                  Explore imóveis à venda e para alugar em todos os {sorted.length} bairros de Franca/SP.
                  A Imobiliária Lemos atua em toda a cidade há mais de 20 anos.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Bairros cobertos', value: `${sorted.length}+` },
                { label: 'Imóveis disponíveis', value: '1.000+' },
                { label: 'Anos de experiência', value: '20+' },
                { label: 'CRECI', value: '279051' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stat.value}</div>
                  <div className="text-white/60 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Busca rápida */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/imoveis?city=Franca&transactionType=SALE"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors"
              >
                <Home className="h-5 w-5" />
                Ver imóveis à venda em Franca
              </Link>
              <Link
                href="/imoveis?city=Franca&transactionType=RENT"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20"
              >
                <Search className="h-5 w-5" />
                Ver imóveis para alugar em Franca
              </Link>
            </div>
          </div>
        </section>

        {/* Índice de letras */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-2">
            {letters.map(letter => (
              <a
                key={letter}
                href={`#letra-${letter}`}
                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 rounded-lg text-white/70 hover:text-yellow-400 font-bold text-sm transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
        </section>

        {/* Lista de bairros por letra */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          {letters.map(letter => (
            <div key={letter} id={`letra-${letter}`} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                  <span className="text-[#1B2B5B] font-bold text-lg">{letter}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{letter}</h2>
                <span className="text-white/40 text-sm">({groups[letter].length} bairros)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {groups[letter].map(n => (
                  <Link
                    key={n.slug}
                    href={`/bairros/${n.slug}`}
                    className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-yellow-400/30 rounded-xl text-white/70 hover:text-white text-sm transition-all group"
                  >
                    <MapPin className="h-3.5 w-3.5 text-yellow-400/60 group-hover:text-yellow-400 flex-shrink-0" />
                    <span className="truncate">{n.name}</span>
                    <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 text-yellow-400 flex-shrink-0 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* CTA final */}
        <section className="bg-gradient-to-r from-[#1B2B5B] to-[#243670] py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Building2 className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Não encontrou seu bairro?
            </h2>
            <p className="text-white/70 mb-6">
              A Imobiliária Lemos atua em toda Franca/SP e região. Entre em contato e encontraremos
              o imóvel ideal para você, em qualquer bairro da cidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/5516981010004"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors"
              >
                Falar no WhatsApp
              </a>
              <Link
                href="/anunciar"
                className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors"
              >
                Anunciar meu imóvel
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
