import { PrismaClient } from '@prisma/client'

/**
 * IA Newsroom — Gerador automático de posts de blog
 *
 * Quando um leilão "joia" (ROI > 50%) entra no sistema, cria automaticamente
 * um blog post otimizado para SEO da cidade do imóvel.
 *
 * Roda como parte do scheduler, após cada ciclo de scraping.
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function generateBlogContent(auction: any): { title: string; slug: string; content: string; excerpt: string; tags: string[] } {
  const city = auction.city || 'Franca'
  const state = auction.state || 'SP'
  const discount = auction.discountPercent ? `${auction.discountPercent}%` : 'significativo'
  const bid = auction.minimumBid ? formatCurrency(Number(auction.minimumBid)) : 'consulte'
  const appraisal = auction.appraisalValue ? formatCurrency(Number(auction.appraisalValue)) : ''
  const type = auction.propertyType === 'HOUSE' ? 'Casa' : auction.propertyType === 'APARTMENT' ? 'Apartamento' : auction.propertyType === 'LAND' ? 'Terreno' : 'Imóvel'
  const source = auction.source === 'CAIXA' ? 'Caixa Econômica Federal' : auction.source === 'JUDICIAL' ? 'Leilão Judicial' : auction.auctioneerName || auction.source
  const neighborhood = auction.neighborhood || ''
  const dateStr = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const title = `Oportunidade: ${type} em ${city}/${state} com ${discount} de Desconto — Leilão ${dateStr}`
  const slug = slugify(`leilao-${type.toLowerCase()}-${city}-${state}-${discount}-desconto-${Date.now().toString(36)}`)

  const content = `## ${type} em Leilão com Desconto de ${discount} em ${city}/${state}

Uma oportunidade excepcional acaba de ser identificada pelo robô de monitoramento do **AgoraEncontrei**: ${auction.title.toLowerCase().includes('leilão') ? auction.title : `um ${type.toLowerCase()} em leilão`} em **${neighborhood ? `${neighborhood}, ` : ''}${city}/${state}**.

### Dados do Leilão

| Informação | Valor |
|---|---|
| **Tipo** | ${type} |
| **Localização** | ${neighborhood ? `${neighborhood}, ` : ''}${city}/${state} |
${appraisal ? `| **Avaliação** | ${appraisal} |\n` : ''}| **Lance Mínimo** | ${bid} |
| **Desconto** | ${discount} |
| **Fonte** | ${source} |
| **Score de Oportunidade** | ${auction.opportunityScore || '—'}/100 |

### Por que esta é uma Oportunidade?

${Number(auction.discountPercent) > 40 ? `Com um desconto de **${discount}** sobre o valor de avaliação, este imóvel representa uma das melhores oportunidades do mercado imobiliário de ${city} neste momento.` : `O desconto de ${discount} torna este imóvel atrativo para investidores que buscam retorno acima da média.`}

${auction.financingAvailable ? '**Aceita financiamento bancário**, o que facilita a aquisição para quem não quer comprometer todo o capital.' : ''}
${auction.fgtsAllowed ? '**Permite uso do FGTS**, ampliando as opções de pagamento.' : ''}
${auction.occupation === 'DESOCUPADO' ? '**O imóvel está desocupado**, eliminando riscos de processos de desocupação e custos adicionais.' : ''}

### Custos Estimados

Para quem está avaliando a viabilidade financeira, estimamos os seguintes custos adicionais:

- **ITBI**: ~3% do valor de arrematação
- **Registro e escritura**: ~1,5%
- **Honorários advocatícios**: ~5%
${auction.occupation === 'OCUPADO' ? '- **Custos de desocupação**: variável (consultar advogado)\n' : ''}

### Assessoria Especializada

O **AgoraEncontrei** recomenda fortemente que qualquer arrematação seja acompanhada por um advogado especializado em leilões imobiliários. Verifique ônus, dívidas de IPTU/condomínio e processos judiciais antes de dar seu lance.

[Ver detalhes completos deste leilão →](/leiloes/${auction.slug})

[Falar com especialista via WhatsApp →](https://wa.me/5516981010004?text=Olá!%20Vi%20a%20oportunidade%20de%20leilão%20em%20${encodeURIComponent(city)}%20no%20AgoraEncontrei.)

---

*Este post foi gerado automaticamente pelo sistema de monitoramento do AgoraEncontrei, que varre diariamente 800+ leiloeiros e bancos em busca das melhores oportunidades do mercado imobiliário brasileiro.*

*Dados atualizados em ${new Date().toLocaleDateString('pt-BR')}. Valores e disponibilidade sujeitos a alteração sem aviso prévio.*`

  const excerpt = `${type} em ${city}/${state} disponível em leilão com desconto de ${discount} sobre avaliação. Lance mínimo: ${bid}. ${auction.occupation === 'DESOCUPADO' ? 'Imóvel desocupado.' : ''} Confira a análise completa.`

  const tags = [
    `leilão ${city.toLowerCase()}`,
    `${type.toLowerCase()} leilão ${state.toLowerCase()}`,
    `investimento imobiliário ${city.toLowerCase()}`,
    `desconto imóvel ${city.toLowerCase()}`,
    source.toLowerCase(),
  ]

  return { title, slug, content, excerpt, tags }
}

export class AiNewsroomService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Verifica leilões "joia" (ROI > 50%) e cria posts de blog
   */
  async generatePosts(): Promise<{ created: number; skipped: number }> {
    // Buscar leilões com alto ROI que ainda não têm blog post
    const jewels = await this.prisma.auction.findMany({
      where: {
        status: { in: ['UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND'] },
        discountPercent: { gte: 40 },
        minimumBid: { not: null },
        // Excluir leilões que já geraram posts (marcados via tag)
        NOT: { tags: { has: 'blog_generated' } },
      },
      orderBy: { discountPercent: 'desc' },
      take: 5, // Máximo 5 posts por ciclo
    })

    let created = 0
    let skipped = 0

    for (const auction of jewels) {
      try {
        const { title, slug, content, excerpt, tags } = generateBlogContent(auction)

        // Verificar se já existe post com slug similar
        const existing = await this.prisma.blogPost.findFirst({
          where: { slug: { startsWith: slug.substring(0, 40) } },
        })

        if (existing) {
          skipped++
          continue
        }

        // Criar o blog post
        // Buscar o primeiro companyId existente no banco
        let companyId = process.env.PUBLIC_COMPANY_ID || ''
        if (!companyId) {
          const companies = await this.prisma.company.findMany({ select: { id: true }, take: 1 })
          companyId = companies[0]?.id || ''
        }
        if (!companyId) { console.warn('[AiNewsroom] Nenhuma empresa encontrada no banco'); return { created: 0, skipped: jewels.length } }
        await this.prisma.blogPost.create({
          data: {
            companyId,
            title,
            slug,
            content,
            excerpt,
            published: true,
            source: 'AI_NEWSROOM',
            publishedAt: new Date(),
            isAutoImported: true,
          },
        })

        // Marcar leilão como processado
        await this.prisma.auction.update({
          where: { id: auction.id },
          data: { tags: { push: 'blog_generated' } },
        })

        created++
        console.log(`[AiNewsroom] Post criado: ${title}`)
      } catch (err: any) {
        console.error(`[AiNewsroom] Erro ao criar post para ${auction.title}:`, err.message)
        skipped++
      }
    }

    if (created > 0) {
      console.log(`[AiNewsroom] ${created} posts criados, ${skipped} ignorados`)
    }

    return { created, skipped }
  }
}
