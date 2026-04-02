'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Script from 'next/script'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '509328961791-4er50evaata1uota1stgpa2skqh7o9d7.apps.googleusercontent.com'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

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
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const handleGoogleSuccess = useCallback(async (credential: string) => {
    setGoogleLoading(true)
    setError('')
    try {
      await googleLogin(credential)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 403 ? 'Conta inativa. Contate o suporte.' :
          'Erro ao entrar com Google. Tente novamente.',
        )
      } else {
        setError('Erro de conexão. Verifique sua internet.')
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

  async function onSubmit(data: FormData) {
    setError('')
    try {
      await login(data.email, data.password)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401 ? 'E-mail ou senha incorretos' :
          err.status === 403 ? 'Conta inativa. Contate o suporte.' :
          'Erro ao fazer login. Tente novamente.',
        )
      } else {
        setError('Erro de conexão. Verifique sua internet.')
      }
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogle}
      />
      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta para gerenciar seus imóveis</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
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
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Não tem conta?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}
