import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumbs — Trilha de navegação com Schema.org BreadcrumbList JSON-LD.
 * Melhora SEO e acessibilidade (WCAG 2.1 AA).
 */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const allItems = [{ label: 'Início', href: '/' }, ...items]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://www.agoraencontrei.com.br${item.href}` : undefined,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Navegação estrutural"
        className={`flex items-center gap-1 text-sm text-gray-500 ${className}`}
      >
        <ol className="flex items-center gap-1 flex-wrap" role="list">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1
            return (
              <li key={index} className="flex items-center gap-1">
                {index === 0 && <Home className="w-3.5 h-3.5" aria-hidden="true" />}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? 'text-gray-900 font-medium' : ''}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

export default Breadcrumbs
