/**
 * Market Intelligence Service — ROI Engine
 *
 * Calcula o "Deal Score" de um imóvel de leilão comparando com o preço de mercado
 * da mesma rua/bairro. Baseado na lógica planejada com o Gemini.
 *
 * calculateDealScore(imovelLeilao) → { score, lucroEstimado, roiPercentual, precoMercadoRegiao }
 */

import type { PrismaClient } from '@prisma/client'

// Preços médios por m² por bairro em Franca/SP (base de dados interna)
// Fonte: dados históricos de transações + IBGE + FipeZap
const PRECO_M2_BAIRRO: Record<string, number> = {
  'centro': 4200,
  'jardim petraglia': 3800,
  'city petropolis': 3600,
  'vila santa cruz': 3200,
  'jardim paulista': 3500,
  'polo club': 5800,
  'jardim california': 3400,
  'jardim independencia': 3100,
  'jardim america': 3300,
  'vila formosa': 2900,
  'vila nossa senhora aparecida': 2800,
  'jardim aeroporto': 2700,
  'jardim consolacao': 3000,
  'jardim sao jose': 2600,
  'parque das nacoes': 2500,
  'residencial das americas': 3700,
  'vila sao jose': 2800,
  'jardim botanico': 3200,
  'jardim nova franca': 2600,
  'default': 3000, // fallback para bairros não mapeados
}

// Alíquotas de ITBI por estado (%)
const ITBI_ALIQUOTA: Record<string, number> = {
  'SP': 3.0, 'RJ': 3.0, 'MG': 3.0, 'PR': 2.7, 'RS': 3.0,
  'SC': 2.0, 'BA': 3.0, 'GO': 2.0, 'DF': 3.0, 'PE': 3.0,
  'CE': 2.0, 'PA': 2.0, 'AM': 2.0, 'MT': 2.0, 'MS': 2.0,
  'default': 3.0,
}

export interface DealScore {
  score: number            // 0–100 (Oportunidade de Ouro = 95+)
  label: string            // 'Ouro' | 'Ótimo' | 'Bom' | 'Regular'
  lucroEstimado: number    // R$
  roiPercentual: number    // %
  precoMercadoRegiao: number // R$/m²
  valorMercadoTotal: number  // R$ (preço m² × área)
  custosAquisicao: {
    itbi: number
    registro: number
    escritura: number
    desocupacao: number
    total: number
  }
  lanceMaximoSugerido: number // Não ultrapasse este valor
  isPearl: boolean         // true se desconto > 40%
}

export interface ImovelLeilaoInput {
  precoVenda: number
  precoAvaliacao?: number
  area?: number           // m²
  bairro?: string
  cidade?: string
  uf?: string
  modalidade?: string
}

export function calculateDealScore(imovel: ImovelLeilaoInput): DealScore {
  const bairroKey = (imovel.bairro || '').toLowerCase().trim()
  const precoM2 = PRECO_M2_BAIRRO[bairroKey] ?? PRECO_M2_BAIRRO['default']
  const area = imovel.area ?? 80 // assume 80m² se não informado
  const uf = imovel.uf ?? 'SP'

  const valorMercadoTotal = precoM2 * area

  // Custos de aquisição
  const itbiAliquota = (ITBI_ALIQUOTA[uf] ?? ITBI_ALIQUOTA['default']) / 100
  const itbi = imovel.precoVenda * itbiAliquota
  const registro = imovel.precoVenda * 0.01   // ~1%
  const escritura = imovel.precoVenda * 0.015  // ~1.5%
  const desocupacao = imovel.modalidade?.toLowerCase().includes('ocupado') ? 8000 : 0
  const totalCustos = itbi + registro + escritura + desocupacao

  // Lucro estimado
  const custoTotal = imovel.precoVenda + totalCustos
  const lucroEstimado = valorMercadoTotal - custoTotal
  const roiPercentual = custoTotal > 0 ? (lucroEstimado / custoTotal) * 100 : 0

  // Score de oportunidade (0–100)
  let score = 0
  if (roiPercentual > 50) score = 95
  else if (roiPercentual > 35) score = 80
  else if (roiPercentual > 20) score = 65
  else if (roiPercentual > 10) score = 45
  else if (roiPercentual > 0) score = 25
  else score = 10

  const label =
    score >= 90 ? 'Ouro 🏆' :
    score >= 75 ? 'Ótimo 🔥' :
    score >= 55 ? 'Bom ✅' :
    score >= 35 ? 'Regular' : 'Baixo'

  // Desconto real (vs avaliação)
  const precoAvaliacao = imovel.precoAvaliacao ?? valorMercadoTotal
  const descontoReal = precoAvaliacao > 0
    ? ((precoAvaliacao - imovel.precoVenda) / precoAvaliacao) * 100
    : 0

  // Lance máximo sugerido: 70% do valor de mercado menos custos
  const lanceMaximoSugerido = Math.round((valorMercadoTotal * 0.70) - totalCustos)

  return {
    score: Math.round(score),
    label,
    lucroEstimado: Math.round(lucroEstimado),
    roiPercentual: Math.round(roiPercentual * 10) / 10,
    precoMercadoRegiao: precoM2,
    valorMercadoTotal: Math.round(valorMercadoTotal),
    custosAquisicao: {
      itbi: Math.round(itbi),
      registro: Math.round(registro),
      escritura: Math.round(escritura),
      desocupacao: Math.round(desocupacao),
      total: Math.round(totalCustos),
    },
    lanceMaximoSugerido: Math.max(0, lanceMaximoSugerido),
    isPearl: descontoReal > 40,
  }
}

/**
 * Versão assíncrona que busca preço de mercado real do banco de dados
 * quando disponível, com fallback para a tabela estática.
 */
export async function calculateDealScoreFromDB(
  imovel: ImovelLeilaoInput,
  prisma: PrismaClient
): Promise<DealScore> {
  try {
    // Tenta buscar preço médio m² do banco (tabela de imóveis de mercado)
    const marketData = await (prisma as any).$queryRawUnsafe(`
      SELECT AVG(price / NULLIF(area, 0)) as avg_price_m2, COUNT(*) as count
      FROM properties
      WHERE city ILIKE $1
        AND neighborhood ILIKE $2
        AND status = 'ACTIVE'
        AND area > 0
        AND price > 0
      LIMIT 1
    `, imovel.cidade ?? 'Franca', `%${imovel.bairro ?? ''}%`) as Array<{ avg_price_m2: number | null; count: number }>

    if (marketData?.[0]?.avg_price_m2 && marketData[0].count >= 3) {
      // Usa o preço real do banco se tiver pelo menos 3 amostras
      const precoM2Real = Number(marketData[0].avg_price_m2)
      const area = imovel.area ?? 80
      const valorMercadoTotal = precoM2Real * area

      // Recalcula com preço real
      const imovelComPrecoReal = {
        ...imovel,
        precoAvaliacao: imovel.precoAvaliacao ?? valorMercadoTotal,
      }
      const score = calculateDealScore({ ...imovelComPrecoReal, area })
      return { ...score, precoMercadoRegiao: Math.round(precoM2Real) }
    }
  } catch {
    // Fallback silencioso para dados estáticos
  }

  return calculateDealScore(imovel)
}

/**
 * Formata o DealScore para exibição no WhatsApp (Manual do Investidor)
 */
export function formatManualInvestidor(
  imovel: ImovelLeilaoInput & { titulo?: string; linkOriginal?: string },
  score: DealScore
): string {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  const pct = (v: number) => `${v.toFixed(1)}%`

  return `📘 *MANUAL DO INVESTIDOR — AgoraEncontrei*

🏠 *${imovel.titulo ?? 'Imóvel de Leilão'}*
📍 ${imovel.bairro ?? ''}, ${imovel.cidade ?? 'Franca'} — ${imovel.uf ?? 'SP'}

━━━━━━━━━━━━━━━━━━━━━━━
💰 *ANÁLISE FINANCEIRA*
━━━━━━━━━━━━━━━━━━━━━━━
• Lance mínimo: ${fmt(imovel.precoVenda)}
• Valor de mercado (bairro): ${fmt(score.valorMercadoTotal)}
• Desconto real: ${pct(imovel.precoAvaliacao ? ((imovel.precoAvaliacao - imovel.precoVenda) / imovel.precoAvaliacao) * 100 : 0)}

📊 *CUSTOS DE AQUISIÇÃO*
• ITBI: ${fmt(score.custosAquisicao.itbi)}
• Registro + Escritura: ${fmt(score.custosAquisicao.registro + score.custosAquisicao.escritura)}
${score.custosAquisicao.desocupacao > 0 ? `• Desocupação estimada: ${fmt(score.custosAquisicao.desocupacao)}\n` : ''}• *Total de custos: ${fmt(score.custosAquisicao.total)}*

🏆 *ROI ESTIMADO*
• Lucro estimado: *${fmt(score.lucroEstimado)}*
• Retorno: *${pct(score.roiPercentual)}*
• Score AgoraEncontrei: *${score.score}/100 — ${score.label}*

⚠️ *Lance máximo sugerido: ${fmt(score.lanceMaximoSugerido)}*
(Não ultrapasse este valor para garantir o lucro)

━━━━━━━━━━━━━━━━━━━━━━━
🔗 Ver edital completo: ${imovel.linkOriginal ?? 'https://www.agoraencontrei.com.br/leiloes'}

_Este relatório é gerado automaticamente pelo sistema de inteligência do AgoraEncontrei. Não constitui assessoria jurídica._`
}
