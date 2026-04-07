'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, MapPin } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-669c.up.railway.app'

interface CityRank {
  city: string
  avgDiscount: number
  activeAuctions: number
}

const FALLBACK_DATA: CityRank[] = [
  { city: 'Franca', avgDiscount: 45, activeAuctions: 12 },
  { city: 'Ribeirão Preto', avgDiscount: 42, activeAuctions: 28 },
  { city: 'Goiânia', avgDiscount: 40, activeAuctions: 35 },
  { city: 'Praia Grande', avgDiscount: 38, activeAuctions: 19 },
  { city: 'Campinas', avgDiscount: 35, activeAuctions: 22 },
]

export function TopOpportunityCities() {
  const [cities, setCities] = useState<CityRank[]>(FALLBACK_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/public/auctions`)
        if (!res.ok) throw new Error('API error')
        const auctions = await res.json()

        const items = Array.isArray(auctions) ? auctions : auctions.data ?? auctions.items ?? []
        if (!items.length) throw new Error('No data')

        const cityMap = new Map<string, { totalDiscount: number; count: number }>()

        for (const item of items) {
          const city = item.city || item.cidade
          const discount = item.discount ?? item.desconto ?? item.desagio ?? 0
          if (!city || discount <= 0) continue

          const existing = cityMap.get(city)
          if (existing) {
            existing.totalDiscount += discount
            existing.count += 1
          } else {
            cityMap.set(city, { totalDiscount: discount, count: 1 })
          }
        }

        const ranked: CityRank[] = Array.from(cityMap.entries())
          .map(([city, { totalDiscount, count }]) => ({
            city,
            avgDiscount: Math.round((totalDiscount / count) * 10) / 10,
            activeAuctions: count,
          }))
          .sort((a, b) => b.avgDiscount - a.avgDiscount)
          .slice(0, 5)

        if (ranked.length > 0) setCities(ranked)
      } catch {
        /* keep fallback data */
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: '#1B2B5B' }}>
            ONDE ESTÁ O LUCRO?
          </h2>
          <p className="text-gray-500 text-sm md:text-base mt-2">
            Cidades com maior deságio médio em relação ao valor de mercado
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {cities.map((city, index) => (
            <div
              key={city.city}
              className={`group relative bg-gray-50 hover:bg-green-600 rounded-2xl p-5 transition-all duration-300 cursor-pointer border border-gray-100 hover:border-green-600 hover:shadow-lg ${
                loading ? 'animate-pulse' : ''
              }`}
            >
              {/* Rank badge */}
              <div
                className="absolute -top-3 -left-1 text-xs font-black px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: index === 0 ? '#C9A84C' : '#1B2B5B' }}
              >
                #{index + 1}
              </div>

              {/* City name */}
              <div className="mt-2 flex items-center gap-1.5 mb-3">
                <MapPin className="w-4 h-4 text-gray-400 group-hover:text-white/80 transition-colors" />
                <h3 className="font-bold text-sm truncate group-hover:text-white transition-colors" style={{ color: '#1B2B5B' }}>
                  {city.city}
                </h3>
              </div>

              {/* Discount */}
              <div className="mb-2">
                <div className="text-3xl font-black text-green-600 group-hover:text-white transition-colors">
                  {city.avgDiscount}%
                </div>
                <div className="text-[10px] text-gray-400 group-hover:text-white/70 transition-colors font-medium">
                  deságio médio
                </div>
              </div>

              {/* Active auctions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 group-hover:border-white/20 transition-colors">
                <span className="text-xs text-gray-500 group-hover:text-white/80 transition-colors">
                  {city.activeAuctions} leilões ativos
                </span>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
