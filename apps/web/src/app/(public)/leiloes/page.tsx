import type { Metadata } from 'next'
import SocialProofBanner from '@/components/SocialProofBanner'
import LeiloesClient from './LeiloesClient'

export const metadata: Metadata = {
  title: 'Leilões de Imóveis | AgoraEncontrei — Marketplace Imobiliário',
  description: 'Encontre imóveis em leilão com até 70% de desconto. Leilões da Caixa, bancos, judiciais e extrajudiciais em todo o Brasil. Calculadora de ROI, alertas WhatsApp e análise de oportunidades.',
  keywords: [
    'leilão de imóveis', 'leilão judicial', 'leilão extrajudicial',
    'imóveis caixa', 'leilão online', 'arremate de imóveis',
    'investimento imobiliário', 'imóveis abaixo do mercado',
    'calculadora leilão', 'ROI leilão imóvel',
  ],
  openGraph: {
    title: 'Leilões de Imóveis | AgoraEncontrei',
    description: 'Marketplace de leilões imobiliários. Busca unificada em 800+ leiloeiros e bancos.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/leiloes' },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Leilões de Imóveis — AgoraEncontrei',
  description: 'Marketplace de leilões imobiliários com busca unificada.',
  url: 'https://www.agoraencontrei.com.br/leiloes',
  isPartOf: { '@type': 'WebSite', name: 'AgoraEncontrei', url: 'https://www.agoraencontrei.com.br' },
}

export default function LeiloesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <SocialProofBanner />
      <LeiloesClient />
    </>
  )
}
