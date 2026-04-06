'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Star, MapPin, Building, AlertTriangle, Wrench, Scale, Phone, ExternalLink } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oenbzvxcsgyzqjtlovdq.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

interface AuctionData {
  id: string; title: string; slug: string; minimumBid: number;
  appraisalValue: number; discountPercent: number; opportunityScore: number;
  source: string;
}

// ── Profissionais recomendados (mock — substituir por dados do banco) ────────
const PROFESSIONALS = [
  { type: 'Arquiteto', name: 'Arq. Marina Ribeiro', specialty: 'Reforma de apartamentos', phone: '(16) 99234-5678', rating: 4.8 },
  { type: 'Engenheiro Civil', name: 'Eng. Carlos Pereira', specialty: 'Laudo técnico e vistoria', phone: '(16) 99345-6789', rating: 4.9 },
  { type: 'Advogado Imobiliário', name: 'Dra. Fernanda Costa', specialty: 'Leilões e due diligence', phone: '(16) 99456-7890', rating: 5.0 },
  { type: 'Designer de Interiores', name: 'Juliana Almeida', specialty: 'Home staging para revenda', phone: '(16) 99567-8901', rating: 4.7 },
]

export default function CondoIntelligence({ condoName, condoSlug, properties }: {
  condoName: string
  condoSlug: string
  properties: any[]
}) {
  const [auctions, setAuctions] = useState<AuctionData[]>([])
  const [avgPriceM2, setAvgPriceM2] = useState<number | null>(null)

  useEffect(() => {
    // Calcular preço/m² médio dos imóveis do condomínio
    const prices = properties
      .filter((p: any) => p.price && p.totalArea && Number(p.totalArea) > 0)
      .map((p: any) => Number(p.price) / Number(p.totalArea))
    if (prices.length > 0) {
      setAvgPriceM2(prices.reduce((a: number, b: number) => a + b, 0) / prices.length)
    }

    // Buscar leilões neste condomínio
    async function loadAuctions() {
      try {
        const res = await fetch(`${API_URL}/api/v1/auctions?search=${encodeURIComponent(condoName)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          if (data.data?.length > 0) { setAuctions(data.data); return }
        }
      } catch {}

      // Fallback Supabase
      if (!SUPABASE_ANON_KEY) return
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/auctions?select=id,title,slug,"minimumBid","appraisalValue","discountPercent","opportunityScore",source&or=(title.ilike.*${encodeURIComponent(condoName)}*,neighborhood.ilike.*${encodeURIComponent(condoName)}*)&status=not.in.(CANCELLED,CLOSED)&limit=10`,
          { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
        )
        if (res.ok) setAuctions(await res.json())
      } catch {}
    }
    loadAuctions()
  }, [condoName])

  return (
    <div className="space-y-8">
      {/* Painel de Inteligência */}
      <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b" style={{ background: 'linear-gradient(135deg, #1B2B5B, #2d4a8a)' }}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9A84C]" />
            Painel de Inteligência — {condoName}
          </h2>
          <p className="text-white/60 text-xs mt-0.5">Dados atualizados em tempo real do marketplace</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
          {/* Valor Médio m² */}
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <div className="text-xs text-blue-600 font-medium mb-1">Valor Médio m²</div>
            <div className="text-xl font-bold text-blue-800">
              {avgPriceM2 ? fmt(avgPriceM2) : '—'}
            </div>
          </div>

          {/* Imóveis Disponíveis */}
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <div className="text-xs text-green-600 font-medium mb-1">Disponíveis</div>
            <div className="text-xl font-bold text-green-800">{properties.length}</div>
            <div className="text-[10px] text-green-500">imóveis ativos</div>
          </div>

          {/* Leilões Ativos */}
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#fffbeb' }}>
            <div className="text-xs font-medium mb-1" style={{ color: '#C9A84C' }}>Leilões Ativos</div>
            <div className="text-xl font-bold" style={{ color: '#92711a' }}>
              {auctions.length}
            </div>
            {auctions.length > 0 && auctions[0]?.discountPercent && (
              <div className="text-[10px] text-red-500 font-bold">até {Math.max(...auctions.map(a => a.discountPercent || 0))}% desc.</div>
            )}
          </div>

          {/* Score Médio */}
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <div className="text-xs text-purple-600 font-medium mb-1">Score Médio</div>
            <div className="text-xl font-bold text-purple-800">
              {auctions.length > 0
                ? Math.round(auctions.reduce((a, b) => a + (b.opportunityScore || 0), 0) / auctions.length)
                : '—'}
            </div>
            <div className="text-[10px] text-purple-400">/100</div>
          </div>
        </div>
      </section>

      {/* Oportunidades de Leilão */}
      {auctions.length > 0 && (
        <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ background: 'linear-gradient(135deg, #C9A84C, #e6c96a)' }}>
            <h2 className="text-lg font-bold text-[#1B2B5B] flex items-center gap-2">
              🏛️ Oportunidades de Leilão no {condoName}
            </h2>
            <p className="text-[#1B2B5B]/60 text-xs mt-0.5">Imóveis abaixo do valor de mercado neste edifício</p>
          </div>
          <div className="divide-y">
            {auctions.map(a => (
              <Link key={a.id} href={`/leiloes/${a.slug}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{a.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{a.source}</span>
                    {a.opportunityScore && (
                      <span className={`font-bold ${a.opportunityScore >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        Score {a.opportunityScore}/100
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {a.appraisalValue && (
                    <p className="text-xs text-gray-400 line-through">{fmt(Number(a.appraisalValue))}</p>
                  )}
                  <p className="text-lg font-bold" style={{ color: '#1B2B5B' }}>{fmt(Number(a.minimumBid))}</p>
                  {a.discountPercent && (
                    <span className="text-xs font-bold text-red-600">-{a.discountPercent}%</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ecossistema de Profissionais */}
      <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#C9A84C]" />
            Profissionais Recomendados
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Pensando em reformar no {condoName}? Confira profissionais com experiência neste edifício.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
          {PROFESSIONALS.map((pro, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border hover:shadow-sm transition">
              <div className="w-10 h-10 rounded-full bg-[#1B2B5B] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {pro.type === 'Arquiteto' ? '🏗️' : pro.type === 'Engenheiro Civil' ? '⚙️' : pro.type === 'Advogado Imobiliário' ? '⚖️' : '🎨'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800">{pro.name}</p>
                <p className="text-xs text-gray-500">{pro.type} — {pro.specialty}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-700">{pro.rating}</span>
                  </div>
                  <a href={`tel:${pro.phone.replace(/\D/g, '')}`} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                    <Phone className="w-3 h-3" /> {pro.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4">
          <Link href="/profissionais/franca"
            className="text-sm font-semibold text-[#C9A84C] hover:underline flex items-center gap-1">
            Ver todos os profissionais em Franca →
          </Link>
        </div>
      </section>

      {/* SEO Content — Internal Links */}
      <section className="bg-gray-50 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Sobre o {condoName} em Franca/SP
        </h2>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p>
            O <strong>{condoName}</strong> é um dos empreendimentos mais buscados em <Link href="/imoveis?city=Franca" className="text-[#C9A84C] hover:underline font-semibold">Franca/SP</Link>.
            {avgPriceM2 && ` O valor médio do m² neste edifício é de ${fmt(avgPriceM2)}, baseado em ${properties.length} imóveis ativos no marketplace.`}
          </p>
          {auctions.length > 0 && (
            <p>
              Atualmente, existem <strong>{auctions.length} imóvel(is) em leilão</strong> neste condomínio, com descontos de até {Math.max(...auctions.map(a => a.discountPercent || 0))}%.
              Consulte nossa <Link href="/leiloes" className="text-[#C9A84C] hover:underline font-semibold">página de leilões</Link> para oportunidades de investimento.
            </p>
          )}
          <p>
            Precisa de assessoria? A <Link href="/parceiros/imobiliaria-lemos" className="text-[#C9A84C] hover:underline font-semibold">Imobiliária Lemos</Link>,
            com 22+ anos de experiência em Franca, oferece atendimento especializado para compra, venda e
            <Link href="/leilao-imoveis-franca-sp" className="text-[#C9A84C] hover:underline font-semibold"> leilões de imóveis</Link>.
          </p>
        </div>

        {/* Related Links */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link href="/imoveis?city=Franca&purpose=SALE" className="text-xs text-center p-2 bg-white rounded-lg border hover:border-[#C9A84C] transition">
            Casas à venda em Franca
          </Link>
          <Link href="/imoveis?city=Franca&purpose=RENT" className="text-xs text-center p-2 bg-white rounded-lg border hover:border-[#C9A84C] transition">
            Aluguel em Franca
          </Link>
          <Link href="/leiloes?city=Franca" className="text-xs text-center p-2 bg-white rounded-lg border hover:border-[#C9A84C] transition">
            Leilões em Franca
          </Link>
          <Link href="/avaliacao" className="text-xs text-center p-2 bg-white rounded-lg border hover:border-[#C9A84C] transition">
            Avaliar meu imóvel
          </Link>
        </div>
      </section>
    </div>
  )
}
