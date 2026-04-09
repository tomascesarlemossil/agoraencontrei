import type { Metadata } from 'next'
import { InvestorDashboardClient } from './InvestorDashboardClient'

export const metadata: Metadata = {
  title: 'Terminal de Investimento Imobiliário PRO | AgoraEncontrei — DCF, NPV, IRR, Monte Carlo',
  description:
    'Painel profissional Bloomberg-style de investimento imobiliário. Análise DCF com VPL/TIR, cenários Monte Carlo, stress tests, sensibilidade, comparador de imóveis e portfólio. Dados BCB em tempo real (SELIC, IPCA, IGP-M).',
  keywords: 'investimento imobiliário, terminal investidor, DCF imóveis, VPL TIR, Monte Carlo imobiliário, análise leilão imóveis, stress test imóveis, cap rate, cash on cash, yield imobiliário, SELIC, IPCA, leilão judicial',
  openGraph: {
    title: 'Terminal de Investimento Imobiliário PRO | AgoraEncontrei',
    description: 'Análise profissional de investimento imobiliário com DCF, Monte Carlo, stress tests e dados BCB em tempo real.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: {
    canonical: 'https://agoraencontrei.com.br/investor',
  },
}

// Schema.org structured data for the investment tool
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Terminal de Investimento Imobiliário PRO',
  description: 'Painel profissional de análise de investimento imobiliário com DCF, Monte Carlo, stress tests e comparador de imóveis.',
  url: 'https://agoraencontrei.com.br/investor',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'BRL',
  },
  provider: {
    '@type': 'RealEstateAgent',
    name: 'AgoraEncontrei — Imobiliária Lemos',
    url: 'https://agoraencontrei.com.br',
    address: { '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP', addressCountry: 'BR' },
  },
  featureList: [
    'Análise DCF (Fluxo de Caixa Descontado)',
    'Cálculo de VPL (Valor Presente Líquido) e TIR (Taxa Interna de Retorno)',
    'Simulação Monte Carlo com 500+ iterações',
    'Stress Tests com 7 cenários de crise',
    'Análise de Sensibilidade (Tornado + Heatmap)',
    'Comparador de até 4 imóveis simultâneos',
    'Gestão de Portfólio Imobiliário',
    'Dados BCB em tempo real (SELIC, IPCA, IGP-M, CDI)',
  ],
}

export default function InvestorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InvestorDashboardClient />
    </>
  )
}
