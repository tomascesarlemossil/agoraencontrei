import type { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, MapPin, Home, DollarSign, BarChart3, ArrowRight, Building } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const WEB_URL = 'https://www.agoraencontrei.com.br'

export const revalidate = 86400

// Dados de referência de custo de vida por cidade
const CITY_DATA: Record<string, { name: string; state: string; population: string; idh: string; avgRent: number; avgSale: number; avgM2: number; neighborhoods: { name: string; avgM2: number; category: string }[] }> = {
  'franca-sp': {
    name: 'Franca', state: 'SP', population: '355.901', idh: '0.780',
    avgRent: 1200, avgSale: 350000, avgM2: 3200,
    neighborhoods: [
      { name: 'Centro', avgM2: 4500, category: 'Premium' },
      { name: 'City Petrópolis', avgM2: 5200, category: 'Alto Padrão' },
      { name: 'Jardim Petráglia', avgM2: 3800, category: 'Médio-Alto' },
      { name: 'Jardim Paulista', avgM2: 3500, category: 'Médio' },
      { name: 'Vila Santa Cruz', avgM2: 2800, category: 'Médio' },
      { name: 'Jardim Luiza', avgM2: 2200, category: 'Econômico' },
      { name: 'Jardim Progresso', avgM2: 1800, category: 'Econômico' },
      { name: 'Polo Club', avgM2: 6000, category: 'Luxo' },
    ],
  },
  'ribeirao-preto-sp': {
    name: 'Ribeirão Preto', state: 'SP', population: '720.116', idh: '0.800',
    avgRent: 1800, avgSale: 480000, avgM2: 4800,
    neighborhoods: [
      { name: 'Jardim Sumaré', avgM2: 6500, category: 'Alto Padrão' },
      { name: 'Alto da Boa Vista', avgM2: 8000, category: 'Luxo' },
      { name: 'Jardim Independência', avgM2: 4200, category: 'Médio' },
      { name: 'Centro', avgM2: 5000, category: 'Médio-Alto' },
      { name: 'Campos Elíseos', avgM2: 3800, category: 'Médio' },
    ],
  },
  'campinas-sp': {
    name: 'Campinas', state: 'SP', population: '1.223.237', idh: '0.805',
    avgRent: 2000, avgSale: 550000, avgM2: 5500,
    neighborhoods: [
      { name: 'Taquaral', avgM2: 7000, category: 'Alto Padrão' },
      { name: 'Cambuí', avgM2: 8500, category: 'Luxo' },
      { name: 'Santa Genebra', avgM2: 4500, category: 'Médio' },
      { name: 'Centro', avgM2: 5200, category: 'Médio-Alto' },
    ],
  },
  'sao-paulo-sp': {
    name: 'São Paulo', state: 'SP', population: '12.396.372', idh: '0.805',
    avgRent: 3200, avgSale: 750000, avgM2: 9500,
    neighborhoods: [
      { name: 'Itaquera', avgM2: 4500, category: 'Econômico' },
      { name: 'Campo Limpo', avgM2: 5200, category: 'Médio' },
      { name: 'Tatuapé', avgM2: 8500, category: 'Médio-Alto' },
      { name: 'Mooca', avgM2: 9000, category: 'Médio-Alto' },
      { name: 'Pinheiros', avgM2: 14000, category: 'Luxo' },
      { name: 'Vila Mariana', avgM2: 12000, category: 'Alto Padrão' },
      { name: 'Centro', avgM2: 7000, category: 'Médio' },
      { name: 'Santana', avgM2: 7500, category: 'Médio' },
    ],
  },
  'belo-horizonte-mg': {
    name: 'Belo Horizonte', state: 'MG', population: '2.530.701', idh: '0.810',
    avgRent: 1800, avgSale: 520000, avgM2: 6200,
    neighborhoods: [
      { name: 'Savassi', avgM2: 9500, category: 'Luxo' },
      { name: 'Lourdes', avgM2: 10000, category: 'Luxo' },
      { name: 'Funcionários', avgM2: 8800, category: 'Alto Padrão' },
      { name: 'Buritis', avgM2: 6500, category: 'Médio-Alto' },
      { name: 'Pampulha', avgM2: 5800, category: 'Médio' },
      { name: 'Venda Nova', avgM2: 3200, category: 'Econômico' },
      { name: 'Belvedere', avgM2: 11000, category: 'Luxo' },
      { name: 'Serra', avgM2: 7000, category: 'Médio-Alto' },
    ],
  },
  'curitiba-pr': {
    name: 'Curitiba', state: 'PR', population: '1.963.726', idh: '0.823',
    avgRent: 2200, avgSale: 580000, avgM2: 7800,
    neighborhoods: [
      { name: 'Batel', avgM2: 12000, category: 'Luxo' },
      { name: 'Água Verde', avgM2: 8500, category: 'Alto Padrão' },
      { name: 'Ecoville', avgM2: 9500, category: 'Alto Padrão' },
      { name: 'Cabral', avgM2: 7800, category: 'Médio-Alto' },
      { name: 'Santa Felicidade', avgM2: 6500, category: 'Médio' },
      { name: 'Boqueirão', avgM2: 4800, category: 'Econômico' },
      { name: 'Centro Cívico', avgM2: 7000, category: 'Médio-Alto' },
      { name: 'Bigorrilho', avgM2: 9000, category: 'Alto Padrão' },
    ],
  },
  'goiania-go': {
    name: 'Goiânia', state: 'GO', population: '1.555.626', idh: '0.799',
    avgRent: 1500, avgSale: 420000, avgM2: 5500,
    neighborhoods: [
      { name: 'Setor Bueno', avgM2: 7500, category: 'Alto Padrão' },
      { name: 'Setor Marista', avgM2: 8000, category: 'Luxo' },
      { name: 'Jardim Goiás', avgM2: 7000, category: 'Alto Padrão' },
      { name: 'Setor Oeste', avgM2: 6500, category: 'Médio-Alto' },
      { name: 'Park Lozandes', avgM2: 8500, category: 'Luxo' },
      { name: 'Setor Central', avgM2: 4500, category: 'Médio' },
      { name: 'Vila Rosa', avgM2: 3500, category: 'Econômico' },
      { name: 'Alto da Glória', avgM2: 5500, category: 'Médio' },
    ],
  },
  'brasilia-df': {
    name: 'Brasília', state: 'DF', population: '3.094.325', idh: '0.824',
    avgRent: 2800, avgSale: 680000, avgM2: 8500,
    neighborhoods: [
      { name: 'Asa Sul', avgM2: 11000, category: 'Alto Padrão' },
      { name: 'Asa Norte', avgM2: 10500, category: 'Alto Padrão' },
      { name: 'Lago Sul', avgM2: 15000, category: 'Luxo' },
      { name: 'Sudoeste', avgM2: 12000, category: 'Luxo' },
      { name: 'Noroeste', avgM2: 13000, category: 'Luxo' },
      { name: 'Águas Claras', avgM2: 7000, category: 'Médio-Alto' },
      { name: 'Taguatinga', avgM2: 4500, category: 'Médio' },
      { name: 'Samambaia', avgM2: 3500, category: 'Econômico' },
    ],
  },
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function categoryColor(cat: string): string {
  if (cat === 'Luxo') return 'bg-purple-100 text-purple-800'
  if (cat === 'Alto Padrão') return 'bg-blue-100 text-blue-800'
  if (cat === 'Premium') return 'bg-indigo-100 text-indigo-800'
  if (cat === 'Médio-Alto') return 'bg-teal-100 text-teal-800'
  if (cat === 'Médio') return 'bg-green-100 text-green-800'
  return 'bg-yellow-100 text-yellow-800'
}

type Props = { params: { cidade: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = CITY_DATA[params.cidade]
  if (!city) return { title: 'Custo de Vida | AgoraEncontrei' }

  return {
    title: `Custo de Vida em ${city.name}/${city.state} — Valor do m² por Bairro | AgoraEncontrei`,
    description: `Tabela atualizada de custo de vida em ${city.name}/${city.state}. Compare valor do m² entre bairros, aluguel médio e preço de venda. Dados do mercado imobiliário ${new Date().getFullYear()}.`,
    keywords: [
      `custo de vida ${city.name.toLowerCase()}`, `valor m2 ${city.name.toLowerCase()} sp`,
      `preço aluguel ${city.name.toLowerCase()}`, `bairro mais barato ${city.name.toLowerCase()}`,
      `bairro mais caro ${city.name.toLowerCase()}`, `mercado imobiliário ${city.name.toLowerCase()}`,
    ],
    openGraph: {
      title: `Custo de Vida em ${city.name}/${city.state} | AgoraEncontrei`,
      description: `Compare o valor do m² entre bairros de ${city.name}. Dados atualizados.`,
      type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei',
    },
    alternates: { canonical: `${WEB_URL}/custo-de-vida/${params.cidade}` },
  }
}

export function generateStaticParams() {
  return Object.keys(CITY_DATA).map(cidade => ({ cidade }))
}

export default function CustoDeVidaPage({ params }: Props) {
  const city = CITY_DATA[params.cidade]
  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Cidade não encontrada</h1>
          <Link href="/" className="text-[#C9A84C] hover:underline">Voltar ao início</Link>
        </div>
      </div>
    )
  }

  const sorted = [...city.neighborhoods].sort((a, b) => b.avgM2 - a.avgM2)
  const maxM2 = sorted[0]?.avgM2 || 1
  const otherCities = Object.entries(CITY_DATA).filter(([slug]) => slug !== params.cidade).slice(0, 4)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Custo de Vida e Valor do m² em ${city.name}/${city.state}`,
    description: `Dados do mercado imobiliário de ${city.name}/${city.state} — valor do m² por bairro, aluguel médio e preço de venda.`,
    url: `${WEB_URL}/custo-de-vida/${params.cidade}`,
    creator: { '@type': 'Organization', name: 'AgoraEncontrei', url: WEB_URL },
    temporalCoverage: new Date().getFullYear().toString(),
    spatialCoverage: { '@type': 'Place', name: `${city.name}, ${city.state}` },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white">Início</Link> <span>/</span>
            <span className="text-white">Custo de Vida em {city.name}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Custo de Vida em <span style={{ color: '#C9A84C' }}>{city.name}/{city.state}</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl">
            Compare o valor do m² entre bairros, aluguel médio e preço de venda.
            Dados atualizados do mercado imobiliário {new Date().getFullYear()}.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-[#C9A84C]" />
            <div className="text-2xl font-bold text-gray-800">{fmt(city.avgM2)}</div>
            <div className="text-xs text-gray-500">m² médio</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border">
            <Home className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-gray-800">{fmt(city.avgRent)}</div>
            <div className="text-xs text-gray-500">Aluguel médio</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border">
            <Building className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-gray-800">{fmt(city.avgSale)}</div>
            <div className="text-xs text-gray-500">Venda média</div>
          </div>
          <div className="bg-white rounded-xl p-5 text-center shadow-sm border">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-gray-800">{city.population}</div>
            <div className="text-xs text-gray-500">População</div>
          </div>
        </div>

        {/* Ranking de Bairros */}
        <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a8a)' }}>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#C9A84C]" />
              Ranking de Bairros por Valor do m²
            </h2>
          </div>
          <div className="divide-y">
            {sorted.map((n, i) => (
              <div key={n.name} className="px-6 py-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/bairros/franca/${n.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}
                      className="font-semibold text-gray-800 hover:text-[#C9A84C] transition">
                      {n.name}
                    </Link>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${categoryColor(n.category)}`}>
                      {n.category}
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${(n.avgM2 / maxM2) * 100}%`,
                      background: 'linear-gradient(90deg, #C9A84C, #e6c96a)',
                    }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">{fmt(n.avgM2)}</div>
                  <div className="text-xs text-gray-400">/m²</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#1B2B5B] to-[#2d4a8a] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Quer investir em {city.name}?
          </h2>
          <p className="text-white/70 mb-6">
            Confira leilões de imóveis com até 50% de desconto e oportunidades de alto ROI.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={`/leiloes?city=${city.name}`}
              className="px-6 py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}>
              🏛️ Ver Leilões em {city.name}
            </Link>
            <Link href={`/imoveis?city=${city.name}`}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white/10 border border-white/20 text-white">
              🏠 Imóveis à Venda
            </Link>
          </div>
        </div>

        {/* Compare Cities */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Compare com outras cidades</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {otherCities.map(([slug, c]) => (
              <Link key={slug} href={`/custo-de-vida/${slug}`}
                className="bg-white rounded-xl border p-4 hover:border-[#C9A84C] transition text-center">
                <div className="font-bold text-gray-800">{c.name}/{c.state}</div>
                <div className="text-sm text-[#C9A84C] font-semibold mt-1">{fmt(c.avgM2)}/m²</div>
                <div className="text-xs text-gray-400">Pop. {c.population}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Internal Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href={`/imoveis?city=${city.name}`} className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">🏠 Imóveis em {city.name}</Link>
          <Link href="/leiloes" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">🏛️ Leilões</Link>
          <Link href="/profissionais/franca" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">👷 Profissionais</Link>
          <Link href="/avaliacao" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">📊 Avaliar Imóvel</Link>
        </div>
      </div>
    </>
  )
}
