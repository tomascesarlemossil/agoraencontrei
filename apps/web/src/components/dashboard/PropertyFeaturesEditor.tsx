'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

// Curated list based on real Imobiliária Lemos data
const PRESET_FEATURES = [
  // Ambientes
  'Sala de Estar', 'Sala de TV', 'Sala de Jantar', 'Cozinha', 'Cozinha americana',
  'Cozinha planejada', 'Copa', 'Lavabo', 'Banheiro', 'Banheiro auxiliar',
  'Banheiro empregada', 'Closet', 'Edícula', 'Dormitório empregada', 'Despensa', 'Hall',
  // Lazer
  'Piscina', 'Piscina aquecida', 'Piscina privativa', 'Piscina infantil',
  'Churrasqueira', 'Varanda', 'Varanda gourmet', 'Sacada frente', 'Sacada fundo',
  'Sacada lateral', 'Terraço', 'Deck', 'Jardim', 'Jardim de Inverno',
  'Salão de festas', 'Salão gourmet', 'Salão de jogos', 'Sala de cinema',
  'Sauna', 'Sauna privativa', 'Academia', 'Playground', 'Quadra esportiva',
  'Campo de futebol', 'SPA', 'Ofurô', 'Adega', 'Bar',
  // Segurança e comodidades
  'Portão eletrônico', 'Portaria 24h', 'Guarita', 'Zelador', 'Interfone',
  'Fechadura eletrônica', 'Automatizado',
  // Infraestrutura
  'Ar condicionado', 'Aquecimento solar', 'Água quente', 'Lareira',
  'Elevador de serviço', 'Hidrômetro individual', 'Reservatório de água',
  'Poço artesiano', 'Energia', 'Água', 'Esgoto', 'Pavimentação',
  // Acabamentos
  'Porcelanato', 'Mármore', 'Laminado', 'Piso cerâmica', 'Piso frio',
  'Roupeiro', 'Armários', 'Box Blindex',
  // Área externa
  'Murado', 'Quintal', 'Garagem Fechada', 'Área de lazer', 'Área de Serviço',
  'Área de serviço', 'Entrada de serviço', 'Junto ao muro',
  // Rural
  'Pasto', 'Celeiro', 'Cerca', 'Curral', 'Chiqueiro', 'Baias',
  'Fornalha', 'Forno', 'Forno Pão/Pizza', 'Fogão á lenha', 'Rio',
  'Casa caseiro', 'Área verde', 'Vista livre', 'Sol da tarde', 'Rua silenciosa',
  // Outros
  'Reformado', 'Acesso deficientes', 'Biblioteca', 'Brinquedoteca',
  'Estar íntimo', 'Suíte master',
]

interface Props {
  selected: string[]
  onChange: (features: string[]) => void
}

export function PropertyFeaturesEditor({ selected, onChange }: Props) {
  const [search, setSearch] = useState('')
  const [customInput, setCustomInput] = useState('')

  const filtered = PRESET_FEATURES.filter(f =>
    !selected.includes(f) &&
    f.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(feature: string) {
    if (selected.includes(feature)) {
      onChange(selected.filter(f => f !== feature))
    } else {
      onChange([...selected, feature])
    }
  }

  function addCustom() {
    const v = customInput.trim()
    if (!v || selected.includes(v)) return
    onChange([...selected, v])
    setCustomInput('')
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
        Itens do Imóvel <span className="text-white/20 font-normal normal-case">({selected.length} selecionados)</span>
      </h3>

      {/* Selected features */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...selected].sort().map(f => (
            <button
              key={f}
              type="button"
              onClick={() => toggle(f)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            >
              {f}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Search + add custom */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar item..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <input
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Item personalizado..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white hover:bg-white/20 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-64 overflow-y-auto pr-1">
        {filtered.slice(0, 60).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => toggle(f)}
            className="text-left px-2.5 py-1.5 rounded-lg text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors border border-transparent hover:border-white/10 truncate"
          >
            + {f}
          </button>
        ))}
        {filtered.length === 0 && search && (
          <p className="col-span-full text-xs text-white/30 text-center py-2">
            Nenhum item encontrado. Use "Adicionar" para criar.
          </p>
        )}
      </div>
    </div>
  )
}
