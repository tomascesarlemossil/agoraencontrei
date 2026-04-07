import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, MapPin, Mail, MessageCircle, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const WHATSAPP_URL = 'https://wa.me/5516981010004'

const footerLinks = {
  imoveis: [
    { label: 'Comprar', href: '/comprar' },
    { label: 'Alugar', href: '/alugar' },
    { label: 'Temporada', href: '/temporada' },
    { label: 'Lançamentos', href: '/lancamentos' },
    { label: 'Avalie seu Imóvel', href: '/avaliacao' },
  ],
  cidades: [
    { label: 'Franca', href: '/comprar?cidade=franca' },
    { label: 'Rifaina', href: '/comprar?cidade=rifaina' },
    { label: 'Ibiraci', href: '/comprar?cidade=ibiraci' },
    { label: 'Patrocínio Paulista', href: '/comprar?cidade=patrocinio-paulista' },
    { label: 'Restinga', href: '/comprar?cidade=restinga' },
    { label: 'São José da Bela Vista', href: '/comprar?cidade=sao-jose-da-bela-vista' },
  ],
  empresa: [
    { label: 'Sobre Nós', href: '/sobre' },
    { label: 'Nossa Equipe', href: '/equipe' },
    { label: 'Blog / Notícias', href: '/noticias' },
    { label: 'Fale Conosco', href: '/contato' },
    { label: 'Trabalhe Conosco', href: '/carreiras' },
  ],
}

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/imobiliarialemos',
    Icon: Instagram,
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/imobiliarialemos',
    Icon: Facebook,
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/imobiliarialemos',
    Icon: Linkedin,
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@imobiliarialemos',
    Icon: Youtube,
  },
]

export function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-navy-800/60">
      {/* WhatsApp CTA Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-900 to-navy-800 border-b border-navy-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Precisa de ajuda para encontrar o imóvel ideal?
              </h3>
              <p className="text-foreground/60 text-sm mt-1 font-sans">
                Nossa equipe está pronta para atender você agora mesmo.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 whitespace-nowrap shrink-0"
              asChild
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex flex-col leading-none w-fit">
              <span className="font-display text-3xl font-bold text-gold-400 tracking-widest">LEMOS</span>
              <span className="text-[9px] font-sans font-semibold tracking-[0.3em] text-foreground/50 uppercase">
                IMOBILIÁRIA
              </span>
            </Link>
            <p className="text-sm text-foreground/60 leading-relaxed font-sans max-w-xs">
              Há mais de 20 anos realizando o sonho da casa própria na região de Franca e cidades vizinhas.
              Comprometidos com excelência, ética e resultados.
            </p>

            {/* Contact Info */}
            <div className="space-y-2.5">
              <a
                href="tel:+551637230045"
                className="flex items-center gap-2.5 text-sm text-foreground/60 hover:text-gold-400 transition-colors group"
              >
                <Phone className="h-4 w-4 text-gold-500/70 group-hover:text-gold-400 shrink-0" />
                <span className="font-sans">(16) 3723-0045</span>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-foreground/60 hover:text-gold-400 transition-colors group"
              >
                <MessageCircle className="h-4 w-4 text-emerald-500/70 group-hover:text-emerald-400 shrink-0" />
                <span className="font-sans">(16) 98101-0004</span>
              </a>
              <a
                href="mailto:contato@imobiliarialemos.com.br"
                className="flex items-center gap-2.5 text-sm text-foreground/60 hover:text-gold-400 transition-colors group"
              >
                <Mail className="h-4 w-4 text-gold-500/70 group-hover:text-gold-400 shrink-0" />
                <span className="font-sans">contato@imobiliarialemos.com.br</span>
              </a>
              <div className="flex items-start gap-2.5 text-sm text-foreground/60">
                <MapPin className="h-4 w-4 text-gold-500/70 mt-0.5 shrink-0" />
                <span className="font-sans">Rua Dr. Feijó, 123 - Centro<br />Franca - SP, 14400-690</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-navy-800 border border-navy-700 text-foreground/50 hover:text-gold-400 hover:border-gold-500/40 hover:bg-navy-700 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Imóveis Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 font-sans">
              Imóveis
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.imoveis.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-foreground/55 hover:text-gold-400 transition-colors font-sans"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cidades Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 font-sans">
              Cidades
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.cidades.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-foreground/55 hover:text-gold-400 transition-colors font-sans"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 font-sans">
              Empresa
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-foreground/55 hover:text-gold-400 transition-colors font-sans"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Separator gold />

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/40 font-sans">
            © 2024 Imobiliária Lemos. Todos os direitos reservados.
          </p>

          {/* CRECI Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5">
            <div className="w-2 h-2 rounded-full bg-gold-500" />
            <span className="text-xs text-gold-400/80 font-semibold font-sans tracking-wide">
              CRECI-SP 12345-J
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/privacidade" className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors font-sans">
              Privacidade
            </Link>
            <Link to="/termos" className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors font-sans">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
