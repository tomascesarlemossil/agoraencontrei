'use client'
import ErrorBoundaryFallback from '@/components/dashboard/ErrorBoundaryFallback'
export default function DocumentosError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryFallback error={error} reset={reset} module="Documentos" backHref="/dashboard" />
}
