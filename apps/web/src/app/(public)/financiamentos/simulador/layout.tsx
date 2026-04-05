import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulador de Financiamento Imobiliário',
  description:
    'Simule seu financiamento imobiliário online. Calcule parcelas nos sistemas SAC e PRICE, compare juros e descubra o melhor plano para comprar seu imóvel em Franca e região.',
  keywords:
    'simulador financiamento imobiliário, calcular parcela financiamento, SAC PRICE, financiamento imóvel franca, simulação financiamento casa',
  openGraph: {
    title: 'Simulador de Financiamento | AgoraEncontrei — Imobiliária Lemos',
    description: 'Calcule parcelas de financiamento imobiliário nos sistemas SAC e PRICE. Simulação online gratuita.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function SimuladorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
