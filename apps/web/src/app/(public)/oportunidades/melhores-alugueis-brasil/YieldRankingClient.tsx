'use client'

import { useState } from 'react'
import { TrendingUp, MapPin, ArrowRight, Star, BarChart3, Calculator, MessageCircle, ChevronDown } from 'lucide-react'
import { CIDADES_YIELD_REFERENCIA, calculateYield, formatBRL, type CidadeYield } from '@/lib/rental-yield-engine'

function YieldBar({ value, max = 15 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = value > 10 ? 'bg-green-500' : value > 7 ? 'bg-blue-500' : value > 4 ? 'bg-yellow-500' : 'bg-red-400'
  return (
    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function CidadeCard({ cidade, rank }: { cidade: CidadeYield; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const yield_ = calculateYield(cidade.precoMedioLeilao, cidade.aluguelMedio)

  return (
    <div className="bg-white rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: rank <= 3 ? '#C9A84C' : '#1B2B5B' }}
            >
              {rank}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{cidade.cidade}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5" /> {cidade.estado}
                <span className="mx-1 text-gray-300">|</span>
                <span className="font-medium">{cidade.totalImoveis} imóveis</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${yield_.classificacaoCor}`}>
              {cidade.yieldAnual.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">yield anual</div>
          </div>
        </div>

        {/* Yield Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Termômetro de Yield</span>
            <span>{yield_.classificacaoIcon} {yield_.classificacaoLabel}</span>
          </div>
          <YieldBar value={cidade.yieldAnual} />
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Lance Médio</div>
            <div className="font-bold text-sm" style={{ color: '#1B2B5B' }}>{formatBRL(cidade.precoMedioLeilao)}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Aluguel Médio</div>
            <div className="font-bold text-sm text-green-600">{formatBRL(cidade.aluguelMedio)}/mês</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">Payback</div>
            <div className="font-bold text-sm text-orange-600">{cidade.paybackAnos} anos</div>
          </div>
        </div>

        {/* Spread comparison */}
        <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3 mb-3">
          <div className="text-sm">
            <span className="text-gray-600">Leilão: </span>
            <span className="font-bold" style={{ color: '#1B2B5B' }}>R$ {cidade.precoM2Leilao.toLocaleString('pt-BR')}/m²</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="text-sm">
            <span className="text-gray-600">Mercado: </span>
            <span className="font-bold text-red-500">R$ {cidade.precoM2Mercado.toLocaleString('pt-BR')}/m²</span>
          </div>
          <div className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            -{cidade.spreadVsMercado}%
          </div>
        </div>

        {/* Autossustentável badge */}
        {yield_.autossustentavel && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl px-4 py-2.5 mb-3">
            <span className="text-lg">💎</span>
            <div>
              <div className="text-xs font-bold text-yellow-800">IMÓVEL AUTOSSUSTENTÁVEL</div>
              <div className="text-[10px] text-yellow-700">Aluguel estimado cobre a parcela BNDES</div>
            </div>
          </div>
        )}

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Menos detalhes' : 'Mais detalhes'}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Yield mensal</span>
              <span className="font-semibold">{yield_.yieldMensal}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Spread vs renda fixa (SELIC 14.25%)</span>
              <span className={`font-semibold ${cidade.yieldAnual > 14.25 ? 'text-green-600' : 'text-red-500'}`}>
                {(cidade.yieldAnual - 14.25).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Parcela BNDES est. (30 anos)</span>
              <span className="font-semibold">{formatBRL(cidade.precoMedioLeilao * 0.0085)}/mês</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mt-2">
              Enquanto este leilão em {cidade.cidade} tem lance médio de R$ {cidade.precoM2Leilao.toLocaleString('pt-BR')}/m²,
              imóveis similares no QuintoAndar estão sendo alugados por R$ {Math.round(cidade.aluguelMedio / 70)}/m².
              O retorno estimado supera a poupança em {Math.round(cidade.yieldAnual / 0.7)}x.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function YieldRankingClient() {
  const [sortBy, setSortBy] = useState<'yield' | 'payback' | 'spread'>('yield')
  const cidades = [...CIDADES_YIELD_REFERENCIA].sort((a, b) => {
    if (sortBy === 'yield') return b.yieldAnual - a.yieldAnual
    if (sortBy === 'payback') return a.paybackAnos - b.paybackAnos
    return b.spreadVsMercado - a.spreadVsMercado
  })

  const whatsappMsg = encodeURIComponent(
    'Olá! Vi no AgoraEncontrei o ranking de yield nacional. Quero receber alertas de imóveis com Yield > 10% no meu WhatsApp.'
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative py-16 px-4" style={{ backgroundColor: '#1B2B5B' }}>
        <div className="max-w-5xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <BarChart3 className="w-3.5 h-3.5" /> Inteligência de Mercado
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Melhores Cidades para<br />Investir em Leilão no Brasil
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-6">
            Cruzamento de dados reais: Caixa + Santander + QuintoAndar + ZAP Imóveis.
            Descubra onde o aluguel paga as parcelas do arremate mais rápido.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {['Caixa Leilões', 'Santander', 'QuintoAndar', 'ZAP Imóveis', 'IBGE'].map(src => (
              <span key={src} className="text-[10px] px-3 py-1.5 rounded-full bg-white/10 text-white/80 font-medium">
                {src}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>10</div>
            <div className="text-xs text-gray-500">Cidades Analisadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>10.2%</div>
            <div className="text-xs text-gray-500">Yield Médio Top 4</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>337</div>
            <div className="text-xs text-gray-500">Imóveis em Leilão</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>44%</div>
            <div className="text-xs text-gray-500">Spread Médio vs ZAP</div>
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: '#C9A84C' }} />
            Ranking Nacional de Yield
          </h2>
          <div className="flex gap-2">
            {[
              { key: 'yield' as const, label: 'Maior Yield' },
              { key: 'payback' as const, label: 'Menor Payback' },
              { key: 'spread' as const, label: 'Maior Spread' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  sortBy === opt.key
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={sortBy === opt.key ? { backgroundColor: '#1B2B5B' } : {}}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cidades.map((cidade, i) => (
            <CidadeCard key={cidade.cidade} cidade={cidade} rank={i + 1} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-gradient-to-br from-[#1B2B5B] to-[#2a3f7a] rounded-2xl p-8 text-center text-white">
          <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h3 className="text-2xl font-bold mb-2">Receber Alertas de Yield &gt; 10%</h3>
          <p className="text-white/70 mb-6 max-w-lg mx-auto">
            Nosso robô cruza dados de 4 fontes em tempo real e envia as melhores
            oportunidades direto no seu WhatsApp toda terça-feira.
          </p>
          <a
            href={`https://wa.me/5516981010004?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
            style={{ backgroundColor: '#25D366', color: 'white' }}
          >
            <MessageCircle className="w-5 h-5" />
            Quero receber no WhatsApp
          </a>
          <p className="text-[10px] text-white/40 mt-3">
            Relatório semanal gratuito. Dados de Caixa, Santander, QuintoAndar e ZAP.
          </p>
        </div>

        {/* Methodology */}
        <div className="mt-8 bg-white rounded-2xl p-6 border">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Metodologia de Cálculo
          </h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Gross Rental Yield:</strong> (Aluguel Mensal x 12) / Preço de Aquisição x 100</p>
            <p><strong>Payback:</strong> Preço de Aquisição / (Aluguel Mensal x 12)</p>
            <p><strong>Autossustentável:</strong> Aluguel estimado cobre parcela BNDES (8.5% a.a., 360 meses, tabela Price)</p>
            <p><strong>Spread vs Mercado:</strong> Diferença percentual entre preço/m² do leilão e preço/m² do ZAP Imóveis</p>
            <p className="text-xs text-gray-400 pt-2">
              *Dados de referência atualizados com base nos scrapers Apify (Caixa, Santander, QuintoAndar, ZAP).
              Valores podem variar. Consulte um especialista antes de investir.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
