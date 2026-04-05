import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1B2B5B 50%, #152347 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo-lemos.png"
              alt="Imobiliária Lemos"
              width={80}
              height={80}
              className="rounded-full object-cover shadow-2xl"
              style={{ boxShadow: '0 0 0 3px #C9A84C, 0 8px 32px rgba(201,168,76,0.3)' }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
            IMOBILIÁRIA <span style={{ color: '#C9A84C' }}>LEMOS</span>
          </h1>
          <p className="text-white/50 text-sm mt-1">Sistema de Gestão Imobiliária</p>
        </div>
        {children}
      </div>
    </div>
  )
}
