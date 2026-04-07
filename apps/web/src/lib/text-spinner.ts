/**
 * Motor de Spinning Programático para 1M+ de páginas
 * Gera variações únicas de texto baseadas em dados reais
 * Evita punição por conteúdo duplicado no Google
 */

const intros = [
  'Ao analisar as oportunidades em {cidade},',
  'Para quem busca investir ou morar em {cidade},',
  'Explorando o cenário imobiliário de {cidade},',
  'Com um mercado em constante evolução, {cidade}',
  'O mercado imobiliário de {cidade} em 2026',
  'Investidores atentos ao interior paulista encontram em {cidade}',
  'A região de {cidade} se consolida como',
]

const vantagens = [
  'se destaca pelo excelente custo-benefício.',
  'apresenta indicadores econômicos robustos para 2026.',
  'revela-se um polo estratégico de valorização no estado de {uf}.',
  'oferece um deságio atraente em leilões judiciais e da Caixa.',
  'combina qualidade de vida com oportunidades reais de investimento.',
  'tem atraído investidores pela combinação de preço acessível e infraestrutura completa.',
]

const infraTemplates = [
  'A região conta com infraestrutura completa, incluindo {poi},',
  'Moradores têm fácil acesso a serviços de destaque como {poi},',
  'A proximidade com {poi} garante alta liquidez para revenda ou locação,',
  'O bairro é atendido por equipamentos urbanos como {poi},',
]

const investTemplates = [
  'tornando os leilões uma oportunidade rara com ROI projetado de {roi}%.',
  'o que posiciona a região entre as mais promissoras para investimento.',
  'com potencial de valorização acima da média estadual nos próximos 24 meses.',
  'atraindo tanto compradores de primeiro imóvel quanto investidores experientes.',
]

const comparacaoTemplates = [
  'Ao comparar {cidadeA} e {cidadeB}, observamos que {cidadeA} apresenta um custo de vida {diff}% {dir} que {cidadeB}.',
  'Na análise comparativa entre {cidadeA} e {cidadeB}, o mercado imobiliário revela diferenças estratégicas.',
  '{cidadeA} e {cidadeB} competem por atenção de investidores, mas com perfis distintos de oportunidade.',
  'Comparando os indicadores IBGE de {cidadeA} com {cidadeB}, emergem padrões claros de investimento.',
]

/**
 * Gera um número pseudo-aleatório determinístico baseado em seed string
 * Garante que o mesmo slug sempre gera o mesmo texto (cache-friendly)
 */
function seedRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
    h = (h ^ (h >>> 16)) >>> 0
    return h / 4294967296
  }
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

export interface SpinContext {
  cidade: string
  uf: string
  bairro?: string
  poi?: string
  roi?: number
  m2?: number
  populacao?: number
  pib?: number
}

/**
 * Gera parágrafo único para página de cidade/bairro
 */
export function spinCityText(ctx: SpinContext): string {
  const seed = `${ctx.cidade}-${ctx.bairro || 'hub'}-${ctx.uf}`
  const rng = seedRandom(seed)

  let text = pick(intros, rng) + ' ' + pick(vantagens, rng) + ' '

  if (ctx.poi) {
    text += pick(infraTemplates, rng).replace('{poi}', ctx.poi) + ' '
  }

  if (ctx.roi) {
    text += pick(investTemplates, rng).replace('{roi}', ctx.roi.toFixed(0))
  }

  return text
    .replace(/\{cidade\}/g, ctx.cidade)
    .replace(/\{uf\}/g, ctx.uf)
    .replace(/\{bairro\}/g, ctx.bairro || ctx.cidade)
}

/**
 * Gera parágrafo único para página de comparação
 */
export function spinComparisonText(cidadeA: string, cidadeB: string, diffPercent: number): string {
  const seed = `${cidadeA}-vs-${cidadeB}`
  const rng = seedRandom(seed)

  const dir = diffPercent > 0 ? 'maior' : 'menor'
  return pick(comparacaoTemplates, rng)
    .replace(/\{cidadeA\}/g, cidadeA)
    .replace(/\{cidadeB\}/g, cidadeB)
    .replace('{diff}', Math.abs(diffPercent).toFixed(1))
    .replace('{dir}', dir)
}

/**
 * Gera FAQs dinâmicas baseadas nos dados do bairro/cidade
 */
export function generateFAQs(ctx: SpinContext): { question: string; answer: string }[] {
  const faqs = []

  faqs.push({
    question: `Vale a pena investir em imóveis em ${ctx.bairro || ctx.cidade}?`,
    answer: `Sim. ${ctx.bairro || ctx.cidade} em ${ctx.cidade}/${ctx.uf} apresenta ${ctx.roi ? `um ROI estimado de ${ctx.roi.toFixed(0)}% em leilões` : 'oportunidades reais de valorização'}. ${ctx.populacao ? `Com ${ctx.populacao.toLocaleString('pt-BR')} habitantes, ` : ''}a cidade oferece liquidez e infraestrutura para investimento seguro.`,
  })

  if (ctx.m2) {
    faqs.push({
      question: `Qual o valor do metro quadrado em ${ctx.bairro || ctx.cidade}?`,
      answer: `O valor médio do m² em ${ctx.bairro || ctx.cidade} (${ctx.cidade}/${ctx.uf}) é estimado em R$ ${ctx.m2.toLocaleString('pt-BR')}. Em leilões judiciais, é possível encontrar imóveis com até 50% de deságio sobre esse valor.`,
    })
  }

  if (ctx.poi) {
    faqs.push({
      question: `Quais as comodidades próximas em ${ctx.bairro || ctx.cidade}?`,
      answer: `A região de ${ctx.bairro || ctx.cidade} conta com infraestrutura completa, incluindo proximidade com ${ctx.poi}. Isso garante alta liquidez tanto para revenda quanto para locação.`,
    })
  }

  faqs.push({
    question: `Como comprar imóvel em leilão em ${ctx.cidade}/${ctx.uf}?`,
    answer: `No AgoraEncontrei você encontra leilões da Caixa, judiciais e extrajudiciais em ${ctx.cidade}. Nossa Calculadora de ROI analisa custos reais (ITBI, comissão, reforma) para que você invista com segurança. Baixe o Manual do Investidor gratuitamente.`,
  })

  return faqs
}
