'use client'

import { useEffect } from 'react'

// Boundary de erro de nível raiz: captura falhas que escapam do layout.
// Renderiza o próprio <html>/<body> e usa estilos inline (sem dependências
// do layout, que pode não ter carregado).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: '#f8f6f1' }}>
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ margin: '0 auto 24px', width: 80, height: 80, borderRadius: 16, backgroundColor: '#1B2B5B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#C9A84C' }}>
              !
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              Algo deu errado
            </h1>
            <p style={{ fontSize: 14, marginBottom: 32, color: '#1B2B5B', opacity: 0.6 }}>
              Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#fff', backgroundColor: '#C9A84C', border: 'none', cursor: 'pointer' }}
              >
                Tentar Novamente
              </button>
              <a
                href="/"
                style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#fff', backgroundColor: '#1B2B5B', textDecoration: 'none' }}
              >
                Página Inicial
              </a>
            </div>
            {error.digest && (
              <p style={{ marginTop: 32, fontSize: 12, color: '#1B2B5B', opacity: 0.3 }}>
                Código: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
