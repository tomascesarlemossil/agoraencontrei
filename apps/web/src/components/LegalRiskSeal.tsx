'use client'

/**
 * Score de Risco Jurídico (SRJ)
 * Analisa variáveis críticas de cada leilão e exibe selo visual
 * Verde (Seguro), Amarelo (Atenção), Vermelho (Risco Alto)
 */

interface LeilaoData {
  saleType?: string
  occupation?: string | null
  financeable?: boolean
  fgtsAllowed?: boolean
  discountPercent?: number | null
  description?: string
}

interface RiskResult {
  score: number
  status: 'VERDE' | 'AMARELO' | 'VERMELHO'
  label: string
  mensagem: string
  cor: string
  bg: string
  icon: string
  tempoDesocupacao: string
  custoEstimado: string
}

export function calculateLegalRisk(leilao: LeilaoData): RiskResult {
  let score = 0

  // 1. Tipo de Leilão
  const tipo = (leilao.saleType || '').toLowerCase()
  if (tipo.includes('extrajudicial') || tipo.includes('venda direta') || tipo.includes('venda online')) {
    score += 10 // Mais seguro
  } else if (tipo.includes('judicial')) {
    score += 30 // Depende do juiz
  } else if (tipo.includes('licitação') || tipo.includes('licitacao')) {
    score += 15
  } else {
    score += 20 // Desconhecido
  }

  // 2. Ocupação
  const desc = (leilao.description || '').toLowerCase()
  if (leilao.occupation === 'OCUPADO' || desc.includes('ocupado')) {
    score += 35
  } else if (desc.includes('desocupado')) {
    score -= 10 // Bônus
  }

  // 3. Dívidas de condomínio (detectar no texto)
  if (desc.includes('condomínio') || desc.includes('condominio')) {
    score += 15
  }

  // 4. Financiável (sinal de documentação ok)
  if (leilao.financeable) score -= 10
  if (leilao.fgtsAllowed) score -= 5

  // 5. Desconto muito alto pode indicar problemas
  if (leilao.discountPercent && leilao.discountPercent > 60) {
    score += 10
  }

  // Clamp entre 0 e 100
  score = Math.max(0, Math.min(100, score))

  const status = score < 40 ? 'VERDE' : score < 70 ? 'AMARELO' : 'VERMELHO'

  const configs: Record<string, Omit<RiskResult, 'score' | 'status'>> = {
    VERDE: {
      label: 'Baixo Risco',
      mensagem: 'Alta liquidez jurídica. Desocupação estimada em 3-6 meses. Documentação tende a estar regular.',
      cor: '#15803d',
      bg: 'bg-green-50',
      icon: '🛡️',
      tempoDesocupacao: '3-6 meses',
      custoEstimado: 'R$ 3.500 - R$ 5.000',
    },
    AMARELO: {
      label: 'Risco Moderado',
      mensagem: 'Verifique a petição inicial do processo e consulte um advogado antes de arrematar.',
      cor: '#eab308',
      bg: 'bg-yellow-50',
      icon: '⚠️',
      tempoDesocupacao: '6-12 meses',
      custoEstimado: 'R$ 5.000 - R$ 10.000',
    },
    VERMELHO: {
      label: 'Alto Risco',
      mensagem: 'Possível ocupação com cláusula social ou múltiplos processos. Assessoria jurídica obrigatória.',
      cor: '#ef4444',
      bg: 'bg-red-50',
      icon: '🚨',
      tempoDesocupacao: '12-24 meses',
      custoEstimado: 'R$ 10.000 - R$ 25.000',
    },
  }

  return { score, status, ...configs[status] }
}

export function LegalRiskSeal({ leilao }: { leilao: LeilaoData }) {
  const risk = calculateLegalRisk(leilao)

  return (
    <div
      className={`p-4 rounded-xl border-l-4 shadow-sm ${risk.bg} my-3`}
      style={{ borderColor: risk.cor }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{risk.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-sm text-gray-900">Risco Jurídico: {risk.label}</h4>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: risk.cor }}
            >
              {risk.score}/100
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-2">{risk.mensagem}</p>
          <div className="flex gap-4 text-[10px] text-gray-500">
            <span>⏱️ Desocupação: <strong>{risk.tempoDesocupacao}</strong></span>
            <span>💰 Custo jurídico: <strong>{risk.custoEstimado}</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
