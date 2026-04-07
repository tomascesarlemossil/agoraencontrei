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
              src="/logo-ae-v2.png"
              alt="AgoraEncontrei"
              width={88}
              height={88}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold">
            <span style={{ color: '#1a5c2a', fontWeight: 800 }}>Agora</span><span style={{ color: '#d1d5db', fontWeight: 800 }}>Encontrei</span>
          </h1>
          <p className="text-white/50 text-sm mt-1">Marketplace Imobiliário</p>
        </div>
        {children}
      </div>
    </div>
  )
}
