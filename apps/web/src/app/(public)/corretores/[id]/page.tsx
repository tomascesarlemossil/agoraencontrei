import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Phone, Mail, BedDouble, Maximize, MapPin } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Broker {
  id: string; name: string; email: string | null; phone: string | null
  avatarUrl: string | null; bio: string | null; creciNumber: string | null; role: string
}
interface BrokerProperty {
  id: string; title: string; slug: string | null; coverImage: string | null
  price: number | null; priceRent: number | null; type: string; purpose: string
  bedrooms: number; totalArea: number | null; city: string | null; neighborhood: string | null
}
interface BrokerResponse { broker: Broker; properties: BrokerProperty[] }

async function fetchBroker(id: string): Promise<BrokerResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/team/${id}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    return await res.json() as BrokerResponse
  } catch { return null }
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Diretoria', ADMIN: 'Diretoria', MANAGER: 'Gerência',
  BROKER: 'Corretor(a) de Imóveis', FINANCIAL: 'Financeiro', LAWYER: 'Jurídico',
}

const brl = (n: number | null) =>
  n != null && n > 0 ? `R$ ${Math.round(n).toLocaleString('pt-BR')}` : 'Consulte'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await fetchBroker(id)
  if (!data) return { title: 'Corretor — AgoraEncontrei' }
  return {
    title: `${data.broker.name} | AgoraEncontrei — Imobiliária Lemos`,
    description: data.broker.bio?.slice(0, 200) ?? `Conheça ${data.broker.name} e os imóveis sob sua captação.`,
  }
}

export const revalidate = 60

export default async function CorretorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await fetchBroker(id)
  if (!data) notFound()
  const { broker, properties } = data!

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/corretores"
          className="inline-flex items-center gap-1 text-sm hover:opacity-80"
          style={{ color: '#1B2B5B' }}>
          <ChevronLeft className="w-4 h-4" /> Voltar à equipe
        </Link>

        {/* Profile header */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 flex flex-col sm:flex-row items-start gap-5">
          <div className="h-28 w-28 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-amber-400">
            {broker.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={broker.avatarUrl} alt={broker.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ backgroundColor: '#1B2B5B' }}>
                {broker.name.split(' ').slice(0, 2).map(s => s[0]).join('')}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              {broker.name}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: '#C9A84C' }}>
              {ROLE_LABEL[broker.role] ?? broker.role}
              {broker.creciNumber && <span className="ml-2 text-gray-500">CRECI {broker.creciNumber}</span>}
            </p>
            {broker.bio && <p className="mt-3 text-sm text-gray-700 leading-relaxed">{broker.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {broker.phone && (
                <a href={`https://wa.me/55${broker.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
                  style={{ backgroundColor: '#25D366' }}>
                  <Phone size={14} /> WhatsApp
                </a>
              )}
              {broker.email && (
                <a href={`mailto:${broker.email}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                  style={{ color: '#1B2B5B' }}>
                  <Mail size={14} /> {broker.email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <h2 className="mt-8 text-lg font-bold" style={{ color: '#1B2B5B' }}>
          Imóveis sob captação ({properties.length})
        </h2>
        {properties.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Nenhum imóvel publicado no momento.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map(p => (
              <Link key={p.id} href={`/imoveis/${p.slug ?? p.id}`}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-gray-100">
                  {p.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt={p.title}
                      className="h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm line-clamp-2" style={{ color: '#1B2B5B' }}>{p.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={11} /> {[p.neighborhood, p.city].filter(Boolean).join(', ') || '—'}
                  </p>
                  <p className="mt-1.5 text-base font-bold" style={{ color: '#C9A84C' }}>
                    {brl(p.purpose === 'RENT' ? p.priceRent : p.price)}
                    {p.purpose === 'RENT' && <span className="text-xs text-gray-500"> /mês</span>}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    {p.bedrooms > 0 && <span className="flex items-center gap-0.5"><BedDouble size={12} /> {p.bedrooms}</span>}
                    {p.totalArea && <span className="flex items-center gap-0.5"><Maximize size={12} /> {p.totalArea} m²</span>}
                    <span className="ml-auto">{p.type}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
