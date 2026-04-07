import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3100'
const SITE_URL = 'https://www.agoraencontrei.com.br'

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

export const revalidate = 3600

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
      url: `${SITE_URL}/s/${page.slug}`,
      siteName: 'AgoraEncontrei',
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary',
      title: page.meta_title,
      description: page.meta_description,
    },
    alternates: {
      canonical: `${SITE_URL}/s/${page.slug}`,
    },
    robots: {
      index: true,
      follow: true,
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

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Imóveis em ${page.cidade}`,
        item: `${SITE_URL}/imoveis?city=${encodeURIComponent(page.cidade)}&state=${page.uf}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: page.h1,
        item: `${SITE_URL}/s/${page.slug}`,
      },
    ],
  }

  // JSON-LD: FAQPage
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

  // JSON-LD: ItemList (related pages as listing)
  const itemListJsonLd = page.related && page.related.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${page.keyword} em ${page.cidade}`,
        numberOfItems: page.related.length,
        itemListElement: page.related.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: r.h1,
          url: `${SITE_URL}/s/${r.slug}`,
        })),
      }
    : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
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

        {/* CTA: Ver Imoveis + Leiloes + WhatsApp */}
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
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#1B2B5B' }}
            >
              Ver Imoveis Disponiveis
            </Link>
            <Link
              href={`/leiloes?city=${encodeURIComponent(page.cidade)}`}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors bg-white text-gray-700 hover:bg-gray-50"
            >
              Ver Leiloes
            </Link>
            <a
              href={`https://wa.me/5516981010004?text=${encodeURIComponent(`Olá! Tenho interesse em ${page.keyword} em ${page.cidade} - ${page.uf}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Conteudo IA */}
        {page.conteudo && (
          <article className="prose prose-lg max-w-none mb-12 text-gray-700">
            {page.conteudo
              .split('\n')
              .filter(Boolean)
              .map((line, idx) => {
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

        {/* FAQ accordion */}
        {faq.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Perguntas Frequentes
            </h2>
            <div className="space-y-3">
              {faq.map((item, idx) => (
                <details
                  key={idx}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden group"
                  {...(idx === 0 ? { open: true } : {})}
                >
                  <summary className="cursor-pointer px-6 py-4 font-medium text-gray-900 hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                    <span>{item.pergunta}</span>
                    <svg
                      className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {item.resposta}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA: Alerta de novas oportunidades */}
        <div className="rounded-xl p-6 mb-12 border border-amber-200 bg-amber-50">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Receba alertas de {page.keyword} em {page.cidade}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Cadastre-se para receber notificacoes quando novos imoveis forem publicados na sua regiao.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/alertas?keyword=${encodeURIComponent(page.keyword)}&city=${encodeURIComponent(page.cidade)}&state=${page.uf}`}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#C9A84C' }}
            >
              Criar Alerta Gratuito
            </Link>
            <a
              href={`https://wa.me/5516981010004?text=${encodeURIComponent(`Olá! Quero receber alertas de ${page.keyword} em ${page.cidade} - ${page.uf}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Alertas via WhatsApp
            </a>
          </div>
        </div>

        {/* Interlinking: mesma cidade */}
        {page.related && page.related.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Veja tambem em {page.cidade}
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
                  <p className="text-xs text-gray-500 mt-1">{r.keyword}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Interlinking: cidades vizinhas */}
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
            Quer ajuda para encontrar o imovel ideal?
          </h2>
          <p className="text-white/70 mb-5 text-sm">
            Fale com nossa equipe especializada. Atendimento personalizado para{' '}
            {page.cidade} e regiao.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/5516981010004?text=${encodeURIComponent(`Olá! Tenho interesse em ${page.keyword} em ${page.cidade} - ${page.uf}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}
            >
              Falar no WhatsApp
            </a>
            <Link
              href="/contato"
              className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-colors bg-white/10 text-white hover:bg-white/20"
            >
              Formulario de Contato
            </Link>
          </div>
        </div>
      </div>

      {/* Floating CTA — barra fixa no rodapé */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl border-t border-white/10"
        style={{ backgroundColor: '#1B2B5B' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white text-sm font-medium text-center sm:text-left">
            🏠 Procurando{' '}
            <span className="font-bold">{page.keyword}</span>{' '}
            em {page.cidade}?
          </p>
          <div className="flex gap-2 shrink-0">
            <a
              href={`https://wa.me/5516981010004?text=${encodeURIComponent(`Ol\u00e1! Quero ver ${page.keyword} em ${page.cidade} - ${page.uf}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}
            >
              WhatsApp
            </a>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              Ver Marketplace
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
