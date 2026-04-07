/**
 * SEO Dynamic Content Block Generator
 *
 * Generates unique content for 1M+ programmatic pages by cross-referencing:
 * - QuintoAndar rental data (37k+ listings)
 * - ZAP market prices (sale/rent)
 * - Caixa/Santander auction data
 * - IBGE city data (5,570 cities)
 *
 * Each block is deterministically generated from seed data for cache-friendly ISR.
 */

import type { DynamicContentBlock } from '../../../../packages/database/src/types/data-lake'

interface BlockInput {
  cidade: string
  estado: string
  bairro?: string
  aluguelMedio?: number
  precoM2Mercado?: number
  precoM2Leilao?: number
  spreadPercent?: number
  totalLeiloes?: number
  populacao?: number
  idhm?: number
  distanciaCentroKm?: number
  pontosInteresse?: string[]
  bankName?: string
}

export function generateMercadoBlock(input: BlockInput): DynamicContentBlock {
  const { cidade, bairro, aluguelMedio, precoM2Mercado } = input
  const local = bairro ? `${bairro}, ${cidade}` : cidade

  const content = aluguelMedio && precoM2Mercado
    ? `Baseado em dados reais do QuintoAndar e ZAP Imóveis, o aluguel médio em ${local} é de R$ ${aluguelMedio.toLocaleString('pt-BR')}/mês. O preço médio por m² na região é R$ ${precoM2Mercado.toLocaleString('pt-BR')}, o que posiciona ${local} como uma das áreas com melhor relação custo-benefício para investidores de leilões imobiliários.`
    : `${local} apresenta oportunidades de investimento em leilões imobiliários com preços abaixo da média do mercado. Dados de portais como QuintoAndar e ZAP Imóveis indicam demanda consistente por aluguéis na região.`

  return {
    type: 'mercado',
    title: `Mercado Imobiliário em ${local}`,
    content,
    source: 'QuintoAndar + ZAP Imóveis',
    dataPoints: {
      aluguelMedio: aluguelMedio || 0,
      precoM2: precoM2Mercado || 0,
      localidade: local,
    },
  }
}

export function generateOportunidadeBlock(input: BlockInput): DynamicContentBlock {
  const { cidade, estado, bairro, spreadPercent, bankName, precoM2Leilao, precoM2Mercado, totalLeiloes } = input
  const local = bairro ? `${bairro}, ${cidade}` : cidade
  const bank = bankName || 'Caixa Econômica Federal'

  const content = spreadPercent && precoM2Leilao
    ? `Este leilão ${bank === 'Santander' ? 'do Santander' : 'da Caixa'} está ${spreadPercent}% abaixo da média do ZAP Imóveis para a região de ${local}/${estado}. Enquanto o mercado pratica R$ ${precoM2Mercado?.toLocaleString('pt-BR')}/m², o lance mínimo no leilão equivale a R$ ${precoM2Leilao.toLocaleString('pt-BR')}/m² — uma economia potencial de R$ ${((precoM2Mercado || 0) - precoM2Leilao).toLocaleString('pt-BR')} por metro quadrado.`
    : `Imóveis de leilão em ${local} oferecem descontos significativos em relação ao mercado convencional. ${totalLeiloes ? `Atualmente há ${totalLeiloes} imóveis disponíveis na região.` : ''}`

  return {
    type: 'oportunidade',
    title: `Oportunidade de Leilão em ${local}`,
    content,
    source: `${bank} + ZAP Imóveis`,
    dataPoints: {
      spread: spreadPercent || 0,
      precoM2Leilao: precoM2Leilao || 0,
      precoM2Mercado: precoM2Mercado || 0,
      banco: bank,
    },
  }
}

export function generateInfraestruturaBlock(input: BlockInput): DynamicContentBlock {
  const { cidade, bairro, distanciaCentroKm, pontosInteresse, populacao, idhm } = input
  const local = bairro ? `${bairro}, ${cidade}` : cidade

  const pois = pontosInteresse?.length
    ? `Destaques da região: ${pontosInteresse.slice(0, 4).join(', ')}.`
    : ''

  const distancia = distanciaCentroKm
    ? `Localizado a ${distanciaCentroKm}km do centro de ${cidade}.`
    : ''

  const pop = populacao
    ? `${cidade} possui ${populacao.toLocaleString('pt-BR')} habitantes`
    : ''

  const idhmText = idhm
    ? ` e IDH-M de ${idhm.toFixed(3)}`
    : ''

  const content = `${pop}${idhmText}${pop ? '.' : ''} ${distancia} ${pois} A infraestrutura local favorece a valorização de imóveis arrematados em leilão, com acesso a transporte, comércio e serviços essenciais.`

  return {
    type: 'infraestrutura',
    title: `Infraestrutura em ${local}`,
    content: content.trim(),
    source: 'IBGE + Dados Locais',
    dataPoints: {
      populacao: populacao || 0,
      idhm: idhm || 0,
      distanciaCentro: distanciaCentroKm || 0,
      pontosInteresse: pontosInteresse?.length || 0,
    },
  }
}

export function generateComparacaoBlock(input: BlockInput): DynamicContentBlock {
  const { cidade, aluguelMedio, precoM2Leilao, precoM2Mercado, spreadPercent } = input

  const yieldAnual = aluguelMedio && precoM2Leilao
    ? ((aluguelMedio * 12) / (precoM2Leilao * 70)) * 100 // assuming 70m² avg
    : 0

  const selicComparison = yieldAnual > 0
    ? yieldAnual > 14.25
      ? `supera a SELIC atual (14,25% a.a.) em ${(yieldAnual - 14.25).toFixed(1)} pontos percentuais`
      : `fica ${(14.25 - yieldAnual).toFixed(1)} pontos abaixo da SELIC (14,25% a.a.)`
    : 'pode ser comparado com a SELIC atual de 14,25% a.a.'

  const content = `Investir em leilões em ${cidade} apresenta yield estimado de ${yieldAnual.toFixed(1)}% a.a., que ${selicComparison}. Com spread de ${spreadPercent || 0}% em relação ao preço de mercado (ZAP Imóveis), o retorno sobre investimento em imóveis de leilão é uma alternativa sólida à renda fixa tradicional.`

  return {
    type: 'comparacao',
    title: `Leilão vs Renda Fixa em ${cidade}`,
    content,
    source: 'BCB (SELIC) + ZAP + QuintoAndar',
    dataPoints: {
      yieldAnual: Math.round(yieldAnual * 10) / 10,
      selic: 14.25,
      spread: spreadPercent || 0,
    },
  }
}

export function generateRiscoBlock(input: BlockInput): DynamicContentBlock {
  const { cidade, bairro, spreadPercent } = input
  const local = bairro ? `${bairro}, ${cidade}` : cidade
  const spread = spreadPercent || 0

  let riskLevel: string
  let riskColor: string
  let riskAdvice: string

  if (spread > 40) {
    riskLevel = 'Verde (Baixo Risco)'
    riskColor = 'verde'
    riskAdvice = 'Imóvel com desconto expressivo sobre o mercado. Margem de segurança alta para o investidor.'
  } else if (spread > 20) {
    riskLevel = 'Amarelo (Risco Moderado)'
    riskColor = 'amarelo'
    riskAdvice = 'Desconto relevante, mas recomenda-se análise da matrícula, ocupação e custos de desocupação.'
  } else {
    riskLevel = 'Vermelho (Risco Elevado)'
    riskColor = 'vermelho'
    riskAdvice = 'Spread reduzido em relação ao mercado. Avalie custos adicionais (ITBI, registro, eventual reforma) antes de dar lance.'
  }

  const content = `Classificação de risco para leilões em ${local}: ${riskLevel}. ${riskAdvice} Sempre verifique o edital completo, a matrícula atualizada e consulte um advogado especializado antes de arrematar.`

  return {
    type: 'risco',
    title: `Análise de Risco — Leilões em ${local}`,
    content,
    source: 'AgoraEncontrei Risk Engine',
    dataPoints: {
      riskLevel: riskColor,
      spread,
      localidade: local,
    },
  }
}

/**
 * Generate all content blocks for a city/neighborhood SEO page.
 * Each block uses real data from scrapers when available.
 */
export function generateAllBlocks(input: BlockInput): DynamicContentBlock[] {
  return [
    generateMercadoBlock(input),
    generateOportunidadeBlock(input),
    generateInfraestruturaBlock(input),
    generateComparacaoBlock(input),
    generateRiscoBlock(input),
  ]
}
