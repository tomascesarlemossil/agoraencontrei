'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function VerificarEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de verificação não encontrado.')
      return
    }

    async function verify() {
      try {
        const res = await fetch('/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setMessage(data.message || 'Erro ao verificar e-mail.')
          return
        }

        setStatus('success')
        setMessage('E-mail verificado com sucesso!')

        // Auto-login after verification
        if (data.accessToken && data.user) {
          setAuth(data.user, data.accessToken, data.expiresIn, data.refreshToken)
          // Redirect to plans page after 2 seconds
          setTimeout(() => router.push('/parceiros/planos'), 2000)
        }
      } catch {
        setStatus('error')
        setMessage('Erro de conexão. Tente novamente.')
      }
    }

    verify()
  }, [token, setAuth, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#1B2B5B' }} />
            <h1 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B' }}>Verificando seu e-mail...</h1>
            <p className="text-gray-500">Aguarde um momento.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B' }}>E-mail verificado!</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <p className="text-sm text-gray-400 mb-4">Redirecionando para a escolha do plano...</p>
            <Link href="/parceiros/planos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#1B2B5B' }}>
              Escolher meu plano
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B' }}>Erro na verificação</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <div className="space-y-3">
              <Link href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white w-full justify-center"
                style={{ background: '#1B2B5B' }}>
                Ir para Login
              </Link>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border w-full justify-center text-gray-700">
                Criar nova conta
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#1B2B5B' }} />
      </div>
    }>
      <VerificarEmailContent />
    </Suspense>
  )
}
