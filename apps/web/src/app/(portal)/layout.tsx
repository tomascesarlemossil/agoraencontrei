import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: {
    template: '%s | Portal do Cliente — Imobiliária Lemos',
    default: 'Portal do Cliente — Imobiliária Lemos',
  },
  description: 'Portal exclusivo para clientes da Imobiliária Lemos. Acesse seus contratos, boletos e documentos.',
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1B2B5B' }} className="py-4 px-6 flex items-center gap-4 shadow-md">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#C9A84C' }}
          >
            IL
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              IMOBILIÁRIA LEMOS
            </p>
            <p className="text-xs font-medium" style={{ color: '#C9A84C' }}>
              Portal do Cliente
            </p>
          </div>
        </Link>
        <div className="ml-auto hidden sm:flex items-center gap-2 text-white/60 text-xs">
          <Phone className="h-3 w-3" />
          <span>(16) 3723-0045</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1B2B5B' }} className="py-6 px-6 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-3">
            <div
              className="h-7 w-7 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
              style={{ backgroundColor: '#C9A84C' }}
            >
              IL
            </div>
            <div>
              <p className="text-white font-semibold text-xs" style={{ fontFamily: 'Georgia, serif' }}>Imobiliária Lemos</p>
              <p className="text-white/40 text-[10px]">AgoraEncontrei · 2026 por Tomás · Imobiliária Lemos por Noêmia, 2002 · CRECI 279051</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center">
            <a href="tel:1637230045" className="hover:text-white transition-colors">(16) 3723-0045</a>
            <span className="hidden sm:block">·</span>
            <a href="tel:16981010004" className="hover:text-white transition-colors">(16) 98101-0004</a>
            <span className="hidden sm:block">·</span>
            <span>Franca — SP</span>
          </div>
          <p className="text-white/30 text-[10px]">
            © {new Date().getFullYear()} Imobiliária Lemos
          </p>
        </div>
      </footer>
    </div>
  )
}
