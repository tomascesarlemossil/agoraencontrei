import type { Metadata } from 'next'
import AnunciarGratisClient from './AnunciarGratisClient'

export const metadata: Metadata = {
  title: 'Anuncie seu Imóvel Grátis por 30 Dias | AgoraEncontrei',
  description: 'Venda seu imóvel sem pagar comissão. Anúncio Grátis com destaque por 30 dias no maior marketplace imobiliário de Franca/SP. Sem burocracia, sem custo inicial.',
  keywords: ['anunciar imóvel grátis', 'vender imóvel sem comissão', 'anúncio imóvel Franca SP', 'venda direta proprietário'],
  openGraph: {
    title: 'Anuncie seu Imóvel Grátis por 30 Dias',
    description: 'Venda seu imóvel sem pagar comissão. Destaque garantido por 30 dias.',
    url: 'https://www.agoraencontrei.com.br/anunciar-gratis',
    siteName: 'AgoraEncontrei',
    locale: 'pt_BR',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.agoraencontrei.com.br/anunciar-gratis',
  },
}

export default function AnunciarGratisPage() {
  return <AnunciarGratisClient />
}
