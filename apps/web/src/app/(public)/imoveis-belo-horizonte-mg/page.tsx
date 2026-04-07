import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Home, Building, TrendingUp, MessageCircle, Search, ArrowRight, Star } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Imóveis em Belo Horizonte/MG — Venda, Aluguel e Leilões | AgoraEncontrei',
  description: 'Encontre imóveis em Belo Horizonte/MG. Casas, apartamentos e terrenos à venda e para alugar. Leilões com até 50% de desconto. Marketplace imobiliário #1 do Brasil.',
  keywords: [
    'imóveis belo horizonte mg', 'casas à venda belo horizonte', 'apartamentos belo horizonte',
    'aluguel belo horizonte', 'leilão imóveis belo horizonte', 'terrenos belo horizonte',
    'imobiliária belo horizonte', 'comprar imóvel belo horizonte mg',
  ],
  openGraph: {
    title: 'Imóveis em Belo Horizonte/MG | AgoraEncontrei',
    description: 'Marketplace imobiliário com imóveis à venda, aluguel e leilões em Belo Horizonte/MG.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/imoveis-belo-horizonte-mg' },
}

const BAIRROS = ['Savassi', 'Lourdes', 'Funcionários', 'Buritis', 'Sion', 'Serra', 'Pampulha', 'Belvedere', 'Santo', 'Agostinho', 'Mangabeiras', ]

async function fetchProperties() {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?city=Belo Horizonte&limit=12`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch { return [] }
}

async function fetchAuctions() {
  try {
    const res = await fetch(`${API_URL}/api/v1/auctions?city=Belo Horizonte&limit=6`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch { return [] }
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default async function CityPage() {
  const [properties, auctions] = await Promise.all([fetchProperties(), fetchAuctions()])

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'AgoraEncontrei — Imóveis em Belo Horizonte/MG',
    url: 'https://www.agoraencontrei.com.br/imoveis-belo-horizonte-mg',
    areaServed: { '@type': 'City', name: 'Belo Horizonte', containedInPlace: { '@type': 'State', name: 'MG' } },
    description: 'Capital mineira com forte mercado imobiliário. Região metropolitana com 6 milhões de habitantes.',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> Belo Horizonte/MG · População 2.530.701
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis em <span style={{ color: '#C9A84C' }}>Belo Horizonte/MG</span>
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            Capital mineira com forte mercado imobiliário. Região metropolitana com 6 milhões de habitantes.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={`/imoveis?city=Belo Horizonte`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm" style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Buscar Imóveis
            </Link>
            <Link href={`/leiloes?city=Belo Horizonte`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
              🏛️ Ver Leilões
            </Link>
            <Link href={`/custo-de-vida/belo-horizonte-mg`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
              📊 Custo de Vida
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-3xl mx-auto">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>R$ 6.200</div>
              <div className="text-xs text-white/60">m² médio</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>R$ 1.800/mês</div>
              <div className="text-xs text-white/60">Aluguel médio</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>{properties.length}</div>
              <div className="text-xs text-white/60">Imóveis ativos</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>{auctions.length}</div>
              <div className="text-xs text-white/60">Leilões</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Bairros */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Bairros em Destaque — Belo Horizonte</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {BAIRROS.map((b: string) => (
              <Link key={b} href={`/imoveis?city=Belo Horizonte&neighborhood=${encodeURIComponent(b)}`}
                className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] hover:shadow-sm transition">
                <MapPin className="w-4 h-4 mx-auto mb-1 text-[#C9A84C]" />
                <span className="text-sm font-medium text-gray-700">{b}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Leilões */}
        {auctions.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🏛️ Leilões em Belo Horizonte
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {auctions.slice(0, 6).map((a: any) => (
                <Link key={a.id} href={`/leiloes/${a.slug}`}
                  className="bg-white rounded-xl border p-4 hover:shadow-lg transition">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-semibold">{a.source}</span>
                    {a.discountPercent && <span className="text-xs font-bold text-red-600">-{a.discountPercent}%</span>}
                  </div>
                  <p className="font-semibold text-sm text-gray-800 line-clamp-2">{a.title}</p>
                  <p className="text-lg font-bold mt-2" style={{ color: '#1B2B5B' }}>{a.minimumBid ? fmt(Number(a.minimumBid)) : '—'}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Imóveis */}
        {properties.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Imóveis à Venda em Belo Horizonte</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.slice(0, 6).map((p: any) => (
                <Link key={p.id} href={`/imoveis/${p.slug}`}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition">
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    {p.coverImage ? <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" /> : <Home className="w-8 h-8 text-gray-300" />}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm text-gray-800 line-clamp-2">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-1"><MapPin className="w-3 h-3 inline" /> {p.neighborhood}</p>
                    <p className="font-bold text-base mt-2" style={{ color: '#1B2B5B' }}>
                      {p.price ? fmt(Number(p.price)) : p.priceRent ? `${fmt(Number(p.priceRent))}/mês` : 'Consulte'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SEO Links */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/leiloes" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">🏛️ Leilões Nacional</Link>
          <Link href="/profissionais/franca" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">👷 Profissionais</Link>
          <Link href="/anunciar-imovel" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">📢 Anunciar Imóvel</Link>
          <Link href="/avaliacao" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">📊 Avaliar Imóvel</Link>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#1B2B5B] to-[#2d4a8a] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Encontre seu imóvel ideal em Belo Horizonte
          </h2>
          <p className="text-white/70 mb-6">Busca inteligente com IA. Leilões com desconto. Assessoria completa.</p>
          <a href="https://wa.me/5516981010004?text=Olá! Procuro imóvel em Belo Horizonte/MG."
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-base"
            style={{ backgroundColor: '#25D366' }}>
            <MessageCircle className="w-5 h-5" /> Falar com Especialista
          </a>
        </section>
      </div>
    </>
  )
}
