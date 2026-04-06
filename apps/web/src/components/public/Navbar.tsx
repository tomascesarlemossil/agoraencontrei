'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, ChevronDown, LayoutDashboard, UserCheck, Users, CreditCard, BarChart3, ClipboardList, Home, Calculator, Building, Wrench, Handshake, Gavel } from 'lucide-react'

const NAV_LINKS = [
  { href: '/imoveis?purpose=SALE', label: 'Comprar' },
  { href: '/imoveis?purpose=RENT', label: 'Alugar' },
  { href: '/leiloes', label: '🏛️ Leilões' },
  { href: '/imoveis', label: 'Todos os Imóveis' },
  { href: '/avaliacao', label: 'Avaliação Gratuita' },
  { href: '/parceiros', label: 'Parceiros' },
  { href: '/blog', label: 'Blog' },
]

const SERVICOS_MENU = [
  { href: '/servicos', icon: <Wrench className="w-4 h-4" />, label: 'Nossos Serviços', desc: 'Visão geral de todos os serviços', color: '#1B2B5B' },
  { href: '/anunciar', icon: <Building className="w-4 h-4" />, label: 'Cadastre seu Imóvel', desc: 'Venda ou alugue seu imóvel conosco', color: '#dc2626' },
  { href: '/servicos/2via-boleto', icon: <CreditCard className="w-4 h-4" />, label: '2ª Via de Boleto', desc: 'Solicite a segunda via rapidamente', color: '#C9A84C' },
  { href: '/servicos/extrato-proprietario', icon: <BarChart3 className="w-4 h-4" />, label: 'Extrato do Proprietário', desc: 'Consulte repasses e extratos', color: '#C9A84C' },
  { href: '/financiamentos', icon: <Calculator className="w-4 h-4" />, label: 'Financiamentos', desc: 'Simule e financie seu imóvel', color: '#2563eb' },
  { href: '/servicos/fichas-cadastrais', icon: <ClipboardList className="w-4 h-4" />, label: 'Fichas Cadastrais', desc: 'Propostas e cadastros online', color: '#16a34a' },
  { href: '/financiamentos#simulador', icon: <Home className="w-4 h-4" />, label: 'Simule seu Financiamento', desc: 'Calcule parcelas e taxas', color: '#2563eb' },
  { href: '/parceiros', icon: <Handshake className="w-4 h-4" />, label: 'Seja um Parceiro', desc: 'Anuncie seus imóveis no marketplace', color: '#C9A84C' },
]

const ACCESS_AREAS = [
  {
    href: '/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    label: 'Painel Administrativo',
    desc: 'Acesso completo ao sistema',
    color: '#C9A84C',
  },
  {
    href: '/login',
    icon: <UserCheck className="w-4 h-4" />,
    label: 'Área do Corretor',
    desc: 'Gestão de imóveis e clientes',
    color: '#4a90d9',
  },
  {
    href: '/portal/login',
    icon: <Users className="w-4 h-4" />,
    label: 'Portal do Cliente',
    desc: 'Proprietários, inquilinos e parceiros',
    color: '#5cb85c',
  },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [servicosOpen, setServicosOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const servicosRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccessOpen(false)
      }
      if (servicosRef.current && !servicosRef.current.contains(e.target as Node)) {
        setServicosOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: 'var(--site-primary-color, #1B2B5B)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 2px 24px rgba(27,43,91,0.3)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo AgoraEncontrei */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="AgoraEncontrei — Marketplace Imobiliário">
          <Image
            src="/logo-ae-v2.png"
            alt="AgoraEncontrei Marketplace"
            width={48}
            height={48}
            className="flex-shrink-0"
            style={{ borderRadius: '50%' }}
            priority
          />
          <div className="flex flex-col leading-none">
            <span className="text-base tracking-tight" style={{ fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: '-0.01em' }}>
              <span style={{ color: '#1a5c2a', fontWeight: 700 }}>Agora</span><span style={{ color: '#d1d5db', fontWeight: 700 }}>Encontrei</span>
            </span>
            <span className="text-[9px] font-medium" style={{ color: '#9ca3af', letterSpacing: '0.04em' }}>
              Marktplace
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Menu principal">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}

          {/* Serviços dropdown */}
          <div className="relative" ref={servicosRef}>
            <button
              onClick={() => setServicosOpen(v => !v)}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10"
              aria-label="Abrir menu de serviços"
              aria-expanded={servicosOpen}
            >
              Serviços
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicosOpen ? 'rotate-180' : ''}`} />
            </button>

            {servicosOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-72 rounded-xl shadow-2xl border overflow-hidden"
                style={{ backgroundColor: '#152347', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Serviços Disponíveis</p>
                </div>
                {SERVICOS_MENU.map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setServicosOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${item.color}22`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-white/90">{item.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* CTA + Acesso + mobile menu */}
        <div className="flex items-center gap-2">
          {/* Área de Acesso dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setAccessOpen(v => !v)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10 border border-white/20"
              aria-label="Abrir menu de acesso"
              aria-expanded={accessOpen}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Área de Acesso</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${accessOpen ? 'rotate-180' : ''}`} />
            </button>

            {accessOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-2xl border overflow-hidden"
                style={{ backgroundColor: '#152347', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Escolha sua área</p>
                </div>
                {ACCESS_AREAS.map(area => (
                  <Link
                    key={area.label}
                    href={area.href}
                    onClick={() => setAccessOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${area.color}22`, color: area.color }}
                    >
                      {area.icon}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-white/90">{area.label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{area.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <a
            href="https://wa.me/5516981010004?text=Olá! Vim pelo site e gostaria de mais informações."
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--site-accent-color, #C9A84C)', color: 'var(--site-primary-color, #1B2B5B)' }}
          >
            Falar com corretor
          </a>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          role="navigation"
          aria-label="Menu mobile"
          style={{ backgroundColor: '#152347' }}
          className="md:hidden border-t border-white/10 px-4 py-3 space-y-1"
        >
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Serviços section in mobile */}
          <div className="pt-2 border-t border-white/10 mt-2 space-y-1">
            <p className="px-3 py-1 text-white/30 text-xs uppercase tracking-wider">Serviços</p>
            {SERVICOS_MENU.map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <span style={{ color: item.color }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10 mt-2 space-y-1">
            <p className="px-3 py-1 text-white/30 text-xs uppercase tracking-wider">Área de Acesso</p>
            {ACCESS_AREAS.map(area => (
              <Link
                key={area.label}
                href={area.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <span style={{ color: area.color }}>{area.icon}</span>
                {area.label}
              </Link>
            ))}
          </div>
          <a
            href="https://wa.me/5516981010004"
            target="_blank"
            rel="noreferrer"
            className="block mt-2 px-3 py-2.5 text-sm font-semibold text-center rounded-lg"
            style={{ backgroundColor: 'var(--site-accent-color, #C9A84C)', color: 'var(--site-primary-color, #1B2B5B)' }}
          >
            Falar com corretor
          </a>
        </nav>
      )}
    </header>
  )
}
