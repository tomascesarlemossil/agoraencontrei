/**
 * Blog Sitemap — Dynamic
 * Lists all published blog posts, categories, and clusters
 *
 * GET /api/sitemap/blog
 */
import { NextResponse } from 'next/server'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''

export async function GET() {
  try {
    // Fetch all published posts
    const postsRes = await fetch(
      `${API_URL}/api/v1/blog?limit=500&${COMPANY_ID ? `companyId=${COMPANY_ID}` : ''}`,
      { next: { revalidate: 3600 } }
    )
    const postsData = postsRes.ok ? await postsRes.json() : { data: [] }
    const posts = postsData.data ?? []

    // Fetch categories
    const catsRes = await fetch(
      `${API_URL}/api/v1/blog/categories?${COMPANY_ID ? `companyId=${COMPANY_ID}` : ''}`,
      { next: { revalidate: 3600 } }
    )
    const catsData = catsRes.ok ? await catsRes.json() : { data: [] }
    const categories = catsData.data ?? []

    // Fetch clusters
    const clustersRes = await fetch(
      `${API_URL}/api/v1/blog/clusters?${COMPANY_ID ? `companyId=${COMPANY_ID}` : ''}`,
      { next: { revalidate: 3600 } }
    )
    const clustersData = clustersRes.ok ? await clustersRes.json() : { data: [] }
    const clusters = clustersData.data ?? []

    const urls: string[] = []

    // Blog index
    urls.push(`
  <url>
    <loc>${WEB_URL}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`)

    // Category pages
    for (const cat of categories) {
      urls.push(`
  <url>
    <loc>${WEB_URL}/blog/categoria/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
    }

    // Cluster pages
    for (const cl of clusters) {
      urls.push(`
  <url>
    <loc>${WEB_URL}/blog/cluster/${cl.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
    }

    // Individual posts
    for (const post of posts) {
      const lastmod = post.publishedAt
        ? new Date(post.publishedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      urls.push(`
  <url>
    <loc>${WEB_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${post.featured ? '0.9' : '0.7'}</priority>
  </url>`)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (err) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { 'Content-Type': 'application/xml' } }
    )
  }
}
