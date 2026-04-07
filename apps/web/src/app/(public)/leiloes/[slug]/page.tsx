import type { Metadata } from 'next'
import LeilaoDetailClient from './LeilaoDetailClient'

type Props = { params: { slug: string } }

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-669c.up.railway.app'

async function getAuction(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/auctions/${slug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const auction = await getAuction(params.slug)
  if (!auction) return { title: 'Leilão não encontrado | AgoraEncontrei' }

  const title = `${auction.title} | Leilão — AgoraEncontrei`
  const description = `Imóvel em leilão: ${auction.title}. ${auction.city ? `${auction.city}/${auction.state}` : ''}. Lance mínimo: R$ ${Number(auction.minimumBid || 0).toLocaleString('pt-BR')}. ${auction.discountPercent ? `${auction.discountPercent}% de desconto.` : ''}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
      images: auction.coverImage ? [{ url: auction.coverImage }] : [],
    },
    alternates: {
      canonical: `https://www.agoraencontrei.com.br/leiloes/${params.slug}`,
    },
  }
}

export default async function LeilaoPage({ params }: Props) {
  const auction = await getAuction(params.slug)

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f1]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Leilão não encontrado</h1>
          <p className="text-gray-500 mb-4">O leilão que você procura pode ter sido encerrado ou removido.</p>
          <a href="/leiloes" className="px-6 py-3 bg-[#1B2B5B] text-white rounded-lg font-semibold">
            Ver Todos os Leilões
          </a>
        </div>
      </div>
    )
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: auction.title,
    description: auction.description || `Imóvel em leilão em ${auction.city}/${auction.state}`,
    url: `https://www.agoraencontrei.com.br/leiloes/${params.slug}`,
    image: auction.coverImage,
    offers: {
      '@type': 'Offer',
      price: Number(auction.minimumBid || 0),
      priceCurrency: 'BRL',
      availability: auction.status === 'OPEN' || auction.status === 'UPCOMING'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <LeilaoDetailClient auction={auction} />
    </>
  )
}
