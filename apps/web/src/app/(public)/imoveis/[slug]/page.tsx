import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  BedDouble, Bath, Car, Maximize, MapPin,
  CheckCircle2, Star, Eye, Calendar, Building2, Layers,
  Ruler, ChevronRight, Share2, Heart, Video,
  Phone, Mail,
} from 'lucide-react'
import { LeadCaptureForm } from './LeadCaptureForm'
import { BankButton } from './BankButton'
import { JsonLdScript } from './JsonLdScript'
import { PrintButton } from './PrintButton'
import { CopyLinkButton } from './CopyLinkButton'
import { PropostaOnline } from './PropostaOnline'
import { ScheduleVisitModal } from '../ScheduleVisitModal'
import { PropertyGallery } from '@/components/public/PropertyGallery'
import { PropertyMap } from '@/components/public/PropertyMap'
import { SimilarProperties } from '@/components/public/SimilarProperties'
import { AIVisualPublicButton } from './AIVisualPublicButton'

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.agoraencontrei.com.br'

const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda', RENT: 'Aluguel', BOTH: 'Venda e Locação', SEASON: 'Temporada',
}
const TYPE_LABEL: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Chácara/Sítio',
  RANCH: 'Rancho', WAREHOUSE: 'Galpão', OFFICE: 'Escritório', STORE: 'Loja',
  STUDIO: 'Studio', PENTHOUSE: 'Cobertura', CONDO: 'Condomínio', KITNET: 'Kitnet',
}
const LAND_FACE: Record<string, string> = {
  NORTH:'Norte', SOUTH:'Sul', EAST:'Leste', WEST:'Oeste',
  NORTHEAST:'Nordeste', NORTHWEST:'Noroeste', SOUTHEAST:'Sudeste', SOUTHWEST:'Sudoeste',
}

// ── Equipe Imobiliária Lemos — mapeamento de corretores por nome ─────────────
const EQUIPE_LEMOS: Record<string, { name: string; phone: string; whatsapp: string; creci: string; cargo: string; avatar: string }> = {
  'noemia':  { name: 'Noêmia Pires Lemos',        phone: '(16) 98101-0005', whatsapp: '5516981010005', creci: '279051-F', cargo: 'Diretora Fundadora',      avatar: '/corretores/noemia-icon-v2.jpg'   },
  'naira':   { name: 'Naira Cristina Lemos',       phone: '(16) 98101-0003', whatsapp: '5516981010003', creci: '',          cargo: 'Diretoria',                  avatar: '/corretores/naira-icon-v2.jpg'    },
  'nadia':   { name: 'Nádia Maria Cristina Lemos', phone: '(16) 99253-3583', whatsapp: '5516992533583', creci: '61053-F',   cargo: 'Diretoria',                  avatar: '/corretores/nadia-icon-v2.jpg'    },
  'nilton':  { name: 'Nilton Lemos',               phone: '(16) 99965-4949', whatsapp: '5516999654949', creci: '',          cargo: 'Diretoria',                  avatar: '/corretores/nilton-icon-v2.jpg'   },
  'tomas':   { name: 'Tomás César Lemos Silva',    phone: '(16) 99311-6199', whatsapp: '5516993116199', creci: '279051-F',  cargo: 'Diretoria | Tecnologia',     avatar: '/corretores/tomas-lemos.jpg'      },
  'gabriel': { name: 'Gabriel Leal',               phone: '(16) 99241-1378', whatsapp: '5516992411378', creci: '305711-F',  cargo: 'Corretor de Imóveis',       avatar: '/corretores/gabriel-icon-v2.jpg'  },
  'lorena':  { name: 'Lorena Assis Sesso',         phone: '(16) 99108-3946', whatsapp: '5516991083946', creci: '',          cargo: 'Corretora de Imóveis',      avatar: '/corretores/lorena-sesso.jpg'     },
  'laura':   { name: 'Laura Sesso',                phone: '(16) 99340-4117', whatsapp: '5516993404117', creci: '',          cargo: 'Corretora de Imóveis',      avatar: '/corretores/laura-sesso.jpg'      },
  'lucas':   { name: 'Lucas Rodrigues',            phone: '(16) 99195-7528', whatsapp: '5516991957528', creci: '',          cargo: 'Corretor de Imóveis',       avatar: '/corretores/lucas-rodrigues.jpg'  },
  'miriam':  { name: 'Miriam Soares Chagas',       phone: '(16) 99127-5404', whatsapp: '5516991275404', creci: '',          cargo: 'Corretora de Imóveis',      avatar: '/corretores/miriam-chagas.jpg'    },
  'geraldo': { name: 'Geraldo',                    phone: '(16) 98101-0004', whatsapp: '5516981010004', creci: '',          cargo: 'Administrativo',             avatar: '/corretores/geraldo.jpg'          },
}

function findBrokerByName(captorName?: string | null) {
  if (!captorName) return null
  const lower = captorName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [key, broker] of Object.entries(EQUIPE_LEMOS)) {
    if (lower.includes(key)) return broker
  }
  return null
}

// ── Extração automática de condomínio da descrição/título ──────────────────
function extractCondoFromText(text?: string | null): string | null {
  if (!text) return null
  const patterns = [
    /condom[ií]nio\s+([A-ZÀ-Ú][\w\s\-\.]{2,50}?)(?:\s*[,\.\n\r]|$)/gi,
    /cond\.?\s+([A-ZÀ-Ú][\w\s\-\.]{2,50}?)(?:\s*[,\.\n\r]|$)/gi,
    /residencial\s+([A-ZÀ-Ú][\w\s\-\.]{2,50}?)(?:\s*[,\.\n\r]|$)/gi,
    /edif[ií]cio\s+([A-ZÀ-Ú][\w\s\-\.]{2,50}?)(?:\s*[,\.\n\r]|$)/gi,
    /ed\.?\s+([A-ZÀ-Ú][\w\s\-\.]{2,50}?)(?:\s*[,\.\n\r]|$)/gi,
    /empreendimento\s+([A-ZÀ-Ú][\w\s\-\.]{2,50}?)(?:\s*[,\.\n\r]|$)/gi,
  ]
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match?.[1]) {
      return match[1].trim().replace(/\s+/g, ' ').slice(0, 60)
    }
  }
  return null
}

// Feature categories matching Univen layout
const FEATURE_CATEGORIES: { label: string; keys: string[] }[] = [
  { label: 'Básico',     keys: ['Água','Energia','Gás','Internet','Acessível'] },
  { label: 'Serviços',   keys: ['Área de serviço','Lavanderia','Cozinha planejada','Copa','Despensa','Empregada','Ban. Empregada','Área de Empregada'] },
  { label: 'Lazer',      keys: ['Piscina','Academia','Churrasqueira','Área gourmet','Área de Lazer','Salão de festas','Playground','Campo de Futebol','Quadra','Sauna','Ofurô','Hidro','Spa'] },
  { label: 'Social',     keys: ['Varanda','Varanda Gourmet','Terraço','Jardim','Quintal','Garden'] },
  { label: 'Íntima',     keys: ['Suíte Master','Closet','Roupeiro','Lavabo','Hidro','Jacuzzi'] },
  { label: 'Armários',   keys: ['Armário Banheiro','Armário Cozinha','Armário Dormitório','Armário Sala','Banheiro','Cozinha','Dormitórios','Sala'] },
  { label: 'Acabamento', keys: ['Mármore','Granito','Porcelanato','Cerâmica','Carpete','Madeira'] },
  { label: 'Segurança',  keys: ['Portaria','Câmeras','Alarme','Cerca elétrica','Interfone','Condomínio Fechado'] },
  { label: 'Destaques',  keys: ['Vista mar','Vista lago','Frente','Esquina','Reformado','Novo'] },
]

const BANKS = [
  {
    name: 'Caixa', abbr: 'CEF', color: '#1565C0', bg: '#E3F2FD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Caixa_Econ%C3%B4mica_Federal_logo.svg/200px-Caixa_Econ%C3%B4mica_Federal_logo.svg.png',
    href: 'https://simuladorhabitacao.caixa.gov.br/home',
  },
  {
    name: 'Bradesco', abbr: 'BDB', color: '#CC0000', bg: '#FFEBEE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Banco_Bradesco_logo_%28horizontal%29.svg/200px-Banco_Bradesco_logo_%28horizontal%29.svg.png',
    href: 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-e-financiamento/encontre-seu-credito/simuladores-imoveis.shtm#box1-comprar',
  },
  {
    name: 'Itaú', abbr: 'ITÁ', color: '#F06400', bg: '#FFF3E0',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Banco_Ita%C3%BA_logo.svg/200px-Banco_Ita%C3%BA_logo.svg.png',
    href: 'https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario#section-5',
  },
  {
    name: 'Santander', abbr: 'SAN', color: '#EC0000', bg: '#FFEBEE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Santander_bank_logo.svg/200px-Santander_bank_logo.svg.png',
    href: 'https://www.negociosimobiliarios.santander.com.br/negociosimobiliarios/#/dados-pessoais?goal=3',
  },
  {
    name: 'BB', abbr: 'BB', color: '#003F87', bg: '#E3F2FD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Banco_do_Brasil_logo.svg/200px-Banco_do_Brasil_logo.svg.png',
    href: 'https://cim-simulador-imovelproprio.apps.bb.com.br/simulacao-imobiliario/sobre-imovel',
  },
  {
    name: 'Inter', abbr: 'INT', color: '#FF8A00', bg: '#FFF3E0',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Banco_Inter_logo.svg/200px-Banco_Inter_logo.svg.png',
    href: 'https://inter.co/pra-voce/financiamento-imobiliario/residencial/',
  },
  {
    name: 'SICOOB', abbr: 'SCB', color: '#007A37', bg: '#E8F5E9',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Sicoob_logo.svg/200px-Sicoob_logo.svg.png',
    href: 'https://www.sicoob.com.br/web/creditoimobiliario/simulador',
  },
  {
    name: 'Sicredi', abbr: 'SCR', color: '#1B7A3E', bg: '#E8F5E9',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Sicredi_logo.svg/200px-Sicredi_logo.svg.png',
    href: 'https://www.sicredi.com.br/site/credito/para-voce/credito-imobiliario/',
  },
  {
    name: 'BEXT', abbr: 'BXT', color: '#7C3AED', bg: '#EDE9FE',
    logo: null,
    href: 'https://bext.vc/financiamento-imobiliario',
  },
]

async function fetchProperty(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await fetchProperty(params.slug)
  if (!p) return { title: 'Imóvel não encontrado' }
  const title = p.metaTitle || `${p.title} | Imobiliária Lemos`
  const description = p.metaDescription || p.description?.slice(0, 160) || `${TYPE_LABEL[p.type] ?? p.type} em ${p.city}`
  const images = [p.coverImage, ...(p.images ?? [])].filter(Boolean).slice(0, 4)
  const keywords = Array.isArray(p.metaKeywords) && p.metaKeywords.length > 0
    ? p.metaKeywords.join(', ')
    : `${TYPE_LABEL[p.type] ?? p.type}, ${p.city ?? 'Franca'}, imóvel à ${p.purpose === 'RENT' ? 'locação' : 'venda'}, Imobiliária Lemos`
  return {
    title: { absolute: title },
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: images.map(url => ({ url, width: 1200, height: 630, alt: p.title })),
      type: 'website',
      url: `${SITE_URL}/imoveis/${p.slug}`,
      siteName: 'AgoraEncontrei — Imobiliária Lemos',
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.slice(0, 1),
    },
    alternates: {
      canonical: `${SITE_URL}/imoveis/${p.slug}`,
    },
  }
}

function buildJsonLd(p: any, siteUrl: string) {
  const allImages = [p.coverImage, ...(p.images ?? [])].filter(Boolean)
  const price = Number(p.price) || Number(p.priceRent) || 0
  const purposeLabel = p.purpose === 'RENT' || p.purpose === 'SEASON' ? 'ForRent' : 'ForSale'

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: p.title,
    description: p.description?.slice(0, 500) || p.title,
    url: `${siteUrl}/imoveis/${p.slug}`,
    ...(allImages.length > 0 && { image: allImages }),
    datePosted: p.publishedAt || p.createdAt,
    ...(price > 0 && {
      offers: {
        '@type': 'Offer',
        price: price.toString(),
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/UsedCondition',
        businessFunction: `https://schema.org/${purposeLabel}`,
      },
    }),
    address: {
      '@type': 'PostalAddress',
      ...(p.street && { streetAddress: `${p.street}${p.number ? `, ${p.number}` : ''}` }),
      addressLocality: p.city ?? 'Franca',
      addressRegion: p.state ?? 'SP',
      postalCode: p.zipCode ?? '',
      addressCountry: 'BR',
    },
    geo: (p.latitude && p.longitude) ? {
      '@type': 'GeoCoordinates',
      latitude: p.latitude,
      longitude: p.longitude,
    } : undefined,
    numberOfRooms: p.bedrooms || undefined,
    floorSize: (p.totalArea || p.builtArea) ? {
      '@type': 'QuantitativeValue',
      value: p.totalArea || p.builtArea,
      unitCode: 'MTK',
    } : undefined,
    amenityFeature: (p.features ?? []).map((f: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: f,
      value: true,
    })),
    seller: {
      '@type': 'RealEstateAgent',
      name: 'Imobiliária Lemos',
      url: siteUrl,
      telephone: '+55-16-3713-3276',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Franca',
        addressRegion: 'SP',
        addressCountry: 'BR',
      },
    },
  }

  // Remove undefined values
  return JSON.parse(JSON.stringify(jsonLd))
}

function fmtCurrency(v: number, decimals = 2) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v)
}
function fmtNum(v: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)
}

// Parse description lines: lines starting with "- " become bullet points
function parseDescription(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const bullets: string[] = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('• '))) {
        bullets.push(lines[i].trim().replace(/^[-•]\s*/, ''))
        i++
      }
      elements.push(
        <ul key={i} className="space-y-1.5 my-3 ml-1">
          {bullets.map((b, j) => (
            <li key={j} className="flex items-start gap-2 text-gray-700 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )
    } else {
      elements.push(<p key={i} className="text-gray-700 text-sm leading-relaxed mb-2">{line}</p>)
      i++
    }
  }
  return <>{elements}</>
}

// Stat box with solid borders
function StatBox({ value, label, icon: Icon }: { value: string | number; label: string; icon?: React.ComponentType<any> }) {
  return (
    <div className="flex flex-col items-center justify-center py-5 px-4 gap-2 min-w-0">
      {Icon && <Icon className="w-7 h-7" style={{ color: '#C9A84C' }} strokeWidth={1.5} />}
      <span className="text-xl font-bold leading-none" style={{ color: '#1B2B5B' }}>{value}</span>
      <span className="text-xs text-gray-500 font-medium text-center leading-tight">{label}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b last:border-0" style={{ borderColor: '#ede9df' }}>
      <span className="text-sm text-gray-500 leading-snug">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right ml-6 leading-snug">{value}</span>
    </div>
  )
}

// Organize features into categories
function organizeFeatures(features: string[]): { label: string; items: string[] }[] {
  if (!features?.length) return []
  const categorized: { label: string; items: string[] }[] = []
  const used = new Set<string>()

  for (const cat of FEATURE_CATEGORIES) {
    const items = features.filter(f => {
      const fl = f.toLowerCase()
      return cat.keys.some(k => fl.includes(k.toLowerCase())) && !used.has(f)
    })
    if (items.length) {
      items.forEach(i => used.add(i))
      categorized.push({ label: cat.label, items: items.sort() })
    }
  }

  // Remaining uncategorized
  const rest = features.filter(f => !used.has(f)).sort()
  if (rest.length) categorized.push({ label: 'Outros', items: rest })

  return categorized
}

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await fetchProperty(params.slug)
  if (!property) notFound()

  const p = property
  const allImages = [p.coverImage, ...(p.images ?? [])].filter(Boolean)
  // Corretor: usa user vinculado, depois tenta captor por nome, depois default
  const brokerFromCaptor = !p.user ? findBrokerByName((p as any).captorName) : null
  const broker = p.user ?? (brokerFromCaptor ? {
    id: '',
    name: brokerFromCaptor.name,
    phone: brokerFromCaptor.phone,
    email: '',
    avatarUrl: brokerFromCaptor.avatar,
    creciNumber: brokerFromCaptor.creci,
    cargo: brokerFromCaptor.cargo,
  } : null)
  const whatsappNum = brokerFromCaptor?.whatsapp
    ?? (broker?.phone ? `55${broker.phone.replace(/\D/g, '').replace(/^0/, '')}` : '5516981010004')

  const propertyUrl = `${SITE_URL}/imoveis/${p.slug}`
  const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel:\n${p.title}\nRef: ${p.reference ?? p.slug}\n${propertyUrl}`)
  const visitMsg   = encodeURIComponent(`Olá! Gostaria de agendar uma visita ao imóvel:\n${p.title} (Ref: ${p.reference ?? p.slug})`)

  const hasSale = (p.purpose === 'SALE' || p.purpose === 'BOTH') && Number(p.price) > 0
  const hasRent = (p.purpose === 'RENT' || p.purpose === 'BOTH') && Number(p.priceRent) > 0
  const iptu     = p.iptu ? Number(p.iptu) : null
  const totalRent = hasRent && iptu ? Number(p.priceRent) + iptu / 12 : null

  const featureCategories = organizeFeatures(p.features ?? [])
  // Condomínio: usa campo cadastrado ou extrai da descrição/título automaticamente
  const condoNameResolved: string | null =
    p.condoName ||
    extractCondoFromText(p.description) ||
    extractCondoFromText(p.title) ||
    null

  function getYouTubeId(url?: string | null): string | null {
    if (!url) return null
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : (/^[a-zA-Z0-9_-]{11}$/.test(url.trim()) ? url.trim() : null)
  }
  const youtubeId = getYouTubeId(p.videoUrl)

  const jsonLd = buildJsonLd(p, SITE_URL)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Imóveis', item: `${SITE_URL}/imoveis` },
      ...(p.city ? [{ '@type': 'ListItem', position: 3, name: p.city, item: `${SITE_URL}/imoveis?cidade=${encodeURIComponent(p.city)}` }] : []),
      { '@type': 'ListItem', position: p.city ? 4 : 3, name: p.title?.slice(0, 60) || (TYPE_LABEL[p.type] ?? p.type) },
    ],
  }

  return (
    <div style={{ backgroundColor: '#f5f3ef' }} className="min-h-screen">
      {/* JSON-LD Structured Data — client component to avoid React 18 script hoisting hydration mismatch */}
      <JsonLdScript data={jsonLd} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-gray-600 transition-colors">Início</Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          <Link href="/imoveis" className="hover:text-gray-600 transition-colors">Imóveis</Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
          {p.city && <><Link href={`/imoveis?cidade=${encodeURIComponent(p.city)}`} className="hover:text-gray-600 transition-colors">{p.city}</Link><ChevronRight className="w-3.5 h-3.5 flex-shrink-0" /></>}
          <span className="text-gray-600 font-medium truncate">{TYPE_LABEL[p.type] ?? p.type}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* ════════════════════════════════════════════════════
              LEFT COLUMN
          ════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Video */}
            {youtubeId && (
              <div className="rounded-2xl overflow-hidden shadow-md border" style={{ aspectRatio: '16/9', borderColor: '#ddd9d0' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1&loop=1&playlist=${youtubeId}`}
                  title={p.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen className="w-full h-full" style={{ border: 0 }}
                />
              </div>
            )}

            {/* Gallery */}
            <PropertyGallery
              images={allImages} title={p.title}
              purposeLabel={PURPOSE_LABEL[p.purpose] ?? p.purpose}
              typeLabel={TYPE_LABEL[p.type] ?? p.type}
            />

            {/* ── IA Visual Floating Button ──────────────────────────────────── */}
            <AIVisualPublicButton
              propertySlug={p.slug}
              images={[p.coverImage, ...(p.images ?? [])].filter(Boolean)}
              title={p.title}
            />

            {/* ── Title + Price Card ───────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
              {/* Top accent bar */}
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #1B2B5B 60%, #C9A84C)' }} />
              <div className="p-6">
                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#1B2B5B', color: 'white' }}>
                    {PURPOSE_LABEL[p.purpose] ?? p.purpose}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ borderColor: '#C9A84C', color: '#C9A84C' }}>
                    {TYPE_LABEL[p.type] ?? p.type}
                  </span>
                  {p.isFeatured && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                      <Star className="w-3 h-3 fill-current" /> Destaque
                    </span>
                  )}
                  {p.reference && <span className="text-xs text-gray-500 ml-auto font-mono">Ref: {p.reference}</span>}
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                  {p.title}
                </h1>

                {/* Location */}
                {(p.city || p.neighborhood) && (
                  <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                    {[p.neighborhood, p.city, p.state].filter(Boolean).join(', ')}
                    {p.region && ` — ${p.region}`}
                  </p>
                )}

                {/* Prices — Venda + Locação side by side */}
                <div className="rounded-xl border p-4 mb-4" style={{ borderColor: '#ddd9d0', backgroundColor: '#faf9f6' }}>
                  {hasSale && (
                    <div className="flex items-baseline justify-between border-b pb-3 mb-3" style={{ borderColor: '#ede9df' }}>
                      <span className="font-bold text-sm" style={{ color: '#1B2B5B' }}>Venda</span>
                      <span className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                        {p.valueUnderConsultation ? 'Sob Consulta' : fmtCurrency(Number(p.price))}
                      </span>
                    </div>
                  )}
                  {hasRent && (
                    <div className={`flex items-baseline justify-between ${(iptu || p.condoFee) ? 'border-b pb-3 mb-3' : ''}`} style={{ borderColor: '#ede9df' }}>
                      <span className="font-bold text-sm" style={{ color: '#1B2B5B' }}>Locação</span>
                      <span className="text-2xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                        {fmtCurrency(Number(p.priceRent))}<span className="text-sm font-normal text-gray-500">/mês</span>
                      </span>
                    </div>
                  )}
                  {iptu && (
                    <div className="flex items-baseline justify-between py-1.5">
                      <span className="text-sm text-gray-500">IPTU Anual</span>
                      <span className="text-sm font-semibold text-gray-700">{fmtCurrency(iptu)}</span>
                    </div>
                  )}
                  {p.condoFee && Number(p.condoFee) > 0 && (
                    <div className="flex items-baseline justify-between py-1.5">
                      <span className="text-sm text-gray-500">Condomínio</span>
                      <span className="text-sm font-semibold text-gray-700">{fmtCurrency(Number(p.condoFee))}/mês</span>
                    </div>
                  )}
                  {totalRent && (
                    <div className="flex items-baseline justify-between border-t pt-3 mt-1.5" style={{ borderColor: '#ede9df' }}>
                      <span className="text-sm font-semibold text-gray-600">Total Locação/mês</span>
                      <span className="text-sm font-bold" style={{ color: '#1B2B5B' }}>{fmtCurrency(totalRent)}</span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {p.priceNegotiable && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.08)' }}>
                      Preço Negociável
                    </span>
                  )}
                  {p.allowExchange && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      Aceita Permuta
                    </span>
                  )}
                </div>

                {/* Views + year */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-gray-500" style={{ borderColor: '#f0ece4' }}>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {p.views ?? 0} visualizações</span>
                  {p.yearBuilt && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Construído em {p.yearBuilt}</span>}
                </div>
              </div>
            </div>

            {/* ── Stats Bar ────────────────────────────────── */}
            {(p.bedrooms > 0 || p.suites > 0 || p.bathrooms > 0 || p.parkingSpaces > 0 || p.totalArea || p.builtArea || p.landArea) && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
                <div className="grid" style={{
                  gridTemplateColumns: `repeat(${[p.bedrooms>0,p.suites>0,p.bathrooms>0,p.parkingSpaces>0,p.totalArea>0,p.builtArea>0,p.landArea>0&&!p.totalArea,p.floor>0].filter(Boolean).length}, 1fr)`,
                }}>
                  {p.bedrooms > 0 && (
                    <div className="border-r last:border-r-0 border-b-0" style={{ borderColor: '#e8e4dc' }}>
                      <StatBox icon={BedDouble} value={p.bedrooms} label={p.bedrooms === 1 ? 'Dormitório' : 'Dormitórios'} />
                    </div>
                  )}
                  {p.suites > 0 && (
                    <div className="border-r last:border-r-0" style={{ borderColor: '#e8e4dc' }}>
                      <StatBox icon={BedDouble} value={p.suites} label={p.suites === 1 ? 'Suíte' : 'Suítes'} />
                    </div>
                  )}
                  {p.bathrooms > 0 && (
                    <div className="border-r last:border-r-0" style={{ borderColor: '#e8e4dc' }}>
                      <StatBox icon={Bath} value={p.bathrooms} label={p.bathrooms === 1 ? 'Banheiro' : 'Banheiros'} />
                    </div>
                  )}
                  {p.parkingSpaces > 0 && (
                    <div className="border-r last:border-r-0" style={{ borderColor: '#e8e4dc' }}>
                      <StatBox icon={Car} value={p.parkingSpaces} label={p.parkingSpaces === 1 ? 'Vaga' : 'Vagas'} />
                    </div>
                  )}
                  {p.totalArea > 0 && (
                    <div className="border-r last:border-r-0" style={{ borderColor: '#e8e4dc' }}>
                      <StatBox icon={Maximize} value={`${fmtNum(Number(p.totalArea))}m²`} label="Área Útil" />
                    </div>
                  )}
                  {p.builtArea > 0 && (
                    <div className="border-r last:border-r-0" style={{ borderColor: '#e8e4dc' }}>
                      <StatBox icon={Ruler} value={`${fmtNum(Number(p.builtArea))}m²`} label="Construída" />
                    </div>
                  )}
                  {p.landArea > 0 && !p.totalArea && (
                    <div className="border-r last:border-r-0" style={{ borderColor: '#e8e4dc' }}>
                      <StatBox icon={Layers} value={`${fmtNum(Number(p.landArea))}m²`} label="Terreno" />
                    </div>
                  )}
                  {p.floor > 0 && (
                    <div className="border-r last:border-r-0" style={{ borderColor: '#e8e4dc' }}>
                      <StatBox icon={Building2} value={`${p.floor}º`} label="Andar" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Action Buttons ────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-2.5" style={{ borderColor: '#ddd9d0' }}>
              {/* Primary CTA: full width */}
              <ScheduleVisitModal
                propertyId={p.id}
                propertyTitle={p.title ?? 'Imóvel'}
                propertySlug={p.slug ?? ''}
              />
              {/* Secondary CTAs: row of smaller buttons */}
              <div className="grid grid-cols-3 gap-2">
                {youtubeId && (
                  <a href={p.videoUrl} target="_blank" rel="noreferrer"
                    className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all hover:shadow-md hover:bg-gray-50"
                    style={{ borderColor: '#ddd9d0', color: '#1B2B5B' }}>
                    <Video className="w-4 h-4" style={{ color: '#C9A84C' }} />
                    Vídeo
                  </a>
                )}
                <a href={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`} target="_blank" rel="noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all hover:shadow-md hover:bg-gray-50"
                  style={{ borderColor: '#ddd9d0', color: '#1B2B5B' }}>
                  <Phone className="w-4 h-4" style={{ color: '#C9A84C' }} />
                  Corretor
                </a>
                <PrintButton />
              </div>
            </div>

            {/* ── Description ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
              <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: '#ede9df' }}>
                <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                  Descrição do imóvel
                </h2>
              </div>
              <div className="p-6">
                {p.description
                  ? parseDescription(p.description)
                  : <p className="text-sm text-gray-500">{TYPE_LABEL[p.type] ?? 'Imóvel'} {p.purpose === 'RENT' ? 'para alugar' : 'à venda'}{p.neighborhood ? ` no ${p.neighborhood}` : ''}{p.city ? ` em ${p.city}` : ''}. Entre em contato para mais informações.</p>
                }
                {/* Extra info at bottom of description */}
                {(hasSale || hasRent || iptu) && (
                  <div className="mt-5 pt-4 border-t space-y-1" style={{ borderColor: '#ede9df' }}>
                    {hasSale && !p.valueUnderConsultation && <p className="text-sm text-gray-700">Valor de venda: <strong>{fmtCurrency(Number(p.price))}</strong></p>}
                    {hasRent && <p className="text-sm text-gray-700">Valor de locação: <strong>{fmtCurrency(Number(p.priceRent))}/mês</strong></p>}
                    {iptu && <p className="text-sm text-gray-700">Valor IPTU (Anual): <strong>{fmtCurrency(iptu)}</strong></p>}
                    <p className="text-sm text-gray-500 mt-2">
                      Entre em contato para mais informações: (16) 3723-0045 · (16) 98101-0004
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Características (Feature Categories) ─────── */}
            {(featureCategories.length > 0 || p.bedrooms > 0) && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
                <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: '#ede9df' }}>
                  <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                    Características
                  </h2>
                </div>
                <div className="p-6">
                  {featureCategories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
                      {featureCategories.map(cat => (
                        <div key={cat.label}>
                          <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: '#1B2B5B' }}>{cat.label}</p>
                          <ul className="space-y-1.5">
                            {cat.items.map(item => (
                              <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
                      {/* Build basic characteristics from property data */}
                      {(p.bedrooms > 0 || p.suites > 0 || p.bathrooms > 0) && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: '#1B2B5B' }}>Cômodos</p>
                          <ul className="space-y-1.5">
                            {p.bedrooms > 0 && <li className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />{p.bedrooms} Dormitório{p.bedrooms > 1 ? 's' : ''}</li>}
                            {p.suites > 0 && <li className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />{p.suites} Suíte{p.suites > 1 ? 's' : ''}</li>}
                            {p.bathrooms > 0 && <li className="flex items-center gap-2 text-sm text-gray-700"><CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />{p.bathrooms} Banheiro{p.bathrooms > 1 ? 's' : ''}</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Detailed Specs ────────────────────────────── */}
            {(p.suitesWithCloset > 0 || p.demiSuites > 0 || p.livingRooms > 0 || p.diningRooms > 0 || p.tvRooms > 0 ||
              p.garagesCovered > 0 || p.garagesOpen > 0 || p.elevators > 0 || p.ceilingHeight || p.landDimensions ||
              p.landFace || p.sunExposure || p.position || p.condoFee || p.iptu || p.yearBuilt || p.yearLastReformed ||
              p.closedCondo || p.floor || p.commonArea || p.condoName || p.referencePoint) && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
                <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: '#ede9df' }}>
                  <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                    Detalhes do Imóvel
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                  {p.suitesWithCloset > 0 && <InfoRow label="Suítes c/ Closet" value={p.suitesWithCloset} />}
                  {p.demiSuites > 0 && <InfoRow label="Demi-suítes" value={p.demiSuites} />}
                  {p.livingRooms > 0 && <InfoRow label="Sala de Estar" value={p.livingRooms} />}
                  {p.diningRooms > 0 && <InfoRow label="Sala de Jantar" value={p.diningRooms} />}
                  {p.tvRooms > 0 && <InfoRow label="Salas de TV" value={p.tvRooms} />}
                  {p.garagesCovered > 0 && <InfoRow label="Garagens Cobertas" value={p.garagesCovered} />}
                  {p.garagesOpen > 0 && <InfoRow label="Garagens Abertas" value={p.garagesOpen} />}
                  {p.elevators > 0 && <InfoRow label="Elevadores" value={p.elevators} />}
                  {p.floor > 0 && <InfoRow label="Andar" value={`${p.floor}º`} />}
                  {p.totalFloors > 0 && <InfoRow label="Total de Andares" value={p.totalFloors} />}
                  {p.commonArea > 0 && <InfoRow label="Área Comum" value={`${fmtNum(p.commonArea)}m²`} />}
                  {p.ceilingHeight > 0 && <InfoRow label="Pé Direito" value={`${p.ceilingHeight}m`} />}
                  {p.landDimensions && <InfoRow label="Dimensão Terreno" value={p.landDimensions} />}
                  {p.landFace && <InfoRow label="Face" value={LAND_FACE[p.landFace] ?? p.landFace} />}
                  {p.sunExposure && <InfoRow label="Insolação" value={p.sunExposure} />}
                  {p.position && <InfoRow label="Posição" value={p.position} />}
                  {p.condoFee && Number(p.condoFee) > 0 && <InfoRow label="Condomínio/mês" value={fmtCurrency(Number(p.condoFee))} />}
                  {iptu && <InfoRow label="IPTU Anual" value={fmtCurrency(iptu)} />}
                  {p.yearBuilt && <InfoRow label="Ano de Construção" value={p.yearBuilt} />}
                  {p.yearLastReformed && <InfoRow label="Última Reforma" value={p.yearLastReformed} />}
                  {p.closedCondo && <InfoRow label="Condomínio" value="Fechado" />}
                  {condoNameResolved && <InfoRow label="Condomínio" value={`Condomínio ${condoNameResolved}`} />}
                  {p.referencePoint && <InfoRow label="Ponto de Referência" value={p.referencePoint} />}
                </div>
              </div>
            )}

            {/* ── Financing ─────────────────────────────────── */}
            {(p.purpose === 'SALE' || p.purpose === 'BOTH') && !p.valueUnderConsultation && Number(p.price) > 0 && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
                <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: '#ede9df' }}>
                  <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                    Simule seu Financiamento
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-4">Clique em um banco para simular o financiamento diretamente no site da instituição financeira:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                    {BANKS.map(bank => (
                      <BankButton
                        key={bank.name}
                        name={bank.name}
                        abbr={bank.abbr}
                        color={bank.color}
                        bg={bank.bg}
                        logo={bank.logo ?? null}
                        href={bank.href}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Map ───────────────────────────────────────── */}
            {(p.city || p.neighborhood) && (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
                <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: '#ede9df' }}>
                  <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                    Localização
                  </h2>
                </div>
                <div className="p-6">
                  <PropertyMap
                    latitude={p.latitude} longitude={p.longitude}
                    city={p.city} neighborhood={p.neighborhood} state={p.state}
                    label={[TYPE_LABEL[p.type] ?? p.type, p.neighborhood, p.city].filter(Boolean).join(' / ')}
                    showExactLocation={p.showExactLocation ?? false}
                  />
                  {!(p.showExactLocation) && (
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      * Localização aproximada para preservar a privacidade do imóvel.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Broker Card (bottom of left col on mobile) ─ */}
            <div className="lg:hidden bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
              <BrokerCard broker={broker} whatsappNum={whatsappNum} whatsappMsg={whatsappMsg} visitMsg={visitMsg} p={p} condoName={condoNameResolved} />
            </div>

            {/* ── Similar Properties ────────────────────────── */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
              <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: '#ede9df' }}>
                <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                  Imóveis Semelhantes
                </h2>
              </div>
              <div className="p-6">
                <SimilarProperties slug={p.slug} apiUrl={API_URL} />
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════
              RIGHT COLUMN — sticky sidebar (desktop only)
          ════════════════════════════════════════════════════ */}
          <div className="hidden lg:block space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* Broker + CTA Card */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
              <BrokerCard broker={broker} whatsappNum={whatsappNum} whatsappMsg={whatsappMsg} visitMsg={visitMsg} p={p} condoName={condoNameResolved} />
            </div>

            {/* Lead form */}
            <LeadCaptureForm propertyId={p.id} propertyTitle={p.title} />

            {/* Share */}
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#ddd9d0' }}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Compartilhe</p>
              <div className="flex items-center gap-2.5">
                <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: '#25D366' }}>
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`} target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                  style={{ backgroundColor: '#1877F2' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(p.title)}&url=${encodeURIComponent(propertyUrl)}`} target="_blank" rel="noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                  style={{ backgroundColor: '#1DA1F2' }}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(p.title)}&body=${encodeURIComponent('Confira este imóvel: ' + propertyUrl)}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 border-2"
                  style={{ borderColor: '#ddd9d0', color: '#6b7280' }}>
                  <Mail className="w-5 h-5" />
                </a>
                <CopyLinkButton url={propertyUrl} />
                <a href={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`} target="_blank" rel="noreferrer"
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold hover:underline"
                  style={{ color: '#1B2B5B' }}>
                  <Share2 className="w-3.5 h-3.5" />
                  Indicar
                </a>
              </div>
            </div>

            {/* Company info */}
            {p.company && (
              <div className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: '#ddd9d0' }}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Anúncio de</p>
                <p className="font-bold text-sm" style={{ color: '#1B2B5B' }}>{p.company.name}</p>
                {p.company.phone && (
                  <a href={`tel:${p.company.phone}`} className="text-xs mt-0.5 block hover:opacity-80 flex items-center justify-center gap-1"
                    style={{ color: '#C9A84C' }}>
                    <Phone className="w-3 h-3" />{p.company.phone}
                  </a>
                )}
                <p className="text-[10px] text-gray-500 mt-1">CRECI 61053-F</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}


// ── Broker Card Component (redesenhado) ──────────────────────────────────────
function BrokerCard({ broker, whatsappNum, whatsappMsg, visitMsg, p, condoName }: {
  broker: any; whatsappNum: string; whatsappMsg: string; visitMsg: string; p: any; condoName?: string | null
}) {
  const hasSale = (p.purpose === 'SALE' || p.purpose === 'BOTH') && Number(p.price) > 0
  const hasRent = (p.purpose === 'RENT' || p.purpose === 'BOTH') && Number(p.priceRent) > 0
  const iptu = p.iptu ? Number(p.iptu) : null
  const condoFeeNum = p.condoFee && Number(p.condoFee) > 0 ? Number(p.condoFee) : null
  const totalRent = hasRent ? (
    Number(p.priceRent) + (iptu ? iptu / 12 : 0) + (condoFeeNum ?? 0)
  ) : null

  function fmtCurr(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v)
  }

  return (
    <>
      {/* Gradient top bar */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1B2B5B 0%, #2d4a8a 50%, #C9A84C 100%)' }} />

      {/* Condomínio badge (quando detectado) */}
      {condoName && (
        <div className="px-5 pt-4 pb-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ backgroundColor: 'rgba(201,168,76,0.10)', color: '#92710a', border: '1px solid rgba(201,168,76,0.3)' }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Condomínio {condoName}
          </div>
        </div>
      )}

      {/* Price summary */}
      <div className="p-5 border-b" style={{ borderColor: '#ede9df' }}>
        {hasSale && (
          <div className={`flex items-baseline justify-between ${hasRent || iptu ? 'mb-2' : ''}`}>
            <span className="font-bold text-sm" style={{ color: '#1B2B5B' }}>Venda</span>
            <span className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              {p.valueUnderConsultation ? 'Sob Consulta' : fmtCurr(Number(p.price))}
            </span>
          </div>
        )}
        {hasRent && (
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-bold text-sm" style={{ color: '#1B2B5B' }}>Locação</span>
            <span className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              {fmtCurr(Number(p.priceRent))}<span className="text-xs font-normal text-gray-500">/mês</span>
            </span>
          </div>
        )}
        {iptu && (
          <div className="flex items-baseline justify-between text-sm py-0.5">
            <span className="text-gray-500">IPTU Anual</span>
            <span className="text-gray-700 font-medium">{fmtCurr(iptu)}</span>
          </div>
        )}
        {condoFeeNum && (
          <div className="flex items-baseline justify-between text-sm py-0.5">
            <span className="text-gray-500">Condomínio/mês</span>
            <span className="text-gray-700 font-medium">{fmtCurr(condoFeeNum)}</span>
          </div>
        )}
        {totalRent && hasRent && (iptu || condoFeeNum) && (
          <div className="flex items-baseline justify-between text-sm pt-2 mt-1 border-t font-semibold" style={{ borderColor: '#ede9df' }}>
            <span className="text-gray-600">Total/mês</span>
            <span style={{ color: '#1B2B5B' }}>{fmtCurr(totalRent)}</span>
          </div>
        )}
      </div>

      {/* Broker profile */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          {broker?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={broker.avatarUrl} alt={broker.name} loading="lazy"
              className="h-16 w-16 rounded-2xl object-cover flex-shrink-0 shadow-md"
              style={{ border: '2.5px solid #C9A84C' }} />
          ) : (
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a8a)', border: '2.5px solid #C9A84C' }}>
              {broker?.name?.charAt(0).toUpperCase() ?? 'L'}
            </div>
          )}
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-base leading-tight truncate" style={{ color: '#1B2B5B' }}>
              {broker?.name ?? 'Imobiliária Lemos'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{(broker as any)?.cargo ?? 'Corretor de Imóveis'}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#92710a' }}>
                CRECI {broker?.creciNumber || '279051-F'}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                Verificado ✓
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="px-5 pb-5 space-y-2.5">
        {/* WhatsApp — primary */}
        <a href={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg shadow-sm"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Falar com o Corretor
        </a>

        {/* Agendar visita + ligar */}
        <div className="grid grid-cols-2 gap-2">
          <ScheduleVisitModal
            propertyId={p.id}
            propertyTitle={p.title ?? 'Imóvel'}
            propertySlug={p.slug ?? ''}
          />
          <a href={`tel:${broker?.phone ?? '1637230045'}`}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:shadow-md"
            style={{ backgroundColor: '#f5f3ef', color: '#1B2B5B', border: '2px solid #ddd9d0' }}>
            <Phone className="w-4 h-4" style={{ color: '#C9A84C' }} />
            Ligar
          </a>
        </div>

        {/* Online Proposal */}
        {(p.purpose === 'SALE' || p.purpose === 'BOTH') && (
          <div className="pt-1">
            <PropostaOnline
              propertyId={p.id} propertyTitle={p.title}
              propertyPrice={p.price ? Number(p.price) : undefined}
              propertyReference={p.reference}
            />
            <p className="text-[10px] text-gray-500 text-center mt-1.5">Negocie 100% online · Retorno em até 24h</p>
          </div>
        )}

        {/* Imobiliária info footer */}
        <div className="flex items-center gap-2.5 pt-3 mt-1 border-t" style={{ borderColor: '#ede9df' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1B2B5B' }}>
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: '#1B2B5B' }}>Imobiliária Lemos</p>
            <p className="text-[11px] text-gray-400">(16) 3723-0045 · CRECI-J 61053-F</p>
          </div>
        </div>
      </div>
    </>
  )
}
