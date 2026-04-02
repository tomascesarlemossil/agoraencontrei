'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, KeyRound, AlertCircle, Phone } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export default function PortalLoginPage() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configuring, setConfiguring] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cpf || !birthDate) return

    setLoading(true)
    setError(null)
    setConfiguring(false)

    const rawCpf = cpf.replace(/\D/g, '')

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/portal-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: rawCpf, birthDate }),
      })

      if (res.status === 404) {
        setConfiguring(true)
        setLoading(false)
        return
      }

      if (res.status === 401 || res.status === 400) {
        setError('CPF ou data de nascimento incorretos.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // If the endpoint doesn't exist (API hasn't implemented it yet)
        if (res.status === 405 || res.status === 501) {
          setConfiguring(true)
          setLoading(false)
          return
        }
        setError(data.message || 'Erro ao fazer login. Tente novamente.')
        setLoading(false)
        return
      }

      const data = await res.json()

      // Store token in localStorage
      if (data.accessToken) {
        localStorage.setItem('portal_auth', JSON.stringify({
          token: data.accessToken,
          user: data.user,
          expiresAt: Date.now() + (data.expiresIn ?? 3600) * 1000,
        }))
      }

      router.push('/portal/dashboard')
    } catch (err: any) {
      // Network error or endpoint doesn't exist
      if (err.message?.includes('fetch') || err.message?.includes('Failed')) {
        setConfiguring(true)
      } else {
        setError('Erro ao conectar. Tente novamente.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden" style={{ border: '1px solid #ddd9d0' }}>
          {/* Top banner */}
          <div className="px-8 pt-8 pb-6 text-center" style={{ backgroundColor: '#1B2B5B' }}>
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
              style={{ backgroundColor: '#C9A84C' }}
            >
              IL
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Portal do Cliente
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Imobiliária Lemos — Área Exclusiva
            </p>
          </div>

          <div className="px-8 py-8">
            {configuring ? (
              /* Portal in configuration state */
              <div className="text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                  <AlertCircle className="h-7 w-7 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Portal em configuração</h2>
                  <p className="text-sm text-gray-500">
                    Nosso portal está em fase de implantação. Entre em contato para mais informações.
                  </p>
                </div>
                <a
                  href="tel:1637230045"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                >
                  <Phone className="h-4 w-4" />
                  (16) 3723-0045
                </a>
                <p className="text-xs text-gray-400 pt-1">
                  Também disponível pelo WhatsApp: (16) 98101-0004
                </p>
                <button
                  onClick={() => setConfiguring(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              /* Login form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    CPF
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    required
                    maxLength={14}
                    className="w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: '#ddd9d0' }}
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = '#ddd9d0')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    required
                    className="w-full rounded-xl border px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all"
                    style={{ borderColor: '#ddd9d0' }}
                    onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.target.style.borderColor = '#ddd9d0')}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !cpf || !birthDate}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #C9A84C, #e8c66a)', color: '#1B2B5B' }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Entrar no Portal
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Acesso exclusivo para clientes cadastrados.{' '}
                  <a href="tel:1637230045" className="underline hover:text-gray-600" style={{ color: '#C9A84C' }}>
                    Precisa de ajuda?
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Back to site */}
        <p className="text-center mt-6 text-sm text-gray-500">
          <a href="/" className="hover:underline" style={{ color: '#1B2B5B' }}>
            ← Voltar ao site
          </a>
        </p>
      </div>
    </div>
  )
}
