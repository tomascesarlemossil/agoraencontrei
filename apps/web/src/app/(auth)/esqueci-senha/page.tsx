'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export default function EsqueciSenhaPage() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      await fetch(`${API_URL}/api/v1/auth/esqueci-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      })
    } catch {
      // Nunca revelamos nada — mesmo em erro de rede mostramos sucesso genérico.
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu e-mail, CPF/CNPJ ou telefone. Enviaremos um link para você definir uma nova senha.
        </CardDescription>
      </CardHeader>

      {sent ? (
        <>
          <CardContent>
            <div className="rounded-md bg-primary/10 p-4 text-sm text-foreground">
              Se houver uma conta com esses dados, enviamos o link de redefinição por e-mail e WhatsApp.
              Verifique sua caixa de entrada (e o spam).
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="text-sm text-primary hover:underline font-medium w-full text-center">
              Voltar para o login
            </Link>
          </CardFooter>
        </>
      ) : (
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">E-mail, CPF/CNPJ ou telefone</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="seu@email.com"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ fontSize: 16 }}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !identifier.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar link de redefinição
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Lembrou a senha?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
