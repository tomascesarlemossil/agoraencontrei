'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

function DefinirSenhaInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Valida o token ao montar.
  useEffect(() => {
    let alive = true
    async function validate() {
      if (!token) {
        if (alive) { setValid(false); setChecking(false) }
        return
      }
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/definir-senha/validar?token=${encodeURIComponent(token)}`)
        const data = await res.json().catch(() => ({ valid: false }))
        if (alive) {
          setValid(!!data.valid)
          setEmail(data.email ?? null)
        }
      } catch {
        if (alive) setValid(false)
      } finally {
        if (alive) setChecking(false)
      }
    }
    validate()
    return () => { alive = false }
  }, [token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/definir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        setError(data.message || 'Não foi possível definir a senha. O link pode ter expirado.')
        setSubmitting(false)
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('Erro de conexão. Tente novamente em instantes.')
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!valid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link inválido</CardTitle>
          <CardDescription>Este link de redefinição é inválido ou expirou.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Solicite um novo link de redefinição de senha.
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/esqueci-senha" className="text-sm text-primary hover:underline font-medium w-full text-center">
            Solicitar novo link
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (done) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Senha definida!</CardTitle>
          <CardDescription>Sua senha foi atualizada com sucesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-primary/10 p-3 text-sm text-foreground">
            Redirecionando para o login...
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="text-sm text-primary hover:underline font-medium w-full text-center">
            Ir para o login agora
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Definir nova senha</CardTitle>
        <CardDescription>
          {email ? `Conta: ${email}` : 'Crie uma nova senha para acessar sua conta.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ fontSize: 16 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              name="confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita a senha"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ fontSize: 16 }}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Definir senha
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Voltar para o login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function DefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }
    >
      <DefinirSenhaInner />
    </Suspense>
  )
}
