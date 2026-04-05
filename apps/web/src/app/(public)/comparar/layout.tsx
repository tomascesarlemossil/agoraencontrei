import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comparar Imóveis',
  description:
    'Compare imóveis lado a lado em Franca e região. Analise preço, área, quartos, banheiros e vagas de garagem para tomar a melhor decisão. AgoraEncontrei — Imobiliária Lemos.',
  keywords: 'comparar imóveis, comparação imóveis franca, comparar casas, comparar apartamentos',
  robots: { index: false, follow: true },
}

export default function CompararLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
