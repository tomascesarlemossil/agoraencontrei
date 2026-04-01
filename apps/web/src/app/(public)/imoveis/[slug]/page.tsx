import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  BedDouble, Bath, Car, Maximize, ArrowLeft, MapPin, Phone,
  CheckCircle2, Star, Eye, Calendar, Building2, Layers,
  Ruler, ChevronRight,
} from 'lucide-react'
import { LeadCaptureForm } from './LeadCaptureForm'
import { PropostaOnline } from './PropostaOnline'
import { PropertyGallery } from '@/components/public/PropertyGallery'
import { PropertyMap } from '@/components/public/PropertyMap'
import { SimilarProperties } from '@/components/public/SimilarProperties'

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Constants defined before generateMetadata to avoid ReferenceError
const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda', RENT: 'Aluguel', BOTH: 'Venda/Aluguel', SEASON: 'Temporada',
}
const PURPOSE_COLOR: Record<string, { bg: string; text: string }> = {
  SALE:   { bg: '#C9A84C', text: '#1B2B5B' },
  RENT:   { bg: '#1B2B5B', text: 'white' },
  BOTH:   { bg: '#1B2B5B', text: 'white' },
  SEASON: { bg: '#7C3AED', text: 'white' },
}
const TYPE_LABEL: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Chácara/Sítio',
  RANCH: 'Rancho', WAREHOUSE: 'Galpão', OFFICE: 'Escritório', STORE: 'Loja',
  STUDIO: 'Studio', PENTHOUSE: 'Cobertura', CONDO: 'Condomínio', KITNET: 'Kitnet',
}

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
  const title = p.metaTitle || `${p.title} | Imobiliária Lemos`
  const description = p.metaDescription || p.description?.slice(0, 160) || `${TYPE_LABEL[p.type] ?? p.type} em ${p.city}`
  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      images: p.coverImage ? [p.coverImage] : [],
      type: 'website',
    },
  }
}

const LAND_FACE: Record<string, string> = {
  NORTH:'Norte', SOUTH:'Sul', EAST:'Leste', WEST:'Oeste',
  NORTHEAST:'Nordeste', NORTHWEST:'Noroeste', SOUTHEAST:'Sudeste', SOUTHWEST:'Sudoeste',
}

function formatPrice(p: any): string {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  if (p.valueUnderConsultation) return 'Sob Consulta'
  if (p.purpose === 'RENT' && p.priceRent) return `${fmt(p.priceRent)}/mês`
  if (p.price) return fmt(p.price)
  return 'Consulte'
}

const BANKS = [
  { name: 'Caixa',  color: '#1565C0', bg: '#E3F2FD', abbr: 'CEF',  href: 'https://www.caixa.gov.br/voce/habitacao' },
  { name: 'Bradesco', color: '#CC0000', bg: '#FFEBEE', abbr: 'BDB', href: 'https://banco.bradesco/html/classic/produtos-servicos/financiamento-de-imovel/' },
  { name: 'Itaú',   color: '#003C71', bg: '#E8F0FE', abbr: 'ITÁ',   href: 'https://www.itau.com.br/credito-imobiliario' },
  { name: 'Santander', color: '#EC0000', bg: '#FFEBEE', abbr: 'SAN', href: 'https://www.santander.com.br/credito-imobiliario' },
  { name: 'BB',     color: '#003F87', bg: '#E3F2FD', abbr: 'BB',    href: 'https://www.bb.com.br/pbb/pagina-inicial/emprestimos-e-financiamentos/credito-imobiliario' },
  { name: 'SICOOB', color: '#007A37', bg: '#E8F5E9', abbr: 'SCB',   href: 'https://www.sicoob.com.br/web/sicoob/financiamento-imobiliario' },
  { name: 'Sicredi',color: '#1B7A3E', bg: '#E8F5E9', abbr: 'SCR',   href: 'https://www.sicredi.com.br/home/credito-imobiliario/' },
  { name: 'Loft',   color: '#6D28D9', bg: '#EDE9FE', abbr: 'LFT',   href: 'https://loft.com.br/credito' },
]

function StatBox({ value, label, icon: Icon }: { value: string|number; label: string; icon?: React.ComponentType<any> }) {
  return (
    <div className="flex flex-col items-center justify-center py-5 px-3 gap-1.5">
      {Icon && <Icon className="w-6 h-6 mb-0.5" style={{ color: '#C9A84C' }} />}
      <span className="text-xl font-bold" style={{ color: '#1B2B5B' }}>{value}</span>
      <span className="text-xs text-gray-500 font-medium text-center leading-tight">{label}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between py-3 border-b last:border-0" style={{ borderColor: '#f0ece4' }}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right ml-4">{value}</span>
    </div>
  )
}

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await fetchProperty(params.slug)
  if (!property) notFound()

  const p = property
  const allImages = [p.coverImage, ...(p.images ?? [])].filter(Boolean)
  const purposeColor = PURPOSE_COLOR[p.purpose] ?? PURPOSE_COLOR.SALE
  const broker = p.user
  const whatsappBase = broker?.phone
    ? `5516${broker.phone.replace(/\D/g, '').slice(-9)}`
    : '5516981010004'
  const propertyRef = p.reference ?? p.slug

  function getYouTubeId(url?: string | null): string | null {
    if (!url) return null
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (m) return m[1]
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
    return null
  }
  const youtubeId = getYouTubeId(p.videoUrl)

  const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel:\n${p.title}\nRef: ${propertyRef}\n${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/imoveis/${p.slug}`)
  const visitMsg = encodeURIComponent(`Olá! Gostaria de agendar uma visita ao imóvel:\n${p.title} (Ref: ${propertyRef})`)

  return (
    <div style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-1">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Início</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/imoveis" className="hover:text-gray-600 transition-colors">Imóveis</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-600 font-medium truncate max-w-[200px]">{p.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Video — autoplay + muted (browser requirement) */}
            {youtubeId && (
              <div className="rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: '16/9' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}`}
                  title={p.title}
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
              title={p.title}
              purposeLabel={PURPOSE_LABEL[p.purpose] ?? p.purpose}
              typeLabel={TYPE_LABEL[p.type] ?? p.type}
            />

            {/* Title block */}
            <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: purposeColor.bg, color: purposeColor.text }}>
                  {PURPOSE_LABEL[p.purpose] ?? p.purpose}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                  {TYPE_LABEL[p.type] ?? p.type}
                </span>
                {p.isFeatured && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"
                    style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                    <Star className="w-3 h-3 fill-current" /> Destaque
                  </span>
                )}
                {p.isNew && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                    Novo
                  </span>
                )}
                {p.reference && (
                  <span className="text-xs text-gray-400 ml-auto">Ref: {p.reference}</span>
                )}
              </div>

              <h1 className="text-2xl font-bold leading-tight mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                {p.title}
              </h1>

              {(p.city || p.neighborhood) && (
                <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  {[p.neighborhood, p.city, p.state].filter(Boolean).join(', ')}
                  {p.region && ` — ${p.region}`}
                </p>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <p className="text-3xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                  {formatPrice(p)}
                </p>
                {p.priceNegotiable && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                    Negociável
                  </span>
                )}
                {p.allowExchange && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700">
                    Aceita Permuta
                  </span>
                )}
              </div>
              {p.purpose === 'RENT' && p.condoFee && (
                <p className="text-sm text-gray-500 mt-1">
                  + Condomínio {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(p.condoFee))}/mês
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-gray-400" style={{ borderColor: '#f0ece4' }}>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {p.views} visualizações</span>
                {p.yearBuilt && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Construído em {p.yearBuilt}</span>}
              </div>
            </div>

            {/* Characteristics grid */}
            {(p.bedrooms > 0 || p.suites > 0 || p.bathrooms > 0 || p.parkingSpaces > 0 || p.totalArea || p.builtArea) && (
              <div className="bg-white rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <div className="grid divide-x divide-y" style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  borderColor: '#f0ece4',
                }}>
                  {p.bedrooms > 0 && <StatBox icon={BedDouble} value={p.bedrooms} label={p.bedrooms === 1 ? 'Dormitório' : 'Dormitórios'} />}
                  {p.suites > 0 && <StatBox icon={BedDouble} value={p.suites} label={p.suites === 1 ? 'Suíte' : 'Suítes'} />}
                  {p.bathrooms > 0 && <StatBox icon={Bath} value={p.bathrooms} label={p.bathrooms === 1 ? 'Banheiro' : 'Banheiros'} />}
                  {p.parkingSpaces > 0 && <StatBox icon={Car} value={p.parkingSpaces} label={p.parkingSpaces === 1 ? 'Vaga' : 'Vagas'} />}
                  {p.totalArea > 0 && <StatBox icon={Maximize} value={`${Number(p.totalArea).toLocaleString('pt-BR')}m²`} label="Área Útil" />}
                  {p.builtArea > 0 && <StatBox icon={Ruler} value={`${Number(p.builtArea).toLocaleString('pt-BR')}m²`} label="Construída" />}
                  {p.landArea > 0 && !p.totalArea && <StatBox icon={Layers} value={`${Number(p.landArea).toLocaleString('pt-BR')}m²`} label="Terreno" />}
                  {p.floor > 0 && <StatBox icon={Building2} value={`${p.floor}º`} label="Andar" />}
                </div>
              </div>
            )}

            {/* Description */}
            {p.description ? (
              <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-lg font-bold mb-4 pb-2 border-b flex items-center gap-2"
                  style={{ color: '#1B2B5B', borderColor: '#f0ece4', fontFamily: 'Georgia, serif' }}>
                  Sobre este imóvel
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-lg font-bold mb-4 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4', fontFamily: 'Georgia, serif' }}>
                  Sobre este imóvel
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {TYPE_LABEL[p.type] ?? 'Imóvel'} {PURPOSE_LABEL[p.purpose] === 'Venda' ? 'à venda' : 'para alugar'}
                  {p.neighborhood ? ` no bairro ${p.neighborhood}` : ''}
                  {p.city ? ` em ${p.city}` : ''}.
                  {p.bedrooms > 0 ? ` ${p.bedrooms} dormitório${p.bedrooms > 1 ? 's' : ''}` : ''}
                  {p.suites > 0 ? `, ${p.suites} suíte${p.suites > 1 ? 's' : ''}` : ''}
                  {p.bathrooms > 0 ? `, ${p.bathrooms} banheiro${p.bathrooms > 1 ? 's' : ''}` : ''}
                  {p.parkingSpaces > 0 ? `, ${p.parkingSpaces} vaga${p.parkingSpaces > 1 ? 's' : ''}` : ''}.
                  {p.totalArea ? ` Área útil de ${p.totalArea}m².` : ''}
                  {' '}Entre em contato para mais informações.
                </p>
              </div>
            )}

            {/* Detailed specs */}
            {(p.suitesWithCloset > 0 || p.demiSuites > 0 || p.livingRooms > 0 || p.diningRooms > 0 || p.tvRooms > 0 ||
              p.garagesCovered > 0 || p.garagesOpen > 0 || p.elevators > 0 || p.ceilingHeight || p.landDimensions ||
              p.landFace || p.sunExposure || p.position || p.condoFee || p.iptu || p.yearBuilt || p.yearLastReformed ||
              p.closedCondo || p.floor || p.commonArea) && (
              <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-lg font-bold mb-4 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4', fontFamily: 'Georgia, serif' }}>
                  Detalhes do Imóvel
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  {p.suitesWithCloset > 0 && <InfoRow label="Suítes c/ Closet" value={p.suitesWithCloset} />}
                  {p.demiSuites > 0 && <InfoRow label="Demi-suítes" value={p.demiSuites} />}
                  {p.livingRooms > 0 && <InfoRow label="Sala de Estar" value={p.livingRooms} />}
                  {p.diningRooms > 0 && <InfoRow label="Sala de Jantar" value={p.diningRooms} />}
                  {p.tvRooms > 0 && <InfoRow label="Salas de TV" value={p.tvRooms} />}
                  {p.garagesCovered > 0 && <InfoRow label="Garagens Cobertas" value={p.garagesCovered} />}
                  {p.garagesOpen > 0 && <InfoRow label="Garagens Descobertas" value={p.garagesOpen} />}
                  {p.elevators > 0 && <InfoRow label="Elevadores" value={p.elevators} />}
                  {p.floor > 0 && <InfoRow label="Andar" value={`${p.floor}º`} />}
                  {p.commonArea > 0 && <InfoRow label="Área Comum" value={`${p.commonArea}m²`} />}
                  {p.ceilingHeight > 0 && <InfoRow label="Pé Direto" value={`${p.ceilingHeight}m`} />}
                  {p.landDimensions && <InfoRow label="Dimensão Terreno" value={p.landDimensions} />}
                  {p.landFace && <InfoRow label="Face" value={LAND_FACE[p.landFace] ?? p.landFace} />}
                  {p.sunExposure && <InfoRow label="Insolamento" value={p.sunExposure} />}
                  {p.position && <InfoRow label="Posição" value={p.position} />}
                  {p.condoFee && <InfoRow label="Condomínio" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(p.condoFee)) + '/mês'} />}
                  {p.iptu && <InfoRow label="IPTU" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(p.iptu)) + '/ano'} />}
                  {p.yearBuilt && <InfoRow label="Ano de Construção" value={p.yearBuilt} />}
                  {p.yearLastReformed && <InfoRow label="Última Reforma" value={p.yearLastReformed} />}
                  {p.closedCondo && <InfoRow label="Condomínio" value="Fechado" />}
                  {p.condoName && <InfoRow label="Empreendimento" value={p.condoName} />}
                  {p.referencePoint && <InfoRow label="Ponto de Referência" value={p.referencePoint} />}
                </div>
              </div>
            )}

            {/* Features */}
            {p.features?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-lg font-bold mb-5 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4', fontFamily: 'Georgia, serif' }}>
                  Diferenciais e Comodidades
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                  {[...p.features].sort().map((f: string) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
                      </div>
                      <span>{f.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financing simulation */}
            {p.purpose !== 'RENT' && !p.valueUnderConsultation && (
              <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-lg font-bold mb-5 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4', fontFamily: 'Georgia, serif' }}>
                  Simule seu Financiamento
                </h2>
                <div className="grid grid-cols-4 gap-3">
                  {BANKS.map(bank => (
                    <a key={bank.name} href={bank.href} target="_blank" rel="noreferrer noopener"
                      title={`Simular no ${bank.name}`}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border py-4 px-2 hover:shadow-md transition-all hover:scale-105"
                      style={{ borderColor: '#e8e4dc', backgroundColor: bank.bg }}>
                      <span className="text-sm font-extrabold tracking-wide" style={{ color: bank.color }}>{bank.abbr}</span>
                      <span className="text-[10px] text-center leading-tight text-gray-600">{bank.name}</span>
                    </a>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Clique em um banco para simular o financiamento diretamente no site da instituição.
                </p>
              </div>
            )}

            {/* Map */}
            {(p.city || p.neighborhood) && (
              <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <h2 className="text-lg font-bold mb-4 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4', fontFamily: 'Georgia, serif' }}>
                  Localização
                </h2>
                <PropertyMap
                  latitude={p.latitude} longitude={p.longitude}
                  city={p.city} neighborhood={p.neighborhood} state={p.state}
                  label={[TYPE_LABEL[p.type] ?? p.type, p.neighborhood, p.city].filter(Boolean).join(' / ')}
                />
                <p className="text-xs text-gray-400 mt-3 text-center">
                  * Localização aproximada para preservar a privacidade do imóvel.
                </p>
              </div>
            )}

            {/* Similar */}
            <div className="bg-white rounded-2xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
              <h2 className="text-lg font-bold mb-5 pb-2 border-b" style={{ color: '#1B2B5B', borderColor: '#f0ece4', fontFamily: 'Georgia, serif' }}>
                Imóveis Similares
              </h2>
              <SimilarProperties slug={p.slug} apiUrl={API_URL} />
            </div>
          </div>

          {/* ── RIGHT COLUMN — sticky sidebar ───────────────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* Broker card */}
            <div className="bg-white rounded-2xl overflow-hidden border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
              {/* Top gradient bar */}
              <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #1B2B5B, #C9A84C)' }} />

              <div className="p-5">
                {/* Broker info */}
                {broker ? (
                  <div className="flex items-center gap-3 mb-5">
                    <div className="relative flex-shrink-0">
                      {broker.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={broker.avatarUrl} alt={broker.name}
                          className="h-14 w-14 rounded-full object-cover border-2"
                          style={{ borderColor: '#C9A84C' }} />
                      ) : (
                        <div className="h-14 w-14 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 flex-shrink-0"
                          style={{ backgroundColor: '#1B2B5B', borderColor: '#C9A84C' }}>
                          {broker.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#1B2B5B' }}>{broker.name}</p>
                      <p className="text-xs text-gray-400">Corretor de Imóveis</p>
                      {broker.creciNumber && (
                        <p className="text-xs font-medium mt-0.5" style={{ color: '#C9A84C' }}>
                          CRECI {broker.creciNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2"
                      style={{ backgroundColor: '#1B2B5B', borderColor: '#C9A84C' }}>
                      IL
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#1B2B5B' }}>Imobiliária Lemos</p>
                      <p className="text-xs text-gray-400">CRECI 279051</p>
                    </div>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="space-y-2.5">
                  {/* WhatsApp */}
                  <a href={`https://wa.me/${whatsappBase}?text=${whatsappMsg}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Falar pelo WhatsApp
                  </a>

                  {/* Schedule visit */}
                  <a href={`https://wa.me/${whatsappBase}?text=${visitMsg}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C66A)', color: '#1B2B5B' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Agendar Visita
                  </a>

                  {/* Phone */}
                  <a href={`tel:${broker?.phone ?? '1637230045'}`}
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] border-2 hover:bg-[#1B2B5B] hover:text-white"
                    style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {broker?.phone ?? '(16) 3723-0045'}
                  </a>

                  {/* Online proposal */}
                  {(p.purpose === 'SALE' || p.purpose === 'BOTH') && (
                    <div className="pt-1 mt-1 border-t" style={{ borderColor: '#f0ece4' }}>
                      <PropostaOnline
                        propertyId={p.id}
                        propertyTitle={p.title}
                        propertyPrice={p.price ? Number(p.price) : undefined}
                        propertyReference={p.reference}
                      />
                      <p className="text-[10px] text-gray-400 text-center mt-1.5">
                        Negocie 100% online · Retorno em até 24h
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead capture form */}
            <LeadCaptureForm propertyId={p.id} propertyTitle={p.title} />

            {/* Company info */}
            {p.company && (
              <div className="bg-white rounded-2xl p-4 border text-center" style={{ borderColor: '#e8e4dc' }}>
                <p className="text-xs text-gray-400 mb-1">Anúncio de</p>
                <p className="font-bold text-sm" style={{ color: '#1B2B5B' }}>{p.company.name}</p>
                {p.company.phone && (
                  <a href={`tel:${p.company.phone}`} className="text-xs mt-0.5 block hover:opacity-80"
                    style={{ color: '#C9A84C' }}>
                    {p.company.phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
