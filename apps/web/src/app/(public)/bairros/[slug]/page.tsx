import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FRANCA_NEIGHBORHOODS_SEO } from '@/data/seo-locations'
import { MapPin, Home, Building2, Search, Star, Phone, ArrowRight, CheckCircle2 } from 'lucide-react'

interface Props {
  params: { slug: string }
}

function getNeighborhood(slug: string) {
  return FRANCA_NEIGHBORHOODS_SEO.find(n => n.slug === slug)
}

export async function generateStaticParams() {
  return FRANCA_NEIGHBORHOODS_SEO.map(n => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const neighborhood = getNeighborhood(params.slug)
  if (!neighborhood) return {}

  const name = neighborhood.name
  const title = `Imóveis em ${name} — Franca/SP | Imobiliária Lemos`
  const description = `Encontre casas à venda, apartamentos para alugar e terrenos em ${name}, Franca/SP. Imobiliária Lemos — CRECI 279051. Mais de 20 anos de experiência no mercado imobiliário de Franca e região.`

  return {
    title,
    description,
    keywords: neighborhood.keywords.join(', '),
    alternates: {
      canonical: `https://www.agoraencontrei.com.br/bairros/${params.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.agoraencontrei.com.br/bairros/${params.slug}`,
      siteName: 'AgoraEncontrei | Imobiliária Lemos',
      locale: 'pt_BR',
      type: 'website',
    },
  }
}

export default function NeighborhoodPage({ params }: Props) {
  const neighborhood = getNeighborhood(params.slug)
  if (!neighborhood) notFound()

  const name = neighborhood.name
  const searchUrl = `/imoveis?neighborhood=${encodeURIComponent(name)}&city=Franca`

  // Schema.org para a página de bairro
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Imobiliária Lemos',
    description: `Imóveis à venda e para alugar em ${name}, Franca/SP`,
    url: `https://www.agoraencontrei.com.br/bairros/${params.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Franca',
      addressRegion: 'SP',
      addressCountry: 'BR',
      streetAddress: name,
    },
    areaServed: {
      '@type': 'Place',
      name: `${name}, Franca, SP`,
    },
    telephone: '+5516981010004',
    priceRange: 'R$ 150.000 - R$ 5.000.000',
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
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-400/70 text-sm mb-4">
              <Link href="/" className="hover:text-yellow-400">Início</Link>
              <span>/</span>
              <Link href="/bairros/franca" className="hover:text-yellow-400">Bairros de Franca</Link>
              <span>/</span>
              <span className="text-yellow-400">{name}</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-400/10 rounded-2xl mt-1">
                <MapPin className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Imóveis em <span className="text-yellow-400">{name}</span>
                </h1>
                <p className="text-white/70 text-lg max-w-2xl">
                  Encontre casas à venda, apartamentos para alugar, terrenos e imóveis comerciais
                  em {name}, Franca/SP. Imobiliária Lemos — CRECI 279051.
                </p>
              </div>
            </div>

            {/* CTA de busca */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={`${searchUrl}&transactionType=SALE`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors"
              >
                <Home className="h-5 w-5" />
                Imóveis à Venda em {name}
              </Link>
              <Link
                href={`${searchUrl}&transactionType=RENT`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20"
              >
                <Search className="h-5 w-5" />
                Imóveis para Alugar em {name}
              </Link>
            </div>
          </div>
        </section>

        {/* Conteúdo SEO */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coluna principal */}
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-yellow-400" />
                  Imóveis disponíveis em {name}
                </h2>
                <p className="text-white/70 leading-relaxed mb-4">
                  O bairro <strong className="text-white">{name}</strong> em Franca/SP oferece
                  excelentes opções de moradia e investimento. A Imobiliária Lemos possui
                  amplo portfólio de imóveis nesta região, incluindo casas residenciais,
                  apartamentos, terrenos e imóveis comerciais.
                </p>
                <p className="text-white/70 leading-relaxed mb-4">
                  Com mais de 20 anos de experiência no mercado imobiliário de Franca e região,
                  a Imobiliária Lemos é referência em compra, venda e locação de imóveis em
                  todos os bairros da cidade, incluindo {name}.
                </p>
                <Link
                  href={searchUrl}
                  className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                >
                  Ver todos os imóveis em {name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Tipos de imóveis */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Tipos de imóveis em {name}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Casas à venda', href: `${searchUrl}&type=HOUSE&transactionType=SALE` },
                    { label: 'Apartamentos à venda', href: `${searchUrl}&type=APARTMENT&transactionType=SALE` },
                    { label: 'Casas para alugar', href: `${searchUrl}&type=HOUSE&transactionType=RENT` },
                    { label: 'Apartamentos para alugar', href: `${searchUrl}&type=APARTMENT&transactionType=RENT` },
                    { label: 'Terrenos', href: `${searchUrl}&type=LAND` },
                    { label: 'Imóveis comerciais', href: `${searchUrl}&type=COMMERCIAL` },
                    { label: 'Sítios e chácaras', href: `${searchUrl}&type=RURAL` },
                    { label: 'Sobrados', href: `${searchUrl}&type=TOWNHOUSE` },
                  ].map(item => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white text-sm transition-colors border border-white/5"
                    >
                      <CheckCircle2 className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Card de contato */}
              <div className="bg-gradient-to-br from-[#1B2B5B] to-[#243670] border border-yellow-400/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-bold">Imobiliária Lemos</span>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  CRECI 279051 · Franca/SP · Mais de 20 anos de experiência
                </p>
                <a
                  href="https://wa.me/5516981010004"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  <Phone className="h-4 w-4" />
                  Falar no WhatsApp
                </a>
                <Link
                  href="/anunciar"
                  className="flex items-center justify-center gap-2 w-full py-3 mt-2 bg-yellow-400 hover:bg-yellow-300 text-[#1B2B5B] font-bold rounded-xl transition-colors text-sm"
                >
                  Anunciar meu imóvel
                </Link>
              </div>

              {/* Avaliação gratuita */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-2">Avaliação Gratuita</h3>
                <p className="text-white/60 text-sm mb-3">
                  Saiba quanto vale seu imóvel em {name} gratuitamente.
                </p>
                <Link
                  href="/avaliacao"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors text-sm border border-white/10"
                >
                  Avaliar meu imóvel
                </Link>
              </div>

              {/* Bairros próximos */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-3">Outros bairros de Franca</h3>
                <div className="space-y-1">
                  {FRANCA_NEIGHBORHOODS_SEO.slice(0, 8).filter(n => n.slug !== params.slug).slice(0, 6).map(n => (
                    <Link
                      key={n.slug}
                      href={`/bairros/${n.slug}`}
                      className="flex items-center gap-2 py-1.5 text-white/60 hover:text-yellow-400 text-sm transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {n.name}
                    </Link>
                  ))}
                  <Link
                    href="/bairros/franca"
                    className="flex items-center gap-2 py-1.5 text-yellow-400 hover:text-yellow-300 text-sm font-semibold transition-colors"
                  >
                    Ver todos os bairros →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
