import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contato',
  description:
    'Entre em contato com a Imobiliária Lemos em Franca/SP. Fale conosco por telefone, WhatsApp ou formulário online. Atendimento de segunda a sábado. CRECI 279051.',
  keywords: 'contato imobiliária lemos, imobiliária franca telefone, whatsapp imobiliária franca, falar com corretor franca',
  openGraph: {
    title: 'Contato | AgoraEncontrei — Imobiliária Lemos',
    description: 'Fale conosco: (16) 3723-0045 | WhatsApp: (16) 98101-0004. Atendimento em Franca/SP e região.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function ContatoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
