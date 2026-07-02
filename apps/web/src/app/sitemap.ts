import type { MetadataRoute } from 'next'
import { buildSitemapEntries, sitemapChunkCount, SITEMAP_CHUNK_SIZE } from '@/lib/sitemap-entries'

/**
 * Sitemap principal — fatiado para respeitar o limite de 50.000 URLs do Google.
 *
 * O builder gera ~66k URLs (cidades × termos + rotas IBGE + dinâmicos da API),
 * o que fazia o Google REJEITAR o /sitemap.xml monolítico inteiro. Com
 * generateSitemaps() o Next passa a servir /sitemap/0.xml, /sitemap/1.xml, …
 * cada um abaixo de SITEMAP_CHUNK_SIZE. O índice-mestre (/sitemap-index.xml)
 * enumera esses arquivos para o Google.
 */

export async function generateSitemaps(): Promise<{ id: number }[]> {
  // Contagem barata (sem fetch) — precisa bater com o sitemap-index.xml.
  const count = sitemapChunkCount()
  return Array.from({ length: count }, (_, id) => ({ id }))
}

export default async function sitemap(
  { id }: { id: number },
): Promise<MetadataRoute.Sitemap> {
  const entries = await buildSitemapEntries()
  const start = id * SITEMAP_CHUNK_SIZE
  return entries.slice(start, start + SITEMAP_CHUNK_SIZE)
}
