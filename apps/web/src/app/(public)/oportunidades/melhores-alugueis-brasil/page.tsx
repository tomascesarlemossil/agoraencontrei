import type { Metadata } from 'next'
import { YieldRankingClient } from './YieldRankingClient'

export const metadata: Metadata = {
  title: 'Melhores Cidades para Investir em Leilão com Aluguel | AgoraEncontrei',
  description: 'Ranking nacional de yield: descubra onde o aluguel paga as parcelas do arremate mais rápido. Dados reais de Caixa, Santander, QuintoAndar e ZAP Imóveis cruzados pela IA.',
  keywords: 'yield imobiliário, leilão investimento, retorno aluguel, spread leilão mercado, melhores cidades investir imóvel',
  openGraph: {
    title: 'Top 10 Cidades para Investir em Leilão | Yield Nacional',
    description: 'Cruzamento de dados Caixa + QuintoAndar + ZAP. Descubra onde o aluguel paga o arremate.',
    type: 'website',
  },
}

export default function MelhoresAlugueisPage() {
  return <YieldRankingClient />
}
