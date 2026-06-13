'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const NAVY = '#1B2B5B'
const GOLD = '#C9A84C'

function PrimeiroAcessoInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) { setChecking(false); setValid(false); return }
    fetch(`${API_URL}/api/v1/auth/definir-senha/validar?token=${encodeURIComponent(token)}`)
      .then(r => r.ok ? r.json() : { valid: false })
      .then(d => { setValid(!!d.valid); setEmail(d.email ?? '') })
      .catch(() => setValid(false))
      .finally(() => setChecking(false))
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('A senha deve ter ao menos 8 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não conferem.'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/definir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.message ?? 'Não foi possível definir a senha. Tente novamente.')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 2200)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const card = 'w-full max-w-md rounded-2xl bg-white p-8 shadow-xl'

  return (
    <div className="flex min-h-[80dvh] items-center justify-center px-4 py-12" style={{ backgroundColor: '#f8f6f1' }}>
      {checking ? (
        <div className={card}><p className="text-center text-gray-500">Validando seu link…</p></div>
      ) : done ? (
        <div className={card}>
          <h1 className="mb-2 text-xl font-bold" style={{ color: NAVY }}>Senha criada! ✅</h1>
          <p className="text-gray-600">Tudo certo. Redirecionando para o login…</p>
        </div>
      ) : !valid ? (
        <div className={card}>
          <h1 className="mb-2 text-xl font-bold" style={{ color: NAVY }}>Link inválido ou expirado</h1>
          <p className="mb-5 text-gray-600">
            Este link de primeiro acesso não é mais válido (pode já ter sido usado ou expirado).
          </p>
          <Link href="/login" className="font-semibold underline" style={{ color: NAVY }}>
            Ir para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className={card}>
          <h1 className="mb-1 text-2xl font-bold" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
            Defina sua senha
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            {email ? <>Conta: <strong>{email}</strong></> : 'Crie a senha de acesso ao seu painel.'}
          </p>

          <label className="mb-1 block text-sm font-medium text-gray-700">Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#C9A84C]"
            style={{ fontSize: '16px' }}
            placeholder="Mínimo 8 caracteres"
          />

          <label className="mb-1 block text-sm font-medium text-gray-700">Confirmar senha</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="mb-5 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#C9A84C]"
            style={{ fontSize: '16px' }}
            placeholder="Repita a senha"
          />

          {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: GOLD }}
          >
            {submitting ? 'Salvando…' : 'Criar senha e acessar'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function PrimeiroAcessoPage() {
  return (
    <Suspense fallback={<div className="min-h-[80dvh]" />}>
      <PrimeiroAcessoInner />
    </Suspense>
  )
}
