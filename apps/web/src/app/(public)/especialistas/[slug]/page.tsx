import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Phone, Mail, Globe, Instagram, Award, Building2,
  Star, CheckCircle2, ArrowLeft, ExternalLink, MessageCircle
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const CATEGORY_LABELS: Record<string, string> = {
  ARQUITETO: 'Arquiteto(a)',
  ENGENHEIRO: 'Engenheiro(a)',
  CORRETOR: 'Corretor(a)',
  AVALIADOR: 'Avaliador(a)',
  DESIGNER_INTERIORES: 'Designer de Interiores',
  FOTOGRAFO: 'Fotógrafo(a)',
  VIDEOMAKER: 'Videomaker',
  ADVOGADO_IMOBILIARIO: 'Advogado(a) Imobiliário',
  DESPACHANTE: 'Despachante',
  OUTRO: 'Especialista',
}

async function getSpecialist(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/specialists/${slug}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const specialist = await getSpecialist(params.slug)
  if (!specialist) return { title: 'Especialista não encontrado' }

  const categoryLabel = CATEGORY_LABELS[specialist.category] || 'Especialista'
  const title = `${specialist.name} — ${categoryLabel} em Franca/SP | AgoraEncontrei`
  const description = specialist.bio
    ? specialist.bio.slice(0, 155)
    : `${specialist.name} é ${categoryLabel} em Franca/SP. Encontre profissionais imobiliários no AgoraEncontrei.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://www.agoraencontrei.com.br/especialistas/${specialist.slug}`,
      images: specialist.photoUrl ? [{ url: specialist.photoUrl }] : [],
    },
    alternates: {
      canonical: `https://www.agoraencontrei.com.br/especialistas/${specialist.slug}`,
    },
  }
}

export default async function EspecialistaPage({ params }: { params: { slug: string } }) {
  const specialist = await getSpecialist(params.slug)
  if (!specialist) notFound()

  const categoryLabel = CATEGORY_LABELS[specialist.category] || 'Especialista'
  const profileUrl = `https://www.agoraencontrei.com.br/especialistas/${specialist.slug}`

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: specialist.name,
    jobTitle: categoryLabel,
    description: specialist.bio || undefined,
    email: specialist.email,
    telephone: specialist.phone || undefined,
    url: profileUrl,
    image: specialist.photoUrl || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: specialist.city || 'Franca',
      addressRegion: specialist.state || 'SP',
      addressCountry: 'BR',
    },
    sameAs: [
      specialist.instagram ? `https://instagram.com/${specialist.instagram.replace('@', '')}` : null,
      specialist.website || null,
    ].filter(Boolean),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.agoraencontrei.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Parceiros', item: 'https://www.agoraencontrei.com.br/parceiros' },
      { '@type': 'ListItem', position: 3, name: specialist.name, item: profileUrl },
    ],
  }

  const whatsappUrl = specialist.whatsapp && (specialist.plan === 'PRIME' || specialist.plan === 'VIP')
    ? `https://wa.me/55${specialist.whatsapp.replace(/\D/g, '')}?text=Olá ${encodeURIComponent(specialist.name)}, vi seu perfil no AgoraEncontrei e gostaria de saber mais sobre seus serviços.`
    : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-gradient-to-b from-[#f8f6f1] to-white">
        <header className="bg-[#1B2B5B] py-4 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/">
              <Image src="/logo-ae-v2.png" alt="AgoraEncontrei" width={140} height={40} className="h-8 w-auto" />
            </Link>
            <Link href="/parceiros" className="text-white/70 hover:text-white text-sm transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Parceiros
            </Link>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-3">
          <nav className="text-sm text-gray-400 flex items-center gap-2">
            <Link href="/" className="hover:text-[#1B2B5B] transition-colors">Início</Link>
            <span>/</span>
            <Link href="/parceiros" className="hover:text-[#1B2B5B] transition-colors">Parceiros</Link>
            <span>/</span>
            <span className="text-[#1B2B5B] font-medium">{specialist.name}</span>
          </nav>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Coluna esquerda */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-br from-[#1B2B5B] to-[#2d4a8a] p-8 text-center">
                  {specialist.photoUrl ? (
                    <Image
                      src={specialist.photoUrl}
                      alt={specialist.name}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto border-4 border-white/20">
                      <span className="text-white text-3xl font-bold">{specialist.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <h1 className="text-white font-bold text-xl mt-4">{specialist.name}</h1>
                  <p className="text-[#C9A84C] font-medium mt-1">{categoryLabel}</p>
                  {(specialist.plan === 'PRIME' || specialist.plan === 'VIP') && (
                    <span className="inline-flex items-center gap-1 bg-[#C9A84C] text-white text-xs px-3 py-1 rounded-full mt-2 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      {specialist.plan === 'VIP' ? 'VIP' : 'Verificado'}
                    </span>
                  )}
                  <div className="flex items-center justify-center gap-1 mt-2 text-white/60 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{specialist.city || 'Franca'}/{specialist.state || 'SP'}</span>
                  </div>
                </div>

                <div className="px-5 py-3 border-b border-gray-100">
                  <div className={`flex items-center gap-2 text-sm font-medium ${specialist.status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${specialist.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    {specialist.status === 'ACTIVE' ? 'Perfil Ativo' : 'Em análise'}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {specialist.crea && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                      <span className="font-medium">{specialist.crea}</span>
                    </div>
                  )}
                  {specialist.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${specialist.email}`} className="hover:text-[#1B2B5B] transition-colors truncate">{specialist.email}</a>
                    </div>
                  )}
                  {specialist.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a href={`tel:${specialist.phone}`} className="hover:text-[#1B2B5B] transition-colors">{specialist.phone}</a>
                    </div>
                  )}
                  {specialist.instagram && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Instagram className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a href={`https://instagram.com/${specialist.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#1B2B5B] transition-colors">{specialist.instagram}</a>
                    </div>
                  )}
                  {specialist.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a href={specialist.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#1B2B5B] transition-colors truncate flex items-center gap-1">
                        {specialist.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="p-5 pt-0 space-y-2">
                  {whatsappUrl ? (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4" /> Falar pelo WhatsApp
                    </a>
                  ) : specialist.whatsapp ? (
                    <div className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl text-sm text-center">
                      WhatsApp disponível no plano Prime
                    </div>
                  ) : null}
                  {specialist.email && (
                    <a href={`mailto:${specialist.email}?subject=Interesse nos seus serviços - AgoraEncontrei`}
                      className="w-full border border-[#1B2B5B] text-[#1B2B5B] py-3 rounded-xl font-semibold hover:bg-[#1B2B5B] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm">
                      <Mail className="w-4 h-4" /> Enviar E-mail
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna direita */}
            <div className="lg:col-span-2 space-y-6">
              {specialist.bio && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-[#1B2B5B] mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#C9A84C]" /> Sobre o Profissional
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{specialist.bio}</p>
                </div>
              )}

              {specialist.tags?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-[#1B2B5B] mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#C9A84C]" /> Áreas de Atuação
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {specialist.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1.5 bg-[#1B2B5B]/5 text-[#1B2B5B] text-sm rounded-full font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {specialist.buildings?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-[#1B2B5B] mb-1 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#C9A84C]" /> Edifícios e Condomínios Atendidos
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {specialist.name} já prestou serviços nos seguintes condomínios em Franca/SP:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specialist.buildings.map((sb: { building: { id: string; slug: string; name: string; neighborhood?: string }; projectType?: string }) => (
                      <Link key={sb.building.id} href={`/condominios/franca/${sb.building.slug}`}
                        className="flex items-center gap-3 p-3 bg-[#f8f6f1] rounded-xl hover:bg-[#C9A84C]/10 transition-colors group">
                        <div className="w-8 h-8 bg-[#1B2B5B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-[#1B2B5B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1B2B5B] text-sm group-hover:text-[#C9A84C] transition-colors truncate">{sb.building.name}</p>
                          {sb.building.neighborhood && (
                            <p className="text-xs text-gray-400">{sb.building.neighborhood} · Franca/SP</p>
                          )}
                          {sb.projectType && <p className="text-xs text-[#C9A84C] font-medium mt-0.5">{sb.projectType}</p>}
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#C9A84C] flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-[#1B2B5B] to-[#2d4a8a] rounded-2xl p-6 text-white">
                <h3 className="font-bold text-lg mb-2">É um profissional imobiliário?</h3>
                <p className="text-white/70 text-sm mb-4">
                  Cadastre-se gratuitamente e apareça nas buscas de quem precisa dos seus serviços em Franca e região.
                </p>
                <Link href="/parceiros/cadastro"
                  className="inline-flex items-center gap-2 bg-[#C9A84C] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#b8963e] transition-colors text-sm">
                  Cadastrar meu perfil <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
