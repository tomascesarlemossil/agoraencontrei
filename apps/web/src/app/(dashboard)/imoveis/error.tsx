'use client'
import ErrorBoundaryFallback from '@/components/dashboard/ErrorBoundaryFallback'
export default function ImoveisError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryFallback error={error} reset={reset} module="Imóveis" backHref="/dashboard" />
}
