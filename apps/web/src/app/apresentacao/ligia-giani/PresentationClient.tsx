'use client'

/**
 * Apresentação autônoma — Ligia Giani Imóveis
 *
 * Demonstra, em uma única página, como ficaria o site da corretora dentro do
 * AgoraEncontrei (tema Luxury Gold), já alimentado com os imóveis reais dela,
 * seguido do pitch da plataforma e dos dados de acesso de parceira.
 *
 * Não depende de banco de dados — todo o conteúdo vem de lib/demo/ligia-giani-data.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  LIGIA_COMPANY,
  LIGIA_PROPERTIES,
  formatBRL,
  type DemoProperty,
} from '@/lib/demo/ligia-giani-data'

const ACCENT = '#fbbf24' // amber-400 (Luxury Gold)
const waLink = (text: string) =>
  `https://wa.me/${LIGIA_COMPANY.whatsapp}?text=${encodeURIComponent(text)}`

// ── Galeria (modal) ────────────────────────────────────────────────────────
function GalleryModal({
  property,
  onClose,
}: {
  property: DemoProperty
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)

  // Body scroll lock (padrão mobile do projeto)
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % property.images.length)
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + property.images.length) % property.images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [property.images.length, onClose])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col"
      style={{ height: '100dvh' }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white shrink-0"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{property.title}</p>
          <p className="text-xs text-amber-400">{formatBRL(property.price)}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-3 shrink-0 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl leading-none"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      {/* Imagem principal */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center px-2 relative"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={property.images[index]}
          alt={`${property.title} — foto ${index + 1}`}
          className="max-h-full max-w-full object-contain rounded-lg"
          loading="eager"
        />
        {property.images.length > 1 && (
          <>
            <button
              onClick={() => setIndex(i => (i - 1 + property.images.length) % property.images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl flex items-center justify-center"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              onClick={() => setIndex(i => (i + 1) % property.images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl flex items-center justify-center"
              aria-label="Próxima"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbs */}
      <div
        className="shrink-0 flex gap-2 overflow-x-auto px-4 py-3 overscroll-contain"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        {property.images.map((src, i) => (
          <button
            key={src}
            onClick={() => setIndex(i)}
            className={`shrink-0 h-14 w-20 rounded-md overflow-hidden border-2 transition ${
              i === index ? 'border-amber-400' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Card de imóvel ──────────────────────────────────────────────────────────
function PropertyCard({ property, onOpen }: { property: DemoProperty; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group text-left bg-gray-900/80 border border-amber-500/20 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5"
    >
      <div className="relative h-52 overflow-hidden bg-gray-800">
        <img
          src={property.images[0]}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent" />
        {property.isFeatured && (
          <span className="absolute top-3 left-3 bg-amber-500 text-gray-950 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            Destaque
          </span>
        )}
        <span className="absolute top-3 right-3 bg-gray-950/70 text-amber-300 text-[10px] font-semibold px-2.5 py-1 rounded-full">
          {property.typeLabel}
        </span>
        <span className="absolute bottom-3 right-3 bg-gray-950/70 text-white text-[11px] px-2 py-1 rounded-md">
          {property.images.length} fotos
        </span>
      </div>
      <div className="p-4">
        <p className="font-serif text-lg font-bold text-white leading-snug line-clamp-2">{property.title}</p>
        <p className="text-xs text-gray-400 mt-1">
          {property.neighborhood} • {property.city}/{property.state}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-gray-300">
          <span>🛏 {property.bedrooms} quartos</span>
          {property.suites > 0 && <span>🚿 {property.suites} suíte{property.suites > 1 ? 's' : ''}</span>}
          <span>🚗 {property.parkingSpaces} vaga{property.parkingSpaces > 1 ? 's' : ''}</span>
          <span>📐 {property.areaLabel ?? `${property.area} m²`}</span>
        </div>
        <p className="mt-3 text-xl font-bold" style={{ color: ACCENT }}>
          {formatBRL(property.price)}
        </p>
      </div>
    </button>
  )
}

// ── Página ────────────────────────────────────────────────────────────────
export default function PresentationClient() {
  const [active, setActive] = useState<DemoProperty | null>(null)
  const [filter, setFilter] = useState<'TODOS' | 'APARTMENT' | 'HOUSE' | 'PENTHOUSE'>('TODOS')
  const c = LIGIA_COMPANY

  const filtered = useMemo(
    () => (filter === 'TODOS' ? LIGIA_PROPERTIES : LIGIA_PROPERTIES.filter(p => p.type === filter)),
    [filter],
  )

  const stats = useMemo(() => {
    const prices = LIGIA_PROPERTIES.map(p => p.price).filter((v): v is number => v != null)
    return {
      total: LIGIA_PROPERTIES.length,
      cities: new Set(LIGIA_PROPERTIES.map(p => p.city)).size,
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  }, [])

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'APARTMENT', label: 'Apartamentos' },
    { key: 'HOUSE', label: 'Casas' },
    { key: 'PENTHOUSE', label: 'Coberturas' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <style>{`:root{--color-primary:${ACCENT};--color-accent:${ACCENT}}`}</style>

      {/* Faixa de apresentação (contexto da reunião) */}
      <div className="bg-amber-500 text-gray-950 text-center text-xs sm:text-sm font-semibold py-2 px-4">
        Demonstração AgoraEncontrei • Site exclusivo preparado para {c.name}
      </div>

      {/* Header do site dela */}
      <header className="bg-gray-950/95 backdrop-blur-xl border-b border-amber-500/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border border-amber-400/40 flex items-center justify-center font-serif font-bold text-amber-400">
              LG
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold" style={{ color: ACCENT }}>{c.name}</h1>
              <p className="text-[10px] text-gray-400 -mt-0.5">{c.creci} • {c.city}/{c.state}</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#imoveis" className="hover:text-amber-300 transition">Imóveis</a>
            <a href="#sobre" className="hover:text-amber-300 transition">Sobre</a>
            <a href="#contato" className="hover:text-amber-300 transition">Contato</a>
          </nav>
          <a
            href={waLink(`Olá ${c.agent}, vi seu site e gostaria de mais informações.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: '#25D366' }}
          >
            WhatsApp
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/20 py-20 sm:py-28 px-4 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${LIGIA_PROPERTIES[0].images[0]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-gray-950/40" />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-amber-400 text-sm font-semibold tracking-[0.2em] uppercase mb-4">
            Exclusividade & Patrimônio
          </p>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold mb-6 leading-tight">
            Encontre o imóvel dos seus <span style={{ color: ACCENT }}>sonhos</span> em Franca
          </h2>
          <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Imóveis selecionados e oportunidades exclusivas, com a curadoria e o atendimento
            personalizado da {c.name}.
          </p>
          <div className="max-w-xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Buscar por bairro, edifício ou tipo..."
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 placeholder:text-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <a
              href="#imoveis"
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-gray-950 font-semibold px-6 py-3 rounded-lg hover:from-amber-400 hover:to-amber-500 transition flex items-center"
            >
              Buscar
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-10 text-center">
            <Stat value={`${stats.total}`} label="Imóveis ativos" />
            <Stat value={`${stats.cities}`} label="Cidades" />
            <Stat value={formatBRL(stats.min)} label="A partir de" />
            <Stat value={formatBRL(stats.max)} label="Alto padrão até" />
          </div>
        </div>
      </section>

      {/* Imóveis */}
      <section id="imoveis" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-serif font-bold">Oportunidades Selecionadas</h3>
            <p className="text-gray-400 mt-2">Imóveis reais do portfólio da {c.name}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                  filter === f.key
                    ? 'bg-amber-500 text-gray-950 border-amber-500'
                    : 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <PropertyCard key={p.reference} property={p} onOpen={() => setActive(p)} />
            ))}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-16 px-4 bg-gray-900/40 border-y border-amber-500/10">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-4">Sobre a {c.name}</h3>
          <p className="text-gray-300 leading-relaxed">{c.about}</p>
          <p className="text-gray-400 mt-4 text-sm">
            {c.agent} • {c.creci} — {c.address}, {c.city}/{c.state}
          </p>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl sm:text-3xl font-serif font-bold mb-4">Consultoria Personalizada</h3>
          <p className="text-gray-400 mb-8">
            Tem interesse em algum imóvel? Fale com {c.agent} agora mesmo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={waLink(`Olá ${c.agent}, vi seu site no AgoraEncontrei e gostaria de mais informações.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium w-full sm:w-auto justify-center"
              style={{ backgroundColor: '#25D366' }}
            >
              Falar no WhatsApp • {c.phone}
            </a>
            <button className="border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-6 py-3 rounded-lg w-full sm:w-auto">
              Falar com o Tomás (IA)
            </button>
          </div>
        </div>
      </section>

      {/* ── PITCH AgoraEncontrei ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-gray-900 border-t border-amber-500/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-400 text-sm font-semibold tracking-[0.2em] uppercase mb-3">
              Por que AgoraEncontrei
            </p>
            <h3 className="text-2xl sm:text-4xl font-serif font-bold">
              Tudo o que você viu acima já está pronto — e muito mais
            </h3>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              Este site foi gerado automaticamente a partir do seu acervo atual. No AgoraEncontrei
              você ganha um site profissional, um CRM completo e inteligência artificial trabalhando
              pelas suas vendas — tudo integrado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map(b => (
              <div
                key={b.title}
                className="bg-gray-900/80 border border-amber-500/20 rounded-xl p-6 hover:border-amber-400/40 transition"
              >
                <div className="text-2xl mb-3">{b.icon}</div>
                <h4 className="font-serif font-bold text-lg text-white mb-1">{b.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Acesso de parceira ───────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-serif font-bold mb-2">Seu acesso já está criado 🎉</h3>
            <p className="text-gray-400 mb-6">
              Tudo o que você viu acima também está dentro do painel de gestão, pronto para uso.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <Cred label="Seu site" value={c.tenant.siteUrl} />
              <Cred label="Login" value={c.tenant.login} />
              <Cred label="Senha" value={c.tenant.password} />
            </div>
            <p className="text-xs text-gray-500 mt-6">
              Plano {c.tenant.plan} • Tema Luxury Gold • Assistente de vendas Tomás incluído
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-amber-500/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {c.name}. Todos os direitos reservados.</p>
          <p>
            Powered by <span className="text-amber-400 font-semibold">AgoraEncontrei</span>
          </p>
        </div>
      </footer>

      {active && <GalleryModal property={active} onClose={() => setActive(null)} />}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl sm:text-2xl font-serif font-bold" style={{ color: ACCENT }}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  )
}

function Cred({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-950/60 border border-amber-500/20 rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-wide text-amber-400 mb-1">{label}</p>
      <p className="text-sm text-white break-all font-mono">{value}</p>
    </div>
  )
}

const BENEFITS: { icon: string; title: string; desc: string }[] = [
  {
    icon: '🌐',
    title: 'Site profissional próprio',
    desc: 'Domínio exclusivo, design de alto padrão e otimizado para Google — pronto em minutos a partir do seu acervo.',
  },
  {
    icon: '🤖',
    title: 'Tomás, vendedor com IA',
    desc: 'Atende seus clientes 24h por WhatsApp e site, qualifica leads e recomenda imóveis automaticamente.',
  },
  {
    icon: '📊',
    title: 'CRM completo',
    desc: 'Funil de vendas, leads, contatos e negociações organizados em um só lugar, com histórico de cada cliente.',
  },
  {
    icon: '📣',
    title: 'Portais integrados',
    desc: 'Publique no ZAP, VivaReal, OLX e Facebook Marketplace com um clique, sem retrabalho.',
  },
  {
    icon: '📱',
    title: 'Marketing automático',
    desc: 'Posts para redes sociais e descrições de anúncios gerados por IA, com a sua marca.',
  },
  {
    icon: '📈',
    title: 'Relatórios e leilões',
    desc: 'Avaliação inteligente de imóveis, análise de leilões e métricas de desempenho do seu negócio.',
  },
]
