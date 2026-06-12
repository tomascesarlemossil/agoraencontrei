import type { Metadata } from 'next'
import { PlanosContent } from '../PlanosContent'

export const metadata: Metadata = {
  title: 'Planos e Preços — Seja um Parceiro | AgoraEncontrei',
  description:
    'Conheça os planos do AgoraEncontrei para imobiliárias e corretores: site próprio, CRM com IA, planos PRIME e VIP e pacotes de imóveis. Tecnologia de ponta a partir de R$ 197/mês.',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/parceiros/planos' },
}

export default function ParceirosPlanos() {
  return <PlanosContent />
}
