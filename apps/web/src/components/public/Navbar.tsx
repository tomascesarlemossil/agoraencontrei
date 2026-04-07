'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  Menu, X, ChevronDown, ChevronRight,
  LayoutDashboard, UserCheck, Users, CreditCard,
  BarChart3, ClipboardList, Home, Calculator,
  Building, Wrench, Handshake, Gavel, Phone, Shield,
} from 'lucide-react'

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
  { href: '/parceiros/planos', icon: <Handshake className="w-4 h-4" />, label: 'Seja um Parceiro', desc: 'Dashboard privado — Planos Prime e VIP', color: '#C9A84C' },
  { href: '/parceiros/plano-vip', icon: <Shield className="w-4 h-4" />, label: 'Sentinela Territorial VIP', desc: 'Exclusividade em condomínios e bairros', color: '#1B2B5B' },
  { href: '/leiloes', icon: <Gavel className="w-4 h-4" />, label: 'Leilões Imobiliários', desc: 'Imóveis com até 50% de desconto', color: '#7c3aed' },
]

const ACCESS_AREAS = [
  {
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    label: 'Painel Administrativo',
    desc: 'Acesso completo ao sistema',
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.12)',
  },
  {
    href: '/login',
    icon: <UserCheck className="w-5 h-5" />,
    label: 'Área do Corretor',
    desc: 'Gestão de imóveis e clientes',
    color: '#4a90d9',
    bg: 'rgba(74,144,217,0.12)',
  },
  {
    href: '/portal/login',
    icon: <Users className="w-5 h-5" />,
    label: 'Portal do Cliente',
    desc: 'Proprietários, inquilinos e parceiros',
    color: '#5cb85c',
    bg: 'rgba(92,184,92,0.12)',
  },
  {
    href: '/meu-painel',
    icon: <BarChart3 className="w-5 h-5" />,
    label: 'Painel do Parceiro',
    desc: 'Dashboard privado — ferramentas exclusivas',
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.12)',
  },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [servicosOpen, setServicosOpen] = useState(false)
  const [mobileServicosOpen, setMobileServicosOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const servicosRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Bloquear scroll do body completamente quando menu mobile está aberto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${window.scrollY}px`
    } else {
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
  }, [menuOpen])

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

  const closeMenu = () => {
    setMenuOpen(false)
    setMobileServicosOpen(false)
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: 'var(--site-primary-color, #1B2B5B)',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? '0 2px 24px rgba(27,43,91,0.3)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0" aria-label="AgoraEncontrei — Marketplace Imobiliário">
            <Image
              src="/logo-ae-v2.png"
              alt="AgoraEncontrei Marketplace"
              width={44}
              height={44}
              className="flex-shrink-0"
              style={{ borderRadius: '50%' }}
              priority
            />
            <div className="flex flex-col leading-none">
              <span className="text-base tracking-tight" style={{ fontFamily: 'Arial, Helvetica, sans-serif', letterSpacing: '-0.01em' }}>
                <span style={{ color: '#1a5c2a', fontWeight: 700 }}>Agora</span>
                <span style={{ color: '#d1d5db', fontWeight: 700 }}>Encontrei</span>
              </span>
              <span className="text-[9px] font-medium" style={{ color: '#9ca3af', letterSpacing: '0.04em' }}>
                Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Menu principal">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}

            {/* Serviços dropdown */}
            <div className="relative" ref={servicosRef}>
              <button
                onClick={() => setServicosOpen(v => !v)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10"
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

          {/* CTA + Acesso + mobile menu button */}
          <div className="flex items-center gap-2">
            {/* Área de Acesso dropdown — desktop */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAccessOpen(v => !v)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10 border border-white/20"
                aria-label="Abrir menu de acesso"
                aria-expanded={accessOpen}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden lg:inline">Área de Acesso</span>
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
                        style={{ backgroundColor: area.bg, color: area.color }}
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

            {/* Botão de leilões mobile (visível ao lado do hambúrguer) */}
            <Link
              href="/leiloes"
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold"
              style={{ backgroundColor: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}
            >
              <Gavel className="w-3.5 h-3.5" />
              Leilões
            </Link>

            {/* Botão hambúrguer mobile */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden p-2.5 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
            >
              {menuOpen
                ? <X className="w-5 h-5" aria-hidden="true" />
                : <Menu className="w-5 h-5" aria-hidden="true" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER — overlay + painel com scroll interno ─────────────── */}
      {/* Overlay escuro */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          style={{ backdropFilter: 'blur(2px)', touchAction: 'none' }}
          onClick={closeMenu}
          onTouchMove={e => e.preventDefault()}
          aria-hidden="true"
        />
      )}

      {/* Drawer lateral direita */}
      <div
        id="mobile-drawer"
        role="navigation"
        aria-label="Menu mobile"
        className="fixed top-0 right-0 bottom-0 z-50 md:hidden flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: 'min(85vw, 340px)',
          backgroundColor: '#0d1e3d',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header do drawer */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#1B2B5B' }}
        >
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-ae-v2.png"
              alt="AgoraEncontrei"
              width={36}
              height={36}
              style={{ borderRadius: '50%' }}
            />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold" style={{ color: '#d1d5db' }}>
                <span style={{ color: '#1a5c2a' }}>Agora</span>Encontrei
              </span>
              <span className="text-[9px]" style={{ color: '#9ca3af' }}>Marketplace</span>
            </div>
          </div>
          <button
            onClick={closeMenu}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do drawer — SCROLL INTERNO aqui */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* Navegação principal */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'rgba(201,168,76,0.7)' }}>
              Navegação
            </p>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="flex items-center justify-between px-3 py-3 text-sm font-medium text-white/85 hover:text-white hover:bg-white/8 rounded-xl transition-colors mb-0.5"
                style={{ borderRadius: '12px' }}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </Link>
            ))}
          </div>

          {/* Serviços — accordion */}
          <div className="px-4 pb-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <button
              onClick={() => setMobileServicosOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold rounded-xl transition-colors hover:bg-white/8"
              style={{ color: '#C9A84C' }}
            >
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Serviços & Ferramentas
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileServicosOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileServicosOpen && (
              <div className="mt-1 space-y-0.5">
                {SERVICOS_MENU.map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight">{item.label}</p>
                      <p className="text-xs text-white/40 leading-tight mt-0.5 truncate">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Área de Acesso — sempre visível e destacada */}
          <div
            className="mx-4 mb-4 rounded-2xl overflow-hidden border"
            style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', marginTop: '8px' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(201,168,76,0.7)' }}>
                Área de Acesso
              </p>
            </div>
            {ACCESS_AREAS.map((area, i) => (
              <Link
                key={area.label}
                href={area.href}
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-4 hover:bg-white/5 transition-colors"
                style={{ borderBottom: i < ACCESS_AREAS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: area.bg, color: area.color }}
                >
                  {area.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{area.label}</p>
                  <p className="text-white/45 text-xs mt-0.5">{area.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: area.color }} />
              </Link>
            ))}
          </div>

          {/* Espaço extra para garantir que o último item seja visível */}
          <div className="h-4" />
        </div>

        {/* Footer fixo do drawer — botões de ação */}
        <div
          className="flex-shrink-0 px-4 py-4 border-t space-y-2"
          style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0d1e3d' }}
        >
          <a
            href="https://wa.me/5516981010004?text=Olá! Vim pelo site e gostaria de mais informações."
            target="_blank"
            rel="noreferrer"
            onClick={closeMenu}
            className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-bold rounded-xl transition-all active:scale-95"
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            <Phone className="w-4 h-4" />
            Falar com corretor
          </a>
          <Link
            href="/leiloes"
            onClick={closeMenu}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold rounded-xl border transition-all active:scale-95"
            style={{ borderColor: 'rgba(201,168,76,0.4)', color: '#C9A84C' }}
          >
            <Gavel className="w-4 h-4" />
            Ver Leilões com Desconto
          </Link>
        </div>
      </div>
    </>
  )
}
