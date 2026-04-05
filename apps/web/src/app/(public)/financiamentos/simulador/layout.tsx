import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulador de Financiamento Imobiliario | AgoraEncontrei',
  description:
    'Simule seu financiamento imobiliario online. Calcule parcelas nos sistemas SAC e PRICE, compare juros e descubra o melhor plano para comprar seu imovel.',
  keywords:
    'simulador financiamento imobiliario, calcular parcela financiamento, SAC PRICE, financiamento imovel',
}

export default function SimuladorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
