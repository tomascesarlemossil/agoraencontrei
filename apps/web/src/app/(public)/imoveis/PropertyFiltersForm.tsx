'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

interface Props {
  initialValues: Record<string, string | undefined>
}

const PURPOSE_OPTIONS = [
  { value: '', label: 'Qualquer' },
  { value: 'SALE', label: 'Venda' },
  { value: 'RENT', label: 'Aluguel' },
  { value: 'BOTH', label: 'Venda/Aluguel' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'HOUSE', label: 'Casa' },
  { value: 'APARTMENT', label: 'Apartamento' },
  { value: 'LAND', label: 'Terreno' },
  { value: 'FARM', label: 'Chácara/Sítio' },
  { value: 'WAREHOUSE', label: 'Galpão' },
  { value: 'OFFICE', label: 'Escritório' },
  { value: 'STORE', label: 'Loja/Comercial' },
  { value: 'PENTHOUSE', label: 'Cobertura' },
  { value: 'KITNET', label: 'Kitnet/Studio' },
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Mais recentes' },
  { value: 'price', label: 'Menor preço' },
  { value: '-price', label: 'Maior preço' },
  { value: 'views', label: 'Mais visitados' },
]

const BEDROOM_OPTIONS = ['', '1', '2', '3', '4', '5']

export function PropertyFiltersForm({ initialValues }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAdvanced, setShowAdvanced] = useState(
    !!(initialValues.minPrice || initialValues.maxPrice || initialValues.bedrooms)
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    fd.forEach((v, k) => {
      if (v && String(v).trim()) params.set(k, String(v).trim())
    })
    startTransition(() => {
      router.push(`/imoveis?${params}`)
    })
  }

  function clearFilters() {
    startTransition(() => {
      router.push('/imoveis')
    })
  }

  const hasActiveFilters = Object.entries(initialValues).some(
    ([k, v]) => v && k !== 'sortBy'
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 mb-6 border bg-white"
      style={{ borderColor: '#e8e4dc' }}
    >
      {/* Main row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            name="search"
            defaultValue={initialValues.search}
            placeholder="Buscar bairro, cidade, código..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] transition-all"
            style={{ borderColor: '#e0dbd0' }}
          />
        </div>
        <select
          name="purpose"
          defaultValue={initialValues.purpose ?? ''}
          className="px-3 py-2.5 text-sm rounded-xl border focus:outline-none appearance-none"
          style={{ borderColor: '#e0dbd0' }}
        >
          {PURPOSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          name="type"
          defaultValue={initialValues.type ?? ''}
          className="px-3 py-2.5 text-sm rounded-xl border focus:outline-none appearance-none"
          style={{ borderColor: '#e0dbd0' }}
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          name="sortBy"
          defaultValue={initialValues.sortBy ?? 'createdAt'}
          className="px-3 py-2.5 text-sm rounded-xl border focus:outline-none appearance-none"
          style={{ borderColor: '#e0dbd0' }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: showAdvanced ? '#1B2B5B' : '#9ca3af' }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {showAdvanced ? 'Menos filtros' : 'Mais filtros'}
        </button>
        <div className="flex-1" />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-60"
          style={{ backgroundColor: '#1B2B5B', color: 'white' }}
        >
          <Search className="w-3.5 h-3.5" />
          Buscar
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t" style={{ borderColor: '#e8e4dc' }}>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Preço mínimo (R$)</label>
            <input
              name="minPrice"
              type="number"
              defaultValue={initialValues.minPrice}
              placeholder="0"
              className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none"
              style={{ borderColor: '#e0dbd0' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Preço máximo (R$)</label>
            <input
              name="maxPrice"
              type="number"
              defaultValue={initialValues.maxPrice}
              placeholder="Sem limite"
              className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none"
              style={{ borderColor: '#e0dbd0' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Quartos mín.</label>
            <div className="flex gap-1">
              {BEDROOM_OPTIONS.map(b => (
                <label key={b} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="bedrooms"
                    value={b}
                    defaultChecked={(initialValues.bedrooms ?? '') === b}
                    className="sr-only peer"
                  />
                  <span className="block text-center text-xs py-2 rounded-lg border transition-all peer-checked:bg-[#1B2B5B] peer-checked:text-white peer-checked:border-[#1B2B5B] text-gray-500 hover:border-gray-400 cursor-pointer"
                    style={{ borderColor: '#e0dbd0' }}>
                    {b || 'T'}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Cidade</label>
            <input
              name="city"
              defaultValue={initialValues.city}
              placeholder="Ex: Franca"
              className="w-full px-3 py-2 text-sm rounded-xl border focus:outline-none"
              style={{ borderColor: '#e0dbd0' }}
            />
          </div>
        </div>
      )}
    </form>
  )
}
