import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sistema Administrador AgoraEncontrei — na nuvem ou no seu PC',
  description:
    'O sistema imobiliário completo: assine na nuvem (a partir de R$97/mês) ou instale offline no seu PC (a partir de R$197/mês). Escolha em 1 minuto qual edição é a sua.',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/software' },
  openGraph: {
    title: 'Sistema Administrador AgoraEncontrei — online ou offline',
    description: 'CRM, imóveis, contratos, aluguéis e cobrança com IA. Assine na nuvem ou instale no seu PC.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei',
  },
}

export default function SoftwareLayout({ children }: { children: React.ReactNode }) {
  return children
}
