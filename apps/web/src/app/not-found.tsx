import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, Search, MessageCircle, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Página não encontrada | AgoraEncontrei — Imobiliária Lemos',
  description: 'A página que você procura não foi encontrada. Volte para a página inicial ou explore nossos 1.000+ imóveis em Franca e região.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#f8f6f1' }}
    >
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div
          className="mx-auto mb-6 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: '#1B2B5B' }}
        >
          <MapPin className="w-10 h-10" style={{ color: '#C9A84C' }} />
        </div>

        {/* 404 number */}
        <p
          className="text-7xl font-bold mb-2"
          style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
        >
          404
        </p>

        {/* Message */}
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
        >
          Página não encontrada
        </h1>
        <p className="text-sm mb-8" style={{ color: '#1B2B5B', opacity: 0.6 }}>
          A página que você procura não existe ou foi movida.
          Que tal explorar nossos imóveis?
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1B2B5B' }}
          >
            <Home className="w-4 h-4" />
            Página Inicial
          </Link>
          <Link
            href="/imoveis"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9A84C' }}
          >
            <Search className="w-4 h-4" />
            Ver Imóveis
          </Link>
        </div>

        {/* WhatsApp CTA */}
        <a
          href="https://wa.me/5516981010004?text=Olá! Preciso de ajuda para encontrar uma página no site."
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: '#C9A84C' }}
        >
          <MessageCircle className="w-4 h-4" />
          Fale conosco pelo WhatsApp
        </a>
      </div>
    </div>
  )
}
