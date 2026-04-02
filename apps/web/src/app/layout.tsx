import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const META_PIXEL_ID = '932688306232065'

const WEB_URL = 'https://www.agoraencontrei.com.br'

export const metadata: Metadata = {
  title: {
    default: 'Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis',
    template: '%s | Imobiliária Lemos',
  },
  description: 'Imobiliária em Franca/SP há mais de 20 anos. Casas à venda, apartamentos para alugar, terrenos e imóveis comerciais. Compra, venda, locação e avaliação. CRECI 279051.',
  keywords: 'imóveis franca sp, casas à venda franca, apartamentos para alugar franca, imobiliária franca sp, comprar casa franca sp, alugar apartamento franca sp, imóvel franca creci, terrenos franca sp, imóveis comerciais franca, imobiliária lemos franca, casas franca sp, apartamentos franca sp, comprar imóvel franca, alugar imóvel franca, financiamento imobiliário franca, leilão imóvel franca, CRECI 279051, avaliação imóvel franca, imóvel bairro franca sp',
  authors: [{ name: 'Imobiliária Lemos', url: WEB_URL }],
  creator: 'Imobiliária Lemos',
  publisher: 'Imobiliária Lemos',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: WEB_URL },
  openGraph: {
    siteName: 'Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
    url: WEB_URL,
    title: 'Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis',
    description: 'Imobiliária em Franca/SP há mais de 20 anos. Casas à venda, apartamentos para alugar, terrenos e imóveis comerciais. CRECI 279051.',
  },
  verification: {
    // Google Search Console — add when available
    // google: 'GOOGLE_VERIFICATION_CODE',
    // Facebook domain verification
    other: { 'facebook-domain-verification': META_PIXEL_ID },
  },
}

const jsonLdBusiness = {
  '@context': 'https://schema.org',
  '@type': ['RealEstateAgent', 'LocalBusiness'],
  name: 'Imobiliária Lemos',
  description: 'Imobiliária em Franca/SP especializada em compra, venda e locação de imóveis',
  url: WEB_URL,
  telephone: '+55-16-3723-0045',
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
  openingHours: 'Mo-Fr 08:00-18:00, Sa 08:00-12:00',
  priceRange: '$$',
  areaServed: 'Franca, SP, Brasil',
  hasMap: 'https://maps.google.com/?q=Imobiliária+Lemos+Franca+SP',
  sameAs: [
    'https://www.instagram.com/imobiliarialemos',
    'https://www.youtube.com/@tomaslemosbr',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
        {/* ── Structured Data JSON-LD ──────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBusiness) }}
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
      </body>
    </html>
  )
}
