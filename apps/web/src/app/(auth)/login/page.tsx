'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '509328961791-4er50evaata1uota1stgpa2skqh7o9d7.apps.googleusercontent.com'

type Branding = { name: string; logoUrl: string | null; primaryColor: string | null }

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (element: HTMLElement, config: object) => void
          prompt: () => void
        }
      }
    }
    handleGoogleCredential?: (response: { credential: string }) => void
  }
}

export default function LoginPage() {
  const { login, googleLogin } = useAuth()

  // Login em 2 etapas (white-label): 'identify' → informa e-mail/telefone/CPF;
  // 'password' → tela de senha com a marca da empresa do parceiro.
  const [step, setStep] = useState<'identify' | 'password'>('identify')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [branding, setBranding] = useState<Branding | null>(null)

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSuccess = useCallback(async (credential: string) => {
    setGoogleLoading(true)
    setError('')
    try {
      await googleLogin(credential)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === 'NETWORK_ERROR' ? 'Servidor indisponível no momento. Tente novamente em alguns instantes.' :
          err.code === 'TIMEOUT' ? 'O servidor demorou demais para responder. Tente novamente.' :
          err.status === 403 ? 'Conta inativa. Contate o suporte.' :
          err.status >= 500 ? 'Erro interno do servidor. A equipe foi notificada.' :
          'Erro ao entrar com Google. Tente novamente.',
        )
      } else {
        setError('Erro inesperado. Recarregue a página e tente novamente.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }, [googleLogin])

  useEffect(() => {
    window.handleGoogleCredential = (response: { credential: string }) => {
      handleGoogleSuccess(response.credential)
    }
    return () => { delete window.handleGoogleCredential }
  }, [handleGoogleSuccess])

  function initGoogle() {
    if (!window.google) return
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => handleGoogleSuccess(response.credential),
      auto_select: false,
      cancel_on_tap_outside: true,
    })
    const btn = document.getElementById('google-signin-btn')
    if (btn) {
      window.google.accounts.id.renderButton(btn, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      })
    }
  }

  // Etapa 1 → resolve a marca da empresa e avança para a senha.
  async function onIdentify(e: React.FormEvent) {
    e.preventDefault()
    const id = identifier.trim()
    if (id.length < 3) {
      setError('Informe seu e-mail, telefone ou CPF')
      return
    }
    setError('')
    setResolving(true)
    try {
      const { company } = await authApi.resolveCompany(id)
      setBranding(company) // pode ser null → usa marca padrão AgoraEncontrei
      setStep('password')
    } catch {
      // Mesmo se a resolução falhar, deixamos seguir para a senha (a validação
      // real acontece no login) — sem marca da empresa.
      setBranding(null)
      setStep('password')
    } finally {
      setResolving(false)
    }
  }

  // Etapa 2 → autentica com identifier + senha.
  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await login(identifier.trim(), password)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === 'NETWORK_ERROR' ? 'Servidor indisponível no momento. Tente novamente em alguns instantes.' :
          err.code === 'TIMEOUT' ? 'O servidor demorou demais para responder. Verifique sua internet ou tente novamente.' :
          err.code === 'PENDING_VERIFICATION' ? 'Verifique seu e-mail antes de fazer login. Cheque sua caixa de entrada e spam.' :
          err.status === 401 ? 'Credenciais incorretas' :
          err.status === 403 ? 'Conta inativa ou suspensa. Contate o administrador.' :
          err.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' :
          err.status >= 500 ? 'Erro interno do servidor. A equipe foi notificada — tente novamente em instantes.' :
          'Erro ao fazer login. Tente novamente.',
        )
      } else {
        setError('Erro inesperado. Recarregue a página e tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const accent = branding?.primaryColor || undefined

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogle}
      />
      <Card>
        {step === 'identify' ? (
          <>
            <CardHeader>
              <CardTitle>Entrar</CardTitle>
              <CardDescription>Acesse com seu e-mail, telefone ou CPF</CardDescription>
            </CardHeader>
            <form onSubmit={onIdentify}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}

                {/* Google Sign-In */}
                <div className="space-y-2">
                  {googleLoading ? (
                    <div className="flex items-center justify-center h-10">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div id="google-signin-btn" className="w-full" />
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identifier">E-mail, telefone ou CPF</Label>
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="seu@email.com, (16) 99999-9999 ou CPF"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoFocus
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={resolving || googleLoading}>
                  {resolving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continuar
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Não tem conta?{' '}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    Criar conta
                  </Link>
                </p>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader>
              {/* Marca da empresa do parceiro (white-label) */}
              <div className="flex flex-col items-center gap-3 pb-1">
                {branding?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={branding.logoUrl}
                    alt={branding.name}
                    className="h-14 max-w-[200px] object-contain"
                  />
                ) : branding?.name ? (
                  <div
                    className="text-xl font-bold text-center"
                    style={accent ? { color: accent } : undefined}
                  >
                    {branding.name}
                  </div>
                ) : null}
              </div>
              <CardTitle className="text-center">
                {branding?.name ? `Entrar — ${branding.name}` : 'Entrar'}
              </CardTitle>
              <CardDescription className="text-center break-all">{identifier.trim()}</CardDescription>
            </CardHeader>
            <form onSubmit={onLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                  style={accent ? { backgroundColor: accent } : undefined}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
                <div className="flex items-center justify-between w-full text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep('identify'); setPassword(''); setError('') }}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Trocar
                  </button>
                  <Link href="/esqueci-senha" className="text-primary hover:underline font-medium">
                    Esqueci minha senha
                  </Link>
                </div>
              </CardFooter>
            </form>
          </>
        )}
      </Card>

      {/* Marca AgoraEncontrei — sempre visível (mesmo em contas white-label) */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Plataforma por{' '}
        <a
          href="https://www.agoraencontrei.com.br"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          AgoraEncontrei
        </a>
      </p>
    </>
  )
}
