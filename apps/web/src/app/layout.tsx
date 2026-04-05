import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { WebVitals } from '@/components/WebVitals'
import { CookieConsent } from '@/components/CookieConsent'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

const META_PIXEL_ID = '932688306232065'

const WEB_URL = 'https://www.agoraencontrei.com.br'

export const metadata: Metadata = {
  title: {
    default: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP | Imobiliária Lemos',
    template: '%s | AgoraEncontrei — Imobiliária Lemos',
  },
  description: 'AgoraEncontrei — o marketplace imobiliário de Franca/SP criado pela Imobiliária Lemos. 1.000+ imóveis: casas à venda, apartamentos para alugar, terrenos e imóveis comerciais. Busca com IA, mapa interativo. Anuncie grátis. CRECI 279051.',
  keywords: [
    // Marca & Marketplace
    'imobiliária lemos', 'imobiliária lemos franca', 'lemos imóveis', 'CRECI 279051',
    'marketplace imobiliário', 'marketplace imobiliário franca', 'anunciar imóvel grátis',
    'anunciar imóvel franca', 'agoraencontrei', 'agoraencontrei marketplace',
    // Cidade principal — intenções de compra
    'imóveis franca sp', 'casas à venda franca sp', 'apartamentos para alugar franca sp',
    'imobiliária franca sp', 'comprar casa franca sp', 'alugar apartamento franca sp',
    'terrenos franca sp', 'imóveis comerciais franca', 'avaliação imóvel franca',
    'financiamento imobiliário franca', 'imóveis alto padrão franca sp',
    'imóvel franca sp', 'casa franca sp', 'apartamento franca sp',
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
    // Tipos de imóvel
    'casa à venda franca sp', 'apartamento à venda franca sp',
    'terreno à venda franca sp', 'chácara à venda franca sp',
    'sítio à venda franca sp', 'sobrado à venda franca sp',
    'cobertura à venda franca sp', 'galpão industrial franca sp',
    'sala comercial franca sp', 'loja comercial franca sp',
    'fazenda à venda franca sp', 'rancho à venda franca sp',
    'kitnet franca sp', 'studio franca sp',
    // Características
    'casa 3 quartos franca sp', 'casa 4 quartos franca sp',
    'apartamento 2 quartos franca sp', 'apartamento 3 quartos franca sp',
    'imóvel com piscina franca sp', 'imóvel com churrasqueira franca sp',
    'condomínio fechado franca sp', 'imóvel de alto padrão franca sp',
    'imóvel com garagem franca sp', 'imóvel financiável franca sp',
    // Cidades da região
    'imóveis ribeirão preto', 'imóveis batatais sp', 'imóveis patrocínio paulista',
    'imóveis rifaina sp', 'imóveis ibiraci mg', 'imóveis capetinga mg',
    'imóveis itamogi mg', 'imóveis passos mg', 'imóveis itirapuã sp',
    'imóveis cristais paulista sp', 'imóveis restinga sp',
    // Intenções de busca
    'comprar imóvel franca sp', 'alugar imóvel franca sp',
    'imóvel para alugar franca', 'casa para alugar franca sp',
    'apartamento para alugar franca sp', 'casa para comprar franca sp',
    'imóvel barato franca sp', 'imóvel rural franca sp',
    'imóvel novo franca sp', 'imóvel usado franca sp',
    'imóvel pronto para morar franca sp', 'imóvel na planta franca sp',
  ].join(', '),
  authors: [{ name: 'AgoraEncontrei — Imobiliária Lemos', url: WEB_URL }],
  creator: 'AgoraEncontrei — Imobiliária Lemos',
  publisher: 'AgoraEncontrei — Imobiliária Lemos',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  alternates: { canonical: WEB_URL },
  openGraph: {
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
    url: WEB_URL,
    title: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP | Imobiliária Lemos',
    description: 'Encontre seu imóvel ideal em Franca e região. 1.000+ imóveis com busca inteligente por IA, mapa interativo e filtros avançados. Casas, apartamentos e terrenos. Marketplace criado pela Imobiliária Lemos.',
    images: [
      {
        url: `${WEB_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgoraEncontrei — Marketplace Imobiliário de Franca/SP',
    description: 'Encontre seu imóvel ideal em Franca e região. 1.000+ imóveis com busca por IA. Marketplace criado pela Imobiliária Lemos. CRECI 279051.',
    images: [`${WEB_URL}/og-image.jpg`],
  },
  verification: {
    google: 'Jt8clgdW34zz2sb7qj3fCYHPFRd2Y1D5394Rah3L9Yk',
    other: { 'facebook-domain-verification': META_PIXEL_ID },
  },
}

const jsonLdBusiness = {
  '@context': 'https://schema.org',
  '@type': ['RealEstateAgent', 'LocalBusiness'],
  name: 'Imobiliária Lemos',
  alternateName: ['Lemos Imóveis', 'AgoraEncontrei'],
  description: 'Imobiliária em Franca/SP fundada por Noêmia em 2002, com mais de 22 anos de tradição. AgoraEncontrei é o marketplace imobiliário criado por Tomás Lemos em 2026, oferecendo busca com IA e mapa interativo.',
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
  areaServed: [
    { '@type': 'City', name: 'Franca', containedInPlace: { '@type': 'State', name: 'São Paulo' } },
    { '@type': 'City', name: 'Batatais' },
    { '@type': 'City', name: 'Ribeirão Preto' },
    { '@type': 'City', name: 'Patrocínio Paulista' },
    { '@type': 'City', name: 'Rifaina' },
    { '@type': 'City', name: 'Cristais Paulista' },
    { '@type': 'City', name: 'Pedregulho' },
    { '@type': 'City', name: 'Itirapuã' },
  ],
  hasMap: 'https://maps.google.com/?q=Imobiliária+Lemos+Franca+SP',
  logo: `${WEB_URL}/logo-lemos.png`,
  image: `${WEB_URL}/og-image.jpg`,
  sameAs: [
    'https://www.instagram.com/imobiliarialemos',
    'https://www.instagram.com/tomaslemosbr',
    'https://www.youtube.com/@imobiliarialemos',
    'https://www.facebook.com/imobiliarialemos',
  ],
  knowsAbout: [
    'Compra e venda de imóveis em Franca SP',
    'Locação residencial e comercial em Franca SP',
    'Avaliação de imóveis',
    'Financiamento imobiliário',
    'Busca de imóveis com inteligência artificial',
    'Marketplace imobiliário',
    'Imóveis no Residencial Amazonas Franca',
    'Imóveis no Villa Piemonte Franca',
    'Imóveis no Villa di Capri Franca',
  ],
  numberOfEmployees: { '@type': 'QuantitativeValue', value: 10 },
  foundingDate: '2002',
  founder: { '@type': 'Person', name: 'Noêmia Lemos' },
  slogan: 'Agora você encontrou o imóvel ideal',
}

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AgoraEncontrei',
  alternateName: 'AgoraEncontrei — Imobiliária Lemos',
  url: WEB_URL,
  description: 'Marketplace imobiliário de Franca/SP com busca inteligente por IA. Encontre casas, apartamentos e terrenos.',
  publisher: {
    '@type': 'Organization',
    name: 'Imobiliária Lemos',
    url: WEB_URL,
    logo: { '@type': 'ImageObject', url: `${WEB_URL}/logo-lemos.png` },
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${WEB_URL}/imoveis?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: 'pt-BR',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B2B5B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* ── Structured Data JSON-LD — LocalBusiness + RealEstateAgent ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBusiness) }}
        />
        {/* ── Structured Data JSON-LD — WebSite + SearchAction ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        {/* ── Meta Pixel ───────────────────────────────────────── */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {/* ── End Meta Pixel ───────────────────────────────────── */}
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <WebVitals />
        <CookieConsent />
      </body>
    </html>
  )
}
