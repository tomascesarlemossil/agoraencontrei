import Link from 'next/link'
import { generateFooterLinks, type SEOLink } from '@/lib/seo-interlinking'

interface Props {
  citySlug: string
  estado: string
  cityName: string
}

const TYPE_LABELS: Record<SEOLink['type'], string> = {
  cidade: 'Cidades Próximas',
  bairro: 'Bairros',
  comparacao: 'Comparações',
  leilao: 'Leilões',
  cluster: 'Categorias',
  oportunidade: 'Oportunidades',
}

export function SEOFooterLinks({ citySlug, estado, cityName }: Props) {
  const links = generateFooterLinks(citySlug, estado)
  if (links.length === 0) return null

  // Group by type
  const grouped = links.reduce<Record<string, SEOLink[]>>((acc, link) => {
    const key = link.type
    if (!acc[key]) acc[key] = []
    acc[key].push(link)
    return acc
  }, {})

  return (
    <nav aria-label={`Links relacionados a ${cityName}`} className="border-t bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">
          Explore mais em {cityName} e região
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.entries(grouped).map(([type, typeLinks]) => (
            <div key={type}>
              <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                {TYPE_LABELS[type as SEOLink['type']] || type}
              </h4>
              <ul className="space-y-1.5">
                {typeLinks.map(link => (
                  <li key={link.url}>
                    <Link
                      href={link.url}
                      className="text-sm text-blue-700 hover:text-blue-900 hover:underline transition"
                      prefetch={false}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <Link href="/leiloes" className="text-xs px-3 py-1.5 bg-white rounded-full border text-gray-600 hover:border-blue-400 hover:text-blue-700 transition" prefetch={false}>
              Todos os Leilões
            </Link>
            <Link href="/oportunidades/melhores-alugueis-brasil" className="text-xs px-3 py-1.5 bg-white rounded-full border text-gray-600 hover:border-blue-400 hover:text-blue-700 transition" prefetch={false}>
              Ranking de Yield
            </Link>
            <Link href={`/${estado.toLowerCase()}/${citySlug}`} className="text-xs px-3 py-1.5 bg-white rounded-full border text-gray-600 hover:border-blue-400 hover:text-blue-700 transition" prefetch={false}>
              Imóveis em {cityName}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
