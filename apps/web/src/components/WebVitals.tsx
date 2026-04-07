'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}ms`)
    }

    // Send to analytics (GA4 via dataLayer)
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      ;(window as any).dataLayer?.push({
        event: 'web_vitals',
        metric_name: metric.name,
        metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
      })
    }
  })

  return null
}
