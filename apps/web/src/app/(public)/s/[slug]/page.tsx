import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3100'

interface SeoPage {
  slug: string
  titulo: string
  h1: string
  meta_title: string
  meta_description: string
  intro: string
  conteudo: string | null
  faq: { pergunta: string; resposta: string }[]
  cidade: string
  uf: string
  estado_nome: string
  keyword: string
  categoria: string
  views: number
  published_at: string
  related: { slug: string; titulo: string; h1: string; keyword: string }[]
  nearby: { slug: string; titulo: string; cidade: string; uf: string }[]
}

async function getPage(slug: string): Promise<SeoPage | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/seo/pages/${slug}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return {}

  return {
    title: page.meta_title,
    description: page.meta_description,
    openGraph: {
      title: page.meta_title,
      description: page.meta_description,
      type: 'article',
      url: `https://www.agoraencontrei.com.br/s/${page.slug}`,
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `https://www.agoraencontrei.com.br/s/${page.slug}`,
    },
  }
}

export default async function SeoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return notFound()

  const faq = Array.isArray(page.faq) ? page.faq : []

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.meta_title,
    description: page.meta_description,
    url: `https://www.agoraencontrei.com.br/s/${page.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'AgoraEncontrei',
      url: 'https://www.agoraencontrei.com.br',
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.agoraencontrei.com.br' },
        { '@type': 'ListItem', position: 2, name: page.h1, item: `https://www.agoraencontrei.com.br/s/${page.slug}` },
      ],
    },
  }

  const faqJsonLd = faq.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.pergunta,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.resposta,
          },
        })),
      }
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-gray-700 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li>
              <Link
                href={`/imoveis?city=${encodeURIComponent(page.cidade)}&state=${page.uf}`}
                className="hover:text-gray-700 transition-colors"
              >
                {page.cidade} - {page.uf}
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li className="text-gray-700 font-medium truncate max-w-[200px]">
              {page.keyword}
            </li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {page.h1}
        </h1>

        {/* Intro */}
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          {page.intro}
        </p>

        {/* CTA Box */}
        <div
          className="rounded-xl p-6 mb-8 border"
          style={{ backgroundColor: '#f0f7f1', borderColor: '#d4e8d6' }}
        >
          <p className="text-sm font-semibold text-gray-800 mb-3">
            Encontre {page.keyword} em {page.cidade} agora:
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/imoveis?city=${encodeURIComponent(page.cidade)}&state=${page.uf}`}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#1B2B5B' }}
            >
              Ver Imóveis Disponíveis
            </Link>
            <Link
              href={`/leiloes?city=${encodeURIComponent(page.cidade)}`}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors bg-white text-gray-700 hover:bg-gray-50"
            >
              Ver Leilões
            </Link>
            <a
              href={`https://wa.me/5516981010004?text=${encodeURIComponent(`Olá! Tenho interesse em ${page.keyword} em ${page.cidade} - ${page.uf}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#25D366' }}
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Conteúdo principal */}
        {page.conteudo && (
          <article className="prose prose-lg max-w-none mb-12 text-gray-700">
            {page.conteudo.split('\n').filter(Boolean).map((line, idx) => {
              // Handle markdown headings
              if (line.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-xl font-bold text-gray-900 mt-8 mb-3">
                    {line.replace('## ', '')}
                  </h2>
                )
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-lg font-semibold text-gray-800 mt-6 mb-2">
                    {line.replace('### ', '')}
                  </h3>
                )
              }
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <li key={idx} className="ml-4 text-gray-700">
                    {line.replace(/^[-*]\s/, '')}
                  </li>
                )
              }
              return <p key={idx}>{line}</p>
            })}
          </article>
        )}

        {/* FAQ Section */}
        {faq.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Perguntas Frequentes
            </h2>
            <div className="space-y-4">
              {faq.map((item, idx) => (
                <details
                  key={idx}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden group"
                >
                  <summary className="cursor-pointer px-6 py-4 font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                    {item.pergunta}
                  </summary>
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {item.resposta}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related pages — same city */}
        {page.related && page.related.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Veja também em {page.cidade}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {page.related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/s/${r.slug}`}
                  className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {r.h1}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Nearby cities — same keyword */}
        {page.nearby && page.nearby.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {page.keyword} em outras cidades
            </h2>
            <div className="flex flex-wrap gap-2">
              {page.nearby.map((n) => (
                <Link
                  key={n.slug}
                  href={`/s/${n.slug}`}
                  className="inline-block px-4 py-2 text-sm bg-white rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  {n.cidade} - {n.uf}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: '#1B2B5B' }}
        >
          <h2 className="text-xl font-bold text-white mb-2">
            Quer ajuda para encontrar o imóvel ideal?
          </h2>
          <p className="text-white/70 mb-5 text-sm">
            Fale com nossa equipe especializada. Atendimento personalizado para{' '}
            {page.cidade} e região.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/5516981010004?text=${encodeURIComponent(`Olá! Tenho interesse em ${page.keyword} em ${page.cidade} - ${page.uf}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#25D366' }}
            >
              Falar no WhatsApp
            </a>
            <Link
              href="/contato"
              className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-colors bg-white/10 text-white hover:bg-white/20"
            >
              Formulário de Contato
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
