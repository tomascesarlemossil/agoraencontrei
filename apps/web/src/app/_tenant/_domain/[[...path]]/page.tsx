/**
 * Custom Domain Resolver — Resolves tenants by custom domain
 *
 * Middleware rewrites custom-domain requests here with __host query param.
 * This page looks up the tenant by domain and renders accordingly.
 */

import { notFound, redirect } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function getTenantByDomain(domain: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/tenant/by-domain/${encodeURIComponent(domain)}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data || null
  } catch {
    return null
  }
}

export default async function DomainPage({
  searchParams,
}: {
  searchParams: Promise<{ __host?: string }>
}) {
  const { __host } = await searchParams

  if (!__host) {
    notFound()
  }

  const tenant = await getTenantByDomain(__host)

  if (!tenant) {
    notFound()
  }

  // Redirect to the subdomain tenant page which handles rendering
  redirect(`/_tenant/${tenant.subdomain}`)
}
