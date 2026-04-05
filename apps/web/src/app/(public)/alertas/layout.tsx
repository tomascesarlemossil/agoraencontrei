import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alertas de Imóveis',
  description:
    'Cadastre alertas e receba notificações quando novos imóveis compatíveis com seus critérios forem publicados em Franca e região. AgoraEncontrei — Imobiliária Lemos.',
  keywords: 'alerta imóveis, notificação imóvel novo, aviso imóvel franca, monitorar imóveis',
  robots: { index: true, follow: true },
}

export default function AlertasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
