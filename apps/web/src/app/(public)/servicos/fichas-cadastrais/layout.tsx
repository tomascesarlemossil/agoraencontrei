import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fichas Cadastrais',
  description:
    'Preencha sua ficha cadastral online para locação de imóveis. Processo rápido e seguro com a Imobiliária Lemos em Franca/SP. CRECI 279051.',
  keywords: 'ficha cadastral locação, cadastro locação imóvel, ficha cadastral imobiliária franca, proposta aluguel',
  openGraph: {
    title: 'Fichas Cadastrais | AgoraEncontrei — Imobiliária Lemos',
    description: 'Preencha sua ficha cadastral online para locação. Processo rápido e seguro.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function FichasCadastraisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
