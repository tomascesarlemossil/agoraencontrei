import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, MapPin, Instagram, Facebook, Youtube } from 'lucide-react'
import { Navbar } from '@/components/public/Navbar'
import { FloatingChatbot } from '@/components/chat/FloatingChatbot'

export const metadata: Metadata = {
  title: {
    template: '%s | Imobiliária Lemos',
    default: 'Imobiliária Lemos — Franca/SP',
  },
  description: 'Encontre o imóvel dos seus sonhos em Franca e região. Compra, venda e locação. CRECI 279051.',
  metadataBase: new URL('https://www.agoraencontrei.com.br'),
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
  { href: '/avaliacao', label: 'Avaliação Gratuita' },
  { href: '/imoveis', label: 'Portal de Imóveis' },
  { href: 'https://agilizaunion.com.br/app/?empresa=145&token=a2e5b1e525c432edb01ba207ff4b02d7', label: 'Anunciar Imóvel' },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f6f1' }}>
      {/* Top info bar */}
      <div style={{ backgroundColor: '#1B2B5B' }} className="hidden lg:block">
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
            <a href="https://instagram.com/imobiliarialemos" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="https://facebook.com/imobiliarialemos" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <Facebook className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <Navbar />

      <main>{children}</main>
      <FloatingChatbot />

      {/* Footer */}
      <footer style={{ backgroundColor: '#1B2B5B' }} className="mt-20 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  IL
                </div>
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: 'Georgia, serif' }}>IMOBILIÁRIA</p>
                  <p className="font-bold text-sm" style={{ color: '#C9A84C', fontFamily: 'Georgia, serif' }}>LEMOS</p>
                </div>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                Desde 2002 conectando pessoas aos melhores imóveis de Franca e região.
              </p>
              <p className="text-white/40 text-xs mt-2">CRECI PF: 279051</p>
              <div className="flex items-center gap-3 mt-4">
                {[
                  { href: 'https://instagram.com/imobiliarialemos', icon: <Instagram className="w-4 h-4" /> },
                  { href: 'https://facebook.com/imobiliarialemos', icon: <Facebook className="w-4 h-4" /> },
                  { href: 'https://youtube.com/@imobiliarialemos', icon: <Youtube className="w-4 h-4" /> },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noreferrer"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Imóveis */}
            <div>
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: '#C9A84C' }}>Imóveis</p>
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
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: '#C9A84C' }}>Serviços</p>
              <ul className="space-y-2.5">
                {FOOTER_SERVICOS.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-white/50 text-sm hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
              {/* Área de Acesso */}
              <p className="text-sm font-semibold mt-6 mb-3 tracking-wide uppercase" style={{ color: '#C9A84C' }}>Área de Acesso</p>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/dashboard" className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors group">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#C9A84C' }} />
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
                  <Link href="/login" className="flex items-center gap-2 text-white/50 text-sm hover:text-white transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#5cb85c' }} />
                    Área do Cliente
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <p className="text-sm font-semibold mb-4 tracking-wide uppercase" style={{ color: '#C9A84C' }}>Contato</p>
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
                    className="hover:opacity-80 transition-opacity" style={{ color: '#C9A84C' }}>
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
                    style={{ color: '#C9A84C' }}
                  >
                    www.imobiliarialemos.com.br
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-white/50 text-xs">
              © {new Date().getFullYear()} Imobiliária Lemos. Todos os direitos reservados.
            </p>
            <p className="text-white/50 text-xs">Fundada em 2002 · CRECI 279051</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
