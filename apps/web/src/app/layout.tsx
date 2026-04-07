import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from '@/components/providers'
import { ConditionalMetaPixel } from '@/components/ConditionalMetaPixel'
import { WebVitals } from '@/components/WebVitals'
import { FRANCA_GEO_KEYWORDS } from '@/data/seo-geo-keywords'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

const META_PIXEL_ID = '932688306232065'
const WEB_URL = 'https://www.agoraencontrei.com.br'

export const metadata: Metadata = {
  // ── Título: combina AgoraEncontrei + Imobiliária Lemos para unir as marcas ──
  title: {
    default: 'AgoraEncontrei | Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis',
    template: '%s | Imobiliária Lemos — Franca/SP',
  },
  description: 'AgoraEncontrei — Imobiliária Lemos em Franca/SP há mais de 20 anos. Encontre casas à venda, apartamentos para alugar, terrenos e imóveis comerciais. Residencial Amazonas, Villa Piemonte, Centro e todos os bairros..',
  keywords: [
    // Marca dupla — AgoraEncontrei + Imobiliária Lemos
    'agoraencontrei', 'agora encontrei imóveis', 'agora encontrei imobiliária',
    'imobiliária lemos', 'imobiliária lemos franca', 'lemos imóveis', 'agoraencontrei imobiliária lemos', 'agoraencontrei franca sp',
    // Cidade principal — intenções de compra e aluguel
    'imóveis franca sp', 'casas à venda franca sp', 'apartamentos para alugar franca sp',
    'imobiliária franca sp', 'comprar casa franca sp', 'alugar apartamento franca sp',
    'terrenos franca sp', 'imóveis comerciais franca', 'avaliação imóvel franca',
    'financiamento imobiliário franca', 'imóveis alto padrão franca sp',
    'imóvel franca sp', 'casa franca sp', 'apartamento franca sp',
    'corretor de imóveis franca sp', 'imobiliária de confiança franca sp',
    'melhor imobiliária franca sp', 'imobiliária franca sp creci',
    // Bairros Franca SP — alta intenção local
    'imóveis residencial amazonas franca', 'casas residencial amazonas franca sp',
    'casa à venda residencial amazonas franca', 'aluguel residencial amazonas franca',
    'imóveis villa piemonte franca', 'casas villa piemonte franca sp',
    'imóveis villa di capri franca', 'casas villa di capri franca sp',
    'imóveis village são vicente franca', 'casas village são vicente franca sp',
    'imóveis villaggio di firenze franca', 'casas villaggio firenze franca',
    'imóveis villagio mundo novo franca', 'casas villagio mundo novo franca sp',
    'imóveis villa toscana franca', 'imóveis villa são vicente franca',
    'imóveis village santa georgina franca', 'imóveis village do sol franca',
    'imóveis jardim america franca sp', 'imóveis jardim paulista franca sp',
    'imóveis centro franca sp', 'imóveis jardim nova franca',
    'imóveis vila industrial franca', 'imóveis jardim natal franca',
    'imóveis jardim pereira franca', 'imóveis jardim redentor franca',
    'imóveis jardim são josé franca', 'imóveis parque das árvores franca',
    'imóveis jardim copacabana franca', 'imóveis jardim das rosas franca',
    'imóveis jardim eldorado franca', 'imóveis jardim imperial franca',
    'imóveis jardim maracanã franca', 'imóveis jardim paraíso franca',
    'imóveis jardim primavera franca', 'imóveis jardim são marcos franca',
    'imóveis jardim universitário franca', 'imóveis vila boa vista franca',
    'imóveis vila brasília franca', 'imóveis vila guimarães franca',
    'imóveis vila nossa senhora aparecida franca', 'imóveis vila santa cruz franca',
    'imóveis parque industrial franca', 'imóveis parque residencial franca',
    'imóveis bairro nobre franca', 'imóveis condomínio fechado franca',
    'imóveis jardim alvorada franca', 'imóveis jardim consolação franca',
    'imóveis jardim francano franca', 'imóveis jardim independência franca',
    'imóveis jardim ipiranga franca', 'imóveis jardim são luiz franca',
    'imóveis jardim tropical franca', 'imóveis vila maria franca',
    'imóveis vila norte franca', 'imóveis vila são pedro franca',
    'imóveis residencial portal franca', 'imóveis residencial vale do sol franca',
    // Tipos de imóvel
    'casa à venda franca sp', 'apartamento à venda franca sp',
    'terreno à venda franca sp', 'chácara à venda franca sp',
    'sítio à venda franca sp', 'sobrado à venda franca sp',
    'cobertura à venda franca sp', 'galpão industrial franca sp',
    'sala comercial franca sp', 'loja comercial franca sp',
    'fazenda à venda franca sp', 'rancho à venda franca sp',
    'kitnet franca sp', 'studio franca sp', 'flat franca sp',
    'casa de condomínio franca sp', 'duplex franca sp',
    // Características
    'casa 3 quartos franca sp', 'casa 4 quartos franca sp',
    'apartamento 2 quartos franca sp', 'apartamento 3 quartos franca sp',
    'imóvel com piscina franca sp', 'imóvel com churrasqueira franca sp',
    'condomínio fechado franca sp', 'imóvel de alto padrão franca sp',
    'imóvel com garagem franca sp', 'imóvel financiável franca sp',
    'imóvel com suíte franca sp', 'imóvel com área gourmet franca sp',
    'imóvel perto de escola franca sp', 'imóvel perto de shopping franca sp',
    // Cidades da região
    'imóveis ribeirão preto', 'imóveis batatais sp', 'imóveis patrocínio paulista',
    'imóveis rifaina sp', 'imóveis ibiraci mg', 'imóveis capetinga mg',
    'imóveis itamogi mg', 'imóveis passos mg', 'imóveis itirapuã sp',
    'imóveis cristais paulista sp', 'imóveis restinga sp',
    'imóveis pedregulho sp', 'imóveis orlândia sp', 'imóveis são joaquim da barra sp',
    // Intenções de busca
    'comprar imóvel franca sp', 'alugar imóvel franca sp',
    'imóvel para alugar franca', 'casa para alugar franca sp',
    'apartamento para alugar franca sp', 'casa para comprar franca sp',
    'imóvel barato franca sp', 'imóvel rural franca sp',
    'imóvel novo franca sp', 'imóvel usado franca sp',
    'imóvel pronto para morar franca sp', 'imóvel na planta franca sp',
    'imóvel para investir franca sp', 'imóvel para renda franca sp',
    'imóvel para locação comercial franca sp', 'imóvel para empresa franca sp',
    // Serviços imobiliários
    'avaliação gratuita imóvel franca', 'anunciar imóvel franca sp',
    'vender imóvel franca sp', 'administração de imóveis franca sp',
    'gestão de aluguel franca sp', 'locação de imóveis franca sp',
    // Fotografia e edição de fotos
    'fotografia de imóveis franca sp', 'fotos profissionais de imóveis franca',
    'edição de fotos de imóveis franca', 'edição de imagens imóveis franca sp',
    'fotos imóveis franca sp', 'imagens profissionais imóveis franca',
    'tratamento de fotos imóveis', 'edição de fotos franca sp',
    'edição de imagens franca sp', 'fotografia imobiliária franca',
    'foto imóvel franca', 'imagens imóveis franca sp',
    'edição de foto para imóvel', 'filtros para fotos de imóveis',
    // Vídeo e videomaker
    'vídeo de imóveis franca sp', 'vídeo profissional imóveis franca',
    'videomaker imóveis franca sp', 'vídeo para imóvel franca',
    'vídeos profissionais imóveis franca', 'vídeo imobiliário franca sp',
    'tour virtual imóvel franca sp', 'vídeo tour imóvel franca',
    'vídeo marketing imóvel franca', 'vídeo apresentação imóvel franca',
    'vídeo drone imóvel franca sp', 'vídeo drone franca sp',
    'videomaker franca sp', 'produção de vídeo franca sp',
    // Drone e fotografia aérea
    'drone imóveis franca sp', 'fotos drone franca sp',
    'fotografia aérea imóveis franca', 'drone franca sp',
    'fotos de drone franca sp', 'imagens aéreas imóveis franca',
    'drone imobiliário franca', 'vídeo drone franca',
    'filmagem drone franca sp', 'foto aérea imóvel franca',
    // Avaliações imobiliárias
    'avaliação de imóvel franca sp', 'avaliação imobiliária franca',
    'avaliação de imóveis franca sp', 'avaliação de propriedade franca',
    'laudo de avaliação imóvel franca', 'perito avaliador imóveis franca',
    'valor de mercado imóvel franca', 'preço imóvel franca sp',
    'quanto vale meu imóvel franca', 'avaliação gratuita imóvel franca sp',
    'serviço de avaliação imobiliária franca', 'avaliação de terreno franca sp',
    // Engenharia e construção
    'engenharia civil franca sp', 'construção de casas franca sp',
    'construtora franca sp', 'engenheiro civil franca sp',
    'projeto de construção franca sp', 'obra franca sp',
    'construção residencial franca sp', 'construção comercial franca sp',
    'empresa de construção franca sp', 'serviços de engenharia franca',
    'projeto arquitetônico franca sp', 'arquitetura franca sp',
    // Reforma
    'reforma de casas franca sp', 'reforma de imóveis franca sp',
    'reforma residencial franca sp', 'reforma comercial franca sp',
    'empresa de reforma franca sp', 'reformar casa franca sp',
    'reformar imóvel franca sp', 'reforma e construção franca sp',
    'comprar e reformar imóvel franca', 'imóvel para reformar franca sp',
    'casa para reformar franca sp', 'reforma e decoração franca sp',
    // Leilão e arremação
    'leilão de imóveis franca sp', 'imóvel em leilão franca sp',
    'arrematação de imóvel franca', 'leilão judicial imóvel franca',
    'leilão extrajudicial imóvel franca', 'imóvel leilão franca sp',
    'comprar imóvel leilão franca', 'arremação leilão franca sp',
    'leilão imóvel barato franca', 'imóvel retomado banco franca sp',
    // Investimentos imobiliários
    'investimento imobiliário franca sp', 'investir em imóveis franca sp',
    'imóvel para investimento franca', 'renda passiva imóveis franca sp',
    'imóvel para renda franca sp', 'retorno investimento imóvel franca',
    'imóvel comercial para investir franca', 'fundo imobiliário franca sp',
    'imóvel como investimento franca sp', 'comprar imóvel para alugar franca',
    'imóvel rentabilidade franca sp', 'investimento seguro imóvel franca',
    // Keywords geográficas: todas as ruas, bairros e edifícios de Franca/SP
    ...FRANCA_GEO_KEYWORDS,
  ].join(', '),
  authors: [{ name: 'Imobiliária Lemos', url: WEB_URL }],
  creator: 'Imobiliária Lemos',
  publisher: 'AgoraEncontrei | Imobiliária Lemos',
  category: 'Real Estate',
  classification: 'Imobiliária, Compra e Venda de Imóveis, Locação',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: WEB_URL,
    languages: { 'pt-BR': WEB_URL },
  },
  // ── Favicon e ícones ──────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    siteName: 'AgoraEncontrei | Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
    url: WEB_URL,
    title: 'AgoraEncontrei | Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis',
    description: 'AgoraEncontrei — Imobiliária Lemos em Franca/SP há mais de 20 anos. Casas à venda, apartamentos para alugar, terrenos e imóveis comerciais em todos os bairros de Franca..',
    images: [
      {
        url: `${WEB_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'AgoraEncontrei | Imobiliária Lemos — Franca/SP',
        type: 'image/jpeg',
      },
    ],
  },
  // ── Twitter/X Card ────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@imobiliarialemos',
    creator: '@imobiliarialemos',
    title: 'AgoraEncontrei | Imobiliária Lemos — Franca/SP',
    description: 'Imobiliária em Franca/SP há mais de 20 anos. Casas, apartamentos, terrenos e imóveis comerciais..',
    images: [`${WEB_URL}/og-image.jpg`],
  },
  // ── Verificação Google / Facebook ─────────────────────────────────────────
  verification: {
    google: 'Jt8clgdW34zz2sb7qj3fCYHPFRd2Y1D5394Rah3L9Yk',
    other: {
      'facebook-domain-verification': META_PIXEL_ID,
      'msvalidate.01': '',
    },
  },
}

// ── JSON-LD: LocalBusiness + RealEstateAgent ──────────────────────────────────
const jsonLdBusiness = {
  '@context': 'https://schema.org',
  '@type': ['RealEstateAgent', 'LocalBusiness'],
  '@id': `${WEB_URL}/#organization`,
  name: 'Imobiliária Lemos',
  alternateName: ['Lemos Imóveis', 'AgoraEncontrei', 'AgoraEncontrei Imobiliária Lemos'],
  description: 'Imobiliária Lemos em Franca/SP há mais de 20 anos especializada em compra, venda e locação de imóveis residenciais e comerciais. Atendemos todos os bairros de Franca e região.',
  url: WEB_URL,
  telephone: '+55-16-3723-0045',
  email: 'contato@agoraencontrei.com.br',
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
    longitude: -47.4006,
  },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:00', closes: '12:00' },
  ],
  priceRange: '$$',
  currenciesAccepted: 'BRL',
  paymentAccepted: 'Cash, Credit Card, Bank Transfer, PIX',
  areaServed: [
    { '@type': 'City', name: 'Franca', containedInPlace: { '@type': 'State', name: 'São Paulo', identifier: 'SP' } },
    { '@type': 'City', name: 'Batatais', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Ribeirão Preto', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Patrocínio Paulista', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Cristais Paulista', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Rifaina', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Itirapuã', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
  ],
  hasMap: 'https://maps.google.com/?q=Imobiliária+Lemos+Franca+SP',
  logo: `${WEB_URL}/logo-lemos-v2.png`,
  image: `${WEB_URL}/og-image.jpg`,
  sameAs: [
    'https://www.instagram.com/imobiliarialemos',
    'https://www.youtube.com/@tomaslemosbr',
    'https://www.facebook.com/imobiliarialemos',
    WEB_URL,
  ],
  knowsAbout: [
    'Compra e venda de imóveis em Franca SP',
    'Locação residencial e comercial em Franca SP',
    'Avaliação de imóveis',
    'Financiamento imobiliário',
    'Administração de imóveis',
    'Gestão de aluguéis',
    'Imóveis no Residencial Amazonas Franca',
    'Imóveis no Villa Piemonte Franca',
    'Imóveis no Villa di Capri Franca',
    'Imóveis no Centro de Franca SP',
    'Imóveis no Jardim América Franca',
  ],
  numberOfEmployees: { '@type': 'QuantitativeValue', value: 10 },
  foundingDate: '2003',
  slogan: 'Agora você encontrou o imóvel ideal',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '87',
    bestRating: '5',
    worstRating: '1',
  },
  award: ' — Conselho Regional de Corretores de Imóveis de São Paulo',
}

// ── JSON-LD: WebSite com SearchAction (Google Sitelinks Searchbox) ────────────
const jsonLdWebsite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${WEB_URL}/#website`,
  url: WEB_URL,
  name: 'AgoraEncontrei | Imobiliária Lemos',
  description: 'Plataforma de busca de imóveis em Franca/SP e região. Compre, alugue ou avalie seu imóvel com a Imobiliária Lemos.',
  publisher: { '@id': `${WEB_URL}/#organization` },
  inLanguage: 'pt-BR',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${WEB_URL}/imoveis?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
        {/* ── Preconnect para recursos externos críticos (melhora LCP/FCP) ── */}
        <link rel="preconnect" href="https://agoraencontrei-api-production.up.railway.app" />
        <link rel="preconnect" href="https://agoraencontrei-media.s3.us-east-1.amazonaws.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://unpkg.com" />
        <link rel="dns-prefetch" href="https://nominatim.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://cdnuso.com" />
        <link rel="dns-prefetch" href="https://cdn2.uso.com.br" />
        {/* ── Favicon explícito para compatibilidade máxima ── */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/icons/icon-16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B2B5B" />
        <meta name="msapplication-TileColor" content="#1B2B5B" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* ── Geo tags para SEO local ── */}
        <meta name="geo.region" content="BR-SP" />
        <meta name="geo.placename" content="Franca, São Paulo, Brasil" />
        <meta name="geo.position" content="-20.5386;-47.4006" />
        <meta name="ICBM" content="-20.5386, -47.4006" />

        {/* ── Structured Data JSON-LD — LocalBusiness + RealEstateAgent ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBusiness) }}
        />
        {/* ── Structured Data JSON-LD — WebSite + SearchAction ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        {/* ── Meta Pixel condicional (LGPD) ───────────────────── */}
        <ConditionalMetaPixel />
        {/* ── Core Web Vitals monitoring ──────────────────────── */}
        <WebVitals />
        {/* ── Vercel Analytics + Speed Insights ──────────────── */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
