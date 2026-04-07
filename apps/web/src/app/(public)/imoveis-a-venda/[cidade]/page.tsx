import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Home, Search, MessageCircle, Building, TrendingUp } from 'lucide-react'
import { UNIQUE_CITIES, PROPERTY_TYPES } from '@/data/seo-cities'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const WEB_URL = 'https://www.agoraencontrei.com.br'

export const revalidate = 86400

// ISR: gera on-demand, sem buildar 40k páginas de uma vez
// generateStaticParams removido para suportar qualquer cidade dinamicamente

export async function generateMetadata({ params }: { params: { cidade: string } }): Promise<Metadata> {
  const city = UNIQUE_CITIES.find(c => c.slug === params.cidade)
  if (!city) return { title: 'Imóveis à Venda | AgoraEncontrei' }
  return {
    title: `Imóveis à Venda em ${city.name}/${city.state} — Casas, Apartamentos e Terrenos | AgoraEncontrei`,
    description: `Encontre imóveis à venda em ${city.name}/${city.state}. Casas, apartamentos, terrenos e leilões com até 50% de desconto. Marketplace imobiliário #1 do Brasil.`,
    keywords: [`imóveis à venda ${city.name.toLowerCase()}`, `casas à venda ${city.name.toLowerCase()} ${city.state.toLowerCase()}`, `apartamentos ${city.name.toLowerCase()}`, `terrenos ${city.name.toLowerCase()}`, `comprar imóvel ${city.name.toLowerCase()}`],
    openGraph: { title: `Imóveis à Venda em ${city.name}/${city.state} | AgoraEncontrei`, description: `Casas, apartamentos e terrenos à venda em ${city.name}.`, type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei' },
    alternates: { canonical: `${WEB_URL}/imoveis-a-venda/${params.cidade}` },
  }
}

async function fetchProps(cityName: string) {
  try {
    const r = await fetch(`${API_URL}/api/v1/public/properties?city=${encodeURIComponent(cityName)}&purpose=SALE&limit=12`, { next: { revalidate: 3600 } })
    if (r.ok) { const d = await r.json(); return d.data || [] }
  } catch {} return []
}

function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) }

export default async function VendaCidadePage({ params }: { params: { cidade: string } }) {
  const city = UNIQUE_CITIES.find(c => c.slug === params.cidade)
  if (!city) return <div className="min-h-screen flex items-center justify-center"><h1 className="text-xl">Cidade não encontrada</h1></div>
  const properties = await fetchProps(city.name)
  const nearby = UNIQUE_CITIES.filter(c => c.stateSlug === city.stateSlug && c.slug !== city.slug).slice(0, 8)

  const schema = { '@context': 'https://schema.org', '@type': 'ItemList', name: `Imóveis à Venda em ${city.name}/${city.state}`, url: `${WEB_URL}/imoveis-a-venda/${params.cidade}`, numberOfItems: properties.length }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5"><Link href="/" className="hover:text-white">Início</Link> <span>/</span> <Link href="/imoveis" className="hover:text-white">Imóveis</Link> <span>/</span> <span>{city.name}/{city.state}</span></nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Imóveis à Venda em <span style={{ color: '#C9A84C' }}>{city.name}/{city.state}</span></h1>
          <p className="text-white/70 text-lg mb-6">{properties.length > 0 ? `${properties.length}+ imóveis disponíveis` : 'Imóveis disponíveis'} para compra em {city.name}.</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/imoveis?city=${city.name}&purpose=SALE`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: '#C9A84C', color: '#1B2B5B' }}><Search className="w-4 h-4" /> Buscar</Link>
            <Link href={`/leilao-imoveis-em/${params.cidade}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">🏛️ Leilões</Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Tipos */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PROPERTY_TYPES.map(t => (
            <Link key={t.slug} href={`/imoveis?city=${city.name}&type=${t.type}&purpose=SALE`} className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition text-sm font-medium text-gray-700">{t.label}</Link>
          ))}
        </div>

        {/* Properties */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p: any) => (
              <Link key={p.id} href={`/imoveis/${p.slug}`} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition">
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {p.coverImage && !p.coverImage.includes('telefone') ? <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" loading="lazy" /> : <Home className="w-8 h-8 text-gray-300" />}
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm text-gray-800 line-clamp-2">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-1"><MapPin className="w-3 h-3 inline" /> {p.neighborhood}, {city.name}</p>
                  <p className="font-bold text-base mt-2" style={{ color: '#1B2B5B' }}>{p.price ? fmt(Number(p.price)) : 'Consulte'}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Building className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Nenhum imóvel à venda em {city.name} no momento.</p>
            <Link href="/imoveis" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#1B2B5B' }}>Ver todos os imóveis</Link>
          </div>
        )}

        {/* Nearby cities */}
        {nearby.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Imóveis em cidades próximas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {nearby.map(c => (
                <Link key={c.slug} href={`/imoveis-a-venda/${c.slug}`} className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition text-sm">
                  <span className="font-medium text-gray-700">{c.name}/{c.state}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href={`/imoveis-para-alugar/${params.cidade}`} className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">🏠 Alugar em {city.name}</Link>
          <Link href={`/leilao-imoveis-em/${params.cidade}`} className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">🏛️ Leilões</Link>
          <Link href="/avaliacao" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">📊 Avaliar Imóvel</Link>
          <Link href="/anunciar-imovel" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">📢 Anunciar</Link>
        </div>
      </div>
    </>
  )
}
