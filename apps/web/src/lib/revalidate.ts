// Triggers on-demand ISR revalidation for public pages
// Called after dashboard saves (photos, settings, properties, etc.)
const REVALIDATION_SECRET = 'agoraencontrei-revalidate-2026'

export async function revalidatePublicPages(paths: string[]): Promise<boolean> {
  try {
    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths, secret: REVALIDATION_SECRET }),
    })
    return res.ok
  } catch {
    // Silent fail — ISR will eventually update
    return false
  }
}

// Predefined page groups for common operations
export const PAGES = {
  team: ['/corretores', '/sobre', '/'],
  properties: ['/imoveis', '/'],
  blog: ['/blog', '/'],
  settings: ['/corretores', '/sobre', '/contato', '/'],
  all: ['/corretores', '/sobre', '/imoveis', '/blog', '/contato', '/'],
}
