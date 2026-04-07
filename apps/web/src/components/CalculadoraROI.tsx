'use client'

import { useState } from 'react'
import { Calculator, TrendingUp, AlertTriangle, MessageCircle } from 'lucide-react'

interface Props {
  valorAvaliado: number
  valorLance: number
  bairro?: string
  cidade?: string
}

export function CalculadoraROI({ valorAvaliado, valorLance, bairro, cidade = 'Franca/SP' }: Props) {
  const [showDetalhes, setShowDetalhes] = useState(false)

  // Custos de aquisição (taxas de Franca/SP)
  const comissaoLeiloeiro = valorLance * 0.05
  const itbi = valorLance * 0.02
  const registro = valorLance * 0.01
  const reformas = valorLance * 0.10
  const custoTotal = valorLance + comissaoLeiloeiro + itbi + registro + reformas
  const lucroBruto = valorAvaliado * 0.95 - custoTotal // 95% do avaliado (margem segurança)
  const roi = custoTotal > 0 ? (lucroBruto / custoTotal) * 100 : 0
  const desconto = valorAvaliado > 0 ? ((valorAvaliado - valorLance) / valorAvaliado) * 100 : 0

  const roiColor = roi >= 30 ? 'text-green-700' : roi >= 15 ? 'text-yellow-600' : 'text-red-600'
  const roiBg = roi >= 30 ? 'bg-green-700' : roi >= 15 ? 'bg-yellow-600' : 'bg-red-600'
  const riskLabel = roi >= 30 ? 'Excelente' : roi >= 15 ? 'Moderado' : 'Baixo'

  const whatsappMsg = encodeURIComponent(
    `Olá! Vi no AgoraEncontrei um imóvel${bairro ? ` no ${bairro}` : ''} em ${cidade} com ROI estimado de ${roi.toFixed(1)}% e desconto de ${desconto.toFixed(0)}%. Quero saber mais sobre como arrematar com segurança.`
  )

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border-2 border-green-200 my-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-green-700" />
        <h3 className="text-green-800 font-bold text-lg">Análise de Viabilidade (Estimada)</h3>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center border">
          <p className="text-xs text-gray-500 mb-1">Desconto</p>
          <p className="text-xl font-bold text-red-600">-{desconto.toFixed(0)}%</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border">
          <p className="text-xs text-gray-500 mb-1">Economia</p>
          <p className="text-lg font-bold text-green-700">
            R$ {(valorAvaliado - valorLance).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center border">
          <p className="text-xs text-gray-500 mb-1">ROI Estimado</p>
          <p className={`text-xl font-bold ${roiColor}`}>{roi.toFixed(1)}%</p>
        </div>
      </div>

      {/* Barra de ROI */}
      <div className={`${roiBg} text-white text-center py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mb-3`}>
        <TrendingUp className="w-4 h-4" />
        ROI ESTIMADO: {roi.toFixed(1)}% — Oportunidade {riskLabel}
      </div>

      {/* Detalhes expandíveis */}
      <button
        onClick={() => setShowDetalhes(!showDetalhes)}
        className="text-xs text-green-700 underline mb-3"
      >
        {showDetalhes ? 'Ocultar detalhes' : 'Ver detalhes do cálculo'}
      </button>

      {showDetalhes && (
        <div className="bg-white rounded-xl p-4 border text-sm space-y-2 mb-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Valor de avaliação</span>
            <span className="font-semibold">R$ {valorAvaliado.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lance mínimo</span>
            <span className="font-semibold text-green-700">R$ {valorLance.toLocaleString('pt-BR')}</span>
          </div>
          <hr />
          <div className="flex justify-between">
            <span className="text-gray-600">Comissão leiloeiro (5%)</span>
            <span className="text-red-600">+ R$ {comissaoLeiloeiro.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ITBI Franca (2%)</span>
            <span className="text-red-600">+ R$ {itbi.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Registro e escritura (1%)</span>
            <span className="text-red-600">+ R$ {registro.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Provisão reformas (10%)</span>
            <span className="text-red-600">+ R$ {reformas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
          </div>
          <hr />
          <div className="flex justify-between font-bold">
            <span>Custo total de aquisição</span>
            <span>R$ {custoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between font-bold text-green-700">
            <span>Lucro bruto estimado</span>
            <span>R$ {lucroBruto.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      )}

      {/* CTA WhatsApp */}
      <a
        href={`https://wa.me/5516981010004?text=${whatsappMsg}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm text-white bg-[#25D366] hover:bg-[#1da851] transition-all"
      >
        <MessageCircle className="w-4 h-4" />
        Quero assessoria para arrematar com segurança
      </a>

      <p className="text-[10px] text-gray-400 mt-2 text-center">
        *Cálculo baseado nas taxas padrão de Franca/SP (ITBI 2%, comissão 5%) e estimativa de reforma de 10%. Valores reais podem variar.
      </p>
    </div>
  )
}
