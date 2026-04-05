'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Columns2, BedDouble, Bath, Car, Maximize, Building2, Loader2, Trash2, ChevronLeft } from 'lucide-react'
import { useCompare } from '@/hooks/useCompare'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const fmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const PURPOSE_LABEL: Record<string, string> = {
  SALE: 'Venda',
  RENT: 'Aluguel',
  BOTH: 'Venda/Aluguel',
  SEASON: 'Temporada',
}

type Row = {
  label: string
  key: string
  format?: (value: any) => string
  highlight?: 'lower' | 'higher'
}

const ROWS: Row[] = [
  { label: 'Preco de Venda', key: 'price', format: (v) => v ? fmt.format(Number(v)) : '—', highlight: 'lower' },
  { label: 'Aluguel', key: 'priceRent', format: (v) => v ? `${fmt.format(Number(v))}/mes` : '—', highlight: 'lower' },
  { label: 'Condominio', key: 'condoFee', format: (v) => v ? fmt.format(Number(v)) : '—', highlight: 'lower' },
  { label: 'IPTU', key: 'iptu', format: (v) => v ? fmt.format(Number(v)) : '—', highlight: 'lower' },
  { label: 'Area Total', key: 'totalArea', format: (v) => v ? `${v} m2` : '—', highlight: 'higher' },
  { label: 'Area Util', key: 'usableArea', format: (v) => v ? `${v} m2` : '—', highlight: 'higher' },
  { label: 'Quartos', key: 'bedrooms', format: (v) => v > 0 ? String(v) : '—', highlight: 'higher' },
  { label: 'Banheiros', key: 'bathrooms', format: (v) => v > 0 ? String(v) : '—', highlight: 'higher' },
  { label: 'Vagas', key: 'parkingSpaces', format: (v) => v > 0 ? String(v) : '—', highlight: 'higher' },
  { label: 'Suites', key: 'suites', format: (v) => v > 0 ? String(v) : '—', highlight: 'higher' },
  { label: 'Finalidade', key: 'purpose', format: (v) => PURPOSE_LABEL[v] ?? v ?? '—' },
  { label: 'Bairro', key: 'neighborhood', format: (v) => v || '—' },
  { label: 'Cidade', key: 'city', format: (v) => v || '—' },
]

function getBestIndex(properties: any[], key: string, mode: 'lower' | 'higher'): number | null {
  const values = properties.map(p => {
    const v = Number(p[key])
    return isNaN(v) || v <= 0 ? null : v
  })
  const validValues = values.filter((v): v is number => v !== null)
  if (validValues.length < 2) return null

  const best = mode === 'lower' ? Math.min(...validValues) : Math.max(...validValues)
  const idx = values.indexOf(best)
  // Only highlight if there's actually a difference
  const allSame = validValues.every(v => v === validValues[0])
  if (allSame) return null
  return idx
}

export default function CompararPage() {
  const { compareIds, hydrated, clearCompare } = useCompare()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!hydrated) return

    if (compareIds.length < 2) {
      setProperties([])
      setLoading(false)
      return
    }

    async function fetchProperties() {
      setLoading(true)
      setError(false)
      try {
        const ids = compareIds.join(',')
        const res = await fetch(`${API_URL}/api/v1/public/properties?ids=${ids}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setProperties(data.data ?? [])
      } catch {
        setError(true)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [hydrated, compareIds])

  // Collect all features across all properties
  const allFeatures = Array.from(
    new Set(properties.flatMap(p => (p.features ?? []).map((f: any) => typeof f === 'string' ? f : f.name ?? f.label ?? '')).filter(Boolean))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/imoveis"
            className="inline-flex items-center gap-1 text-sm mb-3 hover:opacity-80 transition-opacity"
            style={{ color: '#1B2B5B' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar aos imoveis
          </Link>
          <h1
            className="text-2xl font-bold flex items-center gap-3"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            <Columns2 className="w-6 h-6" style={{ color: '#C9A84C' }} />
            Comparar Imoveis
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {hydrated && !loading
              ? properties.length > 0
                ? `Comparando ${properties.length} imoveis`
                : 'Selecione pelo menos 2 imoveis para comparar'
              : 'Carregando...'}
          </p>
        </div>

        {properties.length > 0 && (
          <button
            onClick={clearCompare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-red-200"
          >
            <Trash2 className="w-4 h-4" />
            Limpar tudo
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B2B5B' }} />
          <p className="text-gray-500 text-sm mt-3">Carregando imoveis...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-gray-700 text-lg font-bold mb-2">Erro ao carregar imoveis</p>
          <p className="text-gray-500 text-sm mb-6">
            Nao foi possivel carregar os imoveis para comparacao. Tente novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && hydrated && properties.length < 2 && (
        <div className="text-center py-16">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(27, 43, 91, 0.08)' }}
          >
            <Columns2 className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-700 text-xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Selecione imoveis para comparar
          </p>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Navegue pelos imoveis e clique no botao &quot;Comparar&quot; para adicionar ate 4 imoveis a comparacao lado a lado.
          </p>
          <Link
            href="/imoveis"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: '#1B2B5B', color: 'white' }}
          >
            Explorar imoveis
          </Link>
        </div>
      )}

      {/* Comparison table */}
      {!loading && !error && properties.length >= 2 && (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[640px] border-collapse">
            {/* Property photos & titles header */}
            <thead>
              <tr>
                <th
                  className="w-44 min-w-[176px] p-3 text-left text-xs font-semibold uppercase tracking-wider rounded-tl-xl"
                  style={{ backgroundColor: '#1B2B5B', color: '#C9A84C' }}
                >
                  Caracteristica
                </th>
                {properties.map(p => (
                  <th
                    key={p.id}
                    className="p-3 text-center min-w-[180px]"
                    style={{ backgroundColor: '#1B2B5B' }}
                  >
                    <Link href={`/imoveis/${p.slug}`} className="block group">
                      <div className="w-full h-28 rounded-lg overflow-hidden mb-2" style={{ backgroundColor: '#f0ece4' }}>
                        {p.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.coverImage}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-white/20" />
                          </div>
                        )}
                      </div>
                      <p className="text-white text-xs font-medium line-clamp-2 group-hover:underline">
                        {p.title}
                      </p>
                      <p className="text-white/50 text-xs mt-0.5 truncate">
                        {[p.neighborhood, p.city].filter(Boolean).join(' - ')}
                      </p>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Comparison rows */}
            <tbody>
              {ROWS.map((row, rowIdx) => {
                const bestIdx = row.highlight ? getBestIndex(properties, row.key, row.highlight) : null
                return (
                  <tr
                    key={row.key}
                    className={rowIdx % 2 === 0 ? 'bg-white' : ''}
                    style={rowIdx % 2 !== 0 ? { backgroundColor: '#faf8f4' } : undefined}
                  >
                    <td
                      className="p-3 text-sm font-medium border-r"
                      style={{ color: '#1B2B5B', borderColor: '#e8e4dc' }}
                    >
                      {row.label}
                    </td>
                    {properties.map((p, colIdx) => {
                      const formatted = row.format ? row.format(p[row.key]) : (p[row.key] ?? '—')
                      const isBest = bestIdx === colIdx
                      return (
                        <td
                          key={p.id}
                          className={`p-3 text-sm text-center border-r ${isBest ? 'font-bold' : 'text-gray-700'}`}
                          style={{
                            borderColor: '#e8e4dc',
                            ...(isBest ? { color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.06)' } : {}),
                          }}
                        >
                          {formatted}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Features rows */}
              {allFeatures.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={properties.length + 1}
                      className="p-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ backgroundColor: '#1B2B5B', color: '#C9A84C' }}
                    >
                      Caracteristicas
                    </td>
                  </tr>
                  {allFeatures.map((feature, fIdx) => (
                    <tr
                      key={feature}
                      className={fIdx % 2 === 0 ? 'bg-white' : ''}
                      style={fIdx % 2 !== 0 ? { backgroundColor: '#faf8f4' } : undefined}
                    >
                      <td
                        className="p-3 text-sm font-medium border-r"
                        style={{ color: '#1B2B5B', borderColor: '#e8e4dc' }}
                      >
                        {feature}
                      </td>
                      {properties.map(p => {
                        const features = (p.features ?? []).map((f: any) => typeof f === 'string' ? f : f.name ?? f.label ?? '')
                        const has = features.includes(feature)
                        return (
                          <td
                            key={p.id}
                            className="p-3 text-sm text-center border-r"
                            style={{ borderColor: '#e8e4dc', color: has ? '#16a34a' : '#d1d5db' }}
                          >
                            {has ? '✓' : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
