import type { Metadata } from 'next'
import { InvestorDashboardClient } from './InvestorDashboardClient'

export const metadata: Metadata = {
  title: 'Terminal de Investimento | AgoraEncontrei',
  description:
    'Painel profissional de investimento imobiliário. Analise yields, spreads e oportunidades de leilão em tempo real com dados cruzados de mercado.',
}

export default function InvestorPage() {
  return <InvestorDashboardClient />
}
