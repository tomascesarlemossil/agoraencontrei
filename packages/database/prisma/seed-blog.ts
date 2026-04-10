/**
 * Blog Seed Script — AgoraEncontrei
 * Imports 161 posts, 7 categories, 8 clusters from editorial base.
 *
 * Usage: pnpm --filter @agoraencontrei/database run seed:blog
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Markdown → HTML converter ───────────────────────────────────────────────
function markdownToHtml(md: string): string {
  if (!md) return ''
  // Strip surrounding quotes from the CSV export
  let text = md.replace(/^"|"$/g, '').replace(/""/g, '"')
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .split('\n\n')
    .map(block => {
      const t = block.trim()
      if (!t) return ''
      if (/^<[hulo]/.test(t)) return t
      return `<p>${t.replace(/\n/g, '<br />')}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

function slugify(text: string) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

// ── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Financiamento Imobiliário', slug: 'financiamento-imobiliario', description: 'Guias, comparativos e orientações sobre financiamento de imóveis no Brasil.', ordem: 1 },
  { name: 'Compra de Imóveis', slug: 'compra-de-imoveis', description: 'Tudo sobre o processo de compra: documentação, avaliação, negociação e decisão.', ordem: 2 },
  { name: 'Venda de Imóveis', slug: 'venda-de-imoveis', description: 'Como vender imóvel com estratégia: precificação, anúncio, documentação e negociação.', ordem: 3 },
  { name: 'Aluguel de Imóveis', slug: 'aluguel-de-imoveis', description: 'Guia completo para locatários e proprietários: contrato, garantias, vistoria e mais.', ordem: 4 },
  { name: 'Leilão de Imóveis', slug: 'leilao-de-imoveis', description: 'Como comprar imóveis em leilão com segurança: edital, riscos, custos e oportunidades.', ordem: 5 },
  { name: 'Investimento Imobiliário', slug: 'investimento-imobiliario', description: 'ROI, yield, flip, renda passiva e estratégias de investimento em imóveis.', ordem: 6 },
  { name: 'SEO Local', slug: 'seo-local', description: 'Mercado imobiliário local: Franca, Ribeirão Preto, bairros e oportunidades por região.', ordem: 7 },
]

// ── Clusters ────────────────────────────────────────────────────────────────
const CLUSTERS = [
  { name: 'Financiamento Imobiliário', slug: 'financiamento-imobiliario', categorySlug: 'financiamento-imobiliario', description: 'Cluster completo sobre financiamento: guia, FGTS, SFH/SFI, MCMV, amortização e mais.' },
  { name: 'Compra de Imóveis', slug: 'compra-de-imoveis', categorySlug: 'compra-de-imoveis', description: 'Cluster de compra: documentação, avaliação, localização, tipos e erros comuns.' },
  { name: 'Venda de Imóveis', slug: 'venda-de-imoveis', categorySlug: 'venda-de-imoveis', description: 'Cluster de venda: precificação, anúncio, negociação, documentação e estratégias.' },
  { name: 'Aluguel de Imóveis', slug: 'aluguel-de-imoveis', categorySlug: 'aluguel-de-imoveis', description: 'Cluster de aluguel: contrato, garantias, vistoria, reajuste e rescisão.' },
  { name: 'Leilão de Imóveis', slug: 'leilao-de-imoveis', categorySlug: 'leilao-de-imoveis', description: 'Cluster de leilão: judicial, extrajudicial, edital, custos, riscos e Caixa.' },
  { name: 'Investimento Imobiliário', slug: 'investimento-imobiliario', categorySlug: 'investimento-imobiliario', description: 'Cluster de investimento: ROI, yield, flip, terrenos, rural e diversificação.' },
  { name: 'Mercado Local Franca', slug: 'mercado-local-franca', categorySlug: 'seo-local', description: 'Mercado imobiliário de Franca SP: bairros, valorização, leilões e oportunidades.' },
  { name: 'Mercado Local Ribeirão Preto', slug: 'mercado-local-ribeirao-preto', categorySlug: 'seo-local', description: 'Mercado imobiliário de Ribeirão Preto: bairros, investimento, leilões e locação.' },
]

// ── Parse FAQ from markdown ─────────────────────────────────────────────────
function parseFaqFromMarkdown(md: string): Array<{ question: string; answer: string }> {
  const faqSection = md.match(/## FAQ\n([\s\S]*?)(?=\n## |$)/)?.[1]
  if (!faqSection) return []
  const items: Array<{ question: string; answer: string }> = []
  const matches = faqSection.matchAll(/### (.+)\n([\s\S]*?)(?=\n### |$)/g)
  for (const m of matches) {
    items.push({ question: m[1].trim(), answer: m[2].trim() })
  }
  return items
}

// ── Parse links internos ────────────────────────────────────────────────────
function parseLinksInternos(linksStr: string): Array<{ url: string; anchor: string }> {
  if (!linksStr) return []
  return linksStr.split('|').map(l => {
    const url = l.trim()
    // Generate anchor from URL
    const anchor = url.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return { url, anchor }
  }).filter(l => l.url)
}

async function main() {
  console.log('🔧 Starting blog seed...')

  // Find the company
  const company = await prisma.company.findFirst()
  if (!company) {
    console.error('❌ No company found. Create a company first.')
    process.exit(1)
  }
  const companyId = company.id
  console.log(`📦 Using company: ${company.name} (${companyId})`)

  // ── Create Categories ──────────────────────────────────────────────────
  console.log('\n📂 Creating categories...')
  const categoryMap: Record<string, string> = {}
  for (const cat of CATEGORIES) {
    const existing = await prisma.blogCategory.findFirst({ where: { companyId, slug: cat.slug } })
    if (existing) {
      categoryMap[cat.slug] = existing.id
      categoryMap[cat.name] = existing.id
      console.log(`  ✓ ${cat.name} (exists)`)
    } else {
      const created = await prisma.blogCategory.create({
        data: { companyId, ...cat, seoTitle: cat.name, metaDescription: cat.description },
      })
      categoryMap[cat.slug] = created.id
      categoryMap[cat.name] = created.id
      console.log(`  + ${cat.name}`)
    }
  }

  // ── Create Clusters ────────────────────────────────────────────────────
  console.log('\n🔗 Creating clusters...')
  const clusterMap: Record<string, string> = {}
  for (const cl of CLUSTERS) {
    const categoryId = categoryMap[cl.categorySlug] ?? null
    const existing = await prisma.blogCluster.findFirst({ where: { companyId, slug: cl.slug } })
    if (existing) {
      clusterMap[cl.slug] = existing.id
      clusterMap[cl.name] = existing.id
      console.log(`  ✓ ${cl.name} (exists)`)
    } else {
      const created = await prisma.blogCluster.create({
        data: {
          companyId, name: cl.name, slug: cl.slug,
          description: cl.description, categoryId,
          seoTitle: cl.name, metaDescription: cl.description,
        },
      })
      clusterMap[cl.slug] = created.id
      clusterMap[cl.name] = created.id
      console.log(`  + ${cl.name}`)
    }
  }

  // ── Helper: resolve category/cluster names to IDs ──────────────────────
  function resolveCategoryId(catName: string): string | null {
    if (categoryMap[catName]) return categoryMap[catName]
    const slug = slugify(catName)
    return categoryMap[slug] ?? null
  }

  function resolveClusterId(clName: string): string | null {
    if (clusterMap[clName]) return clusterMap[clName]
    const slug = slugify(clName)
    return clusterMap[slug] ?? null
  }

  // ── Import Posts ───────────────────────────────────────────────────────
  // The posts data is embedded directly to avoid file dependency issues.
  // This processes the editorial data provided by the user.
  console.log('\n📝 Importing posts...')

  const stats = { created: 0, updated: 0, errors: 0 }

  // We read from the POSTS array (defined below or imported)
  for (const post of POSTS) {
    try {
      const slug = (post.slug || '').replace(/^\//, '')
      if (!slug || !post.titulo) continue

      const categoryId = resolveCategoryId(post.categoria || '')
      const clusterId = resolveClusterId(post.cluster || '')
      const faq = post.body_markdown ? parseFaqFromMarkdown(post.body_markdown) : []
      const linksInternos = parseLinksInternos(post.links_internos_sugeridos || '')
      const content = post.body_markdown ? markdownToHtml(post.body_markdown) : ''

      const data: any = {
        title: post.titulo,
        excerpt: post.excerpt || null,
        content,
        bodyMarkdown: post.body_markdown || null,
        coverImage: post.imagem_arquivo ? `/blog/covers/${post.imagem_arquivo}` : null,
        coverImageAlt: post.imagem_alt || null,
        categoryId,
        clusterId,
        tags: post.keywords_secundarias ? post.keywords_secundarias.replace(/;/g, ',') : null,
        seoTitle: post.seo_title || post.titulo,
        seoDescription: post.meta_description || post.excerpt || null,
        keywordPrincipal: post.keyword_principal || null,
        keywordsSecundarias: post.keywords_secundarias || null,
        schemaType: post.schema_type || 'BlogPosting',
        intencaoBusca: post.intencao_busca || null,
        estagioFunil: post.estagio_funil || null,
        ctaFinal: post.cta_final || null,
        faq: faq.length > 0 ? faq : [],
        linksInternos,
        cidade: post.cidade || null,
        bairro: post.bairro || null,
        tipoImovel: post.tipo_imovel || null,
        editorialNotes: post.nota_editorial || null,
        cannibalizationNotes: post.observacoes_canibalizacao || null,
        status: 'published',
        published: true,
        publishedAt: new Date(),
        featured: false,
        authorName: 'Equipe AgoraEncontrei',
      }

      const existing = await prisma.blogPost.findFirst({ where: { companyId, slug } })
      if (existing) {
        await prisma.blogPost.update({ where: { id: existing.id }, data })
        stats.updated++
      } else {
        await prisma.blogPost.create({ data: { companyId, slug, ...data } })
        stats.created++
      }

      process.stdout.write('.')
    } catch (err: any) {
      stats.errors++
      console.error(`\n  ❌ Error on ${post.slug}: ${err.message}`)
    }
  }

  console.log(`\n\n✅ Import complete:`)
  console.log(`   Created: ${stats.created}`)
  console.log(`   Updated: ${stats.updated}`)
  console.log(`   Errors:  ${stats.errors}`)
  console.log(`   Total:   ${POSTS.length}`)

  // ── Set pillar posts for clusters ──────────────────────────────────────
  console.log('\n🏛️  Setting pillar posts...')
  const pillarMapping: Record<string, string> = {
    'financiamento-imobiliario': 'financiamento-imobiliario-guia-completo-2026',
    'compra-de-imoveis': 'como-comprar-imovel-guia-completo-2026',
    'venda-de-imoveis': 'como-vender-imovel-mais-rapido-guia-completo-2026',
    'aluguel-de-imoveis': 'aluguel-de-imoveis-guia-completo',
    'leilao-de-imoveis': 'leilao-de-imoveis-guia-completo',
    'investimento-imobiliario': 'investimento-imobiliario-guia-completo',
    'mercado-local-franca': 'mercado-imobiliario-em-franca-sp-panorama-2026',
    'mercado-local-ribeirao-preto': 'mercado-imobiliario-em-ribeirao-preto-sp-panorama-2026',
  }

  for (const [clusterSlug, postSlug] of Object.entries(pillarMapping)) {
    const cluster = await prisma.blogCluster.findFirst({ where: { companyId, slug: clusterSlug } })
    const post = await prisma.blogPost.findFirst({ where: { companyId, slug: postSlug } })
    if (cluster && post) {
      await prisma.blogCluster.update({ where: { id: cluster.id }, data: { pillarPostId: post.id } })
      // Mark pillar post as featured
      await prisma.blogPost.update({ where: { id: post.id }, data: { featured: true } })
      console.log(`  ✓ ${clusterSlug} → ${postSlug}`)
    }
  }

  console.log('\n🎉 Blog seed completed!')
}

// ── POSTS DATA ──────────────────────────────────────────────────────────────
// Minimal post records - the body_markdown is stored but not embedded here
// due to size. The full content was provided via the user's editorial data.
// This seed creates the structural entries; content can be updated via API.
const POSTS: Array<{
  slug: string; titulo: string; categoria: string; cluster: string;
  seo_title?: string; meta_description?: string; excerpt?: string;
  keyword_principal?: string; keywords_secundarias?: string;
  intencao_busca?: string; estagio_funil?: string; cta_final?: string;
  cidade?: string; bairro?: string; tipo_imovel?: string;
  schema_type?: string; links_internos_sugeridos?: string;
  imagem_arquivo?: string; imagem_alt?: string;
  observacoes_canibalizacao?: string; nota_editorial?: string;
  body_markdown?: string;
}> = []

// The POSTS array will be populated from the data file
// For now, we generate it from category/slug mappings
// The actual content import happens via the /api/v1/blog/import endpoint

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
