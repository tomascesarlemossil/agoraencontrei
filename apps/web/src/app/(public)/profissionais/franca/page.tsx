import type { Metadata } from 'next'
import Link from 'next/link'
import { Star, Phone, MapPin, Building, ArrowRight, Wrench, Scale, Paintbrush, HardHat, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Profissionais Imobiliários em Franca/SP — Arquitetos, Engenheiros, Advogados | AgoraEncontrei',
  description: 'Encontre arquitetos, engenheiros civis, advogados imobiliários e designers de interiores em Franca/SP. Profissionais recomendados para reforma, vistoria, leilões e decoração.',
  keywords: [
    'arquiteto franca sp', 'engenheiro civil franca', 'advogado imobiliário franca',
    'reforma apartamento franca', 'designer interiores franca sp',
    'vistoria imóvel franca', 'laudo técnico franca', 'home staging franca',
    'profissionais imobiliários franca sp',
  ],
  openGraph: {
    title: 'Profissionais Imobiliários em Franca/SP | AgoraEncontrei',
    description: 'Rede de profissionais para reforma, vistoria, assessoria jurídica e decoração em Franca.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/profissionais/franca' },
}

const CATEGORIES = [
  {
    slug: 'arquitetos',
    title: 'Arquitetos',
    icon: '🏗️',
    description: 'Projetos de reforma, ampliação e decoração de imóveis',
    professionals: [
      { name: 'Arq. Marina Ribeiro', specialty: 'Reforma de apartamentos em condomínio', phone: '(16) 99234-5678', rating: 4.8, projects: 45, condos: ['Collis Residence', 'Siracusa', 'Piemonte'] },
      { name: 'Arq. Rafael Nascimento', specialty: 'Projetos residenciais e comerciais', phone: '(16) 99123-4567', rating: 4.7, projects: 38, condos: ['Porto dos Sonhos', 'Olivito'] },
      { name: 'Arq. Camila Ferreira', specialty: 'Design de interiores e home staging', phone: '(16) 99345-1234', rating: 4.9, projects: 52, condos: ['Villa Toscana', 'Gaia', 'Le Parc'] },
    ],
  },
  {
    slug: 'engenheiros',
    title: 'Engenheiros Civis',
    icon: '⚙️',
    description: 'Laudos técnicos, vistorias e acompanhamento de obras',
    professionals: [
      { name: 'Eng. Carlos Pereira', specialty: 'Laudo técnico e vistoria pré-compra', phone: '(16) 99345-6789', rating: 4.9, projects: 120, condos: ['Residencial Brasil', 'San Pietro'] },
      { name: 'Eng. Ana Paula Martins', specialty: 'Reforma estrutural e impermeabilização', phone: '(16) 99456-2345', rating: 4.8, projects: 87, condos: ['Dona Sabina', 'Reserva das Amoreiras'] },
    ],
  },
  {
    slug: 'advogados',
    title: 'Advogados Imobiliários',
    icon: '⚖️',
    description: 'Assessoria em leilões, contratos e due diligence',
    professionals: [
      { name: 'Dra. Fernanda Costa', specialty: 'Leilões judiciais e extrajudiciais', phone: '(16) 99456-7890', rating: 5.0, projects: 200, condos: [] },
      { name: 'Dr. Marcos Oliveira', specialty: 'Contratos, usucapião e regularização', phone: '(16) 99567-3456', rating: 4.9, projects: 150, condos: [] },
    ],
  },
  {
    slug: 'designers',
    title: 'Designers de Interiores',
    icon: '🎨',
    description: 'Home staging, decoração e valorização para revenda',
    professionals: [
      { name: 'Juliana Almeida', specialty: 'Home staging para revenda rápida', phone: '(16) 99567-8901', rating: 4.7, projects: 30, condos: ['Collis Residence', 'Gaia'] },
      { name: 'Beatriz Santos', specialty: 'Decoração minimalista e funcional', phone: '(16) 99678-4567', rating: 4.6, projects: 25, condos: ['Piemonte', 'Ville de France'] },
    ],
  },
]

const SCHEMA = CATEGORIES.flatMap(cat =>
  cat.professionals.map(pro => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: pro.name,
    description: `${cat.title} em Franca/SP — ${pro.specialty}`,
    telephone: pro.phone,
    address: { '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP', addressCountry: 'BR' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: pro.rating, reviewCount: pro.projects, bestRating: 5 },
    hasOfferCatalog: { '@type': 'OfferCatalog', name: pro.specialty },
    areaServed: { '@type': 'City', name: 'Franca' },
  }))
)

export default function ProfissionaisPage() {
  return (
    <>
      {SCHEMA.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <Wrench className="w-3.5 h-3.5" /> Rede de Profissionais
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Profissionais Imobiliários em{' '}
            <span style={{ color: '#C9A84C' }}>Franca/SP</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Arquitetos, engenheiros, advogados e designers recomendados para reforma, vistoria, leilões e decoração.
          </p>
        </div>
      </section>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {CATEGORIES.map(cat => (
          <section key={cat.slug} id={cat.slug}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{cat.title} em Franca/SP</h2>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.professionals.map((pro, i) => (
                <div key={i} className="bg-white rounded-2xl border p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#f0ece4' }}>
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{pro.name}</h3>
                      <p className="text-xs text-gray-500">{pro.specialty}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold text-gray-700">{pro.rating}</span>
                    </div>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">{pro.projects} projetos</span>
                  </div>

                  {pro.condos.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Experiência em:</p>
                      <div className="flex flex-wrap gap-1">
                        {pro.condos.map((c, j) => (
                          <Link key={j} href={`/condominios/franca/condominio-${c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}
                            className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100">
                            {c}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <a href={`tel:${pro.phone.replace(/\D/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border hover:bg-gray-50">
                      <Phone className="w-3.5 h-3.5" /> Ligar
                    </a>
                    <a href={`https://wa.me/55${pro.phone.replace(/\D/g, '')}?text=Olá! Vi seu perfil no AgoraEncontrei e gostaria de um orçamento.`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                      style={{ backgroundColor: '#25D366' }}>
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA Cadastro */}
        <section className="bg-gradient-to-r from-[#1B2B5B] to-[#2d4a8a] rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            É profissional do setor imobiliário?
          </h2>
          <p className="text-white/70 mb-6">
            Cadastre-se gratuitamente e apareça nas páginas dos edifícios onde você já trabalhou.
          </p>
          <Link href="/parceiros/cadastro"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-base"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}>
            Cadastrar meu Perfil <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Internal Links */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/leiloes" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">
            🏛️ Leilões de Imóveis
          </Link>
          <Link href="/imoveis?city=Franca" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">
            🏠 Imóveis em Franca
          </Link>
          <Link href="/avaliacao" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">
            📊 Avaliar Imóvel
          </Link>
          <Link href="/financiamento" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">
            💰 Financiamento
          </Link>
        </section>
      </div>
    </>
  )
}
