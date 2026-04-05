import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meus Favoritos',
  description:
    'Veja os imóveis que você salvou como favoritos. Compare, analise e entre em contato com os corretores. AgoraEncontrei — Imobiliária Lemos.',
  keywords: 'imóveis favoritos, imóveis salvos, lista imóveis favoritos',
  robots: { index: false, follow: true },
}

export default function FavoritosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
