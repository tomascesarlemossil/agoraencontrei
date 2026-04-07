'use client'

import { useEffect } from 'react'

/**
 * Injects a JSON-LD <script> into <head> from a Client Component.
 * This avoids React 18's automatic <script> hoisting in Server Components
 * which causes SSR hydration mismatches.
 */
export function JsonLdScript({ data }: { data: object }) {
  useEffect(() => {
    const id = 'jsonld-property'
    // Remove any existing script with same id
    document.getElementById(id)?.remove()
    const script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
    return () => { document.getElementById(id)?.remove() }
  }, [data])
  return null
}
