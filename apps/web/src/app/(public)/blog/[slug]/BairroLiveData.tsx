import Link from 'next/link'
import { MapPin, Home, TrendingUp } from 'lucide-react'

/**
 * Painel de "Dados Vivos" por bairro.
 *
 * Núcleo do mecanismo anti-duplicidade do SEO programático: funde o texto
 * (que é combinatório) com dados REAIS e atuais do inventário — total de
 * imóveis ativos, mediana do preço/m² e 3 anúncios recentes do bairro. Isso
 * torna cada página única e útil, evitando o "scaled content abuse".
 *
 * Server Component: busca no build/ISR e degrada em silêncio se a API falhar
 * (nunca quebra a página do post).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface RecentProperty {
  id: string
  slug?: string | null
  title?: string | null
  price?: number | string | null
  priceRent?: number | string | null
  purpose?: string | null
  neighborhood?: string | null
  city?: string | null
  coverImage?: string | null
  bedrooms?: number | null
  builtArea?: number | null
  totalArea?: number | null
}

interface BairroStats {
  city: string
  neighborhood: string
  totalAtivos: number
  precoMedioM2: number | null
  amostraPreco: number
  recentes: RecentProperty[]
}

async function fetchBairroStats(city: string, neighborhood: string): Promise<BairroStats | null> {
  try {
    const qs = new URLSearchParams({ city, neighborhood })
    const res = await fetch(`${API_URL}/api/v1/public/bairro-stats?${qs}`, {
      next: { revalidate: 600 },
    })
    if (!res.ok) return null
    return (await res.json()) as BairroStats
  } catch {
    return null
  }
}

function slugifyPart(text: string): string {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function brl(v: number | string | null | undefined): string {
  const n = Number(v ?? 0)
  if (!n) return 'Sob consulta'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export default async function BairroLiveData({
  bairro,
  cidade,
}: {
  bairro: string
  cidade?: string | null
}) {
  const city = cidade || 'Franca'
  const stats = await fetchBairroStats(city, bairro)

  // Sem inventário no bairro → não renderiza (evita bloco vazio/thin).
  if (!stats || stats.totalAtivos === 0) return null

  return (
    <section
      className="rounded-2xl border p-6 sm:p-8 mb-12"
      style={{ borderColor: '#e8e4dc', backgroundColor: '#f8f7f4' }}
      aria-label={`Mercado imobiliário ao vivo em ${bairro}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4" style={{ color: '#143A1F' }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#143A1F' }}>
          Mercado ao vivo · {bairro}, {city}
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
        Dados atualizados do inventário AgoraEncontrei para {bairro}.
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-white p-4 border" style={{ borderColor: '#e8e4dc' }}>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4" style={{ color: '#143A1F' }} />
            <span className="text-2xl font-bold" style={{ color: '#143A1F' }}>{stats.totalAtivos}</span>
          </div>
          <span className="text-xs" style={{ color: '#6b7280' }}>imóveis ativos no bairro</span>
        </div>
        <div className="rounded-xl bg-white p-4 border" style={{ borderColor: '#e8e4dc' }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: '#143A1F' }} />
            <span className="text-2xl font-bold" style={{ color: '#143A1F' }}>
              {stats.precoMedioM2 ? brl(stats.precoMedioM2) : '—'}
            </span>
          </div>
          <span className="text-xs" style={{ color: '#6b7280' }}>
            preço médio do m²{stats.amostraPreco ? ` (${stats.amostraPreco} anúncios)` : ''}
          </span>
        </div>
      </div>

      {/* Imóveis recentes */}
      {stats.recentes.length > 0 && (
        <>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#143A1F' }}>
            Imóveis recentes em {bairro}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {stats.recentes.map((p) => (
              <Link
                key={p.id}
                href={p.slug ? `/imoveis/${p.slug}` : '/imoveis'}
                className="block rounded-xl bg-white border overflow-hidden hover:shadow-md transition-shadow"
                style={{ borderColor: '#e8e4dc' }}
              >
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverImage}
                    alt={p.title ?? `Imóvel em ${bairro}`}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center" style={{ backgroundColor: '#eceae4' }}>
                    <Home className="w-6 h-6" style={{ color: '#a8a29e' }} />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-medium line-clamp-2 mb-1" style={{ color: '#1f2937' }}>
                    {p.title ?? 'Imóvel disponível'}
                  </p>
                  <p className="text-sm font-bold" style={{ color: '#143A1F' }}>
                    {p.purpose === 'RENT' ? brl(p.priceRent) : brl(p.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <Link
        href={`/imoveis/em/${slugifyPart(city)}/${slugifyPart(bairro)}`}
        className="inline-flex items-center gap-1 text-sm font-semibold"
        style={{ color: '#143A1F' }}
      >
        Ver todos os imóveis em {bairro} →
      </Link>
    </section>
  )
}
