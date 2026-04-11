'use client'
import ErrorBoundaryFallback from '@/components/dashboard/ErrorBoundaryFallback'
export default function MarketingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorBoundaryFallback error={error} reset={reset} module="Marketing" backHref="/dashboard" />
}
