import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BedDouble, Bath, Car, Maximize, ArrowLeft, MapPin, Phone, CheckCircle2 } from 'lucide-react'
import { LeadCaptureForm } from './LeadCaptureForm'
import { PropostaOnline } from './PropostaOnline'
import { PropertyGallery } from '@/components/public/PropertyGallery'
import { PropertyMap } from '@/components/public/PropertyMap'
import { SimilarProperties } from '@/components/public/SimilarProperties'

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function fetchProperty(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await fetchProperty(params.slug)
  if (!p) return { title: 'Imóvel não encontrado' }
  return {
    title: { absolute: `${p.title} | Imobiliária Lemos` },
    description: p.description?.slice(0, 160) ?? `${TYPE_LABEL[p.type] ?? p.type} em ${p.city} — Imobiliária Lemos`,
    openGraph: { images: p.coverImage ? [p.coverImage] : [] },
  }
}

const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda', RENT: 'Aluguel', BOTH: 'Venda/Aluguel', SEASON: 'Temporada',
}

const TYPE_LABEL: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Chácara/Sítio',
  RANCH: 'Rancho', WAREHOUSE: 'Galpão', OFFICE: 'Escritório', STORE: 'Loja',
  STUDIO: 'Studio', PENTHOUSE: 'Cobertura', CONDO: 'Condomínio', KITNET: 'Kitnet',
}

const CATEGORY_LABEL: Record<string, string> = {
  RESIDENTIAL: 'Residencial', COMMERCIAL: 'Comercial', INDUSTRIAL: 'Industrial',
  RURAL: 'Rural', MIXED: 'Misto',
}

function formatPrice(p: any) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  if (p.purpose === 'RENT' && p.priceRent) return `${fmt(p.priceRent)}/mês`
  if (p.price) return fmt(p.price)
  return 'Consulte'
}

// ─── Characteristics stat item ───────────────────────────────────────────────
function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-4 px-2">
      <div className="text-orange-500 mb-1">{icon}</div>
      <span className="text-lg font-bold text-gray-800">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

// ─── Icons (inline SVGs matching Uniloc style) ────────────────────────────────
const IconHouse = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const IconBed = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10H2V7zm0 6h20M7 13V9m10 4V9" />
  </svg>
)

const IconSuite = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12v7m14-7v7M3 19h18" />
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
  </svg>
)

const IconBath = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 12a8 8 0 0016 0M4 12V5a2 2 0 012-2h2M6 19l-1 2m14-2l1 2" />
    <circle cx="7" cy="5" r="1.5" />
  </svg>
)

const IconGarage = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="7" width="20" height="14" rx="1" strokeLinecap="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 7l5-4h10l5 4M8 14h8M8 17h8" />
  </svg>
)

const IconArea = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M9 3v18M3 15h6M15 15h6M15 3v6M15 15v6" strokeDasharray="2 2" />
  </svg>
)

// ─── Bank financing section ───────────────────────────────────────────────────
const BANKS = [
  { name: 'Caixa',          color: '#1565C0', bg: '#E3F2FD', href: 'https://www.caixa.gov.br/voce/habitacao/Paginas/default.aspx',          abbr: 'CEF'   },
  { name: 'Bradesco',       color: '#CC0000', bg: '#FFEBEE', href: 'https://banco.bradesco/html/classic/produtos-servicos/financiamento-de-imovel/', abbr: 'BDB' },
  { name: 'Itaú',           color: '#003C71', bg: '#E8F0FE', href: 'https://www.itau.com.br/credito-imobiliario',                            abbr: 'ITÁ'   },
  { name: 'Santander',      color: '#EC0000', bg: '#FFEBEE', href: 'https://www.santander.com.br/credito-imobiliario',                       abbr: 'SAN'   },
  { name: 'Banco do Brasil',color: '#003F87', bg: '#E3F2FD', href: 'https://www.bb.com.br/pbb/pagina-inicial/emprestimos-e-financiamentos/credito-imobiliario', abbr: 'BB' },
  { name: 'SICOOB',         color: '#007A37', bg: '#E8F5E9', href: 'https://www.sicoob.com.br/web/sicoob/financiamento-imobiliario',         abbr: 'SCB'   },
  { name: 'Sicredi',        color: '#1B7A3E', bg: '#E8F5E9', href: 'https://www.sicredi.com.br/home/credito-imobiliario/',                   abbr: 'SCR'   },
  { name: 'Loft Cred',      color: '#6D28D9', bg: '#EDE9FE', href: 'https://loft.com.br/credito',                                           abbr: 'LFT'   },
]

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await fetchProperty(params.slug)
  if (!property) notFound()

  const allImages = [property.coverImage, ...(property.images ?? [])].filter(Boolean)

  // Extract YouTube video ID from various URL formats
  function getYouTubeId(url?: string | null): string | null {
    if (!url) return null
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (m) return m[1]
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
    return null
  }
  const youtubeId = getYouTubeId(property.videoUrl)

  // Build characteristics array (only items with values)
  const characteristics = [
    property.category && { icon: <IconHouse />, value: CATEGORY_LABEL[property.category] ?? property.category, label: 'Finalidade' },
    property.reference && { icon: <IconHouse />, value: property.reference, label: 'Referência' },
    property.bedrooms > 0 && { icon: <IconBed />, value: property.bedrooms, label: 'Dormitórios' },
    property.suites > 0 && { icon: <IconSuite />, value: property.suites, label: 'Suítes' },
    property.bathrooms > 0 && { icon: <IconBath />, value: property.bathrooms, label: 'Banheiros' },
    property.parkingSpaces > 0 && { icon: <IconGarage />, value: property.parkingSpaces, label: 'Garagens' },
    property.totalArea && { icon: <IconArea />, value: `${Number(property.totalArea).toFixed(2)} m²`, label: 'A. Terreno' },
    property.builtArea && { icon: <IconArea />, value: `${Number(property.builtArea).toFixed(2)} m²`, label: 'A. Construída' },
    property.landArea && !property.totalArea && { icon: <IconArea />, value: `${Number(property.landArea).toFixed(2)} m²`, label: 'A. Terreno' },
  ].filter(Boolean) as { icon: React.ReactNode; value: string | number; label: string }[]

  const mapTitle = [TYPE_LABEL[property.type] ?? property.type, property.neighborhood, property.city]
    .filter(Boolean).join(' / ')

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <Link
          href="/imoveis"
          className="inline-flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
          style={{ color: '#1B2B5B' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para imóveis
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left — main content ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Video — shown first if available */}
            {youtubeId && (
              <div className="bg-black rounded-2xl overflow-hidden aspect-video w-full shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=0`}
                  title={property.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                  style={{ border: 0 }}
                />
              </div>
            )}

            {/* Gallery */}
            <PropertyGallery
              images={allImages}
              title={property.title}
              purposeLabel={PURPOSE_LABEL[property.purpose] ?? property.purpose}
              typeLabel={TYPE_LABEL[property.type] ?? property.type}
            />

            {/* Title + Price */}
            <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e8e4dc' }}>
              <h1 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                {property.title}
              </h1>

              {(property.city || property.neighborhood) && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  {[property.neighborhood, property.city, property.state].filter(Boolean).join(', ')}
                </p>
              )}

              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                  {formatPrice(property)}
                </p>
                {property.priceNegotiable && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                    Negociável
                  </span>
                )}
              </div>
            </div>

            {/* ── Characteristics grid (Uniloc style) ────────────────────── */}
            {characteristics.length > 0 && (
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#e8e4dc' }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y" style={{ borderColor: '#f0ece4' }}>
                  {characteristics.map((c, i) => (
                    <StatItem key={i} icon={c.icon} value={c.value} label={c.label} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Description ────────────────────────────────────────────── */}
            {property.description && (
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-base font-bold mb-3" style={{ color: '#1B2B5B' }}>Descrição</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {/* ── Itens do Imóvel (checklist 3 cols) ─────────────────────── */}
            {property.features?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-base font-bold mb-5 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4' }}>
                  Itens do Imóvel
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
                  {[...property.features].sort().map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#4B5563' }} />
                      <span>{f.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Extra details (condomínio, IPTU, ano, andar) ───────────── */}
            {(property.condoFee || property.iptu || property.yearBuilt || property.floor) && (
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-base font-bold mb-4" style={{ color: '#1B2B5B' }}>Informações adicionais</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {property.condoFee && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Condomínio</p>
                      <p className="font-semibold text-gray-800">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.condoFee)}/mês
                      </p>
                    </div>
                  )}
                  {property.iptu && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">IPTU</p>
                      <p className="font-semibold text-gray-800">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.iptu)}/ano
                      </p>
                    </div>
                  )}
                  {property.yearBuilt && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Ano de construção</p>
                      <p className="font-semibold text-gray-800">{property.yearBuilt}</p>
                    </div>
                  )}
                  {property.floor && (
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Andar</p>
                      <p className="font-semibold text-gray-800">{property.floor}º andar</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Simule um Financiamento ─────────────────────────────────── */}
            {property.purpose !== 'RENT' && (
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-base font-bold mb-5 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4' }}>
                  Simule um Financiamento
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                  {BANKS.map(bank => (
                    <a
                      key={bank.name}
                      href={bank.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      title={`Simular financiamento no ${bank.name}`}
                      className="flex flex-col items-center justify-center gap-1 rounded-xl border py-3 px-2 hover:shadow-md transition-shadow cursor-pointer"
                      style={{ borderColor: '#e8e4dc', backgroundColor: bank.bg }}
                    >
                      <span className="text-xs font-bold tracking-wide" style={{ color: bank.color }}>
                        {bank.abbr}
                      </span>
                      <span className="text-[10px] text-center leading-tight text-gray-600 font-medium">
                        {bank.name}
                      </span>
                    </a>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Clique em um banco para simular o financiamento diretamente no site da instituição.
                </p>
              </div>
            )}

            {/* ── Localização ─────────────────────────────────────────────── */}
            {(property.city || property.neighborhood) && (
              <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-base font-bold mb-4 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4' }}>
                  Localização {mapTitle}
                </h2>
                <PropertyMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  city={property.city}
                  neighborhood={property.neighborhood}
                  state={property.state}
                  label={mapTitle}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  * Localização aproximada para preservar a privacidade do imóvel.
                </p>
              </div>
            )}

            {/* ── Imóveis Similares ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#e8e4dc' }}>
              <h2 className="text-base font-bold mb-5 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4' }}>
                Imóveis Similares
              </h2>
              <SimilarProperties slug={property.slug} apiUrl={API_URL} />
            </div>

          </div>

          {/* ── Right — sticky sidebar ──────────────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Imobiliária info */}
            <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#e8e4dc' }}>
              {property.company ? (
                <div className="flex items-center gap-3 mb-4">
                  {property.company.logoUrl ? (
                    <Image
                      src={property.company.logoUrl}
                      alt={property.company.name}
                      width={48}
                      height={48}
                      className="rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: '#1B2B5B' }}
                    >
                      {property.company.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#1B2B5B' }}>{property.company.name}</p>
                    {property.company.phone && (
                      <a
                        href={`tel:${property.company.phone}`}
                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity mt-0.5"
                        style={{ color: '#C9A84C' }}
                      >
                        <Phone className="w-3 h-3" />{property.company.phone}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                    style={{ backgroundColor: '#1B2B5B' }}
                  >
                    IL
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#1B2B5B' }}>Imobiliária Lemos</p>
                    <a href="tel:1637230045" className="flex items-center gap-1 text-xs mt-0.5 hover:opacity-80" style={{ color: '#C9A84C' }}>
                      <Phone className="w-3 h-3" /> (16) 3723-0045
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/5516981010004?text=Olá! Tenho interesse no imóvel: ${property.title} (${property.reference ?? property.slug})`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 mb-2"
                style={{ backgroundColor: '#25D366', color: 'white' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Falar pelo WhatsApp
              </a>

              <a
                href={`https://wa.me/5516981010004?text=Olá! Gostaria de agendar uma visita ao imóvel: ${encodeURIComponent(property.title + (property.reference ? ' (' + property.reference + ')' : ''))}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:brightness-110 mb-2"
                style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Agendar Visita
              </a>

              <a
                href="tel:1637230045"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold border-2 transition-all hover:bg-[#1B2B5B] hover:text-white"
                style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
              >
                <Phone className="w-4 h-4" />
                (16) 3723-0045
              </a>

              {/* Compra 100% Online */}
              {(property.purpose === 'SALE' || property.purpose === 'BOTH') && (
                <div className="mt-2 pt-3 border-t" style={{ borderColor: '#f0ece4' }}>
                  <PropostaOnline
                    propertyId={property.id}
                    propertyTitle={property.title}
                    propertyPrice={property.price ? Number(property.price) : undefined}
                    propertyReference={property.reference}
                  />
                  <p className="text-[10px] text-gray-400 text-center mt-1.5">
                    Envie sua proposta online — retorno em até 24h
                  </p>
                </div>
              )}
            </div>

            {/* Lead capture */}
            <LeadCaptureForm propertyId={property.id} propertyTitle={property.title} />
          </div>
        </div>
      </div>
    </div>
  )
}
