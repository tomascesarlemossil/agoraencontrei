import type { Metadata } from 'next'
import RelatoriosClient from './RelatoriosClient'

export const metadata: Metadata = {
  title: 'Relatórios de Leilões | AgoraEncontrei — Valores por Cidade, Bairro e Tipo',
  description: 'Consulte os valores dos imóveis em leilão por localização e tipo: quanto foi arrematado, lance mínimo, avaliação, desconto médio e preço por m². Dados do arquivo histórico de leilões.',
  keywords: [
    'valores leilão imóveis', 'quanto arrematou leilão', 'preço médio leilão',
    'relatório leilão imóveis', 'desconto médio leilão', 'leilão por bairro',
  ],
  alternates: { canonical: 'https://www.agoraencontrei.com.br/leiloes/relatorios' },
}

export default function RelatoriosPage() {
  return <RelatoriosClient />
}
