import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seja um Parceiro — Planos e Ferramentas | AgoraEncontrei',
  description:
    'Acesse o dashboard privado do AgoraEncontrei. Calculadora ROI de leilões, sentinela territorial, analytics de leads e alertas inteligentes. Planos a partir de R$ 197/mês.',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/parceiros/cadastro' },
}

export default function ParceirosPlanos() {
  redirect('/parceiros/cadastro')
}
