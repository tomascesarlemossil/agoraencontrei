import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const META_PIXEL_ID = '932688306232065'

export const metadata: Metadata = {
  title: {
    default: 'Imobiliária Lemos — Franca/SP | Comprar, Alugar e Avaliar Imóveis',
    template: '%s | Imobiliária Lemos',
  },
  description: 'Há mais de 20 anos conectando pessoas aos melhores imóveis de Franca e região. Compra, venda, locação e avaliação. CRECI 279051.',
  keywords: 'imóveis franca, casas franca, apartamentos franca, terrenos franca, imobiliária franca, comprar imóvel franca, alugar imóvel franca, financiamento imobiliário, leilão imóvel, CRECI 279051, imobiliária lemos',
  authors: [{ name: 'Imobiliária Lemos', url: 'https://www.agoraencontrei.com.br' }],
  creator: 'Imobiliária Lemos',
  publisher: 'Imobiliária Lemos',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    siteName: 'Imobiliária Lemos',
    locale: 'pt_BR',
    type: 'website',
  },
  verification: {
    // Google Search Console — add when available
    // google: 'GOOGLE_VERIFICATION_CODE',
    // Facebook domain verification
    other: { 'facebook-domain-verification': META_PIXEL_ID },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
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
