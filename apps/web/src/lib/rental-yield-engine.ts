/**
 * RentalYieldEngine — Motor de Cálculo de Yield Nacional
 *
 * Cruza dados de leilão (Caixa/Santander) com preços de aluguel real
 * (QuintoAndar/ZAP) para calcular Gross Rental Yield.
 *
 * Responde: "Onde no Brasil meu aluguel paga as parcelas do arremate mais rápido?"
 */

export interface YieldResult {
  yieldAnual: number
  yieldMensal: number
  paybackAnos: number
  classificacao: 'EXCELENTE' | 'BOM' | 'MODERADO' | 'BAIXO'
  classificacaoLabel: string
  classificacaoIcon: string
  classificacaoCor: string
  autossustentavel: boolean
  spreadVsRenda: number
}

export interface CidadeYield {
  cidade: string
  estado: string
  precoMedioLeilao: number
  aluguelMedio: number
  yieldAnual: number
  paybackAnos: number
  classificacao: string
  classificacaoIcon: string
  classificacaoCor: string
  spreadVsMercado: number
  totalImoveis: number
  precoM2Leilao: number
  precoM2Mercado: number
}

/**
 * Calcula o Gross Rental Yield (Retorno Bruto de Aluguel)
 */
export function calculateYield(precoArremate: number, aluguelMensal: number): YieldResult {
  if (precoArremate <= 0 || aluguelMensal <= 0) {
    return {
      yieldAnual: 0,
      yieldMensal: 0,
      paybackAnos: 0,
      classificacao: 'BAIXO',
      classificacaoLabel: 'Sem dados',
      classificacaoIcon: '—',
      classificacaoCor: 'text-gray-400',
      autossustentavel: false,
      spreadVsRenda: 0,
    }
  }

  const yieldAnual = ((aluguelMensal * 12) / precoArremate) * 100
  const yieldMensal = (aluguelMensal / precoArremate) * 100
  const paybackAnos = precoArremate / (aluguelMensal * 12)

  // Parcela BNDES estimada (taxa 8.5% a.a., 360 meses = Price)
  const taxaMensal = 0.085 / 12
  const nMeses = 360
  const parcelaBNDES = precoArremate * (taxaMensal * Math.pow(1 + taxaMensal, nMeses)) / (Math.pow(1 + taxaMensal, nMeses) - 1)
  const autossustentavel = aluguelMensal >= parcelaBNDES
  const spreadVsRenda = parcelaBNDES > 0 ? ((aluguelMensal - parcelaBNDES) / parcelaBNDES) * 100 : 0

  let classificacao: YieldResult['classificacao']
  let classificacaoLabel: string
  let classificacaoIcon: string
  let classificacaoCor: string

  if (yieldAnual > 10) {
    classificacao = 'EXCELENTE'
    classificacaoLabel = 'Excelente'
    classificacaoIcon = '🚀'
    classificacaoCor = 'text-green-600'
  } else if (yieldAnual > 7) {
    classificacao = 'BOM'
    classificacaoLabel = 'Bom'
    classificacaoIcon = '✅'
    classificacaoCor = 'text-blue-600'
  } else if (yieldAnual > 4) {
    classificacao = 'MODERADO'
    classificacaoLabel = 'Moderado'
    classificacaoIcon = '⚠️'
    classificacaoCor = 'text-yellow-600'
  } else {
    classificacao = 'BAIXO'
    classificacaoLabel = 'Baixo'
    classificacaoIcon = '📉'
    classificacaoCor = 'text-red-500'
  }

  return {
    yieldAnual: Math.round(yieldAnual * 100) / 100,
    yieldMensal: Math.round(yieldMensal * 100) / 100,
    paybackAnos: Math.round(paybackAnos * 10) / 10,
    classificacao,
    classificacaoLabel,
    classificacaoIcon,
    classificacaoCor,
    autossustentavel,
    spreadVsRenda: Math.round(spreadVsRenda * 10) / 10,
  }
}

/**
 * Dados de referência de yield por cidade (atualizados com dados Apify + IBGE 2026)
 * Usado como fallback quando os scrapers não retornam dados suficientes
 */
export const CIDADES_YIELD_REFERENCIA: CidadeYield[] = [
  {
    cidade: 'Ribeirão Preto', estado: 'SP',
    precoMedioLeilao: 320000, aluguelMedio: 2800,
    yieldAnual: 10.5, paybackAnos: 9.5,
    classificacao: 'EXCELENTE', classificacaoIcon: '🚀', classificacaoCor: 'text-green-600',
    spreadVsMercado: 52, totalImoveis: 47,
    precoM2Leilao: 4200, precoM2Mercado: 9800,
  },
  {
    cidade: 'Franca', estado: 'SP',
    precoMedioLeilao: 180000, aluguelMedio: 1500,
    yieldAnual: 10.0, paybackAnos: 10.0,
    classificacao: 'EXCELENTE', classificacaoIcon: '🚀', classificacaoCor: 'text-green-600',
    spreadVsMercado: 45, totalImoveis: 23,
    precoM2Leilao: 2800, precoM2Mercado: 5100,
  },
  {
    cidade: 'Goiânia', estado: 'GO',
    precoMedioLeilao: 250000, aluguelMedio: 2200,
    yieldAnual: 10.56, paybackAnos: 9.5,
    classificacao: 'EXCELENTE', classificacaoIcon: '🚀', classificacaoCor: 'text-green-600',
    spreadVsMercado: 48, totalImoveis: 35,
    precoM2Leilao: 3500, precoM2Mercado: 6700,
  },
  {
    cidade: 'Praia Grande', estado: 'SP',
    precoMedioLeilao: 210000, aluguelMedio: 1900,
    yieldAnual: 10.86, paybackAnos: 9.2,
    classificacao: 'EXCELENTE', classificacaoIcon: '🚀', classificacaoCor: 'text-green-600',
    spreadVsMercado: 41, totalImoveis: 18,
    precoM2Leilao: 3200, precoM2Mercado: 5400,
  },
  {
    cidade: 'Campinas', estado: 'SP',
    precoMedioLeilao: 350000, aluguelMedio: 2600,
    yieldAnual: 8.91, paybackAnos: 11.2,
    classificacao: 'BOM', classificacaoIcon: '✅', classificacaoCor: 'text-blue-600',
    spreadVsMercado: 44, totalImoveis: 52,
    precoM2Leilao: 4800, precoM2Mercado: 8600,
  },
  {
    cidade: 'São José dos Campos', estado: 'SP',
    precoMedioLeilao: 380000, aluguelMedio: 2800,
    yieldAnual: 8.84, paybackAnos: 11.3,
    classificacao: 'BOM', classificacaoIcon: '✅', classificacaoCor: 'text-blue-600',
    spreadVsMercado: 46, totalImoveis: 31,
    precoM2Leilao: 5200, precoM2Mercado: 9600,
  },
  {
    cidade: 'Curitiba', estado: 'PR',
    precoMedioLeilao: 290000, aluguelMedio: 2100,
    yieldAnual: 8.69, paybackAnos: 11.5,
    classificacao: 'BOM', classificacaoIcon: '✅', classificacaoCor: 'text-blue-600',
    spreadVsMercado: 43, totalImoveis: 44,
    precoM2Leilao: 4100, precoM2Mercado: 7200,
  },
  {
    cidade: 'Belo Horizonte', estado: 'MG',
    precoMedioLeilao: 270000, aluguelMedio: 1900,
    yieldAnual: 8.44, paybackAnos: 11.8,
    classificacao: 'BOM', classificacaoIcon: '✅', classificacaoCor: 'text-blue-600',
    spreadVsMercado: 40, totalImoveis: 38,
    precoM2Leilao: 3800, precoM2Mercado: 6300,
  },
  {
    cidade: 'Salvador', estado: 'BA',
    precoMedioLeilao: 220000, aluguelMedio: 1600,
    yieldAnual: 8.73, paybackAnos: 11.5,
    classificacao: 'BOM', classificacaoIcon: '✅', classificacaoCor: 'text-blue-600',
    spreadVsMercado: 38, totalImoveis: 27,
    precoM2Leilao: 3000, precoM2Mercado: 4800,
  },
  {
    cidade: 'Santos', estado: 'SP',
    precoMedioLeilao: 340000, aluguelMedio: 2500,
    yieldAnual: 8.82, paybackAnos: 11.3,
    classificacao: 'BOM', classificacaoIcon: '✅', classificacaoCor: 'text-blue-600',
    spreadVsMercado: 39, totalImoveis: 22,
    precoM2Leilao: 5500, precoM2Mercado: 9000,
  },
]

/**
 * Formata valor em BRL
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(value)
}
