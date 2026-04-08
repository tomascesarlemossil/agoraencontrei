import type { Metadata } from 'next'
import SocialProofBanner from '@/components/SocialProofBanner'
import LeiloesClient from './LeiloesClient'

const WEB_URL = 'https://www.agoraencontrei.com.br'

export const metadata: Metadata = {
  title: 'Leilões de Imóveis | AgoraEncontrei — Marketplace Imobiliário',
  description: 'Encontre imóveis em leilão com até 70% de desconto. Leilões da Caixa, bancos, judiciais e extrajudiciais em todo o Brasil. Calculadora de ROI, alertas WhatsApp e análise de oportunidades.',
  keywords: [
    'leilão de imóveis', 'leilão de imóveis franca sp', 'leilão judicial',
    'leilão extrajudicial', 'imóveis caixa', 'leilão online',
    'arremate de imóveis', 'investimento imobiliário',
    'imóveis abaixo do mercado', 'calculadora leilão', 'ROI leilão imóvel',
    'leilão caixa franca', 'leilão imóvel franca sp',
  ],
  openGraph: {
    title: 'Leilões de Imóveis | AgoraEncontrei',
    description: 'Marketplace de leilões imobiliários. Busca unificada em 800+ leiloeiros e bancos. Descontos de até 70%.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Leilões de Imóveis - AgoraEncontrei' }],
  },
  alternates: { canonical: `${WEB_URL}/leiloes` },
}

const SCHEMA_WEBPAGE = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Leilões de Imóveis — AgoraEncontrei',
  description: 'Marketplace de leilões imobiliários com busca unificada. Casas, apartamentos e terrenos em leilão com até 70% de desconto.',
  url: `${WEB_URL}/leiloes`,
  isPartOf: { '@type': 'WebSite', name: 'AgoraEncontrei', url: WEB_URL },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: WEB_URL },
      { '@type': 'ListItem', position: 2, name: 'Leilões de Imóveis', item: `${WEB_URL}/leiloes` },
    ],
  },
}

const SCHEMA_LOCAL_BUSINESS = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: 'AgoraEncontrei — Imobiliária Lemos',
  url: WEB_URL,
  telephone: '+551637230045',
  email: 'contato@imobiliarialemos.com.br',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rua Simão Caleiro, 2383',
    addressLocality: 'Franca',
    addressRegion: 'SP',
    postalCode: '14401-155',
    addressCountry: 'BR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -20.5386,
    longitude: -47.4009,
  },
  areaServed: {
    '@type': 'City',
    name: 'Franca',
    containedInPlace: { '@type': 'State', name: 'São Paulo' },
  },
  makesOffer: {
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: 'Leilões de Imóveis',
      description: 'Marketplace de leilões imobiliários com imóveis da Caixa, Santander, BB e leiloeiros oficiais. Descontos de até 70% sobre valor de avaliação.',
    },
  },
}

export default function LeiloesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_WEBPAGE) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA_LOCAL_BUSINESS) }} />
      <SocialProofBanner />
      <LeiloesClient />
    </>
  )
}
