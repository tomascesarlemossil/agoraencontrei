import Link from 'next/link'
import { Gavel, FileSearch, Megaphone, Users, Handshake, ArrowRight, Building2 } from 'lucide-react'

/**
 * Bloco de conteúdo para páginas de cidade — evita páginas "vazias/rasas".
 *
 * Quando uma página programática de cidade não tem imóvel em estoque, este
 * bloco vira o conteúdo principal: oferta dos serviços da AgoraEncontrei
 * (avaliação, leilão, anúncio, corretor, planos) + buscas relacionadas reais
 * (internal linking). Também aparece abaixo das listagens quando há imóveis,
 * reforçando conteúdo e links internos.
 *
 * O texto varia por cidade (determinístico) para reduzir duplicação — o Google
 * penaliza milhares de páginas com texto idêntico ("doorway pages").
 */

interface RelatedLink {
  href: string
  label: string
}

interface Props {
  cityName: string
  stateUf?: string
  /** Ex.: "imóveis à venda", "imóveis para alugar", "imóveis em leilão". */
  context?: string
  /** Links de busca relacionada (cidades próximas, categorias irmãs). */
  relatedLinks?: RelatedLink[]
  /** Quando false, este bloco é o conteúdo principal (página sem estoque). */
  hasResults?: boolean
}

const SERVICES = [
  { href: '/avaliacao', icon: FileSearch, title: 'Avaliação de imóvel grátis', desc: 'Descubra o valor de mercado com laudo baseado em dados reais.' },
  { href: '/leiloes', icon: Gavel, title: 'Leilões de imóveis', desc: 'Oportunidades com desconto — Caixa, bancos e leilões judiciais.' },
  { href: '/anunciar-imovel', icon: Megaphone, title: 'Anuncie seu imóvel', desc: 'Divulgue nos principais portais com anúncio otimizado por IA.' },
  { href: '/corretores', icon: Users, title: 'Fale com um corretor', desc: 'Especialistas locais para comprar, vender ou alugar com segurança.' },
  { href: '/parceiros/cadastro', icon: Handshake, title: 'Sou corretor / imobiliária', desc: 'CRM, automação e captação de leads no plano para profissionais.' },
]

/** Variações determinísticas de texto por cidade (evita conteúdo idêntico). */
function intro(cityName: string, stateUf: string | undefined, context: string): string {
  const loc = stateUf ? `${cityName}/${stateUf}` : cityName
  const variants = [
    `O mercado de ${context} em ${loc} está em constante movimento. A AgoraEncontrei reúne imóveis, leilões e serviços imobiliários para você fechar o melhor negócio na cidade com segurança e transparência.`,
    `Procurando ${context} em ${loc}? Além das oportunidades listadas, a AgoraEncontrei oferece avaliação, leilões e apoio de corretores locais para cada etapa da sua decisão em ${cityName}.`,
    `Em ${loc}, encontrar ${context} fica mais simples com a AgoraEncontrei: comparamos preços, mapeamos leilões e conectamos você a profissionais da região para uma compra ou locação sem dor de cabeça.`,
  ]
  // Índice determinístico a partir do nome (mesma cidade → mesmo texto sempre).
  const idx = cityName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % variants.length
  return variants[idx]
}

export function CitySeoContent({ cityName, stateUf, context = 'imóveis', relatedLinks = [], hasResults = false }: Props) {
  return (
    <section className="mt-10 space-y-8">
      {!hasResults && (
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5" style={{ color: '#C9A84C' }} />
            <h2 className="text-xl font-bold" style={{ color: '#143A1F', fontFamily: 'Georgia, serif' }}>
              {context.charAt(0).toUpperCase() + context.slice(1)} em {cityName}{stateUf ? `/${stateUf}` : ''}
            </h2>
          </div>
          <p className="text-gray-600 leading-relaxed">{intro(cityName, stateUf, context)}</p>
        </div>
      )}

      {/* Serviços da AgoraEncontrei */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#143A1F', fontFamily: 'Georgia, serif' }}>
          Serviços da AgoraEncontrei em {cityName}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map(s => {
            const Icon = s.icon
            return (
              <Link key={s.href} href={s.href}
                className="group bg-white rounded-2xl border p-5 hover:border-[#C9A84C] hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5" style={{ color: '#143A1F' }} />
                  <h3 className="font-bold text-sm text-gray-800">{s.title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold" style={{ color: '#143A1F' }}>
                  Saiba mais <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Buscas relacionadas (internal linking) */}
      {relatedLinks.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#143A1F', fontFamily: 'Georgia, serif' }}>
            Buscas relacionadas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {relatedLinks.map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center justify-between p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition-all text-sm">
                <span className="font-medium text-gray-700 truncate">{l.label}</span>
                <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA final */}
      <div className="bg-gradient-to-br from-[#143A1F] to-[#0f1c3a] rounded-2xl p-6 text-center text-white">
        <p className="text-lg font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          Não encontrou o imóvel ideal em {cityName}?
        </p>
        <p className="text-white/70 text-sm mb-4">
          Fale com a AgoraEncontrei e receba oportunidades selecionadas na sua região.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/imoveis" className="px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: '#C9A84C', color: '#143A1F' }}>
            Ver todos os imóveis
          </Link>
          <Link href="/contato" className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 border border-white/20">
            Falar com especialista
          </Link>
        </div>
      </div>
    </section>
  )
}
