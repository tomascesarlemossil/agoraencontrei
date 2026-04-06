import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Building2, MessageCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export const metadata: Metadata = {
  title: 'Apartamentos à Venda em Franca SP | Imobiliária Lemos',
  description: 'Compre seu apartamento em Franca/SP com a Imobiliária Lemos. Mais de 200 apartamentos à venda: studios, 1, 2 e 3 quartos. Lançamentos e usados. Financiamento facilitado..',
  keywords: [
    'apartamentos à venda franca sp', 'apartamento à venda franca', 'comprar apartamento franca sp',
    'venda apartamento franca sp', 'apartamento venda franca', 'comprar apartamento franca',
    'apartamentos novos franca sp', 'lançamento apartamento franca sp', 'apartamento 2 quartos venda franca sp',
    'apartamento 3 quartos venda franca sp', 'apartamento alto padrão franca sp',
    'apartamento financiamento franca sp', 'apartamento minha casa minha vida franca',
    'imobiliária lemos apartamento venda', 'agoraencontrei apartamentos venda franca',
  ],
  openGraph: {
    title: 'Apartamentos à Venda em Franca SP | Imobiliária Lemos',
    description: 'Encontre o apartamento ideal em Franca/SP. Lançamentos, usados, financiamento facilitado. Imobiliária Lemos.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/apartamentos-a-venda-franca-sp' },
  robots: { index: true, follow: true },
}

export const revalidate = 300

async function fetchApartamentosVenda() {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?type=APARTMENT&purpose=SALE&city=Franca&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return { data: [], meta: { total: 0 } }
    return res.json()
  } catch {
    return { data: [], meta: { total: 0 } }
  }
}

function fmtPrice(p: any) {
  const v = Number(p.price) || 0
  if (!v) return 'Consulte'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default async function ApartamentosAVendaFrancaSP() {
  const result = await fetchApartamentosVenda()
  const properties = result.data ?? []
  const total = result.meta?.total ?? 0

  return (
    <>
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <Building2 className="w-3.5 h-3.5" />Imobiliária Lemos — 22+ anos em Franca/SP
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Apartamentos à Venda<br /><span style={{ color: '#C9A84C' }}>em Franca/SP</span>
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            {total > 0 ? `${total} apartamentos disponíveis` : 'Centenas de apartamentos disponíveis'} para compra.
            Studios, 1, 2 e 3 quartos. Lançamentos e usados com financiamento facilitado.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?type=APARTMENT&purpose=SALE&city=Franca"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              Ver todos os apartamentos <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Quero comprar um apartamento em Franca/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            {total > 0 ? `${total} Apartamentos à Venda em Franca` : 'Apartamentos à Venda'}
          </h2>
          <Link href="/imoveis?type=APARTMENT&purpose=SALE&city=Franca"
            className="text-sm font-semibold flex items-center gap-1" style={{ color: '#C9A84C' }}>
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((p: any) => (
              <Link key={p.id} href={`/imoveis/${p.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {p.coverImage ? (
                    <Image src={p.coverImage} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="25vw" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, #1B2B5B15, #C9A84C15)' }}>🏢</div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-[#1B2B5B]" style={{ background: '#C9A84C' }}>Venda</div>
                </div>
                <div className="p-4">
                  <p className="font-bold text-base mb-0.5" style={{ color: '#1B2B5B' }}>{fmtPrice(p)}</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.title}</p>
                  {p.neighborhood && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.neighborhood}, Franca/SP</p>}
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    {p.bedrooms > 0 && <span>{p.bedrooms} quarto{p.bedrooms > 1 ? 's' : ''}</span>}
                    {p.totalArea > 0 && <span>{p.totalArea}m²</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Link href="/imoveis?type=APARTMENT&purpose=SALE" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white" style={{ background: '#1B2B5B' }}>
              Ver todos os apartamentos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
        {total > 12 && (
          <div className="text-center mt-8">
            <Link href="/imoveis?type=APARTMENT&purpose=SALE&city=Franca" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white" style={{ background: '#1B2B5B' }}>
              Ver todos os {total} apartamentos à venda <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="bg-white border-t py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>Comprar Apartamento em Franca/SP</h2>
          <p className="text-gray-600 mb-4">
            O mercado de apartamentos em Franca/SP é dinâmico e diversificado, com opções para todos os perfis e orçamentos.
            A cidade tem recebido novos empreendimentos de construtoras como Bild, Perplan e Ascen, ampliando a oferta de lançamentos.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Preços de apartamentos em Franca/SP</h3>
          <p className="text-gray-600 mb-4">
            Studios e kitinetes: R$ 120.000–200.000. Apartamentos 2 quartos: R$ 200.000–450.000.
            Apartamentos 3 quartos: R$ 350.000–800.000. Coberturas e alto padrão: a partir de R$ 600.000.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Lançamentos imobiliários em Franca</h3>
          <p className="text-gray-600">
            A Imobiliária Lemos é parceira das principais construtoras de Franca e região, oferecendo acesso exclusivo
            a lançamentos com condições especiais de pagamento e financiamento. Cadastre-se para receber novidades.
          </p>
        </div>
      </section>
    </>
  )
}
