'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, ChevronDown, LayoutDashboard, UserCheck, Users } from 'lucide-react'

const NAV_LINKS = [
  { href: '/imoveis?purpose=SALE', label: 'Comprar' },
  { href: '/imoveis?purpose=RENT', label: 'Alugar' },
  { href: '/imoveis', label: 'Todos os Imóveis' },
  { href: '/avaliacao', label: 'Avaliação Gratuita' },
  { href: '/blog', label: 'Blog' },
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
    href: '/login',
    icon: <Users className="w-4 h-4" />,
    label: 'Área do Cliente',
    desc: 'Proprietários, inquilinos e parceiros',
    color: '#5cb85c',
  },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(27, 43, 91, 0.97)' : '#1B2B5B',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 2px 24px rgba(27,43,91,0.3)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo-lemos.png"
            alt="Imobiliária Lemos"
            width={44}
            height={44}
            className="rounded-full flex-shrink-0 object-cover"
            priority
          />
          <div>
            <p className="font-bold text-white text-sm leading-none tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              IMOBILIÁRIA
            </p>
            <p className="font-bold text-sm leading-none tracking-widest" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>
              LEMOS
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA + Acesso + mobile menu */}
        <div className="flex items-center gap-2">
          {/* Área de Acesso dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setAccessOpen(v => !v)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10 border border-white/20"
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
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            Falar com corretor
          </a>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ backgroundColor: '#152347' }} className="md:hidden border-t border-white/10 px-4 py-3 space-y-1">
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
            style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
          >
            Falar com corretor
          </a>
        </div>
      )}
    </header>
  )
}
