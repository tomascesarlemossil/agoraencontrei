'use client'
import ErrorBoundaryFallback from '@/components/dashboard/ErrorBoundaryFallback'
export default function FiscalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryFallback error={error} reset={reset} module="Fiscal" backHref="/dashboard" />
}
