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
          {/* Logo AgoraEncontrei completo (emblema + wordmark), PNG transparente
              sem fundo branco — dimensionado para ficar legível no mobile e no
              desktop sobre o fundo verde escuro. */}
          <div className="flex justify-center">
            <Image
              src="/brand/ae-logo-full-light.png"
              alt="AgoraEncontrei — Marketplace Imobiliário"
              width={760}
              height={275}
              className="w-auto h-auto max-w-[260px] sm:max-w-[320px] object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
