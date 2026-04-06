import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Imóveis na Região de Franca/SP | Imobiliária Lemos',
  description: 'Encontre imóveis em Franca e toda a região: Batatais, Cristais Paulista, Pedregulho, Rifaina, Patrocínio Paulista, Altinópolis e mais. Imobiliária Lemos — referência desde 2002.',
  keywords: ["imóveis região franca sp", "imóveis interior sp franca", "imobiliária franca região", "casas venda franca região", "imóveis cidades próximas franca sp"],
  openGraph: {
    title: 'Imóveis na Região de Franca/SP | Imobiliária Lemos',
    description: 'Imóveis em Franca e toda a região com a Imobiliária Lemos.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/imoveis-regiao-franca-sp' },
  robots: { index: true, follow: true },
}

const CIDADES_REGIAO = [
  { nome: 'Franca', slug: 'franca', dist: 'Centro', href: '/imoveis?city=Franca' },
  { nome: 'Batatais', slug: 'batatais', dist: '60km', href: '/imoveis-batatais-sp' },
  { nome: 'Cristais Paulista', slug: 'cristais-paulista', dist: '30km', href: '/imoveis-cristais-paulista-sp' },
  { nome: 'Pedregulho', slug: 'pedregulho', dist: '50km', href: '/imoveis-pedregulho-sp' },
  { nome: 'Patrocínio Paulista', slug: 'patrocinio-paulista', dist: '35km', href: '/imoveis-patrocinio-paulista-sp' },
  { nome: 'Altinópolis', slug: 'altinopolis', dist: '80km', href: '/imoveis-altinopolis-sp' },
  { nome: 'Brodowski', slug: 'brodowski', dist: '70km', href: '/imoveis-brodowski-sp' },
  { nome: 'Rifaina', slug: 'rifaina', dist: '55km', href: '/imoveis-rifaina-sp' },
  { nome: 'Itirapuã', slug: 'itirapua', dist: '40km', href: '/imoveis/em/itirapua' },
  { nome: 'Restinga', slug: 'restinga', dist: '45km', href: '/imoveis/em/restinga' },
  { nome: 'Jeriquara', slug: 'jeriquara', dist: '25km', href: '/imoveis/em/jeriquara' },
  { nome: 'Nuporanga', slug: 'nuporanga', dist: '65km', href: '/imoveis/em/nuporanga' },
]

export default function RegiaoFrancaPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> Franca e Região · Imobiliária Lemos
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis na Região<br />de Franca/SP
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            Casas, apartamentos e terrenos em Franca e todas as cidades da região. Imobiliária Lemos — 22 anos atendendo o interior paulista.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Cidades da Região de Franca/SP
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CIDADES_REGIAO.map((cidade) => (
            <Link key={cidade.slug} href={cidade.href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: '#1B2B5B' }}>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{cidade.nome}/SP</p>
                <p className="text-xs text-gray-400">{cidade.dist} de Franca</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Imobiliária Lemos — Franca/SP
          </h2>
          <p className="text-white/70 mb-5">22 anos de tradição · Atendemos toda a região</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href="tel:+551637230045"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
              <Phone className="w-4 h-4" /> (16) 3723-0045
            </a>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1B2B5B]"
              style={{ background: '#C9A84C' }}>
              <Home className="w-4 h-4" /> Página Inicial
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
