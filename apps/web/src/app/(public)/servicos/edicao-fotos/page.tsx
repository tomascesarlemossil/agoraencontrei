import type { Metadata } from 'next'
import { EdicaoFotosClient } from './EdicaoFotosClient'

export const metadata: Metadata = {
  title: 'Edição de Fotos de Imóveis Online — R$10 por até 20 Fotos | Imobiliária Lemos Franca/SP',
  description: 'Edite até 20 fotos do seu imóvel com filtros profissionais por apenas R$10,00. Pague via PIX e receba suas fotos editadas em minutos. Serviço online da Imobiliária Lemos em Franca/SP.',
  keywords: 'edição de fotos imóveis franca, editar fotos imóvel online, filtros fotos imóveis, tratamento fotos imóveis franca sp, edição imagens imóveis, fotos profissionais imóveis franca, edição fotos online barato, imobiliária lemos edição fotos',
  alternates: { canonical: 'https://www.agoraencontrei.com.br/servicos/edicao-fotos' },
  openGraph: {
    title: 'Edição de Fotos de Imóveis — R$10 por até 20 Fotos',
    description: 'Edite até 20 fotos do seu imóvel com filtros profissionais por apenas R$10,00. Pague via PIX instantaneamente.',
    type: 'website',
    url: 'https://www.agoraencontrei.com.br/servicos/edicao-fotos',
  },
}

export default function EdicaoFotosPage() {
  return <EdicaoFotosClient />
}
