/**
 * Transformações puras do SEO programático (sem dependência de Prisma/DB).
 * Isolado para permitir testes de unidade/smoke sem gerar o client Prisma.
 */

export interface SeoRecord {
  extId: string
  slug: string
  tema: string
  categoria: string
  cidade: string
  uf: string
  bairro: string
  titulo: string
  keywords: string
  metaDesc: string
  conteudo: string
}

// Categorias que os posts referenciam. As duas últimas não existem no
// seed-blog padrão e são criadas na ingestão.
export const CATEGORIES = [
  { slug: 'financiamento-imobiliario', name: 'Financiamento Imobiliário', description: 'Guias e orientações sobre financiamento de imóveis.' },
  { slug: 'compra-de-imoveis', name: 'Compra de Imóveis', description: 'Processo de compra: documentação, avaliação, negociação.' },
  { slug: 'venda-de-imoveis', name: 'Venda de Imóveis', description: 'Como vender imóvel com estratégia.' },
  { slug: 'aluguel-de-imoveis', name: 'Aluguel de Imóveis', description: 'Locação residencial e comercial: contrato, garantias, vistoria.' },
  { slug: 'leilao-de-imoveis', name: 'Leilão de Imóveis', description: 'Como comprar imóveis em leilão com segurança.' },
  { slug: 'investimento-imobiliario', name: 'Investimento Imobiliário', description: 'ROI, yield, avaliação patrimonial e alto padrão.' },
  { slug: 'seo-local', name: 'Mercado Local', description: 'Mercado imobiliário local: bairros, planejamento e infraestrutura.' },
  { slug: 'reformas-e-arquitetura', name: 'Reformas e Arquitetura', description: 'Tendências de reforma, arquitetura, sustentabilidade e retrofit.' },
  { slug: 'regularizacao-e-documentacao', name: 'Regularização e Documentação', description: 'Regularização, tributação (ITBI/IPTU), vistorias e segurança jurídica.' },
]

export const SOURCE_TAG = 'seo-programmatic'

export function slugify(text: string, maxlen = 100): string {
  return String(text)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, maxlen).replace(/^-|-$/g, '')
}

/** Texto corrido -> HTML com parágrafos legíveis (sem inventar conteúdo). */
export function textToHtml(text: string): string {
  const clean = String(text).replace(/\r/g, '').trim()
  if (!clean) return ''
  // Quebra em sentenças e agrupa ~2 por parágrafo para dar respiro visual.
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [clean]
  const paras: string[] = []
  for (let i = 0; i < sentences.length; i += 2) {
    paras.push(sentences.slice(i, i + 2).join('').trim())
  }
  return paras.filter(Boolean).map((p) => `<p>${p}</p>`).join('\n')
}

export function excerptFrom(rec: SeoRecord): string {
  const base = rec.metaDesc || rec.conteudo
  const s = String(base).trim()
  return s.length > 220 ? s.slice(0, 217).trimEnd() + '…' : s
}

/** Monta o objeto de dados de um BlogPost a partir de um registro SEO. */
export function buildPostData(
  rec: SeoRecord,
  companyId: string,
  categoryMap: Record<string, string>,
) {
  const keywords = rec.keywords || ''
  const keywordPrincipal = keywords.split(/[,;]/)[0]?.trim() || null
  return {
    companyId,
    title: rec.titulo,
    slug: rec.slug,
    excerpt: excerptFrom(rec),
    content: textToHtml(rec.conteudo),
    bodyMarkdown: rec.conteudo,
    categoryId: categoryMap[rec.categoria] ?? categoryMap['seo-local'] ?? null,
    tags: keywords ? keywords.replace(/;/g, ',') : null,
    seoTitle: rec.titulo,
    seoDescription: rec.metaDesc || null,
    seoKeywords: keywords || null,
    keywordPrincipal,
    schemaType: 'BlogPosting',
    cidade: rec.cidade || 'Franca',
    bairro: rec.bairro || null,
    tipoImovel: 'geral',
    // rastreabilidade p/ publicação em ondas e rollback
    source: SOURCE_TAG,
    sourceUrl: rec.extId ? `seo:${rec.extId}` : null,
    isAutoImported: true,
    editorialNotes: `[SEO programático] tema=${rec.tema} · id=${rec.extId}`,
    // SEGURANÇA: entra como rascunho, fora do índice.
    status: 'draft',
    published: false,
    noindex: true,
    featured: false,
    authorName: 'Equipe AgoraEncontrei',
  }
}
