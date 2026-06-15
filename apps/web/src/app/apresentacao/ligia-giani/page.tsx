import type { Metadata } from 'next'
import PresentationClient from './PresentationClient'
import { LIGIA_COMPANY } from '@/lib/demo/ligia-giani-data'

export const metadata: Metadata = {
  title: `${LIGIA_COMPANY.name} — Demonstração AgoraEncontrei`,
  description: `Site exclusivo de ${LIGIA_COMPANY.name} (${LIGIA_COMPANY.city}/${LIGIA_COMPANY.state}) gerado no AgoraEncontrei, com imóveis reais, CRM e atendimento por IA.`,
  robots: { index: false, follow: false },
}

export default function Page() {
  return <PresentationClient />
}
