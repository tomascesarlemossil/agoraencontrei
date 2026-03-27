import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, MessageCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navLinks = [
  { label: 'Comprar', href: '/comprar' },
  { label: 'Alugar', href: '/alugar' },
  { label: 'Temporada', href: '/temporada' },
  { label: 'Notícias', href: '/noticias' },
  { label: 'Plataforma', href: '/plataforma' },
]

const WHATSAPP_URL = 'https://wa.me/5516981010004'
const PHONE = '(16) 3723-0045'

function useScrollPosition() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return scrolled
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const scrolled = useScrollPosition()
  const location = useLocation()

  const isActive = (href: string) => location.pathname === href

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-navy-950/95 backdrop-blur-md border-b border-navy-800/60 shadow-2xl shadow-black/30'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex flex-col leading-none group">
              <span className="font-display text-2xl font-bold text-gold-400 tracking-widest group-hover:text-gold-300 transition-colors">
                LEMOS
              </span>
              <span className="text-[9px] font-sans font-semibold tracking-[0.3em] text-foreground/50 uppercase group-hover:text-foreground/70 transition-colors">
                IMOBILIÁRIA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 font-sans',
                    isActive(link.href)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-foreground/70 hover:text-foreground hover:bg-navy-800/60'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Right Side */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href={`tel:+551637230045`}
                className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors font-sans"
              >
                <Phone className="h-3.5 w-3.5 text-gold-500" />
                {PHONE}
              </a>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                asChild
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-navy-800/60 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 bg-navy-950 border-l border-navy-800',
          'transform transition-transform duration-300 ease-in-out lg:hidden',
          'flex flex-col shadow-2xl',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-800">
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold text-gold-400 tracking-widest">LEMOS</span>
            <span className="text-[9px] font-sans font-semibold tracking-[0.3em] text-foreground/50 uppercase">
              IMOBILIÁRIA
            </span>
          </div>
          <button
            className="p-2 rounded-md text-foreground/60 hover:text-foreground hover:bg-navy-800 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 font-sans',
                isActive(link.href)
                  ? 'text-gold-400 bg-gold-500/10 border border-gold-500/20'
                  : 'text-foreground/70 hover:text-foreground hover:bg-navy-800'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-navy-800 space-y-3">
          <a
            href={`tel:+551637230045`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-navy-900 text-foreground/70 hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4 text-gold-500" />
            <span className="text-sm font-sans">{PHONE}</span>
          </a>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2" asChild>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Falar pelo WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </>
  )
}
