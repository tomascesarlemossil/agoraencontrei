import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-react'
import { Navbar } from '@/components/public/Navbar'
import { FloatingChatbot } from '@/components/chat/FloatingChatbot'
import { CompareBar } from '@/components/CompareBar'
import { SystemThemeInjector } from '@/components/public/SystemThemeInjector'

export const metadata: Metadata = {
  title: {
    template: '%s | Imobiliária Lemos',
    default: 'Imobiliária Lemos — Franca/SP',
  },
  description: 'Encontre o imóvel dos seus sonhos em Franca e região. Compra, venda e locação. CRECI 279051.',
  metadataBase: new URL('https://www.agoraencontrei.com.br'),
  keywords: 'imóveis franca, casas franca, apartamentos franca, terrenos franca, imobiliária franca, comprar imóvel franca, alugar imóvel franca, financiamento imobiliário, leilão imóvel, CRECI 279051, imobiliária lemos, aluguel franca sp, investimento imóvel franca',
  authors: [{ name: 'Imobiliária Lemos', url: 'https://www.agoraencontrei.com.br' }],
  creator: 'Imobiliária Lemos',
  publisher: 'Imobiliária Lemos',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

const FOOTER_IMOVEIS = [
  { href: '/imoveis?purpose=SALE', label: 'Comprar' },
  { href: '/imoveis?purpose=RENT', label: 'Alugar' },
  { href: '/imoveis?type=APARTMENT', label: 'Apartamentos' },
  { href: '/imoveis?type=HOUSE', label: 'Casas' },
  { href: '/imoveis?type=LAND', label: 'Terrenos' },
  { href: '/imoveis?category=COMMERCIAL', label: 'Comercial' },
]

const FOOTER_SERVICOS = [
  { href: '/servicos', label: 'Nossos Serviços' },
  { href: '/avaliacao', label: 'Avaliação Gratuita' },
  { href: '/corretores', label: 'Nossa Equipe' },
  { href: '/servicos/2via-boleto', label: '2ª Via de Boleto' },
  { href: '/servicos/extrato-proprietario', label: 'Extrato do Proprietário' },
  { href: '/servicos/fichas-cadastrais', label: 'Fichas Cadastrais' },
  { href: '/financiamentos', label: 'Financiamentos' },
  { href: '/anunciar', label: 'Cadastre seu Imóvel' },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--site-background-color, #f8f6f1)' }}>
      <SystemThemeInjector />
      {/* Top info bar */}
      <div style={{ backgroundColor: 'var(--site-primary-color, #1B2B5B)' }} className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-6">
            <a href="tel:1637230045" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3" /> (16) 3723-0045
            </a>
            <a href="tel:16981010004" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3" /> (16) 98101-0004
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Franca — SP
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50">CRECI 279051</span>
            <a href="https://www.instagram.com/imobiliarialemos" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors" aria-label="Instagram da Imobiliária Lemos (@imobiliarialemos)">
              <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com/tomaslemosbr" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors" aria-label="Instagram de Tomás Lemos (@tomaslemosbr)">
              <Instagram className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a href="https://facebook.com/imobiliarialemos" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Facebook da Imobiliária Lemos">
              <Facebook className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a href="https://www.youtube.com/@imobiliarialemos" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" aria-label="Canal YouTube da Imobiliária Lemos">
              <Youtube className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <Navbar />

      <main>{children}</main>
      <CompareBar />
      <FloatingChatbot />

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--site-primary-color, #1B2B5B)' }} className="mt-20 pt-14 pb-8" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: 'var(--site-accent-color, #C9A84C)' }}
                >
                  IL
                </div>
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: 'Georgia, serif' }}>IMOBILIÁRIA</p>
                  <p className="font-bold text-sm" style={{ color: 'var(--site-accent-color, #C9A84C)', fontFamily: 'Georgia, serif' }}>LEMOS</p>
                </div>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                Desde 2002 conectando pessoas aos melhores imóveis de Franca e região.
              </p>
              <p className="text-white/40 text-xs mt-2">CRECI PF: 279051</p>

              {/* Social media */}
              <div className="mt-5">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Redes Sociais</p>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://www.instagram.com/imobiliarialemos"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                    aria-label="Instagram da Imobiliária Lemos (@imobiliarialemos)"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Instagram className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/50 text-xs group-hover:text-white transition-colors">@imobiliarialemos</span>
                  </a>
                  <a
                    href="https://www.instagram.com/tomaslemosbr"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                    aria-label="Instagram de Tomás Lemos (@tomaslemosbr)"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Instagram className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/50 text-xs group-hover:text-white transition-colors">@tomaslemosbr</span>
                  </a>
                  <a
                    href="https://www.youtube.com/@imobiliarialemos"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                    aria-label="Canal YouTube da Imobiliária Lemos"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Youtube className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/50 text-xs group-hover:text-white transition-colors">Imobiliária Lemos</span>
                  </a>
                  <a
                    href="https://facebook.com/imobiliarialemos"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 group"
                    aria-label="Facebook da Imobiliária Lemos"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60 group-hover:text-white transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <Facebook className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white/50 text-xs group-hover:text-white transition-colors">imobiliarialemos</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Imóveis */}
            <div>
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: 'var(--site-accent-color, #C9A84C)' }}>Imóveis</p>
              <ul className="space-y-2.5">
                {FOOTER_IMOVEIS.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/50 text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Serviços */}
            <div>
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: 'var(--site-accent-color, #C9A84C)' }}>Serviços</p>
              <ul className="space-y-2.5">
                {FOOTER_SERVICOS.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/50 text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
              {/* Área de Acesso */}
              <p className="text-sm font-semibold mt-6 mb-3 tracking-wide uppercase" style={{ color: 'var(--site-accent-color, #C9A84C)' }}>Área de Acesso</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/dashboard" className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors group">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'var(--site-accent-color, #C9A84C)' }} />
                    Painel Administrativo
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#4a90d9' }} />
                    Área do Corretor
                  </Link>
                </li>
                <li>
                  <Link href="/portal/login" className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#5cb85c' }} />
                    Portal do Cliente
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: 'var(--site-accent-color, #C9A84C)' }}>Contato</p>
              <ul className="space-y-3 text-sm">
                <li>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Fixo</p>
                  <a href="tel:1637230045" className="text-white/70 hover:text-white transition-colors">(16) 3723-0045</a>
                </li>
                <li>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Vendas / Locação</p>
                  <a href="tel:16981010004" className="text-white/70 hover:text-white transition-colors">(16) 98101-0004</a>
                </li>
                <li>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">WhatsApp</p>
                  <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer"
                    className="hover:opacity-80 transition-opacity" style={{ color: 'var(--site-accent-color, #C9A84C)' }}>
                    (16) 98101-0004
                  </a>
                </li>
                <li className="pt-1">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-0.5">Endereço</p>
                  <p className="text-white/60 text-sm">Franca — SP</p>
                  <a
                    href="https://www.imobiliarialemos.com.br"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs mt-1 inline-block hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--site-accent-color, #C9A84C)' }}
                  >
                    www.imobiliarialemos.com.br
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Powered by */}
          <div className="border-t border-white/10 pt-6 pb-4 text-center">
            <p className="text-white/40 text-[11px] leading-relaxed max-w-xl mx-auto">
              <span style={{ color: 'var(--site-accent-color, #C9A84C)' }}>AgoraEncontrei</span> é o marketplace imobiliário criado e desenvolvido pela{' '}
              <a
                href="https://www.imobiliarialemos.com.br"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white/60 transition-colors underline decoration-white/20 underline-offset-2"
                style={{ color: 'var(--site-accent-color, #C9A84C)' }}
              >
                Imobiliária Lemos
              </a>
              {' '}&mdash; referência em Franca/SP desde 2002
            </p>
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-white/50 text-xs">
              © {new Date().getFullYear()} Imobiliária Lemos. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <a href="/politica-privacidade" className="hover:text-white/70 transition-colors">Política de Privacidade</a>
              <a href="/termos-uso" className="hover:text-white/70 transition-colors">Termos de Uso</a>
              <a href="/favoritos" className="hover:text-white/70 transition-colors">Favoritos</a>
            </div>
            <p className="text-white/50 text-xs">Fundada em 2002 · CRECI 279051</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
