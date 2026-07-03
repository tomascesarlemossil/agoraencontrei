import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0C2412 0%, #143A1F 50%, #0E2A15 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/brand/ae-icon-round.png"
              alt="AgoraEncontrei"
              width={88}
              height={88}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="flex justify-center">
            <Image src="/brand/ae-wordmark.png" alt="Agora Encontrei Marketplace" width={168} height={45} className="h-9 w-auto" priority />
          </div>
          <p className="text-white/50 text-sm mt-1">Marketplace Imobiliário</p>
        </div>
        {children}
      </div>
    </div>
  )
}
